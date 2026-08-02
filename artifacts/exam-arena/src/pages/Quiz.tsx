import { useGetQuizSession, useSubmitQuizSession, getGetQuizSessionQueryKey } from '@workspace/api-client-react';
import type { QuizSessionDetail } from '@workspace/api-client-react';
import { registerSession } from '@/lib/offlineSessions';
import { isSubscriptionActiveOffline } from '@/lib/offlineUser';
import { useRoute, useLocation } from 'wouter';
import { useState, useRef, useEffect, useCallback } from 'react';
import { Loader2, ArrowLeft, ArrowRight, Target, ShieldAlert, Sparkles, CheckCircle2, XCircle, Lightbulb, LayoutGrid, WifiOff, Hand, Lock } from 'lucide-react';
import { cn } from '@/lib/utils';
import { BackgroundParticles } from '@/components/BackgroundParticles';
import { MusicPlayer } from '@/components/MusicPlayer';

// ─── Offline session cache ────────────────────────────────────────────────────
// Keyed by session ID. Stores the full QuizSessionDetail so the quiz is
// playable offline after the first successful online load.

const CACHE_PREFIX = 'qb_session_';
const ANSWERS_PREFIX = 'qb_answers_';

function cacheSession(id: number, data: QuizSessionDetail) {
  try {
    localStorage.setItem(`${CACHE_PREFIX}${id}`, JSON.stringify(data));
  } catch {}
}

function getCachedSession(id: number): QuizSessionDetail | null {
  try {
    const raw = localStorage.getItem(`${CACHE_PREFIX}${id}`);
    return raw ? (JSON.parse(raw) as QuizSessionDetail) : null;
  } catch {
    return null;
  }
}

function saveAnswersLocally(id: number, answers: Record<number, string>) {
  try {
    localStorage.setItem(`${ANSWERS_PREFIX}${id}`, JSON.stringify(answers));
  } catch {}
}

function getLocalAnswers(id: number): Record<number, string> {
  try {
    const raw = localStorage.getItem(`${ANSWERS_PREFIX}${id}`);
    return raw ? (JSON.parse(raw) as Record<number, string>) : {};
  } catch {
    return {};
  }
}

function clearLocalAnswers(id: number) {
  try {
    localStorage.removeItem(`${ANSWERS_PREFIX}${id}`);
  } catch {}
}

// ─────────────────────────────────────────────────────────────────────────────

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

  // ── Fetch with offline fallback ──────────────────────────────────────────
  const { data: networkSession, isLoading, error } = useGetQuizSession(sessionId, {
    query: {
      enabled: !!sessionId,
      queryKey: getGetQuizSessionQueryKey(sessionId),
      // Keep stale data visible while revalidating — avoids flash on reconnect
      staleTime: 60_000,
      retry: 1,
    },
  });

  const [offlineMode, setOfflineMode] = useState(false);
  const [session, setSession] = useState<QuizSessionDetail | null>(null);
  const [showGridHint, setShowGridHint] = useState(false);
  const [motivationalMsg, setMotivationalMsg] = useState<string | null>(null);
  const [expiredOffline, setExpiredOffline] = useState(false);

  // Sync session: prefer live network data; fall back to cache on error
  useEffect(() => {
    if (networkSession) {
      setSession(networkSession);
      setOfflineMode(false);
      setExpiredOffline(false);
      cacheSession(sessionId, networkSession);
      // Register in session index so the Dashboard can navigate here offline
      if (networkSession.year && networkSession.subject && networkSession.week != null) {
        registerSession(networkSession.year, networkSession.subject, networkSession.week, sessionId);
      }
    } else if (error && !networkSession) {
      const cached = getCachedSession(sessionId);
      if (cached) {
        // Block access if the subscription has expired while offline
        if (!isSubscriptionActiveOffline()) {
          setSession(null);
          setOfflineMode(false);
          setExpiredOffline(true);
        } else {
          setSession(cached);
          setOfflineMode(true);
          setExpiredOffline(false);
        }
      }
    }
  }, [networkSession, error, sessionId]);

  const submitSession = useSubmitQuizSession();

  // Initialise answers from both network session and any locally-saved progress
  const [answers, setAnswers] = useState<Record<number, string>>(() => getLocalAnswers(sessionId));
  const [revealed, setRevealed] = useState<Record<number, boolean>>({});
  const [currentQIndex, setCurrentQIndex] = useState(0);
  const [submitOfflineError, setSubmitOfflineError] = useState(false);
  const feedbackRef  = useRef<HTMLDivElement>(null);
  const optionsRef   = useRef<HTMLDivElement>(null);
  // Tracks whether we were offline so we can auto-submit on reconnect
  const wasOfflineRef = useRef(false);

  // Merge server-returned answers on session load (don't clobber local answers)
  useEffect(() => {
    if (!session?.answers) return;
    const serverAnswers: Record<number, string> = {};
    const serverRevealed: Record<number, boolean> = {};
    for (const a of session.answers) {
      if (a.selectedAnswer) {
        serverAnswers[a.questionId] = a.selectedAnswer;
        serverRevealed[a.questionId] = true;
      }
    }
    setAnswers(prev => ({ ...serverAnswers, ...prev }));
    setRevealed(prev => ({ ...serverRevealed, ...prev }));
  }, [session?.id]); // eslint-disable-line react-hooks/exhaustive-deps

  const questions       = session?.questions || [];
  const currentQuestion = questions[currentQIndex];
  const progress        = questions.length > 0 ? (Object.keys(answers).length / questions.length) * 100 : 0;
  const isComplete      = Object.keys(answers).length === questions.length && questions.length > 0;
  const isCurrentRevealed = currentQuestion ? !!revealed[currentQuestion.id] : false;
  const isLastQuestion  = currentQIndex === questions.length - 1;

  // ── Motivational ticker — updates every 5 minutes based on performance ──
  useEffect(() => {
    if (!session) return;

    const CORRECT_MSGS = [
      '🔥 You\'re on fire! Keep crushing it!',
      '⚡ Incredible! You\'re dominating this quiz!',
      '🏆 Champion energy! Don\'t stop now!',
      '✨ Your hard work is showing — brilliant!',
      '💪 Unstoppable! Keep that momentum going!',
      '🎯 Laser focus — you\'re acing this!',
      '🚀 Sky\'s the limit — you\'re soaring!',
    ];
    const WRONG_MSGS = [
      '💪 Every mistake is a lesson — you\'ve got this!',
      '🌟 Champions are made through challenges — keep pushing!',
      '🔄 Reset, refocus, and rise — you\'re still in this!',
      '🧠 Your brain is growing with every question — trust the process!',
      '❤️ Don\'t give up — every great student started where you are!',
      '⚡ Setbacks are setups for comebacks — keep going!',
      '🎯 Stay locked in — you\'ll crack it!',
    ];
    const MIXED_MSGS = [
      '🚀 Solid progress — keep the momentum!',
      '⚡ You\'re building real knowledge — stay focused!',
      '🌟 Great effort! Every question makes you stronger!',
      '🔥 You\'re making progress — one question at a time!',
      '💡 Stay sharp — you\'re getting there!',
    ];

    const pick = (arr: string[]) => arr[Math.floor(Math.random() * arr.length)];

    const updateMsg = () => {
      const answeredIds = Object.keys(answers).map(Number);
      if (answeredIds.length === 0) return;
      const correctCount = answeredIds.filter(id => {
        const q = session.questions.find(q => q.id === id);
        return q && answers[id] === String(q.correctAnswer).trim().toUpperCase();
      }).length;
      const ratio = correctCount / answeredIds.length;
      if (ratio >= 0.65)      setMotivationalMsg(pick(CORRECT_MSGS));
      else if (ratio <= 0.35) setMotivationalMsg(pick(WRONG_MSGS));
      else                    setMotivationalMsg(pick(MIXED_MSGS));
    };

    // First flash after 20 s, then every 5 minutes
    const firstTimer = setTimeout(updateMsg, 20_000);
    const interval   = setInterval(updateMsg, 5 * 60 * 1000);
    return () => { clearTimeout(firstTimer); clearInterval(interval); };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [session?.id]);

  // Periodic hint for the grid (week-switcher) button — every 6 minutes
  useEffect(() => {
    if (!session) return;
    let hideTimer: ReturnType<typeof setTimeout>;
    const flash = () => {
      setShowGridHint(true);
      hideTimer = setTimeout(() => setShowGridHint(false), 6_000);
    };
    const firstTimer = setTimeout(flash, 12_000); // first flash 12 s after load
    const interval   = setInterval(flash, 6 * 60 * 1000); // then every 6 min
    return () => { clearTimeout(firstTimer); clearTimeout(hideTimer); clearInterval(interval); };
  }, [session?.id]); // eslint-disable-line react-hooks/exhaustive-deps

  // Scroll the options pane to top whenever the question changes
  useEffect(() => {
    if (optionsRef.current) optionsRef.current.scrollTop = 0;
  }, [currentQIndex]);

  // Auto-scroll to feedback inside the options pane when an answer is revealed
  useEffect(() => {
    if (isCurrentRevealed && feedbackRef.current && optionsRef.current) {
      setTimeout(() => {
        feedbackRef.current?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
      }, 150);
    }
  }, [isCurrentRevealed, currentQIndex]);

  const handleSelect = useCallback((answer: string) => {
    if (session?.completedAt) return;
    if (!currentQuestion) return;
    if (answers[currentQuestion.id]) return;
    const next = { ...answers, [currentQuestion.id]: answer };
    setAnswers(next);
    setRevealed(prev => ({ ...prev, [currentQuestion.id]: true }));
    // Persist locally so progress survives an offline disconnect
    saveAnswersLocally(sessionId, next);
  }, [session?.completedAt, currentQuestion, answers, sessionId]);

  const handleNext = () => { if (currentQIndex < questions.length - 1) setCurrentQIndex(p => p + 1); };
  const handlePrev = () => { if (currentQIndex > 0) setCurrentQIndex(p => p - 1); };

  const doSubmit = (currentAnswers: Record<number, string>) => {
    const formattedAnswers = Object.entries(currentAnswers).map(([qId, ans]) => ({
      questionId: Number(qId),
      selectedAnswer: ans,
    }));
    submitSession.mutate({ sessionId, data: { answers: formattedAnswers } }, {
      onSuccess: () => {
        clearLocalAnswers(sessionId);
        setLocation(`/results/${sessionId}`);
      },
    });
  };

  const handleSubmit = () => {
    if (offlineMode) {
      setSubmitOfflineError(true);
      wasOfflineRef.current = true; // flag: auto-submit when reconnected
      return;
    }
    doSubmit(answers);
  };

  // ── Auto-sync on reconnect ──────────────────────────────────────────────────
  // When offlineMode transitions from true → false (network restored) and the
  // quiz is complete, submit the queued answers automatically.
  useEffect(() => {
    const prevWasOffline = wasOfflineRef.current;
    if (prevWasOffline && !offlineMode && isComplete && !session?.completedAt) {
      wasOfflineRef.current = false;
      setSubmitOfflineError(false);
      doSubmit(answers);
    }
    if (offlineMode) wasOfflineRef.current = true;
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [offlineMode]);

  // ── Loading / error states ───────────────────────────────────────────────
  if (isLoading && !session) return <LoadingScreen />;

  if (expiredOffline) return <ExpiredScreen />;

  if ((error || !session) && !session) return <ErrorScreen />;

  if (!session) return <LoadingScreen />;

  if (session.completedAt) { setLocation(`/results/${sessionId}`); return null; }

  return (
    /*
     * Full-viewport flex column:
     *   row 1 — HUD bar        (shrink-0, never scrolls)
     *   row 2 — Question card  (shrink-0, never scrolls)
     *   row 3 — Options pane   (flex-1, overflow-y-auto — ONLY this scrolls)
     *   row 4 — Bottom nav     (shrink-0, never scrolls)
     *
     * This guarantees Option A is always the first visible item in the
     * scrollable pane and can never be hidden behind the question card.
     */
    <div className="h-[100dvh] flex flex-col bg-background text-foreground overflow-hidden relative">
      <BackgroundParticles />

      {/* Logo watermark — fixed, behind everything */}
      <div className="pointer-events-none fixed inset-0 z-0 flex items-center justify-center" aria-hidden>
        <img
          src="/logo.png" alt=""
          className="w-72 h-72 sm:w-96 sm:h-96 object-contain select-none"
          style={{ opacity: 0.055, filter: 'blur(1px) saturate(0.3)' }}
        />
      </div>

      {/* ── Offline banner ── */}
      {offlineMode && (
        <div className="relative z-50 shrink-0 flex items-center justify-center gap-2 py-1.5 px-4 text-xs font-bold"
          style={{ background: 'rgba(234,179,8,0.15)', borderBottom: '1px solid rgba(234,179,8,0.4)' }}>
          <WifiOff className="w-3.5 h-3.5 text-yellow-400" />
          <span className="text-yellow-300">Offline — continuing from cache. Reconnect to submit.</span>
        </div>
      )}

      {/* ── Submit-while-offline error ── */}
      {submitOfflineError && (
        <div className="relative z-50 shrink-0 flex items-center justify-center gap-2 py-1.5 px-4 text-xs font-bold"
          style={{ background: 'rgba(239,68,68,0.15)', borderBottom: '1px solid rgba(239,68,68,0.4)' }}>
          <WifiOff className="w-3.5 h-3.5 text-red-400" />
          <span className="text-red-300">No connection — your answers are saved. Reconnect then submit.</span>
        </div>
      )}

      {/* ── Row 1: HUD bar ── */}
      <header className="relative z-40 shrink-0 bg-background/90 backdrop-blur-md border-b-2 border-primary/40">
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
          {/* Grid button with periodic hint */}
          <div className="relative shrink-0">
            <button
              onClick={() => { setShowGridHint(false); setLocation('/dashboard'); }}
              className="w-9 h-9 flex items-center justify-center rounded-xl border-2 border-white/15 bg-black/30 text-white/50 hover:border-white/40 hover:text-white transition-all active:scale-90"
              title="Switch week"
            >
              <LayoutGrid className="w-4 h-4" />
            </button>

            {/* Periodic hint bubble */}
            {showGridHint && (
              <div className="absolute top-11 right-0 z-50 animate-in fade-in slide-in-from-top-2 duration-300"
                style={{ whiteSpace: 'nowrap' }}>
                {/* Arrow pointing up to button */}
                <div className="flex justify-end pr-3.5 -mb-[5px]">
                  <div className="w-2.5 h-2.5 rotate-45 border-l border-t"
                    style={{ background: 'rgba(10,20,30,0.95)', borderColor: 'hsl(175 100% 50% / 0.45)' }} />
                </div>
                <div
                  className="flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-semibold text-white shadow-xl border"
                  style={{
                    background: 'linear-gradient(135deg, rgba(10,20,30,0.95), rgba(10,30,25,0.97))',
                    borderColor: 'hsl(175 100% 50% / 0.45)',
                    backdropFilter: 'blur(12px)',
                    WebkitBackdropFilter: 'blur(12px)',
                  }}
                >
                  <Hand className="w-3.5 h-3.5 text-secondary shrink-0" />
                  <span style={{ color: 'hsl(175 100% 80%)' }}>Tap to change year &amp; subject</span>
                  <button
                    onClick={() => setShowGridHint(false)}
                    className="ml-1 text-white/30 hover:text-white/70 text-[10px] leading-none shrink-0"
                    aria-label="Dismiss"
                  >✕</button>
                </div>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* ── Row 2: Question card (never scrolls) ── */}
      {currentQuestion && (
        <div className="relative z-30 shrink-0 border-b-2 border-primary/30"
          style={{
            background: 'linear-gradient(135deg, rgb(28,14,6), rgb(38,20,8))',
            boxShadow: '0 2px 0 hsl(22 90% 25%)',
          }}
        >
          {/* Week topic banner */}
          {(currentQuestion as any).weekTopic && (
            <div
              className="max-w-lg mx-auto px-4 pt-3 pb-0 flex items-center gap-2"
            >
              <div
                className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider border"
                style={{
                  background: 'hsl(175 100% 40% / 0.12)',
                  borderColor: 'hsl(175 100% 50% / 0.4)',
                  color: 'hsl(175 100% 75%)',
                }}
              >
                <span
                  className="inline-block w-1.5 h-1.5 rounded-full"
                  style={{ background: 'hsl(175 100% 55%)' }}
                />
                {(currentQuestion as any).weekTopic}
              </div>
            </div>
          )}

          <div className="max-w-lg mx-auto px-4 py-4 flex items-start gap-3">
            <div className="bg-primary/30 text-primary border-2 border-primary/60 px-3 py-1.5 rounded-xl font-display text-base shrink-0 mt-0.5 min-w-[3rem] text-center">
              Q{currentQIndex + 1}
            </div>
            <p className="text-white font-bold text-xl leading-snug">{currentQuestion.questionText}</p>
          </div>
        </div>
      )}

      {/* ── Row 3: Options — the ONLY scrollable area ── */}
      <div ref={optionsRef} className="flex-1 overflow-y-auto relative z-10">
        <div className="max-w-lg mx-auto px-4 py-4 flex flex-col gap-3 pb-4">

          {currentQuestion && (['A', 'B', 'C', 'D'] as const).map((key) => {
            const text = currentQuestion[`option${key}` as `option${'A'|'B'|'C'|'D'}`];
            const isSelected = answers[currentQuestion.id] === key;
            const rawCorrect = (currentQuestion as any).correctAnswer;
            const rawNorm    = rawCorrect ? String(rawCorrect).trim().toUpperCase() : '';
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
            const rawCorrect    = (currentQuestion as any).correctAnswer;
            const rawNorm       = rawCorrect ? String(rawCorrect).trim().toUpperCase() : '';
            const correctAnswer = /^[A-D]$/.test(rawNorm) ? rawNorm : '';
            const selectedAnswer = answers[currentQuestion.id];
            const isRight        = !!correctAnswer && selectedAnswer === correctAnswer;
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

          {/* ── Motivational scrolling ticker ── */}
          {motivationalMsg && (
            <div
              className="overflow-hidden rounded-xl px-0 py-2.5 border animate-in fade-in duration-500"
              style={{
                background: 'linear-gradient(135deg, rgba(255,160,0,0.08), rgba(0,200,160,0.08))',
                borderColor: 'rgba(255,160,0,0.25)',
              }}
            >
              <div className="flex items-center gap-2 px-3 mb-1.5">
                <span className="text-[10px] font-bold uppercase tracking-widest" style={{ color: 'hsl(45 100% 65%)' }}>
                  Coach says
                </span>
                <div className="flex-1 h-px" style={{ background: 'rgba(255,160,0,0.2)' }} />
                <button
                  onClick={() => setMotivationalMsg(null)}
                  className="text-white/25 hover:text-white/60 text-[10px] leading-none transition-colors"
                  aria-label="Dismiss"
                >✕</button>
              </div>
              <div className="relative overflow-hidden">
                <p
                  className="text-sm font-bold whitespace-nowrap"
                  style={{
                    color: 'hsl(45 100% 82%)',
                    animationName: 'motivationalScroll',
                    animationDuration: '18s',
                    animationTimingFunction: 'linear',
                    animationIterationCount: 'infinite',
                    display: 'inline-block',
                    paddingLeft: '100%',
                  }}
                >
                  {motivationalMsg}&nbsp;&nbsp;&nbsp;&nbsp;{motivationalMsg}
                </p>
              </div>
            </div>
          )}

        </div>
      </div>

      {/* Music player floats just above the bottom nav */}
      <MusicPlayer bottomClass="bottom-[80px]" />

      {/* ── Row 4: Bottom navigation (never scrolls) ── */}
      <div
        className="relative z-40 shrink-0 border-t-2 border-white/10 px-4 py-3 flex justify-between items-center gap-3"
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
            className={cn(
              'btn-game-accent flex-1 py-2.5 text-base flex items-center justify-center gap-2',
              offlineMode && 'opacity-60'
            )}
          >
            {submitSession.isPending
              ? <Loader2 className="w-5 h-5 animate-spin" />
              : offlineMode
                ? <><WifiOff className="w-4 h-4" /> Reconnect to Submit</>
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

function ExpiredScreen() {
  return (
    <div className="min-h-[100dvh] bg-background flex flex-col items-center justify-center relative px-4">
      <BackgroundParticles />
      <div className="relative z-10 card-game border-l-4 border-accent p-8 max-w-sm w-full text-center">
        <div className="w-16 h-16 rounded-2xl bg-accent/20 border-2 border-accent/50 flex items-center justify-center mx-auto mb-5">
          <Lock className="w-8 h-8 text-accent" strokeWidth={2.5} />
        </div>
        <h2 className="font-display text-white text-xl uppercase mb-2">Subscription Expired</h2>
        <p className="text-white/65 text-sm font-bold mb-6 leading-relaxed">
          Your subscription has ended. Renew to continue practising — all your history is saved.
        </p>
        <button
          onClick={() => window.location.href = '/subscribe'}
          className="btn-game w-full py-3 text-base justify-center mb-3"
        >
          Renew Subscription
        </button>
        <button
          onClick={() => window.location.href = '/dashboard'}
          className="btn-game-ghost w-full py-3 text-base justify-center"
        >
          Back to Dashboard
        </button>
      </div>
    </div>
  );
}
