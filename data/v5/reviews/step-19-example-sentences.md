# Step 19 — Example sentences

Status: complete full-deck example coverage pass.

## Goal

Give every effective v5 card a learner-facing example trio:

- `exampleFa` — Persian example
- `exampleRoman` — matching `learner-roman-v1`
- `exampleEn` — concise English meaning/context

Step 19 does not change card IDs, ordering, scores, categories, or the 2,000-card limit.

## Effective order

Examples are applied after the effective curriculum is assembled:

`candidate/review/register layers → Step 18 chunk replacements → Romanization → Step 19 examples`

That order matters because examples should follow the learner-facing Persian and the effective Romanization, including Step-18 promoted chunks and spoken/formal policy.

## Coverage

The final Step-19 audit covers exactly 2,000 cards:

- 38 curated high-value examples for the survival/core language
- 252 natural standalone utterance examples for cards that already function as useful spoken phrases
- 1,710 category-frame examples for the remaining vocabulary
- 0 partial example trios
- 2,000 valid Persian examples
- 2,000 valid Romanized examples
- 2,000 English examples
- 1,999 unique Persian example strings
- 0 Step-19 warnings after duplicate-example cleanup

The 1,999 unique count is expected because the pre-existing curriculum still has the known duplicate Persian form `زن` in the first 300. Step 19 does not create a new curriculum-form collision.

## Curated core examples

The highest-value early cards use direct natural examples rather than generic frames. Representative examples include:

- `سلام` → `سلام! خوبی؟`
- `مرسی` → `مرسی، خیلی لطف کردی.`
- `ببخشید` → `ببخشید، ساعت چنده؟`
- `نمی‌دونم` → `نمی‌دونم، بذار چک کنم.`
- `می‌خوام` → `یه قهوه می‌خوام.`
- `می‌تونی؟` → `می‌تونی کمکم کنی؟`
- `باید` → `باید الان برم.`
- `لازم دارم` → `یه شارژر لازم دارم.`
- `چی` → `چی می‌خوای؟`
- `کجا` → `کجا زندگی می‌کنی؟`
- `چرا` → `چرا رفتی؟`
- `چطور` → `چطور این کار رو کردی؟`

The first CI pass found four duplicate example sentences where these curated core examples matched later standalone phrase cards. The core examples were rewritten rather than suppressing the warnings.

## Generated frame strategy

The remaining cards use short category-aware frames instead of one universal sentence.

- conversation/chunks: standalone utterance when already useful
- grammar: short usage frame
- verbs: infinitive-safe discussion frame
- reading/news: recognition-oriented news context
- people/social/culture/work: discussion context
- home/shopping/school/health: practical question context
- food/travel/technology: request-for-more-information context

The generated frames intentionally keep the target Persian form unchanged inside the example. This lets CI verify that the learner is actually seeing the card form in context instead of a loosely related sentence.

## Quality boundary

Step 19 establishes complete usable example infrastructure and coverage; it is not claiming that 1,710 generated frame examples are the final native-speaker editorial pass.

Later Step 23 native Iranian review can replace any generated example with a card-level explicit example trio. The example layer deliberately gives explicit card examples highest precedence, so native edits can be introduced incrementally without losing 100% coverage.

## Automated checks

`tools/audit-v5-examples.mjs` verifies:

- exactly 2,000 effective cards
- all 38 Step-18 chunk promotions already applied
- every category has an example strategy
- all curated IDs still exist
- complete `exampleFa` / `exampleRoman` / `exampleEn` trios
- Persian Unicode quality
- learner Romanization validity
- target Persian form appears in the example
- target Romanization appears in the Romanized example
- no placeholders
- broad example-string diversity
- duplicate example warnings
- exact source accounting across curated, standalone, generated-frame, and future explicit card examples

The full effective-deck audit also requires example coverage, and the Romanization audit separately validates all 2,000 `exampleRoman` values.
