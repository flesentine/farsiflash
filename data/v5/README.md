# FarsiFlash v5 curriculum foundation

This directory is intentionally isolated from the live v4 deck. Nothing here is loaded by `index.html` yet.

## Stable concept IDs

Every v5 card has an explicit semantic ID such as `conversation.hello`, `object.pen.ballpoint`, or `verb.call`. IDs are permanent progress/sync keys and must not be derived from mutable Persian spelling, English glosses, rank, or array position.

## Card model

The learner-facing `fa` field is the form we want the learner to recognize first. `spokenFa` and `formalFa` model Iranian Persian diglossia explicitly. `roman` belongs to the primary `fa`; alternate forms receive `spokenRoman` or `formalRoman` in the effective Romanization layer.

Each card carries register, category, selection evidence, and a derived score. `millerRank` is supporting evidence, not curriculum order.

After Step 19 every effective card also carries a complete example trio: `exampleFa`, `exampleRoman`, and `exampleEn`. Step 20 resolves learner-facing English meanings to one intended sense. Step 21 modernizes the curriculum, and Step 22 resolves spoken/standard register before learner Romanization and generated examples are finalized.

## Curriculum scoring: everyday-iranian-v1

The v5 score uses:

- 35% contemporary conversational frequency
- 20% dispersion across speakers/situations
- 15% practical everyday usefulness
- 15% generative value
- 10% modern relevance
- 5% general written frequency

Bonuses favor reusable chunks, productive compound verbs, spoken forms, high-transfer patterns, modern-life vocabulary, and culturally important language. Formal-only, literary, news-domain, specialist, archaic, obsolete, and unresolved material is delayed or rejected.

## Effective cards 1–2000

The first 100 cards live in `deck.json`. Later ranges use candidate files plus higher-precedence editorial companions such as `.reviewed.mjs`, `.compounds.mjs`, and `.registers.mjs`. The effective loader keeps the strongest editorial layer while preserving earlier layers for provenance.

### Cards 101–300

`candidate → reviewed → compounds → registers`

The first 300 establish the survival/conversation core, compound-first constructions, spoken/formal pairing, and normalized learner Romanization.

### Cards 301–750

Step 14 added 450 cards focused on daily-life actions, conversation, social interaction, people, home, food, shopping, transport, health, and technology. Overlap cleanup and register layers preserve only genuinely new concepts.

### Cards 751–1250

Step 15 added exactly 500 practical-life cards across verbs, work, school, health, technology, social/feelings, home/errands, and conversation. Cross-deck review replaced duplicate concepts instead of hiding them behind renamed IDs. Effective-deck tools also sort batch files by numeric card position rather than filename order.

### Cards 1251–1750

Step 16 added exactly 500 wider-comprehension cards across verbs, dialogue, grammar/connectors, social language, culture/taarof, travel/services, food, shopping, people, and housing. A separate human-naturalness pass corrected awkward or overly dictionary-like material. No reading/news cards are admitted before position 1751.

### Cards 1751–2000

Step 17 completed the fixed 2,000-card curriculum with:

- 180 reading/news recognition cards
- 15 formal recognition verbs
- 15 formal written connectors
- 20 culture/heritage recognition cards
- 20 lower-priority practical everyday cards

The full 180-card reading/news allocation is deliberately confined to this final bridge.

## Step 18 conversational chunk overlay

Step 18 keeps the curriculum at exactly 2,000 cards while promoting 38 reusable spoken chunks over lower-value concepts at the same positions. Twenty-four of the 38 promotions land by card 1,250. Representative additions include `می‌تونی برام بفرستی؟`, `بذار چک کنم`, `نظرت چیه؟`, `صدات نمیاد`, `رسیدی خبر بده`, `چی کار کنیم؟`, `این دفعه با من`, `باورم نمی‌شه`, `یادم بنداز`, `حواست باشه`, `خیلی لطف کردی`, `خدا قوت`, and `ممنون که اومدی`.

The first Step-18 run found five exact phrase collisions with earlier cards. Those were replaced rather than suppressed, leaving Step 18 with zero repeated-form warnings of its own. See `reviews/step-18-conversational-chunks.md`.

## Step 19 example sentence layer

Every one of the 2,000 effective cards receives `exampleFa`, `exampleRoman`, and `exampleEn`.

Coverage is built from:

- 38 curated core examples
- 252 standalone spoken utterances
- 1,710 category-aware generated frames

The final Step-19 audit reports 1,999 unique Persian example strings and zero Step-19 warnings. The only reason the unique count is not 2,000 is the pre-existing duplicate `زن` curriculum form in the first 300. Generated frames are a coverage-first editorial layer; Step 23 can replace them with native-reviewed explicit examples without losing coverage. See `reviews/step-19-example-sentences.md`.

## Step 20 English meaning layer

Step 20 audits all 2,000 learner-facing English meanings under `english-meanings-v1-step20`. The original strict pass found 289 slash-separated sense/synonym piles. It resolved them with 215 safe primary-sense collapses and 74 explicit editorial overrides where choosing the first item would be incomplete or misleading.

Representative corrections include `باید` → `have to`, `درست کردن` → `to fix`, `حوصله داشتن` → `to feel like doing something`, `بی‌حوصله` → `not in the mood`, shopping `موجودی` → `stock availability`, `حمام` → `bathroom (with shower)`, hotel `پذیرش` → `front desk`, and `رودربایستی` → `social obligation to be polite`.

CI guarantees all 2,000 meanings are non-empty, at most 58 characters, free of slash/semicolon sense piles and placeholder wording, and have sane punctuation. See `reviews/step-20-english-meanings.md`.

## Step 21 modern-life coverage layer

Step 21 audits the fixed 2,000-card curriculum across 10 contemporary-life domains. It promotes 11 high-value concepts without increasing deck size or changing the first 1,250 cards.

New guaranteed coverage includes:

- `کارت به کارت` — card-to-card transfer
- `همراه بانک` — mobile banking
- `رمز پویا` — one-time card password
- `شماره شبا` — Sheba (IBAN) number
- `کیف پول دیجیتال` — digital wallet
- `پرداخت قبض` — bill payment
- `کد ملی` — national ID number
- `تاکسی اینترنتی` — ride-hailing taxi
- `درخواست سفر` — ride request
- `راننده رسید` — the driver arrived
- `لغو سفر` — cancel a ride

The integrated audit reports 99 `modern-life`-tagged cards and all 10/10 domains meeting their anchor requirements. See `reviews/step-21-modern-life-coverage.md`.

## Step 22 full register audit

Step 22 runs after the Step-18 and Step-21 overlays so it reviews the actual modern learner deck rather than superseded source cards.

The initial diagnostic confirmed that structural placement was already strong: there were **zero formal, written, literary, or reading/news primary cards before position 1751**. The main remaining problem was inconsistent spoken labeling and incomplete diglossia metadata.

Step 22 adds **72 meaningful spoken↔standard pairs**, raising the enforced policy from **163 to 235 pairs**. New examples include:

- `مرسی` / `متشکرم`
- `آره` / `بله`
- `باشه` / `بسیار خوب`
- `بریم` / `برویم`
- `کِی` / `چه زمانی`
- `اپ` / `برنامه`
- `می‌خوام پرو کنم` / `می‌خواهم پرو کنم`
- `چی شده؟` / `چه شده؟`
- `می‌شه دوباره بگی؟` / `می‌شود دوباره بگویی؟`
- `منظورت چیه؟` / `منظورت چیست؟`
- `بذار ببینم` / `بگذار ببینم`
- `منو در جریان بذار` / `من را در جریان بگذار`
- `مهمونی` / `مهمانی`
- `مهمون‌داری` / `مهمان‌داری`

The audit also found **67 productive spoken-primary constructions** whose colloquial syntax is real and useful but where manufacturing a mechanical formal twin would add noise. These are explicitly reviewed and normalized to `register: "spoken"` without a fake counterpart. Examples include `زباله رو بیرون بردن`, `صفحه رو به اشتراک گذاشتن`, `کار رو تحویل دادن`, `فایل رو ذخیره کردن`, `گوشی رو شارژ کردن`, `پست رو لایک کردن`, and `حساب رو تقسیم کردن`.

A further **102 spoken concepts** are explicitly reviewed as intentionally unpaired because the ordinary standard form is effectively unchanged or a supposed formal alternative would be a different lexical concept. CI freezes both reviewed sets, so a newly introduced unpaired spoken form fails until it is either paired or deliberately reviewed.

Final Step-22 result:

- 2,000 effective cards
- 235 required spoken↔standard pairs
- 72 new Step-22 pairs
- 102 reviewed unpaired spoken concepts
- 67 reviewed colloquial spoken-primary concepts
- 169 approved unpaired spoken concepts total
- 66 paired primaries normalized to `spoken`
- 67 reviewed colloquial primaries normalized to `spoken`
- 0 colloquial-label errors
- 0 pair-primary mismatches
- 0 pair-label mismatches
- 0 formal/written/literary cards before 1751
- 0 reading/news cards before 1751

See `reviews/step-22-register-audit.md`.

## Canonical learner pipeline

The effective learner-facing pipeline is now:

`base curriculum → Step 18 conversational chunks → Step 21 modern-life promotions → Step 22 register normalization → learner Romanization → Step 20 English meanings → Step 19 examples`

## Spoken / formal register policy

Register differences live on one stable concept ID. Milestone supplements add only meaningful pairs rather than manufacturing a formal variant for every word.

- through Step 14: 81 pairs
- Step 15: +23 → 104
- Step 16: +40 → 144
- Step 18: +19 → 163
- Step 22: +72 → **235 total pairs**

## Romanization

`learner-roman-v1` uses simple lowercase ASCII for English-speaking learners: `aa`, `i`, `oo`, and consistent `kh`, `gh`, `sh`, `ch`, `zh`, without academic diacritics, apostrophes, or hyphens.

`tools/lib/v5-romanization.mjs` automatically discovers and merges numbered `romanization-stepN.json` and `register-pairs-stepN.json` supplements. The Romanization audit validates all 2,000 effective cards, all **235** required register pairs, and all 2,000 Step-19 `exampleRoman` values.

## Automated audits

The v5 workflow validates:

- scoring policy coherence
- core card schema and scores
- Step-18 conversational chunk policy
- Step-19 example-sentence coverage and target-form integrity
- Step-20 one-sense English meaning policy and cleanup accounting
- Step-21 modern-life coverage
- Step-22 full register placement, pair coverage, reviewed unpaired forms, and colloquial labeling
- exact 2,000-card effective count
- stable-ID uniqueness
- Persian Unicode and source spelling
- score/order eligibility
- compound-first policy
- learner Romanization for cards and examples
- Miller source normalization

The only remaining effective-deck repeated-form warning is the pre-existing first-300 `زن` warning. Steps 18–22 introduce no new repeated-form warning in their dedicated audits.

## Miller source normalization

The original `data/miller-*.js` files remain archival source data. v5 loads them through `tools/lib/v5-miller.mjs`, which applies the 39 confirmed spelling repairs in `miller-spelling-overrides.json`. CI also tracks 9 manually reviewed heuristic exceptions and fails on newly unresolved suspicious spellings.

## Foundation mode

`deck.json` remains `status: "foundation"` while the curriculum and product layers are reviewed. Completing Steps 1–22 does not make v5 live.

## Safety rule

Do not wire v5 into the live app until progress migration and the preview flag have been implemented and reviewed.

**Steps 1–22 are complete. Next: native Iranian review (Step 23).**
