import candidate from './core-1051-1115-technology.mjs';

const P=new Map([
  ['tech.charger',{id:'tech.usb-cable',fa:'کابل یو اس بی',roman:'kaabele yoo es bi',en:'USB cable'}],
  ['tech.power-bank',{id:'tech.wall-adapter',fa:'آداپتور برق',roman:'aadaaptore bargh',en:'power adapter'}],
  ['tech.headphones',{id:'tech.volume-level',fa:'میزان صدا',roman:'mizaane sedaa',en:'volume level'}],
  ['tech.earbuds',{id:'tech.speakerphone',fa:'بلندگوی تماس',roman:'bolandgooye tamaas',en:'speakerphone'}],
  ['tech.screenshot',{id:'tech.screen-brightness',fa:'روشنایی صفحه',roman:'roshanaayiye safhe',en:'screen brightness'}],
  ['tech.video',{id:'tech.video-quality',fa:'کیفیت ویدیو',roman:'keifiyate video',en:'video quality'}],
  ['tech.voice-message',{id:'tech.read-receipt',fa:'پیام خوانده شده',roman:'peyaame khaande shode',en:'read receipt'}],
  ['tech.notification',{id:'tech.notification-sound',fa:'صدای اعلان',roman:'sedaaye elaan',en:'notification sound'}],
  ['tech.internet',{id:'tech.internet-speed',fa:'سرعت اینترنت',roman:'sorate internet',en:'internet speed'}],
  ['tech.wifi',{id:'tech.wifi-strength',fa:'قدرت وای فای',roman:'ghodrate vaay faay',en:'Wi-Fi signal strength'}],
  ['tech.username',{id:'tech.login-code',fa:'کد ورود',roman:'kode vorood',en:'login code'}],
  ['tech.password',{id:'tech.two-factor',fa:'تایید دو مرحله‌ای',roman:'taayide do marhalei',en:'two-factor authentication'}],
  ['tech.account',{id:'tech.account-recovery',fa:'بازیابی حساب',roman:'baazyaabiye hesaab',en:'account recovery'}],
  ['tech.settings',{id:'tech.dark-mode',fa:'حالت تاریک',roman:'haalate taarik',en:'dark mode'}],
  ['tech.bluetooth',{id:'tech.paired-device',fa:'دستگاه متصل',roman:'dastgaahe motasel',en:'connected / paired device'}],
  ['tech.update',{id:'tech.system-update',fa:'آپدیت سیستم',roman:'aapdeyte sistem',en:'system update'}],
  ['tech.file',{id:'tech.downloaded-file',fa:'فایل دانلود شده',roman:'faayle daanlod shode',en:'downloaded file'}],
  ['tech.folder',{id:'tech.shared-folder',fa:'پوشه مشترک',roman:'pooshe moshtarak',en:'shared folder'}]
]);
const cards=candidate.map(c=>P.has(c.id)?{...c,...P.get(c.id)}:c);
if(cards.length!==65)throw new Error(`reviewed technology batch must remain 65; found ${cards.length}`);
export const overlapReplacementCount=P.size;
export default cards;
