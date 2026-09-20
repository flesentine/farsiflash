import { scoreCandidate } from '../../tools/lib/v5-scoring.mjs';

const PROFILES = {
  news:{conversationalFrequency:28,speakerDispersion:72,practicalUsefulness:48,generativeValue:50,modernRelevance:82,writtenFrequency:94},
  formal:{conversationalFrequency:48,speakerDispersion:78,practicalUsefulness:68,generativeValue:76,modernRelevance:76,writtenFrequency:88},
  late:{conversationalFrequency:58,speakerDispersion:72,practicalUsefulness:70,generativeValue:62,modernRelevance:76,writtenFrequency:66}
};

export function step17Card(profile, idPrefix, category, row) {
  const [slug, fa, roman, en] = row;
  const signals = {...PROFILES[profile]};
  const tags = [];
  let register = 'neutral';
  if (profile === 'news') {
    register = 'formal';
    tags.push('formal-bridge','news-domain');
  } else if (profile === 'formal') {
    register = 'formal';
    tags.push('formal-bridge','high-transfer-pattern');
  } else {
    tags.push('lower-priority-useful');
  }
  if (category === 'verbs' && fa.includes(' ')) tags.push('productive-compound-verb');
  if (category === 'culture') tags.push('cultural-recognition');
  const candidate = {register, category, millerRank:null, tags, signals};
  return {id:`${idPrefix}.${slug}`,fa,roman,en,register,category,millerRank:null,selection:{score:scoreCandidate(candidate).score,signals},tags};
}
