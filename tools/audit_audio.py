#!/usr/bin/env python3
import json
from collections import Counter

import build_natural_audio as base

REPORT = base.ROOT / "data" / "audio-audit.txt"


def voice_is_native_persian(meta):
    if not isinstance(meta, dict):
        return False
    if meta.get("native_persian_verified") is True:
        return True

    labels = meta.get("labels") or {}
    language_values = [
        labels.get("language"),
        meta.get("native_language"),
        meta.get("voice_language"),
    ]
    for value in language_values:
        value = str(value or "").strip().lower()
        if value in {"fa", "fa-ir", "persian", "persian (iran)"}:
            return True

    for item in meta.get("verified_languages") or []:
        if not isinstance(item, dict):
            continue
        language = str(item.get("language") or "").strip().lower()
        locale = str(item.get("locale") or "").strip().lower()
        if language == "fa" or locale.startswith("fa-ir"):
            return True
    return False


def main():
    words = base.build_final_words()
    manifest = base.load_manifest()

    missing_manifest = []
    missing_files = []
    small_files = []
    wrong_paths = []
    paths = []

    for word in words:
        rel = manifest.get(word)
        if not rel:
            missing_manifest.append(word)
            continue

        expected = f"audio/natural/{base.filename_for(word)}"
        if rel != expected:
            wrong_paths.append((word, rel, expected))

        paths.append(rel)
        path = base.ROOT / rel
        if not path.exists():
            missing_files.append((word, rel))
        elif path.stat().st_size < 1000:
            small_files.append((word, rel, path.stat().st_size))

    duplicate_paths = [p for p, n in Counter(paths).items() if n > 1]
    deck_set = set(words)
    extra_manifest = sorted(set(manifest) - deck_set)

    natural_dir = base.AUDIO_DIR
    actual_mp3s = set()
    if natural_dir.exists():
        actual_mp3s = {
            str(p.relative_to(base.ROOT)).replace("\\", "/")
            for p in natural_dir.glob("*.mp3")
        }
    referenced_mp3s = set(paths)
    orphan_files = sorted(actual_mp3s - referenced_mp3s)

    voice_meta = {}
    if base.VOICE_META.exists():
        try:
            voice_meta = json.loads(base.VOICE_META.read_text(encoding="utf-8"))
        except Exception:
            voice_meta = {}
    native_persian_voice = voice_is_native_persian(voice_meta)
    labels = voice_meta.get("labels") or {}
    voice_name = voice_meta.get("name") or voice_meta.get("voice_id") or "unknown"
    voice_language = labels.get("language") or voice_meta.get("native_language") or voice_meta.get("voice_language") or "unknown"
    voice_accent = labels.get("accent") or voice_meta.get("accent") or "unknown"

    problems = (
        len(words) != base.TOTAL
        or missing_manifest
        or missing_files
        or small_files
        or wrong_paths
        or duplicate_paths
        or not native_persian_voice
    )

    lines = [
        f"Deck words: {len(words)}",
        f"Manifest entries for deck: {sum(1 for w in words if w in manifest)}",
        f"Natural MP3 files on disk: {len(actual_mp3s)}",
        f"Missing manifest entries: {len(missing_manifest)}",
        f"Missing files: {len(missing_files)}",
        f"Files under 1000 bytes: {len(small_files)}",
        f"Unexpected manifest paths: {len(wrong_paths)}",
        f"Duplicate audio paths: {len(duplicate_paths)}",
        f"Extra manifest entries: {len(extra_manifest)}",
        f"Orphan natural MP3 files: {len(orphan_files)}",
        f"Voice: {voice_name}",
        f"Voice native language: {voice_language}",
        f"Voice accent: {voice_accent}",
        f"Native Persian voice verified: {'yes' if native_persian_voice else 'NO'}",
    ]

    if problems:
        lines.append("Audio integrity/quality audit FAILED")
        if len(words) != base.TOTAL:
            lines.append(f"Deck size mismatch: {len(words)} != {base.TOTAL}")
        if missing_manifest:
            lines.append("Missing manifest words: " + ", ".join(missing_manifest[:20]))
        if missing_files:
            lines.append("Missing file examples: " + repr(missing_files[:10]))
        if small_files:
            lines.append("Small file examples: " + repr(small_files[:10]))
        if wrong_paths:
            lines.append("Wrong path examples: " + repr(wrong_paths[:10]))
        if duplicate_paths:
            lines.append("Duplicate path examples: " + repr(duplicate_paths[:10]))
        if not native_persian_voice:
            lines.append(
                "Pronunciation quality block: the selected TTS voice is not verified native Persian. "
                "Do not ship or teach from this audio set."
            )
    else:
        lines.append(
            "Audio integrity/quality audit PASSED: all 2000 deck words have distinct, valid MP3 files generated with a verified native Persian voice."
        )
        if extra_manifest:
            lines.append(f"Note: {len(extra_manifest)} extra manifest entries are not in the current 2000-word deck.")
        if orphan_files:
            lines.append(f"Note: {len(orphan_files)} orphan MP3 files are present but not referenced by the current deck.")

    text = "\n".join(lines) + "\n"
    print(text, end="")
    REPORT.write_text(text, encoding="utf-8")

    if problems:
        raise SystemExit(1)


if __name__ == "__main__":
    main()
