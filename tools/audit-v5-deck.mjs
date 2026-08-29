#!/usr/bin/env node

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, '..');
const deckPath = path.join(root, 'data', 'v5', 'deck.json');

const REGISTERS = new Set(['spoken', 'everyday', 'neutral', 'formal', 'written', 'slang', 'literary']);
const CATEGORIES = new Set(['conversation', 'grammar', 'verbs', 'people', 'home', 'food', 'shopping', 'travel', 'social', 'work', 'school', 'health', 'technology', 'culture', 'reading-news']);
const ID_RE = /^[a-z][a-z0-9]*(?:\.[a-z0-9]+)+$/;
const ROMAN_RE = /^[a-z0-9' /.,!?()-]+$/;
const ARABIC_YEH = /ي/;
const ARABIC_KAF = /ك/;
const PERSIAN_LETTER = /[\u0600-\u06ff]/;
const ASCII_LETTER = /[A-Za-z]/;

const errors = [];
const warnings = [];
const fail = (msg) => errors.push(msg);
const warn = (msg) => warnings.push(msg);

function normalizeFa(value) {
  return String(value || '')
    .normalize('NFC')
    .replace(/[\u064B-\u0652\u0670]/g, '')
    .replace(/\u200c/g, '')
    .replace(/ي/g, 'ی')
    .replace(/ك/g, 'ک')
    .trim();
}

function checkPersian(label, value, index) {
  if (value == null) return;
  if (typeof value !== 'string' || !value.trim()) return fail(`#${index + 1} ${label} must be a non-empty string or null`);
  if (value !== value.trim()) fail(`#${index + 1} ${label} has leading/trailing whitespace`);
  if (!PERSIAN_LETTER.test(value)) fail(`#${index + 1} ${label} does not contain Persian/Arabic-script text: ${JSON.stringify(value)}`);
  if (ASCII_LETTER.test(value)) fail(`#${index + 1} ${label} contains ASCII letters: ${JSON.stringify(value)}`);
  if (ARABIC_YEH.test(value)) fail(`#${index + 1} ${label} uses Arabic ي instead of Persian ی: ${value}`);
  if (ARABIC_KAF.test(value)) fail(`#${index + 1} ${label} uses Arabic ك instead of Persian ک: ${value}`);
  if (/\s{2,}/.test(value)) fail(`#${index + 1} ${label} contains repeated spaces: ${JSON.stringify(value)}`);
}

let deck;
try {
  deck = JSON.parse(fs.readFileSync(deckPath, 'utf8'));
} catch (error) {
  console.error(`v5 audit: cannot read ${deckPath}: ${error.message}`);
  process.exit(1);
}

if (deck.version !== 5) fail(`deck.version must be 5; got ${JSON.stringify(deck.version)}`);
if (deck.idPolicy !== 'explicit-semantic-v1') fail(`deck.idPolicy must be explicit-semantic-v1`);
if (!['foundation', 'curriculum'].includes(deck.status)) fail(`deck.status must be foundation or curriculum`);
if (!Array.isArray(deck.cards)) fail(`deck.cards must be an array`);

const cards = Array.isArray(deck.cards) ? deck.cards : [];
if (deck.status === 'foundation' && cards.length > 100) warn(`foundation deck already has ${cards.length} cards; consider switching status to curriculum when the reviewed deck is ready`);
if (deck.status === 'curriculum' && cards.length !== 2000) fail(`curriculum deck must contain exactly 2000 cards; found ${cards.length}`);
if (deck.targetCards !== 2000) fail(`deck.targetCards must remain 2000`);

const ids = new Map();
const exactForms = new Map();

cards.forEach((card, index) => {
  if (!card || typeof card !== 'object' || Array.isArray(card)) {
    fail(`#${index + 1} card must be an object`);
    return;
  }

  for (const key of ['id', 'fa', 'roman', 'en', 'register', 'category']) {
    if (typeof card[key] !== 'string' || !card[key].trim()) fail(`#${index + 1} missing required string field: ${key}`);
  }

  if (typeof card.id === 'string') {
    if (!ID_RE.test(card.id)) fail(`#${index + 1} invalid stable id: ${card.id}`);
    if (ids.has(card.id)) fail(`#${index + 1} duplicate stable id ${card.id}; first used at #${ids.get(card.id) + 1}`);
    else ids.set(card.id, index);
  }

  checkPersian('fa', card.fa, index);
  checkPersian('spokenFa', card.spokenFa, index);
  checkPersian('formalFa', card.formalFa, index);
  checkPersian('exampleFa', card.exampleFa, index);

  if (typeof card.roman === 'string') {
    if (card.roman !== card.roman.trim()) fail(`#${index + 1} roman has leading/trailing whitespace`);
    if (card.roman !== card.roman.toLowerCase()) fail(`#${index + 1} roman must be lowercase: ${card.roman}`);
    if (!ROMAN_RE.test(card.roman)) fail(`#${index + 1} roman contains unsupported characters: ${card.roman}`);
  }

  if (typeof card.en === 'string' && card.en.length > 80) warn(`#${index + 1} English gloss is long (${card.en.length} chars); prefer one learner-relevant sense`);
  if (!REGISTERS.has(card.register)) fail(`#${index + 1} invalid register: ${card.register}`);
  if (!CATEGORIES.has(card.category)) fail(`#${index + 1} invalid category: ${card.category}`);

  if (card.spokenScore != null && (!Number.isInteger(card.spokenScore) || card.spokenScore < 0 || card.spokenScore > 100)) {
    fail(`#${index + 1} spokenScore must be an integer 0..100 or null`);
  }
  if (card.millerRank != null && (!Number.isInteger(card.millerRank) || card.millerRank < 1)) {
    fail(`#${index + 1} millerRank must be a positive integer or null`);
  }

  if (card.tags != null && (!Array.isArray(card.tags) || card.tags.some((x) => typeof x !== 'string'))) {
    fail(`#${index + 1} tags must be an array of strings`);
  }

  const hasAnyExample = [card.exampleFa, card.exampleRoman, card.exampleEn].some((v) => v != null && v !== '');
  const hasAllExample = [card.exampleFa, card.exampleRoman, card.exampleEn].every((v) => typeof v === 'string' && v.trim());
  if (hasAnyExample && !hasAllExample) fail(`#${index + 1} exampleFa/exampleRoman/exampleEn must be supplied together`);

  const normalized = normalizeFa(card.fa);
  if (normalized) {
    const previous = exactForms.get(normalized);
    if (previous != null && !(card.tags || []).includes('homograph')) {
      warn(`#${index + 1} Persian form duplicates #${previous + 1}: ${card.fa}; add homograph tag if intentional`);
    } else if (previous == null) exactForms.set(normalized, index);
  }

  if (index < 1000 && card.category === 'reading-news') fail(`#${index + 1} reading-news card appears in first 1000: ${card.id}`);
  if (index < 1000 && ['formal', 'written', 'literary'].includes(card.register) && !(card.tags || []).includes('formal-bridge')) {
    warn(`#${index + 1} ${card.register} card appears in first 1000 without formal-bridge tag: ${card.id}`);
  }
  if (index < 1000 && (card.tags || []).includes('proper-name')) fail(`#${index + 1} proper-name card appears in first 1000: ${card.id}`);
});

for (const message of warnings) console.warn(`WARN ${message}`);
for (const message of errors) console.error(`ERROR ${message}`);

if (errors.length) {
  console.error(`\nv5 audit failed: ${errors.length} error(s), ${warnings.length} warning(s)`);
  process.exit(1);
}

console.log(`v5 audit passed: ${cards.length} card(s), ${warnings.length} warning(s), status=${deck.status}`);
