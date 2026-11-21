import type { LearningTrack, ParticipantStatus, UserRole } from '../../src/types';

export interface UserRow {
  id: string;
  name: string;
  username: string;
  email: string;
  password_hash: string;
  role: UserRole;
  avatar_url: string | null;
  track: LearningTrack | null;
  cohort: string | null;
  status: ParticipantStatus;
  total_modules: number;
  completed_modules: number;
  mentor_notes: string | null;
  mentor_id: string | null;
  joined_at: string;
  updated_at: string;
}

export interface CategoryRow {
  id: string;
  name: string;
  description: string | null;
  default_points: number;
  is_active: boolean;
  created_at: string;
}

export interface PointEntryRow {
  id: string;
  user_id: string;
  category_id: string;
  title: string;
  points: number; // boleh negatif (koreksi mentor)
  notes: string | null;
  awarded_by: string | null;
  created_at: string;
}

export type NewUser = Omit<UserRow, 'id' | 'joined_at' | 'updated_at'>;
export type NewCategory = Omit<CategoryRow, 'id' | 'created_at'>;
export type NewEntry = Omit<PointEntryRow, 'id' | 'created_at'>;

/** Kontrak akses data. Implementasi: Supabase (produksi) & Memory (dev/test). */
export interface Repository {
  findUserByIdentifier(identifier: string): Promise<UserRow | null>;
  getUserById(id: string): Promise<UserRow | null>;
  listUsers(role?: UserRole): Promise<UserRow[]>;
  createUser(input: NewUser): Promise<UserRow>;
  updateUser(id: string, patch: Partial<Omit<UserRow, 'id'>>): Promise<UserRow | null>;

  listCategories(includeInactive: boolean): Promise<CategoryRow[]>;
  getCategory(id: string): Promise<CategoryRow | null>;
  getCategoryByName(name: string): Promise<CategoryRow | null>;
  createCategory(input: NewCategory): Promise<CategoryRow>;
  updateCategory(id: string, patch: Partial<Omit<CategoryRow, 'id'>>): Promise<CategoryRow | null>;
  deleteCategory(id: string): Promise<void>;
  countEntriesForCategory(id: string): Promise<number>;

  listEntries(userId?: string): Promise<PointEntryRow[]>;
  getEntry(id: string): Promise<PointEntryRow | null>;
  createEntry(input: NewEntry): Promise<PointEntryRow>;
  deleteEntry(id: string): Promise<void>;
}
