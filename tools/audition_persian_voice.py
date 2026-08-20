#!/usr/bin/env python3
import hashlib
import html
import json
import math
import os
import shutil
import time
from pathlib import Path

import requests

ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / "audio" / "voice-test"
META = ROOT / "data" / "persian-voice-candidates.json"
PAGE = ROOT / "voice-test.html"
API = "https://api.elevenlabs.io/v1"
API_KEY = os.environ.get("ELEVENLABS_API_KEY", "").strip()

# Short isolated words are intentionally included because they are where a
# non-native voice is most likely to expose the wrong accent/pronunciation.
TEST_WORDS = [
    ("دو", "two — should sound like Persian do / 'DOE', not English 'do'"),
    ("تو", "you (informal)"),
    ("او", "he / she"),
    ("نَه", "no / not"),
    ("روز", "day"),
    ("خوب", "good / well"),
    ("خداحافظ", "goodbye"),
    ("موسیقی", "music"),
]


def headers(json_content=True):
    h = {"xi-api-key": API_KEY}
    if json_content:
        h["Content-Type"] = "application/json"
    return h


def checked(resp, label):
    if resp.ok:
        return resp
    raise RuntimeError(f"{label} failed: HTTP {resp.status_code}: {resp.text[:1200]}")


def list_shared_voices():
    voices = []
    for page in range(5):
        r = checked(
            requests.get(
                f"{API}/shared-voices",
                headers=headers(False),
                params={
                    "page_size": 100,
                    "page": page,
                    "language": "fa",
                    "category": "professional",
                    "sort": "usage_character_count_1y",
                },
                timeout=60,
            ),
            "list native Persian shared voices",
        )
        data = r.json() or {}
        voices.extend(data.get("voices") or [])
        if not data.get("has_more"):
            break

    # Some older Voice Library entries expose Persian only inside
    # verified_languages. If the direct language filter returns too little,
    # broaden once and keep only genuinely Persian-verified voices ourselves.
    if len(voices) < 3:
        r = checked(
            requests.get(
                f"{API}/shared-voices",
                headers=headers(False),
                params={
                    "page_size": 100,
                    "page": 0,
                    "category": "professional",
                    "search": "Persian",
                    "sort": "usage_character_count_1y",
                },
                timeout=60,
            ),
            "search Persian shared voices",
        )
        voices.extend((r.json() or {}).get("voices") or [])

    unique = {}
    for voice in voices:
        vid = voice.get("voice_id")
        if vid:
            unique[vid] = voice
    return list(unique.values())


def verified_farsi(voice):
    if str(voice.get("language") or "").lower() == "fa":
        return True
    for item in voice.get("verified_languages") or []:
        if str(item.get("language") or "").lower() == "fa":
            return True
        locale = str(item.get("locale") or "").lower()
        if locale.startswith("fa-"):
            return True
    return False


def score(voice):
    if not verified_farsi(voice):
        return -10000
    accent = str(voice.get("accent") or "").lower()
    description = str(voice.get("description") or "").lower()
    name = str(voice.get("name") or "").lower()
    blob = " ".join([accent, description, name])
    s = 1000
    if str(voice.get("language") or "").lower() == "fa":
        s += 300
    if any(x in blob for x in ["iran", "iranian", "tehran", "persian"]):
        s += 250
    if voice.get("free_users_allowed"):
        s += 80
    if str(voice.get("category") or "").lower() == "professional":
        s += 80
    usage = int(voice.get("usage_character_count_1y") or 0)
    clones = int(voice.get("cloned_by_count") or 0)
    s += min(160, int(math.log10(max(1, usage)) * 30))
    s += min(80, int(math.log10(max(1, clones)) * 20))
    return s


def add_shared_voice(voice, index):
    owner = voice.get("public_owner_id")
    vid = voice.get("voice_id")
    if not owner or not vid:
        raise RuntimeError("Voice Library result missing owner or voice ID")
    new_name = f"Farsi2000 Native Test {index} - {voice.get('name') or vid}"
    r = requests.post(
        f"{API}/voices/add/{owner}/{vid}",
        headers=headers(),
        json={"new_name": new_name, "bookmarked": True},
        timeout=60,
    )
    if r.ok:
        return (r.json() or {}).get("voice_id") or vid

    # A previously-added library voice can return a conflict. The original
    # library voice ID remains usable in the account in that case, so keep it.
    if r.status_code in {400, 409, 422} and any(
        term in r.text.lower() for term in ["already", "exist", "added", "duplicate"]
    ):
        return vid
    raise RuntimeError(f"add shared voice {voice.get('name')} failed: HTTP {r.status_code}: {r.text[:1000]}")


def synthesize(voice_id, text, dest):
    payload = {
        "text": text,
        "model_id": "eleven_v3",
        "language_code": "fa",
        "voice_settings": {
            "stability": 0.55,
            "similarity_boost": 0.82,
            "style": 0.0,
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
        f"TTS audition for {text}",
    )
    if len(r.content) < 1000:
        raise RuntimeError(f"TTS audition for {text} returned only {len(r.content)} bytes")
    dest.write_bytes(r.content)


def slug_for(voice_id):
    return hashlib.sha1(voice_id.encode("utf-8")).hexdigest()[:10]


def write_page(candidates):
    cards = []
    for idx, c in enumerate(candidates, 1):
        samples = []
        for s in c["samples"]:
            samples.append(
                f'''<div class="sample"><div><b dir="rtl">{html.escape(s["word"])}</b><small>{html.escape(s["meaning"])}</small></div><audio controls preload="none" src="{html.escape(s["src"])}"></audio></div>'''
            )
        cards.append(
            f'''<section><h2>Candidate {idx}: {html.escape(c["name"])}</h2><p>{html.escape(c["accent"] or "accent not labeled")} · native Persian verified · {html.escape(c["category"] or "voice library")}</p>{''.join(samples)}</section>'''
        )
    PAGE.write_text(
        '''<!doctype html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Farsi 2000 — Native voice test</title><style>body{font-family:-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif;max-width:900px;margin:0 auto;padding:24px;background:#f4f1ea;color:#222}h1{margin-bottom:6px}.note{color:#665f56;margin-bottom:28px}section{background:white;border:1px solid #ddd6cb;border-radius:18px;padding:20px;margin:18px 0}.sample{display:grid;grid-template-columns:minmax(180px,1fr) minmax(220px,1fr);gap:16px;align-items:center;border-top:1px solid #eee7dc;padding:13px 0}.sample b{font-family:Tahoma,"Geeza Pro",sans-serif;font-size:28px}.sample small{display:block;color:#766f66;margin-top:4px}audio{width:100%}@media(max-width:600px){.sample{grid-template-columns:1fr}body{padding:14px}}</style></head><body><h1>Native Persian voice audition</h1><p class="note">The old American-English voice is quarantined. Listen especially to <b dir="rtl">دو</b>. Pick the voice that sounds like a native Iranian Persian speaker, not an English speaker reading Persian.</p>'''
        + "".join(cards)
        + "</body></html>",
        encoding="utf-8",
    )


def main():
    if not API_KEY:
        raise SystemExit("ELEVENLABS_API_KEY is missing")

    voices = [v for v in list_shared_voices() if verified_farsi(v)]
    if not voices:
        raise SystemExit("No professionally cloned Persian (fa) voices were returned by the ElevenLabs Voice Library")

    ranked = sorted(voices, key=score, reverse=True)
    # Prefer voices explicitly available to free users when possible.
    free_ranked = [v for v in ranked if v.get("free_users_allowed")]
    selected = (free_ranked or ranked)[:3]

    if OUT.exists():
        shutil.rmtree(OUT)
    OUT.mkdir(parents=True, exist_ok=True)

    results = []
    for idx, voice in enumerate(selected, 1):
        account_voice_id = add_shared_voice(voice, idx)
        folder = OUT / f"candidate-{idx}-{slug_for(voice['voice_id'])}"
        folder.mkdir(parents=True, exist_ok=True)
        samples = []
        print(f"Candidate {idx}: {voice.get('name')} / {voice.get('accent')} / {voice.get('voice_id')}")
        for word, meaning in TEST_WORDS:
            dest = folder / (hashlib.sha1(word.encode("utf-8")).hexdigest()[:12] + ".mp3")
            print(f"  generate {word}")
            synthesize(account_voice_id, word, dest)
            samples.append({
                "word": word,
                "meaning": meaning,
                "src": str(dest.relative_to(ROOT)).replace("\\", "/"),
            })
            time.sleep(0.25)

        results.append({
            "name": voice.get("name") or voice["voice_id"],
            "voice_id": voice["voice_id"],
            "account_voice_id": account_voice_id,
            "public_owner_id": voice.get("public_owner_id"),
            "language": voice.get("language"),
            "accent": voice.get("accent"),
            "category": voice.get("category"),
            "description": voice.get("description"),
            "free_users_allowed": voice.get("free_users_allowed"),
            "verified_languages": voice.get("verified_languages") or [],
            "score": score(voice),
            "samples": samples,
        })

    META.write_text(json.dumps({"candidates": results}, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    write_page(results)
    print(f"Created {len(results)} native Persian candidate auditions at voice-test.html")


if __name__ == "__main__":
    main()
