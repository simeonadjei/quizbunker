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
      <div className="container mx-auto px-4 py-12 md:py-16 pt-24 max-w-5xl">
        
        {/* Header */}
        <div className="mb-12 bg-black/30 p-8 rounded-3xl border-2 border-white/10 backdrop-blur-md flex flex-col items-center text-center">
          <div className="w-20 h-20 bg-secondary rounded-2xl flex items-center justify-center mb-6 shadow-[0_6px_0_hsl(175,80%,25%)] border-2 border-white/50 transform -rotate-3">
            <HistoryIcon className="w-10 h-10 text-white" strokeWidth={2.5} />
          </div>
          <h1 className="text-5xl md:text-6xl font-black uppercase tracking-tight text-outline text-white mb-3">
            BATTLE LOG
          </h1>
          <p className="text-white/80 font-bold tracking-widest uppercase bg-secondary/20 inline-block px-6 py-2 rounded-full border border-secondary/50">
            REVIEW YOUR COMBAT RECORD
          </p>
        </div>

        {isLoading ? (
          <div className="flex justify-center py-20">
            <Loader2 className="w-16 h-16 animate-spin text-primary" />
          </div>
        ) : !history || history.length === 0 ? (
          <div className="card-game p-16 text-center border-l-4 border-t-4 border-muted flex flex-col items-center justify-center">
            <div className="w-24 h-24 bg-black/50 rounded-full flex items-center justify-center border-2 border-white/10 mb-6">
              <HistoryIcon className="w-10 h-10 text-white/30" />
            </div>
            <p className="text-white/80 font-bold text-2xl mb-8">No records found. Enter the Arena to start logging data.</p>
            <Link href="/dashboard" className="btn-game px-10 py-4 text-xl">Enter the Arena</Link>
          </div>
        ) : (
          <div className="grid gap-6">
            {history.map((session, i) => {
              const score = session.score || 0;
              const total = session.totalQuestions || 1;
              const percentage = Math.round((score / total) * 100);
              const isWin = percentage >= 50;
              
              return (
                <Link key={session.id} href={`/results/${session.id}`}>
                  <div 
                    className={cn(
                      "card-game group cursor-pointer border-l-4 overflow-hidden transition-all duration-300 animate-in fade-in slide-in-from-bottom-8",
                      isWin 
                        ? "border-accent hover:bg-accent/5 hover:scale-[1.01]" 
                        : "border-destructive hover:bg-destructive/5 hover:scale-[1.01]"
                    )}
                    style={{ animationDelay: `${i * 50}ms` }}
                  >
                    <div className="flex flex-col md:flex-row md:items-stretch h-full">
                      
                      {/* Left: Status Icon */}
                      <div className={cn(
                        "p-6 md:w-32 flex flex-col items-center justify-center border-b md:border-b-0 md:border-r border-white/10",
                        isWin ? "bg-accent/10" : "bg-destructive/10"
                      )}>
                        <div className={cn(
                          "w-16 h-16 rounded-full flex items-center justify-center border-4 shadow-inner mb-2",
                          isWin ? "border-accent bg-accent/20 text-accent" : "border-destructive bg-destructive/20 text-destructive"
                        )}>
                          {isWin ? <Trophy className="w-8 h-8" fill="currentColor" /> : <Skull className="w-8 h-8" />}
                        </div>
                        <span className={cn(
                          "font-display uppercase tracking-widest text-sm text-outline drop-shadow-md",
                          isWin ? "text-accent" : "text-destructive"
                        )}>
                          {isWin ? "VICTORY" : "DEFEAT"}
                        </span>
                      </div>

                      {/* Middle: Info */}
                      <div className="p-6 md:p-8 flex-1 flex flex-col justify-center bg-black/20">
                        <div className="flex items-center gap-3 mb-2">
                          <span className="hud-badge text-[10px] scale-90 origin-left border-white/30 text-white">LEVEL {session.week}</span>
                          <span className="flex items-center gap-1 text-sm font-bold text-white/50 bg-black/40 px-3 py-1 rounded-full border border-white/10">
                            <Calendar className="w-4 h-4" /> 
                            {session.completedAt ? format(new Date(session.completedAt), 'MMM d, yyyy') : 'Incomplete'}
                          </span>
                        </div>
                        
                        <h3 className="text-2xl md:text-3xl font-display uppercase tracking-wide text-white group-hover:text-primary transition-colors text-outline drop-shadow-md">
                          {session.subject} <span className="text-primary">{session.year}</span>
                        </h3>
                      </div>

                      {/* Right: Score */}
                      <div className="p-6 md:p-8 flex flex-row md:flex-col items-center justify-between md:justify-center border-t md:border-t-0 md:border-l border-white/10 bg-black/40 min-w-[200px]">
                        <div className="text-center">
                          <div className={cn(
                            "text-4xl md:text-5xl font-display text-outline drop-shadow-md", 
                            isWin ? "text-accent" : "text-destructive"
                          )}>
                            {percentage}%
                          </div>
                          <div className="flex items-center justify-center gap-1 text-sm font-bold text-white/70 uppercase tracking-widest mt-2 bg-white/5 px-3 py-1 rounded-full border border-white/10">
                            <Target className="w-4 h-4" /> {score} / {total} Correct
                          </div>
                        </div>
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
