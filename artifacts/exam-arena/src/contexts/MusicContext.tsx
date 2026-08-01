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
  /** Internal — used by autoplay mechanism only */
  _startPlayback: () => void;
}

const MusicContext = createContext<MusicContextType | undefined>(undefined);

export function MusicProvider({ children }: { children: ReactNode }) {
  const { data: songs = [] } = useListSongs({ query: { enabled: true, queryKey: getListSongsQueryKey() } });

  const [isPlaying, setIsPlaying] = useState(false);
  const [currentSongIndex, setCurrentSongIndex] = useState(0);
  const [volume, setVolumeState] = useState(0.5);

  const audioRef = useRef<HTMLAudioElement | null>(null);
  const isPlayingRef = useRef(false);
  const hasStartedRef = useRef(false); // tracks whether we've ever started playback

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
  }, []);

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
    const abs = (() => { try { return new URL(url, window.location.href).href; } catch { return url; } })();
    if (audio.src !== url && audio.src !== abs) {
      audio.src = url;
      audio.load();
      if (isPlayingRef.current) {
        audio.play().catch(() => {});
      }
    }
  }, [currentSongIndex, currentSong?.url]);

  // ── Start playback (called synchronously inside a click/tap handler) ─
  // iOS Safari requires audio.play() to be called directly inside the
  // element's event handler — not from a document-level listener.
  const _startPlayback = useCallback(() => {
    const audio = audioRef.current;
    if (!audio) return;
    // Use audio.paused as ground truth; isPlayingRef can lag on iOS
    if (!audio.paused) return;
    if (currentSong && !audio.src) {
      audio.src = resolveUrl(currentSong.url);
      // Do NOT call audio.load() here — calling load() before play() in the
      // same gesture can break iOS Safari's gesture context. play() alone
      // starts downloading if needed.
    }
    audio.play()
      .then(() => { isPlayingRef.current = true; setIsPlaying(true); hasStartedRef.current = true; })
      .catch((err) => { console.warn('[Music] play() blocked:', err); });
  }, [currentSong]);

  // ── Autoplay: start on first user interaction anywhere ─────────────
  useEffect(() => {
    if (activeSongs.length === 0) return;

    const tryStart = () => {
      if (hasStartedRef.current) return;
      _startPlayback();
    };

    // Try immediately (works on desktop when browser allows autoplay)
    tryStart();

    // Fallback: listen for click/keydown only — NOT touchstart.
    // touchstart + click both fire for the same tap; double-calling play()
    // within the same gesture can confuse iOS Safari and block both calls.
    document.addEventListener('click',   tryStart, { passive: true });
    document.addEventListener('keydown', tryStart, { passive: true });

    return () => {
      document.removeEventListener('click',   tryStart);
      document.removeEventListener('keydown', tryStart);
    };
  }, [activeSongs.length, _startPlayback]);

  const nextSong = useCallback(() => {
    setCurrentSongIndex(prev => (prev + 1) % (activeSongs.length || 1));
    // Ensure playing continues
    setTimeout(() => {
      if (audioRef.current && isPlayingRef.current) {
        audioRef.current.play().catch(() => {});
      }
    }, 60);
  }, [activeSongs.length]);

  const prevSong = useCallback(() => {
    setCurrentSongIndex(prev => (prev - 1 + (activeSongs.length || 1)) % (activeSongs.length || 1));
    setTimeout(() => {
      if (audioRef.current && isPlayingRef.current) {
        audioRef.current.play().catch(() => {});
      }
    }, 60);
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
      } catch {}
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
