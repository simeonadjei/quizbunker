import { BackgroundParticles } from '@/components/BackgroundParticles';
import { Navbar } from '@/components/Navbar';
import { MusicPlayer } from '@/components/MusicPlayer';
import { OfflineCacheBanner } from '@/components/OfflineCacheBanner';
import { ReactNode, useEffect, useState } from 'react';
import { useLocation } from 'wouter';
import { useGetPaymentStatus, getGetPaymentStatusQueryKey } from '@workspace/api-client-react';
import { useOfflinePreCache } from '@/hooks/useOfflinePreCache';
import { cacheSubscriptionEnd } from '@/lib/offlineUser';

function useOnlineStatus() {
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  useEffect(() => {
    const on = () => setIsOnline(true);
    const off = () => setIsOnline(false);
    window.addEventListener('online', on);
    window.addEventListener('offline', off);
    return () => { window.removeEventListener('online', on); window.removeEventListener('offline', off); };
  }, []);
  return isOnline;
}

interface LayoutProps {
  children: ReactNode;
  /** When true the inner wrapper has no max-width — the page controls its own width */
  wide?: boolean;
}

export function Layout({ children, wide = false }: LayoutProps) {
  const [location] = useLocation();
  const isAdmin = location.startsWith('/xk9admin2024');
  const isOnline = useOnlineStatus();

  const { data: subStatus } = useGetPaymentStatus({
    query: { enabled: !isAdmin, queryKey: getGetPaymentStatusQueryKey() },
  });

  useEffect(() => {
    if (subStatus !== undefined) {
      cacheSubscriptionEnd(subStatus.isActive ? (subStatus.subscriptionEnd ?? null) : null);
    }
  }, [subStatus]);

  const isSubscribed = !!subStatus?.isActive;

  // Run the pre-cache once globally so it persists even if the user navigates away
  const preCache = useOfflinePreCache(!isAdmin && isSubscribed && isOnline);

  return (
    <div className="min-h-[100dvh] w-full flex flex-col relative bg-background">
      {!isAdmin && <BackgroundParticles />}
      {!isAdmin && <Navbar />}
      {!isAdmin && <OfflineCacheBanner state={preCache} />}
       {/* Portrait navbar uses two compact rows; sm screens use 56px and desktop uses 96px. */}
       <main className={`flex-1 relative z-10 w-full flex flex-col items-center ${!isAdmin ? 'pt-24 sm:pt-14 lg:pt-24 pb-24' : ''}`}>
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
