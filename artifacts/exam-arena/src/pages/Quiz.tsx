import { useGetQuizSession, useSubmitQuizSession, getGetQuizSessionQueryKey } from '@workspace/api-client-react';
import { useRoute, useLocation } from 'wouter';
import { useState } from 'react';
import { Loader2, ArrowRight, Target, ShieldAlert, Sparkles } from 'lucide-react';
import { cn } from '@/lib/utils';
import { BackgroundParticles } from '@/components/BackgroundParticles';

export default function Arena() {
  const [, params] = useRoute('/quiz/:sessionId');
  const sessionId = Number(params?.sessionId);
  const [, setLocation] = useLocation();

  const { data: session, isLoading, error } = useGetQuizSession(sessionId, { query: { enabled: !!sessionId, queryKey: getGetQuizSessionQueryKey(sessionId) } });
  const submitSession = useSubmitQuizSession();

  // Local state for answers: record<questionId, answer>
  const [answers, setAnswers] = useState<Record<number, string>>({});
  const [currentQIndex, setCurrentQIndex] = useState(0);

  const questions = session?.questions || [];
  const currentQuestion = questions[currentQIndex];
  
  const progress = questions.length > 0 ? (Object.keys(answers).length / questions.length) * 100 : 0;
  const isComplete = Object.keys(answers).length === questions.length;

  const handleSelect = (answer: string) => {
    if (session?.completedAt) return; // already submitted
    setAnswers(prev => ({ ...prev, [currentQuestion.id]: answer }));
    
    // Auto-advance if not the last question
    if (currentQIndex < questions.length - 1) {
      setTimeout(() => setCurrentQIndex(prev => prev + 1), 400);
    }
  };

  const handleSubmit = () => {
    const formattedAnswers = Object.entries(answers).map(([qId, ans]) => ({
      questionId: Number(qId),
      selectedAnswer: ans
    }));

    submitSession.mutate({ sessionId, data: { answers: formattedAnswers } }, {
      onSuccess: () => {
        setLocation(`/results/${sessionId}`);
      }
    });
  };

  if (isLoading) return <LoadingScreen />;
  if (error || !session) return <ErrorScreen />;
  
  // If we arrived here but it's already completed, go to results
  if (session.completedAt) {
    setLocation(`/results/${sessionId}`);
    return null;
  }

  return (
    <div className="min-h-[100dvh] bg-background text-foreground flex flex-col relative overflow-hidden selection:bg-primary selection:text-primary-foreground pt-16">
      <BackgroundParticles />
      
      {/* Top HUD */}
      <header className="fixed top-0 left-0 right-0 z-40 bg-black/60 backdrop-blur-md border-b-4 border-primary/50 pointer-events-auto">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between gap-4">
          
          <div className="flex items-center gap-3">
            <div className="bg-primary text-white w-10 h-10 rounded-xl flex items-center justify-center font-display text-xl shadow-[0_2px_0_hsl(32,95%,35%)] border-2 border-white/50">
              L{session.week}
            </div>
            <div className="hidden sm:block">
              <span className="font-display text-xl leading-none uppercase text-outline text-white">{session.subject}</span>
              <span className="block text-[10px] text-white/70 font-bold tracking-widest">{session.year}</span>
            </div>
          </div>
          
          <div className="flex-1 max-w-md mx-4">
            <div className="progress-game">
              <div 
                className="progress-game-fill"
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>

          <div className="hud-badge text-white min-w-[80px]">
            <Target className="w-4 h-4 text-accent" />
            <span>{Object.keys(answers).length}/{questions.length}</span>
          </div>
        </div>
      </header>

      <main className="flex-1 relative z-10 container mx-auto px-4 py-8 md:py-12 flex flex-col max-w-4xl">
        
        {/* Navigation Map */}
        <div className="flex flex-wrap justify-center gap-2 mb-8 bg-black/30 p-4 rounded-2xl border-2 border-white/10 backdrop-blur-sm">
          {questions.map((q, idx) => {
            const isAnswered = !!answers[q.id];
            const isCurrent = currentQIndex === idx;
            
            return (
              <button
                key={q.id}
                onClick={() => setCurrentQIndex(idx)}
                className={cn(
                  "w-10 h-10 rounded-xl border-2 font-display text-base transition-all duration-200 transform",
                  isCurrent ? "border-white bg-primary text-white scale-110 shadow-[0_4px_0_hsl(32,95%,35%)] -translate-y-1" :
                  isAnswered ? "border-accent bg-accent/20 text-accent" :
                  "border-white/20 bg-black/40 text-white/50 hover:border-white/50 hover:bg-white/10"
                )}
              >
                {idx + 1}
              </button>
            )
          })}
        </div>

        {/* Question Card */}
        {currentQuestion && (
          <div className="card-game p-6 md:p-10 border-t-4 border-l-4 border-primary animate-in zoom-in-95 duration-300 shadow-[0_20px_50px_rgba(0,0,0,0.5)]" key={currentQuestion.id}>
            
            <div className="flex flex-col sm:flex-row items-start gap-4 mb-8">
              <div className="bg-primary/20 text-primary border-2 border-primary/50 px-4 py-2 rounded-xl font-display text-2xl shrink-0 text-outline-primary">
                Q{currentQIndex + 1}
              </div>
              <h2 className="text-2xl md:text-3xl font-bold leading-tight text-white drop-shadow-md">
                {currentQuestion.questionText}
              </h2>
            </div>

            <div className="grid grid-cols-1 gap-4">
              {[
                { key: 'A', text: currentQuestion.optionA },
                { key: 'B', text: currentQuestion.optionB },
                { key: 'C', text: currentQuestion.optionC },
                { key: 'D', text: currentQuestion.optionD },
              ].map((opt) => {
                const isSelected = answers[currentQuestion.id] === opt.key;
                return (
                  <button
                    key={opt.key}
                    onClick={() => handleSelect(opt.key)}
                    className={cn(
                      "text-left p-4 md:p-6 rounded-2xl border-2 transition-all flex items-center gap-4 md:gap-6 group relative overflow-hidden",
                      isSelected 
                        ? "border-primary bg-primary/20 scale-[1.02] shadow-[inset_0_0_20px_hsl(var(--primary)/0.3),0_5px_15px_rgba(0,0,0,0.3)]" 
                        : "border-white/20 bg-black/40 hover:border-white/60 hover:bg-white/10"
                    )}
                  >
                    {/* Selected Shine */}
                    {isSelected && <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full animate-[shine_2s_infinite]" />}

                    <div className={cn(
                      "w-12 h-12 rounded-xl flex items-center justify-center font-display text-2xl transition-all border-2 shrink-0 shadow-inner",
                      isSelected ? "bg-primary text-white border-white/50 text-outline transform scale-110" : "bg-black/50 border-white/20 text-white/50 group-hover:border-white/50 group-hover:text-white"
                    )}>
                      {opt.key}
                    </div>
                    <span className={cn(
                      "text-xl md:text-2xl flex-1 font-bold",
                      isSelected ? "text-white" : "text-white/80 group-hover:text-white"
                    )}>
                      {opt.text}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* Footer Actions */}
        <div className="mt-8 flex justify-between items-center gap-4 pb-20">
          <button
            className={cn(
              "px-6 py-3 rounded-xl border-2 font-bold uppercase tracking-wider transition-all",
              currentQIndex === 0 ? "border-white/10 text-white/30 bg-black/20 cursor-not-allowed" : "border-white/20 text-white bg-black/40 hover:bg-white/10 hover:border-white/50 active:scale-95"
            )}
            onClick={() => setCurrentQIndex(prev => Math.max(0, prev - 1))}
            disabled={currentQIndex === 0}
          >
            Previous
          </button>

          {isComplete ? (
            <button
              onClick={handleSubmit}
              disabled={submitSession.isPending}
              className="btn-game-accent px-10 py-4 text-xl flex items-center gap-3 animate-pulse"
            >
              {submitSession.isPending ? <Loader2 className="w-6 h-6 animate-spin" /> : (
                <>
                  <Sparkles className="w-6 h-6" /> Submit Quiz
                </>
              )}
            </button>
          ) : (
            <button
              className={cn(
                "btn-game px-8 py-3 text-lg flex items-center gap-2",
                currentQIndex === questions.length - 1 && "opacity-50 pointer-events-none"
              )}
              onClick={() => setCurrentQIndex(prev => Math.min(questions.length - 1, prev + 1))}
              disabled={currentQIndex === questions.length - 1}
            >
              Next <ArrowRight className="w-5 h-5" strokeWidth={2.5} />
            </button>
          )}
        </div>
      </main>
    </div>
  );
}

function LoadingScreen() {
  return (
    <div className="min-h-[100dvh] bg-background flex flex-col items-center justify-center relative">
      <BackgroundParticles />
      <div className="relative z-10 flex flex-col items-center card-game p-12 animate-pulse">
        <div className="w-20 h-20 bg-primary rounded-2xl flex items-center justify-center border-4 border-white mb-6 shadow-[0_0_30px_hsl(var(--primary))] animate-[spin_3s_linear_infinite]">
          <Loader2 className="w-10 h-10 text-white animate-spin" />
        </div>
        <h2 className="text-3xl font-display uppercase tracking-widest text-white text-outline">Loading Level</h2>
      </div>
    </div>
  );
}

function ErrorScreen() {
  return (
    <div className="min-h-[100dvh] bg-background flex flex-col items-center justify-center relative">
      <BackgroundParticles />
      <div className="relative z-10 card-game border-l-4 border-t-4 border-destructive p-10 max-w-md w-full text-center">
        <div className="w-24 h-24 bg-destructive rounded-full flex items-center justify-center mx-auto mb-6 shadow-[0_0_30px_hsl(var(--destructive))] border-4 border-white/50">
          <ShieldAlert className="w-12 h-12 text-white" />
        </div>
        <h2 className="text-3xl font-display uppercase text-outline text-white mb-4">Connection Lost</h2>
        <p className="text-white/80 font-bold mb-8 bg-black/30 p-4 rounded-xl border border-white/10">Could not load the arena data. The signal was interrupted.</p>
        <button onClick={() => window.location.href = '/dashboard'} className="btn-game-destructive w-full py-4 text-xl">
          Return to Hub
        </button>
      </div>
    </div>
  );
}
