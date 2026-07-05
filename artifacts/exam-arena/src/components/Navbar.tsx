import { Link, useLocation } from 'wouter';
import { useGetCurrentUser, useLogoutUser, getGetCurrentUserQueryKey } from '@workspace/api-client-react';
import { useQueryClient } from '@tanstack/react-query';
import { LogOut, History, Sparkles, User as UserIcon, Gamepad2 } from 'lucide-react';

export function Navbar() {
  const { data: user } = useGetCurrentUser({ query: { enabled: true, queryKey: getGetCurrentUserQueryKey() } });
  const logout = useLogoutUser();
  const queryClient = useQueryClient();
  const [, setLocation] = useLocation();

  const handleLogout = () => {
    logout.mutate(undefined, {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getGetCurrentUserQueryKey() });
        setLocation('/');
      }
    });
  };

  return (
    <nav className="fixed top-0 left-0 right-0 z-40 bg-background/80 backdrop-blur-md border-b border-white/10 shadow-lg">
      <div className="max-w-screen-lg mx-auto px-2.5 sm:px-4 h-14 flex items-center justify-between gap-1.5 sm:gap-3">

        {/* Logo */}
        <Link href="/" className="flex items-center gap-1.5 sm:gap-2 shrink min-w-0 group">
          <img
            src="/logo.png"
            alt="Quiz Bunker Logo"
            className="h-8 w-8 sm:h-9 sm:w-9 rounded-xl object-cover group-active:translate-y-0.5 transition-transform shrink-0"
            style={{ boxShadow: '0 4px 0 rgba(0,0,0,0.4)' }}
          />
          <div className="flex flex-col leading-none min-w-0">
            <span className="font-display text-xs sm:text-sm leading-tight text-white tracking-wide whitespace-nowrap truncate">
              QUIZ <span className="text-game-title-orange" style={{ WebkitTextStroke: '1px rgba(0,0,0,0.5)' }}>BUNKER</span>
            </span>
            <span className="font-display text-[7px] sm:text-[8px] text-secondary tracking-widest leading-none whitespace-nowrap hidden sm:block">FOR GHANA SHS STUDENTS</span>
          </div>
        </Link>

        {/* Nav actions */}
        <div className="flex items-center gap-1 sm:gap-2 shrink-0">
          {user ? (
            <>
              <Link href="/dashboard" className="hud-badge hover:scale-105 transition-transform hidden sm:flex">
                <Gamepad2 className="w-3.5 h-3.5 text-primary" />
                <span>PLAY</span>
              </Link>
              <Link href="/history" className="hud-badge hover:scale-105 transition-transform hidden sm:flex">
                <History className="w-3.5 h-3.5 text-secondary" />
                <span>LOG</span>
              </Link>
              <Link href="/subscribe" className="hud-badge-gold hover:scale-105 transition-transform flex !px-2.5 sm:!px-3 !text-xs sm:!text-sm">
                <Sparkles className="w-3.5 h-3.5" />
                <span>PRO</span>
              </Link>
              <div className="hud-badge pl-1 pr-2 sm:pr-3 hidden sm:flex">
                <div className="bg-primary/30 p-1 rounded-full border border-primary/50">
                  <UserIcon className="w-3.5 h-3.5 text-primary" />
                </div>
                <span className="ml-1 truncate max-w-[80px] text-xs">{user.name.split(' ')[0].toUpperCase()}</span>
              </div>
              <button
                onClick={handleLogout}
                className="bg-destructive/80 p-1.5 sm:p-2 rounded-xl border-2 border-white/30 text-white hover:scale-105 active:translate-y-0.5 transition-transform shrink-0"
                style={{ boxShadow: '0 3px 0 hsl(0 85% 35%)' }}
                title="Logout"
              >
                <LogOut className="w-4 h-4" strokeWidth={2.5} />
              </button>
            </>
          ) : (
            <>
              <Link href="/login" className="hud-badge hover:scale-105 transition-transform text-xs sm:text-sm !px-2.5 sm:!px-3 shrink-0">
                LOGIN
              </Link>
              <Link href="/register" className="btn-game px-3 py-1.5 sm:px-5 sm:py-2 text-xs sm:text-sm whitespace-nowrap shrink-0">
                PLAY NOW
              </Link>
            </>
          )}
        </div>

      </div>
    </nav>
  );
}
