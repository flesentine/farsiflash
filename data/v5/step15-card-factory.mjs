import { scoreCandidate } from '../../tools/lib/v5-scoring.mjs';

// Shared builder for Step 15 (cards 751–1250). Keeping scoring and metadata
// in one place makes the eight practical-life sub-batches consistent.
const PROFILES = {
  verbs:{conversationalFrequency:74,speakerDispersion:82,practicalUsefulness:84,generativeValue:90,modernRelevance:84,writtenFrequency:68},
  work:{conversationalFrequency:66,speakerDispersion:72,practicalUsefulness:78,generativeValue:62,modernRelevance:86,writtenFrequency:72},
  school:{conversationalFrequency:64,speakerDispersion:72,practicalUsefulness:76,generativeValue:60,modernRelevance:82,writtenFrequency:72},
  health:{conversationalFrequency:66,speakerDispersion:76,practicalUsefulness:86,generativeValue:58,modernRelevance:84,writtenFrequency:72},
  technology:{conversationalFrequency:70,speakerDispersion:78,practicalUsefulness:82,generativeValue:62,modernRelevance:98,writtenFrequency:52},
  social:{conversationalFrequency:72,speakerDispersion:80,practicalUsefulness:78,generativeValue:62,modernRelevance:84,writtenFrequency:68},
  home:{conversationalFrequency:62,speakerDispersion:74,practicalUsefulness:76,generativeValue:48,modernRelevance:80,writtenFrequency:66},
  conversation:{conversationalFrequency:82,speakerDispersion:86,practicalUsefulness:88,generativeValue:84,modernRelevance:88,writtenFrequency:62}
};

const META = {
  verbs:['verb','everyday'], work:['work','neutral'], school:['school','neutral'],
  health:['health','neutral'], technology:['tech','everyday'], social:['social','everyday'],
  home:['home','neutral'], conversation:['conversation','spoken']
};

export function step15Card(category, row) {
  const [slug, fa, roman, en] = row;
  const [idPrefix, register] = META[category];
  const tags = [];
  if (category === 'verbs') {
    tags.push('high-transfer-pattern');
    if (fa.includes(' ')) tags.push('productive-compound-verb');
  }
  if (category === 'conversation') tags.push('essential-chunk','high-transfer-pattern');
  if (category === 'technology') tags.push('modern-life');
  if (category === 'work' || category === 'school' || category === 'health') tags.push('practical-life');
  const signals = {...PROFILES[category]};
  const candidate = {register, category, millerRank:null, tags, signals};
  return {id:`${idPrefix}.${slug}`, fa, roman, en, register, category, millerRank:null, selection:{score:scoreCandidate(candidate).score,signals}, tags};
}
