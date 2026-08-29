import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';

const root = process.cwd();
const dataDir = path.join(root, 'data');
const files = fs.readdirSync(dataDir)
  .filter((name) => /^miller-\d\d\.js$/.test(name))
  .sort();

const sandbox = { window: {} };
sandbox.window.window = sandbox.window;
vm.createContext(sandbox);

for (const file of files) {
  const source = fs.readFileSync(path.join(dataDir, file), 'utf8');
  vm.runInContext(source, sandbox, { filename: file });
}

const entries = (sandbox.window.FARSI_MILLER_CHUNKS || []).flat();
const candidates = [];
const seenRanks = new Set();

function normalizedRoman(value) {
  return String(value || '')
    .toLowerCase()
    .replace(/[^a-z]/g, '');
}

for (const entry of entries) {
  const [roman, fa, en, rank] = entry;
  const reasons = [];
  const r = normalizedRoman(roman);

  if (!Number.isInteger(rank)) reasons.push('rank is not an integer');
  if (seenRanks.has(rank)) reasons.push('duplicate rank');
  seenRanks.add(rank);

  if (/[يك]/u.test(fa)) reasons.push('Arabic yeh/kaf codepoint');
  if (/\uFFFD/u.test(fa)) reasons.push('replacement character');
  if (/اا/u.test(fa)) reasons.push('double alef');

  // The published Miller list contains a recurring extraction bug where the
  // lam-alef sequence (لا) is reversed to alef-lam (ال). Romanization is a
  // useful independent signal: words containing a pronounced "la" should
  // normally contain لا somewhere in the Persian spelling.
  if (r.includes('la') && fa.includes('ال') && !fa.includes('لا')) {
    reasons.push('possible reversed lam-alef');
  }

  if (reasons.length) candidates.push({ rank, roman, fa, en, reasons });
}

console.log(`Scanned ${entries.length} Miller entries from ${files.length} chunks.`);
if (!candidates.length) {
  console.log('No suspicious source spellings detected.');
  process.exit(0);
}

for (const item of candidates) {
  console.log(`${item.rank}\t${item.roman}\t${item.fa}\t${item.reasons.join(', ')}`);
}
console.log(`Suspicious entries: ${candidates.length}`);

if (process.argv.includes('--strict')) process.exit(1);
