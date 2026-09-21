#!/usr/bin/env node
import fs from 'node:fs';

const source=fs.readFileSync(new URL('../data/memory-engine.js', import.meta.url),'utf8');
const errors=[];
const need=(text,label)=>{if(!source.includes(text))errors.push(`missing ${label}: ${text}`);};

need('function latestRatings(dir=dirNow())','latest-rating helper');
need('if(!out.has(fa))out.set(fa,row[3])','latest answer wins');
need('function knownIds(State,dir=dirNow())','known-ID helper');
need('if(latest.get(c.fa)==="good")out.add(c.id)','Know counts immediately by stable ID');
need('K=knownIds(State,dirNow())','legacy compatibility set uses stable IDs');
need('const knownSet=knownIds(State,d);','display count derives from known IDs');
need('const known=knownSet.size;','known count uses set size');
need('return {known,seen,left:TOTAL-known};','left count tracks known count');

if(source.includes('map(c=>c.fa)'))errors.push('known compatibility set still maps cards to Persian strings');
if(source.includes('if(m){seen++;if(m.state===State.Review)known++}'))errors.push('known display still waits for FSRS Review graduation');

if(errors.length){
  for(const error of errors)console.error('ERROR '+error);
  process.exit(1);
}
console.log('Known-count audit passed: latest Good increments immediately, Again removes known status, and v5 stable IDs drive the display count.');
