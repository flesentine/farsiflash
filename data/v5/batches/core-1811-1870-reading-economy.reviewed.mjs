import candidate from './core-1811-1870-reading-economy.mjs';
const cards=candidate.map(c=>c.id==='reading.pay-raise'?{...c,id:'reading.real-wages',fa:'دستمزد واقعی',roman:'dastmozde vaaghei',en:'real wages'}:c);
if(cards.length!==60)throw new Error(`reviewed economy bridge must remain 60; found ${cards.length}`);
export default cards;
