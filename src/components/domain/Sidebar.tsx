import { GraduationCap, LayoutDashboard, LogOut, Trophy, Users, X } from 'lucide-react';
import { AuthUser, PageRoute } from '../../types';
import { Avatar } from '../ui/Avatar';
import { Badge } from '../ui/Badge';

interface SidebarProps {
  currentPage: Exclude<PageRoute, 'login'>;
  onNavigate: (page: Exclude<PageRoute, 'login'>) => void;
  user: AuthUser;
  onLogout: () => void;
  isMobileOpen: boolean;
  onCloseMobile: () => void;
}

interface NavItem {
  id: Exclude<PageRoute, 'login'>;
  label: string;
  description: string;
  icon: typeof LayoutDashboard;
}

const NAV_ITEMS: NavItem[] = [
  {
    id: 'dashboard',
    label: 'Dashboard Peserta',
    description: 'Poin, level & aktivitas',
    icon: LayoutDashboard,
  },
  {
    id: 'leaderboard',
    label: 'Leaderboard',
    description: 'Peringkat seluruh peserta',
    icon: Trophy,
  },
  {
    id: 'mentor',
    label: 'Panel Mentor',
    description: 'Kelola progres & poin',
    icon: Users,
  },
];

export function Sidebar({
  currentPage,
  onNavigate,
  user,
  onLogout,
  isMobileOpen,
  onCloseMobile,
}: SidebarProps) {
  const handleSelect = (page: Exclude<PageRoute, 'login'>) => {
    onNavigate(page);
    onCloseMobile();
  };

  const sidebarContent = (
    <div className="flex h-full flex-col justify-between bg-white border-r border-slate-200">
      <div>
        {/* Brand Header */}
        <div className="flex h-16 items-center justify-between border-b border-slate-200 px-5">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-blue-700 text-white">
              <GraduationCap className="h-4 w-4" aria-hidden="true" />
            </div>
            <span className="font-display text-base font-bold tracking-tight text-slate-900 whitespace-nowrap truncate">
              Akademi Progres
            </span>
          </div>
          <button
            type="button"
            onClick={onCloseMobile}
            aria-label="Tutup menu navigasi"
            className="flex h-9 w-9 items-center justify-center rounded-lg text-slate-500 hover:bg-slate-100 hover:text-slate-900 lg:hidden cursor-pointer"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Navigation Links */}
        <nav aria-label="Navigasi utama" className="px-3 py-5">
          <p className="px-3 pb-2 text-xs font-medium text-slate-400">Menu Utama</p>
          <ul className="space-y-1">
            {NAV_ITEMS.map((item) => {
              const Icon = item.icon;
              const isActive = currentPage === item.id;
              return (
                <li key={item.id}>
                  <button
                    type="button"
                    onClick={() => handleSelect(item.id)}
                    aria-current={isActive ? 'page' : undefined}
                    className={`flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left transition-colors duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600 cursor-pointer ${
                      isActive
                        ? 'bg-blue-50 text-blue-800'
                        : 'text-slate-700 hover:bg-slate-100 hover:text-slate-900'
                    }`}
                  >
                    <Icon
                      className={`h-4 w-4 shrink-0 ${
                        isActive ? 'text-blue-700' : 'text-slate-500'
                      }`}
                      aria-hidden="true"
                    />
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-semibold whitespace-nowrap truncate">
                        {item.label}
                      </p>
                      <p
                        className={`text-xs truncate ${
                          isActive ? 'text-blue-700/80' : 'text-slate-500'
                        }`}
                      >
                        {item.description}
                      </p>
                    </div>
                  </button>
                </li>
              );
            })}
          </ul>
        </nav>
      </div>

      {/* Account Footer */}
      <div className="border-t border-slate-200 p-4">
        <div className="flex items-center gap-3">
          <Avatar src={user.avatarUrl} name={user.name} size="md" />
          <div className="min-w-0 flex-1">
            <p className="text-sm font-semibold text-slate-900 truncate">{user.name}</p>
            <div className="mt-0.5 flex items-center gap-1.5">
              <Badge variant={user.role === 'mentor' ? 'info' : 'neutral'}>
                {user.role === 'mentor' ? 'Mentor' : 'Peserta'}
              </Badge>
            </div>
          </div>
        </div>
        <button
          type="button"
          onClick={onLogout}
          className="mt-3 flex min-h-[40px] w-full items-center justify-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-medium text-slate-700 transition-colors hover:bg-slate-50 hover:text-red-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600 whitespace-nowrap cursor-pointer"
        >
          <LogOut className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
          <span>Keluar Akun</span>
        </button>
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop Persistent Sidebar */}
      <aside className="hidden lg:fixed lg:inset-y-0 lg:left-0 lg:z-30 lg:block lg:w-64">
        {sidebarContent}
      </aside>

      {/* Mobile / Tablet Drawer */}
      {isMobileOpen && (
        <div className="fixed inset-0 z-40 lg:hidden">
          <div
            className="fixed inset-0 bg-slate-900/50 backdrop-blur-[1px]"
            aria-hidden="true"
            onClick={onCloseMobile}
          />
          <aside className="relative z-10 h-full w-72 max-w-[85vw]">
            {sidebarContent}
          </aside>
        </div>
      )}
    </>
  );
}
