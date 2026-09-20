#!/usr/bin/env node

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { applyConversationalChunkReplacements } from './lib/v5-chunks.mjs';
import { applyModernLifeCoverage, loadModernLifePolicy } from './lib/v5-modern-life.mjs';
import { loadScoringRules, scoreCandidate, checkCandidateAtPosition } from './lib/v5-scoring.mjs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, '..');
const batchesDir = path.join(root, 'data', 'v5', 'batches');
const deck = JSON.parse(fs.readFileSync(path.join(root, 'data', 'v5', 'deck.json'), 'utf8'));
const policy = loadModernLifePolicy();
const scoringRules = loadScoringRules();

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
const modernResult=applyModernLifeCoverage(chunkResult.cards, policy);
const cards=modernResult.cards;

const errors=[];
const warnings=[];
const fail=(m)=>errors.push(m);
const warn=(m)=>warnings.push(m);

if(policy.version!=='modern-life-v1-step21') fail(`unexpected Step 21 policy version ${policy.version}`);
if(policy.step!==21) fail(`modern-life policy step must be 21; found ${policy.step}`);
if(cards.length!==2000) fail(`Step 21 expects exactly 2000 effective cards; found ${cards.length}`);
if(chunkResult.applied!==38) fail(`Step 21 must run after all 38 Step 18 chunk promotions; found ${chunkResult.applied}`);
if(modernResult.applied!==policy.replacementCount) fail(`Step 21 expected ${policy.replacementCount} replacements; found ${modernResult.applied}`);

const ids=new Map(cards.map((card,index)=>[card.id,index+1]));
const forms=new Map();
for(const [index,card] of cards.entries()){
  const pos=index+1;
  if(ids.get(card.id)!==pos) fail(`#${pos} duplicate stable id ${card.id}`);
  const normalized=String(card.fa||'').normalize('NFC').replace(/\u200c/g,'').trim();
  if(normalized){ if(forms.has(normalized) && !(card.tags||[]).includes('homograph')) warn(`#${pos} Persian form duplicates #${forms.get(normalized)}: ${card.fa}`); else if(!forms.has(normalized)) forms.set(normalized,pos); }
}

for(const replacement of policy.replacements||[]){
  if(ids.has(replacement.targetId)) fail(`Step 21 target still present after replacement: ${replacement.targetId}`);
  const pos=ids.get(replacement.id);
  if(!pos){ fail(`Step 21 replacement missing: ${replacement.id}`); continue; }
  if(pos>1750) fail(`#${pos} ${replacement.id} is buried in the reading/news bridge; modern-life promotions must land by 1750`);
  const card=cards[pos-1];
  if(!(card.tags||[]).includes('modern-life')) fail(`#${pos} ${replacement.id} missing modern-life tag`);
  if(!(card.tags||[]).includes('step21-modern-life')) fail(`#${pos} ${replacement.id} missing step21-modern-life tag`);
  if(card.selection?.editorialOverride?.direction!=='promote') fail(`#${pos} ${replacement.id} must record promotion rationale`);
  if(card.category==='reading-news') fail(`#${pos} ${replacement.id} cannot be reading-news`);
  try{
    const candidate={register:card.register,category:card.category,millerRank:card.millerRank,tags:card.tags||[],signals:card.selection?.signals};
    const derived=scoreCandidate(candidate,scoringRules);
    if(Math.abs(derived.score-card.selection.score)>0.11) fail(`#${pos} ${replacement.id} stored score ${card.selection.score} != derived ${derived.score}`);
    const gate=checkCandidateAtPosition(candidate,pos,scoringRules);
    if(!gate.gatePassed) fail(`#${pos} ${replacement.id} fails ordering gate: ${gate.gateFailures.join('; ')}`);
  }catch(error){ fail(`#${pos} ${replacement.id} scoring failed: ${error.message}`); }
}

for(const domain of policy.domains||[]){
  const present=(domain.anchors||[]).filter((id)=>ids.has(id));
  const missing=(domain.anchors||[]).filter((id)=>!ids.has(id));
  if(present.length<(domain.minimum||0)) fail(`modern-life domain ${domain.id} has ${present.length}/${domain.minimum} anchors; missing ${missing.join(', ')}`);
  console.log(`domain ${domain.id}: ${present.length}/${(domain.anchors||[]).length} anchors present${missing.length?` (missing: ${missing.join(', ')})`:''}`);
}

const brandPattern=/(^|\b)(snapp|tapsi)(\b|$)|اسنپ|تپسی/i;
for(const [index,card] of cards.entries()) if(brandPattern.test(`${card.id} ${card.fa} ${card.en}`)) fail(`#${index+1} brand-specific required-deck concept found: ${card.id}`);

const modernTagged=cards.filter((card)=>(card.tags||[]).includes('modern-life')).length;
const step21Tagged=cards.filter((card)=>(card.tags||[]).includes('step21-modern-life')).length;
if(step21Tagged!==policy.replacementCount) fail(`Step 21 tag count ${step21Tagged} != replacement count ${policy.replacementCount}`);
if(modernTagged<step21Tagged) fail('modern-life tag accounting is inconsistent');

for(const warning of warnings) console.warn(`WARN ${warning}`);
for(const error of errors) console.error(`ERROR ${error}`);
if(errors.length){ console.error(`\nStep 21 modern-life audit failed: ${errors.length} error(s), ${warnings.length} warning(s)`); process.exit(1); }
console.log(`Step 21 modern-life audit passed: cards=${cards.length}, replacements=${modernResult.applied}, modernTagged=${modernTagged}, domains=${(policy.domains||[]).length}, warnings=${warnings.length}`);
console.log(`Step 21 positions: ${modernResult.positions.map((entry)=>`${entry.position}:${entry.id}`).join(', ')}`);
