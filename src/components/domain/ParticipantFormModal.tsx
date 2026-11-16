import { FormEvent, useEffect, useState } from 'react';
import {
  CreateParticipantPayload,
  LearningTrack,
  Participant,
  ParticipantStatus,
  UpdateParticipantPayload,
} from '../../types';
import { calculateLevelInfo, formatPoints } from '../../utils/levelUtils';
import { AlertBanner } from '../ui/AlertBanner';
import { Button } from '../ui/Button';
import { Modal } from '../ui/Modal';

interface ParticipantFormModalProps {
  isOpen: boolean;
  mode: 'create' | 'edit';
  participant: Participant | null;
  isSubmitting: boolean;
  errorMessage: string | null;
  onClose: () => void;
  onCreate: (payload: CreateParticipantPayload) => Promise<void>;
  onUpdate: (participantId: string, payload: UpdateParticipantPayload) => Promise<void>;
}

const TRACK_OPTIONS: LearningTrack[] = ['Frontend', 'Backend', 'UI/UX', 'Data'];
const STATUS_OPTIONS: { value: ParticipantStatus; label: string }[] = [
  { value: 'aktif', label: 'Aktif Mengikuti' },
  { value: 'perlu_bimbingan', label: 'Perlu Bimbingan' },
  { value: 'selesai', label: 'Lulus / Selesai' },
];

export function ParticipantFormModal({
  isOpen,
  mode,
  participant,
  isSubmitting,
  errorMessage,
  onClose,
  onCreate,
  onUpdate,
}: ParticipantFormModalProps) {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [username, setUsername] = useState('');
  const [track, setTrack] = useState<LearningTrack>('Frontend');
  const [cohort, setCohort] = useState('Angkatan 08');
  const [pointUpdateMode, setPointUpdateMode] = useState<'delta' | 'absolute'>('delta');
  const [pointsDelta, setPointsDelta] = useState('100');
  const [totalPoints, setTotalPoints] = useState('0');
  const [activityTitle, setActivityTitle] = useState('');
  const [completedModules, setCompletedModules] = useState('0');
  const [totalModules, setTotalModules] = useState('20');
  const [status, setStatus] = useState<ParticipantStatus>('aktif');
  const [mentorNotes, setMentorNotes] = useState('');
  const [validationError, setValidationError] = useState<string | null>(null);

  useEffect(() => {
    if (!isOpen) return;
    setValidationError(null);

    if (mode === 'edit' && participant) {
      setName(participant.name);
      setEmail(participant.email);
      setUsername(participant.username);
      setTrack(participant.track);
      setCohort(participant.cohort);
      setPointUpdateMode('delta');
      setPointsDelta('50');
      setTotalPoints(String(participant.totalPoints));
      setActivityTitle('');
      setCompletedModules(String(participant.completedModules));
      setTotalModules(String(participant.totalModules));
      setStatus(participant.status);
      setMentorNotes(participant.mentorNotes || '');
    } else {
      setName('');
      setEmail('');
      setUsername('');
      setTrack('Frontend');
      setCohort('Angkatan 08');
      setPointUpdateMode('absolute');
      setPointsDelta('0');
      setTotalPoints('100');
      setActivityTitle('');
      setCompletedModules('1');
      setTotalModules('20');
      setStatus('aktif');
      setMentorNotes('');
    }
  }, [isOpen, mode, participant]);

  const previewPoints = (() => {
    if (mode === 'create') {
      return Math.max(0, Number(totalPoints) || 0);
    }
    const base = participant?.totalPoints ?? 0;
    if (pointUpdateMode === 'delta') {
      return Math.max(0, base + (Number(pointsDelta) || 0));
    }
    return Math.max(0, Number(totalPoints) || 0);
  })();

  const previewLevel = calculateLevelInfo(previewPoints);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setValidationError(null);

    const parsedTotalModules = Number(totalModules);
    const parsedCompleted = Number(completedModules);

    if (!name.trim()) {
      setValidationError('Nama peserta wajib diisi.');
      return;
    }

    if (Number.isNaN(parsedTotalModules) || parsedTotalModules < 1) {
      setValidationError('Jumlah total modul minimal harus 1.');
      return;
    }

    if (
      Number.isNaN(parsedCompleted) ||
      parsedCompleted < 0 ||
      parsedCompleted > parsedTotalModules
    ) {
      setValidationError('Modul selesai harus berada di antara 0 dan total modul.');
      return;
    }

    if (mode === 'create') {
      if (!email.trim() || !email.includes('@')) {
        setValidationError('Masukkan alamat email peserta yang valid.');
        return;
      }
      if (!username.trim() || username.trim().length < 3) {
        setValidationError('Username peserta minimal 3 karakter.');
        return;
      }
      const initialPts = Number(totalPoints);
      if (Number.isNaN(initialPts) || initialPts < 0) {
        setValidationError('Poin awal tidak boleh bernilai negatif.');
        return;
      }

      await onCreate({
        name: name.trim(),
        email: email.trim(),
        username: username.trim(),
        track,
        cohort: cohort.trim() || 'Angkatan 08',
        initialPoints: initialPts,
        completedModules: parsedCompleted,
        totalModules: parsedTotalModules,
        status,
        mentorNotes: mentorNotes.trim() || undefined,
      });
      return;
    }

    if (!participant) return;

    if (pointUpdateMode === 'delta') {
      const delta = Number(pointsDelta);
      if (Number.isNaN(delta)) {
        setValidationError('Nilai penambahan/pengurangan poin harus berupa angka valid.');
        return;
      }
      await onUpdate(participant.id, {
        name: name.trim(),
        track,
        pointsDelta: delta,
        activityTitle: activityTitle.trim() || undefined,
        completedModules: parsedCompleted,
        totalModules: parsedTotalModules,
        status,
        mentorNotes: mentorNotes.trim(),
      });
    } else {
      const absPoints = Number(totalPoints);
      if (Number.isNaN(absPoints) || absPoints < 0) {
        setValidationError('Total poin tidak boleh kurang dari 0.');
        return;
      }
      await onUpdate(participant.id, {
        name: name.trim(),
        track,
        totalPoints: absPoints,
        activityTitle: activityTitle.trim() || undefined,
        completedModules: parsedCompleted,
        totalModules: parsedTotalModules,
        status,
        mentorNotes: mentorNotes.trim(),
      });
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={mode === 'create' ? 'Tambah Peserta Baru' : `Kelola Data: ${participant?.name ?? ''}`}
      subtitle={
        mode === 'create'
          ? 'Daftarkan peserta baru ke dalam daftar pemantauan dan papan peringkat.'
          : 'Perbarui poin kompetensi, progres modul, status belajar, dan catatan mentor.'
      }
      maxWidthClass="max-w-xl"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {(validationError || errorMessage) && (
          <AlertBanner
            variant="error"
            title="Periksa Data Formulir"
            description={validationError || errorMessage || undefined}
          />
        )}

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div className={mode === 'edit' ? 'sm:col-span-2' : ''}>
            <label htmlFor="p-name" className="mb-1 block text-xs font-semibold text-slate-700">
              Nama Lengkap
            </label>
            <input
              id="p-name"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Contoh: Nadia Kusuma"
              className="min-h-[40px] w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 focus:border-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-600/20"
            />
          </div>

          {mode === 'create' && (
            <>
              <div>
                <label htmlFor="p-username" className="mb-1 block text-xs font-semibold text-slate-700">
                  Username
                </label>
                <input
                  id="p-username"
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="nadia.kusuma"
                  className="min-h-[40px] w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 focus:border-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-600/20"
                />
              </div>
              <div className="sm:col-span-2">
                <label htmlFor="p-email" className="mb-1 block text-xs font-semibold text-slate-700">
                  Email Peserta
                </label>
                <input
                  id="p-email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="nadia.kusuma@akademi.id"
                  className="min-h-[40px] w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 focus:border-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-600/20"
                />
              </div>
            </>
          )}

          <div>
            <label htmlFor="p-track" className="mb-1 block text-xs font-semibold text-slate-700">
              Jalur Belajar
            </label>
            <select
              id="p-track"
              value={track}
              onChange={(e) => setTrack(e.target.value as LearningTrack)}
              className="min-h-[40px] w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 focus:border-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-600/20"
            >
              {TRACK_OPTIONS.map((t) => (
                <option key={t} value={t}>
                  {t}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label htmlFor="p-status" className="mb-1 block text-xs font-semibold text-slate-700">
              Status Pemantauan
            </label>
            <select
              id="p-status"
              value={status}
              onChange={(e) => setStatus(e.target.value as ParticipantStatus)}
              className="min-h-[40px] w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 focus:border-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-600/20"
            >
              {STATUS_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Points Section */}
        <div className="rounded-xl border border-slate-200 bg-slate-50/70 p-4 space-y-3">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <span className="text-xs font-semibold text-slate-800">
              {mode === 'create' ? 'Poin Awal Peserta' : 'Pembaruan Poin Kompetensi'}
            </span>
            {mode === 'edit' && (
              <div className="inline-flex rounded-lg border border-slate-200 bg-white p-0.5">
                <button
                  type="button"
                  onClick={() => setPointUpdateMode('delta')}
                  className={`rounded-md px-2.5 py-1 text-xs font-medium transition-colors cursor-pointer ${
                    pointUpdateMode === 'delta'
                      ? 'bg-blue-700 text-white'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  Tambah / Kurangi
                </button>
                <button
                  type="button"
                  onClick={() => setPointUpdateMode('absolute')}
                  className={`rounded-md px-2.5 py-1 text-xs font-medium transition-colors cursor-pointer ${
                    pointUpdateMode === 'absolute'
                      ? 'bg-blue-700 text-white'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  Atur Total Poin
                </button>
              </div>
            )}
          </div>

          {mode === 'edit' && pointUpdateMode === 'delta' ? (
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <div>
                <label htmlFor="p-delta" className="mb-1 block text-xs text-slate-600">
                  Selisih Poin (+ / -)
                </label>
                <input
                  id="p-delta"
                  type="number"
                  value={pointsDelta}
                  onChange={(e) => setPointsDelta(e.target.value)}
                  className="min-h-[40px] w-full rounded-lg border border-slate-300 bg-white px-3 py-2 font-mono text-sm text-slate-900 tabular-nums focus:border-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-600/20"
                />
              </div>
              <div>
                <label htmlFor="p-reason" className="mb-1 block text-xs text-slate-600">
                  Keterangan Aktivitas (Opsional)
                </label>
                <input
                  id="p-reason"
                  type="text"
                  value={activityTitle}
                  onChange={(e) => setActivityTitle(e.target.value)}
                  placeholder="Mis. Review Proyek Sprint 8"
                  className="min-h-[40px] w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 focus:border-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-600/20"
                />
              </div>
            </div>
          ) : (
            <div>
              <label htmlFor="p-total-points" className="mb-1 block text-xs text-slate-600">
                Total Poin
              </label>
              <input
                id="p-total-points"
                type="number"
                min={0}
                value={totalPoints}
                onChange={(e) => setTotalPoints(e.target.value)}
                className="min-h-[40px] w-full rounded-lg border border-slate-300 bg-white px-3 py-2 font-mono text-sm text-slate-900 tabular-nums focus:border-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-600/20"
              />
            </div>
          )}

          <div className="flex flex-wrap items-center justify-between gap-2 border-t border-slate-200 pt-2.5 text-xs text-slate-600">
            <span>Pratinjau Setelah Simpan:</span>
            <span className="font-mono font-semibold text-slate-900 tabular-nums">
              {formatPoints(previewPoints)} Poin · Level {previewLevel.level} ({previewLevel.title})
            </span>
          </div>
        </div>

        {/* Modules & Notes */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label htmlFor="p-comp-mod" className="mb-1 block text-xs font-semibold text-slate-700">
              Modul Selesai
            </label>
            <input
              id="p-comp-mod"
              type="number"
              min={0}
              value={completedModules}
              onChange={(e) => setCompletedModules(e.target.value)}
              className="min-h-[40px] w-full rounded-lg border border-slate-300 px-3 py-2 font-mono text-sm text-slate-900 tabular-nums focus:border-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-600/20"
            />
          </div>
          <div>
            <label htmlFor="p-tot-mod" className="mb-1 block text-xs font-semibold text-slate-700">
              Total Modul
            </label>
            <input
              id="p-tot-mod"
              type="number"
              min={1}
              value={totalModules}
              onChange={(e) => setTotalModules(e.target.value)}
              className="min-h-[40px] w-full rounded-lg border border-slate-300 px-3 py-2 font-mono text-sm text-slate-900 tabular-nums focus:border-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-600/20"
            />
          </div>
        </div>

        <div>
          <label htmlFor="p-notes" className="mb-1 block text-xs font-semibold text-slate-700">
            Catatan Evaluasi Mentor
          </label>
          <textarea
            id="p-notes"
            rows={3}
            value={mentorNotes}
            onChange={(e) => setMentorNotes(e.target.value)}
            placeholder="Tuliskan arahan atau evaluasi perkembangan peserta..."
            className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 focus:border-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-600/20"
          />
        </div>

        <div className="flex items-center justify-end gap-3 border-t border-slate-100 pt-4">
          <Button variant="secondary" onClick={onClose} disabled={isSubmitting}>
            Batal
          </Button>
          <Button type="submit" variant="primary" isLoading={isSubmitting}>
            {mode === 'create' ? 'Daftarkan Peserta' : 'Simpan Perubahan'}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
