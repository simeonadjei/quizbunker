import { BackgroundParticles } from '@/components/BackgroundParticles';
import { Navbar } from '@/components/Navbar';
import { MusicPlayer } from '@/components/MusicPlayer';
import { ReactNode } from 'react';
import { useLocation } from 'wouter';

interface LayoutProps {
  children: ReactNode;
  /** When true the inner wrapper has no max-width — the page controls its own width */
  wide?: boolean;
}

export function Layout({ children, wide = false }: LayoutProps) {
  const [location] = useLocation();
  const isAdmin = location.startsWith('/xk9admin2024');

  return (
    <div className="min-h-[100dvh] w-full flex flex-col relative bg-background">
      {!isAdmin && <BackgroundParticles />}
      {!isAdmin && <Navbar />}
      {/* pt-14 clears the fixed 56px navbar; pb-24 clears the music player */}
      <main className={`flex-1 relative z-10 w-full flex flex-col items-center ${!isAdmin ? 'pt-14 pb-24' : ''}`}>
        <div className={
          isAdmin
            ? 'w-full flex flex-col flex-1'
            : wide
              ? 'w-full flex flex-col flex-1'
              : 'w-full max-w-md flex flex-col flex-1'
        }>
          {children}
        </div>
      </main>
      {!isAdmin && <MusicPlayer />}
    </div>
  );
}
