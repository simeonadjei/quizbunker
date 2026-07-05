import { Link, useLocation } from 'wouter';
import { useGetCurrentUser, useLogoutUser, getGetCurrentUserQueryKey } from '@workspace/api-client-react';
import { useQueryClient } from '@tanstack/react-query';
import { Gamepad2, LogOut, History, ShieldAlert, Sparkles } from 'lucide-react';

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
    <nav className="border-b border-primary/20 bg-background/50 backdrop-blur-md sticky top-0 z-40">
      <div className="container mx-auto px-4 h-16 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2 group">
          <div className="bg-primary/20 p-2 rounded-lg group-hover:bg-primary/30 transition-colors">
            <Gamepad2 className="w-6 h-6 text-primary glow-text" />
          </div>
          <span className="font-bold text-xl tracking-tight text-foreground group-hover:text-primary transition-colors">
            EXAM<span className="text-primary">ARENA</span>
          </span>
        </Link>

        <div className="flex items-center gap-6">
          {user ? (
            <>
              <Link href="/dashboard" className="text-sm font-medium hover:text-primary transition-colors hidden sm:block">
                ARENA
              </Link>
              <Link href="/history" className="text-sm font-medium hover:text-primary transition-colors hidden sm:flex items-center gap-1">
                <History className="w-4 h-4" /> BATTLE LOG
              </Link>
              <Link href="/subscribe" className="text-sm font-medium text-accent hover:text-accent/80 transition-colors flex items-center gap-1 glow-text">
                <Sparkles className="w-4 h-4" /> POWER UP
              </Link>
              <div className="h-6 w-px bg-border hidden sm:block" />
              <div className="flex items-center gap-4">
                <span className="text-sm font-mono text-muted-foreground hidden lg:inline-block">
                  PLAYER: {user.name.toUpperCase()}
                </span>
                <button 
                  onClick={handleLogout}
                  className="text-sm flex items-center gap-2 text-destructive hover:text-destructive/80 transition-colors"
                >
                  <LogOut className="w-4 h-4" />
                  <span className="hidden md:inline-block">LOGOUT</span>
                </button>
              </div>
            </>
          ) : (
            <>
              <Link href="/login" className="text-sm font-medium hover:text-primary transition-colors">
                LOGIN
              </Link>
              <Link href="/register" className="text-sm font-bold bg-primary text-primary-foreground px-4 py-2 rounded-md neon-button">
                JOIN TOURNAMENT
              </Link>
            </>
          )}
        </div>
      </div>
    </nav>
  );
}
