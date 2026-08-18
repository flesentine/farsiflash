#!/usr/bin/env python3
import hashlib
import json
import os
import time
from pathlib import Path

import requests

ROOT = Path(__file__).resolve().parents[1]
AUDIO_DIR = ROOT / "audio" / "natural"
MANIFEST = ROOT / "data" / "audio-manifest.js"
VOICE_META = ROOT / "data" / "elevenlabs-voice.json"
API = "https://api.elevenlabs.io/v1"
API_KEY = os.environ.get("ELEVENLABS_API_KEY", "").strip()

# Small audition set only. Do not generate the full deck until this voice is approved.
WORDS = [
    "سلام", "خداحافظ", "بله", "آره", "نَه", "لطفا", "ممنون", "مرسی",
    "ببخشید", "خوب", "بد", "باشه", "من", "تو", "شما", "او", "ما", "آنها",
    "این", "آن", "چه", "کی", "کجا", "چرا", "چطور", "چند", "کدام", "اینجا",
    "آنجا", "الان",
]

VOICE_DESCRIPTION = (
    "A native Iranian Persian woman in her late 20s to early 30s with a warm, relaxed, "
    "everyday Tehran accent. She sounds like a friendly language teacher speaking naturally "
    "to one student: conversational, human, clear but never over-enunciated, no announcer tone, "
    "no synthetic cadence, no exaggerated emotion. Studio-clean recording, medium pitch, gentle "
    "energy, natural Iranian Persian rhythm and vowels."
)

VOICE_PREVIEW_TEXT = (
    "سلام، خوبی؟ من فارسی رو خیلی طبیعی و آروم صحبت می‌کنم. ممنون، لطفاً، ببخشید، باشه. "
    "امروز اینجا هستیم تا چند کلمهٔ ساده و روزمره رو با تلفظ طبیعی تمرین کنیم. "
    "خداحافظ، فردا دوباره می‌بینمت."
)


def headers():
    return {"xi-api-key": API_KEY, "Content-Type": "application/json"}


def checked(resp, label):
    if resp.ok:
        return resp
    detail = resp.text[:1200]
    raise RuntimeError(f"{label} failed: HTTP {resp.status_code}: {detail}")


def load_voice_id():
    explicit = os.environ.get("ELEVENLABS_VOICE_ID", "").strip()
    if explicit:
        return explicit, {"voice_id": explicit, "source": "ELEVENLABS_VOICE_ID"}
    if VOICE_META.exists():
        try:
            meta = json.loads(VOICE_META.read_text(encoding="utf-8"))
            if meta.get("voice_id"):
                return meta["voice_id"], meta
        except Exception:
            pass
    return None, None


def design_voice():
    payload = {
        "voice_description": VOICE_DESCRIPTION,
        "model_id": "eleven_ttv_v3",
        "text": VOICE_PREVIEW_TEXT,
        "guidance_scale": 3.2,
        "quality": 0.85,
        "seed": 1978,
    }
    r = checked(requests.post(f"{API}/text-to-voice/design", headers=headers(), json=payload, timeout=120), "voice design")
    data = r.json()
    previews = data.get("previews") or []
    if not previews:
        raise RuntimeError("ElevenLabs returned no voice previews")

    # Keep the first candidate deterministic for this audition. If it is not good enough,
    # change the seed/prompt and audition again before generating the full 2,000.
    chosen = previews[0]
    generated_id = chosen["generated_voice_id"]
    create_payload = {
        "voice_name": "Farsi 2000 - Iranian teacher audition",
        "voice_description": VOICE_DESCRIPTION,
        "generated_voice_id": generated_id,
        "labels": {"language": "fa", "accent": "Iranian", "use_case": "education"},
    }
    r = checked(requests.post(f"{API}/text-to-voice", headers=headers(), json=create_payload, timeout=120), "voice creation")
    made = r.json()
    voice_id = made["voice_id"]
    meta = {
        "voice_id": voice_id,
        "name": made.get("name") or create_payload["voice_name"],
        "source": "eleven_ttv_v3 voice design",
        "model": "eleven_v3",
        "language_code": "fa",
        "description": VOICE_DESCRIPTION,
        "audition_words": len(WORDS),
    }
    VOICE_META.write_text(json.dumps(meta, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    return voice_id, meta


def filename_for(word):
    return hashlib.sha1(word.encode("utf-8")).hexdigest()[:16] + ".mp3"


def synthesize(voice_id, word, dest):
    payload = {
        "text": word + ".",
        "model_id": "eleven_v3",
        "language_code": "fa",
        "voice_settings": {
            "stability": 0.48,
            "similarity_boost": 0.82,
            "style": 0.08,
            "use_speaker_boost": True,
            "speed": 0.92,
        },
    }
    r = checked(
        requests.post(
            f"{API}/text-to-speech/{voice_id}",
            params={"output_format": "mp3_44100_128"},
            headers=headers(), json=payload, timeout=120,
        ),
        f"TTS for {word}",
    )
    if len(r.content) < 1000:
        raise RuntimeError(f"TTS for {word} returned suspiciously small audio ({len(r.content)} bytes)")
    dest.write_bytes(r.content)


def main():
    if not API_KEY:
        raise SystemExit("ELEVENLABS_API_KEY is missing")

    AUDIO_DIR.mkdir(parents=True, exist_ok=True)
    voice_id, meta = load_voice_id()
    if not voice_id:
        voice_id, meta = design_voice()

    manifest = {}
    wanted = set()
    for idx, word in enumerate(WORDS, 1):
        name = filename_for(word)
        wanted.add(name)
        dest = AUDIO_DIR / name
        if not dest.exists() or dest.stat().st_size < 1000:
            print(f"[{idx:02d}/{len(WORDS)}] {word}")
            synthesize(voice_id, word, dest)
            time.sleep(0.35)
        manifest[word] = f"audio/natural/{name}"

    for p in AUDIO_DIR.glob("*.mp3"):
        if p.name not in wanted:
            p.unlink()

    # The app already reads window.FARSI_AUDIO before initializing its speaker logic.
    # Keeping this file data-only also removes the old robotic test-audio override.
    MANIFEST.write_text(
        "window.FARSI_AUDIO=" + json.dumps(manifest, ensure_ascii=False, separators=(",", ":")) + ";\n",
        encoding="utf-8",
    )

    if not VOICE_META.exists():
        VOICE_META.write_text(json.dumps(meta or {"voice_id": voice_id}, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")

    total = sum((AUDIO_DIR / n).stat().st_size for n in wanted)
    print(f"Built {len(manifest)} natural Persian audition clips ({total/1024/1024:.2f} MiB)")
    print(f"Voice: {voice_id}")


if __name__ == "__main__":
    main()
