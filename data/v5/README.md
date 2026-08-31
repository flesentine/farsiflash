# FarsiFlash v5 curriculum foundation

This directory is intentionally isolated from the live v4 deck. Nothing here is loaded by `index.html` yet.

## Stable concept IDs

Every v5 card has an explicit semantic ID such as `conversation.hello`, `object.pen.ballpoint`, or `verb.call`. IDs are permanent progress/sync keys and must not be derived from mutable Persian spelling, English glosses, rank, or array position.

## Card model

The learner-facing `fa` field is the form we want the learner to recognize first. `spokenFa` and `formalFa` model Iranian Persian diglossia explicitly. `roman` belongs to the primary `fa`; alternate forms receive `spokenRoman` or `formalRoman` in the effective Romanization layer.

Each card carries register, category, selection evidence, and a derived score. `millerRank` is supporting evidence, not curriculum order.

After Step 19 every effective card also carries a complete example trio: `exampleFa`, `exampleRoman`, and `exampleEn`. After Step 20, learner-facing `en` is resolved through the one-sense English meaning policy before generated examples are built.

## Curriculum scoring: everyday-iranian-v1

The v5 score uses:

- 35% contemporary conversational frequency
- 20% dispersion across speakers/situations
- 15% practical everyday usefulness
- 15% generative value
- 10% modern relevance
- 5% general written frequency

Bonuses favor reusable chunks, productive compound verbs, spoken forms, high-transfer patterns, modern-life vocabulary, and culturally important language. Formal-only, literary, news-domain, specialist, archaic, obsolete, and unresolved material is delayed or rejected.

## Effective cards 1–2000

The first 100 cards live in `deck.json`. Later ranges use candidate files plus higher-precedence editorial companions such as `.reviewed.mjs`, `.compounds.mjs`, and `.registers.mjs`. The effective loader keeps the strongest editorial layer while preserving earlier layers for provenance.

### Cards 101–300

`candidate → reviewed → compounds → registers`

The first 300 establish the survival/conversation core, compound-first constructions, spoken/formal pairing, and normalized learner Romanization.

### Cards 301–750

Step 14 added 450 cards focused on daily-life actions, conversation, social interaction, people, home, food, shopping, transport, health, and technology. Overlap cleanup and register layers preserve only genuinely new concepts.

### Cards 751–1250

Step 15 added exactly 500 practical-life cards across verbs, work, school, health, technology, social/feelings, home/errands, and conversation. Cross-deck review replaced duplicate concepts instead of hiding them behind renamed IDs. Effective-deck tools also sort batch files by numeric card position rather than filename order.

### Cards 1251–1750

Step 16 added exactly 500 wider-comprehension cards across verbs, dialogue, grammar/connectors, social language, culture/taarof, travel/services, food, shopping, people, and housing. A separate human-naturalness pass corrected awkward or overly dictionary-like material. No reading/news cards are admitted before position 1751.

### Cards 1751–2000

Step 17 completed the fixed 2,000-card curriculum with:

- 180 reading/news recognition cards
- 15 formal recognition verbs
- 15 formal written connectors
- 20 culture/heritage recognition cards
- 20 lower-priority practical everyday cards

The full 180-card reading/news allocation is deliberately confined to this final bridge.

## Step 18 conversational chunk overlay

Step 18 keeps the curriculum at exactly 2,000 cards while promoting 38 reusable spoken chunks over lower-value concepts at the same positions:

- 8 work-block replacements
- 8 technology-block replacements
- 8 home/errands replacements
- 14 final lower-priority everyday replacements

Twenty-four of the 38 promotions land by card 1,250. Representative additions include `می‌تونی برام بفرستی؟`, `بذار چک کنم`, `نظرت چیه؟`, `صدات نمیاد`, `رسیدی خبر بده`, `چی کار کنیم؟`, `این دفعه با من`, `باورم نمی‌شه`, `یادم بنداز`, `حواست باشه`, `خیلی لطف کردی`, `خدا قوت`, and `ممنون که اومدی`.

The first Step-18 run found five exact phrase collisions with earlier cards. Those were replaced rather than suppressed, leaving Step 18 with zero repeated-form warnings of its own. See `reviews/step-18-conversational-chunks.md`.

## Step 19 example sentence layer

Step 19 established complete learner-example coverage for all 2,000 effective cards. Step 20 now resolves English meanings before generated examples are created, so the current canonical pipeline is:

`effective curriculum → Step 18 chunks → learner Romanization → Step 20 English meanings → Step 19 examples`

Every one of the 2,000 effective cards receives:

- `exampleFa`
- `exampleRoman`
- `exampleEn`

Coverage is built from three sources:

- 38 curated core examples for the highest-value early language
- 252 standalone utterance examples where the card itself is already a useful spoken example
- 1,710 category-aware generated frames for the remaining vocabulary

The final Step-19 audit reports 1,999 unique Persian example strings and zero Step-19 warnings. The only reason the unique count is not 2,000 is the pre-existing duplicate `زن` curriculum form in the first 300.

Generated frames are intentionally a coverage-first editorial layer, not a claim of final native-speaker phrasing. Step 23 can replace any example with an explicit card-level trio; explicit examples automatically take precedence while full coverage remains intact. See `reviews/step-19-example-sentences.md`.

## Step 20 English meaning layer

Step 20 audits all 2,000 learner-facing English meanings under `english-meanings-v1-step20`. The policy treats a gloss as a teaching choice rather than a miniature dictionary entry: one stable concept should teach one intended learner-relevant sense.

The first strict audit found **291 issues**: 289 slash-separated sense/synonym piles and two legitimate expressions containing `or`. The final cleanup handles the 289 slash cases with:

- **215 automatic primary-sense collapses** for straightforward synonym piles
- **74 explicit editorial overrides** where taking the first item would be incomplete, misleading, less useful, or inconsistent with the concept ID

Representative corrections include:

- `باید` → `have to`
- `درست کردن` → `to fix`
- `حوصله داشتن` → `to feel like doing something`
- `بی‌حوصله` → `not in the mood`
- `کلافه‌ام` → `I'm frustrated`
- `بدم میاد` → `I dislike it`
- shopping `موجودی` → `stock availability`
- `حمام` → `bathroom (with shower)`
- `پشت بام` → `rooftop`
- `صندوق` → `checkout counter`
- hotel `پذیرش` → `front desk`
- `خسته نباشی` / `خدا قوت` → `good work`
- `رودربایستی` → `social obligation to be polite`
- `عیدی` → `New Year gift money`

Final CI guarantees all 2,000 meanings are non-empty, at most 58 characters, free of slash/semicolon sense piles and placeholder wording, and have sane punctuation. No exact English meaning occurs four or more times after the cleanup. Generated Step-19 English examples consume the cleaned Step-20 meaning automatically, while curated Step-19 example text remains authoritative. See `reviews/step-20-english-meanings.md`.

## Spoken / formal register policy

Register differences live on one stable concept ID. Milestone supplements add only meaningful high-value pairs rather than manufacturing formal variants for every word.

- through Step 14: 81 pairs
- Step 15: +23 → 104
- Step 16: +40 → 144
- Step 18: +19 → **163 total pairs**

Step-18 examples include:

- `می‌تونی برام بفرستی؟` / `می‌توانی برایم بفرستی؟`
- `بذار چک کنم` / `بگذار بررسی کنم`
- `نظرت چیه؟` / `نظرت چیست؟`
- `صدات نمیاد` / `صدایت نمی‌آید`
- `باز نمی‌شه` / `باز نمی‌شود`
- `چی کار کنیم؟` / `چه کار کنیم؟`
- `باورم نمی‌شه` / `باورم نمی‌شود`
- `یادم بنداز` / `یادم بینداز`
- `حواست باشه` / `حواست باشد`
- `ممنون که اومدی` / `ممنون که آمدی`

## Romanization

`learner-roman-v1` uses simple lowercase ASCII for English-speaking learners: `aa`, `i`, `oo`, and consistent `kh`, `gh`, `sh`, `ch`, `zh`, without academic diacritics, apostrophes, or hyphens.

`tools/lib/v5-romanization.mjs` automatically discovers and merges numbered `romanization-stepN.json` and `register-pairs-stepN.json` supplements. The Romanization audit validates all 2,000 effective cards, all 163 required register pairs, and all 2,000 Step-19 `exampleRoman` values.

## Automated audits

The v5 workflow validates:

- scoring policy coherence
- core card schema and scores
- Step-18 conversational chunk policy
- Step-19 example-sentence coverage and target-form integrity
- Step-20 one-sense English meaning policy and cleanup accounting
- exact 2,000-card effective count
- stable-ID uniqueness
- Persian Unicode and source spelling
- score/order eligibility
- compound-first policy
- spoken/formal pair integrity
- learner Romanization for cards and examples
- Miller source normalization

The only remaining effective-deck repeated-form warning is the pre-existing first-300 `زن` warning. Steps 18–20 have no remaining warnings in their dedicated audits.

## Miller source normalization

The original `data/miller-*.js` files remain archival source data. v5 loads them through `tools/lib/v5-miller.mjs`, which applies the 39 confirmed spelling repairs in `miller-spelling-overrides.json`. CI also tracks 9 manually reviewed heuristic exceptions and fails on newly unresolved suspicious spellings.

## Foundation mode

`deck.json` remains `status: "foundation"` while the curriculum and product layers are reviewed. Completing 2,000 cards, full example coverage, and the English meaning audit does not make v5 live.

## Safety rule

Do not wire v5 into the live app until progress migration and the preview flag have been implemented and reviewed.
