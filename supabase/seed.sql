-- Seed minimal untuk backend (jalankan setelah schema.sql). Anggota 3: tambahkan 9 peserta fiktif lain
-- dan riwayat poin di bawah pola yang sama. Password hash = bcrypt cost 10.
insert into activity_categories (name, description, default_points) values
  ('Modul',     'Menyelesaikan modul belajar', 50),
  ('Tugas',     'Mengumpulkan tugas',          100),
  ('Evaluasi',  'Hasil evaluasi/ujian',        150),
  ('Mentoring', 'Sesi mentoring',              75)
on conflict do nothing;

insert into users (name, username, email, password_hash, role, cohort, track, total_modules, completed_modules) values
  ('Budi Santoso', 'budi.mentor',  'mentor@akademi.id',        '$2b$10$rdFpvD/SeCS4gbQheABQG.MOzVfFZ48.bys7LVq0dxndyFxSFc5UG', 'mentor', 'Angkatan 08', null,       0,  0),
  ('Raka Pratama', 'raka.pratama', 'raka.pratama@akademi.id',  '$2b$10$U83u4zhQJXjK4aHRHUd/v.UnIiIYWRFpoOVREZnfFAOEwuQ08JYfa', 'peserta','Angkatan 08', 'Frontend', 20, 12)
on conflict do nothing;

update users set mentor_id = (select id from users where username = 'budi.mentor') where role = 'peserta' and mentor_id is null;

insert into point_entries (user_id, category_id, title, points, awarded_by)
select u.id, c.id, 'Akumulasi poin modul awal', 1300, m.id
from users u, activity_categories c, users m
where u.username = 'raka.pratama' and c.name = 'Modul' and m.username = 'budi.mentor'
  and not exists (select 1 from point_entries p where p.user_id = u.id);
