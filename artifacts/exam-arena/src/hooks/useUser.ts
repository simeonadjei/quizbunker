import { useEffect } from 'react';
import { useGetCurrentUser, getGetCurrentUserQueryKey } from '@workspace/api-client-react';
import type { User } from '@workspace/api-client-react';
import { cacheUser, getCachedUser } from '@/lib/offlineUser';

/**
 * Wraps useGetCurrentUser with an offline localStorage fallback.
 * When the network call fails (or is pending) and the device is offline,
 * returns the last-known cached user so the rest of the app keeps working.
 */
export function useUser(): { user: User | undefined; isOfflineFallback: boolean } {
  const {
    data: networkUser,
    error,
    isLoading,
  } = useGetCurrentUser({
    query: {
      queryKey: getGetCurrentUserQueryKey(),
      retry: 1,
      staleTime: 5 * 60 * 1000,
    },
  });

  // Keep cache fresh whenever we have live data
  useEffect(() => {
    if (networkUser) cacheUser(networkUser);
  }, [networkUser]);

  const networkFailed = !isLoading && !!error && !networkUser;
  const cached = networkFailed ? getCachedUser() : null;

  if (networkUser) return { user: networkUser, isOfflineFallback: false };
  if (cached) return { user: cached, isOfflineFallback: true };
  return { user: undefined, isOfflineFallback: false };
}
