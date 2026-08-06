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
  togglePlayPause: () => void;
  /** Internal — called synchronously inside a direct click/tap handler */
  _startPlayback: () => void;
}

const MusicContext = createContext<MusicContextType | undefined>(undefined);

export function MusicProvider({ children }: { children: ReactNode }) {
  const { data: songs = [] } = useListSongs({ query: { enabled: true, queryKey: getListSongsQueryKey() } });

  const [isPlaying, setIsPlaying] = useState(false);
  const [currentSongIndex, setCurrentSongIndex] = useState(0);
  const [volume, setVolumeState] = useState(0.25);

  const audioRef        = useRef<HTMLAudioElement | null>(null);
  const startedRef      = useRef(false);
  const autoPlayNextRef = useRef(false); // set true by onEnded so next track auto-starts

  // Blob URL cache: network URL → object URL (works offline after first load)
  const blobUrlsRef  = useRef<Map<string, string>>(new Map());

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

  // ── Drive isPlaying from real audio events ──────────────────────────
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
  }, []);

  // ── Auto-advance on track end ───────────────────────────────────────
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;
    const onEnded = () => {
      autoPlayNextRef.current = true; // signal that the next load should auto-play
      setCurrentSongIndex(prev => (prev + 1) % (activeSongs.length || 1));
    };
    audio.addEventListener('ended', onEnded);
    return () => audio.removeEventListener('ended', onEnded);
  }, [activeSongs.length]);

  // ── Pre-fetch all songs as blob URLs (enables offline playback) ─────
  // Each song is fetched once and stored as an in-memory blob URL.
  // After the first online load the audio plays from memory — no network needed.
  useEffect(() => {
    if (activeSongs.length === 0) return;

    let cancelled = false;
    (async () => {
      for (const song of activeSongs) {
        if (cancelled) break;
        const networkUrl = resolveUrl(song.url);
        if (blobUrlsRef.current.has(networkUrl)) continue; // already cached
        try {
          const res = await fetch(networkUrl, { cache: 'force-cache' });
          if (!res.ok || cancelled) continue;
          const blob = await res.blob();
          if (!cancelled) {
            blobUrlsRef.current.set(networkUrl, URL.createObjectURL(blob));
          }
        } catch {
          // offline or fetch failed — will retry next time the component re-mounts
        }
      }
    })();

    return () => { cancelled = true; };
  }, [activeSongs.length]); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Resolve playback URL: prefer cached blob, fall back to network ──
  const resolvePlaybackUrl = useCallback((networkUrl: string) => {
    return blobUrlsRef.current.get(networkUrl) ?? networkUrl;
  }, []);

  // ── Track the URL we last loaded ────────────────────────────────────
  const loadedUrlRef = useRef<string>('');

  // ── When the track changes: swap src and play if was playing or auto-advancing ─
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio || !currentSong) return;
    const networkUrl = resolveUrl(currentSong.url);
    if (loadedUrlRef.current === networkUrl) return;
    if (!audio.paused || autoPlayNextRef.current) {
      autoPlayNextRef.current = false;
      loadedUrlRef.current = networkUrl;
      audio.src = resolvePlaybackUrl(networkUrl);
      audio.play().catch(() => {});
    }
  }, [currentSongIndex, currentSong?.url, resolvePlaybackUrl]);

  // ── Start playback — must be called synchronously inside a click/tap ─
  const _startPlayback = useCallback(() => {
    const audio = audioRef.current;
    if (!audio || !currentSong) return;
    if (!audio.paused) return;

    const networkUrl = resolveUrl(currentSong.url);
    const playUrl = resolvePlaybackUrl(networkUrl);

    audio.src = playUrl;
    loadedUrlRef.current = networkUrl;
    startedRef.current = true;

    audio.play().catch(err => {
      console.warn('[Music] play() blocked:', err.name, err.message);
      startedRef.current = false;
    });
  }, [currentSong, resolvePlaybackUrl]);

  // ── Autoplay: start on first user interaction ───────────────────────
  useEffect(() => {
    if (activeSongs.length === 0) return;

    const tryStart = () => {
      if (startedRef.current) return;
      _startPlayback();
    };

    tryStart();

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

  const togglePlayPause = useCallback(() => {
    const audio = audioRef.current;
    if (!audio) return;
    if (!startedRef.current) {
      // First play — must go through _startPlayback (requires click context)
      _startPlayback();
      return;
    }
    if (audio.paused) {
      audio.play().catch(() => {});
    } else {
      audio.pause();
    }
  }, [_startPlayback]);

  return (
    <MusicContext.Provider value={{ isPlaying, currentSong, volume, setVolume, nextSong, prevSong, togglePlayPause, _startPlayback }}>
      {children}
    </MusicContext.Provider>
  );
}

export function useMusic() {
  const ctx = useContext(MusicContext);
  if (!ctx) throw new Error('useMusic must be used within a MusicProvider');
  return ctx;
}
