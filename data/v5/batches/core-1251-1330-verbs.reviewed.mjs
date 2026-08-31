import candidate from './core-1251-1330-verbs.mjs';

const P = new Map([
  ['verb.change-mind',{fa:'نظرت رو عوض کردن',roman:'nazaret ro avaz kardan',en:'to change your mind'}],
  ['verb.make-up-mind',{id:'verb.reconsider',fa:'دوباره فکر کردن',roman:'dobaare fekr kardan',en:'to reconsider / think again'}],
  ['verb.catch-up',{fa:'از هم خبر گرفتن',roman:'az ham khabar gereftan',en:'to catch up / check in with each other'}],
  ['verb.take-advantage',{fa:'بهره بردن',roman:'bahre bordan',en:'to benefit from / make use of'}],
  ['verb.pack-leftovers',{fa:'بقیه غذا رو بسته‌بندی کردن',roman:'baghie ghazaa ro bastebandi kardan',en:'to pack the rest of the food'}]
]);
const cards=candidate.map(c=>P.has(c.id)?{...c,...P.get(c.id)}:c);
if(cards.length!==80)throw new Error(`reviewed Step 16 verbs batch must remain 80; found ${cards.length}`);
export const naturalnessPatchCount=P.size;
export default cards;
