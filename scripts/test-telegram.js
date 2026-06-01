#!/usr/bin/env node
/**
 * Gửi tin nhắn test tới group Telegram đã cấu hình
 * node scripts/test-telegram.js
 */
const { sendTelegramMessage, formatLeadTelegramMessage } = require('../lib/telegram');
const { getTelegramConfig } = require('../lib/env');

async function main() {
  const cfg = getTelegramConfig();
  if (!cfg) {
    console.error('❌ Chưa cấu hình Telegram (data/telegram.json hoặc env)');
    process.exit(1);
  }

  console.log(`📤 Gửi test tới chat_id: ${cfg.chatId}`);

  const sample = formatLeadTelegramMessage({
    name: 'Khách test Yadea',
    phone: '0901234567',
    product_name: 'Xe Máy Điện YADEA (test)',
    product_price: 15990000,
    product_price_label: '15.990.000 đ',
    note: 'Tin nhắn kiểm tra bot — Yadea Tân Bình',
  });

  const text = sample + '\n\n<i>✅ Bot hoạt động · ' + new Date().toLocaleString('vi-VN', { timeZone: 'Asia/Ho_Chi_Minh' }) + '</i>';

  await sendTelegramMessage(text);
  console.log('✅ Đã gửi tin nhắn test thành công!');
}

main().catch(err => {
  console.error('❌', err.message);
  try {
    const j = JSON.parse(err.message);
    if (j.description) console.error('   Telegram:', j.description);
  } catch { /* ignore */ }
  process.exit(1);
});
