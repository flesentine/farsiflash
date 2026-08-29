import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, '..', '..');
const defaultRulesPath = path.join(root, 'data', 'v5', 'scoring-rules.json');

export function loadScoringRules(rulesPath = defaultRulesPath) {
  return JSON.parse(fs.readFileSync(rulesPath, 'utf8'));
}

export function millerRankToWrittenFrequency(rank, rules = loadScoringRules()) {
  if (rank == null) return null;
  if (!Number.isFinite(rank) || rank < 1) throw new Error(`Invalid Miller rank: ${rank}`);
  const ceiling = rules.millerRank.rankCeiling;
  if (rank >= ceiling) return 0;
  return Math.max(0, Math.min(100, ((ceiling - rank) / (ceiling - 1)) * 100));
}

function requireSignal(name, value) {
  if (!Number.isFinite(value) || value < 0 || value > 100) {
    throw new Error(`${name} must be a number from 0 to 100; got ${value}`);
  }
  return value;
}

export function scoreCandidate(candidate, rules = loadScoringRules()) {
  const signals = { ...(candidate.signals || {}) };

  if (signals.writtenFrequency == null && candidate.millerRank != null) {
    signals.writtenFrequency = millerRankToWrittenFrequency(candidate.millerRank, rules);
  }

  const weightedParts = {};
  let baseScore = 0;
  for (const [name, weight] of Object.entries(rules.baseWeights)) {
    const value = requireSignal(name, signals[name]);
    const points = value * (weight / 100);
    weightedParts[name] = points;
    baseScore += points;
  }

  const tags = new Set(candidate.tags || []);
  const hardRejects = rules.hardRejectTags.filter((tag) => tags.has(tag));

  let bonus = 0;
  const appliedBonuses = [];
  for (const [tag, points] of Object.entries(rules.bonuses)) {
    if (tags.has(tag)) {
      bonus += points;
      appliedBonuses.push({ tag, points });
    }
  }
  bonus = Math.min(bonus, rules.adjustmentCaps.maxBonus);

  let penalty = 0;
  const appliedPenalties = [];
  for (const [tag, points] of Object.entries(rules.penalties)) {
    if (tags.has(tag)) {
      penalty += points;
      appliedPenalties.push({ tag, points });
    }
  }
  penalty = Math.max(penalty, -Math.abs(rules.adjustmentCaps.maxPenaltyMagnitude));

  const rawScore = baseScore + bonus + penalty;
  const score = Math.round(Math.max(rules.scoreRange[0], Math.min(rules.scoreRange[1], rawScore)) * 10) / 10;

  return {
    score,
    baseScore: Math.round(baseScore * 10) / 10,
    bonus,
    penalty,
    hardRejected: hardRejects.length > 0,
    hardRejects,
    signals,
    weightedParts,
    appliedBonuses,
    appliedPenalties
  };
}

export function gateForPosition(position, rules = loadScoringRules()) {
  if (!Number.isInteger(position) || position < 1 || position > 2000) {
    throw new Error(`position must be an integer from 1 to 2000; got ${position}`);
  }
  if (position <= 100) return rules.orderingGates.first100;
  if (position <= 300) return rules.orderingGates.first300;
  if (position <= 1000) return rules.orderingGates.first1000;
  if (position <= 1750) return rules.orderingGates.first1750;
  return rules.orderingGates.final250;
}

export function checkCandidateAtPosition(candidate, position, rules = loadScoringRules()) {
  const result = scoreCandidate(candidate, rules);
  const gate = gateForPosition(position, rules);
  const failures = [];
  const tags = new Set(candidate.tags || []);

  if (result.hardRejected) failures.push(`hard-rejected tags: ${result.hardRejects.join(', ')}`);
  if (gate.minimumScore != null && result.score < gate.minimumScore) {
    failures.push(`score ${result.score} is below minimum ${gate.minimumScore}`);
  }
  if (gate.minimumPracticalUsefulness != null && candidate.signals.practicalUsefulness < gate.minimumPracticalUsefulness) {
    failures.push(`practicalUsefulness ${candidate.signals.practicalUsefulness} is below minimum ${gate.minimumPracticalUsefulness}`);
  }
  if (gate.allowedRegisters && !gate.allowedRegisters.includes(candidate.register)) {
    failures.push(`register ${candidate.register} is not allowed at position ${position}`);
  }
  if (gate.forbiddenCategories?.includes(candidate.category)) {
    failures.push(`category ${candidate.category} is forbidden at position ${position}`);
  }
  for (const tag of gate.forbiddenTags || []) {
    if (tags.has(tag)) failures.push(`tag ${tag} is forbidden at position ${position}`);
  }

  if (position <= 1000 && ['formal', 'written', 'literary'].includes(candidate.register)) {
    if (!tags.has(rules.orderingGates.first1000.formalBridgeExceptionTag)) {
      failures.push(`register ${candidate.register} requires ${rules.orderingGates.first1000.formalBridgeExceptionTag} before position 1001`);
    }
  }

  return { ...result, position, gatePassed: failures.length === 0, gateFailures: failures };
}
