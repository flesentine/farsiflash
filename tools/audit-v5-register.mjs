#!/usr/bin/env node

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { applyConversationalChunkReplacements } from './lib/v5-chunks.mjs';
import { applyModernLifeCoverage } from './lib/v5-modern-life.mjs';
import { applyRegisterAudit } from './lib/v5-register.mjs';
import { loadRegisterPairPolicy, normalizeFa } from './lib/v5-romanization.mjs';

const __dirname=path.dirname(fileURLToPath(import.meta.url));
const root=path.resolve(__dirname,'..');
const v5Dir=path.join(root,'data','v5');
const batchesDir=path.join(v5Dir,'batches');
const deck=JSON.parse(fs.readFileSync(path.join(v5Dir,'deck.json'),'utf8'));
const registerPolicy=loadRegisterPairPolicy();
const auditPolicy=JSON.parse(fs.readFileSync(path.join(v5Dir,'register-audit-step22.json'),'utf8'));

function batchKey(n){return n.replace(/(?:\.reviewed|\.compounds|\.registers)?\.mjs$/,'');}
function precedence(n){if(n.endsWith('.registers.mjs'))return 3;if(n.endsWith('.compounds.mjs'))return 2;if(n.endsWith('.reviewed.mjs'))return 1;return 0;}
function batchStart(n){const m=n.match(/^core-(\d+)/);return m?Number(m[1]):Number.MAX_SAFE_INTEGER;}
const all=fs.readdirSync(batchesDir).filter(n=>n.endsWith('.mjs'));
const chosen=new Map();
for(const n of all){const k=batchKey(n),cur=chosen.get(k);if(!cur||precedence(n)>precedence(cur))chosen.set(k,n);}
const files=[...chosen.values()].sort((a,b)=>batchStart(a)-batchStart(b)||a.localeCompare(b));
const batchCards=[];
for(const f of files){const mod=await import(pathToFileURL(path.join(batchesDir,f)).href);batchCards.push(...mod.default);}
const chunkResult=applyConversationalChunkReplacements([...deck.cards,...batchCards]);
const modernResult=applyModernLifeCoverage(chunkResult.cards);
const registerResult=applyRegisterAudit(modernResult.cards,registerPolicy);
const cards=registerResult.cards;
const pairs=new Map((registerPolicy.requiredPairs||[]).map(p=>[p.id,p]));

const errors=[];
const fail=m=>errors.push(m);
if(auditPolicy.version!=='register-audit-v1-step22') fail(`unexpected Step 22 policy version ${auditPolicy.version}`);
if(auditPolicy.step!==22) fail(`Step 22 policy step must be 22; found ${auditPolicy.step}`);
if(cards.length!==2000) fail(`Step 22 expects 2000 cards; found ${cards.length}`);
if(pairs.size!==auditPolicy.expectedPairCount) fail(`Step 22 pair count ${pairs.size} != expected ${auditPolicy.expectedPairCount}`);

const counts={};
const stages={core100:[1,100],core300:[1,300],daily750:[301,750],practical1250:[751,1250],wide1750:[1251,1750],bridge2000:[1751,2000]};
for(const [name,[a,b]] of Object.entries(stages)){
  counts[name]={};
  for(let i=a-1;i<b;i++){const r=cards[i]?.register||'missing';counts[name][r]=(counts[name][r]||0)+1;}
}

const spokenUnpaired=[];
const formalEarly=[];
const writtenEarly=[];
const literaryEarly=[];
const colloquialNeutral=[];
const pairIssues=[];
const pairLabelIssues=[];
const readingNewsEarly=[];
const readingNewsBadRegister=[];
const colloquialPatterns=[
  /می‌(خوام|خواد|تونی|تونه|شه|شم|شی|شیم|شین|گم|گی|گه|گیم|گین|اد|ای|ایم|این)/,
  /نمی‌(خوام|خواد|تونی|تونه|شه|شم|شی|شیم|شین|دون|گم|گی|گه|گیم|گین|اد|ای|ایم|این)/,
  /(اومد|نیومد|خونه|مهمون|خیابون|گرون|ارزون|آسون|کوچیک|دیگه|کدوم|واسه|توی|هیچی)/,
  /(^|\s)یه(?=\s|$)/,
  /(^|\s)رو(?=\s|$)/
];

for(const [index,card] of cards.entries()){
  const pos=index+1;
  if(card.register==='spoken'&&!pairs.has(card.id)) spokenUnpaired.push({pos,id:card.id,fa:card.fa,category:card.category});
  if(pos<auditPolicy.formalBridgeStartsAt&&card.register==='formal') formalEarly.push({pos,id:card.id,fa:card.fa,category:card.category});
  if(pos<auditPolicy.formalBridgeStartsAt&&card.register==='written') writtenEarly.push({pos,id:card.id,fa:card.fa,category:card.category});
  if(pos<auditPolicy.formalBridgeStartsAt&&card.register==='literary') literaryEarly.push({pos,id:card.id,fa:card.fa,category:card.category});
  if(['neutral','everyday'].includes(card.register)&&colloquialPatterns.some(re=>re.test(card.fa))) colloquialNeutral.push({pos,id:card.id,fa:card.fa,register:card.register});
  if(card.category==='reading-news'&&pos<auditPolicy.formalBridgeStartsAt) readingNewsEarly.push({pos,id:card.id,fa:card.fa});
  if(card.category==='reading-news'&&!['formal','written'].includes(card.register)) readingNewsBadRegister.push({pos,id:card.id,fa:card.fa,register:card.register});
  const pair=pairs.get(card.id);
  if(pair){
    const primary=normalizeFa(card.fa),spoken=normalizeFa(pair.spoken),formal=normalizeFa(pair.formal);
    if(primary!==spoken&&primary!==formal) pairIssues.push({pos,id:card.id,fa:card.fa,spoken:pair.spoken,formal:pair.formal});
    if(primary===spoken&&spoken!==formal&&card.register!=='spoken') pairLabelIssues.push({pos,id:card.id,fa:card.fa,register:card.register});
  }
}

const actualUnpaired=new Set(spokenUnpaired.map(row=>row.id));
const reviewedUnpaired=new Set(auditPolicy.reviewedUnpairedSpokenIds||[]);
for(const id of actualUnpaired) if(!reviewedUnpaired.has(id)) fail(`unreviewed spoken card without pair: ${id}`);
for(const id of reviewedUnpaired){
  if(!actualUnpaired.has(id)) fail(`stale reviewed-unpaired spoken ID: ${id}`);
}
if(colloquialNeutral.length) for(const row of colloquialNeutral) fail(`colloquial primary is not labeled spoken at #${row.pos}: ${row.id} ${row.fa}`);
if(formalEarly.length) fail(`${formalEarly.length} formal cards appear before ${auditPolicy.formalBridgeStartsAt}`);
if(writtenEarly.length) fail(`${writtenEarly.length} written cards appear before ${auditPolicy.formalBridgeStartsAt}`);
if(literaryEarly.length) fail(`${literaryEarly.length} literary cards appear before ${auditPolicy.formalBridgeStartsAt}`);
if(readingNewsEarly.length) fail(`${readingNewsEarly.length} reading-news cards appear before ${auditPolicy.formalBridgeStartsAt}`);
if(readingNewsBadRegister.length) fail(`${readingNewsBadRegister.length} reading-news cards are not formal/written`);
if(pairIssues.length) fail(`${pairIssues.length} required pairs have primary-form mismatches`);
if(pairLabelIssues.length) fail(`${pairLabelIssues.length} spoken-primary pairs are not labeled spoken`);

console.log(`Step 22 register audit: cards=${cards.length}, pairs=${pairs.size}, reviewedUnpaired=${reviewedUnpaired.size}, normalizedToSpoken=${registerResult.normalizedToSpoken}, chunkPromotions=${chunkResult.applied}, modernLifePromotions=${modernResult.applied}`);
for(const [name,value] of Object.entries(counts)) console.log(`stage ${name}: ${JSON.stringify(value)}`);
console.log(`formal-before-bridge=${formalEarly.length}, written-before-bridge=${writtenEarly.length}, literary-before-bridge=${literaryEarly.length}, reading-news-before-bridge=${readingNewsEarly.length}`);
console.log(`colloquial-label-errors=${colloquialNeutral.length}, pair-primary-mismatch=${pairIssues.length}, pair-label-mismatch=${pairLabelIssues.length}`);
for(const error of errors) console.error(`ERROR ${error}`);
if(errors.length){console.error(`\nStep 22 register audit failed: ${errors.length} error(s)`);process.exit(1);}
console.log('Step 22 register audit passed: every spoken card is paired or explicitly reviewed, and formal/news material stays in the final bridge.');
