# Yadea Hà Thành

Website xe điện Yadea chính hãng tại Hà Thành.

## Chạy website (local)

```bash
node server.js
```

Mở: **http://localhost:3001**

## Admin

### Trên production (yadeahathanh.vn)

Admin chạy trực tiếp tại **https://yadeahathanh.vn/admin/**

**Setup tự động (1 lệnh):**

```bash
SUPABASE_SERVICE_ROLE_KEY=eyJ... VERCEL_TOKEN=... node scripts/setup-production-admin.js
```

Lấy **service_role key**: Supabase → Settings → API → service_role → Reveal  
Lấy **Vercel token**: https://vercel.com/account/tokens

Script sẽ: tạo Supabase Storage, upload dữ liệu, set env Vercel, redeploy.

**Env bắt buộc trên Vercel:**

| Biến | Mô tả |
|------|--------|
| `SESSION_SECRET` | Chuỗi ngẫu nhiên ≥32 ký tự |
| `SUPABASE_SERVICE_ROLE_KEY` | Service role key Supabase |
| `SUPABASE_URL` | URL project Supabase |
| `SUPABASE_ANON_KEY` | Anon key Supabase |

### Local

- URL: **http://localhost:3001/admin/**
- Đăng nhập mặc định: `admin` / `admin`
- Dữ liệu lưu vào `data/site.json` (mặc định local)
- **Không** copy `data/supabase.json` từ dự án Yadea Tân Bình cũ — tạo Supabase project mới cho Hà Thành
- Production (Vercel): cấu hình env Supabase **mới**, rồi `node scripts/sync-site-to-supabase.js`

### Supabase — bảng `leads` (form liên hệ / đặt hàng)

1. Tạo `data/supabase.json` (copy từ `data/supabase.example.json`) với `url`, `anonKey`, `serviceRoleKey`, `table: "leads"`.
2. Chạy SQL một lần trong [Supabase SQL Editor](https://supabase.com/dashboard/project/vzdyqdzfzjxbunidzqrb/sql/new): dán nội dung `scripts/supabase-leads-setup.sql` → **Run**.
3. Tạo Storage: `node scripts/setup-supabase-storage.js` (bucket `uploads` cho logo/ảnh).
4. Kiểm tra: `node scripts/setup-supabase-leads.js` (in `✅ Bảng public.leads đã sẵn sàng`).
4. Form web gửi qua `POST /api/submit-lead` → lưu vào `public.leads` (trang Liên hệ + popup đặt hàng).

**Env Vercel (leads):** `SUPABASE_URL`, `SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`, `SUPABASE_TABLE=leads`

### Telegram (thông báo đơn hàng)

1. Tạo `data/telegram.json` từ `data/telegram.example.json` (`botToken`, `chatId`).
2. Bot phải được **thêm vào group** và có quyền gửi tin.
3. Test: `node scripts/test-telegram.js`
4. Mỗi lần khách bấm **MUA NGAY** / gửi form liên hệ → tin nhắn gửi vào group (song song với lưu Supabase).

**Env Vercel:** `TELEGRAM_BOT_TOKEN`, `TELEGRAM_CHAT_ID`
