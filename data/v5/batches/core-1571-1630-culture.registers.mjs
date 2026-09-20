import reviewed from './core-1571-1630-culture.reviewed.mjs';

const P = new Map([
  ['culture.welcome-plural',{formalFa:'خوش آمدید'}],
  ['culture.spring-cleaning',{formalFa:'خانه‌تکانی'}]
]);
const cards=reviewed.map(c=>P.has(c.id)?{...c,...P.get(c.id),tags:[...new Set([...(c.tags||[]),'register-pair'])]}:c);
if(cards.length!==60)throw new Error(`register-reviewed Step 16 culture must remain 60; found ${cards.length}`);
export default cards;
