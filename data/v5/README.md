# FarsiFlash v5 curriculum foundation

This directory is intentionally isolated from the live v4 deck. Nothing here is loaded by `index.html` yet.

## Stable concept IDs

Every v5 card has an explicit semantic ID such as `conversation.hello`, `object.pen.ballpoint`, or `verb.call`. IDs are permanent progress/sync keys and must not be derived from mutable Persian spelling, English glosses, rank, or array position.

## Card model

The learner-facing `fa` field is the form we want the learner to recognize first. `spokenFa` and `formalFa` model Iranian Persian diglossia explicitly. `roman` belongs to the primary `fa`; alternate forms receive `spokenRoman` or `formalRoman` in the effective Romanization layer.

Each card carries register, category, selection evidence, and a derived score. `millerRank` is supporting evidence, not curriculum order.

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

`tools/lib/v5-romanization.mjs` automatically discovers and merges numbered `romanization-stepN.json` and `register-pairs-stepN.json` supplements. The Romanization audit validates all 2,000 effective cards and all 163 required register pairs after the Step-18 chunk overlay is applied.

## Automated audits

The v5 workflow validates:

- scoring policy coherence
- core card schema and scores
- Step-18 conversational chunk policy
- exact 2,000-card effective count
- stable-ID uniqueness
- Persian Unicode and source spelling
- score/order eligibility
- compound-first policy
- spoken/formal pair integrity
- learner Romanization
- Miller source normalization

The only remaining effective-deck repeated-form warning is the pre-existing first-300 `زن` warning.

## Miller source normalization

The original `data/miller-*.js` files remain archival source data. v5 loads them through `tools/lib/v5-miller.mjs`, which applies the 39 confirmed spelling repairs in `miller-spelling-overrides.json`. CI also tracks 9 manually reviewed heuristic exceptions and fails on newly unresolved suspicious spellings.

## Foundation mode

`deck.json` remains `status: "foundation"` while the curriculum and product layers are reviewed. Completing 2,000 cards does not make v5 live.

## Safety rule

Do not wire v5 into the live app until progress migration and the preview flag have been implemented and reviewed.
