// معالج إعداد البوت
const axios = require('axios');
const db = require('./db');

module.exports = async (req, res) => {
  try {
    // التحقق من طريقة الطلب
    if (req.method !== 'POST') {
      return res.status(405).json({ error: 'Method not allowed' });
    }

    // استخراج معلومات البوت
    const { telegramToken, geminiToken, systemInstruction } = req.body;
    
    if (!telegramToken || !geminiToken) {
      return res.status(400).json({ error: 'Telegram token and Gemini token are required' });
    }

    // التحقق من صحة توكن تليجرام
    try {
      const telegramResponse = await axios.get(`https://api.telegram.org/bot${telegramToken}/getMe`);
      
      if (!telegramResponse.data.ok) {
        return res.status(400).json({ error: 'Invalid Telegram token' });
      }
      
      const botInfo = telegramResponse.data.result;
      
      // إنشاء معرف فريد للبوت
      const botId = Date.now().toString();
      
      // حفظ معلومات البوت في نظام التخزين
      db.saveBot(botId, {
        telegramToken,
        geminiToken,
        systemInstruction: systemInstruction || 'أنت مساعد مفيد.',
        botInfo,
        createdAt: Date.now()
      });
      
      // إعداد الويبهوك
      const webhookUrl = `${req.headers.origin}/api/webhook?botId=${botId}`;
      
      await axios.post(`https://api.telegram.org/bot${telegramToken}/setWebhook`, {
        url: webhookUrl,
        allowed_updates: ["message", "edited_message", "callback_query"]
      });
      
      // إرسال استجابة ناجحة
      return res.status(200).json({
        success: true,
        botId,
        botInfo,
        webhookUrl
      });
    } catch (error) {
      console.error('Error verifying Telegram token:', error);
      return res.status(400).json({ error: 'Invalid Telegram token or connection error' });
    }
  } catch (error) {
    console.error('Setup error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}; 