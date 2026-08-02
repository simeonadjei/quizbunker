import type { User } from '@workspace/api-client-react';

const USER_KEY = 'qb_user_v1';
const SUB_END_KEY = 'qb_sub_end_v1';

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
    localStorage.removeItem(SUB_END_KEY);
  } catch {}
}

/**
 * Persist subscription end date so the app can enforce expiry while offline.
 * Pass null to clear (e.g. when subscription is not active).
 */
export function cacheSubscriptionEnd(isoDate: string | null): void {
  try {
    if (isoDate) {
      localStorage.setItem(SUB_END_KEY, isoDate);
    } else {
      localStorage.removeItem(SUB_END_KEY);
    }
  } catch {}
}

/**
 * Returns true when the cached subscription is still active right now.
 * Falls back to true when no date is cached (unknown — allow access).
 */
export function isSubscriptionActiveOffline(): boolean {
  try {
    const raw = localStorage.getItem(SUB_END_KEY);
    if (!raw) return true; // no info — don't block
    return new Date(raw) > new Date();
  } catch {
    return true;
  }
}
