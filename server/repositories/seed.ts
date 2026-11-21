import bcrypt from 'bcryptjs';
import { config } from '../config';
import { MemoryRepository } from './memory';

/** Data demo untuk mode memori (dev lokal tanpa Supabase). Seed Supabase yang resmi ada di supabase/seed.sql. */
export async function seedMemory(repo: MemoryRepository) {
  const mk = (pw: string) => bcrypt.hash(pw, config.bcryptRounds);
  const cats: Record<string, string> = {};
  for (const [name, pts, desc] of [
    ['Modul', 50, 'Menyelesaikan modul belajar'],
    ['Tugas', 100, 'Mengumpulkan tugas'],
    ['Evaluasi', 150, 'Hasil evaluasi/ujian'],
    ['Mentoring', 75, 'Sesi mentoring'],
  ] as const) {
    cats[name] = (await repo.createCategory({ name, description: desc, default_points: pts, is_active: true })).id;
  }
  const mentor = await repo.createUser({
    name: 'Budi Santoso', username: 'budi.mentor', email: 'mentor@akademi.id',
    password_hash: await mk('mentor123'), role: 'mentor', avatar_url: null, track: null,
    cohort: 'Angkatan 08', status: 'aktif', total_modules: 0, completed_modules: 0, mentor_notes: null, mentor_id: null,
  });
  const people: Array<[string, string, 'Frontend' | 'Backend' | 'UI/UX' | 'Data', number, number, string]> = [
    ['Raka Pratama', 'raka.pratama', 'Frontend', 1450, 12, 'password123'],
    ['Nadia Kusuma', 'nadia.kusuma', 'UI/UX', 2640, 18, 'password123'],
    ['Dimas Prakoso', 'dimas.prakoso', 'Backend', 3200, 20, 'password123'],
    ['Sari Wulandari', 'sari.wulandari', 'Data', 720, 6, 'password123'],
  ];
  for (const [name, username, track, pts, done, pw] of people) {
    const u = await repo.createUser({
      name, username, email: `${username}@akademi.id`, password_hash: await mk(pw), role: 'peserta',
      avatar_url: null, track, cohort: 'Angkatan 08', status: 'aktif', total_modules: 20,
      completed_modules: done, mentor_notes: null, mentor_id: mentor.id,
    });
    const old = new Date(Date.now() - 20 * 86400000).toISOString();
    const recent = new Date(Date.now() - 2 * 86400000).toISOString();
    const base = await repo.createEntry({ user_id: u.id, category_id: cats.Modul, title: 'Akumulasi poin modul awal', points: pts - 150, notes: null, awarded_by: mentor.id });
    const rec = await repo.createEntry({ user_id: u.id, category_id: cats.Tugas, title: 'Tugas sprint terbaru', points: 150, notes: null, awarded_by: mentor.id });
    base.created_at = old;
    rec.created_at = recent;
  }
}
