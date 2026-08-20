#!/usr/bin/env python3
import asyncio
import hashlib
import html
import json
import shutil
import wave
from pathlib import Path

import edge_tts
from ava_tts import Ava
from huggingface_hub import hf_hub_download
from piper import PiperVoice

ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / "audio" / "voice-final"
PAGE = ROOT / "voice-test.html"
STATUS = ROOT / "data" / "final-voice-audition-status.txt"
META = ROOT / "data" / "final-voice-audition.json"

TESTS = [
    ("دو", "two — must sound like Persian doh/DOE, never English 'do'"),
    ("تو", "you (informal)"),
    ("او", "he / she"),
    ("روز", "day"),
    ("خوب", "good / well"),
    ("می‌خواهم", "I want"),
    ("خداحافظ", "goodbye"),
    ("موسیقی", "music"),
]


def stem(text):
    return hashlib.sha1(text.encode("utf-8")).hexdigest()[:12]


async def make_dilara():
    folder = OUT / "dilara"
    folder.mkdir(parents=True, exist_ok=True)
    samples = []
    for text, meaning in TESTS:
        dest = folder / f"{stem(text)}.mp3"
        await edge_tts.Communicate(text, "fa-IR-DilaraNeural", rate="-2%").save(str(dest))
        if not dest.exists() or dest.stat().st_size < 500:
            raise RuntimeError(f"Dilara returned invalid audio for {text}")
        samples.append((text, meaning, dest))
    return {
        "id": "dilara",
        "name": "Microsoft Dilara Neural",
        "note": "Official Persian (Iran) fa-IR neural voice. Free to generate through the current Edge TTS workflow.",
        "license": "Microsoft service voice",
        "samples": samples,
    }


def make_ava():
    folder = OUT / "ava"
    folder.mkdir(parents=True, exist_ok=True)
    tts = Ava.from_pretrained("xmanii/Ava-82M")
    samples = []
    for text, meaning in TESTS:
        dest = folder / f"{stem(text)}.wav"
        tts.save(text, str(dest), speed=1.0)
        if not dest.exists() or dest.stat().st_size < 1000:
            raise RuntimeError(f"Ava returned invalid audio for {text}")
        samples.append((text, meaning, dest))
    return {
        "id": "ava",
        "name": "Ava 82M (open source)",
        "note": "Persian-only Kokoro adaptation trained on Iranian Persian Mana-TTS, with Persian G2P and pronunciation corrections.",
        "license": "Apache-2.0",
        "samples": samples,
    }


def make_piper():
    folder = OUT / "piper"
    folder.mkdir(parents=True, exist_ok=True)
    model = hf_hub_download("MahtaFetrat/Mana-Persian-Piper", "fa_IR-mana-medium.onnx")
    hf_hub_download("MahtaFetrat/Mana-Persian-Piper", "fa_IR-mana-medium.onnx.json")
    voice = PiperVoice.load(model)
    samples = []
    for text, meaning in TESTS:
        dest = folder / f"{stem(text)}.wav"
        with wave.open(str(dest), "wb") as wav_file:
            voice.synthesize_wav(text, wav_file)
        if not dest.exists() or dest.stat().st_size < 1000:
            raise RuntimeError(f"Piper returned invalid audio for {text}")
        samples.append((text, meaning, dest))
    return {
        "id": "piper",
        "name": "Mana Persian Piper (open source)",
        "note": "Lightweight fa-IR Piper model trained on Mana-TTS; designed for real-time/on-device Persian speech.",
        "license": "MIT",
        "samples": samples,
    }


def render(candidates):
    sections = []
    for c in candidates:
        rows = []
        for text, meaning, dest in c["samples"]:
            rel = str(dest.relative_to(ROOT)).replace("\\", "/")
            rows.append(
                f'<div class="sample"><div><b dir="rtl">{html.escape(text)}</b><small>{html.escape(meaning)}</small></div>'
                f'<audio controls preload="none" src="{html.escape(rel)}"></audio></div>'
            )
        sections.append(
            f'<section><h2>{html.escape(c["name"])}</h2>'
            f'<p>{html.escape(c["note"])}</p><p class="license">License/access: {html.escape(c["license"])}</p>'
            + "".join(rows) + "</section>"
        )

    PAGE.write_text(
        '<!doctype html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">'
        '<title>Farsi 2000 — final Persian voice shootout</title><style>'
        'body{font-family:-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif;max-width:940px;margin:0 auto;padding:24px;background:#f4f1ea;color:#222}'
        'h1{margin-bottom:6px}.lead{color:#665f56;line-height:1.55;margin-bottom:28px}section{background:#fff;border:1px solid #ddd6cb;border-radius:18px;padding:20px;margin:18px 0}'
        '.license{font-size:13px;color:#766f66}.sample{display:grid;grid-template-columns:minmax(190px,1fr) minmax(240px,1fr);gap:16px;align-items:center;border-top:1px solid #eee7dc;padding:13px 0}'
        '.sample b{font-family:Tahoma,"Geeza Pro",sans-serif;font-size:28px}.sample small{display:block;color:#766f66;margin-top:4px}audio{width:100%}'
        '@media(max-width:600px){.sample{grid-template-columns:1fr}body{padding:14px}}</style></head><body>'
        '<h1>Final Persian voice shootout</h1>'
        '<p class="lead">No more 2,000-word runs until the voice passes this page. Start with <b dir="rtl">دو</b>. '
        'Compare the official Microsoft fa-IR voice with two genuinely Persian open-source models.</p>'
        + "".join(sections) + '</body></html>',
        encoding="utf-8",
    )


def main():
    if OUT.exists():
        shutil.rmtree(OUT)
    OUT.mkdir(parents=True, exist_ok=True)

    candidates = []
    errors = []

    try:
        candidates.append(asyncio.run(make_dilara()))
    except Exception as exc:
        errors.append(f"Dilara: {exc}")

    try:
        candidates.append(make_ava())
    except Exception as exc:
        errors.append(f"Ava: {exc}")

    try:
        candidates.append(make_piper())
    except Exception as exc:
        errors.append(f"Piper: {exc}")

    if not candidates:
        raise SystemExit("All voice candidates failed: " + " | ".join(errors))

    render(candidates)
    META.write_text(
        json.dumps(
            {"candidates": [{k: v for k, v in c.items() if k != "samples"} for c in candidates], "errors": errors},
            ensure_ascii=False,
            indent=2,
        ) + "\n",
        encoding="utf-8",
    )
    STATUS.write_text(
        "Generated: " + ", ".join(c["name"] for c in candidates)
        + ("\nErrors: " + " | ".join(errors) if errors else "") + "\n",
        encoding="utf-8",
    )
    print(STATUS.read_text(encoding="utf-8"), end="")


if __name__ == "__main__":
    main()
