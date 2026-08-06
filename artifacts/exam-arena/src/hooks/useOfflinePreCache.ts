/**
 * useOfflinePreCache
 *
 * After login, silently pre-caches EVERY quiz session and EVERY song audio
 * file so the entire app is playable offline without the user needing to
 * visit each week individually first.
 *
 * Also exposes:
 *  - `needsDownload` — true when content has never been fully cached, or the
 *    last attempt failed. Use this to show the manual download button.
 *  - `triggerManual()` — call to kick off a cache run on demand.
 */

import { useCallback, useEffect, useRef, useState } from 'react';
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

const CACHE_PREFIX    = 'qb_session_';
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
  /**
   * True when content has never been fully cached (or the last run failed).
   * Show the manual download button when this is true.
   */
  needsDownload: boolean;
  /** Manually trigger a cache run. Safe to call even while running. */
  triggerManual: () => void;
}

/**
 * @param enabled Pass `true` only when the user is authenticated.
 */
export function useOfflinePreCache(enabled: boolean): PreCacheState {
  const hasCached = localStorage.getItem(FINGERPRINT_KEY) !== null;

  const [status, setStatus] = useState<PreCacheStatus>('idle');
  const [progress, setProgress] = useState(0);
  const [label, setLabel] = useState('');
  const [needsDownload, setNeedsDownload] = useState(!hasCached);

  const runningRef = useRef(false);

  const runCache = useCallback(async () => {
    if (runningRef.current) return; // already in progress
    if (typeof caches === 'undefined') return; // no Cache API

    runningRef.current = true;
    setStatus('running');
    setProgress(2);
    setLabel('Checking content…');

    try {
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

      // Skip if nothing has changed since last successful run
      if (localStorage.getItem(FINGERPRINT_KEY) === fp) {
        setStatus('done');
        setProgress(100);
        setLabel('Offline ready');
        setNeedsDownload(false);
        runningRef.current = false;
        return;
      }

      const total = allCombos.length + songs.length;
      let done = 0;

      const tick = (lbl: string) => {
        done++;
        setProgress(Math.round((done / total) * 95) + 2);
        setLabel(lbl);
      };

      // ── Step 2: pre-cache quiz sessions ────────────────────────────────
      for (const { year, subject, week } of allCombos) {
        try {
          let sessionId = getCachedSessionId(year, subject, week);
          if (!sessionId) {
            const session = await createQuizSession({ year, subject, week });
            sessionId = session.id;
            registerSession(year, subject, week, sessionId);
          }
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
          const audioUrl = song.url;
          const existing = await audioCache.match(audioUrl);
          if (!existing) {
            await audioCache.add(audioUrl);
          }
        } catch {
          // Non-fatal
        }
        tick(`Caching song: ${song.title}…`);
      }

      // ── Done ────────────────────────────────────────────────────────────
      localStorage.setItem(FINGERPRINT_KEY, fp);
      setStatus('done');
      setProgress(100);
      setLabel('Offline ready ✓');
      setNeedsDownload(false);
    } catch {
      setStatus('error');
      setProgress(0);
      setLabel('Download failed — tap to retry');
      setNeedsDownload(true);
    } finally {
      runningRef.current = false;
    }
  }, []);

  // Auto-run once on mount when user is authenticated
  useEffect(() => {
    if (!enabled) return;
    // Only auto-run if not yet cached
    if (localStorage.getItem(FINGERPRINT_KEY) === null) {
      runCache();
    } else {
      // Already cached — mark done quietly
      setStatus('done');
      setProgress(100);
      setNeedsDownload(false);
    }
  }, [enabled, runCache]);

  return { status, progress, label, needsDownload, triggerManual: runCache };
}
