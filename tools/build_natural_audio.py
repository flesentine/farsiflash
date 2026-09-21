#!/usr/bin/env python3
import hashlib
import json
import os
import re
import time
from pathlib import Path

import requests

ROOT = Path(__file__).resolve().parents[1]
AUDIO_DIR = ROOT / "audio" / "natural"
MANIFEST = ROOT / "data" / "audio-manifest.js"
VOICE_META = ROOT / "data" / "elevenlabs-voice.json"
PATH_FILE = ROOT / "data" / "path.js"
MILLER_GLOB = "miller-*.js"
V5_DECK_FILE = ROOT / "data" / "v5-deck.js"
API = "https://api.elevenlabs.io/v1"
API_V2 = "https://api.elevenlabs.io/v2"
API_KEY = os.environ.get("ELEVENLABS_API_KEY", "").strip()
START_INDEX = int(os.environ.get("START_INDEX", "0"))
COUNT = int(os.environ.get("COUNT", "250"))
TOTAL = 2000  # v5 card count; unique audio forms may be one fewer because surface forms can repeat


def headers():
    return {"xi-api-key": API_KEY, "Content-Type": "application/json"}


def checked(resp, label):
    if resp.ok:
        return resp
    detail = resp.text[:1600]
    raise RuntimeError(f"{label} failed: HTTP {resp.status_code}: {detail}")


def base_fa(s):
    s = str(s or "").replace("ي", "ی").replace("ك", "ک").replace("\u200c", "")
    return re.sub(r"[\u064B-\u0652\u0670]", "", s)


def load_curriculum_words():
    text = PATH_FILE.read_text(encoding="utf-8")
    quoted = r'"(?:\\.|[^"\\])*"'
    card_re = re.compile(rf"\[\s*({quoted})\s*,\s*({quoted})\s*,\s*({quoted})\s*\]")
    cards = []
    for match in card_re.finditer(text):
        fa, roman, english = json.loads("[" + ",".join(match.groups()) + "]")
        cards.append((fa, roman, english))
    if not cards:
        raise RuntimeError("Could not parse curriculum cards from data/path.js")
    return cards


def load_miller_rows():
    rows = []
    files = sorted((ROOT / "data").glob(MILLER_GLOB))
    if not files:
        raise RuntimeError("No data/miller-*.js files found")
    for path in files:
        text = path.read_text(encoding="utf-8")
        match = re.search(r"\.push\((.*)\);\s*$", text, re.S)
        if not match:
            raise RuntimeError(f"Could not parse {path.name}")
        chunk = json.loads(match.group(1))
        rows.extend(chunk)
    return rows


def load_v5_cards():
    if not V5_DECK_FILE.exists():
        raise RuntimeError("data/v5-deck.js is missing")
    text = V5_DECK_FILE.read_text(encoding="utf-8")
    prefix = "window.FARSI_V5_DECK="
    start = text.find(prefix)
    if start < 0:
        raise RuntimeError("Could not find FARSI_V5_DECK assignment")
    start += len(prefix)
    end = text.find(";\n", start)
    if end < 0:
        end = text.rfind(";")
    if end < 0:
        raise RuntimeError("Could not find end of FARSI_V5_DECK assignment")
    cards = json.loads(text[start:end])
    if not isinstance(cards, list):
        raise RuntimeError("FARSI_V5_DECK must be an array")
    if len(cards) != TOTAL:
        raise RuntimeError(f"v5 deck has {len(cards)} cards; expected {TOTAL}")
    return cards


def build_final_words():
    # Audio is keyed by learner-facing Persian surface form. v5 currently has
    # 2,000 stable concept cards but one intentional duplicate surface form
    # (زن), so the audio corpus contains 1,999 unique primary forms.
    words = []
    seen = set()
    for card in load_v5_cards():
        fa = str(card.get("fa") or "").strip()
        if not fa:
            raise RuntimeError(f"v5 card {card.get('id') or '?'} has no Persian form")
        if fa in seen:
            continue
        seen.add(fa)
        words.append(fa)
    if not words:
        raise RuntimeError("v5 deck produced no audio forms")
    return words


def load_manifest():
    if not MANIFEST.exists():
        return {}
    for line in MANIFEST.read_text(encoding="utf-8").splitlines():
        if line.startswith("window.FARSI_AUDIO="):
            raw = line[len("window.FARSI_AUDIO="):].strip()
            if raw.endswith(";"):
                raw = raw[:-1]
            data = json.loads(raw)
            return data if isinstance(data, dict) else {}
    return {}


def write_manifest(manifest, all_words):
    ordered = {}
    for fa in all_words:
        if fa in manifest:
            ordered[fa] = manifest[fa]
    for fa, src in manifest.items():
        if fa not in ordered:
            ordered[fa] = src
    MANIFEST.write_text(
        "window.FARSI_AUDIO=" + json.dumps(ordered, ensure_ascii=False, separators=(",", ":")) + ";\n",
        encoding="utf-8",
    )


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
        "deck_words": TOTAL,
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
            "deck_words": TOTAL,
        }
        VOICE_META.write_text(json.dumps(meta, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
        return explicit, meta

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
    url = f"{API}/text-to-speech/{voice_id}"
    params = {"output_format": "mp3_44100_128"}
    retryable_statuses = {408, 429, 500, 502, 503, 504}
    max_attempts = 6

    for attempt in range(1, max_attempts + 1):
        try:
            r = requests.post(
                url,
                params=params,
                headers=headers(),
                json=payload,
                timeout=120,
            )
        except requests.RequestException as exc:
            if attempt == max_attempts:
                raise RuntimeError(
                    f"TTS for {word} failed after {max_attempts} attempts: {exc}"
                ) from exc
            delay = min(30, 2 ** attempt)
            print(f"  transient connection error for {word}; retry {attempt}/{max_attempts - 1} in {delay}s: {exc}")
            time.sleep(delay)
            continue

        if r.ok:
            if len(r.content) < 1000:
                if attempt == max_attempts:
                    raise RuntimeError(
                        f"TTS for {word} returned suspiciously small audio ({len(r.content)} bytes)"
                    )
                delay = min(30, 2 ** attempt)
                print(f"  small audio response for {word}; retry {attempt}/{max_attempts - 1} in {delay}s")
                time.sleep(delay)
                continue
            dest.write_bytes(r.content)
            return

        if r.status_code not in retryable_statuses or attempt == max_attempts:
            checked(r, f"TTS for {word}")

        retry_after = r.headers.get("Retry-After", "").strip()
        try:
            delay = max(1.0, float(retry_after)) if retry_after else min(30, 2 ** attempt)
        except ValueError:
            delay = min(30, 2 ** attempt)
        print(f"  ElevenLabs HTTP {r.status_code} for {word}; retry {attempt}/{max_attempts - 1} in {delay:g}s")
        time.sleep(delay)

    raise RuntimeError(f"TTS for {word} failed unexpectedly")


def main():
    if not API_KEY:
        raise SystemExit("ELEVENLABS_API_KEY is missing")
    all_words = build_final_words()
    if START_INDEX < 0 or START_INDEX >= len(all_words):
        raise SystemExit(f"START_INDEX must be between 0 and {len(all_words) - 1}")
    if COUNT <= 0:
        raise SystemExit("COUNT must be greater than 0")
    end = min(START_INDEX + COUNT, TOTAL)
    batch = all_words[START_INDEX:end]
    print(f"Natural Persian audio batch: {START_INDEX}..{end - 1} ({len(batch)} words)")

    AUDIO_DIR.mkdir(parents=True, exist_ok=True)
    voice_id, meta = load_voice_id()
    manifest = load_manifest()

    generated = 0
    reused = 0
    for offset, word in enumerate(batch, 1):
        name = filename_for(word)
        rel = f"audio/natural/{name}"
        dest = AUDIO_DIR / name
        if dest.exists() and dest.stat().st_size >= 1000:
            manifest[word] = rel
            reused += 1
            print(f"[{offset:03d}/{len(batch)}] reuse {word}")
            continue

        print(f"[{offset:03d}/{len(batch)}] generate {word}")
        synthesize(voice_id, word, dest)
        manifest[word] = rel
        generated += 1
        time.sleep(0.30)

    write_manifest(manifest, all_words)

    if not VOICE_META.exists():
        VOICE_META.write_text(
            json.dumps(meta or {"voice_id": voice_id}, ensure_ascii=False, indent=2) + "\n",
            encoding="utf-8",
        )

    total_audio = sum(1 for fa in all_words if fa in manifest)
    print(f"Batch complete: {generated} generated, {reused} reused")
    print(f"Natural audio coverage: {total_audio}/{TOTAL} words")
    print(f"Voice: {voice_id}")


if __name__ == "__main__":
    main()
