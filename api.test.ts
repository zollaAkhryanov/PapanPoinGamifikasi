import request from 'supertest';
import { beforeAll, beforeEach, describe, expect, it } from 'vitest';

process.env.BCRYPT_ROUNDS = '4';
process.env.JWT_SECRET = 'test-secret-test-secret';

import { createApp } from '../app';
import { MemoryRepository } from '../repositories/memory';
import { seedMemory } from '../repositories/seed';
import { resetLoginLimiter } from '../routes';

let repo: MemoryRepository;
let api: ReturnType<typeof request>;

async function login(identifier: string, password: string) {
  const res = await api.post('/api/auth/login').send({ identifier, password });
  return res;
}
const bearer = (t: string) => ({ Authorization: `Bearer ${t}` });

let mentorToken = '';
let rakaToken = '';
let rakaId = '';

beforeAll(() => {});
beforeEach(async () => {
  resetLoginLimiter();
  repo = new MemoryRepository();
  await seedMemory(repo);
  api = request(createApp(repo));
  mentorToken = (await login('budi.mentor', 'mentor123')).body.token;
  const r = await login('raka.pratama@akademi.id', 'password123');
  rakaToken = r.body.token;
  rakaId = r.body.user.id;
});

describe('Auth', () => {
  it('login berhasil dengan username maupun email, bentuk respons {token,user}', async () => {
    const res = await login('RAKA.PRATAMA', 'password123');
    expect(res.status).toBe(200);
    expect(res.body.user).toMatchObject({ username: 'raka.pratama', role: 'peserta' });
    expect(res.body.user.password_hash).toBeUndefined();
    expect(typeof res.body.token).toBe('string');
  });
  it('password salah => 401 tanpa membocorkan apakah user ada', async () => {
    const a = await login('raka.pratama', 'salah');
    const b = await login('tidak.ada', 'salah');
    expect(a.status).toBe(401);
    expect(b.status).toBe(401);
    expect(a.body.message).toBe(b.body.message);
  });
  it('input kosong => 422 dengan pesan Indonesia', async () => {
    const res = await api.post('/api/auth/login').send({});
    expect(res.status).toBe(422);
    expect(res.body.code).toBe('VALIDATION_ERROR');
  });
  it('dibatasi setelah terlalu banyak percobaan gagal => 429', async () => {
    for (let i = 0; i < 8; i++) await login('raka.pratama', 'salah');
    const res = await login('raka.pratama', 'password123');
    expect(res.status).toBe(429);
  });
  it('/auth/me butuh token valid', async () => {
    expect((await api.get('/api/auth/me')).status).toBe(401);
    expect((await api.get('/api/auth/me').set(bearer('ngawur'))).status).toBe(401);
    const ok = await api.get('/api/auth/me').set(bearer(rakaToken));
    expect(ok.body.data.username).toBe('raka.pratama');
  });
});

describe('Proteksi role', () => {
  it('peserta tidak bisa membuka endpoint mentor', async () => {
    expect((await api.get('/api/participants').set(bearer(rakaToken))).status).toBe(403);
    expect((await api.post('/api/categories').set(bearer(rakaToken)).send({ name: 'X1' })).status).toBe(403);
    expect((await api.post('/api/points').set(bearer(rakaToken)).send({})).status).toBe(403);
    expect((await api.patch(`/api/participants/${rakaId}`).set(bearer(rakaToken)).send({ pointsDelta: 9999 })).status).toBe(403);
  });
  it('peserta hanya bisa melihat data sendiri', async () => {
    const list = (await api.get('/api/participants').set(bearer(mentorToken))).body.data;
    const other = list.find((p: { id: string }) => p.id !== rakaId);
    expect((await api.get(`/api/participants/${other.id}`).set(bearer(rakaToken))).status).toBe(403);
    expect((await api.get(`/api/participants/${rakaId}`).set(bearer(rakaToken))).status).toBe(200);
    expect((await api.get(`/api/points?participantId=${other.id}`).set(bearer(rakaToken))).status).toBe(403);
  });
  it('tanpa token => 401 di semua endpoint data', async () => {
    for (const path of ['/api/leaderboard', '/api/participants/me', '/api/categories', '/api/points']) {
      expect((await api.get(path)).status).toBe(401);
    }
  });
  it('/participants/me: peserta -> dirinya, mentor -> pratinjau peserta', async () => {
    expect((await api.get('/api/participants/me').set(bearer(rakaToken))).body.data.id).toBe(rakaId);
    const m = await api.get('/api/participants/me').set(bearer(mentorToken));
    expect(m.status).toBe(200);
    expect(m.body.data.role).toBeUndefined();
  });
});

describe('Kategori aktivitas (CRUD)', () => {
  it('create, read, update, delete', async () => {
    const c = await api.post('/api/categories').set(bearer(mentorToken))
      .send({ name: 'Hackathon', defaultPoints: 300, description: 'Lomba internal' });
    expect(c.status).toBe(201);
    const id = c.body.data.id;
    expect(c.body.data).toMatchObject({ name: 'Hackathon', defaultPoints: 300, isActive: true });

    const dup = await api.post('/api/categories').set(bearer(mentorToken)).send({ name: 'hackathon' });
    expect(dup.status).toBe(409);

    const upd = await api.patch(`/api/categories/${id}`).set(bearer(mentorToken)).send({ defaultPoints: 250 });
    expect(upd.body.data.defaultPoints).toBe(250);

    const list = await api.get('/api/categories').set(bearer(rakaToken));
    expect(list.body.data.map((x: { name: string }) => x.name)).toContain('Hackathon');

    const del = await api.delete(`/api/categories/${id}`).set(bearer(mentorToken));
    expect(del.body.data).toMatchObject({ deleted: true });
    expect((await api.delete(`/api/categories/${id}`).set(bearer(mentorToken))).status).toBe(404);
  });
  it('kategori yang sudah dipakai dinonaktifkan, bukan dihapus', async () => {
    const cats = (await api.get('/api/categories').set(bearer(mentorToken))).body.data;
    const tugas = cats.find((c: { name: string }) => c.name === 'Tugas');
    const del = await api.delete(`/api/categories/${tugas.id}`).set(bearer(mentorToken));
    expect(del.body.data).toMatchObject({ deleted: false, deactivated: true });
    const after = (await api.get('/api/categories').set(bearer(mentorToken))).body.data;
    expect(after.find((c: { name: string }) => c.name === 'Tugas')).toBeUndefined();
    const all = (await api.get('/api/categories?includeInactive=true').set(bearer(mentorToken))).body.data;
    expect(all.find((c: { name: string }) => c.name === 'Tugas').isActive).toBe(false);
  });
  it('validasi input', async () => {
    const r = await api.post('/api/categories').set(bearer(mentorToken)).send({ name: 'A', defaultPoints: -5 });
    expect(r.status).toBe(422);
    const r2 = await api.post('/api/categories').set(bearer(mentorToken)).send({ name: 'Valid', defaultPoints: 1.5 });
    expect(r2.status).toBe(422);
  });
});

describe('Pemberian poin, level, leaderboard', () => {
  const catId = async (name: string) =>
    (await api.get('/api/categories').set(bearer(mentorToken))).body.data.find((c: { name: string }) => c.name === name).id;

  it('memberi poin memakai default kategori & level naik', async () => {
    const before = (await api.get(`/api/participants/${rakaId}`).set(bearer(mentorToken))).body.data;
    const res = await api.post('/api/points').set(bearer(mentorToken))
      .send({ participantId: rakaId, categoryId: await catId('Evaluasi'), notes: 'Bagus' });
    expect(res.status).toBe(201);
    expect(res.body.data.entry.points).toBe(150);
    expect(res.body.data.participant.totalPoints).toBe(before.totalPoints + 150);
    expect(res.body.data.participant.activities[0]).toMatchObject({ category: 'Evaluasi', pointsEarned: 150 });
    // 1450 + 150 = 1600 => level 4 (Spesialis)
    expect(res.body.data.participant.level).toBe(4);
  });
  it('menolak poin 0, kategori tak valid, peserta tak ada, dan total negatif', async () => {
    const c = await catId('Modul');
    expect((await api.post('/api/points').set(bearer(mentorToken)).send({ participantId: rakaId, categoryId: c, points: 0 })).status).toBe(422);
    expect((await api.post('/api/points').set(bearer(mentorToken)).send({ participantId: rakaId, categoryId: 'xx' })).status).toBe(422);
    expect((await api.post('/api/points').set(bearer(mentorToken)).send({ participantId: 'xx', categoryId: c })).status).toBe(404);
    const neg = await api.post('/api/points').set(bearer(mentorToken)).send({ participantId: rakaId, categoryId: c, points: -999999 });
    expect(neg.status).toBe(422);
  });
  it('koreksi: hapus entri mengembalikan total', async () => {
    const c = await catId('Tugas');
    const add = await api.post('/api/points').set(bearer(mentorToken)).send({ participantId: rakaId, categoryId: c, points: 500 });
    const total = add.body.data.participant.totalPoints;
    const del = await api.delete(`/api/points/${add.body.data.entry.id}`).set(bearer(mentorToken));
    expect(del.body.data.participant.totalPoints).toBe(total - 500);
  });
  it('leaderboard terurut, peringkat benar, level konsisten dgn frontend', async () => {
    const lb = (await api.get('/api/leaderboard').set(bearer(rakaToken))).body.data;
    expect(lb.map((e: { rank: number }) => e.rank)).toEqual([1, 2, 3, 4]);
    expect(lb[0]).toMatchObject({ username: 'dimas.prakoso', totalPoints: 3200, level: 6 });
    expect(lb[1]).toMatchObject({ username: 'nadia.kusuma', level: 5 });
    expect(lb.every((e: { weeklyPointsDelta: number }) => e.weeklyPointsDelta === 150)).toBe(true);
    expect(lb.every((e: { previousRank: number }) => typeof e.previousRank === 'number')).toBe(true);
  });
  it('poin sama => peringkat sama', async () => {
    const lb0 = (await api.get('/api/leaderboard').set(bearer(mentorToken))).body.data;
    const sari = lb0.find((e: { username: string }) => e.username === 'sari.wulandari');
    // samakan Sari dengan Raka (1450 - 720 = 730)
    await api.post('/api/points').set(bearer(mentorToken)).send({ participantId: sari.participantId, categoryId: await catId('Modul'), points: 730 });
    const lb = (await api.get('/api/leaderboard').set(bearer(mentorToken))).body.data;
    const tied = lb.filter((e: { totalPoints: number }) => e.totalPoints === 1450);
    expect(tied).toHaveLength(2);
    expect(tied[0].rank).toBe(tied[1].rank);
  });
});

describe('Kontrak frontend: participants', () => {
  const payload = { name: 'Citra Lestari', email: 'Citra@Akademi.id', username: 'Citra.L', track: 'Data',
    cohort: 'Angkatan 08', initialPoints: 600, completedModules: 3, totalModules: 20, status: 'aktif' };

  it('POST /participants membuat peserta + poin awal, normalisasi huruf kecil', async () => {
    const res = await api.post('/api/participants').set(bearer(mentorToken)).send(payload);
    expect(res.status).toBe(201);
    expect(res.body.data).toMatchObject({ username: 'citra.l', email: 'citra@akademi.id', totalPoints: 600, level: 2 });
    expect(res.body.data.mentorName).toBe('Budi Santoso');
    // akun baru bisa login dengan password default
    expect((await login('citra.l', 'peserta123')).status).toBe(200);
  });
  it('duplikat => 409, input buruk => 422', async () => {
    await api.post('/api/participants').set(bearer(mentorToken)).send(payload);
    expect((await api.post('/api/participants').set(bearer(mentorToken)).send(payload)).status).toBe(409);
    const bad = await api.post('/api/participants').set(bearer(mentorToken))
      .send({ ...payload, email: 'x', completedModules: 99, username: 'ab' });
    expect(bad.status).toBe(422);
    expect(bad.body.errors.length).toBeGreaterThanOrEqual(2);
  });
  it('PATCH pointsDelta / totalPoints / status / modul', async () => {
    const d = await api.patch(`/api/participants/${rakaId}`).set(bearer(mentorToken))
      .send({ pointsDelta: 100, activityTitle: 'Bonus', mentorNotes: 'Mantap', status: 'selesai' });
    expect(d.status).toBe(200);
    expect(d.body.data).toMatchObject({ totalPoints: 1550, status: 'selesai', mentorNotes: 'Mantap' });
    expect(d.body.data.activities[0]).toMatchObject({ title: 'Bonus', pointsEarned: 100 });

    const t = await api.patch(`/api/participants/${rakaId}`).set(bearer(mentorToken)).send({ totalPoints: 1000 });
    expect(t.body.data.totalPoints).toBe(1000);
    expect(t.body.data.activities[0].pointsEarned).toBe(-550);

    const m = await api.patch(`/api/participants/${rakaId}`).set(bearer(mentorToken)).send({ completedModules: 99 });
    expect(m.status).toBe(422);
    expect((await api.patch(`/api/participants/${rakaId}`).set(bearer(mentorToken)).send({})).status).toBe(422);
    expect((await api.patch('/api/participants/tidak-ada').set(bearer(mentorToken)).send({ status: 'aktif' })).status).toBe(404);
  });
});

describe('Lain-lain', () => {
  it('health, 404 JSON, body JSON rusak', async () => {
    expect((await api.get('/api/health')).body.data.status).toBe('ok');
    const nf = await api.get('/api/tidak-ada');
    expect(nf.status).toBe(404);
    const bad = await api.post('/api/auth/login').set('Content-Type', 'application/json').send('{rusak');
    expect(bad.status).toBe(400);
  });
});
