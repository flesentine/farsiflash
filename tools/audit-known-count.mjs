#!/usr/bin/env node
import fs from 'node:fs';

const source=fs.readFileSync(new URL('../data/memory-engine.js', import.meta.url),'utf8');
const index=fs.readFileSync(new URL('../index.html', import.meta.url),'utf8');
const errors=[];
const need=(text,label,haystack=source)=>{if(!haystack.includes(text))errors.push(`missing ${label}: ${text}`);};

need('function knownIds(State,dir=dirNow())','FSRS known-ID helper');
need('if(m?.state===State.Review)out.add(c.id)','known requires FSRS Review state');
need('K=knownIds(State,dirNow())','compatibility set uses v5 stable IDs');
need('let known=0,learning=0,seen=0;','separate learning counter');
need('if(m.state===State.Review)known++;','Review state increments known');
need('else learning++;','non-Review scheduled state increments learning');
need('return {known,learning,seen,left:TOTAL-known-learning};','known/learning/left partition');
need('E.learning.textContent=n.learning;','learning count rendered');
need('learning_steps:["1m","10m"]','short-term FSRS learning steps');
need('relearning_steps:["10m"]','FSRS relearning step');
need('<span id="learning">0</span> learning','learning count in header',index);

if(source.includes('if(latest.get(c.fa)==="good")out.add(c.id)'))errors.push('single latest Good must not immediately count as known');
if(source.includes('function latestRatings(dir=dirNow())'))errors.push('latest-answer shortcut should not define known status');
if(source.includes('return {known,seen,left:TOTAL-known};'))errors.push('left count must account for learning separately');
if(source.includes('K=new Set(D.filter(c=>isKnown(c,State,d)).map(c=>c.fa))'))errors.push('known compatibility set must not revert to Persian-string keys');

if(errors.length){
  for(const error of errors)console.error('ERROR '+error);
  process.exit(1);
}
console.log('Known-count audit passed: Review=known, Learning/Relearning=learning, and the three display counts partition the 2,000-card deck.');
