import { Layout } from '@/components/Layout';
import {
  useGetQuestionFilters, useCreateQuizSession, useGetPaymentStatus,
  getGetPaymentStatusQueryKey, getGetQuestionFiltersQueryKey
} from '@workspace/api-client-react';
import { useState, useEffect } from 'react';
import { useLocation, Link } from 'wouter';
import { Loader2, Play, Lock, BookOpen, Sparkles, ChevronDown, Zap, X, WifiOff } from 'lucide-react';
import { cn } from '@/lib/utils';

// ── Offline detection hook ─────────────────────────────────────────────────────
function useOnlineStatus() {
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  useEffect(() => {
    const on = () => setIsOnline(true);
    const off = () => setIsOnline(false);
    window.addEventListener('online', on);
    window.addEventListener('offline', off);
    return () => { window.removeEventListener('online', on); window.removeEventListener('offline', off); };
  }, []);
  return isOnline;
}

// ── Subscribe gate modal ───────────────────────────────────────────────────────
function SubscribeGate({ onClose }: { onClose: () => void }) {
  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-in fade-in">
      <div className="card-game w-full max-w-sm border-t-4 border-accent animate-in slide-in-from-bottom-8 sm:slide-in-from-bottom-0 sm:zoom-in-95">
        {/* Close */}
        <div className="flex items-start justify-between mb-4">
          <div className="w-12 h-12 rounded-2xl bg-accent/20 border-2 border-accent/50 flex items-center justify-center">
            <Lock className="w-6 h-6 text-accent" strokeWidth={2.5} />
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 flex items-center justify-center rounded-full text-white/40 hover:text-white hover:bg-white/10 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <h2 className="font-display text-white text-xl uppercase mb-1">Level Locked</h2>
        <p className="text-white/60 text-sm font-bold mb-5 leading-relaxed">
          This level requires an active subscription. Unlock full access to all 1,500+ questions across every subject and week.
        </p>

        {/* Feature highlights */}
        <div className="space-y-2 mb-6">
          {[
            'All subjects & weeks',
            'Dok 1–4 questions',
            'Certificates of Achievement',
            'Full battle history',
          ].map(f => (
            <div key={f} className="flex items-center gap-2.5 text-sm text-white/70 font-bold">
              <Sparkles className="w-3.5 h-3.5 text-accent shrink-0" />
              {f}
            </div>
          ))}
        </div>

        <Link href="/subscribe" onClick={onClose}>
          <button className="btn-game w-full py-3.5 text-base justify-center flex items-center gap-2">
            <Zap className="w-4 h-4" fill="currentColor" strokeWidth={0} />
            Unlock Full Access
          </button>
        </Link>

        <button
          onClick={onClose}
          className="btn-game-ghost w-full py-2.5 text-sm justify-center mt-2"
        >
          Maybe later
        </button>
      </div>
    </div>
  );
}

export default function Dashboard() {
  const [, setLocation] = useLocation();
  const isOnline = useOnlineStatus();
  const { data: filters, isLoading: loadingFilters } = useGetQuestionFilters({ query: { enabled: true, queryKey: getGetQuestionFiltersQueryKey() } });
  const { data: subStatus, isLoading: loadingSub } = useGetPaymentStatus({ query: { enabled: true, queryKey: getGetPaymentStatusQueryKey() } });
  const createSession = useCreateQuizSession();

  const [selectedYear, setSelectedYear] = useState<string>('');
  const [selectedSubject, setSelectedSubject] = useState<string>('');
  const [showSubscribeGate, setShowSubscribeGate] = useState(false);

  useEffect(() => {
    if (filters && !selectedYear && filters.years.length > 0) setSelectedYear(filters.years[0]);
  }, [filters, selectedYear]);

  const isSubscribed = subStatus?.isActive;

  const handleStartLevel = (week: number) => {
    if (!isSubscribed) {
      setShowSubscribeGate(true);
      return;
    }
    if (!selectedYear || !selectedSubject) return;
    createSession.mutate({ data: { year: selectedYear, subject: selectedSubject, week } }, {
      onSuccess: (session) => setLocation(`/quiz/${session.id}`)
    });
  };

  return (
    <Layout>
      {/* Subscribe gate modal */}
      {showSubscribeGate && <SubscribeGate onClose={() => setShowSubscribeGate(false)} />}

      <div className="px-4 py-5 max-w-lg mx-auto w-full">

        {/* Offline banner */}
        {!isOnline && (
          <div className="card-game border-l-4 border-yellow-500 p-3 mb-4 flex items-center gap-3">
            <WifiOff className="w-4 h-4 text-yellow-400 shrink-0" />
            <p className="text-yellow-300 font-bold text-sm">You're offline — quiz still works, but subscription payments need internet.</p>
          </div>
        )}

        {/* Page title */}
        <div className="mb-5">
          <h1 className="text-game-title text-3xl leading-tight">LEVEL SELECT</h1>
          <p className="text-white/60 text-sm font-bold mt-1">Pick your year, subject and week</p>
        </div>

        {/* Filters row */}
        <div className="card-game p-4 mb-4 flex flex-col gap-3">
          <div className="flex gap-3">
            <div className="flex-1">
              <label htmlFor="select-year" className="text-white/60 text-xs font-bold uppercase tracking-wider block mb-1">Year</label>
              <div className="relative">
                <select
                  id="select-year"
                  value={selectedYear}
                  onChange={e => setSelectedYear(e.target.value)}
                  disabled={loadingFilters || !filters?.years.length}
                  className="w-full h-11 rounded-xl border-2 border-white/20 bg-black/40 pl-3 pr-9 text-white font-bold text-sm appearance-none focus:outline-none focus:border-primary disabled:opacity-50 disabled:cursor-not-allowed"
                  style={{ colorScheme: 'dark' }}
                >
                  <option value="" disabled>Year</option>
                  {filters?.years.map(y => (
                    <option key={y} value={y}>{y}</option>
                  ))}
                </select>
                <ChevronDown className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-white/50" />
              </div>
            </div>
            <div className="flex-1">
              <label htmlFor="select-subject" className="text-white/60 text-xs font-bold uppercase tracking-wider block mb-1">Subject</label>
              <div className="relative">
                <select
                  id="select-subject"
                  value={selectedSubject}
                  onChange={e => setSelectedSubject(e.target.value)}
                  disabled={loadingFilters || !filters?.subjects.length}
                  className="w-full h-11 rounded-xl border-2 border-white/20 bg-black/40 pl-3 pr-9 text-white font-bold text-sm appearance-none focus:outline-none focus:border-primary disabled:opacity-50 disabled:cursor-not-allowed"
                  style={{ colorScheme: 'dark' }}
                >
                  <option value="" disabled>Subject</option>
                  {filters?.subjects.map(s => (
                    <option key={s} value={s}>{s}</option>
                  ))}
                </select>
                <ChevronDown className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-white/50" />
              </div>
            </div>
          </div>
        </div>

        {/* Subscription control card — shown when not subscribed and not loading */}
        {!isSubscribed && !loadingSub && (
          <div className="card-game border-2 border-accent/40 p-5 mb-5 relative overflow-hidden">
            {/* Glow */}
            <div className="absolute inset-0 bg-gradient-to-br from-accent/10 via-transparent to-primary/5 pointer-events-none" />

            <div className="relative flex items-start gap-4">
              <div className="w-12 h-12 rounded-2xl bg-accent/20 border-2 border-accent/50 flex items-center justify-center shrink-0"
                style={{ boxShadow: '0 0 20px rgba(255,170,0,0.2)' }}>
                <Zap className="w-6 h-6 text-accent" fill="currentColor" strokeWidth={0} />
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="font-display text-white text-base uppercase mb-1">Unlock the Arena</h3>
                <p className="text-white/60 text-sm font-bold leading-relaxed mb-4">
                  Subscribe to play any level. Access 1,500+ exam questions across all subjects, weeks, and Dok levels.
                </p>
                <div className="flex flex-wrap gap-2 mb-4">
                  {['All Subjects', 'All Weeks', 'Certificates', 'History'].map(tag => (
                    <span key={tag} className="text-xs font-bold px-2.5 py-1 rounded-full border border-accent/30 text-accent/80 bg-accent/10">
                      {tag}
                    </span>
                  ))}
                </div>
                <Link href="/subscribe">
                  <button className="btn-game py-2.5 px-5 text-sm inline-flex items-center gap-2">
                    <Sparkles className="w-3.5 h-3.5" />
                    Subscribe Now
                  </button>
                </Link>
              </div>
            </div>
          </div>
        )}

        {/* Loading */}
        {loadingFilters && (
          <div className="flex items-center justify-center py-16">
            <Loader2 className="w-10 h-10 animate-spin text-primary" />
          </div>
        )}

        {/* Week grid */}
        {!loadingFilters && selectedSubject && filters && (
          <div>
            <div className="flex items-center justify-between mb-3">
              <span className="font-display text-white text-base">{selectedSubject}</span>
              <span className="hud-badge text-xs">{filters.weeks.length} weeks</span>
            </div>
            <div className="grid grid-cols-5 gap-2.5">
              {filters.weeks.map(w => {
                const unlocked = !!isSubscribed;
                return (
                  <button
                    key={w}
                    onClick={() => handleStartLevel(w)}
                    disabled={createSession.isPending}
                    className={cn(
                      'relative aspect-square rounded-2xl flex flex-col items-center justify-center font-display text-lg transition-all duration-150 border-2 select-none',
                      unlocked
                        ? 'bg-black/30 border-white/20 text-white active:scale-90 active:translate-y-0.5 hover:border-primary hover:bg-primary/20'
                        : 'bg-black/20 border-white/10 text-white/25 hover:border-accent/30 hover:bg-accent/5'
                    )}
                    style={unlocked ? { boxShadow: '0 4px 0 rgba(0,0,0,0.35)' } : undefined}
                  >
                    {createSession.isPending ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : unlocked ? (
                      <>
                        <Play className="w-3 h-3 mb-0.5 opacity-50" fill="currentColor" strokeWidth={0} />
                        <span>{w}</span>
                      </>
                    ) : (
                      <>
                        <Lock className="w-3.5 h-3.5 mb-0.5 opacity-40" strokeWidth={2} />
                        <span className="text-sm">{w}</span>
                      </>
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* Prompt to pick subject */}
        {!loadingFilters && !selectedSubject && filters && (
          <div className="card-game p-8 text-center">
            <BookOpen className="w-10 h-10 text-primary mx-auto mb-3" />
            <p className="text-white/70 font-bold text-sm">Select a subject above to see available weeks</p>
          </div>
        )}

        {/* Empty state — no questions uploaded yet */}
        {!loadingFilters && filters && filters.years.length === 0 && (
          <div className="card-game p-8 text-center border-l-4 border-white/10">
            <BookOpen className="w-10 h-10 text-white/20 mx-auto mb-3" />
            <p className="text-white/40 font-bold text-sm">No questions available yet.</p>
            <p className="text-white/25 text-xs mt-1">The admin needs to upload questions first.</p>
          </div>
        )}

      </div>
    </Layout>
  );
}
