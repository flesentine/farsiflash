# Step 21 — modern-life coverage audit

Status: **complete**

Step 21 audits the fixed 2,000-card Everyday Iranian curriculum for practical contemporary-life coverage and promotes missing high-value concepts without changing deck size.

## Why this pass exists

The curriculum already had strong general coverage of smartphones, internet access, QR codes, online payment, delivery, remote work, healthcare, errands, privacy, and social communication. A current-market cross-check on August 31, 2026 confirmed that app-based taxi services remain ordinary Iranian urban transport and that digital/card/mobile payment workflows remain central to daily transactions. The audit identified two areas that were not guaranteed strongly enough for contemporary Iranian daily life:

1. Iranian digital banking/payment language
2. App-based taxi / ride-hailing language

The pass deliberately uses generic durable concepts rather than requiring brand names. The learner should know the language needed to use a ride app or bank app even if the dominant provider changes.

## Coverage policy

`modern-life-v1-step21` defines 10 auditable domains:

- mobile / internet
- messaging / calls
- payments / banking
- e-commerce / delivery
- ride-hailing / navigation
- digital work
- health services
- housing / errands
- privacy / social communication
- identity / utilities

Every domain has explicit anchor concept IDs. CI fails if a domain drops below its required anchor count.

## Promotions

Step 21 replaces exactly 11 lower-value concepts at the same positions. All promotions land before card 1,751, so none are buried inside the reading/news bridge.

### Ride-hailing

| Position | Removed | Added | Persian | English |
|---:|---|---|---|---|
| 1640 | `travel.parking-meter` | `travel.ride-hailing` | تاکسی اینترنتی | ride-hailing taxi |
| 1642 | `travel.valet` | `travel.request-ride` | درخواست سفر | ride request |
| 1645 | `travel.road-shoulder` | `travel.driver-arrived` | راننده رسید | the driver arrived |
| 1650 | `travel.rest-stop` | `travel.cancel-ride` | لغو سفر | cancel a ride |

### Payments, banking, identity, utilities

| Position | Removed | Added | Persian | English |
|---:|---|---|---|---|
| 1701 | `shopping.extended-warranty` | `payment.card-to-card` | کارت به کارت | card-to-card transfer |
| 1704 | `shopping.store-credit` | `payment.mobile-banking` | همراه بانک | mobile banking |
| 1705 | `shopping.gift-card` | `payment.dynamic-pin` | رمز پویا | one-time card password |
| 1717 | `shopping.original-package` | `identity.national-id` | کد ملی | national ID number |
| 1718 | `shopping.price-match` | `payment.sheba-number` | شماره شبا | Sheba (IBAN) number |
| 1719 | `shopping.final-sale` | `payment.digital-wallet` | کیف پول دیجیتال | digital wallet |
| 1720 | `shopping.membership-discount` | `payment.bill-payment` | پرداخت قبض | bill payment |

## What remains intact

Step 21 does **not** remove or weaken existing coverage for:

- online payment and QR codes
- verification codes and two-factor authentication
- mobile data, internet speed, hotspots, privacy, scams, and blocked accounts
- delivery windows, tracking numbers, cash on delivery, estimated delivery time, and in-person pickup
- work meetings, projects, deadlines, feedback, and remote work
- pharmacies, insurance, prescription refills, tests, and emergency care
- housing errands, groceries, recycling, air conditioning, and electrical protection
- Step-18 conversational chunks
- the full 180-card reading/news bridge

## CI result

First integrated Step-21 run:

- effective cards: **2,000**
- Step-18 chunk promotions: **38**
- Step-21 modern-life promotions: **11**
- cards tagged `modern-life`: **99**
- coverage domains passing: **10 / 10**
- Step-19 examples: **2,000 / 2,000**
- Step-20 English meanings: passing
- Romanization: passing
- scoring / position gates: passing
- Miller normalization: passing

The only warning remains the pre-existing duplicate Persian form `زن` at card 110. Step 21 introduces no new duplicate-form warning.

## Pipeline order

The effective curriculum now resolves in this order:

`base curriculum → Step 18 conversational chunks → Step 21 modern-life promotions → learner Romanization → Step 20 English meanings → Step 19 examples`

**Steps 1–21 are complete. Step 22 is next.**
