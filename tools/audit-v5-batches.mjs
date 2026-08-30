#!/usr/bin/env node

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { loadScoringRules, scoreCandidate, checkCandidateAtPosition } from './lib/v5-scoring.mjs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, '..');
const deck = JSON.parse(fs.readFileSync(path.join(root, 'data', 'v5', 'deck.json'), 'utf8'));
const compoundPolicy = JSON.parse(fs.readFileSync(path.join(root, 'data', 'v5', 'compound-verb-policy.json'), 'utf8'));
const batchesDir = path.join(root, 'data', 'v5', 'batches');
const scoringRules = loadScoringRules();
const allBatchFiles = fs.existsSync(batchesDir)
  ? fs.readdirSync(batchesDir).filter((name) => name.endsWith('.mjs')).sort()
  : [];

// Preserve every editorial stage for provenance, but load only the highest-
// precedence companion for each batch: compounds > reviewed > candidate.
function batchKey(name) {
  return name.replace(/(?:\.reviewed|\.compounds)?\.mjs$/, '');
}
function batchPrecedence(name) {
  if (name.endsWith('.compounds.mjs')) return 2;
  if (name.endsWith('.reviewed.mjs')) return 1;
  return 0;
}
const chosen = new Map();
for (const name of allBatchFiles) {
  const key = batchKey(name);
  const current = chosen.get(key);
  if (!current || batchPrecedence(name) > batchPrecedence(current)) chosen.set(key, name);
}
const batchFiles = [...chosen.values()].sort();

const batchCards = [];
for (const file of batchFiles) {
  const mod = await import(pathToFileURL(path.join(batchesDir, file)).href);
  if (!Array.isArray(mod.default)) throw new Error(`${file} must default-export an array`);
  batchCards.push(...mod.default);
}

const cards = [...deck.cards, ...batchCards];
const errors = [];
const warnings = [];
const fail = (msg) => errors.push(msg);
const warn = (msg) => warnings.push(msg);
const ID_RE = /^[a-z][a-z0-9]*(?:-[a-z0-9]+)*(?:\.[a-z0-9]+(?:-[a-z0-9]+)*)+$/;
const ROMAN_RE = /^[a-z0-9' /.,!?()-]+$/;
const REGISTERS = new Set(['spoken', 'everyday', 'neutral', 'formal', 'written', 'slang', 'literary']);
const CATEGORIES = new Set(['conversation', 'grammar', 'verbs', 'people', 'home', 'food', 'shopping', 'travel', 'social', 'work', 'school', 'health', 'technology', 'culture', 'reading-news']);
const SIGNALS = ['conversationalFrequency', 'speakerDispersion', 'practicalUsefulness', 'generativeValue', 'modernRelevance', 'writtenFrequency'];
const PERSIAN_LETTER = /[\u0600-\u06ff]/;
const ASCII_LETTER = /[A-Za-z]/;

function normalizeFa(value) {
  return String(value || '').normalize('NFC').replace(/[\u064B-\u0652\u0670]/g, '').replace(/\u200c/g, '').replace(/ي/g, 'ی').replace(/ك/g, 'ک').trim();
}

function checkPersian(label, value, position) {
  if (value == null) return;
  if (typeof value !== 'string' || !value.trim()) return fail(`#${position} ${label} must be a non-empty string or null`);
  if (value !== value.trim()) fail(`#${position} ${label} has leading/trailing whitespace`);
  if (!PERSIAN_LETTER.test(value)) fail(`#${position} ${label} lacks Persian text: ${JSON.stringify(value)}`);
  if (ASCII_LETTER.test(value)) fail(`#${position} ${label} contains ASCII letters: ${JSON.stringify(value)}`);
  if (/ي/.test(value)) fail(`#${position} ${label} uses Arabic ي instead of Persian ی: ${value}`);
  if (/ك/.test(value)) fail(`#${position} ${label} uses Arabic ك instead of Persian ک: ${value}`);
}

if (deck.cards.length !== 100) fail(`foundation core must remain exactly 100 cards; found ${deck.cards.length}`);
if (batchCards.length !== 200) fail(`effective 101–300 batch must contain exactly 200 cards; found ${batchCards.length}`);
if (cards.length !== 300) fail(`effective v5 curriculum must contain 300 cards; found ${cards.length}`);

const ids = new Map();
const forms = new Map();

cards.forEach((card, index) => {
  const position = index + 1;
  if (!card || typeof card !== 'object' || Array.isArray(card)) return fail(`#${position} card must be an object`);
  for (const key of ['id', 'fa', 'roman', 'en', 'register', 'category']) {
    if (typeof card[key] !== 'string' || !card[key].trim()) fail(`#${position} missing required string field ${key}`);
  }
  if (!ID_RE.test(card.id || '')) fail(`#${position} invalid stable id ${card.id}`);
  if (ids.has(card.id)) fail(`#${position} duplicate id ${card.id}; first at #${ids.get(card.id)}`);
  else ids.set(card.id, position);

  checkPersian('fa', card.fa, position);
  checkPersian('spokenFa', card.spokenFa, position);
  checkPersian('formalFa', card.formalFa, position);
  if (typeof card.roman === 'string' && (!ROMAN_RE.test(card.roman) || card.roman !== card.roman.toLowerCase())) {
    fail(`#${position} invalid romanization ${JSON.stringify(card.roman)}`);
  }
  if (!REGISTERS.has(card.register)) fail(`#${position} invalid register ${card.register}`);
  if (!CATEGORIES.has(card.category)) fail(`#${position} invalid category ${card.category}`);
  if (!Array.isArray(card.tags)) fail(`#${position} tags must be an array`);

  const normalized = normalizeFa(card.fa);
  if (normalized) {
    if (forms.has(normalized) && !(card.tags || []).includes('homograph')) {
      warn(`#${position} Persian form duplicates #${forms.get(normalized)}: ${card.fa}`);
    } else if (!forms.has(normalized)) forms.set(normalized, position);
  }

  if (!card.selection || typeof card.selection !== 'object') return fail(`#${position} missing selection`);
  if (!card.selection.signals || typeof card.selection.signals !== 'object') return fail(`#${position} missing selection.signals`);
  for (const signal of SIGNALS) {
    const value = card.selection.signals[signal];
    if (!Number.isFinite(value) || value < 0 || value > 100) fail(`#${position} signal ${signal} must be 0..100`);
  }

  try {
    const candidate = { register: card.register, category: card.category, millerRank: card.millerRank, tags: card.tags || [], signals: card.selection.signals };
    const derived = scoreCandidate(candidate, scoringRules);
    if (Math.abs(derived.score - card.selection.score) > 0.11) fail(`#${position} stored score ${card.selection.score} != derived ${derived.score}`);
    const gate = checkCandidateAtPosition(candidate, position, scoringRules);
    if (!gate.gatePassed) fail(`#${position} fails ordering gate: ${gate.gateFailures.join('; ')}`);
  } catch (error) {
    fail(`#${position} scoring failed: ${error.message}`);
  }
});

// Step 11 policy: high-value light-verb constructions must be present before
// card 300, and their weak isolated noun components must not consume an early
// action-learning slot before the constructions are established.
for (const id of compoundPolicy.requiredBeforeOrAt300 || []) {
  const position = ids.get(id);
  if (!position) fail(`compound policy missing required early construction: ${id}`);
  else if (position > 300) fail(`compound policy requires ${id} by 300; found at #${position}`);
  const card = cards[position - 1];
  if (!(card.tags || []).includes('productive-compound-verb')) {
    fail(`compound policy card ${id} must carry productive-compound-verb tag`);
  }
}
const deferredForms = new Set((compoundPolicy.deferIsolatedFormsBefore300 || []).map(normalizeFa));
cards.slice(0, 300).forEach((card, index) => {
  if (deferredForms.has(normalizeFa(card.fa))) {
    fail(`#${index + 1} isolated light-verb component should be deferred until after the full construction: ${card.fa}`);
  }
});

for (const message of warnings) console.warn(`WARN ${message}`);
for (const message of errors) console.error(`ERROR ${message}`);
if (errors.length) {
  console.error(`\nv5 batch audit failed: ${errors.length} error(s), ${warnings.length} warning(s)`);
  process.exit(1);
}
console.log(`v5 batch audit passed: core=${deck.cards.length}, batches=${batchCards.length}, effective=${cards.length}, warnings=${warnings.length}, files=${batchFiles.join(',')}, compoundPolicy=${compoundPolicy.version}`);
