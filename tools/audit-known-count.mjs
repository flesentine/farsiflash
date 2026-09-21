#!/usr/bin/env node
import fs from 'node:fs';

const source=fs.readFileSync(new URL('../data/memory-engine.js', import.meta.url),'utf8');
const errors=[];
const need=(text,label)=>{if(!source.includes(text))errors.push(`missing ${label}: ${text}`);};

need('function knownIds(State,dir=dirNow())','FSRS known-ID helper');
need('if(m?.state===State.Review)out.add(c.id)','known requires FSRS Review state');
need('K=knownIds(State,dirNow())','compatibility set uses v5 stable IDs');
need('const knownSet=knownIds(State,d);','display count derives from FSRS-known IDs');
need('const known=knownSet.size;','known count uses review-state set size');
need('return {known,seen,left:TOTAL-known};','left count tracks known count');
need('learning_steps:["1m","10m"]','short-term FSRS learning steps');
need('relearning_steps:["10m"]','FSRS relearning step');

if(source.includes('if(latest.get(c.fa)==="good")out.add(c.id)'))errors.push('single latest Good must not immediately count as known');
if(source.includes('function latestRatings(dir=dirNow())'))errors.push('latest-answer shortcut should not define known status');
if(source.includes('K=new Set(D.filter(c=>isKnown(c,State,d)).map(c=>c.fa))'))errors.push('known compatibility set must not revert to Persian-string keys');

if(errors.length){
  for(const error of errors)console.error('ERROR '+error);
  process.exit(1);
}
console.log('Known-count audit passed: known requires FSRS Review state, learning/relearning are not counted, and v5 stable IDs drive the display.');
