#!/usr/bin/env python3
import time

import requests

import build_natural_audio as base


def synthesize(voice_id, word, dest):
    url = f"{base.API}/text-to-speech/{voice_id}"
    params = {"output_format": "mp3_44100_128"}
    retryable_statuses = {408, 429, 500, 502, 503, 504}
    max_attempts = 8

    for attempt in range(1, max_attempts + 1):
        text = word if attempt <= 4 else f"{word}."
        payload = {
            "text": text,
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

        try:
            r = requests.post(
                url,
                params=params,
                headers=base.headers(),
                json=payload,
                timeout=120,
            )
        except requests.RequestException as exc:
            if attempt == max_attempts:
                raise RuntimeError(
                    f"TTS for {word} failed after {max_attempts} attempts: {exc}"
                ) from exc
            delay = min(30, 2 ** min(attempt, 5))
            print(
                f"  transient connection error for {word}; "
                f"retry {attempt}/{max_attempts - 1} in {delay}s: {exc}"
            )
            time.sleep(delay)
            continue

        if r.ok:
            if len(r.content) >= 1000:
                dest.write_bytes(r.content)
                return

            if attempt == 4:
                print(f"  empty/small audio for {word}; switching to punctuation fallback")
            if attempt == max_attempts:
                raise RuntimeError(
                    f"TTS for {word} returned suspiciously small audio ({len(r.content)} bytes)"
                )
            delay = min(12, 2 ** min(attempt, 4))
            print(
                f"  small audio response for {word}; "
                f"retry {attempt}/{max_attempts - 1} in {delay}s"
            )
            time.sleep(delay)
            continue

        if r.status_code not in retryable_statuses or attempt == max_attempts:
            base.checked(r, f"TTS for {word}")

        retry_after = r.headers.get("Retry-After", "").strip()
        try:
            delay = max(1.0, float(retry_after)) if retry_after else min(30, 2 ** min(attempt, 5))
        except ValueError:
            delay = min(30, 2 ** min(attempt, 5))
        print(
            f"  ElevenLabs HTTP {r.status_code} for {word}; "
            f"retry {attempt}/{max_attempts - 1} in {delay:g}s"
        )
        time.sleep(delay)

    raise RuntimeError(f"TTS for {word} failed unexpectedly")


def main():
    if not base.API_KEY:
        raise SystemExit("ELEVENLABS_API_KEY is missing")
    if base.START_INDEX < 0 or base.START_INDEX >= base.TOTAL:
        raise SystemExit(f"START_INDEX must be between 0 and {base.TOTAL - 1}")
    if base.COUNT <= 0:
        raise SystemExit("COUNT must be greater than 0")

    all_words = base.build_final_words()
    end = min(base.START_INDEX + base.COUNT, base.TOTAL)
    batch = all_words[base.START_INDEX:end]
    print(
        f"Natural Persian audio batch: {base.START_INDEX}..{end - 1} "
        f"({len(batch)} words)"
    )

    base.AUDIO_DIR.mkdir(parents=True, exist_ok=True)
    voice_id, meta = base.load_voice_id()
    manifest = base.load_manifest()

    generated = 0
    reused = 0
    failures = []

    for offset, word in enumerate(batch, 1):
        name = base.filename_for(word)
        rel = f"audio/natural/{name}"
        dest = base.AUDIO_DIR / name

        if dest.exists() and dest.stat().st_size >= 1000:
            manifest[word] = rel
            reused += 1
            print(f"[{offset:03d}/{len(batch)}] reuse {word}")
            continue

        print(f"[{offset:03d}/{len(batch)}] generate {word}")
        try:
            synthesize(voice_id, word, dest)
        except Exception as exc:
            failures.append((word, str(exc)))
            print(f"::warning::Skipping {word} for this pass: {exc}")
            continue

        manifest[word] = rel
        generated += 1
        time.sleep(0.30)

    base.write_manifest(manifest, all_words)

    if not base.VOICE_META.exists():
        base.VOICE_META.write_text(
            base.json.dumps(meta or {"voice_id": voice_id}, ensure_ascii=False, indent=2) + "\n",
            encoding="utf-8",
        )

    total_audio = sum(1 for fa in all_words if fa in manifest)
    print(f"Batch pass complete: {generated} generated, {reused} reused, {len(failures)} failed")
    print(f"Natural audio coverage: {total_audio}/{base.TOTAL} words")
    print(f"Voice: {voice_id}")

    if failures:
        print("Words still needing audio:")
        for word, error in failures:
            print(f"  - {word}: {error}")
        raise RuntimeError(
            f"{len(failures)} word(s) still need audio; successful progress was saved for commit"
        )


if __name__ == "__main__":
    main()
