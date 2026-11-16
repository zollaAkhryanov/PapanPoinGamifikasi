import {
  AuthUser,
  CreateParticipantPayload,
  LeaderboardEntry,
  LoginPayload,
  LoginResponse,
  Participant,
  UpdateParticipantPayload,
} from '../types';
import { calculateLevelInfo } from '../utils/levelUtils';
import { ApiClientError } from './apiClient';

/**
 * Placeholder Data Adapter (Sementara sebelum endpoint Backend tersedia).
 * Memungkinkan pengujian penuh alur Login, Dashboard Peserta, Leaderboard,
 * dan Panel Mentor secara interaktif dengan penyimpanan lokal sesi.
 */

const STORAGE_PARTICIPANTS_KEY = 'akademi_progres_placeholder_participants_v1';

interface DemoAccountRecord {
  user: AuthUser;
  password: string;
}

export const DEMO_ACCOUNTS: DemoAccountRecord[] = [
  {
    password: 'password123',
    user: {
      id: 'p-01',
      name: 'Raka Pratama',
      username: 'raka.pratama',
      email: 'raka.pratama@akademi.id',
      role: 'peserta',
      avatarUrl: '/src/assets/images/avatar_peserta_satu_1794843872994.jpg',
      track: 'Frontend',
      cohort: 'Angkatan 08',
    },
  },
  {
    password: 'mentor123',
    user: {
      id: 'm-01',
      name: 'Budi Santoso',
      username: 'budi.mentor',
      email: 'mentor@akademi.id',
      role: 'mentor',
      avatarUrl: '/src/assets/images/avatar_mentor_utama_1794843874612.jpg',
      cohort: 'Angkatan 08',
    },
  },
];

const INITIAL_PARTICIPANTS: Participant[] = [
  {
    id: 'p-02',
    name: 'Nadia Kusuma',
    username: 'nadia.kusuma',
    email: 'nadia.kusuma@akademi.id',
    avatarUrl: '/src/assets/images/avatar_peserta_dua_1794843873305.jpg',
    track: 'UI/UX',
    cohort: 'Angkatan 08',
    mentorName: 'Budi Santoso',
    totalPoints: 2640,
    weeklyPointsDelta: 320,
    level: 5,
    completedModules: 18,
    totalModules: 20,
    status: 'aktif',
    joinedAt: '2026-08-14T08:00:00Z',
    lastUpdatedAt: '2026-11-15T14:20:00Z',
    mentorNotes: 'Konsisten menyelesaikan studi kasus desain sistem tepat waktu.',
    activities: [
      {
        id: 'act-201',
        title: 'Audit Aksesibilitas & Kontras WCAG AA',
        category: 'Tugas',
        pointsEarned: 180,
        timestamp: '2026-11-15T14:20:00Z',
        notes: 'Skor review mentor sangat baik.',
      },
      {
        id: 'act-202',
        title: 'Sesi Mentoring Sprint Ke-7',
        category: 'Mentoring',
        pointsEarned: 140,
        timestamp: '2026-11-13T10:00:00Z',
      },
    ],
    achievements: [
      {
        id: 'ach-1',
        title: 'Ketuntasan Modul Pertama',
        description: 'Menyelesaikan 5 modul inti tanpa keterlambatan.',
        unlockedAt: '2026-09-02T09:00:00Z',
        pointsBonus: 100,
      },
      {
        id: 'ach-2',
        title: 'Pencapaian Level Mahir',
        description: 'Mencapai total 2.300 poin kompetensi.',
        unlockedAt: '2026-11-10T16:30:00Z',
        pointsBonus: 200,
      },
    ],
  },
  {
    id: 'p-01',
    name: 'Raka Pratama',
    username: 'raka.pratama',
    email: 'raka.pratama@akademi.id',
    avatarUrl: '/src/assets/images/avatar_peserta_satu_1794843872994.jpg',
    track: 'Frontend',
    cohort: 'Angkatan 08',
    mentorName: 'Budi Santoso',
    totalPoints: 2150,
    weeklyPointsDelta: 240,
    level: 4,
    completedModules: 15,
    totalModules: 20,
    status: 'aktif',
    joinedAt: '2026-08-14T08:00:00Z',
    lastUpdatedAt: '2026-11-15T11:45:00Z',
    mentorNotes: 'Implementasi komponen React sudah rapi; fokus berikutnya pada optimasi state API.',
    activities: [
      {
        id: 'act-101',
        title: 'Integrasi Tabel Data Responsif & State Error',
        category: 'Tugas',
        pointsEarned: 150,
        timestamp: '2026-11-15T11:45:00Z',
        notes: 'Validasi form dan skeleton loading sudah terpenuhi.',
      },
      {
        id: 'act-102',
        title: 'Modul Manajemen State Terpusat',
        category: 'Modul',
        pointsEarned: 90,
        timestamp: '2026-11-14T16:15:00Z',
      },
      {
        id: 'act-103',
        title: 'Evaluasi Tengah Semester Frontend',
        category: 'Evaluasi',
        pointsEarned: 210,
        timestamp: '2026-11-10T09:30:00Z',
        notes: 'Lulus dengan catatan arsitektur komponen modular.',
      },
      {
        id: 'act-104',
        title: 'Review Kode Bersama Mentor',
        category: 'Mentoring',
        pointsEarned: 100,
        timestamp: '2026-11-07T13:00:00Z',
      },
    ],
    achievements: [
      {
        id: 'ach-101',
        title: 'Fondasi Kokoh',
        description: 'Menyelesaikan seluruh modul dasar Frontend Engineering.',
        unlockedAt: '2026-09-05T10:00:00Z',
        pointsBonus: 100,
      },
      {
        id: 'ach-102',
        title: 'Konsisten Mingguan',
        description: 'Aktif mengumpulkan tugas selama 4 pekan berturut-turut.',
        unlockedAt: '2026-10-18T17:00:00Z',
        pointsBonus: 150,
      },
      {
        id: 'ach-103',
        title: 'Menuju Level Mahir',
        description: 'Kumpulkan 2.300 poin untuk membuka lencana Mahir.',
        unlockedAt: null,
        pointsBonus: 200,
      },
    ],
  },
  {
    id: 'p-03',
    name: 'Dimas Wijaya',
    username: 'dimas.wijaya',
    email: 'dimas.wijaya@akademi.id',
    avatarUrl: '/src/assets/images/avatar_peserta_tiga_1794843873866.jpg',
    track: 'Data',
    cohort: 'Angkatan 08',
    mentorName: 'Budi Santoso',
    totalPoints: 1980,
    weeklyPointsDelta: 190,
    level: 4,
    completedModules: 14,
    totalModules: 20,
    status: 'aktif',
    joinedAt: '2026-08-15T08:00:00Z',
    lastUpdatedAt: '2026-11-14T18:10:00Z',
    mentorNotes: 'Analisis SQL & visualisasi data sudah kuat.',
    activities: [
      {
        id: 'act-301',
        title: 'Pipeline Pembersihan Data Cohort',
        category: 'Tugas',
        pointsEarned: 190,
        timestamp: '2026-11-14T18:10:00Z',
      },
    ],
    achievements: [
      {
        id: 'ach-301',
        title: 'Analis Teliti',
        description: 'Akurasi kueri di atas 95% pada evaluasi data.',
        unlockedAt: '2026-10-11T12:00:00Z',
        pointsBonus: 120,
      },
    ],
  },
  {
    id: 'p-04',
    name: 'Siti Rahmawati',
    username: 'siti.rahma',
    email: 'siti.rahma@akademi.id',
    track: 'Backend',
    cohort: 'Angkatan 08',
    mentorName: 'Budi Santoso',
    totalPoints: 1740,
    weeklyPointsDelta: 150,
    level: 4,
    completedModules: 13,
    totalModules: 20,
    status: 'aktif',
    joinedAt: '2026-08-16T08:00:00Z',
    lastUpdatedAt: '2026-11-13T15:40:00Z',
    mentorNotes: 'Struktur endpoint REST API sudah terstandar dengan validasi input.',
    activities: [
      {
        id: 'act-401',
        title: 'Implementasi Middleware Autentikasi JWT',
        category: 'Tugas',
        pointsEarned: 150,
        timestamp: '2026-11-13T15:40:00Z',
      },
    ],
    achievements: [],
  },
  {
    id: 'p-05',
    name: 'Bagus Setiawan',
    username: 'bagus.setiawan',
    email: 'bagus.setiawan@akademi.id',
    track: 'Frontend',
    cohort: 'Angkatan 08',
    mentorName: 'Budi Santoso',
    totalPoints: 1420,
    weeklyPointsDelta: 110,
    level: 3,
    completedModules: 11,
    totalModules: 20,
    status: 'aktif',
    joinedAt: '2026-08-16T08:00:00Z',
    lastUpdatedAt: '2026-11-12T09:20:00Z',
    mentorNotes: 'Progres stabil di modul integrasi komponen.',
    activities: [],
    achievements: [],
  },
  {
    id: 'p-06',
    name: 'Ayu Lestari',
    username: 'ayu.lestari',
    email: 'ayu.lestari@akademi.id',
    track: 'UI/UX',
    cohort: 'Angkatan 08',
    mentorName: 'Budi Santoso',
    totalPoints: 1180,
    weeklyPointsDelta: 80,
    level: 3,
    completedModules: 9,
    totalModules: 20,
    status: 'perlu_bimbingan',
    joinedAt: '2026-08-18T08:00:00Z',
    lastUpdatedAt: '2026-11-10T11:00:00Z',
    mentorNotes: 'Perlu sesi tambahan untuk penyusunan wireframe responsif mobile.',
    activities: [],
    achievements: [],
  },
  {
    id: 'p-07',
    name: 'Fajar Nugroho',
    username: 'fajar.nugroho',
    email: 'fajar.nugroho@akademi.id',
    track: 'Backend',
    cohort: 'Angkatan 08',
    mentorName: 'Budi Santoso',
    totalPoints: 890,
    weeklyPointsDelta: 60,
    level: 2,
    completedModules: 7,
    totalModules: 20,
    status: 'perlu_bimbingan',
    joinedAt: '2026-08-20T08:00:00Z',
    lastUpdatedAt: '2026-11-08T14:15:00Z',
    mentorNotes: 'Tertinggal 2 modul skema basis data; dijadwalkan mentoring pekan ini.',
    activities: [],
    achievements: [],
  },
];

function wait(ms: number): Promise<void> {
  return new Promise((resolve) => window.setTimeout(resolve, ms));
}

function loadParticipantsStore(): Participant[] {
  try {
    const raw = localStorage.getItem(STORAGE_PARTICIPANTS_KEY);
    if (!raw) {
      localStorage.setItem(STORAGE_PARTICIPANTS_KEY, JSON.stringify(INITIAL_PARTICIPANTS));
      return structuredClone(INITIAL_PARTICIPANTS);
    }
    const parsed = JSON.parse(raw) as Participant[];
    if (Array.isArray(parsed) && parsed.length > 0) {
      return parsed;
    }
  } catch {
    // Abaikan kesalahan localStorage dan pakai salinan memori
  }
  return structuredClone(INITIAL_PARTICIPANTS);
}

function saveParticipantsStore(participants: Participant[]): void {
  try {
    localStorage.setItem(STORAGE_PARTICIPANTS_KEY, JSON.stringify(participants));
  } catch {
    // Abaikan jika kuota penyimpanan penuh
  }
}

export const placeholderAdapter = {
  async login(payload: LoginPayload): Promise<LoginResponse> {
    await wait(450);
    const normalizedId = payload.identifier.trim().toLowerCase();
    const match = DEMO_ACCOUNTS.find(
      (acc) =>
        acc.user.email.toLowerCase() === normalizedId ||
        acc.user.username.toLowerCase() === normalizedId
    );

    if (!match || match.password !== payload.password) {
      throw new ApiClientError(
        'Email/username atau kata sandi tidak sesuai. Periksa kembali kredensial Anda.',
        401,
        'INVALID_CREDENTIALS'
      );
    }

    return {
      token: `demo-jwt-${match.user.id}-${Date.now()}`,
      user: match.user,
    };
  },

  async getMyParticipant(user: AuthUser): Promise<Participant> {
    await wait(350);
    const store = loadParticipantsStore();
    const found = store.find(
      (p) => p.id === user.id || p.email.toLowerCase() === user.email.toLowerCase()
    );
    if (found) {
      return found;
    }
    // Jika mentor membuka Dashboard Peserta untuk pratinjau, tampilkan profil peserta utama
    return store.find((p) => p.id === 'p-01') ?? store[0];
  },

  async getParticipants(): Promise<Participant[]> {
    await wait(380);
    const store = loadParticipantsStore();
    return [...store].sort((a, b) => b.totalPoints - a.totalPoints);
  },

  async getLeaderboard(): Promise<LeaderboardEntry[]> {
    await wait(360);
    const store = loadParticipantsStore();
    const sorted = [...store].sort((a, b) => b.totalPoints - a.totalPoints);
    return sorted.map((p, index) => ({
      rank: index + 1,
      previousRank: index + 1,
      participantId: p.id,
      name: p.name,
      username: p.username,
      avatarUrl: p.avatarUrl,
      track: p.track,
      level: calculateLevelInfo(p.totalPoints).level,
      totalPoints: p.totalPoints,
      weeklyPointsDelta: p.weeklyPointsDelta,
      status: p.status,
    }));
  },

  async createParticipant(payload: CreateParticipantPayload): Promise<Participant> {
    await wait(420);
    const store = loadParticipantsStore();
    const duplicate = store.some(
      (p) =>
        p.email.toLowerCase() === payload.email.trim().toLowerCase() ||
        p.username.toLowerCase() === payload.username.trim().toLowerCase()
    );
    if (duplicate) {
      throw new ApiClientError(
        'Email atau username peserta sudah terdaftar dalam sistem.',
        409,
        'DUPLICATE_PARTICIPANT'
      );
    }

    const now = new Date().toISOString();
    const levelInfo = calculateLevelInfo(payload.initialPoints);
    const created: Participant = {
      id: `p-${Date.now()}`,
      name: payload.name.trim(),
      username: payload.username.trim().toLowerCase(),
      email: payload.email.trim().toLowerCase(),
      track: payload.track,
      cohort: payload.cohort.trim() || 'Angkatan 08',
      mentorName: 'Budi Santoso',
      totalPoints: Math.max(0, payload.initialPoints),
      weeklyPointsDelta: Math.max(0, payload.initialPoints),
      level: levelInfo.level,
      completedModules: Math.min(payload.completedModules, payload.totalModules),
      totalModules: Math.max(1, payload.totalModules),
      status: payload.status,
      joinedAt: now,
      lastUpdatedAt: now,
      mentorNotes: payload.mentorNotes?.trim() || undefined,
      activities:
        payload.initialPoints > 0
          ? [
              {
                id: `act-${Date.now()}`,
                title: 'Poin Awal Penempatan Kelas',
                category: 'Mentoring',
                pointsEarned: payload.initialPoints,
                timestamp: now,
              },
            ]
          : [],
      achievements: [],
    };

    const updated = [created, ...store];
    saveParticipantsStore(updated);
    return created;
  },

  async updateParticipant(
    participantId: string,
    payload: UpdateParticipantPayload
  ): Promise<Participant> {
    await wait(400);
    const store = loadParticipantsStore();
    const idx = store.findIndex((p) => p.id === participantId);
    if (idx === -1) {
      throw new ApiClientError('Data peserta tidak ditemukan.', 404, 'NOT_FOUND');
    }

    const existing = store[idx];
    const now = new Date().toISOString();

    let nextPoints = existing.totalPoints;
    let nextWeeklyDelta = existing.weeklyPointsDelta;
    const nextActivities = [...existing.activities];

    if (typeof payload.pointsDelta === 'number' && payload.pointsDelta !== 0) {
      nextPoints = Math.max(0, existing.totalPoints + payload.pointsDelta);
      nextWeeklyDelta = existing.weeklyPointsDelta + payload.pointsDelta;
      nextActivities.unshift({
        id: `act-${Date.now()}`,
        title:
          payload.activityTitle?.trim() ||
          (payload.pointsDelta > 0
            ? 'Penambahan Poin Evaluasi Mentor'
            : 'Penyesuaian Poin oleh Mentor'),
        category: 'Mentoring',
        pointsEarned: payload.pointsDelta,
        timestamp: now,
        notes: payload.mentorNotes?.trim() || undefined,
      });
    } else if (typeof payload.totalPoints === 'number') {
      const diff = payload.totalPoints - existing.totalPoints;
      nextPoints = Math.max(0, payload.totalPoints);
      nextWeeklyDelta = existing.weeklyPointsDelta + diff;
      if (diff !== 0) {
        nextActivities.unshift({
          id: `act-${Date.now()}`,
          title: payload.activityTitle?.trim() || 'Pembaruan Total Poin oleh Mentor',
          category: 'Mentoring',
          pointsEarned: diff,
          timestamp: now,
        });
      }
    }

    const computedLevel = calculateLevelInfo(nextPoints).level;
    const nextTotalModules = payload.totalModules ?? existing.totalModules;
    const nextCompletedModules = Math.min(
      payload.completedModules ?? existing.completedModules,
      nextTotalModules
    );

    const updatedParticipant: Participant = {
      ...existing,
      name: payload.name?.trim() || existing.name,
      track: payload.track ?? existing.track,
      totalPoints: nextPoints,
      weeklyPointsDelta: nextWeeklyDelta,
      level: computedLevel,
      completedModules: Math.max(0, nextCompletedModules),
      totalModules: Math.max(1, nextTotalModules),
      status: payload.status ?? existing.status,
      mentorNotes:
        payload.mentorNotes !== undefined ? payload.mentorNotes.trim() : existing.mentorNotes,
      lastUpdatedAt: now,
      activities: nextActivities.slice(0, 12),
    };

    const nextStore = [...store];
    nextStore[idx] = updatedParticipant;
    saveParticipantsStore(nextStore);
    return updatedParticipant;
  },
};
