# Akademi Progres — Portal Pembelajaran & Peringkat Peserta

Aplikasi web berbasis **React + TypeScript + Tailwind CSS + Vite** (frontend) dan **Express + Supabase** (backend) untuk memantau progres belajar peserta, perolehan poin kompetensi, peringkat peserta, dan pengelolaan data oleh mentor.

## Halaman Utama

1. **Login Page** — Form masuk dengan validasi email/username dan kata sandi.
2. **Dashboard Peserta** — Profil peserta, kartu total poin, progress bar level, riwayat aktivitas, pencapaian kompetensi, dan catatan mentor.
3. **Leaderboard** — Papan peringkat peserta dengan penanda khusus peringkat 1, 2, dan 3, pencarian, serta filter jalur belajar.
4. **Panel Mentor** — Daftar peserta, ringkasan metrik, filter status, tambah peserta baru, serta pembaruan poin, modul, status, dan catatan evaluasi.

---

## Kredensial Akun Uji Coba

Berlaku untuk mode placeholder frontend maupun data demo backend (mode memori / `supabase/seed.sql`).

### Akun Peserta untuk demo
- **Username:** `raka.pratama` *(atau `raka.pratama@akademi.id`)*
- **Kata Sandi:** `Raka123`

### Akun Mentor
- **Username:** `budi.mentor` *(atau `mentor@akademi.id`)*
- **Kata Sandi:** `Budi123`

---

## Cara Menjalankan di VS Code (Lokal)

### Prasyarat
- **Node.js** versi 18 atau lebih baru (termasuk `npm`).
- **Visual Studio Code** (atau editor kode sejenis).

### Langkah-langkah
1. Ekstrak / clone proyek ini ke komputer Anda, lalu buka folder proyek di **VS Code** (`File > Open Folder...`).
2. Buka terminal terintegrasi di VS Code melalui menu `Terminal > New Terminal` (atau pintasan `` Ctrl + ` ``).
3. Instal seluruh dependensi proyek:
   ```bash
   npm install --legacy-peer-deps
   ```
4. Pilih salah satu mode menjalankan:

   **A. Frontend saja (mode placeholder, tanpa backend)**
   ```bash
   npm run dev
   ```

   **B. Frontend + Backend**
   ```bash
   cp .env.example .env       # lalu isi nilainya, pastikan VITE_API_BASE_URL=/api
   npm run dev:api            # terminal 1 -> API di http://localhost:8787/api
   npm run dev                # terminal 2 -> frontend di http://localhost:3000
   ```
   Jika `SUPABASE_URL` dan `SUPABASE_SERVICE_ROLE_KEY` dikosongkan, backend memakai data demo di memori (hilang saat restart).

5. Buka browser dan kunjungi alamat berikut:
   ```text
   http://localhost:3000
   ```

### Perintah Tambahan
- `npm run dev:api` — Menjalankan backend API lokal (port 8787).
- `npm test` — Menjalankan tes integrasi API (vitest).
- `npm run build` — Membuat bundle produksi ke folder `dist/`.
- `npm run preview` — Menjalankan pratinjau hasil build produksi secara lokal.
- `npm run lint` — Memeriksa tipe TypeScript (`tsc --noEmit`).

---

## Backend

Backend berada di folder `server/` (Express + TypeScript, JWT, bcrypt, validasi zod) dengan database **Supabase (Postgres)**.

- Total poin dihitung dari penjumlahan riwayat poin, sehingga selalu sinkron.
- Level dan leaderboard dihitung di server memakai aturan yang sama dengan frontend.
- Role mentor dan peserta dicek di server; peserta tidak dapat mengakses endpoint mentor.

Skema database ada di `supabase/schema.sql` dan data awal di `supabase/seed.sql`.
Dokumentasi lengkap (aturan bisnis, keamanan, daftar endpoint): **[docs/BACKEND.md](docs/BACKEND.md)**.

---

## Integrasi Frontend dengan API Backend

Konfigurasi API terpusat berada di `src/config/apiConfig.ts`, `src/services/apiClient.ts`, dan `src/services/academyService.ts`.

1. Buat file `.env` di root proyek.
2. Tambahkan alamat API:
   ```env
   VITE_API_BASE_URL=/api
   ```
   Saat development, Vite meneruskan `/api` ke `http://localhost:8787`. Di production (Vercel), `/api` dilayani oleh serverless function yang sama.
3. Restart server pengembangan (`npm run dev`). Aplikasi akan otomatis mengirim request ke backend (menggantikan mode placeholder). Jika variabel ini kosong, aplikasi kembali ke mode placeholder.

Endpoint yang dipakai frontend:
- `POST /auth/login`
- `POST /auth/logout`
- `GET /participants/me`
- `GET /leaderboard`
- `GET /participants`
- `POST /participants`
- `PATCH /participants/:id`

Endpoint tambahan yang sudah tersedia di backend (belum ada tampilannya): `GET/POST/PATCH/DELETE /categories` dan `GET/POST/DELETE /points`.

---

## Deploy (Vercel)

1. Hubungkan repo GitHub ke Vercel (deploy otomatis dari branch `main`).
2. Isi **Environment Variables** di Project Settings:
   - `SUPABASE_URL`
   - `SUPABASE_SERVICE_ROLE_KEY`
   - `JWT_SECRET`
   - `DEFAULT_PARTICIPANT_PASSWORD`
   - `VITE_API_BASE_URL` = `/api`
3. Jalankan `supabase/schema.sql` lalu `supabase/seed.sql` di SQL Editor Supabase.

`vercel.json` sudah mengarahkan semua `/api/*` ke `api/index.ts`. Jangan pernah menaruh `SUPABASE_SERVICE_ROLE_KEY` di kode frontend atau meng-commit file `.env`.

