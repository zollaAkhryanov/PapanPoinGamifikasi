# Dokumentasi Backend (Anggota 2 — Backend Specialist)

Stack: **Express + TypeScript**, **Supabase (Postgres)**, JWT (HS256) + bcrypt, validasi **zod**. Deploy: **Vercel serverless** (`api/index.ts` → `server/app.ts`).

## Menjalankan
```bash
npm install --legacy-peer-deps
cp .env.example .env          # isi SUPABASE_*, JWT_SECRET (boleh kosong di dev -> data demo di memori)
npm run dev:api               # API di http://localhost:8787/api
npm run dev                   # frontend :3000, /api di-proxy ke :8787 (set VITE_API_BASE_URL=/api)
npm test                      # 21 tes integrasi API
```
Akun demo (mode memori & `supabase/seed.sql`): `budi.mentor / mentor123`, `raka.pratama / password123`.

## Aturan bisnis
- **Total poin = SUM(point_entries.points)**; tidak disimpan di kolom → tidak bisa tidak sinkron.
- **Level**: memakai `src/utils/levelUtils.ts` yang sama dengan frontend (Perintis 0 · Eksplorasi 500 · Praktisi 1000 · Spesialis 1600 · Mahir 2300 · Pakar 3100).
- **Leaderboard**: peserta saja, urut poin; poin sama = peringkat sama. `weeklyPointsDelta` = poin 7 hari terakhir; `previousRank` = peringkat 7 hari lalu.
- Koreksi poin negatif diizinkan, tetapi **tidak boleh membuat total < 0**.
- Kategori yang sudah dipakai riwayat poin **dinonaktifkan** saat dihapus (riwayat tetap utuh).

## Keamanan
- Role dicek di server (`requireRole('mentor')`); token diverifikasi lalu user dimuat ulang dari DB.
- Peserta hanya bisa membaca data miliknya (`/participants/:id`, `/points`).
- Pesan login sama untuk user tak ada / sandi salah; ada pembatas percobaan login (8x/10 menit per IP+akun; di serverless berlaku per-instance — untuk produksi ketat gunakan Upstash/Redis).
- Service-role key hanya di server. RLS aktif tanpa policy → key `anon` tidak bisa baca tabel.
- `helmet`, CORS whitelist, batas body 100 KB.

## Endpoint
Semua di bawah `/api`. Error: `{ "message", "code", "errors?": [{field,message}] }` (401/403/404/409/422/429).
Sukses: `{ "data": ... }`, kecuali login → `{ token, user }` (sesuai `apiClient.ts`).

| Method | Path | Akses | Keterangan |
|---|---|---|---|
| POST | `/auth/login` | publik | `{identifier,password}` → `{token,user}` |
| POST | `/auth/logout` | login | stateless (klien hapus token) |
| GET | `/auth/me` | login | user saat ini |
| GET | `/participants/me` | login | peserta: dirinya; mentor: pratinjau peserta teratas |
| GET | `/participants` | mentor | semua peserta (terurut poin) |
| GET | `/participants/:id` | mentor / pemilik | detail + aktivitas + achievement |
| POST | `/participants` | mentor | buat peserta (+poin awal). Sandi awal = `DEFAULT_PARTICIPANT_PASSWORD` |
| PATCH | `/participants/:id` | mentor | `pointsDelta` **atau** `totalPoints`, `status`, `completedModules`, `mentorNotes`, `name`, `track`, opsional `categoryId` |
| GET | `/leaderboard` | login | `LeaderboardEntry[]` |
| GET | `/categories` | login | `?includeInactive=true` (mentor) |
| POST | `/categories` | mentor | `{name, description?, defaultPoints?, isActive?}` |
| PATCH | `/categories/:id` | mentor | ubah sebagian |
| DELETE | `/categories/:id` | mentor | hapus / nonaktifkan bila sudah dipakai |
| GET | `/points` | login | riwayat poin (`?participantId=`; peserta dipaksa miliknya) |
| POST | `/points` | mentor | `{participantId, categoryId, points?, title?, notes?}`; `points` kosong → default kategori |
| DELETE | `/points/:id` | mentor | koreksi: hapus entri |
| GET | `/health` | publik | cek hidup |

## Catatan koordinasi tim
- **Anggota 1 (Frontend):** semua endpoint lama di `apiConfig.ts` sudah terpenuhi. Set `VITE_API_BASE_URL=/api`. Endpoint baru belum ada UI-nya: `/categories`, `/points` (untuk form "beri poin berdasarkan kategori"). `ActivityItem.category` di `types` masih union 4 nilai; kategori baru buatan mentor akan muncul sebagai string lain.
- **Anggota 3 (DB & DevOps):** pakai `supabase/schema.sql` + `seed.sql` (tambahkan 9 peserta & riwayat). Env Vercel: `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`, `JWT_SECRET`, `DEFAULT_PARTICIPANT_PASSWORD`, `VITE_API_BASE_URL=/api`. `vercel.json` sudah me-rewrite `/api/*`.
- **Anggota 4 (QA):** `server/tests/api.test.ts` bisa jadi dasar testing report.

## Keterbatasan yang diketahui
- Belum dites terhadap Supabase asli (tes memakai repository memori dengan kontrak sama); uji sekali setelah schema dijalankan.
- Leaderboard menghitung di server dari seluruh `point_entries` (batas 10.000 baris) — cukup untuk skala kelas; untuk data besar pindahkan ke view/RPC SQL.
- Tidak ada fitur ganti/reset kata sandi.
