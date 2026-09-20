import { scoreCandidate } from '../../tools/lib/v5-scoring.mjs';

// Shared builder for Step 16 (cards 1251–1750): wider conversational
// comprehension, dialogue language, culture, and useful lower-frequency daily life.
const PROFILES = {
  verbs:{conversationalFrequency:62,speakerDispersion:72,practicalUsefulness:72,generativeValue:84,modernRelevance:76,writtenFrequency:66},
  conversation:{conversationalFrequency:76,speakerDispersion:82,practicalUsefulness:82,generativeValue:80,modernRelevance:82,writtenFrequency:60},
  grammar:{conversationalFrequency:72,speakerDispersion:82,practicalUsefulness:76,generativeValue:92,modernRelevance:76,writtenFrequency:74},
  social:{conversationalFrequency:66,speakerDispersion:76,practicalUsefulness:72,generativeValue:62,modernRelevance:78,writtenFrequency:68},
  culture:{conversationalFrequency:64,speakerDispersion:72,practicalUsefulness:68,generativeValue:58,modernRelevance:76,writtenFrequency:62},
  travel:{conversationalFrequency:58,speakerDispersion:68,practicalUsefulness:76,generativeValue:58,modernRelevance:76,writtenFrequency:66},
  food:{conversationalFrequency:58,speakerDispersion:68,practicalUsefulness:70,generativeValue:46,modernRelevance:72,writtenFrequency:66},
  shopping:{conversationalFrequency:60,speakerDispersion:70,practicalUsefulness:76,generativeValue:56,modernRelevance:82,writtenFrequency:62},
  people:{conversationalFrequency:58,speakerDispersion:70,practicalUsefulness:66,generativeValue:48,modernRelevance:70,writtenFrequency:68},
  home:{conversationalFrequency:56,speakerDispersion:68,practicalUsefulness:68,generativeValue:44,modernRelevance:72,writtenFrequency:64}
};

const META = {
  verbs:['verb','everyday'], conversation:['conversation','spoken'], grammar:['grammar','everyday'],
  social:['social','everyday'], culture:['culture','everyday'], travel:['travel','everyday'],
  food:['food','neutral'], shopping:['shopping','everyday'], people:['people','neutral'], home:['home','neutral']
};

export function step16Card(category, row) {
  const [slug, fa, roman, en] = row;
  const [idPrefix, register] = META[category];
  const tags = [];
  if (category === 'verbs') {
    tags.push('high-transfer-pattern');
    if (fa.includes(' ')) tags.push('productive-compound-verb');
  }
  if (category === 'conversation') tags.push('essential-chunk','high-transfer-pattern');
  if (category === 'grammar') tags.push('high-transfer-pattern');
  if (category === 'culture') tags.push('cultural-literacy');
  if (category === 'shopping' || category === 'travel') tags.push('practical-life');
  const signals = {...PROFILES[category]};
  const candidate = {register, category, millerRank:null, tags, signals};
  return {id:`${idPrefix}.${slug}`, fa, roman, en, register, category, millerRank:null, selection:{score:scoreCandidate(candidate).score,signals}, tags};
}
