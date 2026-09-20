import candidate from './core-1751-1810-reading-public.mjs';
const cards=candidate.map(c=>c.id==='reading.press-conference'?{...c,roman:'konferaanse khabari'}:c);
if(cards.length!==60)throw new Error(`reviewed public bridge must remain 60; found ${cards.length}`);
export default cards;
