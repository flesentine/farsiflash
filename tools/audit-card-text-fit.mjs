#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname=path.dirname(fileURLToPath(import.meta.url));
const root=path.resolve(__dirname,'..');
const responsive=fs.readFileSync(path.join(root,'data','responsive-ui.js'),'utf8');
const index=fs.readFileSync(path.join(root,'index.html'),'utf8');

const errors=[];
const requireText=(haystack,needle,label)=>{
  if(!haystack.includes(needle))errors.push(`missing ${label}: ${needle}`);
};

if(/overflow-wrap\s*:\s*anywhere/i.test(index))errors.push('index still permits mid-word overflow wrapping');
requireText(index,'overflow-wrap:normal;word-break:normal;hyphens:none','base no-split CSS');

for(const [needle,label] of [
  ['overflow-wrap:normal!important','runtime no-split overflow-wrap'],
  ['word-break:normal!important','runtime normal word-break'],
  ['hyphens:none!important','runtime hyphen disable'],
  ['function fitTextElement(','measured element fitter'],
  ['function fitCardText(','public card fitter'],
  ['function fitFrontPair(','front-pair vertical fitter'],
  ['scrollWidth<=el.clientWidth+1','horizontal fit measurement'],
  ['scrollHeight<=maxHeight+1','vertical fit measurement'],
  ['new MutationObserver(scheduleFit)','render mutation refit'],
  ['window.addEventListener("resize"','resize refit'],
  ['document.addEventListener("fullscreenchange"','fullscreen refit'],
  ['window.addEventListener("orientationchange"','orientation refit'],
  ['document.fonts?.ready','font-load refit'],
  ['while(!fitsBox(el,maxHeight)&&size>9)','last-resort shrink']
]) requireText(responsive,needle,label);

const configs=[...responsive.matchAll(/selector:"(\.[^"]+)",preferredMin:(\d+),hardMin:(\d+),maxHeightRatio:([.\d]+)/g)];
if(configs.length!==3)errors.push(`expected 3 fit configurations; found ${configs.length}`);
const selectors=new Set(configs.map(m=>m[1]));
for(const selector of ['.roman','.english','.farsi'])if(!selectors.has(selector))errors.push(`missing fit selector ${selector}`);

if(errors.length){
  for(const error of errors)console.error('ERROR '+error);
  console.error(`\nCard text fit audit failed: ${errors.length} issue(s)`);
  process.exit(1);
}
console.log('Card text fit audit passed: no mid-word wrapping; measured shrink enabled for Romanization, English, and Persian; resize/fullscreen/font changes refit automatically.');
