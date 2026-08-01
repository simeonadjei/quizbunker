import { createContext, useContext, useEffect, useRef, useState, useCallback, ReactNode } from 'react';
import { useListSongs, getListSongsQueryKey } from '@workspace/api-client-react';

// On Render the API lives on a different domain; prefix relative audio URLs
const API_BASE = (import.meta.env.VITE_API_URL as string | undefined) ?? '';

function resolveUrl(url: string) {
  return url.startsWith('/') ? `${API_BASE}${url}` : url;
}

interface MusicContextType {
  isPlaying: boolean;
  currentSong: any | null;
  volume: number;
  setVolume: (v: number) => void;
  nextSong: () => void;
  prevSong: () => void;
  /** Internal — called synchronously inside a direct click/tap handler */
  _startPlayback: () => void;
}

const MusicContext = createContext<MusicContextType | undefined>(undefined);

export function MusicProvider({ children }: { children: ReactNode }) {
  const { data: songs = [] } = useListSongs({ query: { enabled: true, queryKey: getListSongsQueryKey() } });

  const [isPlaying, setIsPlaying] = useState(false);
  const [currentSongIndex, setCurrentSongIndex] = useState(0);
  const [volume, setVolumeState] = useState(0.5);

  const audioRef     = useRef<HTMLAudioElement | null>(null);
  // Set to true synchronously on first play() call so the document
  // bubbled-click listener doesn't call _startPlayback() a second time.
  const startedRef   = useRef(false);

  const activeSongs = songs.filter(s => s.isActive).sort((a, b) => a.sortOrder - b.sortOrder);
  const currentSong = activeSongs.length > 0 ? activeSongs[currentSongIndex % activeSongs.length] : null;

  // ── Init audio element once ─────────────────────────────────────────
  useEffect(() => {
    if (!audioRef.current) {
      const audio = new Audio();
      audio.volume = volume;
      audio.preload = 'auto';
      audioRef.current = audio;
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Drive isPlaying from real audio events (not promise callbacks) ──
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;
    const onPlay  = () => setIsPlaying(true);
    const onPause = () => setIsPlaying(false);
    audio.addEventListener('play',  onPlay);
    audio.addEventListener('pause', onPause);
    return () => {
      audio.removeEventListener('play',  onPlay);
      audio.removeEventListener('pause', onPause);
    };
  }, []); // runs once; the audio element never changes

  // ── Auto-advance on track end ───────────────────────────────────────
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;
    const onEnded = () => setCurrentSongIndex(prev => (prev + 1) % (activeSongs.length || 1));
    audio.addEventListener('ended', onEnded);
    return () => audio.removeEventListener('ended', onEnded);
  }, [activeSongs.length]);

  // ── Load new song src when track changes ───────────────────────────
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio || !currentSong) return;
    const url = resolveUrl(currentSong.url);
    // audio.src returns the absolute version; compare against both forms
    let abs = url;
    try { abs = new URL(url, window.location.href).href; } catch { /* keep url */ }
    if (audio.src !== url && audio.src !== abs) {
      audio.src = url;
      audio.load();
      // If already playing (e.g. track skipped while playing) continue playback
      if (!audio.paused) {
        audio.play().catch(() => {});
      }
    }
  }, [currentSongIndex, currentSong?.url]);

  // ── Start playback — must be called synchronously inside a click/tap ─
  // iOS Safari requires audio.play() to happen in the direct element
  // handler's synchronous call stack.
  const _startPlayback = useCallback(() => {
    const audio = audioRef.current;
    if (!audio || !currentSong) return;
    // Guard: don't call play() a second time if already playing
    if (!audio.paused) return;

    // Ensure src is set (defensive — the useEffect should have done this)
    if (!audio.src || audio.src === window.location.href) {
      audio.src = resolveUrl(currentSong.url);
    }

    // Mark as started SYNCHRONOUSLY so the bubbled document-click listener
    // (which fires after this returns) sees it and skips the duplicate call.
    startedRef.current = true;

    audio.play().catch(err => {
      console.warn('[Music] play() blocked:', err.name, err.message);
      startedRef.current = false; // allow retry on next gesture
    });
  }, [currentSong]);

  // ── Autoplay: start on first user interaction anywhere ─────────────
  useEffect(() => {
    if (activeSongs.length === 0) return;

    const tryStart = () => {
      if (startedRef.current) return; // already playing or a direct tap just fired
      _startPlayback();
    };

    // Try immediately (works on desktop when browser allows autoplay)
    tryStart();

    // Fallback: pick up the first click/keydown anywhere on the page.
    // NOT touchstart — firing touchstart + click for the same tap causes
    // a double play() call on iOS Safari which blocks both.
    document.addEventListener('click',   tryStart, { passive: true });
    document.addEventListener('keydown', tryStart, { passive: true });

    return () => {
      document.removeEventListener('click',   tryStart);
      document.removeEventListener('keydown', tryStart);
    };
  }, [activeSongs.length, _startPlayback]);

  const nextSong = useCallback(() => {
    setCurrentSongIndex(prev => (prev + 1) % (activeSongs.length || 1));
  }, [activeSongs.length]);

  const prevSong = useCallback(() => {
    setCurrentSongIndex(prev => (prev - 1 + (activeSongs.length || 1)) % (activeSongs.length || 1));
  }, [activeSongs.length]);

  const setVolume = useCallback((v: number) => {
    setVolumeState(v);
    if (audioRef.current) audioRef.current.volume = v;
  }, []);

  // ── Pre-warm audio cache (Cache Storage API) ───────────────────────
  useEffect(() => {
    if (activeSongs.length === 0 || !('caches' in window)) return;
    (async () => {
      try {
        const cache = await caches.open('audio-cache');
        for (const song of activeSongs) {
          const url = resolveUrl(song.url);
          const cached = await cache.match(url).catch(() => null);
          if (!cached) {
            fetch(url).then(r => { if (r.ok) cache.put(url, r); }).catch(() => {});
          }
        }
      } catch { /* ignore */ }
    })();
  }, [activeSongs.length]);

  return (
    <MusicContext.Provider value={{ isPlaying, currentSong, volume, setVolume, nextSong, prevSong, _startPlayback }}>
      {children}
    </MusicContext.Provider>
  );
}

export function useMusic() {
  const ctx = useContext(MusicContext);
  if (!ctx) throw new Error('useMusic must be used within a MusicProvider');
  return ctx;
}
