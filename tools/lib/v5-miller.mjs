import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';

export function loadRawMiller(root = process.cwd()) {
  const dataDir = path.join(root, 'data');
  const files = fs.readdirSync(dataDir)
    .filter((name) => /^miller-\d\d\.js$/.test(name))
    .sort();

  const chunks = [];
  const sandbox = { window: { FARSI_MILLER_CHUNKS: chunks }, FARSI_MILLER_CHUNKS: chunks };
  sandbox.window.window = sandbox.window;
  vm.createContext(sandbox);

  for (const file of files) {
    const source = fs.readFileSync(path.join(dataDir, file), 'utf8');
    vm.runInContext(source, sandbox, { filename: file });
  }

  return { files, entries: chunks.flat() };
}

export function loadMillerV5(root = process.cwd()) {
  const raw = loadRawMiller(root);
  const overridePath = path.join(root, 'data', 'v5', 'miller-spelling-overrides.json');
  const overrideDoc = JSON.parse(fs.readFileSync(overridePath, 'utf8'));
  const corrections = overrideDoc.corrections || [];
  const byRank = new Map();

  for (const correction of corrections) {
    if (byRank.has(correction.rank)) {
      throw new Error(`Duplicate Miller correction rank ${correction.rank}`);
    }
    byRank.set(correction.rank, correction);
  }

  const seenOverrides = new Set();
  const entries = raw.entries.map(([roman, fa, en, rank]) => {
    const correction = byRank.get(rank);
    if (!correction) return [roman, fa, en, rank];
    if (fa !== correction.from) {
      throw new Error(`Miller correction rank ${rank} expected ${correction.from} but source has ${fa}`);
    }
    seenOverrides.add(rank);
    return [roman, correction.to, en, rank];
  });

  for (const rank of byRank.keys()) {
    if (!seenOverrides.has(rank)) throw new Error(`Miller correction rank ${rank} does not exist in source`);
  }

  return { ...raw, rawEntries: raw.entries, entries, corrections };
}
