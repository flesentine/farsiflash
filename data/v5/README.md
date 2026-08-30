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

## Effective cards 1–1250

The first 100 cards live in `deck.json`. Later ranges use candidate files plus higher-precedence editorial companions such as `.reviewed.mjs`, `.compounds.mjs`, and `.registers.mjs`. The effective loader keeps the strongest editorial layer while preserving earlier layers for provenance.

### Cards 101–300

`candidate → reviewed → compounds → registers`

### Cards 301–750

`candidate → reviewed overlap cleanup → registers`

Step 14 added 450 cards focused on daily-life actions, conversation, social interaction, people, home, food, shopping, transport, health, and technology.

### Cards 751–1250

Step 15 adds exactly 500 practical-life cards:

- 120 verbs / productive constructions
- 60 work
- 45 school
- 75 health
- 65 technology
- 55 social / feelings
- 45 home / errands
- 35 conversation chunks

The first Step-15 cross-deck audit caught 55 duplicate stable IDs and roughly 60 repeated Step-15 Persian forms. Reviewed companion layers replaced the repeated slots with genuinely new concepts rather than disguising duplicates through renamed IDs. Examples include `سرپرست`, `کارفرما`, `تمدید نسخه`, `سرفه خشک`, `آبریزش بینی`, `تایید دو مرحله‌ای`, `حالت تاریک`, `نرم کننده مو`, `دهان شویه`, and `هود`.

Step 15 also exposed an assembly problem with lexicographic filenames (`core-1051...` could sort before `core-301...`). Effective-deck tools now sort batch modules by their numeric starting position.

See `reviews/step-15-cards-751-1250.md` for the detailed milestone review.

## Spoken / formal register policy

Register differences live on one stable concept ID. Milestone supplements add only meaningful high-value pairs rather than manufacturing formal variants for every word.

Step 14 brought the effective policy to 81 pairs through card 750. Step 15 adds 23 more, including:

- `از خونه کار کردن` / `از خانه کار کردن`
- `خوشم میاد` / `خوشم می‌آید`
- `جدی میگم` / `جدی می‌گویم`
- `برام ایمیل کن` / `برایم ایمیل کن`
- `می‌تونی توضیح بدی؟` / `می‌توانی توضیح بدهی؟`
- `کجات درد می‌کنه؟` / `کجایت درد می‌کند؟`
- `رمز وای فای چیه؟` / `رمز وای فای چیست؟`
- `توی راهم` / `در راهم`

## Romanization

`learner-roman-v1` uses simple lowercase ASCII for English-speaking learners: `aa`, `i`, `oo`, and consistent `kh`, `gh`, `sh`, `ch`, `zh`, without academic diacritics, apostrophes, or hyphens.

`tools/lib/v5-romanization.mjs` automatically discovers and merges numbered milestone supplements matching `romanization-stepN.json` and `register-pairs-stepN.json`. This avoids hard-coding each future milestone into the loader. The Romanization audit currently validates the full effective 1,250-card curriculum.

## Automated audits

The v5 workflow validates:

- scoring policy coherence
- core card schema and scores
- exact effective milestone count
- stable-ID uniqueness
- Persian Unicode and source spelling
- score/order eligibility
- compound-first policy
- spoken/formal pair integrity
- learner Romanization
- Miller source normalization

At the Step-15 milestone the effective deck is exactly 1,250 cards. The only remaining duplicate-form warning is the pre-existing first-300 `زن` homographic/content warning; Step 15 has no remaining duplicate IDs or repeated-form warnings of its own.

## Miller source normalization

The original `data/miller-*.js` files remain archival source data. v5 loads them through `tools/lib/v5-miller.mjs`, which applies the 39 confirmed spelling repairs in `miller-spelling-overrides.json`. CI also tracks 9 manually reviewed heuristic exceptions and fails on newly unresolved suspicious spellings.

## Foundation mode

`deck.json` remains `status: "foundation"` while the curriculum is built and reviewed in controlled batches. Do not switch to production curriculum until the full reviewed 2,000 cards exist.

## Safety rule

Do not wire v5 into the live app until progress migration and the preview flag have been implemented and reviewed.
