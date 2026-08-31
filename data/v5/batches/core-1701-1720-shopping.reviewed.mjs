import candidate from './core-1701-1720-shopping.mjs';

const P = new Map([
  ['shopping.warranty',{id:'shopping.extended-warranty',fa:'گارانتی اضافه',roman:'gaarantiye ezaafe',en:'extended warranty'}],
  ['shopping.shipping-fee',{id:'shopping.cash-on-delivery',fa:'پرداخت در محل',roman:'pardakht dar mahal',en:'cash on delivery'}]
]);
const cards=candidate.map(c=>P.has(c.id)?{...c,...P.get(c.id)}:c);
if(cards.length!==20)throw new Error(`reviewed Step 16 shopping batch must remain 20; found ${cards.length}`);
export const overlapReplacementCount=P.size;
export default cards;
