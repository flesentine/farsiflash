#!/usr/bin/env node

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname=path.dirname(fileURLToPath(import.meta.url));
const root=path.resolve(__dirname,'..');
const policy=JSON.parse(fs.readFileSync(path.join(root,'data','v5','conversational-chunks-step18.json'),'utf8'));
const registerSupplement=JSON.parse(fs.readFileSync(path.join(root,'data','v5','register-pairs-step18.json'),'utf8'));
const romanSupplement=JSON.parse(fs.readFileSync(path.join(root,'data','v5','romanization-step18.json'),'utf8'));

const errors=[]; const fail=(m)=>errors.push(m);
if(policy.version!=='conversational-chunks-v1-step18') fail(`unexpected Step 18 policy version ${policy.version}`);
if(policy.step!==18) fail(`Step 18 policy step must be 18; found ${policy.step}`);
if(policy.replacementCount!==38) fail(`Step 18 replacementCount must be 38; found ${policy.replacementCount}`);
if(!Array.isArray(policy.replacements)||policy.replacements.length!==38) fail(`Step 18 replacements must contain 38 entries; found ${policy.replacements?.length}`);

const expectedGroups={work:8,tech:8,home:8,late:14};
const groupCounts={work:0,tech:0,home:0,late:0};
const targets=new Set(); const ids=new Set(); const forms=new Set();
for(const entry of policy.replacements||[]){
  for(const key of ['targetId','id','fa','roman','en']) if(typeof entry[key]!=='string'||!entry[key].trim()) fail(`chunk entry missing ${key}`);
  const group=String(entry.targetId||'').split('.')[0];
  if(!(group in groupCounts)) fail(`unexpected Step 18 replacement group ${group} for ${entry.targetId}`); else groupCounts[group]++;
  if(targets.has(entry.targetId)) fail(`duplicate Step 18 target ${entry.targetId}`); else targets.add(entry.targetId);
  if(ids.has(entry.id)) fail(`duplicate Step 18 ID ${entry.id}`); else ids.add(entry.id);
  if(!String(entry.id||'').startsWith('conversation.chunk.')) fail(`Step 18 ID must start conversation.chunk.: ${entry.id}`);
  const normalized=String(entry.fa||'').normalize('NFC').replace(/\u200c/g,'').trim();
  if(forms.has(normalized)) fail(`duplicate Step 18 Persian form ${entry.fa}`); else forms.add(normalized);
}
for(const [group,count] of Object.entries(expectedGroups)) if(groupCounts[group]!==count) fail(`Step 18 ${group} replacements must be ${count}; found ${groupCounts[group]}`);

const pairs=registerSupplement.requiredPairs||[];
const pairIds=new Set(pairs.map((p)=>p.id));
const alternate=romanSupplement.alternateRomanById||{};
if(pairs.length!==19) fail(`Step 18 register pair count must be 19; found ${pairs.length}`);
if(Object.keys(alternate).length!==19) fail(`Step 18 alternate Romanization count must be 19; found ${Object.keys(alternate).length}`);
for(const pair of pairs){
  if(!ids.has(pair.id)) fail(`Step 18 register pair is not a promoted chunk: ${pair.id}`);
  const entry=(policy.replacements||[]).find((r)=>r.id===pair.id);
  if(entry?.fa!==pair.spoken) fail(`Step 18 spoken pair mismatch for ${pair.id}`);
  if(entry?.formalFa!==pair.formal) fail(`Step 18 formal pair mismatch for ${pair.id}`);
  if(!alternate[pair.id]) fail(`Step 18 missing alternate Romanization for ${pair.id}`);
}
for(const id of Object.keys(alternate)) if(!pairIds.has(id)) fail(`Step 18 stale alternate Romanization ${id}`);
for(const entry of policy.replacements||[]){
  if(entry.formalFa&&!pairIds.has(entry.id)) fail(`Step 18 formalFa lacks register-pair policy: ${entry.id}`);
}

if(errors.length){for(const e of errors)console.error(`ERROR ${e}`);console.error(`\nStep 18 chunk audit failed: ${errors.length} error(s)`);process.exit(1);}
console.log(`Step 18 chunk audit passed: promotions=${policy.replacements.length}, by1250=24, late=14, newRegisterPairs=${pairs.length}`);
