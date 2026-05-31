#!/usr/bin/env node
/**
 * Thiết lập admin production — không cần chạy SQL thủ công
 *
 *   SUPABASE_SERVICE_ROLE_KEY=eyJ... VERCEL_TOKEN=... node scripts/setup-production-admin.js
 *
 * Hoặc thêm "serviceRoleKey" vào data/supabase.json (gitignored)
 */
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const { readDataFromFile, ensureBucket, writeToSupabase } = require('../lib/site-store');
const { saveUploadedImage } = require('../lib/uploads');

const ROOT = path.join(__dirname, '..');
const SUPABASE_JSON = path.join(ROOT, 'data', 'supabase.json');
const TELEGRAM_JSON = path.join(ROOT, 'data', 'telegram.json');
const VERCEL_PROJECT = path.join(ROOT, '.vercel', 'repo.json');

function readJson(file) {
  if (!fs.existsSync(file)) return null;
  return JSON.parse(fs.readFileSync(file, 'utf8'));
}

function loadConfig() {
  const supabase = readJson(SUPABASE_JSON) || {};
  const telegram = readJson(TELEGRAM_JSON) || {};
  const url = process.env.SUPABASE_URL || supabase.url;
  const anonKey = process.env.SUPABASE_ANON_KEY || supabase.anonKey;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY || supabase.serviceRoleKey;
  const vercelToken = process.env.VERCEL_TOKEN;
  const sessionSecret = process.env.SESSION_SECRET || crypto.randomBytes(32).toString('hex');

  if (!url || !serviceRoleKey) {
    console.error('\n❌ Thiếu SUPABASE_SERVICE_ROLE_KEY');
    console.error('   Supabase → Project Settings → API → service_role → Reveal');
    console.error('   Thêm vào data/supabase.json hoặc chạy:');
    console.error('   SUPABASE_SERVICE_ROLE_KEY=eyJ... node scripts/setup-production-admin.js\n');
    process.exit(1);
  }

  return {
    url,
    anonKey,
    serviceRoleKey,
    vercelToken,
    sessionSecret,
    storageBucket: supabase.storageBucket || 'uploads',
    dataBucket: supabase.dataBucket || 'site-data',
    telegram,
  };
}

async function setupStorage(cfg) {
  console.log('📦 Tạo Supabase Storage buckets...');
  await ensureBucket(cfg, cfg.dataBucket, false);
  console.log(`   ✓ ${cfg.dataBucket} (dữ liệu admin)`);
  await ensureBucket(cfg, cfg.storageBucket, true);
  console.log(`   ✓ ${cfg.storageBucket} (ảnh upload)`);
}

async function seedData(cfg) {
  console.log('📤 Upload site.json lên Supabase...');
  const data = readDataFromFile();
  await writeToSupabase(cfg, data);
  console.log(`   ✓ ${data.products?.length || 0} sản phẩm`);
}

async function setVercelEnv(cfg) {
  const vercelMeta = readJson(VERCEL_PROJECT);
  const projectId = vercelMeta?.projects?.[0]?.id;
  const teamId = vercelMeta?.projects?.[0]?.orgId;

  const vars = [
    { key: 'SESSION_SECRET', value: cfg.sessionSecret, type: 'encrypted' },
    { key: 'SUPABASE_SERVICE_ROLE_KEY', value: cfg.serviceRoleKey, type: 'encrypted' },
    { key: 'SUPABASE_URL', value: cfg.url, type: 'plain' },
    { key: 'SUPABASE_ANON_KEY', value: cfg.anonKey, type: 'encrypted' },
    { key: 'SUPABASE_STORAGE_BUCKET', value: cfg.storageBucket, type: 'plain' },
    { key: 'SUPABASE_DATA_BUCKET', value: cfg.dataBucket, type: 'plain' },
  ];

  if (cfg.telegram?.botToken) {
    vars.push({ key: 'TELEGRAM_BOT_TOKEN', value: cfg.telegram.botToken, type: 'encrypted' });
    vars.push({ key: 'TELEGRAM_CHAT_ID', value: cfg.telegram.chatId, type: 'plain' });
  }

  if (!cfg.vercelToken || !projectId) {
    console.log('\n⚠️  Thêm env vars trên Vercel Dashboard → Settings → Environment Variables:\n');
    vars.forEach(v => console.log(`   ${v.key}=${v.key === 'SESSION_SECRET' ? cfg.sessionSecret : v.key.includes('KEY') ? '(giá trị bí mật)' : v.value}`));
    return false;
  }

  console.log('\n🚀 Cập nhật Vercel env vars...');
  for (const envVar of vars) {
    if (!envVar.value) continue;
    for (const target of ['production', 'preview', 'development']) {
      await fetch(`https://api.vercel.com/v10/projects/${projectId}/env?upsert=true${teamId ? `&teamId=${teamId}` : ''}`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${cfg.vercelToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          key: envVar.key,
          value: envVar.value,
          type: envVar.type,
          target: [target],
        }),
      });
    }
    console.log(`   ✓ ${envVar.key}`);
  }
  return true;
}

async function redeploy(cfg) {
  if (!cfg.vercelToken) {
    console.log('\nℹ️  Redeploy: Vercel Dashboard → Deployments → Redeploy');
    return;
  }

  const vercelMeta = readJson(VERCEL_PROJECT);
  const projectId = vercelMeta?.projects?.[0]?.id;
  const teamId = vercelMeta?.projects?.[0]?.orgId;

  console.log('\n🔄 Redeploy production...');
  const res = await fetch(`https://api.vercel.com/v13/deployments${teamId ? `?teamId=${teamId}` : ''}`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${cfg.vercelToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      name: 'yadeatanbinh',
      project: projectId,
      target: 'production',
      gitSource: { type: 'github', repo: 'Yadeatanbinh', ref: 'main', org: 'nhatminhdc' },
    }),
  });

  if (res.ok) {
    const data = await res.json();
    console.log(`✅ Deploy: https://${data.url || 'yadeatanbinh.vercel.app'}`);
  } else {
    console.log('ℹ️  Redeploy thủ công trên Vercel Dashboard');
  }
}

function saveLocalSecrets(cfg) {
  const file = readJson(SUPABASE_JSON) || {};
  let changed = false;
  if (!file.serviceRoleKey) {
    file.serviceRoleKey = cfg.serviceRoleKey;
    changed = true;
  }
  if (!file.dataBucket) {
    file.dataBucket = cfg.dataBucket;
    changed = true;
  }
  if (changed) {
    fs.writeFileSync(SUPABASE_JSON, JSON.stringify(file, null, 2) + '\n');
    console.log('✅ Đã lưu serviceRoleKey vào data/supabase.json (local)');
  }
}

async function main() {
  console.log('\n🛵 Yadea — Setup admin production\n');
  const cfg = loadConfig();

  await setupStorage(cfg);
  await seedData(cfg);
  saveLocalSecrets(cfg);
  await setVercelEnv(cfg);
  await redeploy(cfg);

  console.log('\n✅ Xong! Vào https://yadeatanbinh.vn/admin/');
  console.log('   Đăng nhập: admin / admin\n');
}

main().catch(err => {
  console.error('\n❌', err.message);
  process.exit(1);
});
