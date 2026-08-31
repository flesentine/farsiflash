#!/usr/bin/env node

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { applyConversationalChunkReplacements } from './lib/v5-chunks.mjs';
import { applyModernLifeCoverage } from './lib/v5-modern-life.mjs';
import { applyEnglishMeanings, loadMeaningPolicy, normalizeEnglishMeaning } from './lib/v5-meanings.mjs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, '..');
const batchesDir = path.join(root, 'data', 'v5', 'batches');
const deck = JSON.parse(fs.readFileSync(path.join(root, 'data', 'v5', 'deck.json'), 'utf8'));
const policy = loadMeaningPolicy();

function batchKey(name){ return name.replace(/(?:\.reviewed|\.compounds|\.registers)?\.mjs$/,''); }
function precedence(name){ if(name.endsWith('.registers.mjs')) return 3; if(name.endsWith('.compounds.mjs')) return 2; if(name.endsWith('.reviewed.mjs')) return 1; return 0; }
function batchStart(name){ const match=name.match(/^core-(\d+)/); return match ? Number(match[1]) : Number.MAX_SAFE_INTEGER; }

const all=fs.readdirSync(batchesDir).filter((name)=>name.endsWith('.mjs'));
const chosen=new Map();
for(const name of all){ const key=batchKey(name); const current=chosen.get(key); if(!current || precedence(name)>precedence(current)) chosen.set(key,name); }
const files=[...chosen.values()].sort((a,b)=>batchStart(a)-batchStart(b)||a.localeCompare(b));
const batchCards=[];
for(const file of files){ const mod=await import(pathToFileURL(path.join(batchesDir,file)).href); if(!Array.isArray(mod.default)) throw new Error(`${file} must default-export an array`); batchCards.push(...mod.default); }

const preChunk=[...deck.cards,...batchCards];
const chunkResult=applyConversationalChunkReplacements(preChunk);
const modernResult=applyModernLifeCoverage(chunkResult.cards);
const sourceCards=modernResult.cards;
const result=applyEnglishMeanings(sourceCards,policy);
const cards=result.cards;

const errors=[];
const fail=(m)=>errors.push(m);
const rules=policy.rules||{};
if(policy.version!=='english-meanings-v1-step20') fail(`unexpected policy version ${policy.version}`);
if(policy.step!==20) fail(`meaning policy step must be 20; found ${policy.step}`);
if(cards.length!==2000) fail(`Step 20 expects exactly 2000 effective cards; found ${cards.length}`);
if(chunkResult.applied!==38) fail(`Step 20 must run after all 38 Step 18 chunk promotions; found ${chunkResult.applied}`);
if(modernResult.applied!==11) fail(`Step 20 effective pipeline expects 11 Step 21 modern-life promotions; found ${modernResult.applied}`);

const ids=new Map(cards.map((card,index)=>[card.id,index+1]));
const sourceById=new Map(sourceCards.map((card)=>[card.id,normalizeEnglishMeaning(card.en)]));
const sourceSlashCount=sourceCards.filter((card)=>normalizeEnglishMeaning(card.en).includes('/')).length;
const overrides=policy.overrides||{};
for(const [id,override] of Object.entries(overrides)){
  const pos=ids.get(id);
  if(!pos){ fail(`stale Step 20 meaning override: ${id}`); continue; }
  if(typeof override.en!=='string'||!override.en.trim()) fail(`Step 20 override ${id} missing en`);
  if(typeof override.reason!=='string'||override.reason.trim().length<8) fail(`Step 20 override ${id} needs a reason`);
  if(normalizeEnglishMeaning(override.en)===sourceById.get(id)) fail(`Step 20 override ${id} does not change the source gloss`);
}
if(result.overridesApplied!==Object.keys(overrides).length) fail(`Step 20 applied ${result.overridesApplied} overrides but policy defines ${Object.keys(overrides).length}`);
if(result.autoCollapsed+result.overridesApplied<sourceSlashCount) fail(`Step 20 cleanup accounting is incomplete: sourceSlash=${sourceSlashCount}, autoCollapsed=${result.autoCollapsed}, overrides=${result.overridesApplied}`);

const duplicateMeanings=new Map();
let slashCount=0, semicolonCount=0, orCount=0, longCount=0;
for(const [index,card] of cards.entries()){
  const pos=index+1;
  const en=card.en;
  if(typeof en!=='string'||!en.trim()){ fail(`#${pos} ${card.id} missing English meaning`); continue; }
  if(en!==en.trim()) fail(`#${pos} ${card.id} English meaning has outer whitespace: ${JSON.stringify(en)}`);
  if(/\s{2,}/.test(en)) fail(`#${pos} ${card.id} English meaning has repeated spaces: ${JSON.stringify(en)}`);
  if(/[\r\n\t]/.test(en)) fail(`#${pos} ${card.id} English meaning contains control whitespace`);
  if(rules.maxChars && en.length>rules.maxChars){ longCount++; fail(`#${pos} ${card.id} English meaning too long (${en.length}): ${en}`); }
  if(rules.forbidSlash && /\//.test(en)){ slashCount++; fail(`#${pos} ${card.id} slash-separated meaning: ${en}`); }
  if(rules.forbidSemicolon && /;/.test(en)){ semicolonCount++; fail(`#${pos} ${card.id} semicolon-separated meaning: ${en}`); }
  if(rules.forbidOrSeparator && /\s+or\s+/i.test(en)){ orCount++; fail(`#${pos} ${card.id} multi-sense 'or' meaning: ${en}`); }
  for(const placeholder of rules.forbidPlaceholders||[]) if(en.toLowerCase().includes(String(placeholder).toLowerCase())) fail(`#${pos} ${card.id} placeholder/vague marker ${JSON.stringify(placeholder)}: ${en}`);
  if((en.match(/\(/g)||[]).length!==(en.match(/\)/g)||[]).length) fail(`#${pos} ${card.id} unbalanced parentheses: ${en}`);
  if(/^[,;:/]|[,;:/]$/.test(en)) fail(`#${pos} ${card.id} malformed edge punctuation: ${en}`);
  const normalized=en.toLowerCase().replace(/[.!?]/g,'').trim();
  if(!duplicateMeanings.has(normalized)) duplicateMeanings.set(normalized,[]);
  duplicateMeanings.get(normalized).push(pos);
}

const exactDuplicates=[...duplicateMeanings.entries()].filter(([,positions])=>positions.length>=4);
for(const [meaning,positions] of exactDuplicates.slice(0,20)) console.warn(`WARN repeated English meaning x${positions.length}: ${meaning} at ${positions.slice(0,8).join(',')}`);

for(const error of errors) console.error(`ERROR ${error}`);
if(errors.length){
  console.error(`\nStep 20 English meaning audit failed: ${errors.length} issue(s); sourceSlash=${sourceSlashCount}; overrides=${result.overridesApplied}; autoCollapsed=${result.autoCollapsed}; slash=${slashCount}; semicolon=${semicolonCount}; or=${orCount}; long=${longCount}`);
  process.exit(1);
}
console.log(`Step 20 English meaning audit passed: cards=${cards.length}, sourceSlash=${sourceSlashCount}, overrides=${result.overridesApplied}, autoCollapsed=${result.autoCollapsed}, step21=${modernResult.applied}, exactDuplicateGroups=${exactDuplicates.length}, maxChars=${rules.maxChars}`);
