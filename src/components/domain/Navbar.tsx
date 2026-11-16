import { ChevronRight, LogOut, Menu } from 'lucide-react';
import { AuthUser, PageRoute } from '../../types';
import { Avatar } from '../ui/Avatar';

interface NavbarProps {
  currentPage: Exclude<PageRoute, 'login'>;
  user: AuthUser;
  onOpenMobileMenu: () => void;
  onLogout: () => void;
}

const PAGE_TITLES: Record<Exclude<PageRoute, 'login'>, string> = {
  dashboard: 'Dashboard Peserta',
  leaderboard: 'Leaderboard',
  mentor: 'Panel Mentor',
};

export function Navbar({
  currentPage,
  user,
  onOpenMobileMenu,
  onLogout,
}: NavbarProps) {
  return (
    <header className="sticky top-0 z-20 flex h-16 items-center justify-between gap-4 border-b border-slate-200 bg-white/95 px-4 backdrop-blur-sm sm:px-6 lg:px-8">
      {/* Left: Mobile Trigger + Breadcrumb */}
      <div className="flex items-center gap-3 min-w-0">
        <button
          type="button"
          onClick={onOpenMobileMenu}
          aria-label="Buka menu navigasi"
          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-700 hover:bg-slate-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600 lg:hidden cursor-pointer"
        >
          <Menu className="h-5 w-5" />
        </button>

        <nav aria-label="Breadcrumb" className="flex items-center gap-1.5 text-sm min-w-0">
          <span className="hidden text-slate-500 sm:inline whitespace-nowrap">
            Akademi Progres
          </span>
          <ChevronRight
            className="hidden h-4 w-4 shrink-0 text-slate-400 sm:inline"
            aria-hidden="true"
          />
          <h1 className="font-display text-base font-semibold text-slate-900 whitespace-nowrap truncate">
            {PAGE_TITLES[currentPage]}
          </h1>
        </nav>
      </div>

      {/* Right: Account Summary & Single Primary Action */}
      <div className="flex items-center gap-4 shrink-0">
        <div className="hidden sm:flex items-center gap-2.5 text-right">
          <div>
            <p className="text-sm font-medium text-slate-900 whitespace-nowrap leading-tight">
              {user.name}
            </p>
            <p className="text-xs text-slate-500 whitespace-nowrap">
              {user.role === 'mentor' ? 'Mentor Pembimbing' : `${user.track ?? 'Umum'} · ${user.cohort ?? 'Angkatan 08'}`}
            </p>
          </div>
          <Avatar src={user.avatarUrl} name={user.name} size="sm" />
        </div>

        <button
          type="button"
          onClick={onLogout}
          className="inline-flex min-h-[38px] items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 transition-colors hover:bg-slate-50 hover:text-red-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600 whitespace-nowrap shrink-0 cursor-pointer"
        >
          <LogOut className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
          <span>Keluar</span>
        </button>
      </div>
    </header>
  );
}
