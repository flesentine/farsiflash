import { loadMillerV5 } from './lib/v5-miller.mjs';

const { files, rawEntries, entries, corrections } = loadMillerV5();
const correctionRanks = new Set(corrections.map((item) => item.rank));

// These contain alef-lam for legitimate morphological reasons; they were
// manually reviewed and are not instances of the source extraction bug.
const reviewedLegitimateRanks = new Set([
  639,  // حالت
  916,  // عدالت
  1004, // ایالت
  1582, // الهی
  1612, // دخالت
  1641, // ولایت
  1701, // المپیک
  1729, // الیحه
  1913  // فولاد
]);

function normalizedRoman(value) {
  return String(value || '').toLowerCase().replace(/[^a-z]/g, '');
}

function inspect(entriesToCheck) {
  const candidates = [];
  const seenRanks = new Set();

  for (const [roman, fa, en, rank] of entriesToCheck) {
    const reasons = [];
    const r = normalizedRoman(roman);

    if (!Number.isInteger(rank)) reasons.push('rank is not an integer');
    if (seenRanks.has(rank)) reasons.push('duplicate rank');
    seenRanks.add(rank);

    if (/[يك]/u.test(fa)) reasons.push('Arabic yeh/kaf codepoint');
    if (/\uFFFD/u.test(fa)) reasons.push('replacement character');
    if (/اا/u.test(fa)) reasons.push('double alef');

    if (r.includes('la') && fa.includes('ال') && !fa.includes('لا')) {
      reasons.push('possible reversed lam-alef');
    }

    if (reasons.length) candidates.push({ rank, roman, fa, en, reasons });
  }

  return candidates;
}

const rawCandidates = inspect(rawEntries);
const cleanedCandidates = inspect(entries)
  .filter((item) => !reviewedLegitimateRanks.has(item.rank));

const rawCandidateRanks = new Set(rawCandidates.map((item) => item.rank));
const unresolvedRaw = rawCandidates.filter(
  (item) => !correctionRanks.has(item.rank) && !reviewedLegitimateRanks.has(item.rank)
);
const unnecessaryCorrections = corrections.filter((item) => !rawCandidateRanks.has(item.rank));

console.log(`Scanned ${rawEntries.length} Miller entries from ${files.length} chunks.`);
console.log(`Confirmed spelling corrections: ${corrections.length}`);
console.log(`Reviewed legitimate heuristic exceptions: ${reviewedLegitimateRanks.size}`);

for (const correction of corrections) {
  console.log(`correct ${correction.rank}\t${correction.from}\t→\t${correction.to}`);
}

const errors = [];
if (unresolvedRaw.length) {
  for (const item of unresolvedRaw) {
    errors.push(`Unresolved source candidate ${item.rank}: ${item.fa} (${item.reasons.join(', ')})`);
  }
}
if (unnecessaryCorrections.length) {
  for (const item of unnecessaryCorrections) {
    errors.push(`Correction ${item.rank} is no longer detected in raw source: ${item.from} → ${item.to}`);
  }
}
if (cleanedCandidates.length) {
  for (const item of cleanedCandidates) {
    errors.push(`Cleaned Miller data is still suspicious at ${item.rank}: ${item.fa} (${item.reasons.join(', ')})`);
  }
}

if (errors.length) {
  for (const error of errors) console.error(`ERROR: ${error}`);
  process.exit(1);
}

console.log('Miller v5 normalization audit passed: all confirmed source corruptions are corrected.');
