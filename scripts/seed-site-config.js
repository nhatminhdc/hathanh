#!/usr/bin/env node
const { readDataFromFile, writeToSupabase } = require('../lib/site-store');
const { getSupabaseServiceConfig } = require('../lib/env');

async function main() {
  const cfg = getSupabaseServiceConfig();
  if (!cfg?.url || !cfg?.serviceRoleKey) {
    console.error('❌ Thiếu SUPABASE_SERVICE_ROLE_KEY');
    process.exit(1);
  }

  const data = readDataFromFile();
  await writeToSupabase(cfg, data);
  console.log(`✅ Đã seed ${data.products?.length || 0} sản phẩm lên Supabase Storage`);
}

main().catch(err => {
  console.error('❌', err.message);
  process.exit(1);
});
