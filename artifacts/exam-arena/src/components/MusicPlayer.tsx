import { useMusic } from '@/contexts/MusicContext';
import { SkipBack, SkipForward, Volume2, VolumeX, Music2, ChevronDown, Pause, Play } from 'lucide-react';
import { useState, useEffect } from 'react';
import { Slider } from '@/components/ui/slider';
import { cn } from '@/lib/utils';

const HINT_KEY = 'qb_music_hint_seen';

interface MusicPlayerProps {
  /** Tailwind class for bottom position, e.g. "bottom-4" or "bottom-20" */
  bottomClass?: string;
}

export function MusicPlayer({ bottomClass = 'bottom-4' }: MusicPlayerProps) {
  const { isPlaying, nextSong, prevSong, currentSong, volume, setVolume, togglePlayPause, _startPlayback } = useMusic();
  const [expanded, setExpanded] = useState(false);
  const [showHint, setShowHint] = useState(false);

  // Show hint on first visit, auto-dismiss after 6 s
  useEffect(() => {
    if (!currentSong) return;
    const seen = localStorage.getItem(HINT_KEY);
    if (!seen) {
      setShowHint(true);
      const t = setTimeout(() => {
        setShowHint(false);
        localStorage.setItem(HINT_KEY, '1');
      }, 6000);
      return () => clearTimeout(t);
    }
  }, [currentSong]);

  const dismissHint = () => {
    setShowHint(false);
    localStorage.setItem(HINT_KEY, '1');
  };

  if (!currentSong) return null;

  return (
    <div className={cn('fixed right-4 z-50 flex flex-col items-end gap-2', bottomClass)}>

      {/* ── Expanded tray ─────────────────────────────────────────── */}
      {expanded && (
        <div
          className="flex items-center gap-2 p-2 rounded-2xl border-2 border-secondary/50 shadow-[0_8px_30px_rgba(0,0,0,0.55)] animate-in slide-in-from-bottom-4 duration-200"
          style={{
            background: 'linear-gradient(135deg, rgba(0,0,0,0.85), rgba(10,20,20,0.92))',
            backdropFilter: 'blur(14px)',
            WebkitBackdropFilter: 'blur(14px)',
          }}
        >
          {/* Prev */}
          <button
            onClick={prevSong}
            className="w-9 h-9 flex items-center justify-center rounded-full text-white/70 hover:text-white hover:bg-white/10 transition-colors active:scale-90"
            aria-label="Previous track"
          >
            <SkipBack className="w-4 h-4" strokeWidth={2.5} />
          </button>

          {/* Track title */}
          <div className="w-28 sm:w-36 overflow-hidden flex flex-col justify-center">
            <div className="text-[9px] text-secondary/80 font-display uppercase tracking-widest leading-none mb-0.5">
              NOW PLAYING
            </div>
            <div className={cn(
              'text-xs font-bold text-white whitespace-nowrap',
              isPlaying && 'animate-[slide_10s_linear_infinite]'
            )}>
              {currentSong.title}
            </div>
          </div>

          {/* Volume */}
          <div className="flex items-center gap-1.5 border-l border-white/10 pl-2">
            <button
              onClick={() => setVolume(volume === 0 ? 0.5 : 0)}
              className="w-8 h-8 flex items-center justify-center rounded-full text-white/60 hover:text-white hover:bg-white/10 transition-colors active:scale-90"
              aria-label={volume === 0 ? 'Unmute' : 'Mute'}
            >
              {volume === 0
                ? <VolumeX className="w-4 h-4" strokeWidth={2.5} />
                : <Volume2 className="w-4 h-4" strokeWidth={2.5} />}
            </button>
            <Slider
              value={[volume * 100]}
              max={100}
              step={1}
              onValueChange={vals => setVolume(vals[0] / 100)}
              className="w-20"
              aria-label="Volume"
            />
          </div>

          {/* Next */}
          <button
            onClick={nextSong}
            className="w-9 h-9 flex items-center justify-center rounded-full text-white/70 hover:text-white hover:bg-white/10 transition-colors active:scale-90"
            aria-label="Next track"
          >
            <SkipForward className="w-4 h-4" strokeWidth={2.5} />
          </button>

          {/* Collapse */}
          <button
            onClick={() => setExpanded(false)}
            className="w-8 h-8 flex items-center justify-center rounded-full text-white/40 hover:text-white hover:bg-white/10 transition-colors border-l border-white/10 ml-1 pl-1"
            aria-label="Collapse player"
          >
            <ChevronDown className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* ── Collapsed pill ─────────────────────────────────────────── */}
      {!expanded && (
        <div className="relative flex items-center gap-0">

          {/* First-visit hint callout */}
          {showHint && (
            <div
              className="absolute right-14 bottom-0 flex items-center gap-1.5 animate-in fade-in slide-in-from-right-4 duration-300"
              style={{ whiteSpace: 'nowrap' }}
            >
              <div
                className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold text-white shadow-lg border border-secondary/40"
                style={{
                  background: 'linear-gradient(135deg, rgba(0,0,0,0.88), rgba(10,30,25,0.94))',
                  backdropFilter: 'blur(12px)',
                  WebkitBackdropFilter: 'blur(12px)',
                }}
              >
                <span className="text-base leading-none">👆</span>
                <span className="text-secondary/90">Tap icon to adjust volume</span>
                <button
                  onClick={dismissHint}
                  className="ml-1 text-white/30 hover:text-white/70 text-[10px] leading-none"
                  aria-label="Dismiss"
                >✕</button>
              </div>
              {/* Pointer arrow */}
              <div
                className="w-2.5 h-2.5 rotate-45 border-r border-t border-secondary/40 -ml-[7px] flex-shrink-0"
                style={{ background: 'rgba(10,30,25,0.94)' }}
              />
            </div>
          )}

          {/* Pause / Play button */}
          <button
            onClick={() => { dismissHint(); togglePlayPause(); }}
            aria-label={isPlaying ? 'Pause music' : 'Play music'}
            className={cn(
              'w-12 h-12 rounded-full flex items-center justify-center border-2 shadow-[0_4px_16px_rgba(0,0,0,0.5)] transition-all active:scale-90',
              isPlaying
                ? 'border-secondary/70 bg-gradient-to-br from-secondary/80 to-[#0b5c5c]'
                : 'border-white/20 bg-black/60'
            )}
            style={{ backdropFilter: 'blur(10px)', WebkitBackdropFilter: 'blur(10px)' }}
          >
            {isPlaying
              ? <Pause className="w-5 h-5 text-white" strokeWidth={2.5} />
              : <Play  className="w-5 h-5 text-white/50" strokeWidth={2.5} />}

            {/* Spinning ring when playing */}
            {isPlaying && (
              <div className="absolute inset-[-3px] rounded-full border-[2px] border-transparent border-t-secondary/70 animate-[spin_2s_linear_infinite]" />
            )}
          </button>

          {/* Expand (music note) button */}
          <button
            onClick={() => { dismissHint(); _startPlayback(); setExpanded(true); }}
            aria-label="Open music player"
            className="w-6 h-6 -ml-1.5 z-10 rounded-full flex items-center justify-center bg-black/70 border border-white/10 text-white/40 hover:text-white/80 hover:bg-white/10 transition-all active:scale-90 shadow"
            style={{ backdropFilter: 'blur(8px)', WebkitBackdropFilter: 'blur(8px)' }}
          >
            <Music2 className="w-3 h-3" strokeWidth={2.5} />
          </button>
        </div>
      )}

      <style>{`
        @keyframes slide {
          0%   { transform: translateX(105%); }
          100% { transform: translateX(-105%); }
        }
      `}</style>
    </div>
  );
}
