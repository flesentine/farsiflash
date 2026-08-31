# Step 14 — Cards 301–750

Status: complete as the reviewed daily-life candidate stage.

## Goal

Expand the reviewed 300-card conversational core to 750 concepts without falling back to raw frequency ordering.

The 301–750 stage follows the `daily-750` purpose in `scoring-rules.json`: high-value compound verbs, home, shopping, restaurants/food, transport, social interaction, health, and modern daily technology.

## Category mix

The 450 new slots are deliberately weighted toward actions and interaction:

- 120 verbs / verb constructions
- 45 conversational chunks
- 40 social concepts
- 35 people / roles
- 45 home concepts
- 50 food concepts
- 40 shopping concepts and chunks
- 45 travel / transport concepts and chunks
- 15 health concepts
- 15 technology concepts

Total: 450 new cards, producing 750 effective v5 cards.

## Compound-first emphasis

The new stage includes productive constructions such as:

- `ادامه دادن`
- `توضیح دادن`
- `نگه داشتن`
- `قرض گرفتن / قرض دادن`
- `ثبت نام کردن`
- `تحویل گرفتن / تحویل دادن`
- `منتظر موندن`
- `خجالت کشیدن`
- `حوصله داشتن / حوصله نداشتن`
- `اجازه گرفتن / اجازه دادن`
- `یادداشت برداشتن`
- `آلارم گذاشتن`
- `به اشتراک گذاشتن`
- `زباله رو بیرون بردن`
- `به برق زدن / از برق کشیدن`

This follows the University of Texas Persian reference treatment of complex/compound verbs as a central part of Persian verb vocabulary.

## Overlap cleanup

The first audit correctly caught 30 stable-ID overlaps and several repeated Persian forms from cards 1–300. None were hidden by renaming IDs.

`core-301-750.reviewed.mjs` replaces those repeated slots with genuinely new concepts. Examples include:

- repeated `پوشیدن` → `لباس پوشیدن`
- repeated `شستن` → `ظرف شستن`
- repeated `باز کردن` → `به برق زدن`
- repeated `چای` → `آرد`
- repeated `قهوه` → `سرکه`
- repeated `تاکسی` → `ترمینال`
- repeated `اپلیکیشن` → `ویس`

The original candidate file remains for provenance.

## Register pairing

`core-301-750.registers.mjs` adds 26 meaningful spoken/standard pairs, including:

- `رسوندن / رساندن`
- `منتظر موندن / منتظر ماندن`
- `حق با توئه / حق با تو است`
- `معلومه / معلوم است`
- `نمی‌دونستم / نمی‌دانستم`
- `الان میام / الان می‌آیم`
- `کجا میری؟ / کجا می‌روی؟`
- `چقدر طول می‌کشه؟ / چقدر طول می‌کشد؟`
- `خیلی گرونه / خیلی گران است`
- `از کدوم طرف؟ / از کدام طرف؟`

This brings the codified v5 register-pair policy to 81 concepts through card 750.

## Romanization

All 750 effective cards run through `learner-roman-v1`. Step-14 alternate forms live in `romanization-step14.json` and are merged with the base Romanization policy by `tools/lib/v5-romanization.mjs`.

## Audit status

The effective 750-card milestone checks:

- exactly 750 effective concepts
- stable ID uniqueness
- Persian-form duplication warnings across all batches
- Persian Unicode / Arabic-character normalization
- score recomputation and first-1000 ordering gate eligibility
- first-300 compound policy
- all codified register pairs
- learner Romanization across all 750 cards
- Miller source normalization

The only remaining Persian-form warning is the pre-existing first-300 `زن` homograph/duplicate, not a Step-14 overlap.

## Sources

- University of Texas Persian Online — Verbs: https://sites.la.utexas.edu/persian_online_resources/verbs/
- University of Texas Persian Online — Complex & Compound Verbs: https://sites.la.utexas.edu/persian_online_resources/verbs/complex-compound-verbs/
- University of Texas Persian Online — Vocabulary Lists: https://sites.la.utexas.edu/persian_online_resources/vocabulary-lists/
