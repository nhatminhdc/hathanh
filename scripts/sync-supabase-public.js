#!/usr/bin/env node
/** Copy url + anonKey từ data/supabase.json → data/supabase.public.json (để deploy Vercel) */
const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..');
const src = path.join(ROOT, 'data', 'supabase.json');
const dest = path.join(ROOT, 'data', 'supabase.public.json');

if (!fs.existsSync(src)) {
  console.error('Thiếu data/supabase.json');
  process.exit(1);
}

const cfg = JSON.parse(fs.readFileSync(src, 'utf8'));
const pub = {
  url: cfg.url,
  anonKey: cfg.anonKey,
  table: cfg.table || 'leads',
};

const jsDest = path.join(ROOT, 'lib', 'supabase-public.js');
const jsBody = `/** Anon config — bundle với serverless (form production). Không chứa service_role. */
module.exports = ${JSON.stringify(pub, null, 2)};
`;

fs.writeFileSync(dest, JSON.stringify(pub, null, 2) + '\n');
fs.writeFileSync(jsDest, jsBody);
console.log('✅ Đã ghi data/supabase.public.json và lib/supabase-public.js');
