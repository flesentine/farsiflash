import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { loadRegisterPairPolicy, normalizeFa } from './v5-romanization.mjs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, '../..');
const defaultAuditPolicyPath = path.join(root, 'data', 'v5', 'register-audit-step22.json');

export function loadRegisterAuditPolicy(policyPath = defaultAuditPolicyPath) {
  return JSON.parse(fs.readFileSync(policyPath, 'utf8'));
}

export function applyRegisterAudit(
  cards,
  registerPolicy = loadRegisterPairPolicy(),
  auditPolicy = loadRegisterAuditPolicy()
) {
  if (!Array.isArray(cards)) throw new Error('cards must be an array');

  const pairs = new Map((registerPolicy.requiredPairs || []).map((pair) => [pair.id, pair]));
  const reviewedColloquial = new Set(auditPolicy.reviewedColloquialPrimaryIds || []);
  const seenPairs = new Set();
  const seenReviewedColloquial = new Set();
  let paired = 0;
  let normalizedToSpoken = 0;
  let normalizedReviewedColloquial = 0;

  const out = cards.map((card) => {
    const pair = pairs.get(card?.id);
    const isReviewedColloquial = reviewedColloquial.has(card?.id);

    if (!pair && !isReviewedColloquial) return card;

    if (pair) {
      if (seenPairs.has(card.id)) throw new Error(`duplicate Step 22 register concept ${card.id}`);
      seenPairs.add(card.id);
      paired += 1;

      const primary = normalizeFa(card.fa);
      const spoken = normalizeFa(pair.spoken);
      const formal = normalizeFa(pair.formal);
      const next = {
        ...card,
        tags: [...new Set([...(card.tags || []), 'register-pair', 'step22-register-reviewed'])]
      };

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
    }

    if (seenReviewedColloquial.has(card.id)) throw new Error(`duplicate Step 22 reviewed colloquial concept ${card.id}`);
    seenReviewedColloquial.add(card.id);
    const next = {
      ...card,
      tags: [...new Set([...(card.tags || []), 'step22-register-reviewed', 'spoken-primary-reviewed'])]
    };
    if (next.register !== 'spoken') {
      next.register = 'spoken';
      normalizedReviewedColloquial += 1;
    }
    return next;
  });

  for (const id of pairs.keys()) {
    if (!seenPairs.has(id)) throw new Error(`Step 22 required pair missing from effective deck: ${id}`);
  }
  for (const id of reviewedColloquial) {
    if (!seenReviewedColloquial.has(id)) throw new Error(`Step 22 reviewed colloquial ID missing from effective deck: ${id}`);
    if (pairs.has(id)) throw new Error(`Step 22 reviewed colloquial ID must not duplicate a required pair: ${id}`);
  }

  return {
    cards: out,
    pairs: pairs.size,
    paired,
    normalizedToSpoken,
    reviewedColloquial: reviewedColloquial.size,
    normalizedReviewedColloquial
  };
}
