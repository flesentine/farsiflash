import candidate from './core-1421-1500-grammar.mjs';

const P = new Map([
  ['grammar.whenever',{id:'grammar.as-if',fa:'انگار که',roman:'engaar ke',en:'as if / as though'}],
  ['grammar.everyone',{id:'grammar.all-of-us',fa:'همه‌مون',roman:'hamemoon',en:'all of us'}],
  ['grammar.most-of',{id:'grammar.half-of',fa:'نصفِ',roman:'nesfe',en:'half of'}],
  ['grammar.not-yet-grammar',{id:'grammar.no-matter-how',fa:'هر جور',roman:'har joor',en:'however / any way'}],
  ['grammar.again-and-again',{fa:'بارها و بارها',roman:'baarhaa o baarhaa',en:'again and again'}],
  ['grammar.right-away',{en:'right then / at that moment'}]
]);
const cards=candidate.map(c=>P.has(c.id)?{...c,...P.get(c.id)}:c);
if(cards.length!==80)throw new Error(`reviewed Step 16 grammar batch must remain 80; found ${cards.length}`);
export const reviewPatchCount=P.size;
export default cards;
