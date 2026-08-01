import { createContext, useContext, useEffect, useRef, useState, useCallback, ReactNode } from 'react';
import { useListSongs, getListSongsQueryKey } from '@workspace/api-client-react';

// On Render the API lives on a different domain; prefix relative audio URLs
const API_BASE = (import.meta.env.VITE_API_URL as string | undefined) ?? '';

function resolveUrl(url: string) {
  return url.startsWith('/') ? `${API_BASE}${url}` : url;
}

interface MusicContextType {
  isPlaying: boolean;
  togglePlay: () => void;
  nextSong: () => void;
  currentSong: any | null;
  volume: number;
  setVolume: (v: number) => void;
}

const MusicContext = createContext<MusicContextType | undefined>(undefined);

export function MusicProvider({ children }: { children: ReactNode }) {
  const { data: songs = [] } = useListSongs({ query: { enabled: true, queryKey: getListSongsQueryKey() } });

  const [isPlaying, setIsPlaying] = useState(false);
  const [currentSongIndex, setCurrentSongIndex] = useState(0);
  const [volume, setVolumeState] = useState(0.5);

  const audioRef = useRef<HTMLAudioElement | null>(null);
  const isPlayingRef = useRef(false); // mirror for use inside event handlers

  const activeSongs = songs.filter(s => s.isActive).sort((a, b) => a.sortOrder - b.sortOrder);
  const currentSong = activeSongs.length > 0 ? activeSongs[currentSongIndex % activeSongs.length] : null;

  // ── Initialise audio element once ───────────────────────────────────
  useEffect(() => {
    if (!audioRef.current) {
      const audio = new Audio();
      audio.volume = volume;
      audio.preload = 'auto';
      audioRef.current = audio;
    }
  }, []);

  // ── Auto-advance to next track on ended ─────────────────────────────
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const onEnded = () => {
      setCurrentSongIndex(prev => (prev + 1) % (activeSongs.length || 1));
    };

    audio.addEventListener('ended', onEnded);
    return () => audio.removeEventListener('ended', onEnded);
  }, [activeSongs.length]);

  // ── Load new song src whenever track changes ────────────────────────
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio || !currentSong) return;

    const url = resolveUrl(currentSong.url);
    if (audio.src !== url && audio.src !== new URL(url, window.location.href).href) {
      audio.src = url;
      audio.load();
      if (isPlayingRef.current) {
        audio.play().catch(() => {});
      }
    }
  }, [currentSongIndex, currentSong?.url]);

  // ── Play / pause — called DIRECTLY from click handler ──────────────
  // Calling play() inside useEffect loses the user-gesture context and
  // browsers block autoplay. We call it synchronously here instead.
  const togglePlay = useCallback(() => {
    const audio = audioRef.current;
    if (!audio) return;

    if (isPlayingRef.current) {
      audio.pause();
      isPlayingRef.current = false;
      setIsPlaying(false);
    } else {
      // Ensure src is set before playing
      if (currentSong && !audio.src) {
        audio.src = resolveUrl(currentSong.url);
        audio.load();
      }
      audio.play()
        .then(() => {
          isPlayingRef.current = true;
          setIsPlaying(true);
        })
        .catch(() => {
          isPlayingRef.current = false;
          setIsPlaying(false);
        });
    }
  }, [currentSong]);

  const nextSong = useCallback(() => {
    const audio = audioRef.current;
    setCurrentSongIndex(prev => (prev + 1) % (activeSongs.length || 1));

    // If already playing, the src-change useEffect will continue playback
    if (!isPlayingRef.current && audio) {
      // Auto-start on skip
      setTimeout(() => {
        audio.play()
          .then(() => { isPlayingRef.current = true; setIsPlaying(true); })
          .catch(() => {});
      }, 50); // brief delay lets the src useEffect run first
    }
  }, [activeSongs.length]);

  const setVolume = useCallback((v: number) => {
    setVolumeState(v);
    if (audioRef.current) audioRef.current.volume = v;
  }, []);

  // ── Pre-warm audio cache for offline playback ────────────────────────
  // Uses Cache Storage API directly so songs are available offline even
  // before the user plays them.
  useEffect(() => {
    if (activeSongs.length === 0) return;
    if (!('caches' in window)) return;

    const warmCache = async () => {
      let cache: Cache;
      try {
        cache = await caches.open('audio-cache');
      } catch {
        return;
      }

      for (const song of activeSongs) {
        const url = resolveUrl(song.url);
        try {
          const cached = await cache.match(url);
          if (!cached) {
            const response = await fetch(url);
            if (response.ok) {
              await cache.put(url, response);
            }
          }
        } catch {
          // Offline or unreachable — skip silently
        }
      }
    };

    warmCache();
  }, [activeSongs.length]);

  return (
    <MusicContext.Provider value={{ isPlaying, togglePlay, nextSong, currentSong, volume, setVolume }}>
      {children}
    </MusicContext.Provider>
  );
}

export function useMusic() {
  const context = useContext(MusicContext);
  if (context === undefined) {
    throw new Error('useMusic must be used within a MusicProvider');
  }
  return context;
}
