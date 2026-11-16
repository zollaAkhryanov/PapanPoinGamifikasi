import { Award, Medal, Trophy } from 'lucide-react';
import { LeaderboardEntry } from '../../types';
import { formatPoints } from '../../utils/levelUtils';
import { Avatar } from '../ui/Avatar';
import { Badge } from '../ui/Badge';
import { EmptyState } from '../ui/EmptyState';
import { TableRowSkeleton } from '../ui/Skeleton';

interface RankingTableProps {
  entries: LeaderboardEntry[];
  currentUserId?: string;
  isLoading: boolean;
  onResetFilters?: () => void;
}

function RankBadge({ rank }: { rank: number }) {
  if (rank === 1) {
    return (
      <Badge variant="gold" icon={<Trophy className="h-3.5 w-3.5 text-amber-600" />}>
        #1 Emas
      </Badge>
    );
  }
  if (rank === 2) {
    return (
      <Badge variant="silver" icon={<Medal className="h-3.5 w-3.5 text-slate-600" />}>
        #2 Perak
      </Badge>
    );
  }
  if (rank === 3) {
    return (
      <Badge variant="bronze" icon={<Award className="h-3.5 w-3.5 text-orange-700" />}>
        #3 Perunggu
      </Badge>
    );
  }
  return (
    <span className="inline-flex min-w-[36px] items-center justify-center font-mono text-sm font-semibold text-slate-600 tabular-nums">
      #{rank}
    </span>
  );
}

export function RankingTable({
  entries,
  currentUserId,
  isLoading,
  onResetFilters,
}: RankingTableProps) {
  if (!isLoading && entries.length === 0) {
    return (
      <EmptyState
        icon={<Trophy className="h-5 w-5" />}
        title="Tidak ada peserta pada peringkat ini"
        description="Coba ubah kata kunci pencarian atau pilih filter jalur belajar lainnya."
        actionLabel={onResetFilters ? 'Reset Filter' : undefined}
        onAction={onResetFilters}
      />
    );
  }

  return (
    <div className="overflow-hidden rounded-xl border border-slate-200 bg-white">
      {/* Desktop & Tablet Table */}
      <div className="hidden md:block overflow-x-auto">
        <table className="w-full border-collapse text-left">
          <thead>
            <tr className="border-b border-slate-200 bg-slate-50/80 text-xs font-semibold text-slate-600">
              <th className="px-4 py-3 w-32">Peringkat</th>
              <th className="px-4 py-3">Peserta</th>
              <th className="px-4 py-3">Jalur Belajar</th>
              <th className="px-4 py-3 text-right">Level</th>
              <th className="px-4 py-3 text-right">Poin Pekan Ini</th>
              <th className="px-4 py-3 text-right">Total Poin</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 text-sm">
            {isLoading
              ? Array.from({ length: 5 }).map((_, i) => <TableRowSkeleton key={i} columns={6} />)
              : entries.map((entry) => {
                  const isCurrentUser = entry.participantId === currentUserId;
                  const isTopThree = entry.rank <= 3;

                  return (
                    <tr
                      key={entry.participantId}
                      className={`transition-colors ${
                        isCurrentUser
                          ? 'bg-blue-50/60 hover:bg-blue-50'
                          : isTopThree
                          ? 'bg-amber-50/20 hover:bg-slate-50'
                          : 'hover:bg-slate-50'
                      }`}
                    >
                      <td className="px-4 py-3.5 align-middle">
                        <RankBadge rank={entry.rank} />
                      </td>
                      <td className="px-4 py-3.5 align-middle">
                        <div className="flex items-center gap-3 min-w-0">
                          <Avatar src={entry.avatarUrl} name={entry.name} size="sm" />
                          <div className="min-w-0">
                            <div className="flex items-center gap-2">
                              <p className="font-medium text-slate-900 truncate">{entry.name}</p>
                              {isCurrentUser && <Badge variant="info">Anda</Badge>}
                            </div>
                            <p className="text-xs text-slate-500 truncate">@{entry.username}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3.5 align-middle text-slate-600 whitespace-nowrap">
                        {entry.track}
                      </td>
                      <td className="px-4 py-3.5 align-middle text-right font-mono font-medium text-slate-800 tabular-nums whitespace-nowrap">
                        Level {entry.level}
                      </td>
                      <td className="px-4 py-3.5 align-middle text-right font-mono text-xs font-medium text-emerald-700 tabular-nums whitespace-nowrap">
                        +{formatPoints(entry.weeklyPointsDelta)}
                      </td>
                      <td className="px-4 py-3.5 align-middle text-right font-mono text-base font-bold text-slate-900 tabular-nums whitespace-nowrap">
                        {formatPoints(entry.totalPoints)}
                      </td>
                    </tr>
                  );
                })}
          </tbody>
        </table>
      </div>

      {/* Mobile Compact List (Zero Horizontal Overflow) */}
      <div className="divide-y divide-slate-100 md:hidden">
        {isLoading
          ? Array.from({ length: 4 }).map((_, idx) => (
              <div key={idx} className="flex items-center justify-between gap-3 p-4">
                <div className="flex items-center gap-3">
                  <div className="h-9 w-9 animate-pulse rounded-lg bg-slate-200" />
                  <div className="space-y-1.5">
                    <div className="h-4 w-32 animate-pulse rounded bg-slate-200" />
                    <div className="h-3 w-20 animate-pulse rounded bg-slate-200" />
                  </div>
                </div>
                <div className="h-5 w-16 animate-pulse rounded bg-slate-200" />
              </div>
            ))
          : entries.map((entry) => {
              const isCurrentUser = entry.participantId === currentUserId;
              return (
                <div
                  key={entry.participantId}
                  className={`flex items-center justify-between gap-3 p-4 ${
                    isCurrentUser ? 'bg-blue-50/60' : ''
                  }`}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="shrink-0">
                      <RankBadge rank={entry.rank} />
                    </div>
                    <Avatar src={entry.avatarUrl} name={entry.name} size="sm" />
                    <div className="min-w-0">
                      <div className="flex items-center gap-1.5">
                        <p className="text-sm font-semibold text-slate-900 truncate">
                          {entry.name}
                        </p>
                        {isCurrentUser && <Badge variant="info">Anda</Badge>}
                      </div>
                      <p className="text-xs text-slate-500 truncate">
                        {entry.track} · Level {entry.level}
                      </p>
                    </div>
                  </div>

                  <div className="text-right shrink-0">
                    <p className="font-mono text-sm font-bold text-slate-900 tabular-nums">
                      {formatPoints(entry.totalPoints)}
                    </p>
                    <p className="font-mono text-xs text-emerald-700 tabular-nums">
                      +{formatPoints(entry.weeklyPointsDelta)}
                    </p>
                  </div>
                </div>
              );
            })}
      </div>
    </div>
  );
}
