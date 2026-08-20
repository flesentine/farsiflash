#!/usr/bin/env python3
import asyncio
import hashlib
import html
import json
import shutil
from pathlib import Path

import edge_tts

ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / "audio" / "native-voice-test"
META = ROOT / "data" / "native-voice-test.json"
PAGE = ROOT / "voice-test.html"

TEST_WORDS = [
    ("دو", "two — should sound like Persian 'doh/DOE', not English 'do'"),
    ("تو", "you (informal)"),
    ("او", "he / she"),
    ("نَه", "no / not"),
    ("روز", "day"),
    ("خوب", "good / well"),
    ("خداحافظ", "goodbye"),
    ("موسیقی", "music"),
]

# Both are Microsoft's official Persian (Iran), fa-IR, neural voices.
CANDIDATES = [
    {
        "id": "dilara",
        "name": "Microsoft Dilara Neural",
        "engine": "Microsoft",
        "voice": "fa-IR-DilaraNeural",
        "native_locale": "fa-IR",
        "gender": "female",
    },
    {
        "id": "farid",
        "name": "Microsoft Farid Neural",
        "engine": "Microsoft",
        "voice": "fa-IR-FaridNeural",
        "native_locale": "fa-IR",
        "gender": "male",
    },
]


def fname(word):
    return hashlib.sha1(word.encode("utf-8")).hexdigest()[:12] + ".mp3"


async def synth_edge(text, voice, dest):
    # Near-normal speed sounds less robotic than the old -8% setting while
    # keeping pronunciation clear for learners.
    communicate = edge_tts.Communicate(text, voice, rate="-2%")
    await communicate.save(str(dest))
    if not dest.exists() or dest.stat().st_size < 500:
        raise RuntimeError(f"Microsoft TTS returned invalid audio for {text}")


async def main():
    if OUT.exists():
        shutil.rmtree(OUT)
    OUT.mkdir(parents=True, exist_ok=True)

    results = []
    for candidate in CANDIDATES:
        folder = OUT / candidate["id"]
        folder.mkdir(parents=True, exist_ok=True)
        samples = []
        print(f"Generating {candidate['name']}")
        for word, meaning in TEST_WORDS:
            dest = folder / fname(word)
            await synth_edge(word, candidate["voice"], dest)
            samples.append({
                "word": word,
                "meaning": meaning,
                "src": str(dest.relative_to(ROOT)).replace("\\", "/"),
            })
        results.append({**candidate, "native_persian_verified": True, "samples": samples})

    META.write_text(json.dumps({"candidates": results}, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")

    sections = []
    for idx, c in enumerate(results, 1):
        rows = []
        for s in c["samples"]:
            rows.append(
                f'''<div class="sample"><div><b dir="rtl">{html.escape(s["word"])}</b><small>{html.escape(s["meaning"])}</small></div><audio controls preload="none" src="{html.escape(s["src"])}"></audio></div>'''
            )
        sections.append(
            f'''<section><h2>Candidate {idx}: {html.escape(c["name"])}</h2><p>{html.escape(c["engine"])} · Persian (Iran) {html.escape(c["native_locale"])} · {html.escape(c["gender"])}</p>{''.join(rows)}</section>'''
        )

    PAGE.write_text(
        '''<!doctype html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Farsi 2000 — native Persian voice test</title><style>body{font-family:-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif;max-width:900px;margin:0 auto;padding:24px;background:#f4f1ea;color:#222}h1{margin-bottom:6px}.note{color:#665f56;margin-bottom:28px;line-height:1.5}section{background:white;border:1px solid #ddd6cb;border-radius:18px;padding:20px;margin:18px 0}.sample{display:grid;grid-template-columns:minmax(190px,1fr) minmax(220px,1fr);gap:16px;align-items:center;border-top:1px solid #eee7dc;padding:13px 0}.sample b{font-family:Tahoma,"Geeza Pro",sans-serif;font-size:28px}.sample small{display:block;color:#766f66;margin-top:4px}audio{width:100%}@media(max-width:600px){.sample{grid-template-columns:1fr}body{padding:14px}}</style></head><body><h1>Native Persian pronunciation test</h1><p class="note">The old ElevenLabs American-English voice has been disabled. Both candidates below are official <b>Persian (Iran), fa-IR</b> voices. Listen to <b dir="rtl">دو</b> first: it should sound like Persian <b>doh / DOE</b>, not American English <b>do</b>.</p>'''
        + "".join(sections)
        + "</body></html>",
        encoding="utf-8",
    )
    print("Created native Persian voice test page")


if __name__ == "__main__":
    asyncio.run(main())
