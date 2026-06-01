const fs = require('fs');
const path = require('path');
const { getSupabaseServiceConfig } = require('./env');

const DATA_FILE = path.join(__dirname, '..', 'data', 'site.json');
const DATA_OBJECT = 'main.json';

function readDataFromFile() {
  return JSON.parse(fs.readFileSync(DATA_FILE, 'utf8'));
}

function writeDataToFile(data) {
  fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2) + '\n', 'utf8');
}

function supabaseHeaders(cfg, extra = {}) {
  return {
    apikey: cfg.serviceRoleKey,
    Authorization: `Bearer ${cfg.serviceRoleKey}`,
    ...extra,
  };
}

function getDataBucket(cfg) {
  return cfg.dataBucket || 'site-data';
}

async function ensureBucket(cfg, bucket, isPublic = false) {
  const baseUrl = cfg.url.replace(/\/$/, '');
  const res = await fetch(`${baseUrl}/storage/v1/bucket`, {
    method: 'POST',
    headers: supabaseHeaders(cfg, { 'Content-Type': 'application/json' }),
    body: JSON.stringify({ id: bucket, name: bucket, public: isPublic }),
  });
  if (res.ok || res.status === 409) return;
  const err = await res.text();
  if (!err.toLowerCase().includes('already exists')) {
    throw new Error(`Tạo bucket "${bucket}" thất bại (${res.status}): ${err.slice(0, 200)}`);
  }
}

async function readFromSupabase(cfg) {
  const baseUrl = cfg.url.replace(/\/$/, '');
  const bucket = getDataBucket(cfg);
  await ensureBucket(cfg, bucket, false);

  const res = await fetch(`${baseUrl}/storage/v1/object/${bucket}/${DATA_OBJECT}`, {
    headers: supabaseHeaders(cfg),
  });

  if (res.ok) {
    return res.json();
  }

  if (res.status === 404) {
    const seed = readDataFromFile();
    await writeToSupabase(cfg, seed);
    return seed;
  }

  const err = await res.text();
  throw new Error(`Supabase read failed (${res.status}): ${err.slice(0, 200)}`);
}

async function writeToSupabase(cfg, data) {
  const baseUrl = cfg.url.replace(/\/$/, '');
  const bucket = getDataBucket(cfg);
  await ensureBucket(cfg, bucket, false);

  const body = JSON.stringify(data, null, 2);
  const res = await fetch(`${baseUrl}/storage/v1/object/${bucket}/${DATA_OBJECT}`, {
    method: 'POST',
    headers: supabaseHeaders(cfg, {
      'Content-Type': 'application/json',
      'x-upsert': 'true',
    }),
    body,
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Supabase write failed (${res.status}): ${err.slice(0, 200)}`);
  }
}

function useSupabaseStore() {
  const cfg = getSupabaseServiceConfig();
  if (!(cfg?.url && cfg?.serviceRoleKey)) return false;
  // Local: dùng data/site.json (README). Production Vercel: Supabase.
  if (process.env.VERCEL === '1') return true;
  if (process.env.USE_SUPABASE_DATA === '1') return true;
  return false;
}

async function readData() {
  if (!useSupabaseStore()) return readDataFromFile();
  const cfg = getSupabaseServiceConfig();
  return readFromSupabase(cfg);
}

async function writeData(data) {
  if (!useSupabaseStore()) {
    writeDataToFile(data);
    return;
  }
  const cfg = getSupabaseServiceConfig();
  if (cfg?.url && cfg?.serviceRoleKey) {
    await writeToSupabase(cfg, data);
    return;
  }
  if (process.env.VERCEL === '1') {
    throw new Error('Chưa cấu hình SUPABASE_SERVICE_ROLE_KEY trên Vercel. Admin không thể lưu dữ liệu.');
  }
  writeDataToFile(data);
}

function readDataSync() {
  return readDataFromFile();
}

function writeDataSync(data) {
  writeDataToFile(data);
}

module.exports = {
  DATA_FILE,
  useSupabaseStore,
  readData,
  writeData,
  readDataSync,
  writeDataSync,
  readDataFromFile,
  writeDataToFile,
  ensureBucket,
  writeToSupabase,
};
