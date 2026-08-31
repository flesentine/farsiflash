import candidate from './core-1981-2000-late-everyday.mjs';
const cards=candidate.map(c=>c.id==='late.alternate-route'?{...c,id:'late.estimated-delivery-time',fa:'زمان تقریبی تحویل',roman:'zamaane taghribiye tahvil',en:'estimated delivery time'}:c);
if(cards.length!==20)throw new Error(`reviewed late everyday batch must remain 20; found ${cards.length}`);
export default cards;
