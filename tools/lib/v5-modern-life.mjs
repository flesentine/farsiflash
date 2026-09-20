import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { scoreCandidate } from './v5-scoring.mjs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, '../..');
const defaultPolicyPath = path.join(root, 'data', 'v5', 'modern-life-step21.json');

export function loadModernLifePolicy(policyPath = defaultPolicyPath) {
  return JSON.parse(fs.readFileSync(policyPath, 'utf8'));
}

function buildReplacement(target, replacement, policy) {
  const profile = policy.profiles?.[replacement.profile];
  if (!profile) throw new Error(`Step 21 replacement ${replacement.id} references unknown profile ${replacement.profile}`);
  if (typeof replacement.reason !== 'string' || replacement.reason.trim().length < 16) {
    throw new Error(`Step 21 replacement ${replacement.id} needs a substantive reason`);
  }
  const tags = [...new Set([...(profile.tags || []), 'step21-modern-life'])];
  const signals = { ...profile.signals };
  const candidate = {
    register: profile.register,
    category: profile.category,
    millerRank: null,
    tags,
    signals
  };
  const out = {
    ...target,
    id: replacement.id,
    fa: replacement.fa,
    roman: replacement.roman,
    en: replacement.en,
    register: profile.register,
    category: profile.category,
    millerRank: null,
    tags,
    selection: {
      score: scoreCandidate(candidate).score,
      signals,
      editorialOverride: {
        direction: 'promote',
        reason: replacement.reason.trim()
      }
    }
  };
  for (const key of ['spokenFa','formalFa','spokenRoman','formalRoman','exampleFa','exampleRoman','exampleEn']) delete out[key];
  return out;
}

export function applyModernLifeCoverage(cards, policy = loadModernLifePolicy()) {
  if (!Array.isArray(cards)) throw new Error('cards must be an array');
  const replacements = policy.replacements || [];
  const byTarget = new Map();
  const newIds = new Set();
  for (const replacement of replacements) {
    if (!replacement?.targetId || !replacement?.id) throw new Error('Step 21 replacement requires targetId and id');
    if (byTarget.has(replacement.targetId)) throw new Error(`duplicate Step 21 target ${replacement.targetId}`);
    if (newIds.has(replacement.id)) throw new Error(`duplicate Step 21 replacement id ${replacement.id}`);
    byTarget.set(replacement.targetId, replacement);
    newIds.add(replacement.id);
  }

  const sourceIds = new Set(cards.map((card) => card?.id));
  for (const id of newIds) if (sourceIds.has(id)) throw new Error(`Step 21 replacement id already exists before overlay: ${id}`);

  const positions = [];
  const seenTargets = new Set();
  const out = cards.map((card, index) => {
    const replacement = byTarget.get(card?.id);
    if (!replacement) return card;
    if (seenTargets.has(card.id)) throw new Error(`Step 21 target appears more than once: ${card.id}`);
    seenTargets.add(card.id);
    positions.push({ position: index + 1, targetId: card.id, id: replacement.id });
    return buildReplacement(card, replacement, policy);
  });

  for (const targetId of byTarget.keys()) if (!seenTargets.has(targetId)) throw new Error(`Step 21 target not found: ${targetId}`);
  return { cards: out, policy, applied: positions.length, positions };
}
