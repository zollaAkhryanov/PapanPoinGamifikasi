import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import { conflict, HttpError } from '../lib/errors';
import type {
  CategoryRow, NewCategory, NewEntry, NewUser, PointEntryRow, Repository, UserRow,
} from './types';

type PgErr = { code?: string; message: string } | null;

function check(error: PgErr, duplicateMsg?: string, duplicateCode?: string) {
  if (!error) return;
  if (error.code === '23505' && duplicateMsg) throw conflict(duplicateMsg, duplicateCode);
  console.error('[supabase]', error.message);
  throw new HttpError(500, 'Terjadi kesalahan pada basis data.', 'DB_ERROR');
}

const MAX_ROWS = 10000;

export class SupabaseRepository implements Repository {
  private db: SupabaseClient;

  constructor(url: string, serviceKey: string) {
    this.db = createClient(url, serviceKey, { auth: { persistSession: false, autoRefreshToken: false } });
  }

  async findUserByIdentifier(identifier: string) {
    const id = identifier.trim().toLowerCase();
    // Dua query terpisah dengan .eq() (bukan .or() berbasis string) agar tidak rentan filter-injection.
    for (const column of ['username', 'email'] as const) {
      const { data, error } = await this.db.from('users').select('*').eq(column, id).limit(1);
      check(error);
      if (data?.[0]) return data[0] as UserRow;
    }
    return null;
  }
  async getUserById(id: string) {
    const { data, error } = await this.db.from('users').select('*').eq('id', id).maybeSingle();
    check(error);
    return (data as UserRow) ?? null;
  }
  async listUsers(role?: UserRow['role']) {
    let q = this.db.from('users').select('*').range(0, MAX_ROWS - 1);
    if (role) q = q.eq('role', role);
    const { data, error } = await q;
    check(error);
    return (data ?? []) as UserRow[];
  }
  async createUser(input: NewUser) {
    const { data, error } = await this.db.from('users').insert(input).select().single();
    check(error, 'Email atau username sudah terdaftar dalam sistem.', 'DUPLICATE_PARTICIPANT');
    return data as UserRow;
  }
  async updateUser(id: string, patch: Partial<Omit<UserRow, 'id'>>) {
    const { data, error } = await this.db
      .from('users').update({ ...patch, updated_at: new Date().toISOString() }).eq('id', id).select().maybeSingle();
    check(error);
    return (data as UserRow) ?? null;
  }

  async listCategories(includeInactive: boolean) {
    let q = this.db.from('activity_categories').select('*').order('name');
    if (!includeInactive) q = q.eq('is_active', true);
    const { data, error } = await q;
    check(error);
    return (data ?? []) as CategoryRow[];
  }
  async getCategory(id: string) {
    const { data, error } = await this.db.from('activity_categories').select('*').eq('id', id).maybeSingle();
    check(error);
    return (data as CategoryRow) ?? null;
  }
  async getCategoryByName(name: string) {
    const { data, error } = await this.db.from('activity_categories').select('*').ilike('name', name).limit(1);
    check(error);
    return (data?.[0] as CategoryRow) ?? null;
  }
  async createCategory(input: NewCategory) {
    const { data, error } = await this.db.from('activity_categories').insert(input).select().single();
    check(error, 'Nama kategori sudah digunakan.', 'DUPLICATE_CATEGORY');
    return data as CategoryRow;
  }
  async updateCategory(id: string, patch: Partial<Omit<CategoryRow, 'id'>>) {
    const { data, error } = await this.db
      .from('activity_categories').update(patch).eq('id', id).select().maybeSingle();
    check(error, 'Nama kategori sudah digunakan.', 'DUPLICATE_CATEGORY');
    return (data as CategoryRow) ?? null;
  }
  async deleteCategory(id: string) {
    const { error } = await this.db.from('activity_categories').delete().eq('id', id);
    check(error);
  }
  async countEntriesForCategory(id: string) {
    const { count, error } = await this.db
      .from('point_entries').select('id', { count: 'exact', head: true }).eq('category_id', id);
    check(error);
    return count ?? 0;
  }

  async listEntries(userId?: string) {
    let q = this.db.from('point_entries').select('*').order('created_at', { ascending: false }).range(0, MAX_ROWS - 1);
    if (userId) q = q.eq('user_id', userId);
    const { data, error } = await q;
    check(error);
    return (data ?? []) as PointEntryRow[];
  }
  async getEntry(id: string) {
    const { data, error } = await this.db.from('point_entries').select('*').eq('id', id).maybeSingle();
    check(error);
    return (data as PointEntryRow) ?? null;
  }
  async createEntry(input: NewEntry) {
    const { data, error } = await this.db.from('point_entries').insert(input).select().single();
    check(error);
    return data as PointEntryRow;
  }
  async deleteEntry(id: string) {
    const { error } = await this.db.from('point_entries').delete().eq('id', id);
    check(error);
  }
}
