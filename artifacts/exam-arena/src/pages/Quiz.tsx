import { useGetQuizSession, useSubmitQuizSession, getGetQuizSessionQueryKey } from '@workspace/api-client-react';
import { useRoute, useLocation } from 'wouter';
import { useState, useRef, useEffect } from 'react';
import { Loader2, ArrowLeft, ArrowRight, Target, ShieldAlert, Sparkles, CheckCircle2, XCircle, Lightbulb, LayoutGrid } from 'lucide-react';
import { cn } from '@/lib/utils';
import { BackgroundParticles } from '@/components/BackgroundParticles';
import { MusicPlayer } from '@/components/MusicPlayer';

const OPTION_STYLES = {
  A: { selectedBg: 'bg-cyan-500/25',   border: 'border-cyan-400',   shadow: 'shadow-[0_0_18px_hsl(189_95%_52%/0.4)]', badgeBg: 'bg-cyan-500'   },
  B: { selectedBg: 'bg-emerald-500/25', border: 'border-emerald-400', shadow: 'shadow-[0_0_18px_hsl(152_76%_50%/0.4)]', badgeBg: 'bg-emerald-500' },
  C: { selectedBg: 'bg-rose-500/25',    border: 'border-rose-400',    shadow: 'shadow-[0_0_18px_hsl(351_95%_60%/0.4)]', badgeBg: 'bg-rose-500'   },
  D: { selectedBg: 'bg-violet-500/25',  border: 'border-violet-400',  shadow: 'shadow-[0_0_18px_hsl(263_90%_65%/0.4)]', badgeBg: 'bg-violet-500' },
} as const;

export default function Quiz() {
  const [, params] = useRoute('/quiz/:sessionId');
  const sessionId = Number(params?.sessionId);
  const [, setLocation] = useLocation();

  const { data: session, isLoading, error } = useGetQuizSession(sessionId, {
    query: { enabled: !!sessionId, queryKey: getGetQuizSessionQueryKey(sessionId) },
  });
  const submitSession = useSubmitQuizSession();

  const [answers, setAnswers] = useState<Record<number, string>>({});
  const [revealed, setRevealed] = useState<Record<number, boolean>>({});
  const [currentQIndex, setCurrentQIndex] = useState(0);
  const feedbackRef = useRef<HTMLDivElement>(null);

  const questions = session?.questions || [];
  const currentQuestion = questions[currentQIndex];
  const progress = questions.length > 0 ? (Object.keys(answers).length / questions.length) * 100 : 0;
  const isComplete = Object.keys(answers).length === questions.length && questions.length > 0;
  const isCurrentRevealed = currentQuestion ? !!revealed[currentQuestion.id] : false;
  const isLastQuestion = currentQIndex === questions.length - 1;

  // Auto-scroll to feedback panel when an answer is revealed
  useEffect(() => {
    if (isCurrentRevealed && feedbackRef.current) {
      setTimeout(() => {
        feedbackRef.current?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
      }, 150);
    }
  }, [isCurrentRevealed, currentQIndex]);

  const handleSelect = (answer: string) => {
    if (session?.completedAt) return;
    if (answers[currentQuestion.id]) return;
    setAnswers(prev => ({ ...prev, [currentQuestion.id]: answer }));
    setRevealed(prev => ({ ...prev, [currentQuestion.id]: true }));
  };

  const handleNext = () => {
    if (currentQIndex < questions.length - 1) setCurrentQIndex(prev => prev + 1);
  };

  const handlePrev = () => {
    if (currentQIndex > 0) setCurrentQIndex(prev => prev - 1);
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
    /* Natural document scroll: pt clears fixed HUD, pb clears fixed bottom nav */
    <div className="min-h-[100dvh] bg-background text-foreground relative pt-14 pb-24">
      <BackgroundParticles />

      {/* Logo watermark — behind everything */}
      <div className="pointer-events-none fixed inset-0 z-0 flex items-center justify-center" aria-hidden>
        <img
          src="/logo.png" alt=""
          className="w-72 h-72 sm:w-96 sm:h-96 object-contain select-none"
          style={{ opacity: 0.055, filter: 'blur(1px) saturate(0.3)' }}
        />
      </div>

      {/* ── Fixed HUD bar ── */}
      <header className="fixed top-0 left-0 right-0 z-40 bg-background/90 backdrop-blur-md border-b-2 border-primary/40">
        <div className="max-w-lg mx-auto px-3 h-14 flex items-center gap-3">
          <div
            className="bg-primary text-white w-10 h-10 rounded-xl flex items-center justify-center font-display text-base shrink-0 border-2 border-white/40"
            style={{ boxShadow: '0 3px 0 hsl(22 90% 30%)' }}
          >
            W{session.week}
          </div>
          <div className="flex-1 min-w-0 hidden xs:block">
            <span className="font-display text-white text-sm leading-none block truncate">{session.subject}</span>
            <span className="text-white/50 text-xs font-bold">{session.year}</span>
          </div>
          <div className="flex-1 min-w-0">
            <div className="progress-game">
              <div className="progress-game-fill" style={{ width: `${progress}%` }} />
            </div>
          </div>
          <div className="hud-badge text-xs shrink-0">
            <Target className="w-3.5 h-3.5 text-accent" />
            <span>{Object.keys(answers).length}/{questions.length}</span>
          </div>
          <button
            onClick={() => setLocation('/dashboard')}
            className="w-9 h-9 flex items-center justify-center rounded-xl border-2 border-white/15 bg-black/30 text-white/50 hover:border-white/40 hover:text-white transition-all active:scale-90 shrink-0"
            title="Switch week"
          >
            <LayoutGrid className="w-4 h-4" />
          </button>
        </div>
      </header>

      {/* ── Scrollable content (flows naturally below HUD) ── */}
      <div className="relative z-10">
        <div className="max-w-lg mx-auto px-4 py-4 flex flex-col gap-3">

          {/* ── Question text — sticky so it stays visible while options scroll ── */}
          {currentQuestion && (
            <div
              className="sticky top-14 z-20 rounded-2xl px-4 py-5 border-2 border-primary/60"
              style={{
                background: 'linear-gradient(135deg, rgb(28,14,6), rgb(38,20,8))',
                boxShadow: '0 2px 0 hsl(22 90% 25%), 0 4px 24px rgba(0,0,0,0.7)',
              }}
            >
              <div className="flex items-start gap-3">
                <div className="bg-primary/30 text-primary border-2 border-primary/60 px-3 py-1.5 rounded-xl font-display text-base shrink-0 mt-0.5 min-w-[3rem] text-center">
                  Q{currentQIndex + 1}
                </div>
                <p className="text-white font-bold text-xl leading-snug">{currentQuestion.questionText}</p>
              </div>
            </div>
          )}

          {/* ── Options A, B, C, D ── */}
          {currentQuestion && (['A', 'B', 'C', 'D'] as const).map((key) => {
            const text = currentQuestion[`option${key}` as `option${'A'|'B'|'C'|'D'}`];
            const isSelected = answers[currentQuestion.id] === key;
            const rawCorrect = (currentQuestion as any).correctAnswer;
            const rawNorm = rawCorrect ? String(rawCorrect).trim().toUpperCase() : '';
            const correctAnswer = /^[A-D]$/.test(rawNorm) ? rawNorm : '';
            const isCorrect = isCurrentRevealed && !!correctAnswer && correctAnswer === key;
            const isWrong   = isCurrentRevealed && isSelected && !!correctAnswer && correctAnswer !== key;
            const optionStyle = OPTION_STYLES[key];

            return (
              <button
                key={key}
                onClick={() => handleSelect(key)}
                disabled={isCurrentRevealed}
                className={cn(
                  'relative flex flex-row items-center gap-4 rounded-2xl border-2 transition-all duration-200 py-4 px-4 text-left w-full',
                  !isCurrentRevealed && !isSelected && 'border-white/15 bg-black/40 hover:border-white/30 hover:bg-white/5 active:scale-[0.98]',
                  !isCurrentRevealed && isSelected && `${optionStyle.selectedBg} ${optionStyle.border} ${optionStyle.shadow}`,
                  isCorrect && 'border-emerald-400 bg-emerald-500/20 shadow-[0_0_20px_hsl(152_76%_50%/0.5)]',
                  isWrong   && 'border-rose-500 bg-rose-500/15 opacity-75',
                  isCurrentRevealed && !isCorrect && !isWrong && 'border-white/10 bg-black/20 opacity-40',
                )}
              >
                {/* Letter badge */}
                <div className={cn(
                  'w-11 h-11 rounded-xl flex items-center justify-center font-display text-xl border-2 shrink-0',
                  isCorrect ? 'bg-emerald-500 text-white border-white/40' :
                  isWrong   ? 'bg-rose-500 text-white border-white/40' :
                  isSelected && !isCurrentRevealed ? `${optionStyle.badgeBg} text-white border-white/40` :
                               'bg-black/50 border-white/20 text-white/60'
                )}>
                  {key}
                </div>

                {/* Answer text */}
                <span className={cn(
                  'text-xl font-bold leading-snug flex-1',
                  isCorrect ? 'text-emerald-200' :
                  isWrong   ? 'text-rose-200' :
                  isSelected && !isCurrentRevealed ? 'text-white' : 'text-white/80'
                )}>
                  {text}
                </span>

                {isCorrect && <CheckCircle2 className="w-6 h-6 text-emerald-400 shrink-0" />}
                {isWrong   && <XCircle      className="w-6 h-6 text-rose-400 shrink-0" />}
              </button>
            );
          })}

          {/* ── Feedback panel ── */}
          {isCurrentRevealed && currentQuestion && (() => {
            const rawCorrect = (currentQuestion as any).correctAnswer;
            const rawNorm = rawCorrect ? String(rawCorrect).trim().toUpperCase() : '';
            const correctAnswer = /^[A-D]$/.test(rawNorm) ? rawNorm : '';
            const selectedAnswer = answers[currentQuestion.id];
            const isRight = !!correctAnswer && selectedAnswer === correctAnswer;
            const correctOptionText = correctAnswer
              ? (currentQuestion[`option${correctAnswer}` as `option${'A'|'B'|'C'|'D'}`] ?? '')
              : '';
            const feedbackText = (currentQuestion as any).feedback as string | null | undefined;

            return (
              <div ref={feedbackRef} className={cn(
                'rounded-2xl p-5 border-l-4 animate-in slide-in-from-bottom-3 duration-300',
                isRight ? 'bg-emerald-500/10 border-emerald-400' : 'bg-rose-500/10 border-rose-400'
              )}>
                <div className="flex items-center flex-wrap gap-2 mb-3">
                  {isRight
                    ? <CheckCircle2 className="w-6 h-6 text-emerald-400 shrink-0" />
                    : <XCircle      className="w-6 h-6 text-rose-400 shrink-0" />
                  }
                  <span className={cn('font-display text-lg', isRight ? 'text-emerald-300' : 'text-rose-300')}>
                    {isRight ? 'Correct!' : 'Wrong!'}
                  </span>
                  {!isRight && correctAnswer && (
                    <span className="text-base font-bold text-white/70">
                      Answer: <span className="text-emerald-300">{correctAnswer}. {correctOptionText}</span>
                    </span>
                  )}
                </div>
                {feedbackText && (
                  <div className="flex items-start gap-2 mt-1">
                    <Lightbulb className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
                    <p className="text-base text-white font-semibold leading-relaxed whitespace-pre-wrap break-words">
                      {feedbackText}
                    </p>
                  </div>
                )}
              </div>
            );
          })()}

        </div>
      </div>

      {/* Music player floats just above the bottom nav */}
      <MusicPlayer bottomClass="bottom-[80px]" />

      {/* ── Fixed bottom navigation ── */}
      <div
        className="fixed bottom-0 left-0 right-0 z-40 border-t-2 border-white/10 px-4 py-3 flex justify-between items-center gap-3"
        style={{
          background: 'rgba(10,11,20,0.95)',
          backdropFilter: 'blur(12px)',
          WebkitBackdropFilter: 'blur(12px)',
        }}
      >
        <button
          onClick={handlePrev}
          disabled={currentQIndex === 0}
          className={cn(
            'btn-game px-5 py-2.5 text-base flex items-center gap-1.5',
            currentQIndex === 0 && 'opacity-35 pointer-events-none'
          )}
        >
          <ArrowLeft className="w-4 h-4" strokeWidth={2.5} />
          Prev
        </button>

        {isComplete && isLastQuestion && isCurrentRevealed ? (
          <button
            onClick={handleSubmit}
            disabled={submitSession.isPending}
            className="btn-game-accent flex-1 py-2.5 text-base flex items-center justify-center gap-2"
          >
            {submitSession.isPending
              ? <Loader2 className="w-5 h-5 animate-spin" />
              : <><Sparkles className="w-4 h-4" /> Submit &amp; See Results</>
            }
          </button>
        ) : isCurrentRevealed ? (
          <button
            onClick={isLastQuestion ? undefined : handleNext}
            disabled={isLastQuestion && !isComplete}
            className={cn(
              'btn-game px-5 py-2.5 text-base flex items-center gap-1.5',
              isLastQuestion && !isComplete && 'opacity-40 pointer-events-none'
            )}
          >
            {isLastQuestion ? 'Answer all Qs' : <>Next <ArrowRight className="w-4 h-4" strokeWidth={2.5} /></>}
          </button>
        ) : (
          <button
            onClick={handleNext}
            disabled={currentQIndex === questions.length - 1}
            className={cn(
              'btn-game px-5 py-2.5 text-base flex items-center gap-1.5',
              currentQIndex === questions.length - 1 && 'opacity-40 pointer-events-none'
            )}
          >
            Next <ArrowRight className="w-4 h-4" strokeWidth={2.5} />
          </button>
        )}
      </div>
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
