#!/usr/bin/env node
/** Cập nhật TELEGRAM_CHAT_ID trên Vercel + gửi tin test */
const fs = require('fs');
const path = require('path');
const { sendTelegramMessage } = require('../lib/telegram');

const ROOT = path.join(__dirname, '..');
const chatId = process.argv[2] || process.env.TELEGRAM_CHAT_ID || '-5197420416';
const vercelToken = process.env.VERCEL_TOKEN;

async function updateVercel() {
  const meta = JSON.parse(fs.readFileSync(path.join(ROOT, '.vercel/repo.json'), 'utf8'));
  const projectId = meta.projects[0].id;
  const teamId = meta.projects[0].orgId;
  if (!vercelToken) {
    console.log('⚠️  Bỏ qua Vercel (thiếu VERCEL_TOKEN)');
    return;
  }
  for (const target of ['production', 'preview', 'development']) {
    const res = await fetch(`https://api.vercel.com/v10/projects/${projectId}/env?upsert=true&teamId=${teamId}`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${vercelToken}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ key: 'TELEGRAM_CHAT_ID', value: String(chatId), type: 'plain', target: [target] }),
    });
    console.log(`Vercel ${target}:`, res.ok ? 'ok' : await res.text());
  }
}

async function main() {
  process.env.TELEGRAM_CHAT_ID = String(chatId);
  const tg = JSON.parse(fs.readFileSync(path.join(ROOT, 'data/telegram.json'), 'utf8'));
  tg.chatId = String(chatId);
  fs.writeFileSync(path.join(ROOT, 'data/telegram.json'), JSON.stringify(tg, null, 2) + '\n');

  await updateVercel();
  await sendTelegramMessage(
    '🛵 <b>Yadea Tân Bình</b>\n\n✅ Cấu hình Telegram production đã cập nhật.\nĐơn hàng từ website sẽ gửi vào group này.'
  );
  console.log('✅ Đã gửi tin test tới', chatId);
}

main().catch(err => {
  console.error('❌', err.message);
  process.exit(1);
});
