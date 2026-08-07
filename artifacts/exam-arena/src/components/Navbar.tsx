import { Link, useLocation } from 'wouter';
import { useLogoutUser, getGetCurrentUserQueryKey } from '@workspace/api-client-react';
import { useQueryClient } from '@tanstack/react-query';
import { LogOut, History, Sparkles, User as UserIcon, Gamepad2, WifiOff, Trophy } from 'lucide-react';
import { useUser } from '@/hooks/useUser';
import { clearCachedUser } from '@/lib/offlineUser';

export function Navbar() {
  const { user, isOfflineFallback } = useUser();
  const logout = useLogoutUser();
  const queryClient = useQueryClient();
  const [, setLocation] = useLocation();

  const handleLogout = () => {
    // Optimistically clear client state immediately — don't wait for server round-trip
    clearCachedUser();
    queryClient.setQueryData(getGetCurrentUserQueryKey(), null);
    queryClient.removeQueries({ queryKey: getGetCurrentUserQueryKey() });
    setLocation('/');
    // Fire server-side session invalidation in the background
    logout.mutate(undefined, {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getGetCurrentUserQueryKey() });
      },
    });
  };

  return (
    <nav className="fixed top-0 left-0 right-0 z-40 bg-background/80 backdrop-blur-md border-b border-white/10 shadow-lg">
        {/* Keep one explicit height per breakpoint. Layout and sticky page
            controls use the same values so they cannot slide underneath this
            fixed bar. Portrait phones need room for the logo and actions rows. */}
        <div className="max-w-screen-lg mx-auto w-full px-1.5 sm:px-4 h-[7.5rem] sm:h-14 lg:h-24 py-1 sm:py-0 flex flex-col sm:flex-row items-center justify-center sm:justify-between gap-1 sm:gap-3">

        {/* Logo */}
          <Link href="/" className="w-full sm:w-auto flex items-center gap-1 sm:gap-2 lg:gap-4 shrink min-w-0 lg:shrink-0 group">
          <img
            src="/logo.png"
            alt="Quiz Bunker Logo"
            className="h-7 w-7 sm:h-9 sm:w-9 lg:h-20 lg:w-20 rounded-lg sm:rounded-xl lg:rounded-2xl object-cover group-active:translate-y-0.5 transition-transform shrink-0"
            style={{ boxShadow: '0 4px 0 rgba(0,0,0,0.4)' }}
          />
          <div className="flex flex-col leading-none min-w-0 lg:min-w-max">
            <span className="font-display text-[10px] sm:text-sm lg:text-3xl leading-tight text-white tracking-wide whitespace-nowrap truncate lg:overflow-visible">
              QUIZ <span className="text-game-title-orange" style={{ WebkitTextStroke: '1px rgba(0,0,0,0.5)' }}>BUNKER</span>
            </span>
            <span className="font-display text-[7px] sm:text-[8px] lg:text-sm text-secondary tracking-widest leading-none whitespace-nowrap hidden xl:block">Quiz for Ghana students</span>
          </div>
        </Link>

        {/* Nav actions */}
        <div className="w-full sm:w-auto flex items-center justify-between sm:justify-end gap-0.5 sm:gap-2 shrink-0">
          {user ? (
            <>
              <Link href="/dashboard" aria-label="Play" title="Play" className="hud-badge hover:scale-105 transition-transform !px-1.5 sm:!px-3">
                <Gamepad2 className="w-3.5 h-3.5 text-primary" />
                <span className="inline text-[9px] sm:text-sm">PLAY</span>
              </Link>
              <Link href="/history" aria-label="History" title="History" className="hud-badge hover:scale-105 transition-transform !px-1.5 sm:!px-3">
                <History className="w-3.5 h-3.5 text-secondary" />
                <span className="inline text-[9px] sm:text-sm">LOG</span>
              </Link>
              <Link href="/leaderboard" aria-label="Leaderboard" title="Leaderboard" className="hud-badge hover:scale-105 transition-transform !px-1.5 sm:!px-3">
                <Trophy className="w-3.5 h-3.5 text-yellow-400" />
                <span className="inline text-[9px] sm:text-sm">TOP</span>
              </Link>
              <Link href="/subscribe" aria-label="Subscribe" title="Subscribe" className="hud-badge-gold hover:scale-105 transition-transform flex !px-1.5 sm:!px-3 !text-xs sm:!text-sm">
                <Sparkles className="w-3.5 h-3.5" />
                <span className="inline text-[9px] sm:text-sm">PRO</span>
              </Link>
              <div className="hud-badge pl-1 pr-1.5 sm:pr-3 min-w-0 max-w-[76px] sm:max-w-[120px]" title={user.name}>
                <div className="bg-primary/30 p-1 rounded-full border border-primary/50">
                  {isOfflineFallback
                    ? <WifiOff className="w-3.5 h-3.5 text-yellow-400" />
                    : <UserIcon className="w-3.5 h-3.5 text-primary" />}
                </div>
                <span className="ml-1 truncate max-w-[47px] sm:max-w-[80px] text-[9px] sm:text-xs">{user.name.split(' ')[0].toUpperCase()}</span>
              </div>
              <button
                onClick={handleLogout}
                disabled={logout.isPending}
                aria-label="Log out"
                className="hud-badge hover:scale-105 active:translate-y-0.5 transition-transform shrink-0 !px-1.5 sm:!px-3 !border-red-500/40 !text-red-400 hover:!bg-red-500/15 disabled:opacity-60"
                title="Log out"
              >
                <LogOut className="w-3.5 h-3.5" strokeWidth={2.5} />
                 <span className="inline text-[9px] sm:text-sm">OUT</span>
              </button>
            </>
          ) : (
            <>
              <Link href="/login" className="btn-game px-3 py-1.5 sm:px-5 sm:py-2 text-xs sm:text-sm whitespace-nowrap shrink-0">
                LOGIN
              </Link>
              <Link href="/register" className="btn-game px-3 py-1.5 sm:px-5 sm:py-2 text-xs sm:text-sm whitespace-nowrap shrink-0">
                PLAY NOW
              </Link>
              {/* Create Account — desktop only, right of PLAY NOW */}
              <Link
                href="/register"
                className="hidden lg:flex items-center gap-2 rounded-xl font-display uppercase tracking-wide transition-transform hover:scale-105 active:scale-95 whitespace-nowrap shrink-0"
                style={{
                  background: 'linear-gradient(135deg,#facc15,#f97316)',
                  color: '#1c1917',
                  boxShadow: '0 4px 0 #92400e, 0 6px 18px rgba(249,115,22,0.45)',
                  fontSize: '14px',
                  padding: '10px 20px',
                }}
              >
                🚀 CREATE ACCOUNT
              </Link>
              {/* Subtitle — only on extra-large screens where there's room */}
              <div className="hidden xl:flex flex-col justify-center ml-3 pl-3 border-l border-white/20">
                <span className="font-bold text-lg text-white/95 leading-tight whitespace-nowrap">Ghana's top exam practice platform.</span>
                <span className="font-bold text-base leading-tight whitespace-nowrap" style={{ color: '#fde68a' }}>Crush likely examinable questions.</span>
              </div>
            </>
          )}
        </div>

      </div>
    </nav>
  );
}
