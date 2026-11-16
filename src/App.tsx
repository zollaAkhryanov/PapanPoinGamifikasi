import { useCallback, useEffect, useState } from 'react';
import { Navbar } from './components/domain/Navbar';
import { Sidebar } from './components/domain/Sidebar';
import { ToastContainer } from './components/ui/ToastContainer';
import { DashboardPage } from './pages/DashboardPage';
import { LeaderboardPage } from './pages/LeaderboardPage';
import { LoginPage } from './pages/LoginPage';
import { MentorPanelPage } from './pages/MentorPanelPage';
import { academyService } from './services/academyService';
import { AuthUser, LoginPayload, PageRoute, ToastMessage } from './types';

function readHashRoute(): Exclude<PageRoute, 'login'> | null {
  const hash = window.location.hash.replace('#', '').trim();
  if (hash === 'dashboard' || hash === 'leaderboard' || hash === 'mentor') {
    return hash;
  }
  return null;
}

export default function App() {
  const [user, setUser] = useState<AuthUser | null>(() => {
    const session = academyService.getStoredSession();
    return session?.user ?? null;
  });

  const [currentPage, setCurrentPage] = useState<Exclude<PageRoute, 'login'>>(() => {
    const fromHash = readHashRoute();
    if (fromHash) return fromHash;
    const session = academyService.getStoredSession();
    return session?.user.role === 'mentor' ? 'mentor' : 'dashboard';
  });

  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  // Login states
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  const [loginError, setLoginError] = useState<string | null>(null);
  const [loginSuccess, setLoginSuccess] = useState<string | null>(null);

  // Toast notifications
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  const pushToast = useCallback(
    (
      type: ToastMessage['type'],
      title: string,
      description?: string
    ) => {
      const id = `toast-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
      setToasts((prev) => [...prev, { id, type, title, description }]);
      window.setTimeout(() => {
        setToasts((prev) => prev.filter((item) => item.id !== id));
      }, 4500);
    },
    []
  );

  const dismissToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((item) => item.id !== id));
  }, []);

  const navigateTo = useCallback((page: Exclude<PageRoute, 'login'>) => {
    setCurrentPage(page);
    window.location.hash = page;
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, []);

  useEffect(() => {
    const handleHashChange = () => {
      const target = readHashRoute();
      if (target) {
        setCurrentPage(target);
      }
    };
    window.addEventListener('hashchange', handleHashChange);
    return () => window.removeEventListener('hashchange', handleHashChange);
  }, []);

  const handleLogin = async (payload: LoginPayload) => {
    setIsLoggingIn(true);
    setLoginError(null);
    setLoginSuccess(null);

    try {
      const response = await academyService.login(payload);
      setLoginSuccess(`Selamat datang kembali, ${response.user.name}. Mengalihkan ke portal...`);
      const defaultPage: Exclude<PageRoute, 'login'> =
        response.user.role === 'mentor' ? 'mentor' : 'dashboard';

      window.setTimeout(() => {
        setUser(response.user);
        setCurrentPage(defaultPage);
        window.location.hash = defaultPage;
        setLoginSuccess(null);
        pushToast(
          'success',
          'Berhasil Masuk',
          `Anda masuk sebagai ${response.user.name} (${response.user.role === 'mentor' ? 'Mentor' : 'Peserta'}).`
        );
      }, 350);
    } catch (err) {
      const message =
        err instanceof Error
          ? err.message
          : 'Terjadi kesalahan saat masuk. Silakan coba lagi.';
      setLoginError(message);
    } finally {
      setIsLoggingIn(false);
    }
  };

  const handleLogout = async () => {
    await academyService.logout();
    setUser(null);
    setIsMobileMenuOpen(false);
    setLoginError(null);
    setLoginSuccess(null);
    window.location.hash = '';
    pushToast('info', 'Sesi Berakhir', 'Anda telah keluar dari akun.');
  };

  const handleSwitchToMentorDemo = async () => {
    try {
      const response = await academyService.login({
        identifier: 'mentor@akademi.id',
        password: 'mentor123',
      });
      setUser(response.user);
      setCurrentPage('mentor');
      window.location.hash = 'mentor';
      pushToast(
        'success',
        'Beralih ke Akun Mentor',
        `Anda kini masuk sebagai ${response.user.name}.`
      );
    } catch (err) {
      pushToast(
        'error',
        'Gagal Beralih Akun',
        err instanceof Error ? err.message : 'Tidak dapat beralih ke akun mentor.'
      );
    }
  };

  return (
    <>
      {!user ? (
        <LoginPage
          onLogin={handleLogin}
          isLoading={isLoggingIn}
          errorMessage={loginError}
          successMessage={loginSuccess}
          onClearFeedback={() => {
            setLoginError(null);
            setLoginSuccess(null);
          }}
        />
      ) : (
        <div className="min-h-screen bg-slate-50 text-slate-900">
          <Sidebar
            currentPage={currentPage}
            onNavigate={navigateTo}
            user={user}
            onLogout={() => void handleLogout()}
            isMobileOpen={isMobileMenuOpen}
            onCloseMobile={() => setIsMobileMenuOpen(false)}
          />

          <div className="flex min-h-screen flex-col lg:pl-64">
            <Navbar
              currentPage={currentPage}
              user={user}
              onOpenMobileMenu={() => setIsMobileMenuOpen(true)}
              onLogout={() => void handleLogout()}
            />

            <main className="mx-auto w-full max-w-7xl flex-1 px-4 py-6 sm:px-6 lg:px-8">
              {currentPage === 'dashboard' && (
                <DashboardPage user={user} onNavigate={navigateTo} />
              )}
              {currentPage === 'leaderboard' && <LeaderboardPage user={user} />}
              {currentPage === 'mentor' && (
                <MentorPanelPage
                  user={user}
                  onSwitchToMentorDemo={handleSwitchToMentorDemo}
                  onNotify={pushToast}
                />
              )}
            </main>
          </div>
        </div>
      )}

      <ToastContainer toasts={toasts} onDismiss={dismissToast} />
    </>
  );
}
