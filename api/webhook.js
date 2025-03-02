// معالج الويبهوك لتليجرام
const axios = require('axios');
const db = require('./db');

module.exports = async (req, res) => {
  try {
    // التحقق من طريقة الطلب
    if (req.method !== 'POST') {
      return res.status(405).json({ error: 'Method not allowed' });
    }

    // استخراج معرف البوت من المسار
    const botId = req.query.botId;
    if (!botId) {
      return res.status(400).json({ error: 'Bot ID is required' });
    }

    // الحصول على معلومات البوت من نظام التخزين
    const bot = db.getBot(botId);
    if (!bot) {
      return res.status(404).json({ error: 'Bot not found' });
    }

    // سجل الطلب للتصحيح
    console.log(`Received webhook request for bot ${botId}`);
    console.log('Request body:', JSON.stringify(req.body));

    // استخراج معلومات التحديث
    const update = req.body;
    if (!update || !update.message) {
      return res.status(200).end(); // تجاهل التحديثات غير المدعومة
    }

    // استخراج معلومات الرسالة
    const message = update.message;
    const chatId = message.chat.id;
    const userId = message.from.id;
    const messageText = message.text || '';

    // إرسال إشعار بالكتابة
    await axios.post(`https://api.telegram.org/bot${bot.telegramToken}/sendChatAction`, {
      chat_id: chatId,
      action: 'typing'
    });

    // معالجة الرسالة باستخدام Gemini API
    let responseText = '';
    try {
      // استدعاء Gemini API
      const geminiResponse = await axios.post(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent?key=${bot.geminiToken}`,
        {
          contents: [{
            parts: [{
              text: `${bot.systemInstruction || 'أنت مساعد مفيد.'}\n\nرسالة المستخدم: ${messageText}`
            }]
          }],
          generationConfig: {
            temperature: 0.7,
            maxOutputTokens: 2048
          }
        }
      );

      // استخراج النص من الاستجابة
      responseText = geminiResponse.data.candidates[0].content.parts[0].text;
    } catch (error) {
      console.error('Error calling Gemini API:', error);
      responseText = 'عذراً، حدث خطأ أثناء معالجة رسالتك. يرجى المحاولة مرة أخرى لاحقاً.';
    }

    // إرسال الرد إلى المستخدم
    await axios.post(`https://api.telegram.org/bot${bot.telegramToken}/sendMessage`, {
      chat_id: chatId,
      text: responseText,
      parse_mode: 'Markdown'
    });

    // إرسال استجابة ناجحة
    return res.status(200).json({ success: true });
  } catch (error) {
    console.error('Webhook error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}; 