import candidate from './core-1116-1170-social.mjs';
const P=new Map([
  ['social.happy',{id:'social.relieved',fa:'خیالم راحت شد',roman:'khiyaalam raahat shod',en:'I feel relieved'}],
  ['social.upset',{id:'social.disappointed',fa:'ناامید',roman:'naaomid',en:'disappointed'}],
  ['social.not-in-mood',{id:'social.overwhelmed',fa:'کلافه‌ام',roman:'kalaafeam',en:'I am overwhelmed / frustrated'}]
]);
const cards=candidate.map(c=>P.has(c.id)?{...c,...P.get(c.id)}:c);
if(cards.length!==55)throw new Error(`reviewed social batch must remain 55; found ${cards.length}`);
export default cards;
