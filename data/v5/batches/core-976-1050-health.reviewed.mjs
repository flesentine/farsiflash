import candidate from './core-976-1050-health.mjs';

const P=new Map([
  ['health.nurse',{id:'health.specialist',fa:'متخصص',roman:'motekhases',en:'specialist doctor'}],
  ['health.appointment',{id:'health.follow-up-visit',fa:'ویزیت بعدی',roman:'vizite badi',en:'follow-up visit'}],
  ['health.reception',{id:'health.waiting-room',fa:'اتاق انتظار',roman:'otaaghe entezar',en:'waiting room'}],
  ['health.prescription',{id:'health.prescription-refill',fa:'تمدید نسخه',roman:'tamdide noskhe',en:'prescription refill'}],
  ['health.pill',{id:'health.half-tablet',fa:'نصف قرص',roman:'nesfe ghors',en:'half a tablet'}],
  ['health.bandage',{id:'health.sterile-gauze',fa:'گاز استریل',roman:'gaaze esteril',en:'sterile gauze'}],
  ['health.band-aid',{id:'health.medical-tape',fa:'چسب پزشکی',roman:'chasbe pezeshki',en:'medical tape'}],
  ['health.fever',{id:'health.chills',fa:'لرز',roman:'larz',en:'chills'}],
  ['health.headache',{id:'health.migraine',fa:'میگرن',roman:'migren',en:'migraine'}],
  ['health.stomachache',{id:'health.stomach-cramp',fa:'دل پیچه',roman:'del piche',en:'stomach cramps'}],
  ['health.sore-throat',{id:'health.phlegm',fa:'خلط',roman:'khelt',en:'phlegm'}],
  ['health.cough',{id:'health.dry-cough',fa:'سرفه خشک',roman:'sorfe khoshk',en:'dry cough'}],
  ['health.cold',{id:'health.runny-nose',fa:'آبریزش بینی',roman:'aabrizeshe bini',en:'runny nose'}],
  ['health.allergy',{id:'health.allergic-reaction',fa:'واکنش حساسیتی',roman:'vaakoneshe hasaasiati',en:'allergic reaction'}],
  ['health.wound',{id:'health.infection',fa:'عفونت',roman:'ofoonat',en:'infection'}],
  ['health.emergency',{id:'health.urgent-care',fa:'درمان فوری',roman:'darmaane fori',en:'urgent care'}],
  ['health.dizzy',{id:'health.fainting',fa:'غش',roman:'ghash',en:'fainting'}],
  ['health.nausea',{id:'health.shortness-breath',fa:'تنگی نفس',roman:'tangiye nafas',en:'shortness of breath'}]
]);
const cards=candidate.map(c=>P.has(c.id)?{...c,...P.get(c.id)}:c);
if(cards.length!==75)throw new Error(`reviewed health batch must remain 75; found ${cards.length}`);
export const overlapReplacementCount=P.size;
export default cards;
