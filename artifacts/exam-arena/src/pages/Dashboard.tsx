import { Layout } from '@/components/Layout';
import {
  useGetQuestionFilters, useCreateQuizSession, useGetPaymentStatus,
  getGetPaymentStatusQueryKey, getGetQuestionFiltersQueryKey
} from '@workspace/api-client-react';
import { useState, useEffect } from 'react';
import { useLocation, Link } from 'wouter';
import { Loader2, Play, Lock, BookOpen, Sparkles, ChevronDown } from 'lucide-react';
import { cn } from '@/lib/utils';

const SUBJECT_COLORS = [
  { card: 'border-t-primary', text: 'text-primary', bg: 'bg-primary/20' },
  { card: 'border-t-secondary', text: 'text-secondary', bg: 'bg-secondary/20' },
  { card: 'border-t-accent', text: 'text-accent', bg: 'bg-accent/20' },
  { card: 'border-t-green-400', text: 'text-green-400', bg: 'bg-green-400/20' },
  { card: 'border-t-purple-400', text: 'text-purple-400', bg: 'bg-purple-400/20' },
  { card: 'border-t-pink-400', text: 'text-pink-400', bg: 'bg-pink-400/20' },
];

export default function Dashboard() {
  const [, setLocation] = useLocation();
  const { data: filters, isLoading: loadingFilters } = useGetQuestionFilters({ query: { enabled: true, queryKey: getGetQuestionFiltersQueryKey() } });
  const { data: subStatus, isLoading: loadingSub } = useGetPaymentStatus({ query: { enabled: true, queryKey: getGetPaymentStatusQueryKey() } });
  const createSession = useCreateQuizSession();

  const [selectedYear, setSelectedYear] = useState<string>('');
  const [selectedSubject, setSelectedSubject] = useState<string>('');

  useEffect(() => {
    if (filters && !selectedYear && filters.years.length > 0) setSelectedYear(filters.years[0]);
  }, [filters, selectedYear]);

  const isSubscribed = subStatus?.isActive;

  const handleStartLevel = (week: number) => {
    if (!isSubscribed) { setLocation('/subscribe'); return; }
    if (!selectedYear || !selectedSubject) return;
    createSession.mutate({ data: { year: selectedYear, subject: selectedSubject, week } }, {
      onSuccess: (session) => setLocation(`/quiz/${session.id}`)
    });
  };

  return (
    <Layout>
      <div className="px-4 py-5 max-w-lg mx-auto w-full">

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

        {/* Subscription gate banner */}
        {!isSubscribed && !loadingSub && (
          <div className="card-game border-l-4 border-accent p-4 mb-5 flex items-start gap-3">
            <Sparkles className="w-5 h-5 text-accent shrink-0 mt-0.5" />
            <div className="flex-1 min-w-0">
              <p className="font-display text-white text-sm leading-snug mb-2">
                Subscribe to unlock all 1,500+ questions across Dok 1–4.
              </p>
              <Link href="/subscribe" className="btn-game py-2 px-4 text-sm inline-flex">
                Unlock Full Access
              </Link>
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
                    disabled={!unlocked || createSession.isPending}
                    onClick={() => handleStartLevel(w)}
                    className={cn(
                      'relative aspect-square rounded-2xl flex flex-col items-center justify-center font-display text-lg transition-all duration-150 border-2 select-none',
                      unlocked
                        ? 'bg-black/30 border-white/20 text-white active:scale-90 active:translate-y-0.5 hover:border-primary hover:bg-primary/20'
                        : 'bg-black/20 border-white/10 text-white/25 cursor-not-allowed'
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
                      <Lock className="w-4 h-4" strokeWidth={2} />
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

      </div>
    </Layout>
  );
}
