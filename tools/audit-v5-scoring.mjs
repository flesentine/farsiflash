#!/usr/bin/env node

import { loadScoringRules, scoreCandidate, checkCandidateAtPosition } from './lib/v5-scoring.mjs';

const rules = loadScoringRules();
const errors = [];
const fail = (message) => errors.push(message);

const weightTotal = Object.values(rules.baseWeights).reduce((sum, value) => sum + value, 0);
if (weightTotal !== 100) fail(`baseWeights must total 100; found ${weightTotal}`);

const categoryTotal = Object.values(rules.categoryTargets).reduce((sum, value) => sum + value, 0);
if (categoryTotal !== 2000) fail(`categoryTargets must total 2000; found ${categoryTotal}`);

const requiredSignals = ['conversationalFrequency', 'speakerDispersion', 'practicalUsefulness', 'generativeValue', 'modernRelevance', 'writtenFrequency'];
for (const signal of requiredSignals) {
  if (!(signal in rules.baseWeights)) fail(`missing scoring signal: ${signal}`);
}

for (const [tag, value] of Object.entries(rules.bonuses)) {
  if (!Number.isFinite(value) || value <= 0) fail(`bonus ${tag} must be positive`);
}
for (const [tag, value] of Object.entries(rules.penalties)) {
  if (!Number.isFinite(value) || value >= 0) fail(`penalty ${tag} must be negative`);
}

if (!Array.isArray(rules.stageRanges) || rules.stageRanges.length === 0) fail('stageRanges must be a non-empty array');
let expectedStart = 1;
for (const stage of rules.stageRanges || []) {
  if (stage.start !== expectedStart) fail(`stage ${stage.id} should start at ${expectedStart}; found ${stage.start}`);
  if (!Number.isInteger(stage.end) || stage.end < stage.start) fail(`stage ${stage.id} has invalid end ${stage.end}`);
  expectedStart = stage.end + 1;
}
if (expectedStart !== 2001) fail(`stageRanges must cover exactly positions 1..2000; ended at ${expectedStart - 1}`);

for (const [name, gate] of Object.entries(rules.orderingGates)) {
  if (gate.minimumScore != null && (gate.minimumScore < 0 || gate.minimumScore > 100)) fail(`${name}.minimumScore must be 0..100`);
  if (gate.minimumPracticalUsefulness != null && (gate.minimumPracticalUsefulness < 0 || gate.minimumPracticalUsefulness > 100)) fail(`${name}.minimumPracticalUsefulness must be 0..100`);
}

const everydayCompoundVerb = {
  register: 'everyday',
  category: 'verbs',
  millerRank: 1800,
  tags: ['productive-compound-verb', 'spoken-form', 'high-transfer-pattern'],
  signals: {
    conversationalFrequency: 92,
    speakerDispersion: 90,
    practicalUsefulness: 96,
    generativeValue: 95,
    modernRelevance: 95
  }
};

const formalNewsWord = {
  register: 'formal',
  category: 'reading-news',
  millerRank: 80,
  tags: ['formal-only', 'news-domain'],
  signals: {
    conversationalFrequency: 22,
    speakerDispersion: 40,
    practicalUsefulness: 20,
    generativeValue: 25,
    modernRelevance: 55
  }
};

const everyday = scoreCandidate(everydayCompoundVerb, rules);
const formal = scoreCandidate(formalNewsWord, rules);
if (everyday.score <= formal.score) fail(`everyday compound verb (${everyday.score}) must outrank formal news word (${formal.score})`);
if (!checkCandidateAtPosition(everydayCompoundVerb, 100, rules).gatePassed) fail('high-value everyday compound verb should be eligible for the first 100');
if (checkCandidateAtPosition(formalNewsWord, 100, rules).gatePassed) fail('formal news word must not be eligible for the first 100');
if (checkCandidateAtPosition(formalNewsWord, 500, rules).gatePassed) fail('formal news word must not be eligible for the first 1000');

const obsolete = {
  register: 'literary',
  category: 'culture',
  millerRank: 10,
  tags: ['obsolete'],
  signals: {
    conversationalFrequency: 0,
    speakerDispersion: 0,
    practicalUsefulness: 0,
    generativeValue: 0,
    modernRelevance: 0
  }
};
if (!scoreCandidate(obsolete, rules).hardRejected) fail('obsolete-tagged candidates must be hard rejected regardless of corpus rank');

if (errors.length) {
  for (const error of errors) console.error(`ERROR ${error}`);
  console.error(`\nv5 scoring audit failed: ${errors.length} error(s)`);
  process.exit(1);
}

console.log(`v5 scoring audit passed: weights=${weightTotal}, categoryTargets=${categoryTotal}, stages=1..2000`);
console.log(`fixture scores: everyday compound verb=${everyday.score}, formal news word=${formal.score}`);
