import candidate from './core-1216-1250-conversation.mjs';
const P=new Map([
  ['conversation.not-yet',{id:'conversation.not-right-now',fa:'الان نه',roman:'alaan na',en:'not right now'}],
  ['conversation.i-have-appointment',{id:'conversation.im-free',fa:'وقتم آزاده',roman:'vaghtam aazaade',en:'I am free / available'}]
]);
const cards=candidate.map(c=>P.has(c.id)?{...c,...P.get(c.id)}:c);
if(cards.length!==35)throw new Error(`reviewed conversation batch must remain 35; found ${cards.length}`);
export default cards;
