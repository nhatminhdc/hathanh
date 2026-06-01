#!/usr/bin/env node
const { readDataFromFile, writeToSupabase } = require('../lib/site-store');
const { getSupabaseServiceConfig } = require('../lib/env');

async function main() {
  const cfg = getSupabaseServiceConfig();
  if (!cfg) {
    console.error('Thiếu data/supabase.json hoặc SUPABASE_URL + SUPABASE_SERVICE_ROLE_KEY');
    process.exit(1);
  }
  const data = readDataFromFile();
  await writeToSupabase(cfg, data);
  console.log(`Đã đồng bộ lên Supabase (${cfg.dataBucket || 'site-data'}/main.json)`);
  console.log('Site:', data.site?.name);
}

main().catch((err) => {
  console.error(err.message || err);
  process.exit(1);
});
