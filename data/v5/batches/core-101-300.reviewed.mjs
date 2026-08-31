import baseCards from './core-101-300.mjs';
import { scoreCandidate } from '../../../tools/lib/v5-scoring.mjs';

// Step 10 human-quality review of cards 101–300.
// The original step-9 candidate batch is retained for provenance; this module
// is the reviewed source of truth used by the cross-batch audit.

const PROFILES = {
  essential: { conversationalFrequency: 95, speakerDispersion: 96, practicalUsefulness: 98, generativeValue: 92, modernRelevance: 96, writtenFrequency: 78 },
  grammar: { conversationalFrequency: 94, speakerDispersion: 96, practicalUsefulness: 95, generativeValue: 94, modernRelevance: 95, writtenFrequency: 78 },
  verb: { conversationalFrequency: 91, speakerDispersion: 94, practicalUsefulness: 96, generativeValue: 96, modernRelevance: 95, writtenFrequency: 72 },
  practical: { conversationalFrequency: 88, speakerDispersion: 92, practicalUsefulness: 94, generativeValue: 76, modernRelevance: 94, writtenFrequency: 70 }
};

function makeCard({ id, fa, roman, en, register = 'everyday', category = 'conversation', formalFa, profile = 'essential', tags = [] }) {
  const signals = { ...PROFILES[profile] };
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
  ['people.spouse', makeCard({ id: 'people.wife', fa: 'زن', roman: 'zan', en: 'wife', register: 'everyday', category: 'people', profile: 'practical', tags: ['homograph'] })],
  ['people.years-old', makeCard({ id: 'conversation.how-old-are-you', fa: 'چند سالته؟', formalFa: 'چند سالت است؟', roman: 'chand saalete?', en: 'how old are you?', register: 'spoken', category: 'conversation', tags: ['essential-chunk', 'spoken-form', 'high-transfer-pattern'] })],

  ['food.vegetables', makeCard({ id: 'food.vegetables', fa: 'سبزیجات', roman: 'sabzijaat', en: 'vegetables', register: 'neutral', category: 'food', profile: 'practical' })],
  ['food.hungry', makeCard({ id: 'conversation.im-hungry', fa: 'گرسنه‌ام', roman: "gorosne-am", en: "I'm hungry", register: 'everyday', category: 'conversation', tags: ['essential-chunk'] })],
  ['food.thirsty', makeCard({ id: 'conversation.im-thirsty', fa: 'تشنه‌ام', roman: "teshne-am", en: "I'm thirsty", register: 'everyday', category: 'conversation', tags: ['essential-chunk'] })],
  ['food.apple', makeCard({ id: 'grammar.all', fa: 'همه', roman: 'hame', en: 'all / everyone', register: 'everyday', category: 'grammar', profile: 'grammar', tags: ['high-transfer-pattern'] })],
  ['food.banana', makeCard({ id: 'grammar.something', fa: 'یه چیزی', formalFa: 'چیزی', roman: 'ye chizi', en: 'something', register: 'spoken', category: 'grammar', profile: 'grammar', tags: ['spoken-form', 'high-transfer-pattern'] })],
  ['food.orange', makeCard({ id: 'grammar.nothing', fa: 'هیچی', formalFa: 'هیچ چیز', roman: 'hichi', en: 'nothing / anything', register: 'spoken', category: 'grammar', profile: 'grammar', tags: ['spoken-form', 'high-transfer-pattern'] })],

  ['home.window', makeCard({ id: 'question.where-is-it', fa: 'کجاست؟', roman: 'kojaast?', en: 'where is it?', register: 'everyday', category: 'conversation', tags: ['essential-chunk', 'high-transfer-pattern'] })],
  ['home.table', makeCard({ id: 'question.what-does-it-mean', fa: 'یعنی چی؟', formalFa: 'یعنی چه؟', roman: "ya'ni chi?", en: 'what does it mean?', register: 'spoken', category: 'conversation', tags: ['essential-chunk', 'spoken-form', 'high-transfer-pattern'] })],
  ['home.chair', makeCard({ id: 'command.say-again', fa: 'دوباره بگو', roman: 'dobaare begoo', en: 'say it again', register: 'everyday', category: 'conversation', tags: ['essential-chunk', 'high-transfer-pattern'] })],
  ['home.bedroom', makeCard({ id: 'question.what-time-is-it', fa: 'ساعت چنده؟', formalFa: 'ساعت چند است؟', roman: 'saaat chande?', en: 'what time is it?', register: 'spoken', category: 'conversation', tags: ['essential-chunk', 'spoken-form', 'high-transfer-pattern'] })],
  ['home.sofa', makeCard({ id: 'shopping.how-much-total', fa: 'چقدر می‌شه؟', formalFa: 'چقدر می‌شود؟', roman: 'cheghadr mishe?', en: 'how much does it come to?', register: 'spoken', category: 'shopping', tags: ['essential-chunk', 'spoken-form'] })],
  ['home.towel', makeCard({ id: 'conversation.whats-up', fa: 'چه خبر؟', roman: 'che khabar?', en: "what's up? / what's going on?", register: 'everyday', category: 'conversation', tags: ['essential-chunk'] })],
  ['home.soap', makeCard({ id: 'culture.khaste-nabashe', fa: 'خسته نباشی', formalFa: 'خسته نباشید', roman: 'khaste nabaashi', en: 'thanks for your effort / good work', register: 'everyday', category: 'culture', tags: ['essential-chunk', 'taarof-cultural-essential'] })],
  ['home.toothbrush', makeCard({ id: 'culture.dastet-dard-nakone', fa: 'دستت درد نکنه', formalFa: 'دستتان درد نکند', roman: 'dastet dard nakone', en: 'thank you for doing that', register: 'spoken', category: 'culture', tags: ['essential-chunk', 'spoken-form', 'taarof-cultural-essential'] })],
  ['clothes.jacket', makeCard({ id: 'clothes.jacket', fa: 'کاپشن', roman: 'kaapshan', en: 'jacket / coat', register: 'everyday', category: 'home', profile: 'practical' })],

  ['shopping.cash', makeCard({ id: 'shopping.cash', fa: 'نقدی', roman: 'naghdi', en: 'cash / by cash', register: 'everyday', category: 'shopping', profile: 'practical' })],

  ['direction.up', makeCard({ id: 'culture.here-you-go', fa: 'بفرما', formalFa: 'بفرمایید', roman: 'befarmaa', en: 'here you go / please', register: 'everyday', category: 'culture', tags: ['essential-chunk', 'taarof-cultural-essential'] })],
  ['direction.down', makeCard({ id: 'culture.enjoy-your-meal', fa: 'نوش جان', roman: 'nooshe jaan', en: 'enjoy your meal', register: 'everyday', category: 'culture', tags: ['essential-chunk', 'taarof-cultural-essential'] })],
  ['direction.inside', makeCard({ id: 'command.be-careful', fa: 'مواظب باش', roman: 'movaazeb baash', en: 'be careful', register: 'everyday', category: 'conversation', tags: ['essential-chunk'] })],
  ['direction.outside', makeCard({ id: 'conversation.really', fa: 'واقعا؟', roman: 'vaaghean?', en: 'really?', register: 'everyday', category: 'conversation', tags: ['essential-chunk'] })],
  ['travel.entrance', makeCard({ id: 'conversation.seriously', fa: 'جدی؟', roman: 'jedi?', en: 'seriously?', register: 'spoken', category: 'conversation', tags: ['essential-chunk', 'spoken-form'] })],
  ['travel.exit', makeCard({ id: 'grammar.maybe', fa: 'شاید', roman: 'shaayad', en: 'maybe / perhaps', register: 'neutral', category: 'grammar', profile: 'grammar', tags: ['high-transfer-pattern'] })],

  ['verb.run', makeCard({ id: 'verb.change', fa: 'عوض کردن', roman: 'avaz kardan', en: 'to change / replace', register: 'everyday', category: 'verbs', profile: 'verb', tags: ['productive-compound-verb'] })],
  ['verb.teach', makeCard({ id: 'verb.make-fix', fa: 'درست کردن', roman: 'dorost kardan', en: 'to make / fix', register: 'everyday', category: 'verbs', profile: 'verb', tags: ['productive-compound-verb', 'high-transfer-pattern'] })],
  ['verb.want', makeCard({ id: 'verb.pick-up', fa: 'برداشتن', roman: 'bardaashtan', en: 'to pick up / take', register: 'neutral', category: 'verbs', profile: 'verb', tags: ['high-transfer-pattern'] })],
  ['verb.choose', makeCard({ id: 'verb.put', fa: 'گذاشتن', roman: 'gozaashtan', en: 'to put / place', register: 'neutral', category: 'verbs', profile: 'verb', tags: ['high-transfer-pattern'] })],
  ['verb.can', makeCard({ id: 'conversation.i-can', fa: 'می‌تونم', formalFa: 'می‌توانم', roman: 'mitoonam', en: 'I can / I am able to', register: 'spoken', category: 'conversation', tags: ['essential-chunk', 'spoken-form', 'high-transfer-pattern'] })],

  ['adjective.fast', makeCard({ id: 'time.soon-early', fa: 'زود', roman: 'zood', en: 'soon / early', register: 'everyday', category: 'conversation', profile: 'grammar', tags: ['high-transfer-pattern'] })],
  ['adjective.sure', makeCard({ id: 'conversation.definitely', fa: 'حتما', roman: 'hatman', en: 'definitely / sure', register: 'everyday', category: 'conversation', tags: ['essential-chunk'] })]
]);

const cards = baseCards.map((card) => REPLACEMENTS.get(card.id) || card);

if (cards.length !== 200) throw new Error(`reviewed core-101-300 must contain 200 cards; found ${cards.length}`);
for (const id of REPLACEMENTS.keys()) {
  if (!baseCards.some((card) => card.id === id)) throw new Error(`review replacement target not found: ${id}`);
}

export const reviewReplacementCount = REPLACEMENTS.size;
export default cards;
