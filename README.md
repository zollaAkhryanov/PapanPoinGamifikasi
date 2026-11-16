# Akademi Progres — Portal Pembelajaran & Peringkat Peserta

Aplikasi frontend berbasis **React + TypeScript + Tailwind CSS + Vite** untuk memantau progres belajar peserta, perolehan poin kompetensi, peringkat peserta, dan pengelolaan data oleh mentor.

## Halaman Utama

1. **Login Page** — Form masuk dengan validasi email/username dan kata sandi.
2. **Dashboard Peserta** — Profil peserta, kartu total poin, progress bar level, riwayat aktivitas, pencapaian kompetensi, dan catatan mentor.
3. **Leaderboard** — Papan peringkat peserta dengan penanda khusus peringkat 1, 2, dan 3, pencarian, serta filter jalur belajar.
4. **Panel Mentor** — Daftar peserta, ringkasan metrik, filter status, tambah peserta baru, serta pembaruan poin, modul, status, dan catatan evaluasi.

---

## Kredensial Akun Uji Coba (Mode Placeholder Frontend)

Gunakan kredensial berikut untuk masuk saat aplikasi masih berjalan tanpa backend:

### Akun Peserta
- **Username:** `raka.pratama` *(atau `raka.pratama@akademi.id`)*
- **Kata Sandi:** `password123`

### Akun Mentor
- **Username:** `budi.mentor` *(atau `mentor@akademi.id`)*
- **Kata Sandi:** `mentor123`

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
   npm install
   ```
4. Jalankan server pengembangan lokal:
   ```bash
   npm run dev
   ```
5. Buka browser dan kunjungi alamat berikut:
   ```text
   http://localhost:3000
   ```

### Perintah Tambahan
- `npm run build` — Membuat bundle produksi ke folder `dist/`.
- `npm run preview` — Menjalankan pratinjau hasil build produksi secara lokal.
- `npm run lint` — Memeriksa tipe TypeScript (`tsc --noEmit`).

---

## Integrasi dengan API Backend

Konfigurasi API terpusat berada di `src/config/apiConfig.ts`, `src/services/apiClient.ts`, dan `src/services/academyService.ts`.

Saat backend sudah tersedia:
1. Buat file `.env` di root proyek.
2. Tambahkan alamat server backend Anda:
   ```env
   VITE_API_BASE_URL=http://localhost:8000/api
   ```
3. Restart server pengembangan (`npm run dev`). Aplikasi akan otomatis mengirim request ke backend (menggantikan mode placeholder) pada endpoint berikut:
   - `POST /auth/login`
   - `POST /auth/logout`
   - `GET /participants/me`
   - `GET /leaderboard`
   - `GET /participants`
   - `POST /participants`
   - `PATCH /participants/:id`
