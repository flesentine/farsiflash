#!/usr/bin/env node

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { loadScoringRules, scoreCandidate, checkCandidateAtPosition } from './lib/v5-scoring.mjs';
import { loadRegisterPairPolicy } from './lib/v5-romanization.mjs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, '..');
const deck = JSON.parse(fs.readFileSync(path.join(root,'data','v5','deck.json'),'utf8'));
const compoundPolicy = JSON.parse(fs.readFileSync(path.join(root,'data','v5','compound-verb-policy.json'),'utf8'));
const registerPolicy = loadRegisterPairPolicy();
const scoringRules = loadScoringRules();
const batchesDir = path.join(root,'data','v5','batches');

function batchKey(name){ return name.replace(/(?:\.reviewed|\.compounds|\.registers)?\.mjs$/,''); }
function precedence(name){ if(name.endsWith('.registers.mjs')) return 3; if(name.endsWith('.compounds.mjs')) return 2; if(name.endsWith('.reviewed.mjs')) return 1; return 0; }
function batchStart(name){ const m=name.match(/^core-(\d+)/); return m ? Number(m[1]) : Number.MAX_SAFE_INTEGER; }

const all = fs.existsSync(batchesDir) ? fs.readdirSync(batchesDir).filter(n=>n.endsWith('.mjs')) : [];
const chosen = new Map();
for(const name of all){ const key=batchKey(name); const cur=chosen.get(key); if(!cur || precedence(name)>precedence(cur)) chosen.set(key,name); }
const batchFiles=[...chosen.values()].sort((a,b)=>batchStart(a)-batchStart(b) || a.localeCompare(b));
const batchCards=[];
for(const file of batchFiles){ const mod=await import(pathToFileURL(path.join(batchesDir,file)).href); if(!Array.isArray(mod.default)) throw new Error(`${file} must default-export an array`); batchCards.push(...mod.default); }
const cards=[...deck.cards,...batchCards];

const errors=[]; const warnings=[]; const fail=m=>errors.push(m); const warn=m=>warnings.push(m);
const ID_RE=/^[a-z][a-z0-9]*(?:-[a-z0-9]+)*(?:\.[a-z0-9]+(?:-[a-z0-9]+)*)+$/;
const ROMAN_RE=/^[a-z0-9' /.,!?()-]+$/;
const REGISTERS=new Set(['spoken','everyday','neutral','formal','written','slang','literary']);
const CATEGORIES=new Set(['conversation','grammar','verbs','people','home','food','shopping','travel','social','work','school','health','technology','culture','reading-news']);
const SIGNALS=['conversationalFrequency','speakerDispersion','practicalUsefulness','generativeValue','modernRelevance','writtenFrequency'];
const PERSIAN=/[\u0600-\u06ff]/; const ASCII=/[A-Za-z]/;
function normalizeFa(v){ return String(v||'').normalize('NFC').replace(/[\u064B-\u0652\u0670]/g,'').replace(/\u200c/g,'').replace(/ي/g,'ی').replace(/ك/g,'ک').trim(); }
function checkFa(label,v,pos){ if(v==null) return; if(typeof v!=='string'||!v.trim()) return fail(`#${pos} ${label} must be non-empty or null`); if(v!==v.trim()) fail(`#${pos} ${label} has outer whitespace`); if(!PERSIAN.test(v)) fail(`#${pos} ${label} lacks Persian text`); if(ASCII.test(v)) fail(`#${pos} ${label} contains ASCII letters: ${v}`); if(/ي/.test(v)) fail(`#${pos} ${label} uses Arabic ي: ${v}`); if(/ك/.test(v)) fail(`#${pos} ${label} uses Arabic ك: ${v}`); }

if(deck.cards.length!==100) fail(`foundation core must remain 100; found ${deck.cards.length}`);
if(batchCards.length!==1150) fail(`effective 101–1250 batches must contain 1150 cards; found ${batchCards.length}`);
if(cards.length!==1250) fail(`effective v5 curriculum must contain 1250 cards at Step 15; found ${cards.length}`);

const ids=new Map(); const forms=new Map();
cards.forEach((card,index)=>{
  const pos=index+1;
  if(!card||typeof card!=='object'||Array.isArray(card)) return fail(`#${pos} card must be object`);
  for(const key of ['id','fa','roman','en','register','category']) if(typeof card[key]!=='string'||!card[key].trim()) fail(`#${pos} missing ${key}`);
  if(!ID_RE.test(card.id||'')) fail(`#${pos} invalid stable id ${card.id}`);
  if(ids.has(card.id)) fail(`#${pos} duplicate id ${card.id}; first at #${ids.get(card.id)}`); else ids.set(card.id,pos);
  checkFa('fa',card.fa,pos); checkFa('spokenFa',card.spokenFa,pos); checkFa('formalFa',card.formalFa,pos);
  if(typeof card.roman==='string' && (!ROMAN_RE.test(card.roman)||card.roman!==card.roman.toLowerCase())) fail(`#${pos} invalid romanization ${JSON.stringify(card.roman)}`);
  if(!REGISTERS.has(card.register)) fail(`#${pos} invalid register ${card.register}`);
  if(!CATEGORIES.has(card.category)) fail(`#${pos} invalid category ${card.category}`);
  if(!Array.isArray(card.tags)) fail(`#${pos} tags must be array`);
  const form=normalizeFa(card.fa); if(form){ if(forms.has(form)&&!(card.tags||[]).includes('homograph')) warn(`#${pos} Persian form duplicates #${forms.get(form)}: ${card.fa}`); else if(!forms.has(form)) forms.set(form,pos); }
  if(!card.selection||typeof card.selection!=='object'||!card.selection.signals) return fail(`#${pos} missing selection/signals`);
  for(const s of SIGNALS){ const v=card.selection.signals[s]; if(!Number.isFinite(v)||v<0||v>100) fail(`#${pos} signal ${s} must be 0..100`); }
  try{
    const candidate={register:card.register,category:card.category,millerRank:card.millerRank,tags:card.tags||[],signals:card.selection.signals};
    const derived=scoreCandidate(candidate,scoringRules); if(Math.abs(derived.score-card.selection.score)>0.11) fail(`#${pos} stored score ${card.selection.score} != derived ${derived.score}`);
    const gate=checkCandidateAtPosition(candidate,pos,scoringRules); if(!gate.gatePassed) fail(`#${pos} fails ordering gate: ${gate.gateFailures.join('; ')}`);
  }catch(e){ fail(`#${pos} scoring failed: ${e.message}`); }
});

for(const id of compoundPolicy.requiredBeforeOrAt300||[]){ const pos=ids.get(id); if(!pos) fail(`compound policy missing ${id}`); else if(pos>300) fail(`compound policy requires ${id} by 300; found #${pos}`); else if(!(cards[pos-1].tags||[]).includes('productive-compound-verb')) fail(`${id} must carry productive-compound-verb`); }
const deferred=new Set((compoundPolicy.deferIsolatedFormsBefore300||[]).map(normalizeFa));
cards.slice(0,300).forEach((c,i)=>{ if(deferred.has(normalizeFa(c.fa))) fail(`#${i+1} isolated light-verb component should be deferred: ${c.fa}`); });

for(const pair of registerPolicy.requiredPairs||[]){
  const pos=ids.get(pair.id); if(!pos){ fail(`register-pair policy missing ${pair.id}`); continue; }
  const c=cards[pos-1], primary=normalizeFa(c.fa), spoken=normalizeFa(pair.spoken), formal=normalizeFa(pair.formal);
  if(primary===spoken){ if(normalizeFa(c.formalFa)!==formal) fail(`#${pos} ${pair.id} missing formal ${pair.formal}`); }
  else if(primary===formal){ if(normalizeFa(c.spokenFa)!==spoken) fail(`#${pos} ${pair.id} missing spoken ${pair.spoken}`); }
  else fail(`#${pos} ${pair.id} primary ${c.fa} is outside required pair`);
}

for(const m of warnings) console.warn(`WARN ${m}`); for(const m of errors) console.error(`ERROR ${m}`);
if(errors.length){ console.error(`\nv5 batch audit failed: ${errors.length} error(s), ${warnings.length} warning(s)`); process.exit(1); }
console.log(`v5 batch audit passed: core=${deck.cards.length}, batches=${batchCards.length}, effective=${cards.length}, warnings=${warnings.length}, files=${batchFiles.join(',')}, registerPairs=${(registerPolicy.requiredPairs||[]).length}`);
