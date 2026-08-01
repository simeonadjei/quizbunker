import { useMusic } from '@/contexts/MusicContext';
import { SkipBack, SkipForward, Volume2, VolumeX, Music2, ChevronDown } from 'lucide-react';
import { useState } from 'react';
import { Slider } from '@/components/ui/slider';
import { cn } from '@/lib/utils';

export function MusicPlayer() {
  const { isPlaying, nextSong, prevSong, currentSong, volume, setVolume } = useMusic();
  const [expanded, setExpanded] = useState(false);

  if (!currentSong) return null;

  return (
    <div className="fixed bottom-4 right-4 z-50 flex flex-col items-end gap-2">

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

      {/* ── Collapsed pill button ──────────────────────────────────── */}
      {!expanded && (
        <button
          onClick={() => setExpanded(true)}
          aria-label="Open music player"
          className={cn(
            'relative w-12 h-12 rounded-full flex items-center justify-center border-2 shadow-[0_4px_16px_rgba(0,0,0,0.5)] transition-all active:scale-90',
            isPlaying
              ? 'border-secondary/70 bg-gradient-to-br from-secondary/80 to-[#0b5c5c]'
              : 'border-white/20 bg-black/60'
          )}
          style={{ backdropFilter: 'blur(10px)', WebkitBackdropFilter: 'blur(10px)' }}
        >
          <Music2 className={cn('w-5 h-5', isPlaying ? 'text-white' : 'text-white/50')} />
          {/* Spinning ring when playing */}
          {isPlaying && (
            <div className="absolute inset-[-3px] rounded-full border-[2px] border-transparent border-t-secondary/70 animate-[spin_2s_linear_infinite]" />
          )}
        </button>
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
