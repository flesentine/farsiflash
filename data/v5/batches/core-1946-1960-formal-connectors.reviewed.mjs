import candidate from './core-1946-1960-formal-connectors.mjs';
const cards=candidate.map(c=>c.id==='formalgrammar.while'?{...c,id:'formalgrammar.therefore',fa:'از این رو',roman:'az in roo',en:'therefore / for this reason'}:c);
if(cards.length!==15)throw new Error(`reviewed formal connectors must remain 15; found ${cards.length}`);
export default cards;
