#!/usr/bin/env node

import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import { fileURLToPath } from 'node:url';

const __dirname=path.dirname(fileURLToPath(import.meta.url));
const root=path.resolve(__dirname,'..');
const indexPath=path.join(root,'index.html');
const deckPath=path.join(root,'data','v5-deck.js');
const index=fs.readFileSync(indexPath,'utf8');
const rawDeck=fs.readFileSync(deckPath,'utf8');

const errors=[];
const fail=m=>errors.push(m);

const prefix='window.FARSI_V5_DECK=';
const start=rawDeck.indexOf(prefix);
const end=rawDeck.lastIndexOf(';');
if(start<0||end<0) fail('generated v5 deck wrapper is malformed');
let deck=[];
if(!errors.length){
  try{deck=JSON.parse(rawDeck.slice(start+prefix.length,end));}
  catch(error){fail(`generated v5 deck JSON is invalid: ${error.message}`);}
}

if(deck.length!==2000) fail(`live v5 deck must contain 2000 cards; found ${deck.length}`);
const ids=new Set();
for(const [i,card] of deck.entries()){
  if(!card?.id) fail(`#${i+1} missing stable id`);
  else if(ids.has(card.id)) fail(`#${i+1} duplicate stable id ${card.id}`);
  else ids.add(card.id);
  for(const key of ['fa','roman','en','stage']) if(typeof card?.[key]!=='string'||!card[key].trim()) fail(`#${i+1} ${card?.id||'?'} missing ${key}`);
}

for(const required of [
  '<script src="data/v5-deck.js?v=5"></script>',
  'FSRS_STATE_KEY="farsi2000-v5"',
  'FALLBACK_STATE_KEY="farsi2000-v5-fallback"',
  'V4_STATE_KEY="farsi2000-v4"',
  'let D=V5.slice()',
  'function idForLegacy(raw)',
  'K.add(key)',
  'Q=Q.filter(x=>x.id!==key)'
]) if(!index.includes(required)) fail(`index missing v5 live invariant: ${required}`);

if(index.includes('localStorage.removeItem(V4_STATE_KEY)')) fail('live v5 must not delete the v4 rollback state');
if(index.includes('function save(){localStorage.setItem(FSRS_STATE_KEY')) fail('inline fallback scheduler must never overwrite FSRS-owned farsi2000-v5 state');
if(!index.includes('function save(){localStorage.setItem(FALLBACK_STATE_KEY')) fail('inline fallback scheduler must persist only to its fallback key');
if(index.includes('let D=buildLearningDeck()')) fail('live page still initializes from v4 buildLearningDeck');

const inlineStart=index.indexOf('const OLD_D=');
const inlineEnd=index.indexOf('</script>',inlineStart);
if(inlineStart<0||inlineEnd<0) fail('could not locate main inline app script');
else {
  try{new vm.Script(index.slice(inlineStart,inlineEnd),{filename:'index-inline.js'});}
  catch(error){fail(`index inline JavaScript syntax error: ${error.message}`);}
}

function baseFa(s){return String(s||'').normalize('NFC').replace(/[\u064B-\u0652\u0670]/g,'').replace(/\u200c/g,'').replace(/ي/g,'ی').replace(/ك/g,'ک').trim();}
const v5ByForm=new Map();
for(const card of deck){
  for(const form of [card.fa,card.spokenFa,card.formalFa]){
    const key=baseFa(form);
    if(key&&!v5ByForm.has(key)) v5ByForm.set(key,card.id);
  }
}

const sandbox={};
sandbox.window=sandbox;
vm.createContext(sandbox);
for(const name of ['00','01','02','03','04','05','06','07']){
  vm.runInContext(fs.readFileSync(path.join(root,'data',`${name}.js`),'utf8'),sandbox,{filename:`${name}.js`});
}
for(const name of ['miller-00','miller-01','miller-02','miller-03','miller-04','miller-05','miller-06','miller-07']){
  vm.runInContext(fs.readFileSync(path.join(root,'data',`${name}.js`),'utf8'),sandbox,{filename:`${name}.js`});
}
vm.runInContext(fs.readFileSync(path.join(root,'data','path.js'),'utf8'),sandbox,{filename:'path.js'});

const oldD=(sandbox.window.FARSI_CHUNKS||[]).flat();
const staticD=(sandbox.window.FARSI_MILLER_CHUNKS||[]).flat();
const curriculum=sandbox.window.FARSI_PATH||[];
const byFa=new Map(staticD.map(([roman,fa,en,rank])=>[fa,{roman,fa,en,rank}]));
const usedExact=new Set(),coveredBase=new Set(),legacy=[];
for(const stage of curriculum) for(const [fa,roman,en] of stage.cards){
  if(usedExact.has(fa)) continue;
  const base=byFa.get(fa);
  legacy.push({roman,fa,en,rank:base?.rank??10000,stage:stage.name});
  usedExact.add(fa);coveredBase.add(baseFa(fa));
}
for(const [roman,fa,en,rank] of staticD){
  if(usedExact.has(fa)||coveredBase.has(baseFa(fa))) continue;
  legacy.push({roman,fa,en,rank,stage:'Common Words'});
  usedExact.add(fa);coveredBase.add(baseFa(fa));
}
const legacyDeck=legacy.slice(0,2000);
const migratable=legacyDeck.filter(card=>v5ByForm.has(baseFa(card.fa))).length;
const migrationRate=legacyDeck.length?migratable/legacyDeck.length:0;
if(legacyDeck.length!==2000) fail(`legacy v4 reconstruction expected 2000 cards; found ${legacyDeck.length}`);
if(migratable<250) fail(`v4→v5 exact-form migration unexpectedly low: ${migratable}/${legacyDeck.length}`);

for(const error of errors) console.error(`ERROR ${error}`);
if(errors.length){
  console.error(`\nLive v5 audit failed: ${errors.length} error(s)`);
  process.exit(1);
}
console.log(`Live v5 audit passed: cards=${deck.length}, stableIds=${ids.size}, v4ExactMigratable=${migratable}/${legacyDeck.length} (${(migrationRate*100).toFixed(1)}%), migrationMode=safe-exact-only, v4StatePreserved=true`);
