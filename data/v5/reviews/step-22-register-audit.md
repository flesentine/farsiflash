# Step 22 — full register audit

Status: **complete**

Step 22 audits register across the modernized 2,000-card Everyday Iranian curriculum after the Step-18 conversational chunk overlay and Step-21 modern-life promotions.

## Goal

The learner-facing deck should teach the form people actually say first when spoken Iranian Persian materially differs from standard/formal Persian, without manufacturing artificial pairs for phrases that are already standard or whose alternative would be a different lexical concept.

## What the audit found

The initial full-deck diagnostic confirmed that the curriculum was already structurally strong:

- no `formal` primary cards before position 1751
- no `written` primary cards before position 1751
- no `literary` primary cards before position 1751
- no `reading-news` cards before position 1751

The main gap was register metadata and pair coverage. The first diagnostic found 156 spoken cards without a reviewed counterpart and a number of genuinely colloquial primary forms still labeled `everyday` or `neutral`.

## Pair expansion

Step 22 adds **72** meaningful spoken↔standard pairs, raising the effective policy from **163 to 235 pairs**.

Representative additions include:

- `مرسی` / `متشکرم`
- `خوبی؟` / `خوب هستی؟`
- `آره` / `بله`
- `باشه` / `بسیار خوب`
- `بریم` / `برویم`
- `کِی` / `چه زمانی`
- `اپ` / `برنامه`
- `می‌خوام پرو کنم` / `می‌خواهم پرو کنم`
- `چی شده؟` / `چه شده؟`
- `چی کار کنم؟` / `چه کار کنم؟`
- `می‌شه دوباره بگی؟` / `می‌شود دوباره بگویی؟`
- `منظورت چیه؟` / `منظورت چیست؟`
- `بذار ببینم` / `بگذار ببینم`
- `کجایی؟` / `کجا هستی؟`
- `منو در جریان بذار` / `من را در جریان بگذار`
- `خوبه` / `خوب است`
- `مهمونی` / `مهمانی`
- `مهمون‌داری` / `مهمان‌داری`
- `خونه نو مبارک` / `خانه نو مبارک`

Matching alternate Romanization is stored in `romanization-step22.json` and is enforced by the existing learner-Romanization audit.

## Reviewed spoken-primary forms

The strict audit also exposed a different class of cards: productive everyday constructions that are clearly spoken because they use colloquial syntax such as the object marker `رو`, but where creating a mechanical one-to-one formal twin would add noisy textbook data rather than a useful learner contrast.

Step 22 therefore explicitly reviews and normalizes **67** such primary forms to `register: "spoken"` without inventing a formal counterpart. Examples include:

- `زباله رو بیرون بردن`
- `جلسه رو جابه جا کردن`
- `صفحه رو به اشتراک گذاشتن`
- `کار رو تحویل دادن`
- `ایمیل رو فوروارد کردن`
- `فایل رو ذخیره کردن`
- `گوشی رو شارژ کردن`
- `یک نفر رو بلاک کردن`
- `پست رو لایک کردن`
- `سفارش رو پس فرستادن`
- `حساب رو تقسیم کردن`
- `صدا رو کم کردن`
- `خدا رو شکر`

`پیاده رو` is explicitly treated as a lexical false positive for the `رو` detector rather than an object-marker construction.

## Reviewed unpaired spoken cards

There are **102** additional spoken cards that remain intentionally unpaired. These are frozen in `register-audit-step22.json`. In these cases the ordinary standard form is effectively unchanged, or a supposed "formal equivalent" would be a different lexical choice rather than the same concept.

This prevents two bad outcomes:

1. forcing fake pairs merely to improve a coverage percentage;
2. silently adding new unreviewed spoken-only forms later.

CI now requires every spoken card to be either:

- covered by one of the 235 required spoken↔standard pairs, or
- explicitly listed as a reviewed unpaired spoken concept.

## Final audit result

- effective cards: **2,000**
- required spoken↔standard pairs: **235**
- Step-22 new pairs: **72**
- reviewed unpaired spoken concepts: **102**
- reviewed colloquial spoken-primary concepts: **67**
- approved unpaired spoken total: **169**
- paired primaries normalized to `spoken`: **66**
- reviewed colloquial primaries normalized to `spoken`: **67**
- colloquial-label errors: **0**
- pair-primary mismatches: **0**
- pair-label mismatches: **0**
- formal before position 1751: **0**
- written before position 1751: **0**
- literary before position 1751: **0**
- reading/news before position 1751: **0**

The only remaining full-deck warning is still the pre-existing duplicate Persian form `زن` at card 110; Step 22 introduces no new duplicate-form warning.

## Effective pipeline

The canonical learner-facing pipeline is now:

`base curriculum → Step 18 conversational chunks → Step 21 modern-life promotions → Step 22 register normalization → learner Romanization → Step 20 English meanings → Step 19 examples`

Step 23 can now perform native Iranian review against a register-clean, modernized deck rather than fixing structural register problems during native review.
