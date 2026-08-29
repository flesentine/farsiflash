# FarsiFlash v5 curriculum foundation

This directory is intentionally isolated from the live v4 deck. Nothing here is loaded by `index.html` yet.

## Stable concept IDs

Every v5 card must have an explicit semantic ID such as:

- `conversation.hello`
- `pronoun.you.informal`
- `object.pen.ballpoint`
- `verb.call`
- `verb.find`

IDs are permanent identity keys for progress and sync. They must not be generated from Persian spelling, English glosses, rank, or array position. Once an ID ships, changing Persian wording, romanization, examples, register, or ordering must not change the ID. Dot-separated ID segments may contain internal hyphens for readability.

If one concept later needs to split into two meanings, keep the original ID for the closest existing meaning and create a new ID for the new concept. Do not recycle retired IDs.

## Card model

The learner-facing `fa` field is the form we want the learner to recognize first. `spokenFa` and `formalFa` let us model Iranian Persian diglossia explicitly instead of pretending there is only one form.

Each card also carries register and category metadata so conversational usefulness can control sequencing instead of raw corpus frequency alone.

`millerRank` is supporting evidence, not curriculum order.

## Curriculum scoring: everyday-iranian-v1

`scoring-rules.json` defines the selection and ordering policy for v5. Every candidate is scored from 0–100 using six evidence signals:

- 35% contemporary conversational frequency
- 20% dispersion across speakers and situations
- 15% practical everyday usefulness
- 15% generative value (how much language the item unlocks)
- 10% modern relevance
- 5% general written frequency

The Miller frequency rank contributes only to the final 5% written-frequency signal. A government/news word with a very high Miller rank must not outrank a lower-frequency word that is far more useful in ordinary Iranian conversation.

Bonuses favor reusable chunks, productive compound verbs, spoken forms, high-transfer patterns, modern-life vocabulary, and culturally essential taarof. Penalties push formal-only, written-only, literary, news-domain, specialized, redundant, archaic, and obsolete material later. Obsolete or unresolved material is hard-rejected.

The ordering gates are intentionally strict:

- cards 1–100 must be extremely high-value spoken/everyday/neutral material
- cards 1–300 exclude formal/news/specialist material
- cards 1–1000 exclude the reading/news category and require explicit `formal-bridge` justification for formal recognition items
- reading/news vocabulary is held for the final 250-card bridge rather than dominating the early deck

Every v5 card stores the six selection signals and its derived score. `tools/lib/v5-scoring.mjs` calculates scores and position eligibility. `tools/audit-v5-scoring.mjs` verifies that the scoring policy is internally coherent, and `tools/audit-v5-deck.mjs` verifies that stored card scores match the formula and that cards pass the gate for their position.

Category targets sum to exactly 2,000 and act as planning targets rather than rigid quotas. This prevents one corpus domain from crowding out verbs, conversation, food, shopping, health, technology, and other practical areas.

Editorial overrides must retain the numeric score and include a written reason. They are for documented judgment calls, not a way to hide weak evidence.

## Miller source normalization

The original `data/miller-*.js` files are preserved as archival source data. They contain confirmed Persian-script extraction errors from the published frequency list, primarily reversed lam-alef sequences such as `اسالم`, `الزم`, `کالس`, and `سالمت`.

v5 code must load Miller data through `tools/lib/v5-miller.mjs`, which applies `miller-spelling-overrides.json` by source rank before the data is used for curriculum work. Do not read the raw Miller chunks directly when generating v5 cards.

The correction file currently contains 39 confirmed spelling repairs. The scanner also has 9 explicitly reviewed heuristic exceptions where alef-lam is legitimate (for example `حالت`, `عدالت`, `ایالت`, `ولایت`, and `فولاد`). `tools/audit-miller-source.mjs` verifies that every correction still matches its exact raw source entry, that no known corruption remains after normalization, and that newly suspicious spellings fail CI instead of silently entering the curriculum.

## Core 100

Step 8 is complete: `deck.json` now contains the first 100 reviewed-candidate concepts for the v5 survival core while remaining in `foundation` status.

The batch prioritizes greetings, high-value conversational chunks, question words, spoken grammar forms, core verbs and compound verbs, time basics, and a small set of practical nouns. Spoken-first entries include `اون`, `اونا`, `کدوم`, `اگه`, `واسه`, `توی`, `رو`, `اومدن`, `خونه`, and `تموم کردن`, with formal equivalents stored alongside them where useful.

The entire 100-card batch passes the v5 scoring and position gates, Unicode/spelling checks, duplicate-ID checks, and Miller normalization audit. It remains isolated from the live app pending later native-speaker review and the rest of the v5 curriculum build.

## Foundation mode

`deck.json` remains `status: "foundation"` while we build and review the curriculum. The audit allows the first 100 cards at this stage. When the complete reviewed curriculum is ready, change the status to `curriculum`; the audit will then require exactly 2,000 unique cards.

## Safety rule

Do not wire v5 into the live app until progress migration and a preview flag are implemented and reviewed.
