#!/usr/bin/env python3
import asyncio
import json
import os
import random
from pathlib import Path

import edge_tts

import build_natural_audio as base

VOICE = "fa-IR-DilaraNeural"
RATE = "-2%"
CONCURRENCY = int(os.environ.get("DILARA_CONCURRENCY", "10"))
MAX_ATTEMPTS = 5


def rebuild_bundle():
    manifest = base.MANIFEST
    lines = manifest.read_text(encoding="utf-8").splitlines()
    if not lines or not lines[0].startswith("window.FARSI_AUDIO="):
        raise RuntimeError("audio manifest does not start with FARSI_AUDIO mapping")
    chunks = [lines[0].rstrip() + "\n"]
    for rel in [
        "data/audio-ui.js",
        "data/reading-mode.js",
        "data/responsive-ui.js",
        "data/audio-quality-lock.js",
    ]:
        chunks.append((base.ROOT / rel).read_text(encoding="utf-8").rstrip() + "\n")
    manifest.write_text("".join(chunks), encoding="utf-8")


def write_manifest(words):
    mapping = {
        word: f"audio/natural/{base.filename_for(word)}"
        for word in words
    }
    first = "window.FARSI_AUDIO=" + json.dumps(mapping, ensure_ascii=False, separators=(",", ":")) + ";\n"
    old = base.MANIFEST.read_text(encoding="utf-8").splitlines() if base.MANIFEST.exists() else []
    tail = "\n".join(old[1:]).rstrip()
    base.MANIFEST.write_text(first + (tail + "\n" if tail else ""), encoding="utf-8")


def write_verified_metadata():
    meta = {
        "voice_id": VOICE,
        "name": "Microsoft Dilara Neural",
        "source": "Microsoft Edge TTS",
        "engine": "Microsoft neural TTS",
        "native_language": "fa-IR",
        "voice_language": "Persian (Iran)",
        "native_persian_verified": True,
        "labels": {
            "language": "fa-IR",
            "accent": "Iranian Persian",
            "gender": "female",
        },
        "rate": RATE,
        "deck_words": base.TOTAL,
    }
    base.VOICE_META.write_text(json.dumps(meta, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")


def unlock_audio():
    path = base.ROOT / "data" / "audio-quality-lock.js"
    path.write_text(
        "(()=>{\n"
        "  // Dilara is an official Persian (Iran) fa-IR voice. The previous\n"
        "  // American-English ElevenLabs set has been fully replaced.\n"
        "  window.FARSI_AUDIO_QUARANTINED=false;\n"
        "  window.addEventListener(\"load\",()=>document.body.classList.remove(\"audio-quality-lock\"));\n"
        "})();\n",
        encoding="utf-8",
    )


async def synth_one(sem, index, total, word):
    dest = base.AUDIO_DIR / base.filename_for(word)
    tmp = dest.with_suffix(".tmp.mp3")
    async with sem:
        last = None
        for attempt in range(1, MAX_ATTEMPTS + 1):
            try:
                if tmp.exists():
                    tmp.unlink()
                await asyncio.wait_for(
                    edge_tts.Communicate(word, VOICE, rate=RATE).save(str(tmp)),
                    timeout=45,
                )
                if not tmp.exists() or tmp.stat().st_size < 1000:
                    size = tmp.stat().st_size if tmp.exists() else 0
                    raise RuntimeError(f"invalid audio size {size}")
                tmp.replace(dest)
                print(f"[{index:04d}/{total}] {word}")
                return
            except Exception as exc:
                last = exc
                if tmp.exists():
                    tmp.unlink()
                if attempt == MAX_ATTEMPTS:
                    break
                delay = min(20, 1.5 * (2 ** (attempt - 1))) + random.random()
                print(f"retry {attempt}/{MAX_ATTEMPTS - 1} for {word}: {exc}; sleeping {delay:.1f}s")
                await asyncio.sleep(delay)
        raise RuntimeError(f"Dilara TTS failed for {word}: {last}")


async def main_async():
    words = base.build_final_words()
    if len(words) != base.TOTAL:
        raise RuntimeError(f"Expected {base.TOTAL} words, got {len(words)}")

    base.AUDIO_DIR.mkdir(parents=True, exist_ok=True)
    sem = asyncio.Semaphore(CONCURRENCY)
    tasks = [synth_one(sem, i, len(words), word) for i, word in enumerate(words, 1)]
    results = await asyncio.gather(*tasks, return_exceptions=True)
    failures = [(words[i], r) for i, r in enumerate(results) if isinstance(r, Exception)]
    if failures:
        examples = "; ".join(f"{w}: {e}" for w, e in failures[:10])
        raise RuntimeError(f"{len(failures)} Dilara pronunciations failed; audio remains quarantined. {examples}")

    write_manifest(words)
    write_verified_metadata()
    unlock_audio()
    rebuild_bundle()
    print(f"Dilara rebuild complete: {len(words)}/{base.TOTAL} Persian pronunciations")


def main():
    asyncio.run(main_async())


if __name__ == "__main__":
    main()
