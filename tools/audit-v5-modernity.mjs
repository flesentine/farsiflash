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
const policy=JSON.parse(fs.readFileSync(path.join(v5Dir,'modernity-audit-pre23.json'),'utf8'));
const registerPolicy=loadRegisterPairPolicy();
const registerAuditPolicy=JSON.parse(fs.readFileSync(path.join(v5Dir,'register-audit-step22.json'),'utf8'));

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
const modernLifeResult=applyModernLifeCoverage(chunkResult.cards);
const registerResult=applyRegisterAudit(modernLifeResult.cards,registerPolicy,registerAuditPolicy);
const cards=registerResult.cards;

const errors=[];
const fail=m=>errors.push(m);
if(policy.version!=='modernity-v1-pre23') fail(`unexpected modernity policy version ${policy.version}`);
if(cards.length!==2000) fail(`modernity audit expects 2000 effective cards; found ${cards.length}`);

const ids=new Map(cards.map((card,index)=>[card.id,index+1]));
const forbiddenTags=new Set(policy.forbiddenTags||[]);
const forbiddenForms=new Set((policy.forbiddenExactForms||[]).map(normalizeFa));
let lowModern=0;
let bannedTagHits=0;
let bannedFormHits=0;

for(const [index,card] of cards.entries()){
  const pos=index+1;
  for(const tag of card.tags||[]){
    if(forbiddenTags.has(tag)){bannedTagHits++;fail(`#${pos} ${card.id} carries forbidden antiquation tag ${tag}`);}
  }
  if(card.register==='literary'){bannedTagHits++;fail(`#${pos} ${card.id} has literary primary register`);}
  for(const [field,value] of [['fa',card.fa],['spokenFa',card.spokenFa],['formalFa',card.formalFa]]){
    if(!value) continue;
    const n=normalizeFa(value);
    if(forbiddenForms.has(n)){bannedFormHits++;fail(`#${pos} ${card.id} ${field} uses forbidden antiquated/obsolete form: ${value}`);}
  }
  const modern=card.selection?.signals?.modernRelevance;
  if(Number.isFinite(modern)&&modern<(policy.minimumModernRelevanceSignal||0)){
    lowModern++;
    fail(`#${pos} ${card.id} modernRelevance ${modern} is below ${policy.minimumModernRelevanceSignal}`);
  }
}

for(const replacement of policy.requiredModernReplacements||[]){
  if(ids.has(replacement.removedId)) fail(`old modernity-review concept still present: ${replacement.removedId}`);
  const pos=ids.get(replacement.replacementId);
  if(!pos){fail(`required modern replacement missing: ${replacement.replacementId}`);continue;}
  const card=cards[pos-1];
  if(normalizeFa(card.fa)!==normalizeFa(replacement.fa)) fail(`#${pos} ${replacement.replacementId} expected ${replacement.fa}; found ${card.fa}`);
}

for(const item of policy.reviewedCurrentTraditionalExamples||[]){
  const pos=ids.get(item.id);
  if(!pos) fail(`reviewed-current cultural example missing: ${item.id}`);
  else if(normalizeFa(cards[pos-1].fa)!==normalizeFa(item.fa)) fail(`#${pos} reviewed-current form drifted for ${item.id}: ${cards[pos-1].fa}`);
}

for(const e of errors) console.error(`ERROR ${e}`);
if(errors.length){
  console.error(`\nModernity audit failed: ${errors.length} error(s), bannedTags=${bannedTagHits}, bannedForms=${bannedFormHits}, lowModern=${lowModern}`);
  process.exit(1);
}
console.log(`Modernity audit passed: cards=${cards.length}, bannedTags=0, bannedForms=0, lowModern=0, replacements=${(policy.requiredModernReplacements||[]).length}, reviewedCurrentTraditional=${(policy.reviewedCurrentTraditionalExamples||[]).length}`);
