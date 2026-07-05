import { useGetQuizSession, getGetQuizSessionQueryKey } from '@workspace/api-client-react';
import { useRoute } from 'wouter';
import { Layout } from '@/components/Layout';
import { Loader2, Trophy, Skull, Target, CheckCircle2, XCircle, Star, CircleDollarSign } from 'lucide-react';
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
          <Loader2 className="w-16 h-16 animate-spin text-primary drop-shadow-[0_0_15px_hsl(var(--primary))]" />
        </div>
      </Layout>
    );
  }

  if (error || !session || !session.completedAt) {
    return (
      <Layout>
        <div className="flex-1 flex flex-col items-center justify-center">
          <div className="card-game p-10 text-center border-l-4 border-t-4 border-destructive">
            <p className="text-destructive font-display text-3xl uppercase text-outline mb-6">Invalid Session Data</p>
            <Link href="/dashboard" className="btn-game-secondary px-8 py-3">Return to Hub</Link>
          </div>
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
      <div className="container mx-auto px-4 py-12 max-w-4xl pt-24 relative">
        
        {/* Confetti container */}
        {isVictory && (
          <div className="fixed inset-0 pointer-events-none overflow-hidden z-50">
            {Array.from({ length: 50 }).map((_, i) => (
              <div 
                key={i} 
                className="absolute top-[-10%] w-3 h-8 rounded-full animate-confettiFall"
                style={{
                  left: `${Math.random() * 100}%`,
                  backgroundColor: ['#ffaa00', '#00ffcc', '#ff0055', '#cc00ff'][Math.floor(Math.random() * 4)],
                  animationDelay: `${Math.random() * 3}s`,
                  animationDuration: `${Math.random() * 2 + 2}s`
                }}
              />
            ))}
          </div>
        )}

        {/* Banner */}
        <div className={cn(
          "text-center p-8 md:p-16 rounded-[2rem] border-4 mb-12 relative overflow-hidden animate-in zoom-in-95 duration-500 shadow-[0_20px_50px_rgba(0,0,0,0.5)]",
          isVictory ? "bg-primary/20 border-accent" : "bg-destructive/20 border-destructive"
        )}>
          {/* Background rays */}
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(255,255,255,0.2)_0%,transparent_70%)] mix-blend-overlay" />
          
          <div className={cn(
            "w-32 h-32 mx-auto rounded-full flex items-center justify-center mb-6 relative z-10 border-4 border-white shadow-[0_0_40px_rgba(0,0,0,0.5)]",
            isVictory ? "bg-accent" : "bg-destructive"
          )}>
            {isVictory ? (
              <Trophy className="w-16 h-16 text-[#3b1a03]" fill="currentColor" />
            ) : (
              <Skull className="w-16 h-16 text-white" />
            )}
            
            {/* Stars popping out */}
            {isVictory && (
              <>
                <Star className="absolute -top-4 -left-4 w-10 h-10 text-accent animate-starPulse drop-shadow-md" fill="currentColor" />
                <Star className="absolute -bottom-2 -right-6 w-12 h-12 text-accent animate-starPulse drop-shadow-md" fill="currentColor" style={{ animationDelay: '0.2s' }} />
                <Star className="absolute top-8 -right-8 w-8 h-8 text-accent animate-starPulse drop-shadow-md" fill="currentColor" style={{ animationDelay: '0.4s' }} />
              </>
            )}
          </div>
          
          <h1 className={cn(
            "text-6xl md:text-8xl font-black uppercase tracking-tighter mb-8 relative z-10 font-display", 
            isVictory ? "text-accent text-outline drop-shadow-[0_0_20px_hsl(var(--accent))]" : "text-white text-outline drop-shadow-[0_0_20px_hsl(var(--destructive))]"
          )}>
            {isVictory ? 'STAGE CLEAR' : 'GAME OVER'}
          </h1>
          
          <div className="flex flex-col md:flex-row items-center justify-center gap-6 relative z-10 bg-black/40 p-6 rounded-3xl border-2 border-white/20 backdrop-blur-sm max-w-xl mx-auto">
            
            <div className="flex flex-col items-center">
              <span className="text-white/60 font-bold uppercase tracking-widest text-sm mb-1">Coins</span>
              <div className="flex items-center gap-2 text-4xl font-display text-accent text-outline">
                <CircleDollarSign className="w-8 h-8 animate-coinSpin" fill="currentColor" />
                <span>{score * 10}</span>
              </div>
            </div>

            <div className="w-full h-px md:w-px md:h-16 bg-white/20" />

            <div className="flex flex-col items-center">
              <span className="text-white/60 font-bold uppercase tracking-widest text-sm mb-1">Score</span>
              <div className="flex items-end gap-2 font-display text-outline">
                <span className="text-5xl text-white">{score}</span>
                <span className="text-3xl text-white/50 mb-1">/{total}</span>
              </div>
            </div>

            <div className="w-full h-px md:w-px md:h-16 bg-white/20" />

            <div className="flex flex-col items-center">
              <span className="text-white/60 font-bold uppercase tracking-widest text-sm mb-1">Accuracy</span>
              <span className={cn(
                "text-4xl font-display text-outline",
                isVictory ? "text-green-400" : "text-destructive"
              )}>{percentage}%</span>
            </div>

          </div>
        </div>

        {/* Actions */}
        <div className="flex flex-col sm:flex-row justify-center gap-6 mb-16">
          <Link href="/dashboard" className="w-full sm:w-auto">
            <button className="w-full btn-game-accent font-bold uppercase px-12 py-5 text-xl">
              Play Again
            </button>
          </Link>
          <Link href="/history" className="w-full sm:w-auto">
            <button className="w-full btn-game-secondary px-12 py-5 text-xl uppercase font-bold">
              Battle Log
            </button>
          </Link>
        </div>

        {/* Details Review */}
        <div className="card-game p-6 md:p-10 border-t-4 border-l-4 border-secondary">
          <div className="flex items-center gap-4 mb-8 bg-black/30 p-4 rounded-2xl border border-white/10">
            <div className="bg-secondary p-3 rounded-xl border-2 border-white/50 shadow-inner">
              <Target className="w-8 h-8 text-white" />
            </div>
            <h2 className="text-3xl font-display uppercase text-white text-outline tracking-wider">
              Post-Match Review
            </h2>
          </div>

          <Accordion type="multiple" className="space-y-4">
            {session.questions.map((q, idx) => {
              const answer = session.answers?.find(a => a.questionId === q.id);
              const isCorrect = answer?.isCorrect;

              return (
                <AccordionItem value={`q-${q.id}`} key={q.id} className="border-2 border-white/10 bg-black/40 rounded-2xl overflow-hidden data-[state=open]:border-secondary/50 data-[state=open]:bg-black/60 transition-all">
                  <AccordionTrigger className="px-6 py-5 hover:no-underline group">
                    <div className="flex items-center gap-4 text-left w-full">
                      <div className={cn(
                        "w-12 h-12 rounded-xl flex items-center justify-center shrink-0 border-2 shadow-inner",
                        isCorrect ? "bg-green-500/20 border-green-500" : "bg-destructive/20 border-destructive"
                      )}>
                        {isCorrect ? (
                          <CheckCircle2 className="w-6 h-6 text-green-400" strokeWidth={3} />
                        ) : (
                          <XCircle className="w-6 h-6 text-destructive" strokeWidth={3} />
                        )}
                      </div>
                      
                      <div className="flex-1 min-w-0 pr-4">
                        <span className="font-display text-secondary text-sm uppercase tracking-wider block mb-1">Question {idx + 1}</span>
                        <span className="line-clamp-1 font-bold text-lg text-white group-hover:text-secondary transition-colors">{q.questionText}</span>
                      </div>
                    </div>
                  </AccordionTrigger>
                  
                  <AccordionContent className="px-6 pb-6 pt-2">
                    <div className="space-y-6 pt-6 border-t-2 border-white/10">
                      <p className="text-xl md:text-2xl font-bold leading-relaxed text-white">{q.questionText}</p>
                      
                      <div className="grid gap-3">
                        {[
                          { key: 'A', text: q.optionA },
                          { key: 'B', text: q.optionB },
                          { key: 'C', text: q.optionC },
                          { key: 'D', text: q.optionD },
                        ].map((opt) => {
                          const isSelectedAns = answer?.selectedAnswer === opt.key;
                          const isCorrectAns = q.correctAnswer === opt.key;
                          
                          let bgClass = "bg-black/50 border-white/10";
                          let textClass = "text-white/80";
                          let iconClass = "bg-white/10 text-white/50 border-white/20";
                          
                          if (isCorrectAns) {
                            bgClass = "bg-green-500/20 border-green-500 shadow-[inset_0_0_20px_rgba(74,222,128,0.2)]";
                            textClass = "text-green-400 font-bold";
                            iconClass = "bg-green-500 text-white border-green-400";
                          } else if (isSelectedAns && !isCorrect) {
                            bgClass = "bg-destructive/20 border-destructive";
                            textClass = "text-destructive line-through opacity-80";
                            iconClass = "bg-destructive text-white border-red-400";
                          }

                          return (
                            <div key={opt.key} className={cn("p-4 rounded-xl border-2 flex items-center gap-4 relative overflow-hidden", bgClass)}>
                              {isCorrectAns && <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent -translate-x-full animate-[shine_3s_infinite]" />}
                              
                              <div className={cn("w-10 h-10 rounded-lg flex items-center justify-center font-display text-xl border-2 relative z-10", iconClass)}>
                                {opt.key}
                              </div>
                              <span className={cn("text-lg relative z-10", textClass)}>{opt.text}</span>
                              
                              {isSelectedAns && (
                                <span className="ml-auto hud-badge text-[10px] scale-90 origin-right border-white/30 bg-black/60 text-white relative z-10">
                                  Your Answer
                                </span>
                              )}
                            </div>
                          );
                        })}
                      </div>

                      {q.feedback && (
                        <div className="mt-6 p-5 bg-accent/10 border-2 border-accent/30 rounded-xl relative overflow-hidden">
                          <div className="absolute top-0 left-0 w-1 h-full bg-accent" />
                          <strong className="text-accent font-display uppercase tracking-widest block mb-2 flex items-center gap-2">
                            <Star className="w-4 h-4" /> Instructor Feedback
                          </strong>
                          <p className="text-white/90 font-bold leading-relaxed">{q.feedback}</p>
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
