import candidate from './core-1871-1930-reading-society.mjs';
const cards=candidate.map(c=>{
  if(c.id==='reading.privacy') return {...c,id:'reading.data-protection',fa:'حفاظت از داده‌ها',roman:'hefaazat az daadehaa',en:'data protection'};
  if(c.id==='reading.internet-speed') return {...c,id:'reading.bandwidth',fa:'پهنای باند',roman:'pahnaaye baand',en:'bandwidth'};
  if(c.id==='reading.misinformation') return {...c,roman:'etelaate naadorost'};
  return c;
});
if(cards.length!==60)throw new Error(`reviewed society bridge must remain 60; found ${cards.length}`);
export default cards;
