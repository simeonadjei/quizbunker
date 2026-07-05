import { Link, useLocation } from 'wouter';
import { useGetCurrentUser, useLogoutUser, getGetCurrentUserQueryKey } from '@workspace/api-client-react';
import { useQueryClient } from '@tanstack/react-query';
import { Gamepad2, LogOut, History, ShieldAlert, Sparkles, Trophy, User as UserIcon } from 'lucide-react';

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
    <nav className="fixed top-0 left-0 right-0 z-40 bg-gradient-to-b from-black/60 to-transparent pt-4 pb-8 pointer-events-none">
      <div className="container mx-auto px-4 flex items-start justify-between pointer-events-auto">
        <Link href="/" className="flex items-center gap-2 group transform transition-transform hover:scale-105 active:scale-95">
          <div className="bg-primary p-2.5 rounded-xl shadow-[0_4px_0_hsl(32,95%,35%),0_4px_10px_rgba(0,0,0,0.5)] border-2 border-white/50">
            <Gamepad2 className="w-8 h-8 text-white" strokeWidth={2.5} />
          </div>
          <div className="flex flex-col -gap-1">
            <span className="font-display text-2xl leading-none text-outline text-white tracking-wider">
              EXAM<span className="text-accent text-outline">ARENA</span>
            </span>
            <span className="font-display text-xs text-secondary tracking-widest text-outline">GHANA</span>
          </div>
        </Link>

        <div className="flex items-center gap-3">
          {user ? (
            <>
              <Link href="/dashboard" className="hud-badge hover:scale-105 transition-transform hidden sm:flex text-white">
                <Gamepad2 className="w-4 h-4 text-primary" />
                <span>ARENA</span>
              </Link>
              <Link href="/history" className="hud-badge hover:scale-105 transition-transform hidden sm:flex text-white">
                <History className="w-4 h-4 text-secondary" />
                <span>LOG</span>
              </Link>
              <Link href="/subscribe" className="hud-badge-gold hover:scale-105 transition-transform flex animate-starPulse">
                <Sparkles className="w-4 h-4" />
                <span>PRO</span>
              </Link>
              
              <div className="hud-badge pl-1 pr-4 hidden md:flex text-white">
                <div className="bg-primary/20 p-1 rounded-full border border-primary/50">
                  <UserIcon className="w-4 h-4 text-primary" />
                </div>
                <span className="ml-2 truncate max-w-[100px]">{user.name.split(' ')[0].toUpperCase()}</span>
              </div>
              
              <button 
                onClick={handleLogout}
                className="bg-destructive/80 p-2.5 rounded-xl shadow-[0_4px_0_hsl(348,83%,27%),0_4px_10px_rgba(0,0,0,0.5)] border-2 border-white/50 text-white hover:scale-105 active:scale-95 transition-transform"
                title="Logout"
              >
                <LogOut className="w-5 h-5" strokeWidth={2.5} />
              </button>
            </>
          ) : (
            <>
              <Link href="/login" className="hud-badge hover:scale-105 transition-transform text-white">
                LOGIN
              </Link>
              <Link href="/register" className="btn-game px-6 py-2.5 text-sm sm:text-base">
                PLAY NOW
              </Link>
            </>
          )}
        </div>
      </div>
    </nav>
  );
}
