#!/usr/bin/env node
import fs from 'node:fs';

const read=p=>fs.readFileSync(new URL('../'+p, import.meta.url),'utf8');
const memory=read('data/memory-engine.js');
const sync=read('data/sync-ui.js');
const storage=read('data/storage-guard.js');
const examples=read('data/examples-ui.js');
const index=read('index.html');
const bundle=read('.github/workflows/bundle-ui.yml');
const deckText=read('data/v5-deck.js');

const errors=[];
const need=(haystack,text,label)=>{if(!haystack.includes(text))errors.push(`missing ${label}: ${text}`);};
const forbid=(haystack,text,label)=>{if(haystack.includes(text))errors.push(`forbidden ${label}: ${text}`);};

// Stable-ID FSRS schema.
need(memory,'const MEMORY_VERSION=6;','memory schema v6');
need(memory,'const KEY_MODE="id";','ID key mode');
need(memory,'const keyFor=(id,dir=dirNow())','ID-based FSRS key');
need(memory,'return memState.cards[keyFor(c.id,dir)]||null;','card state lookup by ID');
need(memory,'Date.now(),c.id,dir,rating','review logs keyed by ID');
need(memory,'const k=keyFor(c.id,dir);','grading keyed by ID');
need(memory,'memState.reverseProgress[c.id]','reverse progress keyed by ID');
need(memory,'Q=Q.filter(x=>x.id!==u.card.id);','undo queue keyed by ID');
need(memory,'function upgradeFsrsV5(state)','v5 Persian-key migration');
need(memory,'if(existing&&existing.version===5&&existing.cards&&Array.isArray(existing.logs))','automatic v5 FSRS migration');
need(memory,'function idsForMemoryForm(value)','safe primary-first alias fallback');
need(memory,'migratedKeySchemaFrom:"fa"','migration provenance');
forbid(memory,'keyFor(c.fa,dir)','Persian-text card-state key');
forbid(memory,'reverseProgress[c.fa]','Persian-text reverse-progress key');
forbid(memory,'Date.now(),c.fa,dir,rating','Persian-text review log key');

// Cloud sync must understand both old and new memory, then merge as v6.
need(sync,'const MEMORY_VERSION=6;','sync schema v6');
need(sync,'const KEY_MODE="id";','sync ID key mode');
need(sync,'function upgradeMemory(memory)','cloud v5→v6 upgrade');
need(sync,'a=upgradeMemory(a);','upgrade local/left sync state');
need(sync,'b=upgradeMemory(b);','upgrade remote/right sync state');
need(sync,'JSON.stringify(upgradeMemory(payload.memory))','upgrade cloud payload before local apply');
need(sync,'function idsForMemoryForm(value)','sync primary-first alias fallback');
need(storage,'![5,6].includes(Number(memory.version))','history compaction supports v5 and v6');

// The inline legacy fallback scheduler must never overwrite FSRS memory.
need(index,'FSRS_STATE_KEY="farsi2000-v5"','FSRS-owned storage key');
need(index,'FALLBACK_STATE_KEY="farsi2000-v5-fallback"','separate fallback storage key');
need(index,'localStorage.setItem(FALLBACK_STATE_KEY','fallback writes only to fallback key');
forbid(index,'function save(){localStorage.setItem(FSRS_STATE_KEY','fallback overwrite of FSRS memory');

// Header counts keep the stricter FSRS semantic.
need(index,'<span id="learning">0</span> learning','learning header count');
need(memory,'if(m.state===State.Review)known++;','Review state known threshold');
need(memory,'else learning++;','learning/relearning counter');
need(memory,'left:TOTAL-known-learning','partitioned remaining count');

// Examples are present, answer-side only, and bundled.
need(examples,'window.__farsiExamplesUiV1=true','example UI guard');
need(examples,'body.english-first .example-front','EN→FA examples only on revealed front');
need(examples,'body.farsi-first .example-back','FA→EN examples only on revealed back');
need(examples,'card?.exampleFa','Persian example field');
need(examples,'card?.exampleRoman','Romanized example field');
need(examples,'card?.exampleEn','English example field');
need(examples,'body.hide-phonetics .example-roman{display:none}','phonetics preference applies to examples');
need(bundle,'Path("data/examples-ui.js")','example UI included in runtime bundle');
need(bundle,'"__farsiExamplesUiV1"','example UI bundle validation marker');

// The browser deck itself must support the feature and stable-ID distinction.
const prefix='window.FARSI_V5_DECK=';
const start=deckText.indexOf(prefix);
const end=deckText.indexOf(';\n',start);
if(start<0||end<0)errors.push('could not parse v5 browser deck');
else{
  const cards=JSON.parse(deckText.slice(start+prefix.length,end));
  if(cards.length!==2000)errors.push(`expected 2000 v5 cards; found ${cards.length}`);
  const ids=new Set();
  const forms=new Map();
  let exampleMissing=0;
  for(const card of cards){
    if(!card.id||ids.has(card.id))errors.push(`duplicate/missing stable id: ${card.id||'?'}`);
    ids.add(card.id);
    forms.set(card.fa,(forms.get(card.fa)||0)+1);
    if(!card.exampleFa||!card.exampleRoman||!card.exampleEn)exampleMissing++;
  }
  if(exampleMissing)errors.push(`${exampleMissing} browser cards are missing example trios`);
  const duplicateForms=[...forms.entries()].filter(([,count])=>count>1);
  if(!duplicateForms.length)errors.push('expected at least one repeated Persian surface form to prove IDs—not text—must own memory');
}

if(errors.length){
  for(const error of errors)console.error('ERROR '+error);
  console.error(`\nV5 learning UX audit failed: ${errors.length} issue(s)`);
  process.exit(1);
}
console.log('V5 learning UX audit passed: stable-ID FSRS+sync, separate learning count, and answer-side examples are all wired.');
