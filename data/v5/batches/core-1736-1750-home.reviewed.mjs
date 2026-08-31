import candidate from './core-1736-1750-home.mjs';

const P = new Map([
  ['home.elevator',{id:'home.building-lobby',fa:'لابی ساختمان',roman:'laabiye saakhtemaan',en:'building lobby'}],
  ['home.stairs',{id:'home.stairwell',fa:'راه‌پله',roman:'raahpele',en:'stairwell'}],
  ['home.balcony',{id:'home.rooftop',fa:'پشت‌بام',roman:'poshtebaam',en:'rooftop'}],
  ['home.doorbell',{id:'home.mailbox',fa:'صندوق پست',roman:'sandoghe post',en:'mailbox'}]
]);
const cards=candidate.map(c=>P.has(c.id)?{...c,...P.get(c.id)}:c);
if(cards.length!==15)throw new Error(`reviewed Step 16 home batch must remain 15; found ${cards.length}`);
export const overlapReplacementCount=P.size;
export default cards;
