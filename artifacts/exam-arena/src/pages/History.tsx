import { useGetQuizHistory, getGetQuizHistoryQueryKey } from '@workspace/api-client-react';
import { Layout } from '@/components/Layout';
import { Loader2, History as HistoryIcon, Trophy, Calendar, Target, Skull } from 'lucide-react';
import { Link } from 'wouter';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';

export default function History() {
  const { data: history, isLoading } = useGetQuizHistory({ query: { enabled: true, queryKey: getGetQuizHistoryQueryKey() } });

  return (
    <Layout>
      <div className="px-4 py-5 max-w-lg mx-auto w-full">

        {/* Header */}
        <div className="mb-5">
          <h1 className="text-game-title text-3xl leading-tight">BATTLE LOG</h1>
          <p className="text-white/55 text-sm font-bold mt-1">Your past quiz sessions</p>
        </div>

        {isLoading && (
          <div className="flex justify-center py-16">
            <Loader2 className="w-10 h-10 animate-spin text-primary" />
          </div>
        )}

        {!isLoading && (!history || history.length === 0) && (
          <div className="card-game p-10 text-center flex flex-col items-center">
            <HistoryIcon className="w-10 h-10 text-white/25 mb-4" />
            <p className="text-white/65 font-bold text-sm mb-5">No sessions yet. Play your first quiz!</p>
            <Link href="/dashboard" className="btn-game px-6 py-3 text-sm inline-flex">
              Go to Dashboard
            </Link>
          </div>
        )}

        {!isLoading && history && history.length > 0 && (
          <div className="flex flex-col gap-3">
            {history.map((session, i) => {
              const score = session.score || 0;
              const total = session.totalQuestions || 1;
              const percentage = Math.round((score / total) * 100);
              const isWin = percentage >= 50;

              return (
                <Link key={session.id} href={`/results/${session.id}`}>
                  <div
                    className={cn(
                      'card-game border-l-4 flex items-center gap-3 p-4 cursor-pointer transition-all duration-150 hover:scale-[1.01] active:scale-[0.99]',
                      isWin ? 'border-l-accent' : 'border-l-destructive'
                    )}
                    style={{ animationDelay: `${i * 40}ms` }}
                  >
                    {/* Icon */}
                    <div className={cn(
                      'w-12 h-12 rounded-2xl flex items-center justify-center border-2 shrink-0',
                      isWin ? 'bg-accent/15 border-accent/50 text-accent' : 'bg-destructive/15 border-destructive/50 text-destructive'
                    )}>
                      {isWin ? <Trophy className="w-6 h-6" fill="currentColor" /> : <Skull className="w-6 h-6" />}
                    </div>

                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      <div className="font-display text-white text-sm truncate leading-snug">
                        {session.subject} <span className="text-primary">{session.year}</span>
                      </div>
                      <div className="flex items-center gap-2 mt-0.5">
                        <span className="hud-badge text-[10px] px-2 py-0.5">W{session.week}</span>
                        <span className="text-white/45 text-xs font-bold flex items-center gap-1">
                          <Calendar className="w-3 h-3" />
                          {session.completedAt ? format(new Date(session.completedAt), 'MMM d, yyyy') : '—'}
                        </span>
                      </div>
                    </div>

                    {/* Score */}
                    <div className="text-right shrink-0">
                      <div className={cn('font-display text-2xl leading-none', isWin ? 'text-accent' : 'text-destructive')}>
                        {percentage}%
                      </div>
                      <div className="text-white/45 text-xs font-bold flex items-center justify-end gap-0.5 mt-0.5">
                        <Target className="w-3 h-3" /> {score}/{total}
                      </div>
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        )}

      </div>
    </Layout>
  );
}
