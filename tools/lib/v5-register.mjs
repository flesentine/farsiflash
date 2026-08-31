import { loadRegisterPairPolicy, normalizeFa } from './v5-romanization.mjs';

export function applyRegisterAudit(cards, registerPolicy = loadRegisterPairPolicy()) {
  if (!Array.isArray(cards)) throw new Error('cards must be an array');
  const pairs = new Map((registerPolicy.requiredPairs || []).map((pair) => [pair.id, pair]));
  let paired = 0;
  let normalizedToSpoken = 0;
  const seen = new Set();
  const out = cards.map((card) => {
    const pair = pairs.get(card?.id);
    if (!pair) return card;
    if (seen.has(card.id)) throw new Error(`duplicate Step 22 register concept ${card.id}`);
    seen.add(card.id);
    paired += 1;
    const primary = normalizeFa(card.fa);
    const spoken = normalizeFa(pair.spoken);
    const formal = normalizeFa(pair.formal);
    const next = { ...card, tags: [...new Set([...(card.tags || []), 'register-pair', 'step22-register-reviewed'])] };
    if (primary === spoken) {
      next.formalFa = pair.formal;
      delete next.spokenFa;
      if (next.register !== 'spoken') {
        next.register = 'spoken';
        normalizedToSpoken += 1;
      }
    } else if (primary === formal) {
      next.spokenFa = pair.spoken;
      delete next.formalFa;
    } else {
      throw new Error(`Step 22 pair ${card.id} primary ${card.fa} matches neither ${pair.spoken} nor ${pair.formal}`);
    }
    return next;
  });
  for (const id of pairs.keys()) if (!seen.has(id)) throw new Error(`Step 22 required pair missing from effective deck: ${id}`);
  return { cards: out, pairs: pairs.size, paired, normalizedToSpoken };
}
