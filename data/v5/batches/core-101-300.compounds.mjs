import reviewedCards from './core-101-300.reviewed.mjs';
import { scoreCandidate } from '../../../tools/lib/v5-scoring.mjs';

// Step 11 compound-verb/construction pass.
// Step 9 candidate and Step 10 reviewed batches remain intact for provenance.
// This module is the effective source of truth for cards 101–300 after Step 11.

const VERB_SIGNALS = {
  conversationalFrequency: 91,
  speakerDispersion: 94,
  practicalUsefulness: 96,
  generativeValue: 96,
  modernRelevance: 95,
  writtenFrequency: 72
};

function compound({ id, fa, roman, en, register = 'everyday', formalFa, category = 'verbs', extraTags = [] }) {
  const tags = ['productive-compound-verb', 'high-transfer-pattern', ...extraTags];
  const signals = { ...VERB_SIGNALS };
  const candidate = { register, category, millerRank: null, tags, signals };
  const card = {
    id,
    fa,
    roman,
    en,
    register,
    category,
    millerRank: null,
    selection: { score: scoreCandidate(candidate).score, signals },
    tags
  };
  if (formalFa) card.formalFa = formalFa;
  return card;
}

const REPLACEMENTS = new Map([
  ['people.relative', compound({ id: 'verb.decide', fa: 'تصمیم گرفتن', roman: 'tasmim gereftan', en: 'to decide' })],
  ['people.neighbor', compound({ id: 'verb.make-plans', fa: 'قرار گذاشتن', roman: 'gharaar gozaashtan', en: 'to make plans / arrange to meet' })],

  ['food.fish', compound({ id: 'verb.lose', fa: 'گم کردن', roman: 'gom kardan', en: 'to lose / misplace' })],
  ['food.egg', compound({ id: 'verb.get-lost', fa: 'گم شدن', roman: 'gom shodan', en: 'to get lost' })],
  ['food.cheese', compound({ id: 'verb.rest', fa: 'استراحت کردن', roman: 'esteraahat kardan', en: 'to rest' })],
  ['food.yogurt', compound({ id: 'verb.practice', fa: 'تمرین کردن', roman: 'tamrin kardan', en: 'to practice' })],

  ['home.light', compound({ id: 'verb.turn-on', fa: 'روشن کردن', roman: 'roshan kardan', en: 'to turn on' })],
  ['clothes.tshirt', compound({ id: 'verb.turn-off', fa: 'خاموش کردن', roman: 'khaamoosh kardan', en: 'to turn off' })],
  ['clothes.pants', compound({ id: 'verb.take-shower', fa: 'دوش گرفتن', roman: 'doosh gereftan', en: 'to take a shower' })],

  ['travel.map', compound({ id: 'verb.set-off', fa: 'راه افتادن', roman: 'raah oftaadan', en: 'to set off / get going' })],
  ['travel.driver', compound({ id: 'verb.send-message', fa: 'پیام دادن', roman: 'payaam daadan', en: 'to message / text someone', category: 'technology', extraTags: ['modern-life'] })],
  ['travel.parking', compound({ id: 'verb.take-photo', fa: 'عکس گرفتن', roman: 'aks gereftan', en: 'to take a photo', category: 'technology', extraTags: ['modern-life'] })],
  ['travel.gas-station', compound({ id: 'verb.spend-money', fa: 'پول خرج کردن', roman: 'pool kharj kardan', en: 'to spend money', category: 'shopping' })],

  ['tech.battery', compound({ id: 'verb.get-ready', fa: 'آماده شدن', roman: 'aamaade shodan', en: 'to get ready' })],
  ['tech.link', compound({ id: 'verb.be-late', fa: 'دیر کردن', roman: 'dir kardan', en: 'to be late' })]
]);

const cards = reviewedCards.map((card) => REPLACEMENTS.get(card.id) || card);

if (cards.length !== 200) throw new Error(`compound-reviewed core-101-300 must contain 200 cards; found ${cards.length}`);
for (const id of REPLACEMENTS.keys()) {
  if (!reviewedCards.some((card) => card.id === id)) throw new Error(`compound replacement target not found: ${id}`);
}

export const compoundReplacementCount = REPLACEMENTS.size;
export default cards;
