import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, '../..');
const v5Dir = path.join(root, 'data', 'v5');

function milestoneFiles(prefix) {
  if (!fs.existsSync(v5Dir)) return [];
  return fs.readdirSync(v5Dir)
    .filter((name) => new RegExp(`^${prefix}-step\\d+\\.json$`).test(name))
    .sort((a, b) => {
      const na = Number(a.match(/step(\d+)/)?.[1] || 0);
      const nb = Number(b.match(/step(\d+)/)?.[1] || 0);
      return na - nb || a.localeCompare(b);
    });
}

export function loadRomanizationPolicy() {
  const base = JSON.parse(fs.readFileSync(path.join(v5Dir, 'romanization-policy.json'), 'utf8'));
  const merged = {
    ...base,
    primaryOverrides: { ...(base.primaryOverrides || {}) },
    alternateRomanById: { ...(base.alternateRomanById || {}) }
  };
  for (const name of milestoneFiles('romanization')) {
    const supplement = JSON.parse(fs.readFileSync(path.join(v5Dir, name), 'utf8'));
    Object.assign(merged.primaryOverrides, supplement.primaryOverrides || {});
    Object.assign(merged.alternateRomanById, supplement.alternateRomanById || {});
  }
  return merged;
}

export function loadRegisterPairPolicy() {
  const base = JSON.parse(fs.readFileSync(path.join(v5Dir, 'register-pairs.json'), 'utf8'));
  const requiredPairs = [...(base.requiredPairs || [])];
  const seen = new Set(requiredPairs.map((pair) => pair.id));
  for (const name of milestoneFiles('register-pairs')) {
    const supplement = JSON.parse(fs.readFileSync(path.join(v5Dir, name), 'utf8'));
    for (const pair of supplement.requiredPairs || []) {
      if (seen.has(pair.id)) throw new Error(`duplicate register-pair supplement ID: ${pair.id}`);
      seen.add(pair.id);
      requiredPairs.push(pair);
    }
  }
  return { ...base, requiredPairs };
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
