const { parseBody, sendJson } = require('../lib/http');
const { sendTelegramMessage, formatLeadTelegramMessage } = require('../lib/telegram');
const { getTelegramConfig } = require('../lib/env');

module.exports = async (req, res) => {
  if (req.method !== 'POST') {
    sendJson(res, 405, { error: 'Method not allowed' });
    return;
  }

  const secret = process.env.TELEGRAM_TEST_SECRET || process.env.SESSION_SECRET;
  const auth = req.headers['x-test-secret'] || req.headers.authorization?.replace(/^Bearer\s+/i, '');
  if (!secret || auth !== secret) {
    sendJson(res, 401, { error: 'Unauthorized' });
    return;
  }

  const cfg = getTelegramConfig();
  if (!cfg) {
    sendJson(res, 500, { error: 'Chưa cấu hình TELEGRAM_BOT_TOKEN / TELEGRAM_CHAT_ID' });
    return;
  }

  try {
    const body = await parseBody(req);
    const text = body.text || formatLeadTelegramMessage({
      name: 'Test online',
      phone: '0900000000',
      product_name: 'Yadea Hà Thành — test production',
      product_price_label: '—',
      note: body.note || 'Kiểm tra gửi group Telegram từ Vercel',
    }) + `\n\n<i>🌐 Production · ${new Date().toISOString()}</i>`;

    await sendTelegramMessage(text);
    sendJson(res, 200, { success: true, chatId: cfg.chatId });
  } catch (err) {
    let detail = err.message;
    try {
      const j = JSON.parse(err.message);
      if (j.description) detail = j.description;
    } catch { /* ignore */ }
    sendJson(res, 500, { error: detail });
  }
};
