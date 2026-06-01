#!/usr/bin/env node
/**
 * Tạo bucket Storage trên Supabase (uploads + site-data).
 *   node scripts/setup-supabase-storage.js
 */
const path = require('path');
const { getSupabaseServiceConfig } = require('../lib/env');
const { ensureBucket } = require('../lib/site-store');

async function main() {
  const cfg = getSupabaseServiceConfig();
  if (!cfg?.url || !cfg?.serviceRoleKey) {
    console.error('Thiếu data/supabase.json (url, serviceRoleKey)');
    process.exit(1);
  }

  const uploads = cfg.storageBucket || 'uploads';
  const siteData = cfg.dataBucket || 'site-data';

  await ensureBucket(cfg, uploads, true);
  console.log(`✅ Bucket "${uploads}" (public — logo, banner, ảnh)`);

  await ensureBucket(cfg, siteData, false);
  console.log(`✅ Bucket "${siteData}" (private — dữ liệu admin)`);
}

main().catch((err) => {
  console.error('❌', err.message || err);
  process.exit(1);
});
