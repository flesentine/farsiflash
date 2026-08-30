# Step 12 — Spoken/Formal Register Pairs

Status: complete for the effective first 300 cards.

## Goal

Treat Persian diglossia as explicit curriculum data instead of forcing one surface form to serve both conversation and formal reading.

The rule is:

- if the everyday spoken form materially differs from the standard/formal form, keep both on the same stable concept ID;
- lead with the conversational form when that is the learner's highest-value form;
- keep a standard/formal primary form when it is still common and useful, but add `spokenFa` when ordinary conversation predictably differs;
- do not manufacture register pairs for words whose spoken and standard forms are effectively the same.

## New Step-12 additions

The 101–300 layer adds explicit counterparts for:

- `مادر` ↔ `مامان`
- `پدر` ↔ `بابا`
- `خانواده` ↔ `خونواده`
- `بچه` ↔ `کودک`
- `صبحانه` ↔ `صبحونه`
- `گرسنه‌ام` ↔ `گشنمه`
- `لوکیشن` ↔ `موقعیت مکانی`

These are additions to the many pairs already introduced in earlier steps, including `اون/آن`, `اونا/آنها`, `کدوم/کدام`, `می‌خوام/می‌خواهم`, `می‌شه/می‌شود`, `نون/نان`, `خیابون/خیابان`, `گرون/گران`, `خوندن/خواندن`, and others.

## Coverage refinement from Step 13

The Romanization audit exposed three legitimate spoken/formal pairs that were already present on cards but had not yet been included in the machine-readable Step-12 policy:

- `یه چیزی` ↔ `چیزی`
- `هیچی` ↔ `هیچ چیز`
- `یعنی چی؟` ↔ `یعنی چه؟`

They are now included. This is intentional: later audits are allowed to strengthen an earlier editorial policy when they reveal a real coverage gap.

## Enforcement

`data/v5/register-pairs.json` is the machine-readable policy. It now requires **55 high-value pairs** in the first 300.

`tools/audit-v5-batches.mjs` verifies that each required concept exists and that either:

- the card's primary `fa` is the spoken form and `formalFa` contains the standard/formal counterpart, or
- the card's primary `fa` is the standard/formal form and `spokenFa` contains the conversational counterpart.

The effective batch precedence is now:

`registers > compounds > reviewed > candidate`

This preserves every editorial layer for provenance while making the Step-12 register layer the effective source of truth.

## References

- University of Texas Persian Online, Diglossia overview and rules: https://sites.la.utexas.edu/persian_online_resources/language-specific-grammar/diglossia/
- University of Texas Persian Online, Family vocabulary (`پدر/بابا`, `مادر/مامان`): https://sites.la.utexas.edu/persian_online_resources/vocabulary-lists/the-family/
- University of Texas Persian Online, verbal diglossia examples (`می‌روم → می‌رم`, `می‌خواهم → می‌خوام`): https://sites.la.utexas.edu/persian_online_resources/language-specific-grammar/diglossia-readings/8/
- Persian Language Online, family lesson (`خانواده → خونواده`): https://www.old.persianlanguageonline.com/learn/dariush-is-my-brother.html
- Wiktionary usage note for colloquial Iranian `گشنه/گشنمه`: https://en.wiktionary.org/wiki/%DA%AF%D8%B1%D8%B3%D9%86%D9%87
