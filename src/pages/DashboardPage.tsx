import {
  ArrowRight,
  Award,
  BookOpen,
  Calendar,
  CheckCircle2,
  ClipboardCheck,
  Clock,
  Lock,
  RefreshCw,
  Trophy,
  UserCheck,
} from 'lucide-react';
import { useCallback, useEffect, useState } from 'react';
import { LevelProgressBar } from '../components/domain/LevelProgressBar';
import { PointsCard } from '../components/domain/PointsCard';
import { AlertBanner } from '../components/ui/AlertBanner';
import { Avatar } from '../components/ui/Avatar';
import { Badge } from '../components/ui/Badge';
import { Button } from '../components/ui/Button';
import { Card, CardBody, CardHeader } from '../components/ui/Card';
import { EmptyState } from '../components/ui/EmptyState';
import { Skeleton } from '../components/ui/Skeleton';
import { academyService } from '../services/academyService';
import { AuthUser, PageRoute, Participant } from '../types';
import { formatDateIndo, formatDateTimeIndo, formatPoints } from '../utils/levelUtils';

interface DashboardPageProps {
  user: AuthUser;
  onNavigate: (page: Exclude<PageRoute, 'login'>) => void;
}

const STATUS_LABELS: Record<
  Participant['status'],
  { label: string; variant: 'success' | 'warning' | 'info' }
> = {
  aktif: { label: 'Aktif Mengikuti', variant: 'success' },
  perlu_bimbingan: { label: 'Perlu Bimbingan', variant: 'warning' },
  selesai: { label: 'Lulus Program', variant: 'info' },
};

export function DashboardPage({ user, onNavigate }: DashboardPageProps) {
  const [participant, setParticipant] = useState<Participant | null>(null);
  const [rankInfo, setRankInfo] = useState<{ rank: number | null; total: number }>({
    rank: null,
    total: 0,
  });
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadDashboard = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const [profileData, leaderboardData] = await Promise.all([
        academyService.getMyDashboard(user),
        academyService.getLeaderboard(),
      ]);
      setParticipant(profileData);
      const foundRank = leaderboardData.find(
        (entry) => entry.participantId === profileData.id
      );
      setRankInfo({
        rank: foundRank?.rank ?? null,
        total: leaderboardData.length,
      });
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : 'Gagal memuat data dashboard peserta. Silakan coba lagi.'
      );
    } finally {
      setIsLoading(false);
    }
  }, [user]);

  useEffect(() => {
    void loadDashboard();
  }, [loadDashboard]);

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Card>
          <CardBody className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-4">
              <Skeleton className="h-16 w-16 rounded-lg" />
              <div className="space-y-2">
                <Skeleton className="h-6 w-48" />
                <Skeleton className="h-4 w-64" />
              </div>
            </div>
            <Skeleton className="h-10 w-40" />
          </CardBody>
        </Card>
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          <Skeleton className="h-44 w-full rounded-xl" />
          <Skeleton className="h-44 w-full rounded-xl" />
        </div>
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
          <Skeleton className="h-72 w-full rounded-xl lg:col-span-7" />
          <Skeleton className="h-72 w-full rounded-xl lg:col-span-5" />
        </div>
      </div>
    );
  }

  if (error || !participant) {
    return (
      <AlertBanner
        variant="error"
        title="Gagal Memuat Dashboard Peserta"
        description={error ?? 'Data profil peserta tidak tersedia.'}
        onRetry={() => void loadDashboard()}
      />
    );
  }

  const statusMeta = STATUS_LABELS[participant.status];

  return (
    <div className="space-y-6">
      {user.role === 'mentor' && (
        <AlertBanner
          variant="info"
          title="Mode Pratinjau Dashboard Peserta"
          description={`Anda masuk sebagai Mentor (${user.name}). Halaman ini menampilkan pratinjau tampilan peserta ${participant.name}.`}
          onRetry={() => onNavigate('mentor')}
          retryLabel="Buka Panel Mentor"
        />
      )}

      {/* Profile Header Summary */}
      <Card>
        <CardBody className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-start gap-4 sm:items-center">
            <Avatar src={participant.avatarUrl} name={participant.name} size="xl" />
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2.5">
                <h2 className="font-display text-xl font-bold text-slate-900 sm:text-2xl">
                  {participant.name}
                </h2>
                <Badge variant={statusMeta.variant}>{statusMeta.label}</Badge>
              </div>
              <div className="mt-1.5 flex flex-wrap items-center gap-x-2.5 gap-y-1 text-xs text-slate-600 sm:text-sm">
                <span>Jalur {participant.track}</span>
                <span aria-hidden="true">·</span>
                <span>{participant.cohort}</span>
                <span aria-hidden="true">·</span>
                <span>Mentor: {participant.mentorName}</span>
                <span aria-hidden="true">·</span>
                <span className="inline-flex items-center gap-1">
                  <Calendar className="h-3.5 w-3.5 text-slate-400" aria-hidden="true" />
                  Bergabung {formatDateIndo(participant.joinedAt)}
                </span>
              </div>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2.5 shrink-0">
            <Button
              variant="secondary"
              size="sm"
              onClick={() => void loadDashboard()}
              leftIcon={<RefreshCw className="h-3.5 w-3.5" />}
            >
              Muat Ulang
            </Button>
            <Button
              variant="primary"
              size="sm"
              onClick={() => onNavigate('leaderboard')}
              leftIcon={<Trophy className="h-3.5 w-3.5" />}
            >
              Lihat Peringkat
            </Button>
          </div>
        </CardBody>
      </Card>

      {/* Points Card & Level Progress */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <PointsCard
          totalPoints={participant.totalPoints}
          weeklyDelta={participant.weeklyPointsDelta}
          rank={rankInfo.rank}
          totalParticipants={rankInfo.total}
          completedModules={participant.completedModules}
          totalModules={participant.totalModules}
        />
        <LevelProgressBar totalPoints={participant.totalPoints} />
      </div>

      {/* Activities & Achievements */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
        {/* Left: Activity Feed */}
        <Card className="lg:col-span-7">
          <CardHeader
            title="Aktivitas & Perolehan Poin Terbaru"
            subtitle="Riwayat penyelesaian modul, tugas, evaluasi, dan catatan mentoring."
            action={
              <button
                type="button"
                onClick={() => onNavigate('leaderboard')}
                className="inline-flex items-center gap-1 text-xs font-semibold text-blue-700 hover:text-blue-800 whitespace-nowrap cursor-pointer"
              >
                <span>Bandingkan Peringkat</span>
                <ArrowRight className="h-3.5 w-3.5" />
              </button>
            }
          />
          <CardBody className="p-0 sm:p-0">
            {participant.activities.length === 0 ? (
              <div className="p-5 sm:p-6">
                <EmptyState
                  icon={<Clock className="h-5 w-5" />}
                  title="Belum ada riwayat aktivitas"
                  description="Aktivitas pembelajaran dan penambahan poin dari mentor akan tercatat otomatis di sini."
                />
              </div>
            ) : (
              <ul className="divide-y divide-slate-100">
                {participant.activities.map((activity) => (
                  <li
                    key={activity.id}
                    className="flex items-start justify-between gap-4 px-5 py-4 sm:px-6"
                  >
                    <div className="flex items-start gap-3 min-w-0">
                      <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-slate-200 bg-slate-50 text-slate-600">
                        {activity.category === 'Modul' ? (
                          <BookOpen className="h-4 w-4" />
                        ) : activity.category === 'Evaluasi' ? (
                          <ClipboardCheck className="h-4 w-4" />
                        ) : (
                          <UserCheck className="h-4 w-4" />
                        )}
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-semibold text-slate-900">{activity.title}</p>
                        <div className="mt-0.5 flex flex-wrap items-center gap-2 text-xs text-slate-500">
                          <span>{activity.category}</span>
                          <span aria-hidden="true">·</span>
                          <span className="tabular-nums">
                            {formatDateTimeIndo(activity.timestamp)}
                          </span>
                        </div>
                        {activity.notes && (
                          <p className="mt-1.5 text-xs text-slate-600 leading-relaxed">
                            {activity.notes}
                          </p>
                        )}
                      </div>
                    </div>

                    <span
                      className={`shrink-0 font-mono text-sm font-semibold tabular-nums whitespace-nowrap ${
                        activity.pointsEarned >= 0 ? 'text-emerald-700' : 'text-red-700'
                      }`}
                    >
                      {activity.pointsEarned >= 0 ? '+' : ''}
                      {formatPoints(activity.pointsEarned)} Poin
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </CardBody>
        </Card>

        {/* Right: Achievements & Mentor Notes */}
        <div className="space-y-6 lg:col-span-5">
          <Card>
            <CardHeader
              title="Pencapaian Kompetensi"
              subtitle="Target pembelajaran yang telah dan akan dibuka."
            />
            <CardBody className="space-y-3">
              {participant.achievements.length === 0 ? (
                <EmptyState
                  icon={<Award className="h-5 w-5" />}
                  title="Belum ada pencapaian"
                  description="Selesaikan modul dan evaluasi untuk membuka pencapaian kompetensi."
                />
              ) : (
                participant.achievements.map((ach) => {
                  const unlocked = Boolean(ach.unlockedAt);
                  return (
                    <div
                      key={ach.id}
                      className={`flex items-start gap-3 rounded-lg border p-3.5 ${
                        unlocked
                          ? 'border-emerald-200 bg-emerald-50/40'
                          : 'border-slate-200 bg-slate-50/60'
                      }`}
                    >
                      <div
                        className={`mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border ${
                          unlocked
                            ? 'border-emerald-200 bg-white text-emerald-700'
                            : 'border-slate-200 bg-white text-slate-400'
                        }`}
                      >
                        {unlocked ? (
                          <CheckCircle2 className="h-4 w-4" />
                        ) : (
                          <Lock className="h-4 w-4" />
                        )}
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center justify-between gap-2">
                          <p className="text-sm font-semibold text-slate-900">{ach.title}</p>
                          <span className="font-mono text-xs font-semibold text-slate-700 tabular-nums whitespace-nowrap">
                            +{formatPoints(ach.pointsBonus)}
                          </span>
                        </div>
                        <p className="mt-0.5 text-xs text-slate-600 leading-relaxed">
                          {ach.description}
                        </p>
                        <p className="mt-1 text-[11px] text-slate-500">
                          {ach.unlockedAt
                            ? `Tercapai pada ${formatDateIndo(ach.unlockedAt)}`
                            : 'Belum terbuka'}
                        </p>
                      </div>
                    </div>
                  );
                })
              )}
            </CardBody>
          </Card>

          {participant.mentorNotes && (
            <Card>
              <CardHeader
                title="Catatan Pembimbing"
                subtitle={`Dari ${participant.mentorName}`}
              />
              <CardBody>
                <p className="text-sm leading-relaxed text-slate-700">
                  {participant.mentorNotes}
                </p>
                <p className="mt-3 text-xs text-slate-500">
                  Diperbarui {formatDateTimeIndo(participant.lastUpdatedAt)}
                </p>
              </CardBody>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
