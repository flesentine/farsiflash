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
API_V2 = "https://api.elevenlabs.io/v2"
API_KEY = os.environ.get("ELEVENLABS_API_KEY", "").strip()

# Small audition set only. Do not generate the full deck until this voice is approved.
WORDS = [
    "سلام", "خداحافظ", "بله", "آره", "نَه", "لطفا", "ممنون", "مرسی",
    "ببخشید", "خوب", "بد", "باشه", "من", "تو", "شما", "او", "ما", "آنها",
    "این", "آن", "چه", "کی", "کجا", "چرا", "چطور", "چند", "کدام", "اینجا",
    "آنجا", "الان",
]


def headers():
    return {"xi-api-key": API_KEY, "Content-Type": "application/json"}


def checked(resp, label):
    if resp.ok:
        return resp
    detail = resp.text[:1600]
    raise RuntimeError(f"{label} failed: HTTP {resp.status_code}: {detail}")


def voice_score(v):
    """Prefer a warm female premade voice for a language-learning audition."""
    name = str(v.get("name") or "").lower()
    labels = v.get("labels") or {}
    text = " ".join([
        name,
        str(v.get("description") or ""),
        str(labels.get("description") or ""),
        str(labels.get("descriptive") or ""),
        str(labels.get("use_case") or ""),
        str(labels.get("gender") or ""),
        str(labels.get("accent") or ""),
    ]).lower()

    score = 0
    # Current ElevenLabs replacements that fit a calm teacher voice particularly well.
    preferred_names = {
        "talia": 80,
        "jade": 65,
        "florence": 55,
        "janet": 45,
        "clara": 40,
        "rachel": 35,
        "matilda": 30,
    }
    for key, points in preferred_names.items():
        if key in name:
            score += points

    if "female" in text or "woman" in text:
        score += 35
    if "educat" in text or "teacher" in text:
        score += 35
    if "conversation" in text:
        score += 28
    if "warm" in text:
        score += 24
    if "natural" in text:
        score += 22
    if "soft" in text or "gentle" in text:
        score += 18
    if "calm" in text or "friendly" in text:
        score += 16
    if "narrat" in text or "story" in text:
        score += 5
    if "character" in text or "dramatic" in text:
        score -= 20
    if str(v.get("category") or "").lower() in {"premade", "default"}:
        score += 20
    return score


def list_account_voices():
    # Voice Library voices are not available through the API on the free tier, but the
    # voices already available to the account are. Prefer premade/default voices first.
    r = requests.get(
        f"{API_V2}/voices",
        headers=headers(),
        params={"page_size": 100, "category": "premade", "include_total_count": "false"},
        timeout=60,
    )
    if r.ok:
        voices = (r.json() or {}).get("voices") or []
        if voices:
            return voices

    # Some accounts expose the new default voices without the legacy category filter.
    r = checked(
        requests.get(
            f"{API_V2}/voices",
            headers=headers(),
            params={"page_size": 100, "include_total_count": "false"},
            timeout=60,
        ),
        "list account voices",
    )
    return (r.json() or {}).get("voices") or []


def choose_account_voice():
    voices = list_account_voices()
    if not voices:
        raise RuntimeError(
            "ElevenLabs returned no API-available voices for this account. "
            "Open ElevenLabs > Voices, choose a default voice, copy its Voice ID, "
            "and add it as the GitHub repository secret ELEVENLABS_VOICE_ID."
        )

    ranked = sorted(voices, key=voice_score, reverse=True)
    chosen = ranked[0]
    voice_id = chosen.get("voice_id") or chosen.get("voiceId")
    if not voice_id:
        raise RuntimeError("Selected ElevenLabs voice did not contain a voice_id")

    print("Available account voices (best candidates):")
    for v in ranked[:8]:
        print(f"  {voice_score(v):3d}  {v.get('name','(unnamed)')}  [{v.get('category','')}]")
    print(f"Selected voice: {chosen.get('name','(unnamed)')} ({voice_id})")

    meta = {
        "voice_id": voice_id,
        "name": chosen.get("name") or "ElevenLabs account voice",
        "source": "free account/default voice",
        "category": chosen.get("category"),
        "labels": chosen.get("labels") or {},
        "model": "eleven_v3",
        "language_code": "fa",
        "audition_words": len(WORDS),
    }
    VOICE_META.write_text(json.dumps(meta, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    return voice_id, meta


def load_voice_id():
    explicit = os.environ.get("ELEVENLABS_VOICE_ID", "").strip()
    if explicit:
        meta = {
            "voice_id": explicit,
            "source": "ELEVENLABS_VOICE_ID",
            "model": "eleven_v3",
            "language_code": "fa",
            "audition_words": len(WORDS),
        }
        VOICE_META.write_text(json.dumps(meta, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
        return explicit, meta

    # Reuse a previously selected free/default account voice so the audition is stable.
    if VOICE_META.exists():
        try:
            meta = json.loads(VOICE_META.read_text(encoding="utf-8"))
            if meta.get("voice_id") and meta.get("source") in {
                "free account/default voice", "ELEVENLABS_VOICE_ID"
            }:
                return meta["voice_id"], meta
        except Exception:
            pass

    return choose_account_voice()


def filename_for(word):
    return hashlib.sha1(word.encode("utf-8")).hexdigest()[:16] + ".mp3"


def synthesize(voice_id, word, dest):
    # language_code matters for short, ambiguous prompts such as single vocabulary words.
    payload = {
        "text": word,
        "model_id": "eleven_v3",
        "language_code": "fa",
        "voice_settings": {
            "stability": 0.45,
            "similarity_boost": 0.76,
            "style": 0.04,
            "use_speaker_boost": True,
            "speed": 0.90,
        },
    }
    r = checked(
        requests.post(
            f"{API}/text-to-speech/{voice_id}",
            params={"output_format": "mp3_44100_128"},
            headers=headers(),
            json=payload,
            timeout=120,
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

    manifest = {}
    wanted = set()
    for idx, word in enumerate(WORDS, 1):
        name = filename_for(word)
        wanted.add(name)
        dest = AUDIO_DIR / name
        if not dest.exists() or dest.stat().st_size < 1000:
            print(f"[{idx:02d}/{len(WORDS)}] {word}")
            synthesize(voice_id, word, dest)
            time.sleep(0.30)
        manifest[word] = f"audio/natural/{name}"

    for p in AUDIO_DIR.glob("*.mp3"):
        if p.name not in wanted:
            p.unlink()

    # The app already reads window.FARSI_AUDIO before initializing its speaker logic.
    # Keeping this file data-only removes the old robotic test-audio override.
    MANIFEST.write_text(
        "window.FARSI_AUDIO=" + json.dumps(manifest, ensure_ascii=False, separators=(",", ":")) + ";\n",
        encoding="utf-8",
    )

    if not VOICE_META.exists():
        VOICE_META.write_text(
            json.dumps(meta or {"voice_id": voice_id}, ensure_ascii=False, indent=2) + "\n",
            encoding="utf-8",
        )

    total = sum((AUDIO_DIR / n).stat().st_size for n in wanted)
    print(f"Built {len(manifest)} natural Persian audition clips ({total/1024/1024:.2f} MiB)")
    print(f"Voice: {voice_id}")


if __name__ == "__main__":
    main()
