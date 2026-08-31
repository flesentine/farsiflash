import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { scoreCandidate } from './v5-scoring.mjs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, '../..');
const defaultPolicyPath = path.join(root, 'data', 'v5', 'conversational-chunks-step18.json');

export function loadConversationalChunkPolicy(policyPath = defaultPolicyPath) {
  return JSON.parse(fs.readFileSync(policyPath, 'utf8'));
}

function buildChunkCard(entry, policy) {
  const profile = policy.profile || {};
  const signals = { ...(profile.signals || {}) };
  const tags = [...new Set(profile.tags || [])];
  const register = profile.register || 'spoken';
  const category = profile.category || 'conversation';
  const candidate = { register, category, millerRank: null, tags, signals };
  return {
    id: entry.id,
    fa: entry.fa,
    roman: entry.roman,
    en: entry.en,
    register,
    category,
    millerRank: null,
    selection: {
      score: scoreCandidate(candidate).score,
      signals,
      editorialOverride: {
        direction: 'promote',
        reason: `Step 18 promotes a reusable conversational chunk over lower-value concept ${entry.targetId}.`
      }
    },
    tags,
    notes: `Step 18 replacement for ${entry.targetId}`
  };
}

export function applyConversationalChunkReplacements(cards, policy = loadConversationalChunkPolicy()) {
  if (!Array.isArray(cards)) throw new Error('cards must be an array');
  if (!Array.isArray(policy.replacements)) throw new Error('Step 18 chunk policy replacements must be an array');
  if (policy.replacementCount !== policy.replacements.length) {
    throw new Error(`Step 18 replacementCount ${policy.replacementCount} != replacements length ${policy.replacements.length}`);
  }

  const sourceIds = new Set(cards.map((card) => card.id));
  const targetIds = new Set();
  const newIds = new Set();
  const replacements = new Map();

  for (const entry of policy.replacements) {
    for (const key of ['targetId', 'id', 'fa', 'roman', 'en']) {
      if (typeof entry[key] !== 'string' || !entry[key].trim()) throw new Error(`Step 18 chunk entry missing ${key}`);
    }
    if (targetIds.has(entry.targetId)) throw new Error(`duplicate Step 18 target ID: ${entry.targetId}`);
    if (newIds.has(entry.id)) throw new Error(`duplicate Step 18 new ID: ${entry.id}`);
    if (!sourceIds.has(entry.targetId)) throw new Error(`Step 18 target not found in effective deck: ${entry.targetId}`);
    if (sourceIds.has(entry.id) && entry.id !== entry.targetId) throw new Error(`Step 18 new ID already exists before replacement: ${entry.id}`);
    targetIds.add(entry.targetId);
    newIds.add(entry.id);
    replacements.set(entry.targetId, entry);
  }

  let applied = 0;
  const positions = [];
  const out = cards.map((card, index) => {
    const entry = replacements.get(card.id);
    if (!entry) return card;
    applied += 1;
    positions.push({ position: index + 1, targetId: card.id, id: entry.id });
    return buildChunkCard(entry, policy);
  });

  if (applied !== policy.replacementCount) {
    throw new Error(`Step 18 applied ${applied} replacements; expected ${policy.replacementCount}`);
  }
  return { cards: out, applied, positions, policy };
}
