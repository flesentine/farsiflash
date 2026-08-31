# FarsiFlash v5 — first 300 review

Status: reviewed candidate curriculum; not live.

## Review goal

Challenge the first 300 cards against the actual v5 product goal: modern everyday Iranian Persian that maximizes early speaking and listening power. Structural CI passing was necessary but not sufficient; this pass focused on naturalness, learner value, sense selection, spoken/formal register, and opportunity cost.

## Evidence used

- FarsiFlash v5 scoring policy and the full effective 300-card candidate deck.
- University of Texas Persian Online conversational materials, including its explicit colloquial/formal distinctions, greetings, food dialogue, imperatives, and vocabulary resources.
- HamBam, the Hamedan–Bamberg Corpus of Contemporary Spoken Persian, as supporting evidence for treating spoken Persian as materially different from formal written Persian.
- Conversational Iranian-Persian teaching material for culturally essential expressions such as `خسته نباشی` and `دستت درد نکنه`.

Reference links:
- https://sites.la.utexas.edu/persian_online_resources/
- https://sites.la.utexas.edu/persian_online_resources/culture-video/greetings/
- https://sites.la.utexas.edu/persian_online_resources/culture-video/food/
- https://sites.la.utexas.edu/persian_online_resources/language-specific-grammar/diglossia-readings/
- https://multicast.aspra.uni-bamberg.de/resources/hambam/
- https://www.chaiandconversation.com/speak-persian/common-persian-sayings-and-expressions

## Findings

### 1. The first 100 were fundamentally strong

The survival core already emphasized spoken forms, question words, high-transfer grammar, and productive verbs. It was retained intact during this review.

### 2. Cards 101–300 over-invested in isolated objects

Several household objects, specific fruits, and signage/direction nouns were individually valid Persian but had lower early communicative value than missing chunks and grammar. Early slots are expensive; a learner benefits more from `یعنی چی؟` than from memorizing another piece of furniture.

### 3. Several cards were technically valid but pedagogically weak

Examples:

- `سبزی` was too broad/misleading as a generic gloss for “vegetables”; the reviewed card uses `سبزیجات` for that sense.
- bare `گرسنه` and `تشنه` were replaced with usable utterances `گرسنه‌ام` and `تشنه‌ام`.
- `کت` was a poor generic card for “jacket”; the reviewed early card uses `کاپشن`.
- `نقد` was replaced by everyday payment-form `نقدی`.
- bare infinitive `تونستن` was less useful than the immediately speakable `می‌تونم`.

### 4. Important Iranian conversational/cultural chunks were missing

The review promoted:

- `چه خبر؟` — what's up / what's going on?
- `خسته نباشی` — appreciation for someone's effort
- `دستت درد نکنه` — thanks for doing that
- `بفرما` — here you go / please
- `نوش جان` — enjoy your meal
- `مواظب باش` — be careful
- `واقعا؟` — really?
- `جدی؟` — seriously?
- `حتما` — definitely / sure
- `شاید` — maybe

### 5. Learner-repair language was underrepresented

The review promoted phrases a learner can use while actively learning Persian:

- `یعنی چی؟` — what does it mean?
- `دوباره بگو` — say it again
- `کجاست؟` — where is it?
- `ساعت چنده؟` — what time is it?
- `چند سالته؟` — how old are you?
- `چقدر می‌شه؟` — how much does it come to?

### 6. High-transfer grammar beat specific nouns

Three specific fruit cards were deferred to make room for:

- `همه` — all / everyone
- `یه چیزی` — something
- `هیچی` — nothing / anything

These appear in far more situations and create more useful sentences.

### 7. The verb inventory still had opportunity-cost problems

The review promoted highly productive everyday verbs:

- `گذاشتن` — put / place
- `برداشتن` — pick up / take
- `درست کردن` — make / fix
- `عوض کردن` — change / replace

Less urgent or redundant early entries were deferred.

## Changes

`core-101-300.reviewed.mjs` contains 31 reviewed replacements while preserving exactly 200 cards in the 101–300 batch. The original `core-101-300.mjs` candidate remains in the repository for provenance.

The batch audit automatically prefers a `*.reviewed.mjs` companion over its original candidate file, so the effective 300-card curriculum now uses the reviewed cards without double-counting the original batch.

## Result

- effective cards: 300
- reviewed replacements: 31
- first 100 changed: 0
- live v4 changed: no
- first-300 ordering gate: pass
- stable-ID/duplicate audit: pass
- Persian Unicode audit: pass
- score derivation audit: pass
- Miller normalization audit: pass

## Remaining caution

This is a strong corpus- and pedagogy-informed review, but final production batches should still receive native Iranian review, especially for register, regional preference, and whether a phrase feels maximally natural in contemporary everyday speech.
