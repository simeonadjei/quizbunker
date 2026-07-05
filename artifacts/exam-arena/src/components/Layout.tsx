import { BackgroundParticles } from '@/components/BackgroundParticles';
import { Navbar } from '@/components/Navbar';
import { MusicPlayer } from '@/components/MusicPlayer';
import { ReactNode } from 'react';
import { useLocation } from 'wouter';

export function Layout({ children }: { children: ReactNode }) {
  const [location] = useLocation();
  const isAdmin = location.startsWith('/xk9admin2024');

  return (
    <div className="min-h-[100dvh] flex flex-col relative bg-background">
      {!isAdmin && <BackgroundParticles />}
      {!isAdmin && <Navbar />}
      {/* pt-14 clears the fixed 56px navbar; pb-24 clears the music player */}
      <main className={`flex-1 relative z-10 flex flex-col ${!isAdmin ? 'pt-14 pb-24' : ''}`}>
        {children}
      </main>
      {!isAdmin && <MusicPlayer />}
    </div>
  );
}
