#!/usr/bin/env python3
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT / "tools"))

import build_natural_audio as base

cards = base.load_v5_cards()
words = base.build_final_words()
manifest = base.load_manifest()

assert len(cards) == 2000, f"expected 2000 v5 cards, found {len(cards)}"
assert len(words) == len(set(words)), "audio forms must be unique"
assert len(words) == 1999, f"expected 1999 unique v5 primary forms (one repeated زن), found {len(words)}"
assert "خوشوقتم" in words, "nice-to-meet-you v5 form must be included in audio source"
assert "سلام" in words, "core v5 form سلام missing from audio source"

coverage = sum(1 for word in words if word in manifest)
missing = [word for word in words if word not in manifest]
assert 0 <= coverage <= len(words), "manifest coverage count is invalid"

print(
    f"v5 audio source audit passed: cards={len(cards)}, uniqueForms={len(words)}, "
    f"currentManifestCoverage={coverage}/{len(words)}, missing={len(missing)}, "
    "targetVoice=fa-IR-DilaraNeural"
)
