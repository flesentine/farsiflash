import reviewedCards from './core-1116-1170-social.reviewed.mjs';

const PATCHES = new Map([
  ['social.like-it', { formalFa:'خوشم می‌آید' }],
  ['social.dont-like-it', { formalFa:'خوشم نمی‌آید' }],
  ['social.hate-it', { formalFa:'بدم می‌آید' }],
  ['social.seriously', { formalFa:'جدی می‌گویم' }],
  ['social.congratulations', { formalFa:'تبریک می‌گویم' }],
  ['social.say-hi', { formalFa:'سلام برسان' }],
  ['social.give-regards', { formalFa:'ارادت برسان' }],
  ['social.between-us', { formalFa:'بین خودمان باشد' }]
]);

const cards = reviewedCards.map((card) => {
  const patch = PATCHES.get(card.id);
  return patch ? { ...card, ...patch, tags:[...new Set([...(card.tags || []),'register-pair'])] } : card;
});
if (cards.length !== 55) throw new Error(`register-reviewed core-1116-1170 must contain 55 cards; found ${cards.length}`);
for (const id of PATCHES.keys()) if (!reviewedCards.some((card) => card.id === id)) throw new Error(`Step 15 social register target not found: ${id}`);
export default cards;
