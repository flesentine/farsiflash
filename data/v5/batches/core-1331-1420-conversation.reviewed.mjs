import candidate from './core-1331-1420-conversation.mjs';

const P = new Map([
  ['conversation.what-happened',{id:'conversation.how-did-it-go',fa:'چطور پیش رفت؟',roman:'chetor pish raft?',en:'how did it go?'}],
  ['conversation.say-it-again',{id:'conversation.can-you-repeat-that',fa:'می‌شه تکرار کنی؟',roman:'mishe tekraar koni?',en:'can you repeat that?'}],
  ['conversation.i-dont-get-it',{fa:'متوجه نمی‌شم',roman:'motavajeh nemisham',en:"I don't understand / get it"}],
  ['conversation.now-i-get-it',{fa:'الان متوجه شدم',roman:'alaan motavajeh shodam',en:'now I understand / get it'}],
  ['conversation.are-you-sure',{id:'conversation.do-you-think-so',fa:'فکر می‌کنی؟',roman:'fekr mikoni?',en:'do you think so?'}],
  ['conversation.not-the-same',{fa:'مثل هم نیستن',roman:'mesle ham nistan',en:"they're not the same"}],
  ['conversation.such-as',{id:'conversation.things-like-that',fa:'از این جور چیزا',roman:'az in joor chizaa',en:'things like that'}],
  ['conversation.seriously',{id:'conversation.im-being-serious',fa:'دارم جدی حرف می‌زنم',roman:'daaram jedi harf mizanam',en:"I'm being serious"}],
  ['conversation.just-kidding',{id:'conversation.no-offense-meant',fa:'منظوری نداشتم',roman:'manzoori nadaashtam',en:'I meant no offense'}],
  ['conversation.take-your-time',{id:'conversation.whenever-you-can',fa:'هر وقت تونستی',roman:'har vaght toonesti',en:'whenever you can'}],
  ['conversation.im-on-my-way',{id:'conversation.just-left',fa:'تازه راه افتادم',roman:'taaze raah oftaadam',en:'I just left / set off'}],
  ['conversation.im-running-late',{id:'conversation.be-there-soon',fa:'زود می‌رسم',roman:'zood miresam',en:"I'll be there soon"}],
  ['conversation.see-you-later',{id:'conversation.talk-to-you-soon',fa:'بعداً باهات حرف می‌زنم',roman:'badan baahat harf mizanam',en:"I'll talk to you later"}]
]);
const cards=candidate.map(c=>P.has(c.id)?{...c,...P.get(c.id)}:c);
if(cards.length!==90)throw new Error(`reviewed Step 16 conversation batch must remain 90; found ${cards.length}`);
export const reviewPatchCount=P.size;
export default cards;
