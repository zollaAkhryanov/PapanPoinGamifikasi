export type UserRole = 'peserta' | 'mentor';

export type LearningTrack = 'Frontend' | 'Backend' | 'UI/UX' | 'Data';

export type ParticipantStatus = 'aktif' | 'perlu_bimbingan' | 'selesai';

export type PageRoute = 'login' | 'dashboard' | 'leaderboard' | 'mentor';

export interface AuthUser {
  id: string;
  name: string;
  username: string;
  email: string;
  role: UserRole;
  avatarUrl?: string;
  track?: LearningTrack;
  cohort?: string;
}

export interface LoginPayload {
  identifier: string; // email atau username
  password: string;
}

export interface LoginResponse {
  token: string;
  user: AuthUser;
}

export interface ActivityItem {
  id: string;
  title: string;
  category: 'Modul' | 'Tugas' | 'Evaluasi' | 'Mentoring';
  pointsEarned: number;
  timestamp: string;
  notes?: string;
}

export interface AchievementItem {
  id: string;
  title: string;
  description: string;
  unlockedAt: string | null;
  pointsBonus: number;
}

export interface Participant {
  id: string;
  name: string;
  username: string;
  email: string;
  avatarUrl?: string;
  track: LearningTrack;
  cohort: string;
  mentorName: string;
  totalPoints: number;
  weeklyPointsDelta: number;
  level: number;
  completedModules: number;
  totalModules: number;
  status: ParticipantStatus;
  joinedAt: string;
  lastUpdatedAt: string;
  mentorNotes?: string;
  activities: ActivityItem[];
  achievements: AchievementItem[];
}

export interface LeaderboardEntry {
  rank: number;
  previousRank: number;
  participantId: string;
  name: string;
  username: string;
  avatarUrl?: string;
  track: LearningTrack;
  level: number;
  totalPoints: number;
  weeklyPointsDelta: number;
  status: ParticipantStatus;
}

export interface CreateParticipantPayload {
  name: string;
  email: string;
  username: string;
  track: LearningTrack;
  cohort: string;
  initialPoints: number;
  completedModules: number;
  totalModules: number;
  status: ParticipantStatus;
  mentorNotes?: string;
}

export interface UpdateParticipantPayload {
  name?: string;
  track?: LearningTrack;
  totalPoints?: number;
  pointsDelta?: number;
  activityTitle?: string;
  completedModules?: number;
  totalModules?: number;
  status?: ParticipantStatus;
  mentorNotes?: string;
}

export interface ToastMessage {
  id: string;
  type: 'success' | 'error' | 'warning' | 'info';
  title: string;
  description?: string;
}
