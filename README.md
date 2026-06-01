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
