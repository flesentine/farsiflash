import candidateCards from './core-751-870-verbs.mjs';

const PATCHES = new Map([
  ['verb.get-fired', { roman:'ekhraaj shodan' }],
  ['verb.work-from-home', { formalFa:'از خانه کار کردن' }],
  ['verb.wait-turn', { formalFa:'منتظر نوبت ماندن' }],
  ['verb.rest-at-home', { formalFa:'خانه استراحت کردن' }]
]);

const cards = candidateCards.map((card) => {
  const patch = PATCHES.get(card.id);
  if (!patch) return card;
  const isRegisterPair = patch.formalFa || patch.spokenFa;
  return {
    ...card,
    ...patch,
    tags: isRegisterPair ? [...new Set([...(card.tags || []), 'register-pair'])] : card.tags
  };
});

if (cards.length !== 120) throw new Error(`register-reviewed core-751-870 must contain 120 cards; found ${cards.length}`);
for (const id of PATCHES.keys()) if (!candidateCards.some((card) => card.id === id)) throw new Error(`Step 15 verb register target not found: ${id}`);
export default cards;
