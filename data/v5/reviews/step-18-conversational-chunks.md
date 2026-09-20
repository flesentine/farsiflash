# Step 18 — Conversational chunk promotion pass

Status: complete reviewed overlay on the fixed 2,000-card v5 curriculum.

## Goal

Increase real conversational power without growing the deck past 2,000 cards. Step 18 replaces lower-value concepts at their existing positions with reusable modern Iranian Persian chunks. The replaced source concepts remain in the earlier candidate/review files for provenance; `conversational-chunks-step18.json` is an editorial overlay applied after the 2,000-card deck is assembled.

## Scope

Exactly 38 concepts are promoted:

- 8 replacements in the work block
- 8 replacements in the technology block
- 8 replacements in the home/errands block
- 14 replacements in the final lower-priority everyday block

This puts 24 of the new chunks at or before card 1,250 and 14 in the final 20 positions. Card positions and total deck size do not change.

Representative promoted chunks include:

- `می‌تونی برام بفرستی؟` — can you send it to me?
- `بذار چک کنم` — let me check
- `نظرت چیه؟` — what do you think?
- `فکر کنم آره` — I think so
- `صدات نمیاد` — I can't hear you
- `صدات قطع و وصل می‌شه` — your voice keeps cutting out
- `دوباره بفرست` — send it again
- `الان می‌فرستم` — I'm sending it now
- `بی‌زحمت` — please / if you don't mind
- `رسیدی خبر بده` — let me know when you arrive
- `چی کار کنیم؟` — what should we do?
- `این دفعه با من` — this one's on me
- `باورم نمی‌شه` — I can't believe it
- `جدی می‌گی؟` — are you serious?
- `یادم بنداز` — remind me
- `یادم نمیاد` — I can't remember
- `حواست باشه` — keep it in mind / be careful
- `خیلی لطف کردی` — that was very kind of you / thanks
- `خدا قوت` — good work / may God give you strength
- `ممنون که اومدی` — thanks for coming

## Collision review

The first Step-18 full-deck run found five exact Persian-form collisions with earlier cards:

- `یه لحظه`
- `الان برمی‌گردم`
- `نگران نباش`
- `یادم رفت`
- `سلام برسون`

Those were not suppressed or relabeled. They were replaced with genuinely new chunks:

- `بی‌زحمت`
- `رسیدی خبر بده`
- `این دفعه با من`
- `یادم بنداز`
- `حواست باشه`

After that cleanup, Step 18 adds no duplicate-form warnings of its own.

## Spoken / standard pairing

Nineteen promoted chunks have meaningful spoken↔standard counterparts in `register-pairs-step18.json`, with matching alternate learner Romanization in `romanization-step18.json`. This raises the effective register policy from 144 to 163 pairs.

Examples include:

- `می‌تونی برام بفرستی؟` / `می‌توانی برایم بفرستی؟`
- `بذار چک کنم` / `بگذار بررسی کنم`
- `اصلاً نمی‌دونم` / `اصلاً نمی‌دانم`
- `نظرت چیه؟` / `نظرت چیست؟`
- `صدات نمیاد` / `صدایت نمی‌آید`
- `باز نمی‌شه` / `باز نمی‌شود`
- `چی کار کنیم؟` / `چه کار کنیم؟`
- `باورم نمی‌شه` / `باورم نمی‌شود`
- `جدی می‌گی؟` / `جدی می‌گویی؟`
- `یادم بنداز` / `یادم بینداز`
- `یادم نمیاد` / `یادم نمی‌آید`
- `حواست باشه` / `حواست باشد`
- `ممنون که اومدی` / `ممنون که آمدی`

## Audit result

The Step-18 CI gate verifies:

- exactly 38 promotions
- exactly 24 promotions by card 1,250
- exactly 2,000 effective cards
- promoted target concepts disappear from the effective deck
- new IDs/forms are unique
- every promoted card is a reusable conversation chunk with visible editorial promotion rationale
- 19 Step-18 register pairs have matching alternate Romanization
- full scoring, stable-ID, Persian/Unicode, ordering, compound, register, Romanization, and Miller checks still pass

The only remaining full-deck repeated-form warning is the pre-existing first-300 `زن` warning.
