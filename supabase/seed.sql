-- =========================================================
-- SEED DATA PAPAN POIN GAMIFIKASI
-- Anggota 3: Database & DevOps
-- 1 Mentor, 10 Peserta, 4 Kategori, 30 Riwayat Poin
-- Jalankan setelah schema.sql
-- Password demo: NamaDepan123
-- Bcrypt cost: 10
-- =========================================================

-- 1. KATEGORI AKTIVITAS
INSERT INTO activity_categories (name, description, default_points)
VALUES
  ('Modul', 'Menyelesaikan modul belajar', 50),
  ('Tugas', 'Mengumpulkan tugas', 100),
  ('Evaluasi', 'Hasil evaluasi/ujian', 150),
  ('Mentoring', 'Sesi mentoring', 75)
ON CONFLICT DO NOTHING;


-- 2. AKUN MENTOR DAN 10 PESERTA
-- Password diubah menjadi bcrypt hash oleh pgcrypto.
INSERT INTO users
  (name, username, email, password_hash, role, cohort, track)
SELECT
  d.name,
  d.username,
  d.email,
  crypt(d.password_plain, gen_salt('bf', 10)),
  d.role,
  d.cohort,
  d.track
FROM (
  VALUES
  ('Budi Santoso', 'budi.mentor', 'mentor@akademi.id',
   'Budi123', 'mentor', 'Angkatan 08', NULL::text),

  ('Raka Pratama', 'raka.pratama', 'raka.pratama@akademi.id',
   'Raka123', 'peserta', 'Angkatan 08', 'Frontend'),

  ('Nadia Kusuma', 'nadia.kusuma', 'nadia.kusuma@akademi.id',
   'Nadia123', 'peserta', 'Angkatan 08', 'UI/UX'),

  ('Dimas Wijaya', 'dimas.wijaya', 'dimas.wijaya@akademi.id',
   'Dimas123', 'peserta', 'Angkatan 08', 'Data'),

  ('Siti Rahmawati', 'siti.rahma', 'siti.rahma@akademi.id',
   'Siti123', 'peserta', 'Angkatan 08', 'Backend'),

  ('Bagus Setiawan', 'bagus.setiawan', 'bagus.setiawan@akademi.id',
   'Bagus123', 'peserta', 'Angkatan 08', 'Frontend'),

  ('Ayu Lestari', 'ayu.lestari', 'ayu.lestari@akademi.id',
   'Ayu123', 'peserta', 'Angkatan 08', 'UI/UX'),

  ('Fajar Nugroho', 'fajar.nugroho', 'fajar.nugroho@akademi.id',
   'Fajar123', 'peserta', 'Angkatan 08', 'Backend'),

  ('Putri Amelia', 'putri.amelia', 'putri.amelia@akademi.id',
   'Putri123', 'peserta', 'Angkatan 08', 'Frontend'),

  ('Rizky Firmansyah', 'rizky.firmansyah', 'rizky.firmansyah@akademi.id',
   'Rizky123', 'peserta', 'Angkatan 08', 'Backend'),

  ('Andi Saputra', 'andi.saputra', 'andi.saputra@akademi.id',
   'Andi123', 'peserta', 'Angkatan 08', 'Data')
) AS d(name, username, email, password_plain, role, cohort, track)
ON CONFLICT DO NOTHING;


-- 3. MENGHUBUNGKAN PESERTA DENGAN MENTOR
UPDATE users
SET mentor_id = (
  SELECT id FROM users WHERE username = 'budi.mentor'
)
WHERE role = 'peserta'
AND mentor_id IS NULL;


-- 4. RIWAYAT POIN 10 PESERTA
-- Setiap peserta memiliki 3 catatan akumulasi kategori.
-- Total poin sesuai data demo leaderboard.

WITH demo_points(username, category_name, title, points) AS (
  VALUES
  ('dimas.wijaya'::text, 'Modul', 'Akumulasi penyelesaian modul', 900),
  ('dimas.wijaya', 'Tugas', 'Akumulasi penyelesaian tugas', 700),
  ('dimas.wijaya', 'Evaluasi', 'Akumulasi penyelesaian evaluasi', 350),

  ('putri.amelia', 'Modul', 'Akumulasi penyelesaian modul', 750),
  ('putri.amelia', 'Tugas', 'Akumulasi penyelesaian tugas', 600),
  ('putri.amelia', 'Evaluasi', 'Akumulasi penyelesaian evaluasi', 300),

  ('ayu.lestari', 'Modul', 'Akumulasi penyelesaian modul', 700),
  ('ayu.lestari', 'Tugas', 'Akumulasi penyelesaian tugas', 550),
  ('ayu.lestari', 'Evaluasi', 'Akumulasi penyelesaian evaluasi', 250),

  ('nadia.kusuma', 'Modul', 'Akumulasi penyelesaian modul', 700),
  ('nadia.kusuma', 'Tugas', 'Akumulasi penyelesaian tugas', 550),
  ('nadia.kusuma', 'Evaluasi', 'Akumulasi penyelesaian evaluasi', 250),

  ('andi.saputra', 'Modul', 'Akumulasi penyelesaian modul', 650),
  ('andi.saputra', 'Tugas', 'Akumulasi penyelesaian tugas', 500),
  ('andi.saputra', 'Evaluasi', 'Akumulasi penyelesaian evaluasi', 250),

  ('bagus.setiawan', 'Modul', 'Akumulasi penyelesaian modul', 600),
  ('bagus.setiawan', 'Tugas', 'Akumulasi penyelesaian tugas', 450),
  ('bagus.setiawan', 'Evaluasi', 'Akumulasi penyelesaian evaluasi', 200),

  ('fajar.nugroho', 'Modul', 'Akumulasi penyelesaian modul', 550),
  ('fajar.nugroho', 'Tugas', 'Akumulasi penyelesaian tugas', 450),
  ('fajar.nugroho', 'Evaluasi', 'Akumulasi penyelesaian evaluasi', 200),

  ('rizky.firmansyah', 'Modul', 'Akumulasi penyelesaian modul', 550),
  ('rizky.firmansyah', 'Tugas', 'Akumulasi penyelesaian tugas', 400),
  ('rizky.firmansyah', 'Evaluasi', 'Akumulasi penyelesaian evaluasi', 200),

  ('raka.pratama', 'Modul', 'Akumulasi penyelesaian modul', 500),
  ('raka.pratama', 'Tugas', 'Akumulasi penyelesaian tugas', 400),
  ('raka.pratama', 'Evaluasi', 'Akumulasi penyelesaian evaluasi', 200),

  ('siti.rahma', 'Modul', 'Akumulasi penyelesaian modul', 500),
  ('siti.rahma', 'Tugas', 'Akumulasi penyelesaian tugas', 400),
  ('siti.rahma', 'Evaluasi', 'Akumulasi penyelesaian evaluasi', 200)
)

INSERT INTO point_entries
  (user_id, category_id, title, points, awarded_by)

SELECT
  u.id,
  c.id,
  d.title,
  d.points,
  m.id
FROM demo_points d
JOIN users u ON u.username = d.username
JOIN activity_categories c ON c.name = d.category_name
CROSS JOIN users m
WHERE m.username = 'budi.mentor'
AND NOT EXISTS (
  SELECT 1
  FROM point_entries p
  WHERE p.user_id = u.id
);
