// معالج حالة البوت
const axios = require('axios');
const db = require('./db');

module.exports = async (req, res) => {
  try {
    // التحقق من طريقة الطلب
    if (req.method !== 'GET') {
      return res.status(405).json({ error: 'Method not allowed' });
    }

    // استخراج معرف البوت من المسار
    const botId = req.query.botId;
    
    // إذا تم تحديد معرف البوت، عرض معلومات البوت المحدد
    if (botId) {
      const bot = db.getBot(botId);
      if (!bot) {
        return res.status(404).json({ error: 'Bot not found' });
      }
      
      try {
        // التحقق من حالة الويبهوك
        const webhookResponse = await axios.get(`https://api.telegram.org/bot${bot.telegramToken}/getWebhookInfo`);
        
        // إرسال استجابة ناجحة
        return res.status(200).json({
          success: true,
          botId,
          botInfo: bot.botInfo,
          webhookInfo: webhookResponse.data.result,
          createdAt: bot.createdAt,
          uptime: Date.now() - bot.createdAt
        });
      } catch (error) {
        return res.status(200).json({
          success: true,
          botId,
          botInfo: bot.botInfo,
          error: 'Failed to get webhook info',
          createdAt: bot.createdAt,
          uptime: Date.now() - bot.createdAt
        });
      }
    }
    
    // إذا لم يتم تحديد معرف البوت، عرض قائمة بجميع البوتات
    const bots = db.getAllBots();
    
    return res.status(200).json({
      success: true,
      totalBots: bots.length,
      bots: bots.map(bot => ({
        id: bot.id,
        name: bot.botInfo?.first_name,
        username: bot.botInfo?.username,
        createdAt: bot.createdAt,
        uptime: Date.now() - bot.createdAt
      }))
    });
  } catch (error) {
    console.error('Status error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}; 