/**
 * Konfigurasi API terpusat untuk integrasi Frontend <-> Backend.
 *
 * Panduan Integrasi Backend:
 * 1. Atur `VITE_API_BASE_URL` di file `.env` (mis. `http://localhost:8000/api`).
 * 2. Pastikan backend mengembalikan JSON sesuai kontrak tipe pada `src/types/index.ts`.
 * 3. Jika `VITE_API_BASE_URL` kosong, aplikasi otomatis memakai placeholder adapter
 *    sementara agar seluruh fitur UI/UX tetap dapat diuji sebelum backend siap.
 */

export const API_CONFIG = {
  baseUrl: (import.meta.env.VITE_API_BASE_URL as string | undefined)?.trim() || '',
  timeoutMs: 10000,
  storageTokenKey: 'akademi_progres_auth_token',
  storageUserKey: 'akademi_progres_auth_user',
};

export const isBackendConfigured = (): boolean => Boolean(API_CONFIG.baseUrl);

export const API_ENDPOINTS = {
  auth: {
    login: '/auth/login',
    logout: '/auth/logout',
    me: '/auth/me',
  },
  participants: {
    me: '/participants/me',
    list: '/participants',
    create: '/participants',
    detail: (id: string) => `/participants/${encodeURIComponent(id)}`,
    update: (id: string) => `/participants/${encodeURIComponent(id)}`,
  },
  leaderboard: {
    list: '/leaderboard',
  },
} as const;
