import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { sanitizeRoman } from './v5-romanization.mjs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, '../..');
const defaultPolicyPath = path.join(root, 'data', 'v5', 'example-policy-step19.json');

export function loadExamplePolicy(policyPath = defaultPolicyPath) {
  return JSON.parse(fs.readFileSync(policyPath, 'utf8'));
}

export function normalizeExampleFa(value) {
  return String(value || '')
    .normalize('NFC')
    .replace(/[\u064B-\u0652\u0670]/g, '')
    .replace(/\u200c/g, '')
    .replace(/ي/g, 'ی')
    .replace(/ك/g, 'ک')
    .replace(/[؟?!.,،؛:«»“”"'()]/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

export function normalizeExampleRoman(value) {
  return sanitizeRoman(value)
    .replace(/[?!.,:()]/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

function primaryGloss(value) {
  const raw = String(value || '').trim();
  const first = raw.split(/\s+\/\s+/)[0].trim();
  return first || raw;
}

function ensureTerminal(value, terminal = '.') {
  const text = String(value || '').trim();
  if (!text) return text;
  return /[.!?؟]$/.test(text) ? text : `${text}${terminal}`;
}

function capitalizeEnglish(value) {
  const text = String(value || '').trim();
  if (!text) return text;
  return text.replace(/[A-Za-z]/, (letter) => letter.toUpperCase());
}

function fill(template, values) {
  return String(template)
    .replaceAll('{fa}', values.fa)
    .replaceAll('{roman}', values.roman)
    .replaceAll('{en}', values.en);
}

function explicitExample(card) {
  const values = [card.exampleFa, card.exampleRoman, card.exampleEn];
  const present = values.map((value) => typeof value === 'string' && value.trim().length > 0);
  if (present.some(Boolean) && !present.every(Boolean)) {
    throw new Error(`${card.id} has a partial example trio; exampleFa/exampleRoman/exampleEn must travel together`);
  }
  return present.every(Boolean)
    ? { exampleFa: card.exampleFa.trim(), exampleRoman: sanitizeRoman(card.exampleRoman), exampleEn: card.exampleEn.trim(), source: 'card' }
    : null;
}

function curatedExample(card, policy) {
  const override = policy.curated?.[card.id];
  if (!override) return null;
  for (const key of ['exampleFa', 'exampleRoman', 'exampleEn']) {
    if (typeof override[key] !== 'string' || !override[key].trim()) throw new Error(`Step 19 curated example ${card.id} missing ${key}`);
  }
  return {
    exampleFa: override.exampleFa.trim(),
    exampleRoman: sanitizeRoman(override.exampleRoman),
    exampleEn: override.exampleEn.trim(),
    source: 'curated'
  };
}

function shouldStandAlone(card) {
  const tags = new Set(card.tags || []);
  return card.category === 'conversation' || tags.has('reusable-chunk') || tags.has('essential-chunk') || card.id.startsWith('command.');
}

function generatedExample(card, policy) {
  const roman = sanitizeRoman(card.roman);
  const en = primaryGloss(card.en);

  if (shouldStandAlone(card)) {
    return {
      exampleFa: ensureTerminal(card.fa),
      exampleRoman: ensureTerminal(roman),
      exampleEn: ensureTerminal(capitalizeEnglish(en)),
      source: 'standalone'
    };
  }

  const frame = policy.frames?.[card.category];
  if (!frame) throw new Error(`Step 19 has no example frame for category ${card.category}`);
  for (const key of ['fa', 'roman', 'en']) if (typeof frame[key] !== 'string') throw new Error(`Step 19 frame ${card.category} missing ${key}`);
  const values = { fa: card.fa, roman, en };
  return {
    exampleFa: fill(frame.fa, values).trim(),
    exampleRoman: sanitizeRoman(fill(frame.roman, values)),
    exampleEn: fill(frame.en, values).trim(),
    source: `frame:${card.category}`
  };
}

export function exampleForCard(card, policy = loadExamplePolicy()) {
  if (!card || typeof card !== 'object' || Array.isArray(card)) throw new Error('exampleForCard requires a card object');
  return explicitExample(card) || curatedExample(card, policy) || generatedExample(card, policy);
}

export function applyExampleSentences(cards, policy = loadExamplePolicy()) {
  if (!Array.isArray(cards)) throw new Error('cards must be an array');
  const sources = new Map();
  const out = cards.map((card) => {
    const example = exampleForCard(card, policy);
    sources.set(example.source, (sources.get(example.source) || 0) + 1);
    return {
      ...card,
      exampleFa: example.exampleFa,
      exampleRoman: example.exampleRoman,
      exampleEn: example.exampleEn
    };
  });
  return { cards: out, policy, sources: Object.fromEntries([...sources.entries()].sort()) };
}
