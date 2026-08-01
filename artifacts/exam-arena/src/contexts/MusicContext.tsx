import { createContext, useContext, useEffect, useRef, useState, ReactNode } from 'react';
import { useListSongs, getListSongsQueryKey } from '@workspace/api-client-react';

// On Render the API lives on a different domain; prefix relative audio URLs
const API_BASE = (import.meta.env.VITE_API_URL as string | undefined) ?? '';

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

  const activeSongs = songs.filter(s => s.isActive).sort((a, b) => a.sortOrder - b.sortOrder);
  const currentSong = activeSongs.length > 0 ? activeSongs[currentSongIndex] : null;

  useEffect(() => {
    if (!audioRef.current) {
      audioRef.current = new Audio();
      audioRef.current.volume = volume;
      audioRef.current.addEventListener('ended', handleEnded);
    }
    return () => {
      if (audioRef.current) {
        audioRef.current.removeEventListener('ended', handleEnded);
        audioRef.current.pause();
      }
    };
  }, []);

  const handleEnded = () => {
    setCurrentSongIndex(prev => (prev + 1) % activeSongs.length);
  };

  useEffect(() => {
    if (audioRef.current && currentSong) {
      // Resolve the song URL — prefix with API_BASE when the URL is relative
      const resolvedUrl = currentSong.url.startsWith('/')
        ? `${API_BASE}${currentSong.url}`
        : currentSong.url;
      // Only change source if it's different
      if (audioRef.current.src !== resolvedUrl) {
        audioRef.current.src = resolvedUrl;
        if (isPlaying) {
          audioRef.current.play().catch(e => console.log('Autoplay prevented', e));
        }
      }
    }
  }, [currentSongIndex, currentSong]);

  useEffect(() => {
    if (audioRef.current) {
      if (isPlaying) {
        audioRef.current.play().catch(e => {
          console.log('Playback prevented', e);
          setIsPlaying(false);
        });
      } else {
        audioRef.current.pause();
      }
    }
  }, [isPlaying]);

  const togglePlay = () => setIsPlaying(!isPlaying);
  
  const nextSong = () => {
    setCurrentSongIndex(prev => (prev + 1) % activeSongs.length);
    if (!isPlaying) setIsPlaying(true);
  };
  
  const setVolume = (v: number) => {
    setVolumeState(v);
    if (audioRef.current) audioRef.current.volume = v;
  };

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
