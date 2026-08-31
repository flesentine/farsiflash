import candidate from './core-1571-1630-culture.mjs';

const P = new Map([
  ['culture.party',{id:'culture.hospitality',fa:'مهمون‌داری',roman:'mehmoondaari',en:'hospitality / hosting guests'}],
  ['culture.welcome-back',{id:'culture.safe-return',fa:'به سلامت برگشتی',roman:'be salaamat bargashti',en:'glad you returned safely'}],
  ['culture.good-luck',{id:'culture.may-you-succeed',fa:'ان‌شاءالله موفق می‌شی',roman:'enshaallah movafagh mishi',en:'hopefully you will succeed'}],
  ['culture.happy-birthday',{id:'culture.many-happy-returns',fa:'صد سال زنده باشی',roman:'sad saal zende baashi',en:'many happy returns'}]
]);
const cards=candidate.map(c=>P.has(c.id)?{...c,...P.get(c.id)}:c);
if(cards.length!==60)throw new Error(`reviewed Step 16 culture batch must remain 60; found ${cards.length}`);
export const overlapReplacementCount=P.size;
export default cards;
