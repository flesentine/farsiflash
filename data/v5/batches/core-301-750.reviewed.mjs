import candidateCards from './core-301-750.mjs';

// Step 14 overlap-cleanup pass.
// Replace concepts already taught in cards 1–300 rather than renaming duplicate IDs.
// The candidate batch remains intact for provenance; this reviewed file is the effective source.
const REPLACEMENTS = new Map([
  ['verb.wear', { id:'verb.get-dressed', fa:'لباس پوشیدن', roman:'lebaas pooshidan', en:'to get dressed' }],
  ['verb.take-off-clothes', { id:'verb.change-clothes', fa:'لباس عوض کردن', roman:'lebaas avaz kardan', en:'to change clothes' }],
  ['verb.wash', { id:'verb.wash-dishes', fa:'ظرف شستن', roman:'zarf shostan', en:'to wash dishes' }],
  ['verb.clean', { id:'verb.take-trash-out', fa:'زباله رو بیرون بردن', roman:'zobaale ro biroon bordan', en:'to take the trash out' }],
  ['verb.cook', { id:'verb.make-bed', fa:'تخت رو مرتب کردن', roman:'takht ro moratab kardan', en:'to make the bed' }],
  ['verb.open', { id:'verb.plug-in', fa:'به برق زدن', roman:'be bargh zadan', en:'to plug in' }],
  ['verb.close', { id:'verb.unplug', fa:'از برق کشیدن', roman:'az bargh keshidan', en:'to unplug' }],
  ['verb.pay', { id:'verb.put-away', fa:'کنار گذاشتن', roman:'kenaar gozaashtan', en:'to put aside / put away' }],
  ['verb.order', { id:'verb.throw-away', fa:'دور انداختن', roman:'door andaakhtan', en:'to throw away' }],
  ['verb.learn', { id:'verb.take-notes', fa:'یادداشت برداشتن', roman:'yaaddaasht bardaashtan', en:'to take notes' }],
  ['verb.forget', { id:'verb.set-alarm', fa:'آلارم گذاشتن', roman:'aalaarm gozaashtan', en:'to set an alarm' }],
  ['verb.use', { id:'verb.share', fa:'به اشتراک گذاشتن', roman:'be eshteraak gozaashtan', en:'to share' }],
  ['verb.wake-up', { id:'verb.go-to-bed', fa:'رفتن توی تخت', roman:'raftan tooye takht', en:'to go to bed' }],

  ['people.grandmother', { id:'people.baby', fa:'نوزاد', roman:'nozaad', en:'baby / newborn' }],
  ['people.grandfather', { id:'people.teenager', fa:'نوجوان', roman:'nojavan', en:'teenager' }],
  ['home.key', { id:'home.curtain', fa:'پرده', roman:'parde', en:'curtain' }],

  ['food.tea', { id:'food.flour', fa:'آرد', roman:'aard', en:'flour' }],
  ['food.coffee', { id:'food.vinegar', fa:'سرکه', roman:'serke', en:'vinegar' }],
  ['food.juice', { id:'food.cinnamon', fa:'دارچین', roman:'daarchin', en:'cinnamon' }],
  ['food.milk', { id:'food.mint', fa:'نعناع', roman:'nanaa', en:'mint' }],

  ['shopping.receipt', { id:'shopping.barcode', fa:'بارکد', roman:'baarkod', en:'barcode' }],
  ['shopping.change-money', { id:'shopping.shopping-cart', fa:'چرخ خرید', roman:'charkhe kharid', en:'shopping cart' }],
  ['shopping.discount', { id:'shopping.checkout', fa:'صندوق', roman:'sandough', en:'checkout / register' }],
  ['shopping.size', { id:'shopping.out-of-stock', fa:'ناموجود', roman:'naamojood', en:'out of stock / unavailable' }],
  ['shopping.package', { id:'shopping.final-price', fa:'قیمت آخر', roman:'gheymate aakhar', en:'final price' }],

  ['travel.bus', { id:'travel.train', fa:'قطار', roman:'ghataar', en:'train' }],
  ['travel.metro', { id:'travel.platform', fa:'سکو', roman:'sakoo', en:'platform' }],
  ['travel.taxi', { id:'travel.terminal', fa:'ترمینال', roman:'terminal', en:'terminal' }],
  ['travel.airport', { id:'travel.delay', fa:'تاخیر', roman:'taakhir', en:'delay' }],
  ['travel.traffic', { id:'travel.heavy-traffic', fa:'ترافیک سنگین', roman:'teraafike sangin', en:'heavy traffic / traffic jam' }],

  ['tech.app', { id:'tech.voice-message', fa:'ویس', roman:'veys', en:'voice message' }],
  ['tech.password', { id:'tech.video-call', fa:'تماس تصویری', roman:'tamaase tasviri', en:'video call' }]
]);

const cards = candidateCards.map((card) => {
  const patch = REPLACEMENTS.get(card.id);
  return patch ? { ...card, ...patch } : card;
});

if (cards.length !== 450) throw new Error(`reviewed core-301-750 must contain 450 cards; found ${cards.length}`);
for (const id of REPLACEMENTS.keys()) {
  if (!candidateCards.some((card) => card.id === id)) throw new Error(`Step 14 replacement target not found: ${id}`);
}

export const overlapReplacementCount = REPLACEMENTS.size;
export default cards;
