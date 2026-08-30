import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, '../..');

export function loadRomanizationPolicy() {
  return JSON.parse(fs.readFileSync(path.join(root, 'data', 'v5', 'romanization-policy.json'), 'utf8'));
}

export function loadRegisterPairPolicy() {
  return JSON.parse(fs.readFileSync(path.join(root, 'data', 'v5', 'register-pairs.json'), 'utf8'));
}

export function normalizeFa(value) {
  return String(value || '')
    .normalize('NFC')
    .replace(/[\u064B-\u0652\u0670]/g, '')
    .replace(/\u200c/g, '')
    .replace(/ي/g, 'ی')
    .replace(/ك/g, 'ک')
    .trim();
}

export function sanitizeRoman(value) {
  return String(value || '')
    .toLowerCase()
    .replace(/[’‘`']/g, '')
    .replace(/[-–—]/g, ' ')
    .replace(/\s+/g, ' ')
    .replace(/\s+([?!.,])/g, '$1')
    .trim();
}

export function applyRomanization(card, policy = loadRomanizationPolicy(), registerPolicy = loadRegisterPairPolicy()) {
  const primaryOverride = policy.primaryOverrides?.[card.id];
  const roman = sanitizeRoman(primaryOverride || card.roman);
  const out = { ...card, roman };

  delete out.spokenRoman;
  delete out.formalRoman;

  const pair = (registerPolicy.requiredPairs || []).find((entry) => entry.id === card.id);
  if (!pair) return out;

  const alternate = policy.alternateRomanById?.[card.id];
  if (!alternate) throw new Error(`missing alternate Romanization for register pair ${card.id}`);

  const primary = normalizeFa(card.fa);
  const spoken = normalizeFa(pair.spoken);
  const formal = normalizeFa(pair.formal);
  const alternateRoman = sanitizeRoman(alternate);

  // roman always belongs to the primary fa form. Only the alternate form gets
  // an explicit spokenRoman/formalRoman field.
  if (primary === spoken) {
    out.formalRoman = alternateRoman;
  } else if (primary === formal) {
    out.spokenRoman = alternateRoman;
  } else {
    throw new Error(`Romanization pair ${card.id} primary form ${card.fa} matches neither ${pair.spoken} nor ${pair.formal}`);
  }

  return out;
}

export function applyRomanizationToCards(cards, policy = loadRomanizationPolicy(), registerPolicy = loadRegisterPairPolicy()) {
  return cards.map((card) => applyRomanization(card, policy, registerPolicy));
}
