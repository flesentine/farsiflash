import reviewed from './core-1501-1570-social.reviewed.mjs';

const P = new Map([
  ['social.satisfied',{formalFa:'راضی‌ام'}],
  ['social.at-ease',{formalFa:'خیالم راحت است'}],
  ['social.count-on-you',{formalFa:'روی تو حساب می‌کنم'}],
  ['social.i-apologize',{formalFa:'عذر می‌خواهم'}]
]);
const cards=reviewed.map(c=>P.has(c.id)?{...c,...P.get(c.id),tags:[...new Set([...(c.tags||[]),'register-pair'])]}:c);
if(cards.length!==70)throw new Error(`register-reviewed Step 16 social must remain 70; found ${cards.length}`);
export default cards;
