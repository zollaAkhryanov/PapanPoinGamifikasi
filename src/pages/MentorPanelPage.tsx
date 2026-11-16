import {
  AlertTriangle,
  Edit3,
  Plus,
  RefreshCw,
  Search,
  Users,
} from 'lucide-react';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { LevelProgressBar } from '../components/domain/LevelProgressBar';
import { ParticipantFormModal } from '../components/domain/ParticipantFormModal';
import { AlertBanner } from '../components/ui/AlertBanner';
import { Avatar } from '../components/ui/Avatar';
import { Badge } from '../components/ui/Badge';
import { Button } from '../components/ui/Button';
import { Card, CardBody } from '../components/ui/Card';
import { EmptyState } from '../components/ui/EmptyState';
import { Skeleton, TableRowSkeleton } from '../components/ui/Skeleton';
import { academyService } from '../services/academyService';
import {
  AuthUser,
  CreateParticipantPayload,
  Participant,
  ParticipantStatus,
  UpdateParticipantPayload,
} from '../types';
import { formatDateIndo, formatPoints } from '../utils/levelUtils';

interface MentorPanelPageProps {
  user: AuthUser;
  onSwitchToMentorDemo: () => Promise<void>;
  onNotify: (type: 'success' | 'error' | 'info', title: string, description?: string) => void;
}

const STATUS_BADGE: Record<
  ParticipantStatus,
  { label: string; variant: 'success' | 'warning' | 'info' }
> = {
  aktif: { label: 'Aktif', variant: 'success' },
  perlu_bimbingan: { label: 'Perlu Bimbingan', variant: 'warning' },
  selesai: { label: 'Selesai', variant: 'info' },
};

export function MentorPanelPage({
  user,
  onSwitchToMentorDemo,
  onNotify,
}: MentorPanelPageProps) {
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'semua' | ParticipantStatus>('semua');

  const [modalOpen, setModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<'create' | 'edit'>('edit');
  const [selectedParticipant, setSelectedParticipant] = useState<Participant | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [modalError, setModalError] = useState<string | null>(null);

  const isMentor = user.role === 'mentor';

  const loadParticipants = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await academyService.getParticipants();
      setParticipants(data);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : 'Gagal mengambil daftar peserta dari backend.'
      );
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadParticipants();
  }, [loadParticipants]);

  const stats = useMemo(() => {
    const total = participants.length;
    const avgPoints =
      total > 0
        ? Math.round(participants.reduce((sum, p) => sum + p.totalPoints, 0) / total)
        : 0;
    const activeCount = participants.filter((p) => p.status === 'aktif').length;
    const attentionCount = participants.filter(
      (p) => p.status === 'perlu_bimbingan'
    ).length;

    return { total, avgPoints, activeCount, attentionCount };
  }, [participants]);

  // Hitung peringkat dinamis berdasarkan urutan poin
  const rankMap = useMemo(() => {
    const sorted = [...participants].sort((a, b) => b.totalPoints - a.totalPoints);
    const map = new Map<string, number>();
    sorted.forEach((p, idx) => map.set(p.id, idx + 1));
    return map;
  }, [participants]);

  const filteredParticipants = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    return participants.filter((p) => {
      const matchesStatus = statusFilter === 'semua' || p.status === statusFilter;
      const matchesQuery =
        !query ||
        p.name.toLowerCase().includes(query) ||
        p.email.toLowerCase().includes(query) ||
        p.track.toLowerCase().includes(query);
      return matchesStatus && matchesQuery;
    });
  }, [participants, searchQuery, statusFilter]);

  const openCreateModal = () => {
    if (!isMentor) {
      onNotify(
        'error',
        'Akses Terbatas',
        'Hanya akun Mentor yang dapat mendaftarkan atau mengubah data peserta.'
      );
      return;
    }
    setModalError(null);
    setSelectedParticipant(null);
    setModalMode('create');
    setModalOpen(true);
  };

  const openEditModal = (participant: Participant) => {
    if (!isMentor) {
      onNotify(
        'error',
        'Akses Terbatas',
        'Masuk dengan akun Mentor untuk memperbarui poin dan progres peserta.'
      );
      return;
    }
    setModalError(null);
    setSelectedParticipant(participant);
    setModalMode('edit');
    setModalOpen(true);
  };

  const handleCreate = async (payload: CreateParticipantPayload) => {
    setIsSubmitting(true);
    setModalError(null);
    try {
      const created = await academyService.createParticipant(payload);
      setParticipants((prev) =>
        [created, ...prev].sort((a, b) => b.totalPoints - a.totalPoints)
      );
      setModalOpen(false);
      onNotify(
        'success',
        'Peserta Berhasil Ditambahkan',
        `${created.name} telah terdaftar dengan ${formatPoints(created.totalPoints)} poin.`
      );
    } catch (err) {
      const msg =
        err instanceof Error ? err.message : 'Gagal menambahkan peserta baru.';
      setModalError(msg);
      onNotify('error', 'Gagal Menyimpan Data', msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleUpdate = async (
    participantId: string,
    payload: UpdateParticipantPayload
  ) => {
    setIsSubmitting(true);
    setModalError(null);
    try {
      const updated = await academyService.updateParticipant(participantId, payload);
      setParticipants((prev) =>
        prev
          .map((p) => (p.id === participantId ? updated : p))
          .sort((a, b) => b.totalPoints - a.totalPoints)
      );
      setModalOpen(false);
      onNotify(
        'success',
        'Data Peserta Diperbarui',
        `${updated.name} kini memiliki ${formatPoints(updated.totalPoints)} poin (Level ${updated.level}).`
      );
    } catch (err) {
      const msg =
        err instanceof Error ? err.message : 'Gagal memperbarui data peserta.';
      setModalError(msg);
      onNotify('error', 'Gagal Memperbarui Data', msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="font-display text-xl font-bold text-slate-900 sm:text-2xl">
            Panel Manajemen Mentor
          </h2>
          <p className="mt-1 text-sm text-slate-600">
            Pantau perkembangan modul, kelola perolehan poin, dan perbarui evaluasi peserta.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5 shrink-0">
          <Button
            variant="secondary"
            size="sm"
            onClick={() => void loadParticipants()}
            isLoading={isLoading}
            leftIcon={<RefreshCw className="h-3.5 w-3.5" />}
          >
            Muat Ulang
          </Button>
          <Button
            variant="primary"
            size="sm"
            onClick={openCreateModal}
            disabled={!isMentor}
            leftIcon={<Plus className="h-4 w-4" />}
          >
            Tambah Peserta
          </Button>
        </div>
      </div>

      {!isMentor && (
        <AlertBanner
          variant="warning"
          title="Anda Masuk Sebagai Peserta (Mode Baca Saja)"
          description="Untuk menambah peserta atau memperbarui poin evaluasi, masuk menggunakan akun Mentor."
          onRetry={() => void onSwitchToMentorDemo()}
          retryLabel="Beralih ke Akun Mentor"
        />
      )}

      {error && (
        <AlertBanner
          variant="error"
          title="Gagal Memuat Daftar Peserta"
          description={error}
          onRetry={() => void loadParticipants()}
        />
      )}

      {/* KPI Strip */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <Card>
          <CardBody className="p-4 sm:p-5">
            <p className="text-xs font-medium text-slate-500">Total Peserta</p>
            {isLoading ? (
              <Skeleton className="mt-2 h-8 w-16" />
            ) : (
              <p className="mt-1.5 font-mono text-2xl font-bold text-slate-900 tabular-nums">
                {stats.total}
              </p>
            )}
          </CardBody>
        </Card>

        <Card>
          <CardBody className="p-4 sm:p-5">
            <p className="text-xs font-medium text-slate-500">Rata-rata Poin</p>
            {isLoading ? (
              <Skeleton className="mt-2 h-8 w-24" />
            ) : (
              <p className="mt-1.5 font-mono text-2xl font-bold text-slate-900 tabular-nums">
                {formatPoints(stats.avgPoints)}
              </p>
            )}
          </CardBody>
        </Card>

        <Card>
          <CardBody className="p-4 sm:p-5">
            <p className="text-xs font-medium text-slate-500">Peserta Aktif</p>
            {isLoading ? (
              <Skeleton className="mt-2 h-8 w-16" />
            ) : (
              <p className="mt-1.5 font-mono text-2xl font-bold text-emerald-700 tabular-nums">
                {stats.activeCount}
              </p>
            )}
          </CardBody>
        </Card>

        <Card>
          <CardBody className="p-4 sm:p-5">
            <p className="text-xs font-medium text-slate-500">Perlu Bimbingan</p>
            {isLoading ? (
              <Skeleton className="mt-2 h-8 w-16" />
            ) : (
              <p className="mt-1.5 font-mono text-2xl font-bold text-amber-700 tabular-nums">
                {stats.attentionCount}
              </p>
            )}
          </CardBody>
        </Card>
      </div>

      {/* Filter & Search Bar */}
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
            placeholder="Cari nama, email, atau jalur..."
            aria-label="Cari peserta di panel mentor"
            className="min-h-[40px] w-full rounded-lg border border-slate-300 bg-white py-2 pr-3 pl-9 text-sm text-slate-900 placeholder:text-slate-400 focus:border-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-600/20"
          />
        </div>

        <div
          role="group"
          aria-label="Filter status peserta"
          className="flex flex-wrap items-center gap-1 rounded-lg bg-slate-100 p-1"
        >
          {(
            [
              { id: 'semua', label: 'Semua' },
              { id: 'aktif', label: 'Aktif' },
              { id: 'perlu_bimbingan', label: 'Perlu Bimbingan' },
              { id: 'selesai', label: 'Selesai' },
            ] as const
          ).map((tab) => {
            const active = statusFilter === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setStatusFilter(tab.id)}
                className={`rounded-md px-3 py-1.5 text-xs font-medium transition-colors whitespace-nowrap cursor-pointer ${
                  active
                    ? 'bg-white text-slate-900 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                {tab.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Participants Table / Mobile Cards */}
      {!isLoading && filteredParticipants.length === 0 ? (
        <EmptyState
          icon={<Users className="h-5 w-5" />}
          title="Belum ada data peserta yang cocok"
          description="Sesuaikan kata kunci pencarian atau daftarkan peserta baru ke sistem."
          actionLabel={searchQuery || statusFilter !== 'semua' ? 'Reset Filter' : 'Tambah Peserta'}
          onAction={() => {
            if (searchQuery || statusFilter !== 'semua') {
              setSearchQuery('');
              setStatusFilter('semua');
            } else {
              openCreateModal();
            }
          }}
        />
      ) : (
        <div className="overflow-hidden rounded-xl border border-slate-200 bg-white">
          {/* Desktop Table */}
          <div className="hidden lg:block overflow-x-auto">
            <table className="w-full border-collapse text-left">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50/80 text-xs font-semibold text-slate-600">
                  <th className="px-4 py-3">Peserta</th>
                  <th className="px-4 py-3">Progres Level</th>
                  <th className="px-4 py-3 text-right">Modul</th>
                  <th className="px-4 py-3 text-right">Peringkat</th>
                  <th className="px-4 py-3 text-right">Total Poin</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3 text-right">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-sm">
                {isLoading
                  ? Array.from({ length: 5 }).map((_, idx) => (
                      <TableRowSkeleton key={idx} columns={7} />
                    ))
                  : filteredParticipants.map((p) => {
                      const rank = rankMap.get(p.id);
                      const statusMeta = STATUS_BADGE[p.status];
                      return (
                        <tr key={p.id} className="hover:bg-slate-50/80 transition-colors">
                          <td className="px-4 py-3.5 align-middle">
                            <div className="flex items-center gap-3 min-w-0">
                              <Avatar src={p.avatarUrl} name={p.name} size="sm" />
                              <div className="min-w-0">
                                <p className="font-semibold text-slate-900 truncate">{p.name}</p>
                                <p className="text-xs text-slate-500 truncate">
                                  {p.track} · {p.email}
                                </p>
                              </div>
                            </div>
                          </td>
                          <td className="px-4 py-3.5 align-middle w-56">
                            <LevelProgressBar totalPoints={p.totalPoints} compact />
                          </td>
                          <td className="px-4 py-3.5 align-middle text-right font-mono text-xs font-medium text-slate-700 tabular-nums whitespace-nowrap">
                            {p.completedModules}/{p.totalModules}
                          </td>
                          <td className="px-4 py-3.5 align-middle text-right font-mono font-semibold text-slate-800 tabular-nums whitespace-nowrap">
                            {rank ? `#${rank}` : '—'}
                          </td>
                          <td className="px-4 py-3.5 align-middle text-right font-mono font-bold text-slate-900 tabular-nums whitespace-nowrap">
                            {formatPoints(p.totalPoints)}
                          </td>
                          <td className="px-4 py-3.5 align-middle">
                            <Badge
                              variant={statusMeta.variant}
                              icon={
                                p.status === 'perlu_bimbingan' ? (
                                  <AlertTriangle className="h-3 w-3" />
                                ) : undefined
                              }
                            >
                              {statusMeta.label}
                            </Badge>
                          </td>
                          <td className="px-4 py-3.5 align-middle text-right">
                            <Button
                              size="sm"
                              variant="secondary"
                              onClick={() => openEditModal(p)}
                              disabled={!isMentor}
                              leftIcon={<Edit3 className="h-3.5 w-3.5" />}
                            >
                              Kelola
                            </Button>
                          </td>
                        </tr>
                      );
                    })}
              </tbody>
            </table>
          </div>

          {/* Mobile & Tablet Card Rows */}
          <div className="divide-y divide-slate-100 lg:hidden">
            {isLoading
              ? Array.from({ length: 4 }).map((_, idx) => (
                  <div key={idx} className="space-y-3 p-4">
                    <Skeleton className="h-5 w-44" />
                    <Skeleton className="h-3 w-full" />
                  </div>
                ))
              : filteredParticipants.map((p) => {
                  const rank = rankMap.get(p.id);
                  const statusMeta = STATUS_BADGE[p.status];
                  return (
                    <div key={p.id} className="space-y-3 p-4">
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex items-center gap-3 min-w-0">
                          <Avatar src={p.avatarUrl} name={p.name} size="md" />
                          <div className="min-w-0">
                            <p className="font-semibold text-slate-900 truncate">{p.name}</p>
                            <p className="text-xs text-slate-500 truncate">
                              {p.track} · Peringkat #{rank ?? '—'}
                            </p>
                          </div>
                        </div>
                        <Badge variant={statusMeta.variant}>{statusMeta.label}</Badge>
                      </div>

                      <LevelProgressBar totalPoints={p.totalPoints} compact />

                      <div className="flex flex-wrap items-center justify-between gap-3 pt-1">
                        <div className="text-xs text-slate-600">
                          <span className="font-mono font-bold text-slate-900 tabular-nums">
                            {formatPoints(p.totalPoints)} Poin
                          </span>
                          <span className="mx-1.5 text-slate-300">·</span>
                          <span className="font-mono tabular-nums">
                            {p.completedModules}/{p.totalModules} Modul
                          </span>
                          <span className="mx-1.5 text-slate-300">·</span>
                          <span>Diperbarui {formatDateIndo(p.lastUpdatedAt)}</span>
                        </div>

                        <Button
                          size="sm"
                          variant="secondary"
                          onClick={() => openEditModal(p)}
                          disabled={!isMentor}
                          leftIcon={<Edit3 className="h-3.5 w-3.5" />}
                        >
                          Kelola
                        </Button>
                      </div>
                    </div>
                  );
                })}
          </div>
        </div>
      )}

      {/* Participant Create / Edit Modal */}
      <ParticipantFormModal
        isOpen={modalOpen}
        mode={modalMode}
        participant={selectedParticipant}
        isSubmitting={isSubmitting}
        errorMessage={modalError}
        onClose={() => setModalOpen(false)}
        onCreate={handleCreate}
        onUpdate={handleUpdate}
      />
    </div>
  );
}
