import { z } from 'zod';

const TRACKS = ['Frontend', 'Backend', 'UI/UX', 'Data'] as const;
const STATUSES = ['aktif', 'perlu_bimbingan', 'selesai'] as const;
const MAX_POINTS = 10000;

const trimmed = (min: number, max: number, label: string) =>
  z.string({ error: `${label} wajib diisi.` }).trim()
    .min(min, `${label} minimal ${min} karakter.`)
    .max(max, `${label} maksimal ${max} karakter.`);

export const loginSchema = z.object({
  identifier: trimmed(1, 100, 'Email/username'),
  password: z.string({ error: 'Kata sandi wajib diisi.' }).min(1, 'Kata sandi wajib diisi.').max(128),
});

export const createParticipantSchema = z
  .object({
    name: trimmed(2, 80, 'Nama'),
    email: z.string({ error: 'Email wajib diisi.' }).trim().toLowerCase().max(120)
      .pipe(z.email('Format email tidak valid.')),
    username: z.string({ error: 'Username wajib diisi.' }).trim().toLowerCase()
      .regex(/^[a-z0-9._-]{3,30}$/, 'Username 3-30 karakter: huruf kecil, angka, titik, garis bawah, atau strip.'),
    track: z.enum(TRACKS, { error: 'Jalur belajar tidak valid.' }),
    cohort: z.string().trim().max(40).default(''),
    initialPoints: z.number({ error: 'Poin awal harus berupa angka.' }).int('Poin awal harus bilangan bulat.')
      .min(0, 'Poin awal tidak boleh negatif.').max(100000).default(0),
    completedModules: z.number().int().min(0, 'Modul selesai tidak boleh negatif.').default(0),
    totalModules: z.number().int().min(1, 'Total modul minimal 1.').max(200).default(20),
    status: z.enum(STATUSES, { error: 'Status tidak valid.' }).default('aktif'),
    mentorNotes: z.string().trim().max(1000, 'Catatan maksimal 1000 karakter.').optional(),
  })
  .refine((v) => v.completedModules <= v.totalModules, {
    message: 'Modul selesai tidak boleh melebihi total modul.',
    path: ['completedModules'],
  });

export const updateParticipantSchema = z
  .object({
    name: trimmed(2, 80, 'Nama').optional(),
    track: z.enum(TRACKS, { error: 'Jalur belajar tidak valid.' }).optional(),
    pointsDelta: z.number().int('Perubahan poin harus bilangan bulat.')
      .min(-MAX_POINTS).max(MAX_POINTS).optional(),
    totalPoints: z.number().int('Total poin harus bilangan bulat.').min(0, 'Total poin tidak boleh negatif.')
      .max(1_000_000).optional(),
    activityTitle: z.string().trim().max(120).optional(),
    categoryId: z.string().min(1).optional(),
    completedModules: z.number().int().min(0).optional(),
    totalModules: z.number().int().min(1).max(200).optional(),
    status: z.enum(STATUSES, { error: 'Status tidak valid.' }).optional(),
    mentorNotes: z.string().trim().max(1000, 'Catatan maksimal 1000 karakter.').optional(),
  })
  .refine((v) => Object.keys(v).length > 0, { message: 'Tidak ada data yang diperbarui.' })
  .refine((v) => !(v.pointsDelta !== undefined && v.totalPoints !== undefined), {
    message: 'Kirim salah satu: pointsDelta atau totalPoints, tidak keduanya.',
    path: ['pointsDelta'],
  });

export const categorySchema = z.object({
  name: trimmed(2, 40, 'Nama kategori'),
  description: z.string().trim().max(200, 'Deskripsi maksimal 200 karakter.').nullish(),
  defaultPoints: z.number({ error: 'Poin default harus berupa angka.' }).int('Poin default harus bilangan bulat.')
    .min(0, 'Poin default tidak boleh negatif.').max(MAX_POINTS).default(0),
  isActive: z.boolean().default(true),
});
export const categoryPatchSchema = categorySchema.partial()
  .refine((v) => Object.keys(v).length > 0, { message: 'Tidak ada data yang diperbarui.' });

export const awardPointsSchema = z.object({
  participantId: z.string({ error: 'Peserta wajib dipilih.' }).min(1, 'Peserta wajib dipilih.'),
  categoryId: z.string({ error: 'Kategori wajib dipilih.' }).min(1, 'Kategori wajib dipilih.'),
  points: z.number({ error: 'Poin harus berupa angka.' }).int('Poin harus bilangan bulat.')
    .min(-MAX_POINTS, `Poin minimal -${MAX_POINTS}.`).max(MAX_POINTS, `Poin maksimal ${MAX_POINTS}.`)
    .refine((n) => n !== 0, 'Poin tidak boleh 0.').optional(),
  title: z.string().trim().min(2, 'Judul minimal 2 karakter.').max(120, 'Judul maksimal 120 karakter.').optional(),
  notes: z.string().trim().max(500, 'Catatan maksimal 500 karakter.').optional(),
});
