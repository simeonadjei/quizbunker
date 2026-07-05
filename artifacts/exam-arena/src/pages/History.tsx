import { useGetQuizHistory, getGetQuizHistoryQueryKey } from '@workspace/api-client-react';
import { Layout } from '@/components/Layout';
import { Loader2, History as HistoryIcon, Trophy, Calendar } from 'lucide-react';
import { Link } from 'wouter';
import { format } from 'date-fns';

export default function History() {
  const { data: history, isLoading } = useGetQuizHistory({ query: { enabled: true, queryKey: getGetQuizHistoryQueryKey() } });

  return (
    <Layout>
      <div className="container mx-auto px-4 py-12 max-w-4xl">
        <div className="mb-10">
          <h1 className="text-4xl font-black uppercase tracking-tight flex items-center gap-3 text-foreground">
            <HistoryIcon className="w-10 h-10 text-primary" /> BATTLE LOG
          </h1>
          <p className="text-muted-foreground font-mono text-sm mt-2">YOUR COMBAT RECORD</p>
        </div>

        {isLoading ? (
          <div className="flex justify-center py-20">
            <Loader2 className="w-12 h-12 animate-spin text-primary" />
          </div>
        ) : !history || history.length === 0 ? (
          <div className="text-center py-20 bg-card/50 border border-border rounded-2xl backdrop-blur-sm">
            <p className="text-muted-foreground text-lg mb-4">No records found. Enter the Arena to start logging data.</p>
            <Link href="/dashboard" className="text-primary hover:underline font-bold uppercase">Go to Arena</Link>
          </div>
        ) : (
          <div className="space-y-4">
            {history.map((session, i) => {
              const score = session.score || 0;
              const total = session.totalQuestions || 1;
              const percentage = Math.round((score / total) * 100);
              const isWin = percentage >= 50;
              
              return (
                <Link key={session.id} href={`/results/${session.id}`}>
                  <div 
                    className="group bg-card/50 hover:bg-card border border-border hover:border-primary/50 p-6 rounded-xl flex flex-col md:flex-row md:items-center justify-between gap-6 transition-all cursor-pointer animate-in fade-in slide-in-from-bottom-4"
                    style={{ animationDelay: `${i * 50}ms` }}
                  >
                    <div className="flex items-center gap-6">
                      <div className={`w-16 h-16 rounded-full flex items-center justify-center border-2 shrink-0 ${isWin ? 'border-primary text-primary bg-primary/10' : 'border-destructive text-destructive bg-destructive/10'}`}>
                        {isWin ? <Trophy className="w-8 h-8" /> : <div className="text-2xl font-black">X</div>}
                      </div>
                      
                      <div>
                        <h3 className="text-xl font-bold uppercase tracking-wider group-hover:text-primary transition-colors">
                          {session.subject} <span className="text-muted-foreground">{session.year}</span>
                        </h3>
                        <div className="flex items-center gap-4 mt-2 text-sm text-muted-foreground font-mono">
                          <span className="flex items-center gap-1 bg-background px-2 py-1 rounded">LEVEL {session.week}</span>
                          <span className="flex items-center gap-1"><Calendar className="w-4 h-4" /> {session.completedAt ? format(new Date(session.completedAt), 'MMM d, yyyy') : 'Incomplete'}</span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-end md:items-center gap-4 md:ml-auto">
                      <div className="text-right">
                        <div className={`text-3xl font-black ${isWin ? 'text-primary' : 'text-destructive'}`}>
                          {percentage}%
                        </div>
                        <div className="text-sm font-mono text-muted-foreground uppercase">
                          {score} / {total} Correct
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
