const { getSupabaseConfig } = require('../lib/env');
const { parseBody, sendJson } = require('../lib/http');
const { formatLeadTelegramMessage, sendTelegramMessage } = require('../lib/telegram');

async function insertLeadToSupabase(lead) {
  const cfg = getSupabaseConfig();
  if (!cfg?.url || !cfg?.anonKey) {
    throw new Error('Chưa cấu hình Supabase');
  }

  const baseUrl = cfg.url.replace(/\/$/, '');
  const table = cfg.table || 'leads';
  const res = await fetch(`${baseUrl}/rest/v1/${table}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      apikey: cfg.anonKey,
      Authorization: `Bearer ${cfg.anonKey}`,
      Prefer: 'return=minimal',
    },
    body: JSON.stringify(lead),
  });

  if (!res.ok) {
    const detail = await res.text().catch(() => '');
    throw new Error(detail || `Supabase HTTP ${res.status}`);
  }
}

module.exports = async (req, res) => {
  if (req.method !== 'POST') {
    sendJson(res, 405, { error: 'Method not allowed' });
    return;
  }

  try {
    const body = await parseBody(req);
    const name = String(body.name || '').trim();
    const phone = String(body.phone || '').trim();
    const product_id = String(body.product_id || '').trim();
    const product_name = String(body.product_name || '').trim();
    const product_price = body.product_price;
    const product_price_label = String(body.product_price_label || '').trim();
    const note = String(body.note || '').trim();

    if (!name || !phone) {
      sendJson(res, 400, { error: 'Thiếu họ tên hoặc số điện thoại' });
      return;
    }

    const lead = {
      name,
      phone,
      product_id: product_id || undefined,
      product_name,
      product_price: product_price || undefined,
      note,
      source: body.source || 'quick_order',
    };

    const results = await Promise.allSettled([
      insertLeadToSupabase(lead),
      sendTelegramMessage(formatLeadTelegramMessage({
        name,
        phone,
        product_name,
        product_price,
        product_price_label,
        note,
      })),
    ]);

    const supabaseOk = results[0].status === 'fulfilled';
    const telegramOk = results[1].status === 'fulfilled';

    if (!supabaseOk && !telegramOk) {
      sendJson(res, 500, {
        error: 'Không gửi được đơn hàng',
        supabase: results[0].reason?.message,
        telegram: results[1].reason?.message,
      });
      return;
    }

    sendJson(res, 200, {
      success: true,
      supabase: supabaseOk,
      telegram: telegramOk,
    });
  } catch (err) {
    sendJson(res, 500, { error: err.message || 'Gửi đơn hàng thất bại' });
  }
};
