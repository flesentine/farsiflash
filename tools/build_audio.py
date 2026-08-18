#!/usr/bin/env python3
# Static MP3 builder. Generates one probe first, then fans out in parallel.
import asyncio
import hashlib
import json
import re
from pathlib import Path

import edge_tts

TOTAL = 2000
VOICE = "fa-IR-DilaraNeural"
RATE = "-8%"
ROOT = Path(__file__).resolve().parents[1]
DATA = ROOT / "data"
AUDIO = ROOT / "audio"
PATH_JS = DATA / "path.js"

CARD_RE = re.compile(r'\[\s*("(?:\\.|[^"\\])*")\s*,\s*("(?:\\.|[^"\\])*")\s*,\s*("(?:\\.|[^"\\])*")\s*\]')
VOWELS_RE = re.compile(r"[\u064B-\u0652\u0670]")


def unquote(s):
    return json.loads(s)


def base_fa(s):
    s = s.replace("ي", "ی").replace("ك", "ک")
    s = VOWELS_RE.sub("", s)
    return s.replace("\u200c", "").strip()


def parse_path():
    text = PATH_JS.read_text(encoding="utf-8")
    out = []
    for m in CARD_RE.finditer(text):
        fa, roman, en = (unquote(x) for x in m.groups())
        out.append((fa, roman, en))
    return out


def parse_miller():
    out = []
    for p in sorted(DATA.glob("miller-[0-9][0-9].js")):
        text = p.read_text(encoding="utf-8")
        m = re.search(r"\.push\((\[.*\])\);\s*$", text, re.S)
        if not m:
            raise RuntimeError(f"Could not parse {p}")
        out.extend(json.loads(m.group(1)))
    return out


def build_final_words():
    path_cards = parse_path()
    raw = parse_miller()
    cards = []
    exact = set()
    covered_base = set()

    for fa, roman, en in path_cards:
        if fa in exact:
            continue
        cards.append((fa, roman, en))
        exact.add(fa)
        covered_base.add(base_fa(fa))

    for roman, fa, en, _rank in raw:
        if fa in exact or base_fa(fa) in covered_base:
            continue
        cards.append((fa, roman, en))
        exact.add(fa)
        if len(cards) >= TOTAL:
            break

    if len(cards) != TOTAL:
        raise RuntimeError(f"Expected {TOTAL} final cards, got {len(cards)}")
    return cards


def audio_name(fa):
    return hashlib.sha1(fa.encode("utf-8")).hexdigest()[:16] + ".mp3"


async def synth_one(sem, fa, path):
    if path.exists() and path.stat().st_size > 500:
        return
    async with sem:
        last = None
        for attempt in range(3):
            try:
                tmp = path.with_suffix(".tmp.mp3")
                if tmp.exists():
                    tmp.unlink()
                communicate = edge_tts.Communicate(fa, VOICE, rate=RATE)
                await asyncio.wait_for(communicate.save(str(tmp)), timeout=25)
                if not tmp.exists() or tmp.stat().st_size < 500:
                    raise RuntimeError("generated audio was empty")
                tmp.replace(path)
                return
            except Exception as e:
                last = e
                await asyncio.sleep(1.0 * (attempt + 1))
        raise RuntimeError(f"TTS failed for {fa!r}: {last}")


async def main():
    cards = build_final_words()
    AUDIO.mkdir(exist_ok=True)
    manifest = {}
    wanted = set()

    for fa, _roman, _en in cards:
        name = audio_name(fa)
        wanted.add(name)
        manifest[fa] = f"audio/{name}"

    # Probe one word before starting 2,000 requests so service failures are immediate.
    first_fa = cards[0][0]
    await synth_one(asyncio.Semaphore(1), first_fa, AUDIO / audio_name(first_fa))

    sem = asyncio.Semaphore(12)
    jobs = [synth_one(sem, fa, AUDIO / audio_name(fa)) for fa, _roman, _en in cards[1:]]
    await asyncio.gather(*jobs)

    for p in AUDIO.glob("*.mp3"):
        if p.name not in wanted:
            p.unlink()

    manifest_js = "window.FARSI_AUDIO=" + json.dumps(manifest, ensure_ascii=False, separators=(",", ":")) + ";\n"
    (DATA / "audio-manifest.js").write_text(manifest_js, encoding="utf-8")
    total_bytes = sum((AUDIO / n).stat().st_size for n in wanted)
    print(f"Generated/verified {len(manifest)} Persian audio files ({total_bytes/1024/1024:.1f} MiB)")


if __name__ == "__main__":
    asyncio.run(main())
