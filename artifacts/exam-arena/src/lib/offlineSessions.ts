/**
 * Session index — maps year|subject|week → sessionId so the Dashboard can
 * navigate to a cached session when the device is offline.
 */

const INDEX_KEY = 'qb_session_index_v1';

type SessionIndex = Record<string, number>;

function getIndex(): SessionIndex {
  try {
    const raw = localStorage.getItem(INDEX_KEY);
    return raw ? (JSON.parse(raw) as SessionIndex) : {};
  } catch {
    return {};
  }
}

function saveIndex(idx: SessionIndex): void {
  try {
    localStorage.setItem(INDEX_KEY, JSON.stringify(idx));
  } catch {}
}

function makeKey(year: string, subject: string, week: number): string {
  return `${year}|${subject}|${week}`;
}

/** Register a session so it can be resumed offline. */
export function registerSession(
  year: string,
  subject: string,
  week: number,
  sessionId: number,
): void {
  const idx = getIndex();
  idx[makeKey(year, subject, week)] = sessionId;
  saveIndex(idx);
}

/** Returns the cached sessionId for a given week, or null if not cached. */
export function getCachedSessionId(
  year: string,
  subject: string,
  week: number,
): number | null {
  const idx = getIndex();
  return idx[makeKey(year, subject, week)] ?? null;
}

/** Returns the set of week numbers that have been cached for a subject. */
export function getCachedWeeksForSubject(
  year: string,
  subject: string,
): Set<number> {
  const idx = getIndex();
  const weeks = new Set<number>();
  const prefix = `${year}|${subject}|`;
  for (const key of Object.keys(idx)) {
    if (key.startsWith(prefix)) {
      const w = Number(key.split('|')[2]);
      if (!Number.isNaN(w)) weeks.add(w);
    }
  }
  return weeks;
}
