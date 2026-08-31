import candidate from './core-1631-1675-travel.mjs';

const P = new Map([
  ['travel.gas-station',{id:'travel.car-wash',fa:'کارواش',roman:'kaarvaash',en:'car wash'}],
  ['travel.intersection',{id:'travel.u-turn',fa:'دوربرگردان',roman:'doorbargardaan',en:'U-turn / turnaround'}],
  ['travel.roundabout',{id:'travel.exit-ramp',fa:'رمپ خروجی',roman:'rampe khorooji',en:'exit ramp'}],
  ['travel.boarding-pass',{id:'travel.flight-number',fa:'شماره پرواز',roman:'shomaareye parvaaz',en:'flight number'}]
]);
const cards=candidate.map(c=>P.has(c.id)?{...c,...P.get(c.id)}:c);
if(cards.length!==45)throw new Error(`reviewed Step 16 travel batch must remain 45; found ${cards.length}`);
export const overlapReplacementCount=P.size;
export default cards;
