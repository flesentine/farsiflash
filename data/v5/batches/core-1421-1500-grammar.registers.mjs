import reviewed from './core-1421-1500-grammar.reviewed.mjs';

const P = new Map([
  ['grammar.if-not',{formalFa:'اگر نه'}],
  ['grammar.even-if',{formalFa:'حتی اگر'}],
  ['grammar.whatever',{formalFa:'هرچه'}],
  ['grammar.whoever',{formalFa:'هرکس'}],
  ['grammar.each-one',{formalFa:'هر کدام'}],
  ['grammar.either-one',{formalFa:'هر کدامش'}],
  ['grammar.neither-one',{formalFa:'هیچ کدام'}],
  ['grammar.a-little',{formalFa:'کمی'}],
  ['grammar.all-of-us',{formalFa:'همه ما'}]
]);
const cards=reviewed.map(c=>P.has(c.id)?{...c,...P.get(c.id),tags:[...new Set([...(c.tags||[]),'register-pair'])]}:c);
if(cards.length!==80)throw new Error(`register-reviewed Step 16 grammar must remain 80; found ${cards.length}`);
export default cards;
