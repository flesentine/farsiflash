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

The learner-facing `fa` field is the form we want the learner to recognize first. `spokenFa` and `formalFa` let us model Iranian Persian diglossia explicitly instead of pretending there is only one form.

Each card also carries register and category metadata so conversational usefulness can control sequencing instead of raw corpus frequency alone.

`millerRank` is supporting evidence, not curriculum order. `spokenScore` is a 0–100 editorial score for everyday conversational value.

## Foundation mode

`deck.json` starts with `status: "foundation"` and zero production cards. The audit allows that while we build infrastructure. When the first reviewed curriculum is ready, change the status to `curriculum`; the audit will then require exactly 2,000 unique cards.

## Safety rule

Do not wire v5 into the live app until progress migration and a preview flag are implemented and reviewed.
