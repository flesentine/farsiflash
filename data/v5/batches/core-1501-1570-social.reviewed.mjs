import candidate from './core-1501-1570-social.mjs';

const P = new Map([
  ['social.proud',{id:'social.satisfied',fa:'راضیم',roman:'raaziam',en:"I'm satisfied"}],
  ['social.embarrassed',{id:'social.self-conscious',fa:'معذبم',roman:'moazabam',en:"I'm uncomfortable / self-conscious"}],
  ['social.jealous',{id:'social.suspicious',fa:'شک دارم',roman:'shak daaram',en:"I'm suspicious / I have doubts"}],
  ['social.relieved',{id:'social.reassured',fa:'خیالم جمع شد',roman:'khiaalam jam shod',en:"I'm reassured"}],
  ['social.disappointed',{id:'social.let-down',fa:'تو ذوقم خورد',roman:'to zogham khord',en:'I felt let down'}],
  ['social.surprised',{id:'social.caught-off-guard',fa:'غافلگیر شدم',roman:'ghaafelgir shodam',en:'I was caught off guard'}],
  ['social.confused',{id:'social.torn',fa:'دو دل شدم',roman:'do del shodam',en:"I'm torn / undecided"}],
  ['social.nervous',{id:'social.anxious',fa:'دلشوره دارم',roman:'delshoore daaram',en:"I'm anxious"}],
  ['social.calm',{id:'social.at-ease',fa:'خیالم راحته',roman:'khiaalam raahate',en:"I'm at ease"}],
  ['social.lonely',{id:'social.left-out',fa:'احساس می‌کنم کنار گذاشته شدم',roman:'ehsaas mikonam kenaar gozaashte shodam',en:'I feel left out'}],
  ['social.miss-you',{id:'social.thinking-of-you',fa:'به یادت بودم',roman:'be yaadet boodam',en:'I was thinking of you'}],
  ['social.trust-you',{id:'social.count-on-you',fa:'روت حساب می‌کنم',roman:'root hesaab mikonam',en:'I count on you'}],
  ['social.my-fault',{id:'social.take-responsibility',fa:'مسئولیتش با منه',roman:'masooliyatesh baa mane',en:"I'll take responsibility"}],
  ['social.forgive-me',{id:'social.i-apologize',fa:'عذر می‌خوام',roman:'ozr mikhaam',en:'I apologize'}],
  ['social.argument',{id:'social.disagreement',fa:'اختلاف نظر داشتیم',roman:'ekhtelaafe nazar daashtim',en:'we had a disagreement'}],
  ['social.bored',{id:'social.restless',fa:'کلافه‌ام',roman:'kalaafeam',en:"I'm restless / fed up"}],
  ['social.excited',{id:'social.thrilled',fa:'ذوق دارم',roman:'zogh daaram',en:"I'm excited / thrilled"}],
  ['social.patient',{id:'social.understanding',fa:'درک می‌کنه',roman:'dark mikone',en:'understanding / considerate'}],
  ['social.impatient',{id:'social.short-tempered',fa:'کم‌طاقت',roman:'kamtaaghat',en:'impatient / short-tempered'}],
  ['social.dont-be-offended',{id:'social.no-hard-feelings',fa:'دلخور نشو',roman:'delkhor nasho',en:"don't be upset / no hard feelings"}],
  ['social.reliable',{id:'social.dependable',fa:'میشه بهش تکیه کرد',roman:'mishe behesh tekye kard',en:'you can rely on them'}]
]);
const cards=candidate.map(c=>P.has(c.id)?{...c,...P.get(c.id)}:c);
if(cards.length!==70)throw new Error(`reviewed Step 16 social batch must remain 70; found ${cards.length}`);
export const overlapReplacementCount=P.size;
export default cards;
