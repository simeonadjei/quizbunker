/**
 * useOfflinePreCache
 *
 * After login, silently pre-caches EVERY quiz session and EVERY song audio
 * file so the entire app is playable offline without the user needing to
 * visit each week individually first.
 *
 * Strategy:
 *  1. Fetch question filters → enumerate all year/subject/week combos
 *  2. For each combo, create a quiz session (or reuse existing one from the
 *     session index) and store it in localStorage — identical to what the
 *     Quiz page does on first load.
 *  3. Fetch all songs, then pull each audio file into the 'audio-cache'
 *     Cache API bucket so the service worker serves it offline.
 *
 * A fingerprint stored in localStorage prevents redundant re-runs when the
 * question/song set hasn't changed.
 */

import { useEffect, useRef, useState } from 'react';
import {
  getQuestionFilters,
  createQuizSession,
  getQuizSession,
  listSongs,
} from '@workspace/api-client-react';
import {
  getCachedSessionId,
  registerSession,
} from '@/lib/offlineSessions';

const CACHE_PREFIX   = 'qb_session_';
const FINGERPRINT_KEY = 'qb_offline_fp_v1';
const AUDIO_CACHE_NAME = 'audio-cache';

function storeSession(id: number, data: unknown) {
  try {
    localStorage.setItem(`${CACHE_PREFIX}${id}`, JSON.stringify(data));
  } catch {}
}

function makeFingerprint(
  filters: { years: string[]; subjects: string[]; weeks: number[] },
  songIds: number[],
) {
  const parts = [
    filters.years.sort().join(','),
    filters.subjects.sort().join(','),
    filters.weeks.sort((a, b) => a - b).join(','),
    songIds.sort((a, b) => a - b).join(','),
  ];
  return parts.join('|');
}

export type PreCacheStatus = 'idle' | 'running' | 'done' | 'error';

export interface PreCacheState {
  status: PreCacheStatus;
  /** 0–100 */
  progress: number;
  /** Human-readable current step */
  label: string;
}

/**
 * @param enabled Pass `true` only when the user is authenticated.
 */
export function useOfflinePreCache(enabled: boolean): PreCacheState {
  const [state, setState] = useState<PreCacheState>({
    status: 'idle',
    progress: 0,
    label: '',
  });
  const runningRef = useRef(false);

  useEffect(() => {
    if (!enabled || runningRef.current) return;

    // Only run in browsers that support the Cache API (service worker env)
    if (typeof caches === 'undefined') return;

    runningRef.current = true;

    (async () => {
      try {
        setState({ status: 'running', progress: 2, label: 'Checking content…' });

        // ── Step 1: fetch filters & songs list ──────────────────────────────
        const [filters, songs] = await Promise.all([
          getQuestionFilters(),
          listSongs(),
        ]);

        const allCombos: Array<{ year: string; subject: string; week: number }> = [];
        for (const year of filters.years) {
          for (const subject of filters.subjects) {
            for (const week of filters.weeks) {
              allCombos.push({ year, subject, week });
            }
          }
        }

        const songIds = songs.map((s) => s.id);
        const fp = makeFingerprint(filters, songIds);

        // Skip if nothing has changed since last run
        if (localStorage.getItem(FINGERPRINT_KEY) === fp) {
          setState({ status: 'done', progress: 100, label: 'Offline ready' });
          runningRef.current = false;
          return;
        }

        const total = allCombos.length + songs.length;
        let done = 0;

        const tick = (label: string) => {
          done++;
          setState({
            status: 'running',
            progress: Math.round((done / total) * 95) + 2,
            label,
          });
        };

        // ── Step 2: pre-cache quiz sessions ────────────────────────────────
        for (const { year, subject, week } of allCombos) {
          try {
            let sessionId = getCachedSessionId(year, subject, week);

            if (!sessionId) {
              // Create a new session server-side
              const session = await createQuizSession({ year, subject, week });
              sessionId = session.id;
              registerSession(year, subject, week, sessionId);
            }

            // Fetch full session detail (questions + answers) and store locally
            const detail = await getQuizSession(sessionId);
            storeSession(sessionId, detail);
          } catch {
            // Non-fatal: skip this combo silently
          }
          tick(`Caching ${subject} week ${week}…`);
        }

        // ── Step 3: pre-cache song audio files ─────────────────────────────
        const audioCache = await caches.open(AUDIO_CACHE_NAME);

        for (const song of songs) {
          try {
            const audioUrl = song.url; // /api/songs/:id/audio
            // Only fetch if not already cached
            const existing = await audioCache.match(audioUrl);
            if (!existing) {
              await audioCache.add(audioUrl);
            }
          } catch {
            // Non-fatal: offline audio just won't work for this song
          }
          tick(`Caching song: ${song.title}…`);
        }

        // ── Done ────────────────────────────────────────────────────────────
        localStorage.setItem(FINGERPRINT_KEY, fp);
        setState({ status: 'done', progress: 100, label: 'Offline ready ✓' });
      } catch {
        setState({ status: 'error', progress: 0, label: 'Offline cache failed' });
      } finally {
        runningRef.current = false;
      }
    })();
  }, [enabled]);

  return state;
}
