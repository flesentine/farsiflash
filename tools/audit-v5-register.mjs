#!/usr/bin/env node

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { applyConversationalChunkReplacements } from './lib/v5-chunks.mjs';
import { applyModernLifeCoverage } from './lib/v5-modern-life.mjs';
import { loadRegisterPairPolicy, normalizeFa } from './lib/v5-romanization.mjs';

const __dirname=path.dirname(fileURLToPath(import.meta.url));
const root=path.resolve(__dirname,'..');
const v5Dir=path.join(root,'data','v5');
const batchesDir=path.join(v5Dir,'batches');
const deck=JSON.parse(fs.readFileSync(path.join(v5Dir,'deck.json'),'utf8'));
const registerPolicy=loadRegisterPairPolicy();

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
const cards=modernResult.cards;
const pairs=new Map((registerPolicy.requiredPairs||[]).map(p=>[p.id,p]));

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
const colloquialPatterns=[
  /می‌(خوام|خواد|تونی|تونه|شه|شم|شی|شیم|شین|گم|گی|گه|گیم|گین|اد|ای|ایم|این)/,
  /نمی‌(خوام|خواد|تونی|تونه|شه|شم|شی|شیم|شین|دون|گم|گی|گه|گیم|گین|اد|ای|ایم|این)/,
  /(اومد|نیومد|خونه|مهمون|خیابون|گرون|ارزون|آسون|کوچیک|دیگه|کدوم|واسه|توی|\bرو\b|هیچی|یه )/
];

for(const [index,card] of cards.entries()){
  const pos=index+1;
  if(card.register==='spoken'&&!pairs.has(card.id)) spokenUnpaired.push({pos,id:card.id,fa:card.fa,category:card.category});
  if(pos<1751&&card.register==='formal') formalEarly.push({pos,id:card.id,fa:card.fa,category:card.category});
  if(pos<1751&&card.register==='written') writtenEarly.push({pos,id:card.id,fa:card.fa,category:card.category});
  if(pos<1751&&card.register==='literary') literaryEarly.push({pos,id:card.id,fa:card.fa,category:card.category});
  if(['neutral','everyday'].includes(card.register)&&colloquialPatterns.some(re=>re.test(card.fa))) colloquialNeutral.push({pos,id:card.id,fa:card.fa,register:card.register});
  const pair=pairs.get(card.id);
  if(pair){
    const primary=normalizeFa(card.fa),spoken=normalizeFa(pair.spoken),formal=normalizeFa(pair.formal);
    if(primary!==spoken&&primary!==formal) pairIssues.push({pos,id:card.id,fa:card.fa,spoken:pair.spoken,formal:pair.formal});
  }
}

console.log(`Step 22 register diagnostic: cards=${cards.length}, pairs=${pairs.size}, chunkPromotions=${chunkResult.applied}, modernLifePromotions=${modernResult.applied}`);
for(const [name,value] of Object.entries(counts)) console.log(`stage ${name}: ${JSON.stringify(value)}`);
console.log(`spoken-unpaired=${spokenUnpaired.length}`);
for(const row of spokenUnpaired.slice(0,160)) console.log(`UNPAIRED ${row.pos}\t${row.id}\t${row.fa}\t${row.category}`);
console.log(`formal-before-1751=${formalEarly.length}`);
for(const row of formalEarly.slice(0,80)) console.log(`FORMAL_EARLY ${row.pos}\t${row.id}\t${row.fa}\t${row.category}`);
console.log(`written-before-1751=${writtenEarly.length}`);
for(const row of writtenEarly.slice(0,80)) console.log(`WRITTEN_EARLY ${row.pos}\t${row.id}\t${row.fa}\t${row.category}`);
console.log(`literary-before-1751=${literaryEarly.length}`);
for(const row of literaryEarly.slice(0,80)) console.log(`LITERARY_EARLY ${row.pos}\t${row.id}\t${row.fa}\t${row.category}`);
console.log(`colloquial-neutral-or-everyday=${colloquialNeutral.length}`);
for(const row of colloquialNeutral.slice(0,160)) console.log(`COLLOQUIAL_LABEL ${row.pos}\t${row.id}\t${row.fa}\t${row.register}`);
console.log(`pair-primary-mismatch=${pairIssues.length}`);
for(const row of pairIssues) console.log(`PAIR_MISMATCH ${row.pos}\t${row.id}\t${row.fa}\t${row.spoken}\t${row.formal}`);
if(cards.length!==2000||pairIssues.length||formalEarly.length||writtenEarly.length||literaryEarly.length){
  console.error('Step 22 register diagnostic found structural register issues.');
  process.exit(1);
}
