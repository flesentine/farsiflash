import candidate from './core-1721-1735-people.mjs';

const P = new Map([
  ['people.neighbor',{id:'people.next-door-neighbor',fa:'همسایه بغلی',roman:'hamsaaye baghali',en:'next-door neighbor'}],
  ['people.roommate',{id:'people.room-sharing',fa:'هم‌اتاقی',roman:'hamotaaghi',en:'roommate / person sharing a room'}],
  ['people.landlord',{id:'people.real-estate-agent',fa:'مشاور املاک',roman:'moshaavere amlaak',en:'real-estate agent'}],
  ['people.tenant',{id:'people.caretaker',fa:'سرایدار',roman:'saraaydaar',en:'building caretaker'}],
  ['people.relative',{id:'people.distant-relative',fa:'فامیل دور',roman:'faamile door',en:'distant relative'}],
  ['people.fiance',{id:'people.partner',fa:'پارتنر',roman:'paartner',en:'partner'}],
  ['people.stranger',{id:'people.local-person',fa:'آدم محلی',roman:'aadame mahali',en:'local person'}],
  ['people.acquaintance',{id:'people.old-friend',fa:'دوست قدیمی',roman:'dooste ghadimi',en:'old friend'}]
]);
const cards=candidate.map(c=>P.has(c.id)?{...c,...P.get(c.id)}:c);
if(cards.length!==15)throw new Error(`reviewed Step 16 people batch must remain 15; found ${cards.length}`);
export const overlapReplacementCount=P.size;
export default cards;
