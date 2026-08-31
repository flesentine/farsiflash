# Step 20 — English meaning audit

Status: complete on the v5 foundation branch.

## Goal

Audit all 2,000 effective cards so each stable concept teaches one concise learner-relevant English meaning instead of a list of dictionary senses.

The English gloss is a teaching decision, not a dictionary entry. A materially different sense should get a separate stable concept ID rather than being packed into one card with slashes.

## First strict pass

The first Step-20 audit intentionally rejected multi-sense separators and surfaced **291 issues**:

- **289** slash-separated English glosses
- **2** legitimate phrases containing the word `or`: `before food or after?` and `more or less`
- **0** semicolon piles
- **0** over-length glosses

The two `or` cases are natural single expressions, so the final policy does not ban the word `or` globally. It continues to ban slash-separated sense piles.

## Final cleanup model

The final `english-meanings-v1-step20` policy handles the 289 slash cases in two ways:

1. **215 straightforward synonym piles** collapse automatically to the first learner-relevant sense.
2. **74 ambiguous or pedagogically risky cases** use explicit, reasoned overrides.

Every override is keyed by stable concept ID and must change the source gloss. CI fails on stale overrides or missing rationale.

## Representative editorial corrections

Examples of cases where blind first-sense selection would have been misleading:

- `باید` — `must / have to` → **have to**
- `درست کردن` — `to make / fix` → **to fix**
- `راه افتادن` — `to set off / get going` → **to get going**
- `حوصله داشتن` — `to feel like / have patience` → **to feel like doing something**
- `بی‌حوصله` — `impatient / not in the mood` → **not in the mood**
- `کلافه‌ام` — `I am overwhelmed / frustrated` → **I'm frustrated**
- `بدم میاد` — `I hate it / dislike it` → **I dislike it**
- `حمام` — `bathroom / shower room` → **bathroom (with shower)**, keeping it distinct from the earlier restroom/toilet concept
- `پشت بام` — `roof / rooftop` → **rooftop**
- `صندوق` — `checkout / register` → **checkout counter**
- shopping `موجودی` — `balance / stock` → **stock availability**
- hotel `پذیرش` — `reception / front desk` → **front desk**
- `ردش کردم` — `I missed it / passed it` → **I missed the turn**
- `بدم میاد` is deliberately softer than English *hate* in this learner-facing gloss
- `خسته نباشی` and `خدا قوت` use **good work** as the functional learner translation rather than a long literal rendering
- `رودربایستی` uses **social obligation to be polite** to explain the cultural idea rather than a vague synonym pile
- `عیدی` uses **New Year gift money** for the common Iranian cultural sense
- `عوارضی` uses **toll booth** for the practical travel concept
- `تحویل حضوری` uses **in-person pickup** for the transaction context

## Canonical pipeline

Step 20 is not a side report. `tools/lib/v5-examples.mjs` now applies the Step-20 meaning layer before generated examples are created. This means generic `exampleEn` text is based on the same audited one-sense English meaning shown on the card.

Curated Step-19 example text still has precedence and is not rewritten automatically.

Effective learner pipeline after Step 20:

`effective curriculum → Step 18 chunks → learner Romanization → Step 20 English meanings → Step 19 examples`

## Automated guarantees

`tools/audit-v5-meanings.mjs` now checks the exact effective 2,000-card deck and enforces:

- all cards have a non-empty English meaning
- no slash-separated final meanings
- no semicolon-separated sense piles
- maximum 58 characters
- no placeholder/vague markers such as TODO, TBD, unknown, various, or etc.
- balanced parentheses and sane edge punctuation
- every explicit override points to a real concept, changes the source meaning, and has editorial rationale
- cleanup accounting covers every source slash case
- repeated exact English meanings occurring four or more times are surfaced for review

Final audit result:

- **2,000 cards audited**
- **289 source slash glosses**
- **215 automatic primary-sense collapses**
- **74 explicit editorial overrides**
- **0 final slash piles**
- **0 over-length glosses**
- **0 exact-duplicate English groups occurring 4+ times**

The separate pre-existing Persian-form warning for `زن` is unrelated to English meaning quality and remains for later curriculum review.

## Scope boundary

Step 20 audits the learner-facing English meaning. Step 23 still performs native Iranian review of Persian naturalness, spoken register, and examples. No live-v4 wiring changes are part of this step.
