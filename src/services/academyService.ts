import { API_CONFIG, API_ENDPOINTS, isBackendConfigured } from '../config/apiConfig';
import {
  AuthUser,
  CreateParticipantPayload,
  LeaderboardEntry,
  LoginPayload,
  LoginResponse,
  Participant,
  UpdateParticipantPayload,
} from '../types';
import { apiRequest } from './apiClient';
import { placeholderAdapter } from './placeholderAdapter';

/**
 * Service Layer terpusat untuk seluruh halaman aplikasi.
 * Otomatis memanggil API Backend saat VITE_API_BASE_URL tersedia,
 * atau memakai placeholderAdapter saat backend belum dihubungkan.
 */
export const academyService = {
  async login(payload: LoginPayload): Promise<LoginResponse> {
    const response = isBackendConfigured()
      ? await apiRequest<LoginResponse>(API_ENDPOINTS.auth.login, {
          method: 'POST',
          body: JSON.stringify(payload),
          skipAuth: true,
        })
      : await placeholderAdapter.login(payload);

    try {
      localStorage.setItem(API_CONFIG.storageTokenKey, response.token);
      localStorage.setItem(API_CONFIG.storageUserKey, JSON.stringify(response.user));
    } catch {
      // Abaikan jika penyimpanan lokal diblokir
    }

    return response;
  },

  async logout(): Promise<void> {
    if (isBackendConfigured()) {
      try {
        await apiRequest<void>(API_ENDPOINTS.auth.logout, { method: 'POST' });
      } catch {
        // Tetap bersihkan sesi klien meskipun endpoint logout gagal
      }
    }
    try {
      localStorage.removeItem(API_CONFIG.storageTokenKey);
      localStorage.removeItem(API_CONFIG.storageUserKey);
    } catch {
      // Abaikan
    }
  },

  getStoredSession(): { token: string; user: AuthUser } | null {
    try {
      const token = localStorage.getItem(API_CONFIG.storageTokenKey);
      const userRaw = localStorage.getItem(API_CONFIG.storageUserKey);
      if (!token || !userRaw) return null;
      return { token, user: JSON.parse(userRaw) as AuthUser };
    } catch {
      return null;
    }
  },

  async getMyDashboard(user: AuthUser): Promise<Participant> {
    if (isBackendConfigured()) {
      return apiRequest<Participant>(API_ENDPOINTS.participants.me);
    }
    return placeholderAdapter.getMyParticipant(user);
  },

  async getLeaderboard(): Promise<LeaderboardEntry[]> {
    if (isBackendConfigured()) {
      return apiRequest<LeaderboardEntry[]>(API_ENDPOINTS.leaderboard.list);
    }
    return placeholderAdapter.getLeaderboard();
  },

  async getParticipants(): Promise<Participant[]> {
    if (isBackendConfigured()) {
      return apiRequest<Participant[]>(API_ENDPOINTS.participants.list);
    }
    return placeholderAdapter.getParticipants();
  },

  async createParticipant(payload: CreateParticipantPayload): Promise<Participant> {
    if (isBackendConfigured()) {
      return apiRequest<Participant>(API_ENDPOINTS.participants.create, {
        method: 'POST',
        body: JSON.stringify(payload),
      });
    }
    return placeholderAdapter.createParticipant(payload);
  },

  async updateParticipant(
    participantId: string,
    payload: UpdateParticipantPayload
  ): Promise<Participant> {
    if (isBackendConfigured()) {
      return apiRequest<Participant>(API_ENDPOINTS.participants.update(participantId), {
        method: 'PATCH',
        body: JSON.stringify(payload),
      });
    }
    return placeholderAdapter.updateParticipant(participantId, payload);
  },
};
