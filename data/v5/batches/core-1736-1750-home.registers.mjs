import reviewed from './core-1736-1750-home.reviewed.mjs';

const P = new Map([
  ['home.deposit',{formalFa:'ودیعه'}]
]);
const cards=reviewed.map(c=>P.has(c.id)?{...c,...P.get(c.id),tags:[...new Set([...(c.tags||[]),'register-pair'])]}:c);
if(cards.length!==15)throw new Error(`register-reviewed Step 16 home must remain 15; found ${cards.length}`);
export default cards;
