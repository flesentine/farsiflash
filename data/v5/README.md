# FarsiFlash v5 curriculum foundation

This directory is intentionally isolated from the live v4 deck. Nothing here is loaded by `index.html` yet.

## Stable concept IDs

Every v5 card must have an explicit semantic ID such as:

- `conversation.hello`
- `pronoun.you.informal`
- `object.pen.ballpoint`
- `verb.call`
- `verb.find`

IDs are permanent identity keys for progress and sync. They must not be generated from Persian spelling, English glosses, rank, or array position. Once an ID ships, changing Persian wording, romanization, examples, register, or ordering must not change the ID.

If one concept later needs to split into two meanings, keep the original ID for the closest existing meaning and create a new ID for the new concept. Do not recycle retired IDs.

## Card model

The learner-facing `fa` field is the form we want the learner to recognize first. `spokenFa` and `formalFa` model Iranian Persian diglossia explicitly. `roman` always belongs to the primary `fa`; alternate forms use `spokenRoman` or `formalRoman` through the effective Romanization layer.

Each card also carries register and category metadata so conversational usefulness controls sequencing instead of raw corpus frequency alone. `millerRank` is supporting evidence, not curriculum order.

## Curriculum scoring: everyday-iranian-v1

`scoring-rules.json` defines the selection and ordering policy for v5. Every candidate is scored from 0–100 using six evidence signals:

- 35% contemporary conversational frequency
- 20% dispersion across speakers and situations
- 15% practical everyday usefulness
- 15% generative value
- 10% modern relevance
- 5% general written frequency

The Miller frequency rank contributes only to the final 5% written-frequency signal. A government/news word with a very high Miller rank must not outrank a lower-frequency word that is far more useful in ordinary Iranian conversation.

Bonuses favor reusable chunks, productive compound verbs, spoken forms, high-transfer patterns, modern-life vocabulary, and culturally essential taarof. Penalties push formal-only, written-only, literary, news-domain, specialized, redundant, archaic, and obsolete material later. Obsolete or unresolved material is hard-rejected.

The ordering gates are intentionally strict:

- cards 1–100 must be extremely high-value spoken/everyday/neutral material
- cards 1–300 exclude formal/news/specialist material
- cards 1–1000 exclude the reading/news category and require explicit `formal-bridge` justification for formal recognition items
- reading/news vocabulary is held for the final 250-card bridge rather than dominating the early deck

Every v5 card stores the six selection signals and its derived score. `tools/lib/v5-scoring.mjs` calculates scores and position eligibility. The audit scripts verify that stored scores match the formula and that cards pass the gate for their position.

Category targets sum to exactly 2,000 and act as planning targets rather than rigid quotas.

## Effective cards 1–750

The first 100 cards remain in `deck.json`.

Cards 101–300 preserve multiple editorial layers for provenance:

`candidate → reviewed → compounds → registers`

Cards 301–750 use the same pattern:

`candidate → reviewed overlap cleanup → registers`

At the Step-14 milestone the effective deck contains exactly 750 cards. The 450 new cards are intentionally action-heavy:

- 120 verbs / verb constructions
- 45 conversational chunks
- 40 social concepts
- 35 people / roles
- 45 home concepts
- 50 food concepts
- 40 shopping concepts/chunks
- 45 travel/transport concepts/chunks
- 15 health concepts
- 15 technology concepts

The first 750 are validated together for stable IDs, Persian forms, score/order eligibility, compound-first policy, register pairs, learner Romanization, and Miller normalization.

Step 14 also extends the spoken/formal policy from 55 to 81 codified pairs. See `reviews/step-14-cards-301-750.md` for the detailed rationale and overlap corrections.

## Romanization

`learner-roman-v1` uses simple lowercase ASCII for English-speaking learners:

- `aa`, `i`, `oo` for long vowels
- `kh`, `gh`, `sh`, `ch`, `zh`
- no academic diacritics
- no apostrophes or hyphens
- spaces for word boundaries

`tools/lib/v5-romanization.mjs` merges the base Romanization policy with milestone supplements such as `romanization-step14.json` and applies it to the assembled effective deck. `tools/audit-v5-romanization.mjs` currently validates all 750 effective cards.

## Miller source normalization

The original `data/miller-*.js` files are preserved as archival source data. They contain confirmed Persian-script extraction errors from the published frequency list, primarily reversed lam-alef sequences such as `اسالم`, `الزم`, `کالس`, and `سالمت`.

v5 code must load Miller data through `tools/lib/v5-miller.mjs`, which applies `miller-spelling-overrides.json` by source rank before the data is used for curriculum work. Do not read the raw Miller chunks directly when generating v5 cards.

The correction file currently contains 39 confirmed spelling repairs. The scanner also has 9 explicitly reviewed heuristic exceptions. `tools/audit-miller-source.mjs` verifies that every correction still matches its exact raw source entry and that newly suspicious spellings fail CI.

## Foundation mode

`deck.json` remains `status: "foundation"` while the curriculum is built and reviewed in controlled batches. Do not switch to `curriculum` until the full reviewed 2,000-card deck exists.

## Safety rule

Do not wire v5 into the live app until progress migration and a preview flag are implemented and reviewed.
