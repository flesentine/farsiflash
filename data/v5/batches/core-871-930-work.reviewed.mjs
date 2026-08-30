import candidate from './core-871-930-work.mjs';

const P = new Map([
  ['work.manager',{id:'work.supervisor',fa:'سرپرست',roman:'sarparast',en:'supervisor'}],
  ['work.boss',{id:'work.employer',fa:'کارفرما',roman:'kaarfarmaa',en:'employer'}],
  ['work.employee',{id:'work.staff',fa:'پرسنل',roman:'personel',en:'staff / personnel'}],
  ['work.customer',{id:'work.supplier',fa:'تامین کننده',roman:'tamin konande',en:'supplier / vendor'}],
  ['work.invoice',{id:'work.purchase-order',fa:'سفارش خرید',roman:'sefareshe kharid',en:'purchase order'}]
]);
const cards=candidate.map(c=>P.has(c.id)?{...c,...P.get(c.id)}:c);
if(cards.length!==60)throw new Error(`reviewed work batch must remain 60; found ${cards.length}`);
export default cards;
