import { GraduationCap } from 'lucide-react';
import { LoginForm } from '../components/domain/LoginForm';
import { LoginPayload } from '../types';

interface LoginPageProps {
  onLogin: (payload: LoginPayload) => Promise<void>;
  isLoading: boolean;
  errorMessage: string | null;
  successMessage: string | null;
  onClearFeedback: () => void;
}

export function LoginPage({
  onLogin,
  isLoading,
  errorMessage,
  successMessage,
  onClearFeedback,
}: LoginPageProps) {
  return (
    <div className="min-h-screen bg-slate-50 lg:grid lg:grid-cols-12 lg:items-stretch">
      {/* Left Showcase Column (Desktop) */}
      <div className="relative hidden lg:col-span-7 lg:flex lg:flex-col lg:justify-between overflow-hidden bg-slate-900">
        <img
          src="/src/assets/images/login_studio_showcase_1794843873167.jpg"
          alt="Suasana ruang belajar dan mentoring Akademi Progres"
          referrerPolicy="no-referrer"
          className="absolute inset-0 h-full w-full object-cover"
        />
        <div
          aria-hidden="true"
          className="absolute inset-0 bg-gradient-to-t from-slate-950/95 via-slate-900/60 to-slate-900/35"
        />

        {/* Brand Mark Top */}
        <div className="relative z-10 flex items-center gap-3 p-10">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-600 text-white">
            <GraduationCap className="h-5 w-5" aria-hidden="true" />
          </div>
          <span className="font-display text-lg font-bold tracking-tight text-white">
            Akademi Progres
          </span>
        </div>

        {/* Bottom Editorial Copy */}
        <div className="relative z-10 p-10">
          <p className="text-xs font-medium tracking-wide text-blue-300">
            Sistem Pemantauan Kompetensi Angkatan 08
          </p>
          <h1 className="mt-2 max-w-xl font-display text-4xl font-bold leading-tight text-white text-balance">
            Pantau Progres Belajar dan Peringkat Peserta Secara Terukur
          </h1>
          <p className="mt-4 max-w-lg text-sm leading-relaxed text-slate-200">
            Satu portal terpadu bagi peserta untuk melihat pencapaian poin dan level, serta bagi
            mentor untuk mengevaluasi perkembangan belajar secara objektif.
          </p>

          <div className="mt-8 grid max-w-xl grid-cols-3 gap-6 border-t border-white/15 pt-6">
            <div>
              <p className="font-mono text-2xl font-bold text-white tabular-nums">4</p>
              <p className="mt-0.5 text-xs text-slate-300">Jalur Kompetensi</p>
            </div>
            <div>
              <p className="font-mono text-2xl font-bold text-white tabular-nums">6</p>
              <p className="mt-0.5 text-xs text-slate-300">Jenjang Level</p>
            </div>
            <div>
              <p className="font-mono text-2xl font-bold text-white tabular-nums">20</p>
              <p className="mt-0.5 text-xs text-slate-300">Modul Kurikulum</p>
            </div>
          </div>
        </div>
      </div>

      {/* Right Form Column */}
      <main className="flex min-h-screen flex-col justify-center px-5 py-10 sm:px-8 lg:col-span-5 lg:px-14 bg-white">
        <div className="mx-auto w-full max-w-md">
          {/* Mobile Brand Header */}
          <div className="mb-8 flex items-center gap-2.5 lg:hidden">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-blue-700 text-white">
              <GraduationCap className="h-5 w-5" aria-hidden="true" />
            </div>
            <span className="font-display text-lg font-bold tracking-tight text-slate-900">
              Akademi Progres
            </span>
          </div>

          <LoginForm
            onSubmit={onLogin}
            isLoading={isLoading}
            errorMessage={errorMessage}
            successMessage={successMessage}
            onClearFeedback={onClearFeedback}
          />
        </div>
      </main>
    </div>
  );
}
