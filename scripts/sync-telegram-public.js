#!/usr/bin/env node
/** Copy botToken + chatId từ data/telegram.json → lib/telegram-public.js */
const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..');
const src = path.join(ROOT, 'data', 'telegram.json');
const dest = path.join(ROOT, 'lib', 'telegram-public.js');

if (!fs.existsSync(src)) {
  console.error('Thiếu data/telegram.json');
  process.exit(1);
}

const tg = JSON.parse(fs.readFileSync(src, 'utf8'));
const body = {
  botToken: tg.botToken,
  chatId: String(tg.chatId),
};

const js = `/** Telegram bot — bundle với serverless production (form → group). */
module.exports = ${JSON.stringify(body, null, 2)};
`;

fs.writeFileSync(dest, js);
console.log('✅ Đã ghi lib/telegram-public.js');
