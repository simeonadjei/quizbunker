import { useMusic } from '@/contexts/MusicContext';
import { Play, Pause, SkipForward, Volume2, VolumeX } from 'lucide-react';
import { useState, useEffect } from 'react';
import { Slider } from '@/components/ui/slider';
import { cn } from '@/lib/utils';

export function MusicPlayer() {
  const { isPlaying, togglePlay, nextSong, currentSong, volume, setVolume } = useMusic();
  const [showVolume, setShowVolume] = useState(false);
  const [showHint, setShowHint] = useState(true);

  // Hide the hint after 5 seconds
  useEffect(() => {
    const t = setTimeout(() => setShowHint(false), 5000);
    return () => clearTimeout(t);
  }, []);

  if (!currentSong) return null;

  return (
    <div className="fixed bottom-6 right-4 sm:right-6 z-50 flex flex-col items-end gap-2">

      {/* ── Music hint bubble ───────────────────────────────────────── */}
      <div
        aria-hidden="true"
        className={cn(
          'flex items-center gap-2 px-4 py-2.5 rounded-2xl text-sm font-bold pointer-events-none select-none transition-all duration-500',
          showHint
            ? 'opacity-100 translate-y-0'
            : 'opacity-0 translate-y-3',
        )}
        style={{
          background: 'linear-gradient(135deg, hsl(168 80% 12% / 0.96), hsl(168 60% 8% / 0.98))',
          border: '1.5px solid hsl(168 80% 40% / 0.55)',
          boxShadow: '0 4px 20px rgba(0,0,0,0.5), 0 0 12px hsl(168 80% 40% / 0.2)',
          color: 'hsl(168 80% 75%)',
          backdropFilter: 'blur(8px)',
          WebkitBackdropFilter: 'blur(8px)',
        }}
      >
        {/* Pointing finger */}
        <span className="text-xl leading-none" style={{ transform: 'rotate(30deg)', display: 'inline-block' }}>
          👇
        </span>
        <span>Click on play to listen to music</span>
      </div>

      {/* ── Player card ────────────────────────────────────────────── */}
      <div className="flex items-center gap-3 bg-black/60 backdrop-blur-md border-2 border-secondary/50 p-2 pr-4 rounded-full shadow-[0_8px_30px_rgba(0,0,0,0.5)] animate-in slide-in-from-bottom-10">

        {/* Disc / play-pause button */}
        <button
          onClick={togglePlay}
          className="relative w-10 h-10 rounded-full bg-gradient-to-br from-secondary to-[#0b5c5c] flex items-center justify-center border-2 border-white/50 shadow-[0_2px_0_#052c2c] hover:scale-105 active:scale-95 transition-all"
        >
          {isPlaying ? (
            <Pause className="w-5 h-5 text-white" strokeWidth={3} />
          ) : (
            <Play className="w-5 h-5 text-white ml-0.5" strokeWidth={3} />
          )}
          {isPlaying && (
            <div className="absolute inset-[-4px] rounded-full border-[2px] border-secondary/30 border-t-secondary animate-[spin_2s_linear_infinite]" />
          )}
        </button>

        {/* Title marquee */}
        <div className="w-24 sm:w-32 overflow-hidden mask-fade-edges flex flex-col justify-center">
          <div className="text-[10px] text-secondary font-display uppercase tracking-widest leading-none mb-0.5">TRACK</div>
          <div className={cn('text-xs font-bold text-white whitespace-nowrap', isPlaying && 'animate-[slide_10s_linear_infinite]')}>
            {currentSong.title}
          </div>
        </div>

        {/* Controls */}
        <div className="flex items-center gap-1 border-l border-white/10 pl-2">
          <button
            onClick={nextSong}
            className="w-8 h-8 flex items-center justify-center rounded-full text-white/70 hover:text-white hover:bg-white/10 transition-colors active:scale-95"
          >
            <SkipForward className="w-4 h-4" strokeWidth={2.5} />
          </button>

          <div
            className="relative flex items-center"
            onMouseEnter={() => setShowVolume(true)}
            onMouseLeave={() => setShowVolume(false)}
            onTouchStart={() => setShowVolume(v => !v)}
          >
            <button
              onClick={() => setVolume(volume === 0 ? 0.5 : 0)}
              className="w-8 h-8 flex items-center justify-center rounded-full text-white/70 hover:text-white hover:bg-white/10 transition-colors active:scale-95"
            >
              {volume === 0
                ? <VolumeX className="w-4 h-4" strokeWidth={2.5} />
                : <Volume2 className="w-4 h-4" strokeWidth={2.5} />}
            </button>

            {showVolume && (
              <div className="absolute bottom-full right-0 mb-4 p-3 bg-black/80 backdrop-blur-md border-2 border-secondary/30 rounded-2xl shadow-xl w-32 origin-bottom animate-in zoom-in-95">
                <Slider
                  value={[volume * 100]}
                  max={100}
                  step={1}
                  onValueChange={(vals) => setVolume(vals[0] / 100)}
                  className="w-full"
                />
              </div>
            )}
          </div>
        </div>
      </div>

      <style>{`
        .mask-fade-edges {
          mask-image: linear-gradient(to right, transparent, black 10%, black 90%, transparent);
        }
        @keyframes slide {
          0%   { transform: translateX(100%); }
          100% { transform: translateX(-100%); }
        }
      `}</style>
    </div>
  );
}
