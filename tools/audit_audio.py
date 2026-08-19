#!/usr/bin/env python3
from collections import Counter

import build_natural_audio as base


def main():
    words = base.build_final_words()
    manifest = base.load_manifest()

    if len(words) != base.TOTAL:
        raise SystemExit(f"Deck size mismatch: {len(words)} != {base.TOTAL}")

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

    print(f"Deck words: {len(words)}")
    print(f"Manifest entries for deck: {sum(1 for w in words if w in manifest)}")
    print(f"Natural MP3 files on disk: {len(actual_mp3s)}")
    print(f"Missing manifest entries: {len(missing_manifest)}")
    print(f"Missing files: {len(missing_files)}")
    print(f"Files under 1000 bytes: {len(small_files)}")
    print(f"Unexpected manifest paths: {len(wrong_paths)}")
    print(f"Duplicate audio paths: {len(duplicate_paths)}")
    print(f"Extra manifest entries: {len(extra_manifest)}")
    print(f"Orphan natural MP3 files: {len(orphan_files)}")

    problems = (
        missing_manifest
        or missing_files
        or small_files
        or wrong_paths
        or duplicate_paths
    )

    if problems:
        if missing_manifest:
            print("Missing manifest words:", ", ".join(missing_manifest[:20]))
        if missing_files:
            print("Missing file examples:", missing_files[:10])
        if small_files:
            print("Small file examples:", small_files[:10])
        if wrong_paths:
            print("Wrong path examples:", wrong_paths[:10])
        if duplicate_paths:
            print("Duplicate path examples:", duplicate_paths[:10])
        raise SystemExit("Audio integrity audit FAILED")

    print("Audio integrity audit PASSED: all 2000 deck words have distinct, valid natural MP3 files.")

    if extra_manifest:
        print(f"Note: {len(extra_manifest)} extra manifest entries are not in the current 2000-word deck.")
    if orphan_files:
        print(f"Note: {len(orphan_files)} orphan MP3 files are present but not referenced by the current deck.")


if __name__ == "__main__":
    main()
