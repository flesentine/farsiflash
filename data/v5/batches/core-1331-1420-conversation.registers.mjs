import reviewed from './core-1331-1420-conversation.reviewed.mjs';

const P = new Map([
  ['conversation.can-you-repeat-that',{formalFa:'می‌شود تکرار کنی؟'}],
  ['conversation.i-dont-get-it',{formalFa:'متوجه نمی‌شوم'}],
  ['conversation.could-be',{formalFa:'ممکن است'}],
  ['conversation.thats-it',{formalFa:'همین است'}],
  ['conversation.thats-different',{formalFa:'آن فرق دارد'}],
  ['conversation.same-thing',{formalFa:'همان است'}],
  ['conversation.it-depends',{formalFa:'بستگی دارد'}],
  ['conversation.leave-it',{formalFa:'رهایش کن'}],
  ['conversation.whenever-you-can',{formalFa:'هر وقت توانستی'}],
  ['conversation.bad-time',{formalFa:'الان وقت بدی است؟'}],
  ['conversation.im-coming-too',{formalFa:'من هم می‌آیم'}],
  ['conversation.i-cant-make-it',{formalFa:'نمی‌توانم بیایم'}],
  ['conversation.either-is-fine',{formalFa:'فرقی ندارد'}],
  ['conversation.up-to-you',{formalFa:'دست خودت است'}],
  ['conversation.let-me-explain',{formalFa:'بگذار توضیح بدهم'}]
]);
const cards=reviewed.map(c=>P.has(c.id)?{...c,...P.get(c.id),tags:[...new Set([...(c.tags||[]),'register-pair'])]}:c);
if(cards.length!==90)throw new Error(`register-reviewed Step 16 conversation must remain 90; found ${cards.length}`);
export default cards;
