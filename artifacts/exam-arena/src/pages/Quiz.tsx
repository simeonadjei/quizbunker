import { useGetQuizSession, useSubmitQuizSession, getGetQuizSessionQueryKey } from '@workspace/api-client-react';
import { useRoute, useLocation } from 'wouter';
import { useState } from 'react';
import { Loader2, ArrowRight, Target, ShieldAlert, Sparkles } from 'lucide-react';
import { cn } from '@/lib/utils';
import { BackgroundParticles } from '@/components/BackgroundParticles';

export default function Quiz() {
  const [, params] = useRoute('/quiz/:sessionId');
  const sessionId = Number(params?.sessionId);
  const [, setLocation] = useLocation();

  const { data: session, isLoading, error } = useGetQuizSession(sessionId, { query: { enabled: !!sessionId, queryKey: getGetQuizSessionQueryKey(sessionId) } });
  const submitSession = useSubmitQuizSession();

  const [answers, setAnswers] = useState<Record<number, string>>({});
  const [currentQIndex, setCurrentQIndex] = useState(0);

  const questions = session?.questions || [];
  const currentQuestion = questions[currentQIndex];
  const progress = questions.length > 0 ? (Object.keys(answers).length / questions.length) * 100 : 0;
  const isComplete = Object.keys(answers).length === questions.length && questions.length > 0;

  const handleSelect = (answer: string) => {
    if (session?.completedAt) return;
    setAnswers(prev => ({ ...prev, [currentQuestion.id]: answer }));
    if (currentQIndex < questions.length - 1) {
      setTimeout(() => setCurrentQIndex(prev => prev + 1), 350);
    }
  };

  const handleSubmit = () => {
    const formattedAnswers = Object.entries(answers).map(([qId, ans]) => ({
      questionId: Number(qId),
      selectedAnswer: ans,
    }));
    submitSession.mutate({ sessionId, data: { answers: formattedAnswers } }, {
      onSuccess: () => setLocation(`/results/${sessionId}`),
    });
  };

  if (isLoading) return <LoadingScreen />;
  if (error || !session) return <ErrorScreen />;
  if (session.completedAt) { setLocation(`/results/${sessionId}`); return null; }

  return (
    /* Quiz has its own full-screen shell — no Layout wrapper */
    <div className="min-h-[100dvh] bg-background text-foreground flex flex-col relative overflow-hidden">
      <BackgroundParticles />

      {/* ── HUD bar ── */}
      <header className="fixed top-0 left-0 right-0 z-40 bg-background/90 backdrop-blur-md border-b-2 border-primary/40">
        <div className="max-w-lg mx-auto px-3 h-14 flex items-center gap-3">
          {/* Level badge */}
          <div
            className="bg-primary text-white w-10 h-10 rounded-xl flex items-center justify-center font-display text-base shrink-0 border-2 border-white/40"
            style={{ boxShadow: '0 3px 0 hsl(22 90% 30%)' }}
          >
            W{session.week}
          </div>
          {/* Subject */}
          <div className="flex-1 min-w-0 hidden xs:block">
            <span className="font-display text-white text-sm leading-none block truncate">{session.subject}</span>
            <span className="text-white/50 text-xs font-bold">{session.year}</span>
          </div>
          {/* Progress bar */}
          <div className="flex-1 min-w-0">
            <div className="progress-game">
              <div className="progress-game-fill" style={{ width: `${progress}%` }} />
            </div>
          </div>
          {/* Counter */}
          <div className="hud-badge text-xs shrink-0">
            <Target className="w-3.5 h-3.5 text-accent" />
            <span>{Object.keys(answers).length}/{questions.length}</span>
          </div>
        </div>
      </header>

      {/* ── Main ── */}
      <main className="flex-1 relative z-10 px-4 pt-16 pb-4 flex flex-col max-w-lg mx-auto w-full">

        {/* Question nav dots */}
        <div className="flex flex-wrap gap-1.5 justify-center my-4">
          {questions.map((q, idx) => {
            const answered = !!answers[q.id];
            const current = currentQIndex === idx;
            return (
              <button
                key={q.id}
                onClick={() => setCurrentQIndex(idx)}
                className={cn(
                  'w-8 h-8 rounded-lg font-display text-sm border-2 transition-all duration-150',
                  current  ? 'border-white bg-primary text-white scale-110 shadow-[0_3px_0_hsl(22,90%,30%)]' :
                  answered ? 'border-accent/60 bg-accent/15 text-accent' :
                             'border-white/15 bg-black/30 text-white/45 hover:border-white/35'
                )}
              >
                {idx + 1}
              </button>
            );
          })}
        </div>

        {/* Question card */}
        {currentQuestion && (
          <div
            key={currentQuestion.id}
            className="card-game p-4 border-t-4 border-primary flex-1 flex flex-col animate-in zoom-in-95 duration-200"
          >
            {/* Question text */}
            <div className="flex items-start gap-3 mb-5">
              <div
                className="bg-primary/20 text-primary border-2 border-primary/50 px-2.5 py-1 rounded-xl font-display text-base shrink-0"
              >
                Q{currentQIndex + 1}
              </div>
              <p className="text-white font-bold text-base leading-snug">{currentQuestion.questionText}</p>
            </div>

            {/* Options */}
            <div className="flex flex-col gap-2.5">
              {(['A', 'B', 'C', 'D'] as const).map((key) => {
                const text = currentQuestion[`option${key}` as `option${'A'|'B'|'C'|'D'}`];
                const isSelected = answers[currentQuestion.id] === key;
                return (
                  <button
                    key={key}
                    onClick={() => handleSelect(key)}
                    className={cn(
                      'text-left px-3 py-3 rounded-2xl border-2 transition-all duration-150 flex items-center gap-3 active:scale-[0.98]',
                      isSelected
                        ? 'border-primary bg-primary/20'
                        : 'border-white/15 bg-black/30 hover:border-white/35 hover:bg-black/40'
                    )}
                    style={isSelected ? { boxShadow: 'inset 0 0 12px hsl(32 95% 52% / 0.2)' } : undefined}
                  >
                    <div className={cn(
                      'w-9 h-9 rounded-xl flex items-center justify-center font-display text-base border-2 shrink-0 transition-all',
                      isSelected
                        ? 'bg-primary text-white border-white/40'
                        : 'bg-black/40 border-white/20 text-white/50'
                    )}>
                      {key}
                    </div>
                    <span className={cn('text-sm font-bold leading-snug', isSelected ? 'text-white' : 'text-white/75')}>
                      {text}
                    </span>
                  </button>
                );
              })}
            </div>

            {/* Footer nav */}
            <div className="mt-4 flex justify-between items-center gap-3 pt-3 border-t border-white/10">
              <button
                onClick={() => setCurrentQIndex(prev => Math.max(0, prev - 1))}
                disabled={currentQIndex === 0}
                className={cn(
                  'px-4 py-2 rounded-xl border-2 font-bold text-sm transition-all',
                  currentQIndex === 0
                    ? 'border-white/10 text-white/25 bg-black/15 cursor-not-allowed'
                    : 'border-white/20 text-white bg-black/35 hover:border-white/40 active:scale-95'
                )}
              >
                Prev
              </button>

              {isComplete ? (
                <button
                  onClick={handleSubmit}
                  disabled={submitSession.isPending}
                  className="btn-game-accent flex-1 py-2.5 text-base flex items-center justify-center gap-2"
                >
                  {submitSession.isPending
                    ? <Loader2 className="w-5 h-5 animate-spin" />
                    : <><Sparkles className="w-4 h-4" /> Submit</>
                  }
                </button>
              ) : (
                <button
                  onClick={() => setCurrentQIndex(prev => Math.min(questions.length - 1, prev + 1))}
                  disabled={currentQIndex === questions.length - 1}
                  className={cn(
                    'btn-game px-5 py-2.5 text-sm flex items-center gap-1.5',
                    currentQIndex === questions.length - 1 && 'opacity-40 pointer-events-none'
                  )}
                >
                  Next <ArrowRight className="w-4 h-4" strokeWidth={2.5} />
                </button>
              )}
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

function LoadingScreen() {
  return (
    <div className="min-h-[100dvh] bg-background flex flex-col items-center justify-center relative">
      <BackgroundParticles />
      <div className="relative z-10 flex flex-col items-center card-game p-10">
        <Loader2 className="w-12 h-12 text-primary animate-spin mb-4" />
        <h2 className="font-display text-white text-xl uppercase tracking-widest">Loading...</h2>
      </div>
    </div>
  );
}

function ErrorScreen() {
  return (
    <div className="min-h-[100dvh] bg-background flex flex-col items-center justify-center relative px-4">
      <BackgroundParticles />
      <div className="relative z-10 card-game border-l-4 border-destructive p-8 max-w-sm w-full text-center">
        <ShieldAlert className="w-12 h-12 text-destructive mx-auto mb-4" />
        <h2 className="font-display text-white text-xl uppercase mb-2">Connection Lost</h2>
        <p className="text-white/65 text-sm font-bold mb-6">Could not load quiz data.</p>
        <button onClick={() => window.location.href = '/dashboard'} className="btn-game w-full py-3 text-base justify-center">
          Back to Dashboard
        </button>
      </div>
    </div>
  );
}
