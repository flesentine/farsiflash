import reviewed from './core-1631-1675-travel.reviewed.mjs';

const P = new Map([
  ['travel.breakfast-included',{formalFa:'صبحانه شامل می‌شود'}]
]);
const cards=reviewed.map(c=>P.has(c.id)?{...c,...P.get(c.id),tags:[...new Set([...(c.tags||[]),'register-pair'])]}:c);
if(cards.length!==45)throw new Error(`register-reviewed Step 16 travel must remain 45; found ${cards.length}`);
export default cards;
