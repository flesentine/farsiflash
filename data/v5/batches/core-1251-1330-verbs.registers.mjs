import reviewed from './core-1251-1330-verbs.reviewed.mjs';

const P = new Map([
  ['verb.change-mind',{formalFa:'نظرت را عوض کردن'}],
  ['verb.show-up',{formalFa:'پیدا شدن'}],
  ['verb.not-show-up',{formalFa:'نیامدن'}],
  ['verb.stay-over',{formalFa:'شب ماندن'}],
  ['verb.host-guests',{formalFa:'مهمانی دادن'}],
  ['verb.get-stuck-traffic',{formalFa:'در ترافیک گیر کردن'}],
  ['verb.pack-leftovers',{formalFa:'بقیه غذا را بسته‌بندی کردن'}],
  ['verb.skip-part',{formalFa:'یک قسمت را رد کردن'}]
]);
const cards=reviewed.map(c=>P.has(c.id)?{...c,...P.get(c.id),tags:[...new Set([...(c.tags||[]),'register-pair'])]}:c);
if(cards.length!==80)throw new Error(`register-reviewed Step 16 verbs must remain 80; found ${cards.length}`);
export default cards;
