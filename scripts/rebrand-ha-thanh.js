#!/usr/bin/env node
const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..');

const REPLACEMENTS = [
  ['YADEA Tân Bình', 'YADEA Hà Thành'],
  ['Yadea Tân Bình', 'Yadea Hà Thành'],
  ['yadeatanbinh', 'yadeahathanh'],
  ['yadea-tan-binh', 'yadea-ha-thanh'],
  ['Tân Bình, TP.HCM', 'Hà Thành'],
  ['tại Tân Bình, TP.HCM', 'tại Hà Thành'],
  ['Website xe điện Yadea chính hãng tại Tân Bình, TP.HCM', 'Website xe điện Yadea chính hãng – Hà Thành'],
];

function rebrandText(text) {
  if (typeof text !== 'string') return text;
  if (/^https?:\/\//i.test(text)) return text;
  let t = text;
  for (const [from, to] of REPLACEMENTS) {
    t = t.split(from).join(to);
  }
  return t;
}

function walk(value) {
  if (Array.isArray(value)) return value.map(walk);
  if (value && typeof value === 'object') {
    const out = {};
    for (const [key, val] of Object.entries(value)) out[key] = walk(val);
    return out;
  }
  return rebrandText(value);
}

const siteFile = path.join(ROOT, 'data', 'site.json');
const data = JSON.parse(fs.readFileSync(siteFile, 'utf8'));
fs.writeFileSync(siteFile, JSON.stringify(walk(data), null, 2) + '\n');
console.log('Updated', siteFile);

const TEXT_FILES = [
  'README.md',
  'server.js',
  'start.command',
  'package.json',
  'public/index.html',
  'public/san-pham.html',
  'public/lien-he.html',
  'public/css/styles.css',
  'public/admin/index.html',
  'public/js/admin.js',
  'lib/telegram.js',
  'api/test-telegram.js',
  'scripts/rebrand-keywords.js',
  'scripts/setup-production-admin.js',
  'scripts/setup-vercel-env.sh',
  'scripts/test-telegram.js',
  'scripts/push-telegram-env.js',
];

for (const rel of TEXT_FILES) {
  const file = path.join(ROOT, rel);
  if (!fs.existsSync(file)) continue;
  const raw = fs.readFileSync(file, 'utf8');
  const next = rebrandText(raw);
  if (next !== raw) {
    fs.writeFileSync(file, next);
    console.log('Updated', rel);
  }
}
