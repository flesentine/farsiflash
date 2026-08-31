# Step 13 — Learner Romanization normalization

Status: complete for the effective first 300 cards.

## Goal

Use one predictable ASCII Romanization system for English-speaking learners while preserving Persian script as the authoritative form.

## learner-roman-v1

- `aa` for the long Persian a sound
- `i` for the long i sound
- `oo` for the long u sound
- `kh`, `gh`, `sh`, `ch`, `zh` consistently
- `gh` for modern Iranian Persian ق / غ unless a fixed loanword spelling is clearer
- no academic diacritics
- no apostrophes
- no hyphens; use spaces between words
- lowercase only
- Romanization follows the Persian form actually displayed on the card

## Register-aware Romanization

`roman` always belongs to the card's primary `fa` value.

When a card carries an alternate register form:

- `spokenFa` gets `spokenRoman`
- `formalFa` gets `formalRoman`

The primary form is not duplicated into an alternate Romanization field.

Examples:

- `می‌خوام` → `mikhaam`; formal `می‌خواهم` → `mikhaaham`
- `مادر` → `maadar`; spoken `مامان` → `maamaan`
- `نون` → `noon`; formal `نان` → `naan`
- `خوندن` → `khoondan`; formal `خواندن` → `khaandan`
- `گرسنه‌ام` → `gorosne am`; spoken `گشنمه` → `goshname`

## Specific cleanup caught in this pass

The cross-cutting normalizer removes inconsistent punctuation and applies a small number of explicit pronunciation/readability fixes, including:

- `saa'at` → `saat`
- `ba'dazzohr` → `bad az zohr`
- `ya'ni chi?` → `yani chi?`
- `saaat chande?` → `saat chande?`
- `vaay-faay` → `vaay faay`

## Register coverage improvement discovered during Step 13

The Romanization audit exposed three meaningful spoken/formal pairs that Step 12 had not yet codified:

- `یه چیزی` / `چیزی`
- `هیچی` / `هیچ چیز`
- `یعنی چی؟` / `یعنی چه؟`

They are now included in the register policy, bringing the first-300 register-pair coverage from 52 to 55 concepts.

## Enforcement

`tools/lib/v5-romanization.mjs` is the canonical effective-deck Romanization transform.

`tools/audit-v5-romanization.mjs` validates:

- exactly 300 effective cards at the current milestone
- lowercase ASCII learner Romanization
- no apostrophes or hyphens
- no repeated spaces or suspicious triple vowels
- all primary overrides are current
- every register pair has an alternate Romanization
- no stale alternate mappings
- `spokenFa`/`formalFa` and their Romanization fields remain aligned

The CI workflow runs this audit on every relevant v5 change.
