import { useMusic } from '@/contexts/MusicContext';
import { Play, Pause, SkipForward, Volume2, VolumeX } from 'lucide-react';
import { useState } from 'react';
import { Slider } from '@/components/ui/slider';
import { cn } from '@/lib/utils';

export function MusicPlayer() {
  const { isPlaying, togglePlay, nextSong, currentSong, volume, setVolume } = useMusic();
  const [showVolume, setShowVolume] = useState(false);

  if (!currentSong) return null;

  return (
    <div className="fixed bottom-4 right-4 z-50 flex items-center gap-3 bg-card/80 backdrop-blur-md border border-primary/20 p-3 rounded-full shadow-[0_0_15px_-3px_hsl(var(--primary)/0.3)] animate-in slide-in-from-bottom-5">
      
      {/* Title marquee */}
      <div className="w-24 overflow-hidden mask-fade-edges">
        <div className={cn("text-xs font-mono text-primary whitespace-nowrap", isPlaying && "animate-[slide_10s_linear_infinite]")}>
          {currentSong.title}
        </div>
      </div>

      <div className="h-6 w-px bg-border mx-1" />

      {/* Controls */}
      <button 
        onClick={togglePlay} 
        className="text-foreground hover:text-primary transition-colors flex items-center justify-center w-8 h-8 rounded-full bg-primary/10 hover:bg-primary/20"
      >
        {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4 ml-0.5" />}
      </button>

      <button 
        onClick={nextSong}
        className="text-muted-foreground hover:text-primary transition-colors"
      >
        <SkipForward className="w-4 h-4" />
      </button>

      <div 
        className="relative flex items-center"
        onMouseEnter={() => setShowVolume(true)}
        onMouseLeave={() => setShowVolume(false)}
      >
        <button 
          onClick={() => setVolume(volume === 0 ? 0.5 : 0)}
          className="text-muted-foreground hover:text-primary transition-colors ml-1"
        >
          {volume === 0 ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
        </button>
        
        {/* Volume popup */}
        {showVolume && (
          <div className="absolute bottom-full right-0 mb-2 p-2 bg-card border border-border rounded-md shadow-xl w-24">
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

      <style>{`
        .mask-fade-edges {
          mask-image: linear-gradient(to right, transparent, black 10%, black 90%, transparent);
        }
        @keyframes slide {
          0% { transform: translateX(100%); }
          100% { transform: translateX(-100%); }
        }
      `}</style>
    </div>
  );
}
