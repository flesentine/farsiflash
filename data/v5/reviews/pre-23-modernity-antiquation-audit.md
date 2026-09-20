# Pre-Step-23 modernity / antiquation audit

Status: **complete**

This is an additional editorial review requested after Step 22 and before native Iranian review (Step 23). It does **not** replace Step 23.

## Goal

Keep FarsiFlash focused on real contemporary Iranian Persian. Formal/news vocabulary is allowed in the final bridge only when it is still normal in current educated writing, journalism, public administration, or professional use. Literary, archaic, obsolete, or merely dictionary-preserved language should not occupy learner slots.

## External cross-check

The review used contemporary-spoken and modern-learning references rather than treating old written frequency as proof of current usefulness:

- HamBam contemporary spoken Persian corpus (University of Bamberg)
- University of Texas Persian Online colloquial/formal resources and audio vocabulary lists
- current 2026 Iranian/Persian web evidence for everyday expressions and service vocabulary
- current 2026 news evidence for modern formal/news vocabulary such as `در پی`, `نرخ تورم`, and institutional language

## Findings

The final 1751–2000 bridge is predominantly **modern formal/news Persian**, not archaic Persian. Terms such as `قوه قضاییه`, `نرخ تورم`, `امنیت سایبری`, `هوش مصنوعی`, `در پی`, and `به منظور` remain normal contemporary written/news language and were retained.

Two culture cards were judged too old-fashioned/ceremonial for a modern-first 2,000-card deck:

- `صفا آوردی` → `جای شما خالی` — “wish you were there”
- `قدم روی چشم` → `خوشحال شدم دیدمت` — “nice to see you”

An initial attempt to use `خوش بگذره` for the second replacement was rejected by CI because that expression was already present at card 1157; the slot was changed to a genuinely new concept instead.

Current evidence supported retaining several traditional-looking expressions because they are still actively understood/used in modern Iran, including `قابلی نداره`, `فدات`, `مهمون حبیب خداست`, `انعام`, and `به شادی استفاده کنی`.

## Permanent audit

`data/v5/modernity-audit-pre23.json` and `tools/audit-v5-modernity.mjs` now enforce:

- exactly 2,000 effective cards
- zero `archaic`, `obsolete`, or `literary` tags
- zero literary primary-register cards
- no banned archaic forms in primary, spoken, or formal learner-facing fields
- no obsolete-technology entries from the reviewed denylist
- a minimum modern-relevance signal of 40
- the two modern replacements remain present and the superseded IDs remain absent
- explicitly reviewed current traditional expressions remain stable until Step 23 revisits them

The denylist includes examples such as `یار` (as a standalone old literary “beloved/friend” concept), `دلدار`, `همدم`, `گیتی`, `گهگاه`, `فرخنده`, `لیکن`, `خویشتن`, `اندر`, `کنون`, `فی‌المثل`, `علی‌هذا`, plus obsolete technology such as `پیجر`, `فلاپی`, `دیسکت`, `تلگراف`, and `نوار کاست`.

## Final result

- effective cards: **2,000**
- banned antiquation tags: **0**
- banned archaic/obsolete forms: **0**
- cards below modern-relevance floor: **0**
- modernity replacements: **2**
- reviewed-current traditional expressions sampled: **5**
- Step-22 required spoken↔standard pairs: **235**
- Step-20 explicit English overrides after removing the superseded culture card: **73**
- repeated-form warnings: only the pre-existing first-300 `زن` warning

Step 23 remains the final native-Iranian authority for borderline generational, regional, or stylistic judgments.
