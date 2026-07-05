import { useGetQuizSession, useSubmitQuizSession, getGetQuizSessionQueryKey } from '@workspace/api-client-react';
import { useRoute, useLocation } from 'wouter';
import { useState, useMemo } from 'react';
import { Loader2, ArrowRight, CheckCircle2, ShieldAlert } from 'lucide-react';
import { Button } from '@/components/ui/button';
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
    <div className="min-h-[100dvh] bg-background text-foreground flex flex-col relative overflow-hidden selection:bg-primary selection:text-primary-foreground">
      <BackgroundParticles />
      
      {/* Top HUD */}
      <header className="relative z-10 bg-card/80 backdrop-blur-md border-b border-primary/20 p-4">
        <div className="container mx-auto flex items-center justify-between gap-4">
          <div className="flex flex-col">
            <span className="text-xs font-mono text-primary uppercase tracking-wider">Level {session.week}</span>
            <span className="font-bold text-lg leading-none uppercase">{session.subject} {session.year}</span>
          </div>
          
          <div className="flex-1 max-w-md mx-4 hidden md:block">
            <div className="h-2 bg-muted rounded-full overflow-hidden border border-border">
              <div 
                className="h-full bg-primary transition-all duration-500 ease-out relative"
                style={{ width: `${progress}%` }}
              >
                <div className="absolute inset-0 bg-white/30 animate-[slide_2s_linear_infinite]" />
              </div>
            </div>
          </div>

          <div className="font-mono text-xl font-bold tracking-widest text-primary glow-text">
            {Object.keys(answers).length} / {questions.length}
          </div>
        </div>
      </header>

      {/* Mobile Progress */}
      <div className="h-1 bg-muted md:hidden relative z-10 w-full">
        <div className="h-full bg-primary transition-all duration-300" style={{ width: `${progress}%` }} />
      </div>

      <main className="flex-1 relative z-10 container mx-auto px-4 py-8 md:py-16 flex flex-col max-w-4xl">
        
        {/* Navigation Dots */}
        <div className="flex flex-wrap justify-center gap-2 mb-8">
          {questions.map((q, idx) => (
            <button
              key={q.id}
              onClick={() => setCurrentQIndex(idx)}
              className={cn(
                "w-8 h-8 rounded border font-mono text-sm font-bold flex items-center justify-center transition-all",
                currentQIndex === idx ? "border-primary bg-primary/20 text-primary scale-110" :
                answers[q.id] ? "border-primary/50 bg-primary/10 text-primary/70" :
                "border-border bg-background/50 text-muted-foreground hover:border-primary/30"
              )}
            >
              {idx + 1}
            </button>
          ))}
        </div>

        {/* Question Card */}
        {currentQuestion && (
          <div className="bg-card/80 backdrop-blur-xl border border-primary/30 p-6 md:p-10 rounded-2xl shadow-[0_0_40px_-10px_hsl(var(--primary)/0.2)] animate-in fade-in slide-in-from-right-8 duration-300" key={currentQuestion.id}>
            
            <div className="flex items-start gap-4 mb-8">
              <span className="text-4xl font-black text-primary/50 font-mono">Q{currentQIndex + 1}</span>
              <h2 className="text-xl md:text-2xl font-medium leading-relaxed">
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
                      "text-left p-4 rounded-xl border-2 transition-all flex items-center gap-4 group",
                      isSelected 
                        ? "border-primary bg-primary/10 scale-[1.02] shadow-[0_0_15px_-3px_hsl(var(--primary)/0.4)]" 
                        : "border-border bg-background/50 hover:border-primary/50 hover:bg-primary/5"
                    )}
                  >
                    <div className={cn(
                      "w-10 h-10 rounded-lg flex items-center justify-center font-bold font-mono text-lg transition-colors border-2",
                      isSelected ? "bg-primary text-primary-foreground border-primary" : "bg-card border-muted text-muted-foreground group-hover:border-primary/50 group-hover:text-primary"
                    )}>
                      {opt.key}
                    </div>
                    <span className={cn(
                      "text-lg flex-1",
                      isSelected ? "text-foreground font-medium" : "text-muted-foreground group-hover:text-foreground"
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
        <div className="mt-auto pt-8 flex justify-between items-center">
          <Button
            variant="outline"
            className="border-border hover:border-primary/50 font-mono uppercase"
            onClick={() => setCurrentQIndex(prev => Math.max(0, prev - 1))}
            disabled={currentQIndex === 0}
          >
            Previous
          </Button>

          {isComplete ? (
            <Button
              onClick={handleSubmit}
              disabled={submitSession.isPending}
              className="bg-accent text-accent-foreground hover:bg-accent neon-button px-8 py-6 text-lg font-bold uppercase tracking-wider glow-border-accent"
            >
              {submitSession.isPending ? <Loader2 className="w-6 h-6 animate-spin" /> : "Submit Quiz"}
            </Button>
          ) : (
            <Button
              className="bg-primary text-primary-foreground hover:bg-primary neon-button font-mono uppercase"
              onClick={() => setCurrentQIndex(prev => Math.min(questions.length - 1, prev + 1))}
              disabled={currentQIndex === questions.length - 1}
            >
              Next <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
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
      <div className="relative z-10 flex flex-col items-center">
        <Loader2 className="w-16 h-16 text-primary animate-spin mb-4" />
        <h2 className="text-2xl font-mono uppercase tracking-widest text-primary animate-pulse">Loading Level...</h2>
      </div>
    </div>
  );
}

function ErrorScreen() {
  return (
    <div className="min-h-[100dvh] bg-background flex flex-col items-center justify-center relative">
      <BackgroundParticles />
      <div className="relative z-10 bg-card border border-destructive p-8 rounded-xl max-w-md text-center">
        <ShieldAlert className="w-16 h-16 text-destructive mx-auto mb-4" />
        <h2 className="text-2xl font-bold uppercase text-destructive mb-2">Connection Lost</h2>
        <p className="text-muted-foreground mb-6">Could not load the arena data. The signal was interrupted.</p>
        <Button onClick={() => window.location.href = '/dashboard'} variant="outline" className="w-full font-mono uppercase">
          Return to Hub
        </Button>
      </div>
    </div>
  );
}
