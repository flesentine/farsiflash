#!/usr/bin/env node

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { applyRomanizationToCards, loadRegisterPairPolicy, loadRomanizationPolicy, normalizeFa, sanitizeRoman } from './lib/v5-romanization.mjs';
import { applyConversationalChunkReplacements } from './lib/v5-chunks.mjs';
import { applyExampleSentences } from './lib/v5-examples.mjs';

const __dirname=path.dirname(fileURLToPath(import.meta.url));
const root=path.resolve(__dirname,'..');
const deck=JSON.parse(fs.readFileSync(path.join(root,'data','v5','deck.json'),'utf8'));
const batchesDir=path.join(root,'data','v5','batches');
const romanPolicy=loadRomanizationPolicy(); const registerPolicy=loadRegisterPairPolicy();
function batchKey(n){return n.replace(/(?:\.reviewed|\.compounds|\.registers)?\.mjs$/,'');}
function precedence(n){if(n.endsWith('.registers.mjs'))return 3;if(n.endsWith('.compounds.mjs'))return 2;if(n.endsWith('.reviewed.mjs'))return 1;return 0;}
function batchStart(n){const m=n.match(/^core-(\d+)/);return m?Number(m[1]):Number.MAX_SAFE_INTEGER;}
const all=fs.existsSync(batchesDir)?fs.readdirSync(batchesDir).filter(n=>n.endsWith('.mjs')):[];
const chosen=new Map(); for(const n of all){const k=batchKey(n),c=chosen.get(k);if(!c||precedence(n)>precedence(c))chosen.set(k,n);}
const files=[...chosen.values()].sort((a,b)=>batchStart(a)-batchStart(b)||a.localeCompare(b));
const batchCards=[]; for(const f of files){const m=await import(pathToFileURL(path.join(batchesDir,f)).href);if(!Array.isArray(m.default))throw new Error(`${f} must default-export array`);batchCards.push(...m.default);}
const chunkResult=applyConversationalChunkReplacements([...deck.cards,...batchCards]);
const romanized=applyRomanizationToCards(chunkResult.cards,romanPolicy,registerPolicy);
const exampleResult=applyExampleSentences(romanized);
const cards=exampleResult.cards;
const errors=[]; const fail=m=>errors.push(m); const ids=new Map(cards.map((c,i)=>[c.id,i+1]));
const ROMAN_RE=/^[a-z0-9 /.,!?()]+$/;
if(cards.length!==2000) fail(`Romanization audit expects 2000 effective cards at Step 19; found ${cards.length}`);
if(chunkResult.applied!==38) fail(`Romanization audit expects 38 Step 18 chunk promotions; found ${chunkResult.applied}`);
function check(label,v,c,pos){if(typeof v!=='string'||!v.trim())return fail(`#${pos} ${c.id} missing ${label}`);if(v!==v.toLowerCase())fail(`#${pos} ${c.id} ${label} must be lowercase: ${v}`);if(!ROMAN_RE.test(v))fail(`#${pos} ${c.id} ${label} outside learner-roman-v1: ${v}`);if(/[’‘`'-]/.test(v))fail(`#${pos} ${c.id} ${label} contains apostrophe/hyphen: ${v}`);if(/\s{2,}/.test(v))fail(`#${pos} ${c.id} ${label} repeated spaces`);if(/(aaa|ooo|iii)/.test(v))fail(`#${pos} ${c.id} ${label} suspicious triple vowel: ${v}`);if(sanitizeRoman(v)!==v)fail(`#${pos} ${c.id} ${label} is not sanitized: ${v}`);}
cards.forEach((c,i)=>{const pos=i+1;check('roman',c.roman,c,pos);if(c.spokenFa){if(!c.spokenRoman)fail(`#${pos} ${c.id} spokenFa without spokenRoman`);else check('spokenRoman',c.spokenRoman,c,pos);}else if(c.spokenRoman)fail(`#${pos} ${c.id} spokenRoman without spokenFa`);if(c.formalFa){if(!c.formalRoman)fail(`#${pos} ${c.id} formalFa without formalRoman`);else check('formalRoman',c.formalRoman,c,pos);}else if(c.formalRoman)fail(`#${pos} ${c.id} formalRoman without formalFa`);if(!c.exampleFa||!c.exampleEn)fail(`#${pos} ${c.id} missing Step 19 example text`);check('exampleRoman',c.exampleRoman,c,pos);});
const pairs=registerPolicy.requiredPairs||[], alternates=romanPolicy.alternateRomanById||{};
if(Object.keys(alternates).length!==pairs.length)fail(`alternate Romanization count ${Object.keys(alternates).length} != pair count ${pairs.length}`);
for(const p of pairs){const pos=ids.get(p.id);if(!pos){fail(`Romanization policy missing pair ${p.id}`);continue;}if(!alternates[p.id])fail(`missing alternate Romanization for ${p.id}`);const c=cards[pos-1],primary=normalizeFa(c.fa);if(primary===normalizeFa(p.spoken)){if(!c.formalFa||!c.formalRoman)fail(`#${pos} ${p.id} needs formalFa/formalRoman`);}else if(primary===normalizeFa(p.formal)){if(!c.spokenFa||!c.spokenRoman)fail(`#${pos} ${p.id} needs spokenFa/spokenRoman`);}else fail(`#${pos} ${p.id} primary is outside pair`);}
for(const id of Object.keys(alternates))if(!pairs.some(p=>p.id===id))fail(`stale alternate Romanization ${id}`);
for(const [id,expected] of Object.entries(romanPolicy.primaryOverrides||{})){const pos=ids.get(id);if(!pos)fail(`stale primary Romanization override ${id}`);else if(cards[pos-1].roman!==sanitizeRoman(expected))fail(`#${pos} ${id} primary override not applied`);}
for(const m of errors)console.error(`ERROR ${m}`);if(errors.length){console.error(`\nv5 Romanization audit failed: ${errors.length} error(s)`);process.exit(1);}console.log(`v5 Romanization audit passed: policy=${romanPolicy.version}, cards=${cards.length}, requiredPairs=${pairs.length}, files=${files.length}, chunkPromotions=${chunkResult.applied}, examples=${cards.filter(c=>c.exampleRoman).length}`);
