import bcrypt from 'bcryptjs';
import { Router } from 'express';
import type { AuthUser, UserRole } from '../../src/types';
import { config } from '../config';
import { forbidden, HttpError, notFound, unauthorized, invalid } from '../lib/errors';
import { asyncHandler, requireAuth, requireRole, signToken } from '../middleware/auth';
import { validateBody } from '../middleware/validate';
import type { Repository, UserRow } from '../repositories/types';
import { AcademyService } from '../services/academy';
import { buildLeaderboard } from '../services/gamification';
import {
  awardPointsSchema, categoryPatchSchema, categorySchema, createParticipantSchema,
  loginSchema, updateParticipantSchema,
} from '../validators/schemas';

const toAuthUser = (u: UserRow): AuthUser => ({
  id: u.id,
  name: u.name,
  username: u.username,
  email: u.email,
  role: u.role as UserRole,
  avatarUrl: u.avatar_url ?? undefined,
  track: u.track ?? undefined,
  cohort: u.cohort ?? undefined,
});

// --- Pembatas percobaan login (in-memory; pada serverless berlaku per-instance, lihat docs) ---
const attempts = new Map<string, { count: number; resetAt: number }>();
const MAX_ATTEMPTS = 8;
const WINDOW_MS = 10 * 60 * 1000;
export const resetLoginLimiter = () => attempts.clear();

function checkLimiter(key: string) {
  const now = Date.now();
  const rec = attempts.get(key);
  if (rec && rec.resetAt > now && rec.count >= MAX_ATTEMPTS) {
    throw new HttpError(429, 'Terlalu banyak percobaan masuk. Coba lagi beberapa menit lagi.', 'TOO_MANY_ATTEMPTS');
  }
}
function registerFailure(key: string) {
  const now = Date.now();
  const rec = attempts.get(key);
  if (!rec || rec.resetAt <= now) attempts.set(key, { count: 1, resetAt: now + WINDOW_MS });
  else rec.count += 1;
}

// Hash dummy supaya waktu respons sama baik user ada maupun tidak (anti user-enumeration).
const DUMMY_HASH = bcrypt.hashSync('dummy-password', 4);

export function createApiRouter(repo: Repository): Router {
  const router = Router();
  const svc = new AcademyService(repo);
  const auth = requireAuth(repo);
  const mentorOnly = requireRole('mentor');

  router.get('/health', (_req, res) => {
    res.json({ data: { status: 'ok', time: new Date().toISOString() } });
  });

  // ---------------- AUTH ----------------
  router.post('/auth/login', validateBody(loginSchema), asyncHandler(async (req, res) => {
    const { identifier, password } = req.body as { identifier: string; password: string };
    const key = `${req.ip}|${identifier.toLowerCase()}`;
    checkLimiter(key);

    const user = await repo.findUserByIdentifier(identifier);
    const ok = await bcrypt.compare(password, user?.password_hash ?? DUMMY_HASH);
    if (!user || !ok) {
      registerFailure(key);
      throw unauthorized('Email/username atau kata sandi tidak sesuai. Periksa kembali kredensial Anda.', 'INVALID_CREDENTIALS');
    }
    attempts.delete(key);
    // Bentuk respons sama dengan LoginResponse di frontend: { token, user }
    res.json({ token: signToken(user), user: toAuthUser(user) });
  }));

  router.post('/auth/logout', auth, (_req, res) => {
    // JWT stateless: klien menghapus token. Endpoint ada agar kontrak frontend terpenuhi.
    res.json({ data: { ok: true } });
  });

  router.get('/auth/me', auth, (req, res) => {
    res.json({ data: toAuthUser(req.auth!) });
  });

  // ---------------- PARTICIPANTS ----------------
  router.get('/participants/me', auth, asyncHandler(async (req, res) => {
    const me = req.auth!;
    if (me.role === 'peserta') return void res.json({ data: await svc.getParticipant(me.id) });
    // Mentor membuka dashboard peserta => tampilkan peserta peringkat teratas sebagai pratinjau
    const all = await svc.listParticipants();
    if (!all.length) throw notFound('Belum ada peserta terdaftar.');
    res.json({ data: all[0] });
  }));

  router.get('/participants', auth, mentorOnly, asyncHandler(async (_req, res) => {
    res.json({ data: await svc.listParticipants() });
  }));

  router.get('/participants/:id', auth, asyncHandler(async (req, res) => {
    const me = req.auth!;
    if (me.role === 'peserta' && me.id !== req.params.id) throw forbidden('Anda hanya dapat melihat data Anda sendiri.');
    res.json({ data: await svc.getParticipant(req.params.id) });
  }));

  router.post('/participants', auth, mentorOnly, validateBody(createParticipantSchema), asyncHandler(async (req, res) => {
    const b = req.body;
    const user = await repo.createUser({
      name: b.name, email: b.email, username: b.username,
      password_hash: await svc.hashPassword(config.defaultParticipantPassword),
      role: 'peserta', avatar_url: null, track: b.track, cohort: b.cohort || null,
      status: b.status, total_modules: b.totalModules, completed_modules: b.completedModules,
      mentor_notes: b.mentorNotes || null, mentor_id: req.auth!.id,
    });
    if (b.initialPoints > 0) {
      const cat = await svc.ensureCategory('Mentoring');
      await repo.createEntry({
        user_id: user.id, category_id: cat.id, title: 'Poin Awal Penempatan Kelas',
        points: b.initialPoints, notes: null, awarded_by: req.auth!.id,
      });
    }
    res.status(201).json({ data: await svc.getParticipant(user.id) });
  }));

  router.patch('/participants/:id', auth, mentorOnly, validateBody(updateParticipantSchema), asyncHandler(async (req, res) => {
    const id = req.params.id;
    const b = req.body;
    const user = await repo.getUserById(id);
    if (!user || user.role !== 'peserta') throw notFound('Data peserta tidak ditemukan.');

    const totalModules = b.totalModules ?? user.total_modules;
    const completedModules = b.completedModules ?? user.completed_modules;
    if (completedModules > totalModules) {
      throw invalid('Modul selesai tidak boleh melebihi total modul.');
    }

    // Poin: pointsDelta (relatif) atau totalPoints (absolut -> dicatat sebagai selisih)
    let delta = 0;
    if (b.pointsDelta !== undefined) delta = b.pointsDelta;
    else if (b.totalPoints !== undefined) {
      const current = (await svc.getParticipant(id)).totalPoints;
      delta = b.totalPoints - current;
    }
    if (delta !== 0) {
      let category = b.categoryId ? await repo.getCategory(b.categoryId) : await svc.ensureCategory('Mentoring');
      if (!category || !category.is_active) throw invalid('Kategori aktivitas tidak valid atau tidak aktif.');
      const defaultTitle = b.pointsDelta !== undefined
        ? (delta > 0 ? 'Penambahan Poin Evaluasi Mentor' : 'Penyesuaian Poin oleh Mentor')
        : 'Pembaruan Total Poin oleh Mentor';
      await svc.awardPoints({
        userId: id, categoryId: category.id, points: delta,
        title: b.activityTitle || defaultTitle, notes: b.pointsDelta !== undefined ? b.mentorNotes : undefined,
        awardedBy: req.auth!.id,
      });
    }

    await repo.updateUser(id, {
      ...(b.name !== undefined && { name: b.name }),
      ...(b.track !== undefined && { track: b.track }),
      ...(b.status !== undefined && { status: b.status }),
      ...(b.mentorNotes !== undefined && { mentor_notes: b.mentorNotes || null }),
      total_modules: totalModules,
      completed_modules: completedModules,
    });
    res.json({ data: await svc.getParticipant(id) });
  }));

  // ---------------- LEADERBOARD ----------------
  router.get('/leaderboard', auth, asyncHandler(async (_req, res) => {
    const [users, entries] = await Promise.all([repo.listUsers('peserta'), repo.listEntries()]);
    res.json({ data: buildLeaderboard(users, entries) });
  }));

  // ---------------- ACTIVITY CATEGORIES (CRUD) ----------------
  const catOut = (c: { id: string; name: string; description: string | null; default_points: number; is_active: boolean; created_at: string }) => ({
    id: c.id, name: c.name, description: c.description, defaultPoints: c.default_points,
    isActive: c.is_active, createdAt: c.created_at,
  });

  router.get('/categories', auth, asyncHandler(async (req, res) => {
    const includeInactive = req.auth!.role === 'mentor' && req.query.includeInactive === 'true';
    res.json({ data: (await repo.listCategories(includeInactive)).map(catOut) });
  }));

  router.post('/categories', auth, mentorOnly, validateBody(categorySchema), asyncHandler(async (req, res) => {
    const b = req.body;
    const c = await repo.createCategory({
      name: b.name, description: b.description || null, default_points: b.defaultPoints, is_active: b.isActive,
    });
    res.status(201).json({ data: catOut(c) });
  }));

  router.patch('/categories/:id', auth, mentorOnly, validateBody(categoryPatchSchema), asyncHandler(async (req, res) => {
    const b = req.body;
    const c = await repo.updateCategory(req.params.id, {
      ...(b.name !== undefined && { name: b.name }),
      ...(b.description !== undefined && { description: b.description || null }),
      ...(b.defaultPoints !== undefined && { default_points: b.defaultPoints }),
      ...(b.isActive !== undefined && { is_active: b.isActive }),
    });
    if (!c) throw notFound('Kategori tidak ditemukan.');
    res.json({ data: catOut(c) });
  }));

  router.delete('/categories/:id', auth, mentorOnly, asyncHandler(async (req, res) => {
    const c = await repo.getCategory(req.params.id);
    if (!c) throw notFound('Kategori tidak ditemukan.');
    // Kategori yang sudah dipakai riwayat poin tidak dihapus permanen (jaga integritas riwayat) -> dinonaktifkan.
    if ((await repo.countEntriesForCategory(c.id)) > 0) {
      const updated = await repo.updateCategory(c.id, { is_active: false });
      return void res.json({ data: { deleted: false, deactivated: true, category: catOut(updated!) } });
    }
    await repo.deleteCategory(c.id);
    res.json({ data: { deleted: true, deactivated: false } });
  }));

  // ---------------- POINTS ----------------
  const entryOut = (e: { id: string; user_id: string; category_id: string; title: string; points: number; notes: string | null; awarded_by: string | null; created_at: string }) => ({
    id: e.id, participantId: e.user_id, categoryId: e.category_id, title: e.title,
    points: e.points, notes: e.notes, awardedBy: e.awarded_by, createdAt: e.created_at,
  });

  router.get('/points', auth, asyncHandler(async (req, res) => {
    const me = req.auth!;
    const requested = typeof req.query.participantId === 'string' ? req.query.participantId : undefined;
    if (me.role === 'peserta' && requested && requested !== me.id) throw forbidden('Anda hanya dapat melihat riwayat poin Anda sendiri.');
    const userId = me.role === 'peserta' ? me.id : requested;
    const entries = await repo.listEntries(userId);
    entries.sort((a, b) => b.created_at.localeCompare(a.created_at));
    res.json({ data: entries.map(entryOut) });
  }));

  router.post('/points', auth, mentorOnly, validateBody(awardPointsSchema), asyncHandler(async (req, res) => {
    const b = req.body;
    const user = await repo.getUserById(b.participantId);
    if (!user || user.role !== 'peserta') throw notFound('Data peserta tidak ditemukan.');
    const category = await repo.getCategory(b.categoryId);
    if (!category || !category.is_active) throw invalid('Kategori aktivitas tidak valid atau tidak aktif.');
    const points = b.points ?? category.default_points;
    if (!points) throw invalid('Poin wajib diisi karena kategori ini tidak memiliki poin default.');
    const entry = await svc.awardPoints({
      userId: user.id, categoryId: category.id, points, title: b.title || category.name,
      notes: b.notes, awardedBy: req.auth!.id,
    });
    res.status(201).json({ data: { entry: entryOut(entry), participant: await svc.getParticipant(user.id) } });
  }));

  router.delete('/points/:id', auth, mentorOnly, asyncHandler(async (req, res) => {
    const entry = await repo.getEntry(req.params.id);
    if (!entry) throw notFound('Riwayat poin tidak ditemukan.');
    await repo.deleteEntry(entry.id);
    res.json({ data: { deleted: true, participant: await svc.getParticipant(entry.user_id) } });
  }));

  return router;
}
