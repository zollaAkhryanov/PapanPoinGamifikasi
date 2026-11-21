import bcrypt from 'bcryptjs';
import type { Participant } from '../../src/types';
import { config } from '../config';
import { invalid, notFound } from '../lib/errors';
import type { CategoryRow, PointEntryRow, Repository, UserRow } from '../repositories/types';
import { buildParticipant, sumPoints } from './gamification';

export class AcademyService {
  constructor(private repo: Repository) {}

  private async mentorNames(users: UserRow[]): Promise<{ lookup: (u: UserRow) => string }> {
    const mentors = await this.repo.listUsers('mentor');
    const byId = new Map(mentors.map((m) => [m.id, m.name]));
    const fallback = mentors[0]?.name ?? 'Mentor';
    void users;
    return { lookup: (u) => (u.mentor_id && byId.get(u.mentor_id)) || fallback };
  }

  private async categoryMap(): Promise<Map<string, CategoryRow>> {
    return new Map((await this.repo.listCategories(true)).map((c) => [c.id, c]));
  }

  async getParticipant(id: string): Promise<Participant> {
    const user = await this.repo.getUserById(id);
    if (!user || user.role !== 'peserta') throw notFound('Data peserta tidak ditemukan.');
    const [entries, cats, names] = await Promise.all([
      this.repo.listEntries(id), this.categoryMap(), this.mentorNames([user]),
    ]);
    return buildParticipant(user, entries, cats, names.lookup(user));
  }

  async listParticipants(): Promise<Participant[]> {
    const users = await this.repo.listUsers('peserta');
    const [entries, cats, names] = await Promise.all([
      this.repo.listEntries(), this.categoryMap(), this.mentorNames(users),
    ]);
    const grouped = new Map<string, PointEntryRow[]>();
    for (const e of entries) (grouped.get(e.user_id) ?? grouped.set(e.user_id, []).get(e.user_id)!).push(e);
    return users
      .map((u) => buildParticipant(u, grouped.get(u.id) ?? [], cats, names.lookup(u)))
      .sort((a, b) => b.totalPoints - a.totalPoints || a.name.localeCompare(b.name));
  }

  async ensureCategory(name: string): Promise<CategoryRow> {
    const found = await this.repo.getCategoryByName(name);
    if (found) return found;
    return this.repo.createCategory({ name, description: null, default_points: 0, is_active: true });
  }

  async hashPassword(plain: string) {
    return bcrypt.hash(plain, config.bcryptRounds);
  }

  /**
   * Beri/koreksi poin. Menolak jika total hasil akhir akan negatif.
   * Total diturunkan dari SUM(point_entries) sehingga aman dari race condition "lost update".
   */
  async awardPoints(input: {
    userId: string; categoryId: string; points: number; title: string; notes?: string | null; awardedBy: string;
  }): Promise<PointEntryRow> {
    const current = sumPoints(await this.repo.listEntries(input.userId));
    if (current + input.points < 0) {
      throw invalid(`Poin tidak boleh membuat total menjadi negatif (total saat ini ${current}).`);
    }
    return this.repo.createEntry({
      user_id: input.userId,
      category_id: input.categoryId,
      title: input.title,
      points: input.points,
      notes: input.notes ?? null,
      awarded_by: input.awardedBy,
    });
  }
}
