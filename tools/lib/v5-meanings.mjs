import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, '../..');
const defaultPolicyPath = path.join(root, 'data', 'v5', 'meaning-policy-step20.json');

export function loadMeaningPolicy(policyPath = defaultPolicyPath) {
  return JSON.parse(fs.readFileSync(policyPath, 'utf8'));
}

export function normalizeEnglishMeaning(value) {
  return String(value || '')
    .replace(/[“”]/g, '"')
    .replace(/[‘’]/g, "'")
    .replace(/\s+/g, ' ')
    .trim();
}

export function applyEnglishMeanings(cards, policy = loadMeaningPolicy()) {
  if (!Array.isArray(cards)) throw new Error('cards must be an array');
  const overrides = policy.overrides || {};
  let applied = 0;
  const out = cards.map((card) => {
    const override = overrides[card.id];
    if (!override) return { ...card, en: normalizeEnglishMeaning(card.en) };
    if (typeof override.en !== 'string' || !override.en.trim()) throw new Error(`Step 20 meaning override ${card.id} missing en`);
    if (typeof override.reason !== 'string' || override.reason.trim().length < 8) throw new Error(`Step 20 meaning override ${card.id} needs a reason`);
    applied += 1;
    return { ...card, en: normalizeEnglishMeaning(override.en) };
  });
  return { cards: out, policy, applied };
}
