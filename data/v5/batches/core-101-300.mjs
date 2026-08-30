import { scoreCandidate } from '../../../tools/lib/v5-scoring.mjs';
const PROFILES={"people":{"conversationalFrequency":88,"speakerDispersion":92,"practicalUsefulness":92,"generativeValue":72,"modernRelevance":90,"writtenFrequency":75},"time":{"conversationalFrequency":90,"speakerDispersion":94,"practicalUsefulness":92,"generativeValue":82,"modernRelevance":90,"writtenFrequency":80},"food":{"conversationalFrequency":86,"speakerDispersion":92,"practicalUsefulness":94,"generativeValue":72,"modernRelevance":92,"writtenFrequency":70},"home":{"conversationalFrequency":84,"speakerDispersion":90,"practicalUsefulness":90,"generativeValue":68,"modernRelevance":90,"writtenFrequency":68},"shopping":{"conversationalFrequency":86,"speakerDispersion":90,"practicalUsefulness":94,"generativeValue":76,"modernRelevance":96,"writtenFrequency":65},"travel":{"conversationalFrequency":85,"speakerDispersion":90,"practicalUsefulness":94,"generativeValue":78,"modernRelevance":96,"writtenFrequency":65},"verb":{"conversationalFrequency":90,"speakerDispersion":93,"practicalUsefulness":94,"generativeValue":92,"modernRelevance":90,"writtenFrequency":72},"social":{"conversationalFrequency":88,"speakerDispersion":92,"practicalUsefulness":90,"generativeValue":76,"modernRelevance":92,"writtenFrequency":72},"modern":{"conversationalFrequency":84,"speakerDispersion":90,"practicalUsefulness":94,"generativeValue":72,"modernRelevance":100,"writtenFrequency":60}};
const SOURCE=`people.mother|مادر|maadar|mother|neutral|people|people||
people.father|پدر|pedar|father|neutral|people|people||
people.sister|خواهر|khaahar|sister|neutral|people|people||
people.brother|برادر|baraadar|brother|neutral|people|people||
people.husband|شوهر|shohar|husband|everyday|people|people||
people.spouse|همسر|hamsar|spouse|neutral|people|people||
people.family|خانواده|khaanevaade|family|neutral|people|people||
people.friend|دوست|doost|friend|everyday|people|people||
people.man|مرد|mard|man|neutral|people|people||
people.woman|زن|zan|woman|neutral|people|people||
people.child|بچه|bache|child / kid|everyday|people|people||
people.girl|دختر|dokhtar|girl|neutral|people|people||
people.boy|پسر|pesar|boy|neutral|people|people||
people.grandmother|مادربزرگ|maadarbozorg|grandmother|neutral|people|people||
people.grandfather|پدربزرگ|pedarbozorg|grandfather|neutral|people|people||
people.relative|فامیل|faamil|relative|everyday|people|people||
people.neighbor|همسایه|hamsaaye|neighbor|neutral|people|people||
people.guest|مهمون|mehmoon|guest|spoken|people|people|مهمان|spoken-form
people.age|سن|sen|age|neutral|people|people||
people.years-old|ساله|saale|years old|spoken|people|people||high-transfer-pattern,spoken-form
number.zero|صفر|sefr|zero|neutral|grammar|time||
number.one|یک|yek|one|neutral|grammar|time||
number.two|دو|do|two|neutral|grammar|time||
number.three|سه|se|three|neutral|grammar|time||
number.four|چهار|chahaar|four|neutral|grammar|time||
number.five|پنج|panj|five|neutral|grammar|time||
number.six|شش|shesh|six|neutral|grammar|time||
number.seven|هفت|haft|seven|neutral|grammar|time||
number.eight|هشت|hasht|eight|neutral|grammar|time||
number.nine|نه|noh|nine|neutral|grammar|time||homograph
number.ten|ده|dah|ten|neutral|grammar|time||
number.twenty|بیست|bist|twenty|neutral|grammar|time||
number.hundred|صد|sad|hundred|neutral|grammar|time||
number.thousand|هزار|hezaar|thousand|neutral|grammar|time||
time.minute|دقیقه|daghighe|minute|neutral|conversation|time||
time.hour|ساعت|saa'at|hour / o'clock|neutral|conversation|time||
time.morning|صبح|sobh|morning|neutral|conversation|time||
time.noon|ظهر|zohr|noon|neutral|conversation|time||
time.afternoon|بعدازظهر|ba'dazzohr|afternoon|neutral|conversation|time||
time.night|شب|shab|night|neutral|conversation|time||
time.week|هفته|hafte|week|neutral|conversation|time||
time.month|ماه|maah|month|neutral|conversation|time||
time.year|سال|saal|year|neutral|conversation|time||
time.day|روز|rooz|day|neutral|conversation|time||
time.weekend|آخر هفته|aakhare hafte|weekend|everyday|conversation|time||
food.bread|نون|noon|bread|spoken|food|food|نان|spoken-form
food.rice|برنج|berenj|rice|neutral|food|food||
food.tea|چای|chaay|tea|neutral|food|food||
food.coffee|قهوه|ghahve|coffee|neutral|food|food||
food.milk|شیر|shir|milk|neutral|food|food||
food.juice|آبمیوه|aabmive|juice|neutral|food|food||
food.meat|گوشت|goosht|meat|neutral|food|food||
food.chicken|مرغ|morgh|chicken|neutral|food|food||
food.fish|ماهی|maahi|fish|neutral|food|food||
food.egg|تخم مرغ|tokhme morgh|egg|neutral|food|food||
food.cheese|پنیر|panir|cheese|neutral|food|food||
food.yogurt|ماست|maast|yogurt|neutral|food|food||
food.fruit|میوه|mive|fruit|neutral|food|food||
food.vegetables|سبزی|sabzi|vegetables / greens|everyday|food|food||
food.apple|سیب|sib|apple|neutral|food|food||
food.banana|موز|moz|banana|neutral|food|food||
food.orange|پرتقال|porteghaal|orange|neutral|food|food||
food.breakfast|صبحانه|sobhaane|breakfast|neutral|food|food||
food.lunch|ناهار|naahaar|lunch|neutral|food|food||
food.dinner|شام|shaam|dinner|neutral|food|food||
food.hungry|گرسنه|gorosne|hungry|everyday|food|food||
food.thirsty|تشنه|teshne|thirsty|everyday|food|food||
food.delicious|خوشمزه|khoshmaze|delicious|everyday|food|food||
restaurant.menu|منو|menu|menu|everyday|food|food||
restaurant.bill|حساب|hesaab|bill / check|everyday|food|food||
home.room|اتاق|otaagh|room|neutral|home|home||
home.kitchen|آشپزخونه|aashpazkhoone|kitchen|spoken|home|home|آشپزخانه|spoken-form
home.bedroom|اتاق خواب|otaaghe khaab|bedroom|everyday|home|home||
home.door|در|dar|door|neutral|home|home||
home.window|پنجره|panjare|window|neutral|home|home||
home.table|میز|miz|table|neutral|home|home||
home.chair|صندلی|sandali|chair|neutral|home|home||
home.bed|تخت|takht|bed|neutral|home|home||
home.sofa|مبل|mobl|sofa|everyday|home|home||
home.light|چراغ|cheraagh|light / lamp|everyday|home|home||
home.key|کلید|kelid|key|neutral|home|home||
home.bag|کیف|kif|bag|neutral|home|home||
clothes.clothing|لباس|lebaas|clothes|neutral|home|home||
clothes.shoe|کفش|kafsh|shoe|neutral|home|home||
clothes.tshirt|تی‌شرت|ti-shert|T-shirt|everyday|home|home||
clothes.pants|شلوار|shalvaar|pants|neutral|home|home||
clothes.jacket|کت|kot|jacket|neutral|home|home||
home.towel|حوله|hole|towel|neutral|home|home||
home.soap|صابون|saaboon|soap|neutral|home|home||
home.toothbrush|مسواک|mesvaak|toothbrush|neutral|home|home||
shopping.price|قیمت|gheymat|price|neutral|shopping|shopping||
shopping.how-much-is-it|چنده؟|chande?|how much is it?|spoken|shopping|shopping|چند است؟|essential-chunk,spoken-form
shopping.expensive|گرون|geroon|expensive|spoken|shopping|shopping|گران|spoken-form
shopping.cheap|ارزون|arzoon|cheap|spoken|shopping|shopping|ارزان|spoken-form
shopping.discount|تخفیف|takhfif|discount|neutral|shopping|shopping||
shopping.size|سایز|saayz|size|everyday|shopping|shopping||
modifier.small|کوچیک|koochik|small|spoken|shopping|shopping|کوچک|spoken-form
modifier.big|بزرگ|bozorg|big|neutral|shopping|shopping||
modifier.more|بیشتر|bishtar|more|neutral|shopping|shopping||
modifier.less|کمتر|kamtar|less|neutral|shopping|shopping||
conversation.enough|کافیه|kaafiye|that's enough|spoken|shopping|shopping|کافی است|essential-chunk,spoken-form
shopping.cash|نقد|naghd|cash|neutral|shopping|shopping||
shopping.card|کارت|kaart|card|everyday|shopping|shopping||modern-life
shopping.receipt|رسید|resid|receipt|neutral|shopping|shopping||
shopping.toman|تومان|toomaan|toman|everyday|shopping|shopping||modern-life
shopping.change-money|پول خرد|poole khord|small change|everyday|shopping|shopping||
verb.buy|خریدن|kharidan|to buy|neutral|shopping|shopping||
verb.sell|فروختن|forookhtan|to sell|neutral|shopping|shopping||
verb.pay|پول دادن|pool daadan|to pay|everyday|shopping|shopping||productive-compound-verb
verb.try-on|پرو کردن|poro kardan|to try on|everyday|shopping|shopping||productive-compound-verb
shopping.open|باز|baaz|open|everyday|shopping|shopping||
shopping.closed|بسته|baste|closed|everyday|shopping|shopping||
modifier.other|دیگه|dige|other / another|spoken|shopping|shopping|دیگر|spoken-form,high-transfer-pattern
shopping.one-more|یکی دیگه|yeki dige|one more / another one|spoken|shopping|shopping|یکی دیگر|essential-chunk,spoken-form
shopping.color|رنگ|rang|color|neutral|shopping|shopping||
travel.address|آدرس|aadres|address|everyday|travel|travel||
travel.street|خیابون|khiyaaboon|street|spoken|travel|travel|خیابان|spoken-form
direction.left|چپ|chap|left|neutral|travel|travel||
direction.right|راست|raast|right|neutral|travel|travel||
direction.straight|مستقیم|mostaghim|straight|neutral|travel|travel||
direction.near|نزدیک|nazdik|near|neutral|travel|travel||
direction.far|دور|door|far|neutral|travel|travel||
direction.up|بالا|baalaa|up|neutral|travel|travel||
direction.down|پایین|paayin|down|neutral|travel|travel||
direction.inside|داخل|daakhel|inside|neutral|travel|travel||
direction.outside|بیرون|biroon|outside|everyday|travel|travel||
travel.entrance|ورودی|voroodi|entrance|neutral|travel|travel||
travel.exit|خروجی|khorooji|exit|neutral|travel|travel||
travel.bus|اتوبوس|otoboos|bus|neutral|travel|travel||
travel.metro|مترو|metro|metro / subway|everyday|travel|travel||modern-life
travel.taxi|تاکسی|taaksi|taxi|everyday|travel|travel||
travel.station|ایستگاه|istgaah|station / stop|neutral|travel|travel||
travel.airport|فرودگاه|foroodgaah|airport|neutral|travel|travel||
travel.traffic|ترافیک|teraafik|traffic|everyday|travel|travel||modern-life
travel.map|نقشه|naghshe|map|neutral|travel|travel||
travel.location|لوکیشن|lokeyshan|location pin / location|spoken|travel|travel||modern-life,spoken-form
travel.driver|راننده|raanande|driver|neutral|travel|travel||
travel.place|جا|jaa|place / space|everyday|travel|travel||high-transfer-pattern
travel.parking|پارکینگ|paarking|parking|everyday|travel|travel||modern-life
travel.gas-station|پمپ بنزین|pompe benzin|gas station|everyday|travel|travel||
verb.sleep|خوابیدن|khaabidan|to sleep|neutral|verbs|verb||
verb.wake-up|بیدار شدن|bidaar shodan|to wake up|everyday|verbs|verb||productive-compound-verb
verb.sit|نشستن|neshastan|to sit|neutral|verbs|verb||
verb.stand|ایستادن|istaadan|to stand|neutral|verbs|verb||
verb.open|باز کردن|baaz kardan|to open|everyday|verbs|verb||productive-compound-verb
verb.close|بستن|bastan|to close|neutral|verbs|verb||
verb.bring|آوردن|aavardan|to bring|neutral|verbs|verb||
verb.take-away|بردن|bordan|to take / carry away|neutral|verbs|verb||
verb.wear|پوشیدن|pooshidan|to wear / put on|neutral|verbs|verb||
verb.take-off|درآوردن|dar aavardan|to take off / remove|everyday|verbs|verb||productive-compound-verb
verb.wash|شستن|shostan|to wash|neutral|verbs|verb||
verb.clean|تمیز کردن|tamiz kardan|to clean|everyday|verbs|verb||productive-compound-verb
verb.cook|غذا درست کردن|ghazaa dorost kardan|to cook / make food|everyday|verbs|verb||productive-compound-verb
verb.order|سفارش دادن|sefaresh daadan|to order|everyday|verbs|verb||productive-compound-verb
verb.drive|رانندگی کردن|raanandegi kardan|to drive|everyday|verbs|verb||productive-compound-verb
verb.get-on|سوار شدن|savaar shodan|to get on / get in|everyday|verbs|verb||productive-compound-verb
verb.get-off|پیاده شدن|piyaade shodan|to get off / get out|everyday|verbs|verb||productive-compound-verb
verb.arrive|رسیدن|residan|to arrive / reach|neutral|verbs|verb||
verb.return|برگشتن|bargashtan|to return / come back|everyday|verbs|verb||
verb.learn|یاد گرفتن|yaad gereftan|to learn|everyday|verbs|verb||productive-compound-verb
verb.teach|یاد دادن|yaad daadan|to teach|everyday|verbs|verb||productive-compound-verb
verb.ask|پرسیدن|porsidan|to ask|neutral|verbs|verb||
verb.forget|فراموش کردن|faraamoosh kardan|to forget|everyday|verbs|verb||productive-compound-verb
verb.want|خواستن|khaastan|to want|neutral|verbs|verb||high-transfer-pattern
verb.can|تونستن|toonestan|to be able to / can|spoken|verbs|verb|توانستن|spoken-form,high-transfer-pattern
verb.stay|موندن|moondan|to stay / remain|spoken|verbs|verb|ماندن|spoken-form
verb.walk|راه رفتن|raah raftan|to walk|everyday|verbs|verb||productive-compound-verb
verb.run|دویدن|davidan|to run|neutral|verbs|verb||
verb.play|بازی کردن|baazi kardan|to play|everyday|verbs|verb||productive-compound-verb
verb.read|خوندن|khoondan|to read|spoken|verbs|verb|خواندن|spoken-form
verb.write|نوشتن|neveshtan|to write|neutral|verbs|verb||
verb.study|درس خوندن|dars khoondan|to study|spoken|verbs|verb|درس خواندن|productive-compound-verb,spoken-form
verb.live|زندگی کردن|zendegi kardan|to live|everyday|verbs|verb||productive-compound-verb
verb.use|استفاده کردن|estefaade kardan|to use|neutral|verbs|verb||productive-compound-verb
verb.choose|انتخاب کردن|entekhaab kardan|to choose|neutral|verbs|verb||productive-compound-verb
adjective.good|خوب|khoob|good|everyday|social|social||
adjective.bad|بد|bad|bad|neutral|social|social||
adjective.beautiful|قشنگ|ghashang|beautiful / pretty|everyday|social|social||
adjective.kind|مهربون|mehraboon|kind|spoken|social|social|مهربان|spoken-form
feeling.happy|خوشحال|khoshhaal|happy|everyday|social|social||
feeling.sad|ناراحت|naaraahat|sad / upset|everyday|social|social||
feeling.tired|خسته|khaste|tired|everyday|social|social||
conversation.busy|سرم شلوغه|saram sholooghe|I'm busy|spoken|social|social|سرم شلوغ است|essential-chunk,spoken-form
adjective.ready|آماده|aamaade|ready|neutral|social|social||
adjective.sure|مطمئن|motma'en|sure / certain|neutral|social|social||
adjective.easy|آسون|aasoon|easy|spoken|social|social|آسان|spoken-form
adjective.hard|سخت|sakht|hard / difficult|neutral|social|social||
adjective.hot|گرم|garm|hot / warm|neutral|social|social||
adjective.cold|سرد|sard|cold|neutral|social|social||
adjective.fast|سریع|sari'|fast|neutral|social|social||
tech.internet|اینترنت|internet|internet|everyday|technology|modern||modern-life
tech.wifi|وای‌فای|vaay-faay|Wi-Fi|everyday|technology|modern||modern-life
tech.charger|شارژر|shaarzher|charger|everyday|technology|modern||modern-life
tech.battery|باتری|baatri|battery|everyday|technology|modern||modern-life
tech.password|رمز|ramz|password / code|everyday|technology|modern||modern-life
tech.message|پیام|payaam|message|neutral|technology|modern||modern-life
tech.photo|عکس|aks|photo|everyday|technology|modern||modern-life
tech.video|ویدیو|video|video|everyday|technology|modern||modern-life
tech.link|لینک|link|link|everyday|technology|modern||modern-life
tech.app|اپ|app|app|spoken|technology|modern||modern-life,spoken-form`;
const RAW=SOURCE.trim().split('\n').map((line)=>{
  const [id,fa,roman,en,register,category,profile,formalFa,tags='']=line.split('|');
  return {id,fa,roman,en,register,category,profile,formalFa:formalFa||null,tags:tags?tags.split(','):[]};
});
function buildCard(raw){
  const signals=PROFILES[raw.profile];
  if(!signals) throw new Error(`Unknown scoring profile: ${raw.profile}`);
  const candidate={register:raw.register,category:raw.category,millerRank:null,tags:raw.tags,signals};
  const scored=scoreCandidate(candidate);
  const card={id:raw.id,fa:raw.fa,roman:raw.roman,en:raw.en,register:raw.register,category:raw.category,millerRank:null,selection:{score:scored.score,signals:{...signals}},tags:raw.tags};
  if(raw.formalFa) card.formalFa=raw.formalFa;
  return card;
}
const cards=RAW.map(buildCard);
if(cards.length!==200) throw new Error(`core-101-300 must contain 200 cards; found ${cards.length}`);
export default cards;
