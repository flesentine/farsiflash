#!/usr/bin/env node

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { applyRomanizationToCards, loadRegisterPairPolicy, loadRomanizationPolicy, normalizeFa, sanitizeRoman } from './lib/v5-romanization.mjs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, '..');
const deck = JSON.parse(fs.readFileSync(path.join(root, 'data', 'v5', 'deck.json'), 'utf8'));
const batchesDir = path.join(root, 'data', 'v5', 'batches');
const romanPolicy = loadRomanizationPolicy();
const registerPolicy = loadRegisterPairPolicy();

const allBatchFiles = fs.existsSync(batchesDir)
  ? fs.readdirSync(batchesDir).filter((name) => name.endsWith('.mjs')).sort()
  : [];

function batchKey(name) {
  return name.replace(/(?:\.reviewed|\.compounds|\.registers)?\.mjs$/, '');
}
function batchPrecedence(name) {
  if (name.endsWith('.registers.mjs')) return 3;
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

const batchCards = [];
for (const file of [...chosen.values()].sort()) {
  const mod = await import(pathToFileURL(path.join(batchesDir, file)).href);
  if (!Array.isArray(mod.default)) throw new Error(`${file} must default-export an array`);
  batchCards.push(...mod.default);
}

const sourceCards = [...deck.cards, ...batchCards];
const cards = applyRomanizationToCards(sourceCards, romanPolicy, registerPolicy);
const errors = [];
const fail = (msg) => errors.push(msg);
const ids = new Map(cards.map((card, index) => [card.id, index + 1]));
const ROMAN_RE = /^[a-z0-9 /.,!?()]+$/;

if (cards.length !== 300) fail(`Romanization audit expects exactly 300 effective cards; found ${cards.length}`);

function checkRoman(label, value, card, position) {
  if (typeof value !== 'string' || !value.trim()) {
    fail(`#${position} ${card.id} missing ${label}`);
    return;
  }
  if (value !== value.toLowerCase()) fail(`#${position} ${card.id} ${label} must be lowercase: ${value}`);
  if (!ROMAN_RE.test(value)) fail(`#${position} ${card.id} ${label} contains characters outside learner-roman-v1: ${value}`);
  if (/[’‘`'-]/.test(value)) fail(`#${position} ${card.id} ${label} contains forbidden apostrophe/hyphen: ${value}`);
  if (/\s{2,}/.test(value)) fail(`#${position} ${card.id} ${label} contains repeated spaces: ${value}`);
  if (/(aaa|ooo|iii)/.test(value)) fail(`#${position} ${card.id} ${label} contains suspicious triple vowel: ${value}`);
  if (sanitizeRoman(value) !== value) fail(`#${position} ${card.id} ${label} is not canonically sanitized: ${value}`);
}

cards.forEach((card, index) => {
  const position = index + 1;
  checkRoman('roman', card.roman, card, position);
  if (card.spokenFa) {
    if (!card.spokenRoman) fail(`#${position} ${card.id} has spokenFa but no spokenRoman`);
    else checkRoman('spokenRoman', card.spokenRoman, card, position);
  } else if (card.spokenRoman) {
    fail(`#${position} ${card.id} has spokenRoman without spokenFa`);
  }
  if (card.formalFa) {
    if (!card.formalRoman) fail(`#${position} ${card.id} has formalFa but no formalRoman`);
    else checkRoman('formalRoman', card.formalRoman, card, position);
  } else if (card.formalRoman) {
    fail(`#${position} ${card.id} has formalRoman without formalFa`);
  }
});

const requiredPairs = registerPolicy.requiredPairs || [];
const alternateRomanById = romanPolicy.alternateRomanById || {};
if (Object.keys(alternateRomanById).length !== requiredPairs.length) {
  fail(`alternate Romanization map count ${Object.keys(alternateRomanById).length} != register-pair count ${requiredPairs.length}`);
}
for (const pair of requiredPairs) {
  const position = ids.get(pair.id);
  if (!position) {
    fail(`Romanization policy missing required pair concept ${pair.id}`);
    continue;
  }
  if (!alternateRomanById[pair.id]) fail(`missing alternate Romanization for ${pair.id}`);
  const card = cards[position - 1];
  const primary = normalizeFa(card.fa);
  if (primary === normalizeFa(pair.spoken)) {
    if (!card.formalFa || !card.formalRoman) fail(`#${position} ${pair.id} spoken-primary pair must expose formalFa + formalRoman`);
  } else if (primary === normalizeFa(pair.formal)) {
    if (!card.spokenFa || !card.spokenRoman) fail(`#${position} ${pair.id} formal-primary pair must expose spokenFa + spokenRoman`);
  } else {
    fail(`#${position} ${pair.id} primary form is outside its register pair`);
  }
}
for (const id of Object.keys(alternateRomanById)) {
  if (!requiredPairs.some((pair) => pair.id === id)) fail(`stale alternate Romanization entry not in register policy: ${id}`);
}
for (const [id, expected] of Object.entries(romanPolicy.primaryOverrides || {})) {
  const position = ids.get(id);
  if (!position) {
    fail(`stale primary Romanization override: ${id}`);
    continue;
  }
  if (cards[position - 1].roman !== sanitizeRoman(expected)) {
    fail(`#${position} ${id} did not apply primary Romanization override ${expected}`);
  }
}

for (const message of errors) console.error(`ERROR ${message}`);
if (errors.length) {
  console.error(`\nv5 Romanization audit failed: ${errors.length} error(s)`);
  process.exit(1);
}

const pairedCards = cards.filter((card) => card.spokenRoman || card.formalRoman).length;
console.log(`v5 Romanization audit passed: policy=${romanPolicy.version}, cards=${cards.length}, pairedCards=${pairedCards}, requiredPairs=${requiredPairs.length}, primaryOverrides=${Object.keys(romanPolicy.primaryOverrides || {}).length}`);
