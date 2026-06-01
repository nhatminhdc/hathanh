#!/usr/bin/env node
/**
 * Tạo bảng leads + RPC trên Supabase project mới.
 *
 *   node scripts/setup-supabase-leads.js
 *
 * Hoặc nếu có mật khẩu DB (Settings → Database → Connection string):
 *   DATABASE_URL="postgresql://postgres.[ref]:[PASSWORD]@...:6543/postgres" node scripts/setup-supabase-leads.js
 */
const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const ROOT = path.join(__dirname, '..');
const SQL_FILE = path.join(__dirname, 'supabase-leads-setup.sql');
const SUPABASE_JSON = path.join(ROOT, 'data', 'supabase.json');

function loadCfg() {
  if (!fs.existsSync(SUPABASE_JSON)) {
    console.error('Thiếu data/supabase.json (url, anonKey, serviceRoleKey)');
    process.exit(1);
  }
  return JSON.parse(fs.readFileSync(SUPABASE_JSON, 'utf8'));
}

async function verifyTable(cfg) {
  const base = cfg.url.replace(/\/$/, '');
  const res = await fetch(`${base}/rest/v1/leads?select=id&limit=1`, {
    headers: {
      apikey: cfg.anonKey,
      Authorization: `Bearer ${cfg.anonKey}`,
    },
  });
  return res.ok;
}

async function runViaPg(dbUrl) {
  let pg;
  try {
    pg = require('pg');
  } catch {
    return false;
  }
  const sql = fs.readFileSync(SQL_FILE, 'utf8');
  const client = new pg.Client({
    connectionString: dbUrl,
    ssl: { rejectUnauthorized: false },
  });
  await client.connect();
  await client.query(sql);
  await client.end();
  return true;
}

async function runViaPsql(dbUrl) {
  try {
    execSync(`psql "${dbUrl}" -v ON_ERROR_STOP=1 -f "${SQL_FILE}"`, {
      stdio: 'inherit',
      env: process.env,
    });
    return true;
  } catch {
    return false;
  }
}

async function runViaHttpSql(cfg) {
  const sql = fs.readFileSync(SQL_FILE, 'utf8');
  const base = cfg.url.replace(/\/$/, '');
  const endpoints = ['/pg/v1/query', '/pg/query'];
  for (const ep of endpoints) {
    try {
      const res = await fetch(`${base}${ep}`, {
        method: 'POST',
        headers: {
          apikey: cfg.serviceRoleKey,
          Authorization: `Bearer ${cfg.serviceRoleKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ query: sql }),
      });
      if (res.ok) return true;
    } catch {
      /* try next */
    }
  }
  return false;
}

function printManualSteps(ref) {
  const sql = fs.readFileSync(SQL_FILE, 'utf8');
  console.log('\n⚠️  Chưa chạy được SQL tự động. Làm thủ công:');
  console.log(`   1. Mở https://supabase.com/dashboard/project/${ref}/sql/new`);
  console.log('   2. Dán nội dung scripts/supabase-leads-setup.sql → Run');
  console.log('   3. Chạy lại: node scripts/setup-supabase-leads.js\n');
  console.log('--- SQL ---\n');
  console.log(sql);
}

async function main() {
  const cfg = loadCfg();
  const ref = cfg.url.match(/https:\/\/([^.]+)\.supabase\.co/)?.[1] || 'your-project';

  if (await verifyTable(cfg)) {
    console.log('✅ Bảng public.leads đã sẵn sàng.');
    return;
  }

  if (await runViaHttpSql(cfg)) {
    console.log('✅ Đã tạo bảng leads (HTTP SQL).');
  }

  const dbUrl = process.env.DATABASE_URL || process.env.SUPABASE_DB_URL;
  if (dbUrl) {
    if (await runViaPg(dbUrl)) {
      console.log('✅ Đã tạo bảng leads (pg).');
    } else if (await runViaPsql(dbUrl)) {
      console.log('✅ Đã tạo bảng leads (psql).');
    }
  }

  if (await verifyTable(cfg)) {
    console.log('✅ Bảng public.leads đã sẵn sàng.');
    return;
  }

  printManualSteps(ref);
  process.exit(1);
}

main().catch((err) => {
  console.error(err.message || err);
  process.exit(1);
});
