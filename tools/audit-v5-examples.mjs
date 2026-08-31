#!/usr/bin/env node

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { applyConversationalChunkReplacements } from './lib/v5-chunks.mjs';
import { applyModernLifeCoverage } from './lib/v5-modern-life.mjs';
import { applyRomanizationToCards, normalizeFa, sanitizeRoman } from './lib/v5-romanization.mjs';
import { applyExampleSentences, loadExamplePolicy, normalizeExampleFa, normalizeExampleRoman } from './lib/v5-examples.mjs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, '..');
const batchesDir = path.join(root, 'data', 'v5', 'batches');
const deck = JSON.parse(fs.readFileSync(path.join(root, 'data', 'v5', 'deck.json'), 'utf8'));
const policy = loadExamplePolicy();

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
const romanized=applyRomanizationToCards(modernResult.cards);
const exampleResult=applyExampleSentences(romanized, policy);
const cards=exampleResult.cards;

const errors=[];
const warnings=[];
const fail=(message)=>errors.push(message);
const warn=(message)=>warnings.push(message);
const PERSIAN=/[\u0600-\u06ff]/;
const ASCII=/[A-Za-z]/;
const ROMAN_RE=/^[a-z0-9 /.,!?()]+$/;

if(policy.version!=='example-sentences-v1-step19') fail(`unexpected example policy version ${policy.version}`);
if(policy.step!==19) fail(`example policy step must be 19; found ${policy.step}`);
if(cards.length!==2000) fail(`Step 19 example audit expects exactly 2000 effective cards; found ${cards.length}`);
if(chunkResult.applied!==38) fail(`Step 19 must run after all 38 Step 18 chunk promotions; found ${chunkResult.applied}`);
if(modernResult.applied!==11) fail(`Step 19 effective pipeline expects 11 Step 21 modern-life promotions; found ${modernResult.applied}`);

const expectedCategories=['conversation','grammar','verbs','people','home','food','shopping','travel','social','work','school','health','technology','culture','reading-news'];
for(const category of expectedCategories) if(!policy.frames?.[category]) fail(`Step 19 missing frame for ${category}`);

const ids=new Map(cards.map((card,index)=>[card.id,index+1]));
for(const id of Object.keys(policy.curated||{})) if(!ids.has(id)) fail(`stale Step 19 curated example ID: ${id}`);

const examples=new Map();
let curatedApplied=0;
let totalFaChars=0;

cards.forEach((card,index)=>{
  const pos=index+1;
  for(const key of ['exampleFa','exampleRoman','exampleEn']) {
    if(typeof card[key]!=='string'||!card[key].trim()) fail(`#${pos} ${card.id} missing ${key}`);
  }
  if(typeof card.exampleFa!=='string'||typeof card.exampleRoman!=='string'||typeof card.exampleEn!=='string') return;
  totalFaChars += card.exampleFa.length;
  if(card.exampleFa.length>140) warn(`#${pos} ${card.id} long Persian example (${card.exampleFa.length} chars)`);
  if(card.exampleRoman.length>190) warn(`#${pos} ${card.id} long Romanized example (${card.exampleRoman.length} chars)`);
  if(card.exampleEn.length>180) warn(`#${pos} ${card.id} long English example (${card.exampleEn.length} chars)`);
  if(!PERSIAN.test(card.exampleFa)) fail(`#${pos} ${card.id} exampleFa lacks Persian text`);
  if(ASCII.test(card.exampleFa)) fail(`#${pos} ${card.id} exampleFa contains ASCII letters: ${card.exampleFa}`);
  if(/ي/.test(card.exampleFa)) fail(`#${pos} ${card.id} exampleFa uses Arabic ي`);
  if(/ك/.test(card.exampleFa)) fail(`#${pos} ${card.id} exampleFa uses Arabic ك`);
  if(!ROMAN_RE.test(card.exampleRoman)) fail(`#${pos} ${card.id} exampleRoman outside learner-roman-v1: ${card.exampleRoman}`);
  if(card.exampleRoman!==card.exampleRoman.toLowerCase()) fail(`#${pos} ${card.id} exampleRoman must be lowercase`);
  if(sanitizeRoman(card.exampleRoman)!==card.exampleRoman) fail(`#${pos} ${card.id} exampleRoman is not sanitized`);
  if(/[{}]|TODO|TBD/i.test(card.exampleFa+card.exampleRoman+card.exampleEn)) fail(`#${pos} ${card.id} example contains placeholder text`);

  const targetFa=normalizeExampleFa(card.fa);
  const contextFa=normalizeExampleFa(card.exampleFa);
  if(targetFa && !contextFa.includes(targetFa)) fail(`#${pos} ${card.id} exampleFa does not contain target form ${card.fa}`);

  const targetRoman=normalizeExampleRoman(card.roman);
  const contextRoman=normalizeExampleRoman(card.exampleRoman);
  if(targetRoman && !contextRoman.includes(targetRoman)) fail(`#${pos} ${card.id} exampleRoman does not contain target Romanization ${card.roman}`);

  const normalized=normalizeFa(card.exampleFa);
  const first=examples.get(normalized);
  if(first && normalizeFa(card.fa)!==normalizeFa(cards[first-1].fa)) warn(`#${pos} ${card.id} repeats example from #${first}: ${card.exampleFa}`);
  else if(!first) examples.set(normalized,pos);

  if(policy.curated?.[card.id]) curatedApplied += 1;
});

if(examples.size<1950) fail(`Step 19 examples need broad lexical diversity; only ${examples.size} unique Persian examples across 2000 cards`);
if(curatedApplied<Object.keys(policy.curated||{}).length) fail(`not all curated Step 19 examples were applied: ${curatedApplied}/${Object.keys(policy.curated||{}).length}`);

const sourceCurated=exampleResult.sources.curated||0;
const sourceStandalone=exampleResult.sources.standalone||0;
const sourceExplicit=exampleResult.sources.card||0;
const sourceFramed=Object.entries(exampleResult.sources).filter(([name])=>name.startsWith('frame:')).reduce((sum,[,count])=>sum+count,0);
if(sourceCurated+sourceStandalone+sourceExplicit+sourceFramed!==cards.length) fail('Step 19 source accounting does not total 2000 cards');
if(sourceStandalone<100) warn(`only ${sourceStandalone} standalone utterance examples detected; expected substantial chunk coverage`);

const averageFa=Math.round((totalFaChars/cards.length)*10)/10;
for(const warning of warnings) console.warn(`WARN ${warning}`);
for(const error of errors) console.error(`ERROR ${error}`);
if(errors.length){ console.error(`\nStep 19 example audit failed: ${errors.length} error(s), ${warnings.length} warning(s)`); process.exit(1); }
console.log(`Step 19 example audit passed: cards=${cards.length}, curated=${sourceCurated}, standalone=${sourceStandalone}, framed=${sourceFramed}, explicit=${sourceExplicit}, step21=${modernResult.applied}, uniqueFa=${examples.size}, avgFaChars=${averageFa}, warnings=${warnings.length}`);
console.log(`example sources: ${JSON.stringify(exampleResult.sources)}`);
