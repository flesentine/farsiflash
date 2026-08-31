import compoundCards from './core-101-300.compounds.mjs';

// Step 12 spoken/formal register-pair pass.
// Earlier candidate, reviewed, and compound layers remain intact for provenance.
// This module is the effective source of truth for cards 101–300 after Step 12.

const PATCHES = new Map([
  ['people.mother', { spokenFa: 'مامان' }],
  ['people.father', { spokenFa: 'بابا' }],
  ['people.family', { spokenFa: 'خونواده' }],
  ['people.child', { formalFa: 'کودک' }],
  ['food.breakfast', { spokenFa: 'صبحونه' }],
  ['conversation.im-hungry', { spokenFa: 'گشنمه' }],
  ['travel.location', { formalFa: 'موقعیت مکانی' }]
]);

const cards = compoundCards.map((card) => {
  const patch = PATCHES.get(card.id);
  if (!patch) return card;
  return {
    ...card,
    ...patch,
    tags: [...new Set([...(card.tags || []), 'register-pair'])]
  };
});

if (cards.length !== 200) throw new Error(`register-reviewed core-101-300 must contain 200 cards; found ${cards.length}`);
for (const id of PATCHES.keys()) {
  if (!compoundCards.some((card) => card.id === id)) throw new Error(`register-pair target not found: ${id}`);
}

export const registerPatchCount = PATCHES.size;
export default cards;
