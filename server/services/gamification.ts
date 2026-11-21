import type {
  AchievementItem, ActivityItem, LeaderboardEntry, Participant,
} from '../../src/types';
import { calculateLevelInfo } from '../../src/utils/levelUtils';
import type { CategoryRow, PointEntryRow, UserRow } from '../repositories/types';

const WEEK_MS = 7 * 24 * 60 * 60 * 1000;
const MAX_ACTIVITIES = 20;

export const sumPoints = (entries: PointEntryRow[]) =>
  Math.max(0, entries.reduce((acc, e) => acc + e.points, 0));

/** Total poin SELALU dihitung dari point_entries (single source of truth), tidak disimpan. */
function deriveAchievements(user: UserRow, entries: PointEntryRow[], total: number): AchievementItem[] {
  const asc = [...entries].sort((a, b) => a.created_at.localeCompare(b.created_at));
  const dateWhenReached = (target: number): string | null => {
    let run = 0;
    for (const e of asc) {
      run += e.points;
      if (run >= target) return e.created_at;
    }
    return null;
  };
  const firstPositive = asc.find((e) => e.points > 0)?.created_at ?? null;
  const halfDone = user.total_modules > 0 && user.completed_modules * 2 >= user.total_modules;
  return [
    {
      id: 'ach-first-points',
      title: 'Langkah Pertama',
      description: 'Memperoleh poin pertama dari aktivitas belajar.',
      unlockedAt: firstPositive,
      pointsBonus: 50,
    },
    {
      id: 'ach-half-modules',
      title: 'Separuh Jalan',
      description: 'Menyelesaikan minimal 50% modul pada jalur belajar.',
      unlockedAt: halfDone ? user.updated_at : null,
      pointsBonus: 100,
    },
    {
      id: 'ach-level-3',
      title: 'Pencapaian Level Praktisi',
      description: 'Mencapai total 1.000 poin kompetensi.',
      unlockedAt: total >= 1000 ? dateWhenReached(1000) : null,
      pointsBonus: 150,
    },
    {
      id: 'ach-level-5',
      title: 'Pencapaian Level Mahir',
      description: 'Mencapai total 2.300 poin kompetensi.',
      unlockedAt: total >= 2300 ? dateWhenReached(2300) : null,
      pointsBonus: 200,
    },
  ];
}

export function buildParticipant(
  user: UserRow,
  entries: PointEntryRow[],
  categories: Map<string, CategoryRow>,
  mentorName: string,
  now = Date.now()
): Participant {
  const total = sumPoints(entries);
  const weekly = entries
    .filter((e) => now - Date.parse(e.created_at) <= WEEK_MS)
    .reduce((a, e) => a + e.points, 0);
  const activities: ActivityItem[] = [...entries]
    .sort((a, b) => b.created_at.localeCompare(a.created_at))
    .slice(0, MAX_ACTIVITIES)
    .map((e) => ({
      id: e.id,
      title: e.title,
      category: (categories.get(e.category_id)?.name ?? 'Mentoring') as ActivityItem['category'],
      pointsEarned: e.points,
      timestamp: e.created_at,
      notes: e.notes ?? undefined,
    }));

  return {
    id: user.id,
    name: user.name,
    username: user.username,
    email: user.email,
    avatarUrl: user.avatar_url ?? undefined,
    track: user.track ?? 'Frontend',
    cohort: user.cohort ?? '',
    mentorName,
    totalPoints: total,
    weeklyPointsDelta: weekly,
    level: calculateLevelInfo(total).level,
    completedModules: user.completed_modules,
    totalModules: user.total_modules,
    status: user.status,
    joinedAt: user.joined_at,
    lastUpdatedAt: entries.length
      ? [...entries].sort((a, b) => b.created_at.localeCompare(a.created_at))[0].created_at
      : user.updated_at,
    mentorNotes: user.mentor_notes ?? undefined,
    activities,
    achievements: deriveAchievements(user, entries, total),
  };
}

/** Peringkat kompetisi standar: poin sama => peringkat sama. */
function rankMap(totals: Map<string, number>): Map<string, number> {
  const values = [...totals.values()];
  const ranks = new Map<string, number>();
  for (const [id, pts] of totals) ranks.set(id, 1 + values.filter((v) => v > pts).length);
  return ranks;
}

export function buildLeaderboard(
  participants: UserRow[],
  entries: PointEntryRow[],
  now = Date.now()
): LeaderboardEntry[] {
  const byUser = new Map<string, PointEntryRow[]>();
  for (const p of participants) byUser.set(p.id, []);
  for (const e of entries) byUser.get(e.user_id)?.push(e);

  const current = new Map<string, number>();
  const lastWeek = new Map<string, number>();
  const weekly = new Map<string, number>();
  for (const p of participants) {
    const list = byUser.get(p.id)!;
    current.set(p.id, sumPoints(list));
    lastWeek.set(p.id, sumPoints(list.filter((e) => now - Date.parse(e.created_at) > WEEK_MS)));
    weekly.set(
      p.id,
      list.filter((e) => now - Date.parse(e.created_at) <= WEEK_MS).reduce((a, e) => a + e.points, 0)
    );
  }
  const rank = rankMap(current);
  const prevRank = rankMap(lastWeek);

  return participants
    .map((p) => ({
      rank: rank.get(p.id)!,
      previousRank: prevRank.get(p.id)!,
      participantId: p.id,
      name: p.name,
      username: p.username,
      avatarUrl: p.avatar_url ?? undefined,
      track: p.track ?? 'Frontend',
      level: calculateLevelInfo(current.get(p.id)!).level,
      totalPoints: current.get(p.id)!,
      weeklyPointsDelta: weekly.get(p.id)!,
      status: p.status,
    }))
    .sort((a, b) => a.rank - b.rank || a.name.localeCompare(b.name));
}
