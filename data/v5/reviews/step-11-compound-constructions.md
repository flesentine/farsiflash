# Step 11 — compound construction pass

Goal: prefer complete, productive spoken constructions over isolated light-verb nouns when the learner's primary need is to say or understand the action.

## What changed

The first 100 already handled this well with cards such as `کار کردن`, `فکر کردن`, `پیدا کردن`, `زنگ زدن`, `حرف زدن`, `نگاه کردن`, `گوش دادن`, `کمک کردن`, `جواب دادن`, `شروع کردن`, and `تموم کردن`.

For cards 101–300, Step 11 replaces 15 lower-priority early items with higher-transfer constructions:

- `تصمیم گرفتن` — to decide
- `قرار گذاشتن` — to make plans / arrange to meet
- `گم کردن` — to lose / misplace
- `گم شدن` — to get lost
- `استراحت کردن` — to rest
- `تمرین کردن` — to practice
- `روشن کردن` — to turn on
- `خاموش کردن` — to turn off
- `دوش گرفتن` — to take a shower
- `راه افتادن` — to set off / get going
- `پیام دادن` — to message / text someone
- `عکس گرفتن` — to take a photo
- `پول خرج کردن` — to spend money
- `آماده شدن` — to get ready
- `دیر کردن` — to be late

The displaced cards are not deleted from project history. The Step 9 candidate batch and Step 10 reviewed batch remain in the repository for provenance and can be reconsidered for later positions.

## Enforcement

`data/v5/compound-verb-policy.json` defines constructions that must appear by card 300 and isolated light-verb components that should be deferred until after the construction is established.

`tools/audit-v5-batches.mjs` now selects batch precedence as:

1. `*.compounds.mjs`
2. `*.reviewed.mjs`
3. original candidate batch

The audit fails if a required early construction is missing, lacks the `productive-compound-verb` tag, or if a deferred isolated form such as `جواب`, `شروع`, `کار`, `فکر`, `کمک`, `تصمیم`, or `قرار` consumes an early slot.

This is an ordering policy, not a claim that the isolated nouns are invalid Persian. They can still be taught later when their standalone noun meaning is independently useful.
