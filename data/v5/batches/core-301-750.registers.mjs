import reviewedCards from './core-301-750.reviewed.mjs';

// Step 14 register pass for cards 301–750.
// Spoken-first cards keep the standard/written counterpart on the same concept ID.
const PATCHES = new Map([
  ['verb.drop-off', { formalFa:'رساندن' }],
  ['verb.wait-for', { formalFa:'منتظر ماندن' }],
  ['verb.oversleep', { formalFa:'خواب ماندن' }],

  ['conversation.you-are-right', { formalFa:'حق با تو است' }],
  ['conversation.obviously', { formalFa:'معلوم است' }],
  ['conversation.i-didnt-know', { formalFa:'نمی‌دانستم' }],
  ['conversation.i-remembered', { formalFa:'یادم آمد' }],
  ['conversation.remember', { formalFa:'یادت باشد' }],
  ['conversation.coming-now', { formalFa:'الان می‌آیم' }],
  ['conversation.doesnt-matter', { formalFa:'فرقی نمی‌کند' }],
  ['conversation.thats-right', { formalFa:'درست است' }],
  ['conversation.where-going', { formalFa:'کجا می‌روی؟' }],
  ['conversation.when-coming', { formalFa:'کی می‌آیی؟' }],
  ['conversation.how-long', { formalFa:'چقدر طول می‌کشد؟' }],
  ['conversation.when-finished', { formalFa:'کی تمام می‌شود؟' }],
  ['conversation.not-anymore', { formalFa:'دیگر نه' }],
  ['conversation.this-is-fine', { formalFa:'همین خوب است' }],
  ['conversation.this-is-enough', { formalFa:'همین کافی است' }],
  ['conversation.this-is-better', { formalFa:'این بهتر است' }],
  ['conversation.the-other-one', { formalFa:'آن یکی' }],

  ['shopping.other-color', { formalFa:'رنگ دیگری دارید؟' }],
  ['shopping.is-discounted', { formalFa:'تخفیف دارد؟' }],
  ['shopping.too-expensive', { formalFa:'خیلی گران است' }],
  ['shopping.cheaper-option', { formalFa:'ارزان تر دارید؟' }],

  ['travel.how-far', { formalFa:'چقدر راه است؟' }],
  ['travel.which-way', { formalFa:'از کدام طرف؟' }]
]);

const cards = reviewedCards.map((card) => {
  const patch = PATCHES.get(card.id);
  if (!patch) return card;
  return { ...card, ...patch, tags:[...new Set([...(card.tags || []),'register-pair'])] };
});

if (cards.length !== 450) throw new Error(`register-reviewed core-301-750 must contain 450 cards; found ${cards.length}`);
for (const id of PATCHES.keys()) {
  if (!reviewedCards.some((card) => card.id === id)) throw new Error(`Step 14 register target not found: ${id}`);
}

export const registerPatchCount = PATCHES.size;
export default cards;
