import { Award, Medal, RefreshCw, Search, Trophy } from 'lucide-react';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { RankingTable } from '../components/domain/RankingTable';
import { AlertBanner } from '../components/ui/AlertBanner';
import { Avatar } from '../components/ui/Avatar';
import { Badge } from '../components/ui/Badge';
import { Button } from '../components/ui/Button';
import { Card, CardBody } from '../components/ui/Card';
import { Skeleton } from '../components/ui/Skeleton';
import { academyService } from '../services/academyService';
import { AuthUser, LeaderboardEntry, LearningTrack } from '../types';
import { formatPoints } from '../utils/levelUtils';

interface LeaderboardPageProps {
  user: AuthUser;
}

const TRACK_FILTERS: ('Semua' | LearningTrack)[] = [
  'Semua',
  'Frontend',
  'Backend',
  'UI/UX',
  'Data',
];

export function LeaderboardPage({ user }: LeaderboardPageProps) {
  const [entries, setEntries] = useState<LeaderboardEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTrack, setSelectedTrack] = useState<'Semua' | LearningTrack>('Semua');

  const loadLeaderboard = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await academyService.getLeaderboard();
      setEntries(data);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : 'Gagal mengambil data papan peringkat dari server.'
      );
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadLeaderboard();
  }, [loadLeaderboard]);

  const topThree = useMemo(() => entries.slice(0, 3), [entries]);

  const filteredEntries = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    return entries.filter((item) => {
      const matchesTrack = selectedTrack === 'Semua' || item.track === selectedTrack;
      const matchesQuery =
        !query ||
        item.name.toLowerCase().includes(query) ||
        item.username.toLowerCase().includes(query) ||
        item.track.toLowerCase().includes(query);
      return matchesTrack && matchesQuery;
    });
  }, [entries, searchQuery, selectedTrack]);

  const resetFilters = () => {
    setSearchQuery('');
    setSelectedTrack('Semua');
  };

  return (
    <div className="space-y-6">
      {/* Page Intro */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="font-display text-xl font-bold text-slate-900 sm:text-2xl">
            Papan Peringkat Peserta
          </h2>
          <p className="mt-1 text-sm text-slate-600">
            Peringkat diperbarui berdasarkan akumulasi poin modul, tugas, dan evaluasi mentor.
          </p>
        </div>
        <Button
          variant="secondary"
          size="sm"
          onClick={() => void loadLeaderboard()}
          isLoading={isLoading}
          leftIcon={<RefreshCw className="h-3.5 w-3.5" />}
        >
          Perbarui Data
        </Button>
      </div>

      {error && (
        <AlertBanner
          variant="error"
          title="Gagal Memuat Leaderboard"
          description={error}
          onRetry={() => void loadLeaderboard()}
        />
      )}

      {/* Top 3 Podium Cards */}
      {isLoading ? (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
          <Skeleton className="h-36 w-full rounded-xl" />
          <Skeleton className="h-36 w-full rounded-xl" />
          <Skeleton className="h-36 w-full rounded-xl" />
        </div>
      ) : (
        topThree.length > 0 && (
          <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
            {topThree.map((entry) => {
              const isGold = entry.rank === 1;
              const isSilver = entry.rank === 2;
              const isCurrentUser = entry.participantId === user.id;

              return (
                <Card
                  key={entry.participantId}
                  className={
                    isGold
                      ? 'border-amber-300 bg-amber-50/30'
                      : isSilver
                      ? 'border-slate-300 bg-slate-50/40'
                      : 'border-orange-200 bg-orange-50/20'
                  }
                >
                  <CardBody className="flex flex-col justify-between gap-4">
                    <div className="flex items-start justify-between gap-3">
                      <Badge
                        variant={isGold ? 'gold' : isSilver ? 'silver' : 'bronze'}
                        icon={
                          isGold ? (
                            <Trophy className="h-3.5 w-3.5 text-amber-600" />
                          ) : isSilver ? (
                            <Medal className="h-3.5 w-3.5 text-slate-600" />
                          ) : (
                            <Award className="h-3.5 w-3.5 text-orange-700" />
                          )
                        }
                      >
                        Peringkat #{entry.rank}
                      </Badge>
                      {isCurrentUser && <Badge variant="info">Anda</Badge>}
                    </div>

                    <div className="flex items-center gap-3 min-w-0">
                      <Avatar src={entry.avatarUrl} name={entry.name} size="lg" />
                      <div className="min-w-0">
                        <p className="font-display text-base font-bold text-slate-900 truncate">
                          {entry.name}
                        </p>
                        <p className="text-xs text-slate-600 truncate">
                          {entry.track} · Level {entry.level}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-baseline justify-between border-t border-slate-200/70 pt-3">
                      <span className="text-xs text-slate-500">Total Akumulasi</span>
                      <span className="font-mono text-lg font-bold text-slate-900 tabular-nums">
                        {formatPoints(entry.totalPoints)} Poin
                      </span>
                    </div>
                  </CardBody>
                </Card>
              );
            })}
          </div>
        )
      )}

      {/* Search & Track Filter Toolbar */}
      <div className="flex flex-col gap-3 rounded-xl border border-slate-200 bg-white p-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative w-full sm:max-w-xs">
          <Search
            className="pointer-events-none absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-slate-400"
            aria-hidden="true"
          />
          <input
            type="search"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Cari nama atau username peserta..."
            aria-label="Cari peserta di leaderboard"
            className="min-h-[40px] w-full rounded-lg border border-slate-300 bg-white py-2 pr-3 pl-9 text-sm text-slate-900 placeholder:text-slate-400 focus:border-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-600/20"
          />
        </div>

        <div
          role="group"
          aria-label="Filter jalur belajar"
          className="flex flex-wrap items-center gap-1 rounded-lg bg-slate-100 p-1"
        >
          {TRACK_FILTERS.map((track) => {
            const active = selectedTrack === track;
            return (
              <button
                key={track}
                type="button"
                onClick={() => setSelectedTrack(track)}
                className={`rounded-md px-3 py-1.5 text-xs font-medium transition-colors whitespace-nowrap cursor-pointer ${
                  active
                    ? 'bg-white text-slate-900 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                {track}
              </button>
            );
          })}
        </div>
      </div>

      {/* Ranking Table */}
      <RankingTable
        entries={filteredEntries}
        currentUserId={user.id}
        isLoading={isLoading}
        onResetFilters={searchQuery || selectedTrack !== 'Semua' ? resetFilters : undefined}
      />
    </div>
  );
}
