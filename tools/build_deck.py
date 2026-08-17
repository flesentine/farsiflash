#!/usr/bin/env python3
import json
import re
import unicodedata
from pathlib import Path

import requests
from bs4 import BeautifulSoup

TOTAL = 2000
MAX_RANK = 3000
OUT_DIR = Path("data")
CHUNK = 250

PAGES = ["1-1000", "1001-2000", "2001-3000"]
BASE = "https://en.wiktionary.org/wiki/Wiktionary:Frequency_lists/Persian/Miller_Aghajanian-Stewart_2009/{}"
HEADERS = {"User-Agent": "farsiflash static deck builder/1.2 (+https://github.com/flesentine/farsiflash)"}

SPELLING_FIXES = {
    "اعالم": "اعلام",
    "اطالع": "اطلاع",
    "کامال": "کاملا",
    "اختالف": "اختلاف",
    "استقالل": "استقلال",
    "انقالب": "انقلاب",
    "کاال": "کالا",
    "مالحظه": "ملاحظه",
    "حاال": "حالا",
    "تالش": "تلاش",
    "دالر": "دلار",
    "میالدی": "میلادی",
}

ROMAN_OVERRIDES = {
    "و":"o / va","بودن":"boodan","از":"az","به":"be","که":"ke","این":"een","در":"dar",
    "با":"baa","شدن":"shodan","برای":"baraaye","خود":"khod","یک":"yek","آن":"aan / oon",
    "خواستن":"khaastan","تا":"taa","داشتن":"daashtan","کردن":"kardan","کرد":"kard",
    "بایستن":"baayestan","اول":"avval","بر":"bar","سال":"saal","توانستن":"tavaanestan",
    "رسیدن":"residan","پس":"pas","هر":"har","کار":"kaar","بیش":"bish","دیگر":"digar",
    "روز":"rooz","اما":"ammaa","ما":"maa","کشور":"keshvar","گرفتن":"gereftan","پیش":"pish",
    "هم":"ham","گفتن":"goftan","بزرگ":"bozorg","دو":"do","شهر":"shahr","یا":"yaa",
    "دادن":"daadan","نیز":"niz","میان":"miyaan","صورت":"soorat","راه":"raah","من":"man",
    "شما":"shomaa","ولی":"vali","آمدن":"aamadan","بعد":"ba'd","چون":"chon","چه":"che",
    "او":"oo","هیچ":"hich","دانستن":"daanestan","بهتر":"behtar","جمله":"jomle","یعنی":"ya'ni",
    "بار":"baar","نفر":"nafar","بالا":"baalaa","اگر":"agar","ماه":"maah","رو":"roo / ro",
    "وقت":"vaght","وقتی":"vaghti","شب":"shab","اینجا":"eenjaa","چگونه":"chegoone",
    "جهان":"jahaan","جوان":"javaan","جامعه":"jaame'e","جهت":"jehat","اجرا":"ejraa",
    "مجلس":"majles","ایجاد":"ijaad","وجود":"vojood","جا":"jaa","نتیجه":"natije"
}

GLOSS_OVERRIDES = {
    "و":"and","بودن":"to be","از":"from","به":"to","که":"that / which","این":"this","در":"in",
    "با":"with","شدن":"to become","برای":"for","خود":"self","یک":"one / a","آن":"that",
    "خواستن":"to want","تا":"until / to","داشتن":"to have","کردن":"to do","کرد":"did",
    "بایستن":"must / should","اول":"first","بر":"on","سال":"year","توانستن":"can / be able",
    "رسیدن":"to arrive / reach","پس":"then / so","هر":"each / every","کار":"work","بیش":"more",
    "دیگر":"other / another","روز":"day","اما":"but","ما":"we / us","گرفتن":"to take / get",
    "پیش":"before / near","هم":"also / too","گفتن":"to say","دو":"two","یا":"or","دادن":"to give",
    "رو":"on / face; colloquial object marker","هیچ":"none / any","دانستن":"to know",
    "آمدن":"to come","یعنی":"meaning / that is","من":"I / me","چه":"what","بعد":"after / then",
    "ولی":"but","شما":"you","کس":"person / anyone","چون":"because / like","جا":"place",
    "ممکن":"possible","او":"he / she","همه":"all / everyone","بسیار":"very / a lot",
    "کند":"does / slow","داشته":"had / having","داده":"given / data","قرار":"agreement / arrangement",
    "حال":"state / condition","صورت":"face / form","بار":"time / load","نه":"no / not; nine"
}

BAN_EXACT = {
    "علی","محمد","رضا","حسین","حسن","محمود","احمد","حمید","مریم","منصور","نیما",
    "واشنگتن","لندن","تهران","اصفهان","خراسان","همدان","لبنان","مصر","انگلستان",
    "اردن","ترکمنستان","آمریکا","ترکیه","عراق","افغانستان","پاکستان","فرانسه","آلمان",
    "روسیه","چین","ژاپن","اسرائیل","سوریه","فلسطین","هند"
}

# Remove ordinary short-vowel/tanwin marks only. Do NOT Unicode-decompose Persian text:
# doing that would destroy letters such as آ and ئ whose marks are part of the letter.
VOWEL_MARKS = re.compile(r"[\u064B-\u0652\u0670]")

def normalize_fa(s: str) -> str:
    s = (s or "").replace("ي","ی").replace("ك","ک")
    s = s.replace("\u200d","").replace("\u200e","").replace("\u200f","").replace("\ufeff","")
    s = VOWEL_MARKS.sub("", s)
    s = re.sub(r"\s+", " ", s).strip()
    return SPELLING_FIXES.get(s, s)

def dedupe_key(s: str) -> str:
    return re.sub(r"[\s\u200c]+", "", normalize_fa(s))

def only_proper(pos: str) -> bool:
    parts = [p.strip().lower() for p in re.split(r"[,;/]", pos or "") if p.strip()]
    return bool(parts) and all(p in {"proper noun","proper-noun","pn"} for p in parts)

def romanize_ipa(raw: str, fa: str) -> str:
    if fa in ROMAN_OVERRIDES:
        return ROMAN_OVERRIDES[fa]
    s = (raw or "").split(",")[0].strip()
    s = unicodedata.normalize("NFD", s)
    s = "".join(ch for ch in s if unicodedata.category(ch) != "Mn")
    s = s.replace("dʒ", "§J§").replace("ʤ", "§J§")
    s = s.replace("tʃ", "§CH§").replace("ʧ", "§CH§")
    repl = [
        ("ʃ","sh"),("ʒ","zh"),("ɣ","gh"),("x","kh"),("ɡ","g"),
        ("ʔ","'"),("Ɂ","'"),("j","y"),("ɒ","aa"),("ɑ","aa"),("æ","a"),
        ("u","oo"),("ə","e"),("ɹ","r"),("ɾ","r"),("θ","s"),("ð","z"),
        ("ŋ","ng"),("ɪ","i"),("ɛ","e"),("ɔ","o")
    ]
    for a,b in repl:
        s = s.replace(a,b)
    s = s.replace("§J§", "j").replace("§CH§", "ch")
    s = re.sub(r"[ːˈˌʰʱ̥̃˞.]", "", s)
    s = re.sub(r"\s+", " ", s).strip()
    return s.replace("č","ch").replace("š","sh").replace("ž","zh")

def clean_gloss(gloss: str, fa: str) -> str:
    if fa in GLOSS_OVERRIDES:
        return GLOSS_OVERRIDES[fa]
    g = re.sub(r"\s+", " ", gloss or "").strip()
    if g.lower() == "q":
        return "every / any"
    return g

def fetch_page(label: str):
    r = requests.get(BASE.format(label), headers=HEADERS, timeout=40)
    r.raise_for_status()
    return BeautifulSoup(r.text, "html.parser")

def find_frequency_table(soup):
    for table in soup.find_all("table"):
        head = " | ".join(th.get_text(" ", strip=True) for th in table.find_all("th")[:8])
        if "Rank" in head and "Persian" in head and "Definition" in head:
            return table
    raise RuntimeError("frequency table not found")

def parse_table(soup):
    rows = []
    for tr in find_frequency_table(soup).find_all("tr"):
        cells = tr.find_all(["th","td"], recursive=False)
        if len(cells) < 4:
            continue
        rank_txt = cells[0].get_text(" ", strip=True)
        if not re.fullmatch(r"\d+", rank_txt):
            continue
        rank = int(rank_txt)
        word_cell = cells[1]
        a = word_cell.find("a")
        if not a:
            continue
        anchor_text = a.get_text(" ", strip=True)
        fa = normalize_fa(anchor_text)
        full = word_cell.get_text(" ", strip=True)
        tail = full[len(anchor_text):].strip() if full.startswith(anchor_text) else full
        m = re.search(r"\(([^()]*)\)", tail)
        pron = m.group(1).strip() if m else ""
        gloss = cells[3].get_text(" ", strip=True) if len(cells) > 3 else ""
        pos = cells[4].get_text(" ", strip=True) if len(cells) > 4 else ""
        rows.append({"rank":rank,"fa":fa,"pron":pron,"gloss":gloss,"pos":pos})
    return rows

def useful(row):
    fa, gloss, pos = row["fa"], row["gloss"], row["pos"]
    if not fa or not gloss or not row["pron"]:
        return False
    if fa in BAN_EXACT or only_proper(pos):
        return False
    if re.search(r"\s", fa):
        return False
    if re.search(r"[A-Za-z]", fa):
        return False
    if len(fa) > 45 or len(gloss) > 140:
        return False
    return True

def build():
    all_rows = []
    for label in PAGES:
        all_rows.extend(parse_table(fetch_page(label)))
    by_rank = {r["rank"]:r for r in all_rows}
    seen, deck, skipped = set(), [], []
    for rank in range(1, MAX_RANK + 1):
        r = by_rank.get(rank)
        if not r:
            continue
        key = dedupe_key(r["fa"])
        if key in seen or not useful(r):
            skipped.append((rank,r["fa"],r["pos"],r["gloss"]))
            continue
        seen.add(key)
        deck.append([romanize_ipa(r["pron"], r["fa"]), r["fa"], clean_gloss(r["gloss"], r["fa"]), rank])
        if len(deck) == TOTAL:
            break
    if len(deck) != TOTAL:
        raise RuntimeError(f"only built {len(deck)} usable entries")
    return deck, skipped

def write_chunks(deck):
    OUT_DIR.mkdir(parents=True, exist_ok=True)
    for old in OUT_DIR.glob("miller-*.js"):
        old.unlink()
    for n in range(0, TOTAL, CHUNK):
        chunk = deck[n:n+CHUNK]
        idx = n // CHUNK
        content = "window.FARSI_MILLER_CHUNKS=window.FARSI_MILLER_CHUNKS||[];FARSI_MILLER_CHUNKS.push(" + json.dumps(chunk, ensure_ascii=False, separators=(",",":")) + ");\n"
        (OUT_DIR / f"miller-{idx:02d}.js").write_text(content, encoding="utf-8")
    meta = {
        "count": len(deck),
        "first": deck[:10],
        "last": deck[-3:],
        "max_source_rank": max(x[3] for x in deck),
        "source": "Miller & Aghajanian-Stewart via Wiktionary",
        "single_words_only": True,
    }
    (OUT_DIR / "miller-meta.json").write_text(json.dumps(meta, ensure_ascii=False, indent=2)+"\n", encoding="utf-8")

if __name__ == "__main__":
    deck, skipped = build()
    write_chunks(deck)
    print(f"Built {len(deck)} cards; last source rank {deck[-1][3]}")
    print("First 20:")
    for row in deck[:20]:
        print(row)
    print(f"Skipped {len(skipped)} entries before cutoff")
