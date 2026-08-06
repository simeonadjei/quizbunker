/**
 * OfflineCacheBanner
 *
 * A fixed strip that appears just below the navbar while the app is
 * pre-caching content for offline use. It stays visible no matter which
 * page the user is on, never covers the music player, and auto-dismisses
 * a few seconds after caching completes.
 */
import { useEffect, useState } from 'react';
import { Download, Wifi, CheckCircle2 } from 'lucide-react';
import type { PreCacheState } from '@/hooks/useOfflinePreCache';

interface Props {
  state: PreCacheState;
}

export function OfflineCacheBanner({ state }: Props) {
  const [visible, setVisible] = useState(false);
  const [dismissing, setDismissing] = useState(false);

  // Show as soon as caching starts
  useEffect(() => {
    if (state.status === 'running') {
      setDismissing(false);
      setVisible(true);
    }
  }, [state.status]);

  // Auto-dismiss 4 s after completion
  useEffect(() => {
    if (state.status === 'done' && visible) {
      const t1 = setTimeout(() => setDismissing(true), 4000);
      const t2 = setTimeout(() => setVisible(false), 4700);
      return () => { clearTimeout(t1); clearTimeout(t2); };
    }
    return undefined;
  }, [state.status, visible]);

  if (!visible) return null;

  const isDone = state.status === 'done';

  return (
    <div
      className={`fixed left-0 right-0 z-30 transition-all duration-700 ${
        dismissing ? 'opacity-0 -translate-y-2' : 'opacity-100 translate-y-0'
      }`}
      // Sits flush under the fixed navbar (h-14 mobile / h-24 lg)
      style={{ top: 'var(--navbar-h, 3.5rem)' }}
    >
      <div
        className="w-full px-4 py-2.5 flex flex-col gap-1.5"
        style={{
          background: isDone
            ? 'linear-gradient(90deg, hsl(145 60% 7%), hsl(145 55% 10%))'
            : 'linear-gradient(90deg, hsl(195 100% 6%), hsl(240 40% 10%))',
          borderBottom: isDone
            ? '2px solid hsl(145 60% 25%)'
            : '2px solid hsl(195 100% 30%)',
        }}
      >
        {/* Top row */}
        <div className="flex items-center gap-2.5 max-w-screen-sm mx-auto w-full">
          {isDone ? (
            <CheckCircle2 className="w-4 h-4 shrink-0" style={{ color: '#25D366' }} />
          ) : (
            <Download className="w-4 h-4 shrink-0 text-cyan-400 animate-pulse" />
          )}

          <div className="flex-1 min-w-0">
            {isDone ? (
              <p className="font-bold text-sm leading-tight" style={{ color: '#25D366' }}>
                All content saved — you're ready to go offline ✓
              </p>
            ) : (
              <>
                <p className="font-bold text-sm text-cyan-300 leading-tight">
                  Saving content for offline use — please stay connected
                </p>
                <p className="text-[11px] font-bold text-amber-400 leading-tight mt-0.5 flex items-center gap-1">
                  <Wifi className="w-3 h-3 shrink-0" />
                  Do not go offline until this finishes
                </p>
              </>
            )}
          </div>

          {!isDone && (
            <span className="text-cyan-400 font-mono font-bold text-sm shrink-0">
              {state.progress}%
            </span>
          )}
        </div>

        {/* Progress bar */}
        {!isDone && (
          <div className="max-w-screen-sm mx-auto w-full">
            <div className="w-full bg-white/10 rounded-full h-2 overflow-hidden">
              <div
                className="h-full rounded-full transition-all duration-500"
                style={{
                  width: `${state.progress}%`,
                  background: 'linear-gradient(90deg, hsl(195 100% 45%), hsl(220 90% 60%))',
                  boxShadow: '0 0 8px hsl(195 100% 45%)',
                }}
              />
            </div>
            {state.label ? (
              <p className="text-white/40 text-[10px] font-bold mt-1 truncate">{state.label}</p>
            ) : null}
          </div>
        )}
      </div>
    </div>
  );
}
