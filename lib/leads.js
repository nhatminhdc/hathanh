const { getSupabaseConfig, getSupabaseServiceConfig } = require('./env');
const { normalizePhone } = require('./phone');

function getLeadsConfig() {
  const pub = getSupabaseConfig();
  const svc = getSupabaseServiceConfig();
  if (!pub?.url) return null;
  const key = svc?.serviceRoleKey || pub.anonKey;
  if (!key) return null;
  return {
    url: pub.url,
    key,
    table: pub.table || 'leads',
    anonKey: pub.anonKey,
  };
}

function supabaseHeaders(cfg, extra = {}) {
  return {
    apikey: cfg.key,
    Authorization: `Bearer ${cfg.key}`,
    'Content-Type': 'application/json',
    ...extra,
  };
}

function parseSupabaseError(detail) {
  const text = String(detail || '');
  if (text.includes('PGRST205') || text.includes("Could not find the table")) {
    return 'Chưa có bảng leads trên Supabase. Chạy scripts/supabase-leads-setup.sql trong SQL Editor.';
  }
  try {
    const j = JSON.parse(text);
    return j.message || j.hint || text;
  } catch {
    return text.slice(0, 300) || 'Lỗi Supabase';
  }
}

async function checkLeadSubmittedToday(phone) {
  const cfg = getLeadsConfig();
  if (!cfg?.url) return false;

  try {
    const baseUrl = cfg.url.replace(/\/$/, '');
    const res = await fetch(`${baseUrl}/rest/v1/rpc/check_lead_today`, {
      method: 'POST',
      headers: supabaseHeaders(cfg),
      body: JSON.stringify({ input_phone: phone }),
    });

    if (res.ok) {
      const exists = await res.json();
      return exists === true;
    }

    if (res.status === 404) {
      return checkLeadSubmittedTodayFallback(phone, cfg);
    }

    return false;
  } catch {
    return false;
  }
}

async function checkLeadSubmittedTodayFallback(phone, cfg) {
  const normalized = normalizePhone(phone);
  const startOfDay = getVietnamDayStartIso();
  const baseUrl = cfg.url.replace(/\/$/, '');
  const table = cfg.table || 'leads';
  const query = new URLSearchParams({
    select: 'phone',
    phone: `eq.${normalized}`,
    created_at: `gte.${startOfDay}`,
    limit: '1',
  });

  const res = await fetch(`${baseUrl}/rest/v1/${table}?${query}`, {
    headers: supabaseHeaders(cfg),
  });

  if (!res.ok) return false;

  const rows = await res.json();
  return Array.isArray(rows) && rows.length > 0;
}

function getVietnamDayStartIso() {
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Ho_Chi_Minh',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).formatToParts(new Date());

  const y = parts.find(p => p.type === 'year').value;
  const m = parts.find(p => p.type === 'month').value;
  const d = parts.find(p => p.type === 'day').value;
  return `${y}-${m}-${d}T00:00:00+07:00`;
}

async function insertLeadToSupabase(lead) {
  const cfg = getLeadsConfig();
  if (!cfg?.url) {
    throw new Error('Chưa cấu hình Supabase (data/supabase.json hoặc env)');
  }

  const baseUrl = cfg.url.replace(/\/$/, '');
  const table = cfg.table || 'leads';
  const payload = {
    name: lead.name,
    phone: normalizePhone(lead.phone),
    product_id: lead.product_id || null,
    product_name: lead.product_name || null,
    product_price: lead.product_price != null && lead.product_price !== ''
      ? Number(lead.product_price)
      : null,
    note: lead.note || null,
    source: lead.source || 'quick_order',
  };

  const res = await fetch(`${baseUrl}/rest/v1/${table}`, {
    method: 'POST',
    headers: supabaseHeaders(cfg, { Prefer: 'return=representation' }),
    body: JSON.stringify(payload),
  });

  if (!res.ok) {
    const detail = await res.text().catch(() => '');
    throw new Error(parseSupabaseError(detail));
  }

  const rows = await res.json();
  return Array.isArray(rows) ? rows[0] : rows;
}

module.exports = {
  checkLeadSubmittedToday,
  insertLeadToSupabase,
  getVietnamDayStartIso,
  getLeadsConfig,
};
