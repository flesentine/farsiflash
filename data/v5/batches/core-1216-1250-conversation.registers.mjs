import reviewedCards from './core-1216-1250-conversation.reviewed.mjs';

const PATCHES = new Map([
  ['conversation.at-work', { formalFa:'سر کار هستم' }],
  ['conversation.in-meeting', { formalFa:'در جلسه هستم' }],
  ['conversation.send-me-email', { formalFa:'برایم ایمیل کن' }],
  ['conversation.send-me-link', { formalFa:'لینکش را بفرست' }],
  ['conversation.can-you-explain', { formalFa:'می‌توانی توضیح بدهی؟' }],
  ['conversation.say-again', { formalFa:'یک بار دیگر بگو' }],
  ['conversation.where-hurts', { formalFa:'کجایت درد می‌کند؟' }],
  ['conversation.it-hurts-here', { formalFa:'اینجا درد می‌کند' }],
  ['conversation.wifi-password', { formalFa:'رمز وای فای چیست؟' }],
  ['conversation.battery-low', { formalFa:'شارژم کم است' }],
  ['conversation.im-free', { formalFa:'وقتم آزاد است' }],
  ['conversation.im-on-my-way', { formalFa:'در راهم' }]
]);

const cards = reviewedCards.map((card) => {
  const patch = PATCHES.get(card.id);
  return patch ? { ...card, ...patch, tags:[...new Set([...(card.tags || []),'register-pair'])] } : card;
});
if (cards.length !== 35) throw new Error(`register-reviewed core-1216-1250 must contain 35 cards; found ${cards.length}`);
for (const id of PATCHES.keys()) if (!reviewedCards.some((card) => card.id === id)) throw new Error(`Step 15 conversation register target not found: ${id}`);
export default cards;
