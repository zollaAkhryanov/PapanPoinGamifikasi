import { randomUUID } from 'node:crypto';
import { conflict } from '../lib/errors';
import type {
  CategoryRow, NewCategory, NewEntry, NewUser, PointEntryRow, Repository, UserRow,
} from './types';

export class MemoryRepository implements Repository {
  users: UserRow[] = [];
  categories: CategoryRow[] = [];
  entries: PointEntryRow[] = [];

  async findUserByIdentifier(identifier: string) {
    const id = identifier.trim().toLowerCase();
    return this.users.find((u) => u.email === id || u.username === id) ?? null;
  }
  async getUserById(id: string) {
    return this.users.find((u) => u.id === id) ?? null;
  }
  async listUsers(role?: UserRow['role']) {
    return this.users.filter((u) => !role || u.role === role);
  }
  async createUser(input: NewUser) {
    if (this.users.some((u) => u.email === input.email || u.username === input.username)) {
      throw conflict('Email atau username sudah terdaftar dalam sistem.', 'DUPLICATE_PARTICIPANT');
    }
    const now = new Date().toISOString();
    const row: UserRow = { ...input, id: randomUUID(), joined_at: now, updated_at: now };
    this.users.push(row);
    return row;
  }
  async updateUser(id: string, patch: Partial<Omit<UserRow, 'id'>>) {
    const u = this.users.find((x) => x.id === id);
    if (!u) return null;
    Object.assign(u, patch, { updated_at: new Date().toISOString() });
    return u;
  }

  async listCategories(includeInactive: boolean) {
    return this.categories
      .filter((c) => includeInactive || c.is_active)
      .sort((a, b) => a.name.localeCompare(b.name));
  }
  async getCategory(id: string) {
    return this.categories.find((c) => c.id === id) ?? null;
  }
  async getCategoryByName(name: string) {
    return this.categories.find((c) => c.name.toLowerCase() === name.toLowerCase()) ?? null;
  }
  async createCategory(input: NewCategory) {
    if (await this.getCategoryByName(input.name)) {
      throw conflict('Nama kategori sudah digunakan.', 'DUPLICATE_CATEGORY');
    }
    const row: CategoryRow = { ...input, id: randomUUID(), created_at: new Date().toISOString() };
    this.categories.push(row);
    return row;
  }
  async updateCategory(id: string, patch: Partial<Omit<CategoryRow, 'id'>>) {
    const c = this.categories.find((x) => x.id === id);
    if (!c) return null;
    if (patch.name && patch.name.toLowerCase() !== c.name.toLowerCase() && (await this.getCategoryByName(patch.name))) {
      throw conflict('Nama kategori sudah digunakan.', 'DUPLICATE_CATEGORY');
    }
    Object.assign(c, patch);
    return c;
  }
  async deleteCategory(id: string) {
    this.categories = this.categories.filter((c) => c.id !== id);
  }
  async countEntriesForCategory(id: string) {
    return this.entries.filter((e) => e.category_id === id).length;
  }

  async listEntries(userId?: string) {
    return this.entries.filter((e) => !userId || e.user_id === userId);
  }
  async getEntry(id: string) {
    return this.entries.find((e) => e.id === id) ?? null;
  }
  async createEntry(input: NewEntry) {
    const row: PointEntryRow = { ...input, id: randomUUID(), created_at: new Date().toISOString() };
    this.entries.push(row);
    return row;
  }
  async deleteEntry(id: string) {
    this.entries = this.entries.filter((e) => e.id !== id);
  }
}
