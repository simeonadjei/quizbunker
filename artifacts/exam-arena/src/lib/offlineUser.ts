import type { User } from '@workspace/api-client-react';

const USER_KEY = 'qb_user_v1';

/** Persist user to localStorage so they're recognised offline. */
export function cacheUser(user: User): void {
  try {
    localStorage.setItem(USER_KEY, JSON.stringify(user));
  } catch {}
}

/** Retrieve last-known user from cache. Returns null if nothing stored. */
export function getCachedUser(): User | null {
  try {
    const raw = localStorage.getItem(USER_KEY);
    return raw ? (JSON.parse(raw) as User) : null;
  } catch {
    return null;
  }
}

/** Remove user cache (call on logout). */
export function clearCachedUser(): void {
  try {
    localStorage.removeItem(USER_KEY);
  } catch {}
}
