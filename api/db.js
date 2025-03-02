// نظام تخزين مؤقت بسيط للبوتات
// ملاحظة: هذا حل مؤقت، في الإنتاج يجب استخدام قاعدة بيانات حقيقية

// كائن لتخزين معلومات البوتات
const botStore = {};

// دالة لتخزين معلومات البوت
exports.saveBot = (botId, data) => {
  botStore[botId] = {
    ...data,
    createdAt: Date.now()
  };
  return botId;
};

// دالة للحصول على معلومات البوت
exports.getBot = (botId) => {
  return botStore[botId] || null;
};

// دالة للتحقق من وجود البوت
exports.botExists = (botId) => {
  return !!botStore[botId];
};

// دالة لحذف البوت
exports.deleteBot = (botId) => {
  if (botStore[botId]) {
    delete botStore[botId];
    return true;
  }
  return false;
};

// دالة للحصول على جميع البوتات
exports.getAllBots = () => {
  return Object.keys(botStore).map(botId => ({
    id: botId,
    ...botStore[botId]
  }));
};

// تنظيف البوتات القديمة (أكثر من 24 ساعة)
setInterval(() => {
  const now = Date.now();
  const expiryTime = 24 * 60 * 60 * 1000; // 24 ساعة
  
  Object.keys(botStore).forEach(botId => {
    const bot = botStore[botId];
    if (now - bot.createdAt > expiryTime) {
      delete botStore[botId];
      console.log(`تم حذف البوت ${botId} بسبب انتهاء الصلاحية`);
    }
  });
}, 60 * 60 * 1000); // تنظيف كل ساعة 