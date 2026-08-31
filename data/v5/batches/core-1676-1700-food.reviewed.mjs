import candidate from './core-1676-1700-food.mjs';

const P = new Map([
  ['food.appetizer',{id:'food.buffet',fa:'بوفه',roman:'boofe',en:'buffet'}],
  ['food.dessert',{id:'food.sweets',fa:'شیرینی',roman:'shirini',en:'sweets / pastries'}],
  ['food.snack',{id:'food.light-meal',fa:'غذای سبک',roman:'ghazaaye sabok',en:'light meal'}],
  ['food.medium',{en:'partly cooked / undercooked'}],
  ['food.vegetarian',{fa:'گیاه‌خوار',roman:'giyaahkhaar',en:'vegetarian'}]
]);
const cards=candidate.map(c=>P.has(c.id)?{...c,...P.get(c.id)}:c);
if(cards.length!==25)throw new Error(`reviewed Step 16 food batch must remain 25; found ${cards.length}`);
export const reviewPatchCount=P.size;
export default cards;
