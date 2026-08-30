import candidate from './core-1171-1215-home.mjs';

const P=new Map([
  ['home.laundry',{id:'home.drying-rack',fa:'بند رخت',roman:'bande rakht',en:'drying rack / clothesline'}],
  ['home.detergent',{id:'home.fabric-softener',fa:'نرم کننده لباس',roman:'narm konandeye lebaas',en:'fabric softener'}],
  ['home.dish-soap',{id:'home.dish-brush',fa:'برس ظرفشویی',roman:'borose zarfshooyi',en:'dish brush'}],
  ['home.sponge',{id:'home.cleaning-cloth',fa:'دستمال نظافت',roman:'dastmaale nezaafat',en:'cleaning cloth'}],
  ['home.trash',{id:'home.reusable-bag',fa:'کیسه پارچه‌ای',roman:'kiseye paarchei',en:'reusable cloth bag'}],
  ['home.broom',{id:'home.dustpan',fa:'خاک انداز',roman:'khaak andaaz',en:'dustpan'}],
  ['home.mop',{id:'home.duster',fa:'گردگیر',roman:'gardgir',en:'duster'}],
  ['home.vacuum',{id:'home.steam-cleaner',fa:'بخارشوی',roman:'bokhaarshooy',en:'steam cleaner'}],
  ['home.bucket',{id:'home.cleaning-spray',fa:'اسپری تمیزکننده',roman:'espreye tamiz konande',en:'cleaning spray'}],
  ['home.towel',{id:'home.hand-towel',fa:'حوله دست',roman:'holeye dast',en:'hand towel'}],
  ['home.soap',{id:'home.hand-soap',fa:'مایع دستشویی',roman:'maayee dastshooyi',en:'liquid hand soap'}],
  ['home.shampoo',{id:'home.hair-conditioner',fa:'نرم کننده مو',roman:'narm konandeye moo',en:'hair conditioner'}],
  ['home.toothpaste',{id:'home.dental-floss',fa:'نخ دندان',roman:'nakhe dandaan',en:'dental floss'}],
  ['home.toothbrush',{id:'home.mouthwash',fa:'دهان شویه',roman:'dahaan shooye',en:'mouthwash'}],
  ['home.mirror',{id:'home.bathroom-mirror',fa:'آینه دستشویی',roman:'aayeneye dastshooyi',en:'bathroom mirror'}],
  ['home.drawer',{id:'home.dresser',fa:'دراور',roman:'deraavar',en:'dresser / chest of drawers'}],
  ['home.closet',{id:'home.hanger',fa:'چوب لباسی',roman:'choob lebaasi',en:'clothes hanger'}],
  ['home.shelf',{id:'home.shoe-rack',fa:'جاکفشی',roman:'jaakafshi',en:'shoe rack'}],
  ['home.cabinet',{id:'home.pantry',fa:'کمد مواد غذایی',roman:'komode mavaade ghazaayi',en:'pantry / food cupboard'}],
  ['home.outlet',{id:'home.surge-protector',fa:'محافظ برق',roman:'mohaafeze bargh',en:'surge protector'}],
  ['home.dishwasher',{id:'home.dish-rack',fa:'آبچکان',roman:'aabchakaan',en:'dish rack'}],
  ['home.washing-machine',{id:'home.laundry-pod',fa:'کپسول لباسشویی',roman:'kapsole lebaasshooyi',en:'laundry pod'}],
  ['home.microwave',{id:'home.freezer',fa:'فریزر',roman:'ferizer',en:'freezer'}]
]);
const cards=candidate.map(c=>P.has(c.id)?{...c,...P.get(c.id)}:c);
if(cards.length!==45)throw new Error(`reviewed home batch must remain 45; found ${cards.length}`);
export const overlapReplacementCount=P.size;
export default cards;
