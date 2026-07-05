import { useGetQuizSession, getGetQuizSessionQueryKey } from '@workspace/api-client-react';
import { useRoute } from 'wouter';
import { Layout } from '@/components/Layout';
import { Loader2, Trophy, Skull, Target, ArrowRight, XCircle, CheckCircle2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Link } from 'wouter';
import { cn } from '@/lib/utils';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';

export default function Results() {
  const [, params] = useRoute('/results/:sessionId');
  const sessionId = Number(params?.sessionId);

  const { data: session, isLoading, error } = useGetQuizSession(sessionId, { query: { enabled: !!sessionId, queryKey: getGetQuizSessionQueryKey(sessionId) } });

  if (isLoading) {
    return (
      <Layout>
        <div className="flex-1 flex items-center justify-center">
          <Loader2 className="w-12 h-12 animate-spin text-primary" />
        </div>
      </Layout>
    );
  }

  if (error || !session || !session.completedAt) {
    return (
      <Layout>
        <div className="flex-1 flex flex-col items-center justify-center">
          <p className="text-destructive font-bold text-xl uppercase">Invalid Session Data</p>
          <Link href="/dashboard" className="mt-4"><Button variant="outline">Return</Button></Link>
        </div>
      </Layout>
    );
  }

  const score = session.score || 0;
  const total = session.totalQuestions || session.questions.length;
  const percentage = Math.round((score / total) * 100) || 0;
  
  const isVictory = percentage >= 50;

  return (
    <Layout>
      <div className="container mx-auto px-4 py-12 max-w-4xl">
        
        {/* Banner */}
        <div className={cn(
          "text-center p-12 rounded-3xl border mb-12 relative overflow-hidden animate-in zoom-in-95 duration-500",
          isVictory ? "bg-primary/10 border-primary/50 shadow-[0_0_50px_-10px_hsl(var(--primary)/0.3)]" 
                    : "bg-destructive/10 border-destructive/50 shadow-[0_0_50px_-10px_hsl(var(--destructive)/0.3)]"
        )}>
          {isVictory ? (
            <Trophy className="w-24 h-24 text-primary mx-auto mb-6 drop-shadow-[0_0_15px_rgba(27,255,255,0.5)]" />
          ) : (
            <Skull className="w-24 h-24 text-destructive mx-auto mb-6 drop-shadow-[0_0_15px_rgba(255,50,80,0.5)]" />
          )}
          
          <h1 className={cn("text-6xl md:text-8xl font-black uppercase tracking-tighter mb-4", isVictory ? "text-primary glow-text" : "text-destructive text-shadow")}>
            {isVictory ? 'STAGE CLEAR' : 'GAME OVER'}
          </h1>
          
          <div className="flex items-center justify-center gap-6 text-2xl md:text-4xl font-mono font-bold">
            <span className="text-muted-foreground uppercase text-lg hidden md:block">Score:</span>
            <span>{score} <span className="text-muted-foreground">/</span> {total}</span>
            <span className="text-muted-foreground">|</span>
            <span className={cn(isVictory ? "text-primary" : "text-destructive")}>{percentage}%</span>
          </div>
        </div>

        {/* Actions */}
        <div className="flex justify-center gap-4 mb-16">
          <Link href="/dashboard">
            <Button className="neon-button font-bold uppercase px-8 py-6 bg-accent text-accent-foreground hover:bg-accent/90 glow-border-accent">
              Play Again
            </Button>
          </Link>
          <Link href="/history">
            <Button variant="outline" className="font-bold uppercase px-8 py-6 border-primary/30 text-primary hover:border-primary">
              Battle Log
            </Button>
          </Link>
        </div>

        {/* Details Review */}
        <div className="bg-card/50 backdrop-blur-sm border border-border rounded-2xl p-6 md:p-8">
          <h2 className="text-2xl font-bold uppercase mb-6 flex items-center gap-3">
            <Target className="w-6 h-6 text-primary" /> Post-Match Review
          </h2>

          <Accordion type="multiple" className="space-y-4">
            {session.questions.map((q, idx) => {
              const answer = session.answers?.find(a => a.questionId === q.id);
              const isCorrect = answer?.isCorrect;

              return (
                <AccordionItem value={`q-${q.id}`} key={q.id} className="border border-border bg-background/50 rounded-xl overflow-hidden data-[state=open]:border-primary/50 transition-colors">
                  <AccordionTrigger className="px-6 py-4 hover:no-underline hover:bg-primary/5">
                    <div className="flex items-center gap-4 text-left">
                      {isCorrect ? (
                        <CheckCircle2 className="w-6 h-6 text-primary shrink-0" />
                      ) : (
                        <XCircle className="w-6 h-6 text-destructive shrink-0" />
                      )}
                      <span className="font-mono text-muted-foreground text-sm">Q{idx + 1}</span>
                      <span className="line-clamp-1 flex-1 font-medium">{q.questionText}</span>
                    </div>
                  </AccordionTrigger>
                  
                  <AccordionContent className="px-6 pb-6 pt-2">
                    <div className="space-y-4 pt-4 border-t border-border">
                      <p className="text-lg leading-relaxed mb-6">{q.questionText}</p>
                      
                      <div className="grid gap-2">
                        {[
                          { key: 'A', text: q.optionA },
                          { key: 'B', text: q.optionB },
                          { key: 'C', text: q.optionC },
                          { key: 'D', text: q.optionD },
                        ].map((opt) => {
                          const isSelectedAns = answer?.selectedAnswer === opt.key;
                          const isCorrectAns = q.correctAnswer === opt.key;
                          
                          let bgClass = "bg-card border-border";
                          let textClass = "text-foreground";
                          
                          if (isCorrectAns) {
                            bgClass = "bg-primary/20 border-primary shadow-[0_0_10px_-2px_hsl(var(--primary)/0.3)]";
                            textClass = "text-primary font-bold";
                          } else if (isSelectedAns && !isCorrect) {
                            bgClass = "bg-destructive/20 border-destructive";
                            textClass = "text-destructive line-through opacity-80";
                          } else if (isSelectedAns) {
                            // Shouldn't happen unless data is weird, but fallback
                            bgClass = "bg-primary/20 border-primary";
                          }

                          return (
                            <div key={opt.key} className={cn("p-4 rounded-lg border-2 flex items-center gap-4", bgClass)}>
                              <div className="w-8 h-8 rounded bg-background flex items-center justify-center font-mono font-bold text-sm">
                                {opt.key}
                              </div>
                              <span className={textClass}>{opt.text}</span>
                              {isSelectedAns && <span className="ml-auto text-xs uppercase tracking-widest font-mono opacity-50 text-foreground">Your Answer</span>}
                            </div>
                          );
                        })}
                      </div>

                      {q.feedback && (
                        <div className="mt-4 p-4 bg-secondary/10 border border-secondary/30 rounded-lg text-secondary-foreground text-sm">
                          <strong className="text-secondary uppercase text-xs tracking-wider block mb-1">Feedback</strong>
                          {q.feedback}
                        </div>
                      )}
                    </div>
                  </AccordionContent>
                </AccordionItem>
              );
            })}
          </Accordion>

        </div>
      </div>
    </Layout>
  );
}
