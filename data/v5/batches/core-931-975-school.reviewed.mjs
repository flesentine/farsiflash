import candidate from './core-931-975-school.mjs';
const P=new Map([
  ['school.classmate',{id:'school.study-group',fa:'گروه مطالعه',roman:'gorohe motalee',en:'study group'}]
]);
const cards=candidate.map(c=>P.has(c.id)?{...c,...P.get(c.id)}:c);
if(cards.length!==45)throw new Error(`reviewed school batch must remain 45; found ${cards.length}`);
export default cards;
