import { useGetQuizSession, useGetCurrentUser, getGetQuizSessionQueryKey, getGetCurrentUserQueryKey } from '@workspace/api-client-react';
import { useRoute } from 'wouter';
import { Layout } from '@/components/Layout';
import { Certificate } from '@/components/Certificate';
import { Loader2, Trophy, Skull, Target, CheckCircle2, XCircle, Star } from 'lucide-react';
import { Link } from 'wouter';
import { cn } from '@/lib/utils';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';

export default function Results() {
  const [, params] = useRoute('/results/:sessionId');
  const sessionId = Number(params?.sessionId);

  const { data: session, isLoading, error } = useGetQuizSession(sessionId, {
    query: { enabled: !!sessionId, queryKey: getGetQuizSessionQueryKey(sessionId) }
  });

  const { data: currentUser } = useGetCurrentUser({
    query: { queryKey: getGetCurrentUserQueryKey() }
  });

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
        <div className="flex-1 flex flex-col items-center justify-center px-4">
          <div className="card-game p-8 text-center border-l-4 border-destructive max-w-sm w-full">
            <p className="font-display text-destructive text-xl uppercase mb-4">Invalid Session</p>
            <Link href="/dashboard" className="btn-game-secondary px-6 py-2.5 text-sm inline-flex">Back to Dashboard</Link>
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
      {/* Confetti */}
      {isVictory && (
        <div className="fixed inset-0 pointer-events-none overflow-hidden z-50">
          {Array.from({ length: 40 }).map((_, i) => (
            <div
              key={i}
              className="absolute top-[-10%] w-2.5 h-7 rounded-full animate-confettiFall"
              style={{
                left: `${Math.random() * 100}%`,
                backgroundColor: ['#ffaa00', '#00e5cc', '#ff3366', '#aa00ff'][Math.floor(Math.random() * 4)],
                animationDelay: `${Math.random() * 3}s`,
                animationDuration: `${Math.random() * 2 + 2}s`,
              }}
            />
          ))}
        </div>
      )}

      <div className="px-4 py-5 max-w-lg mx-auto w-full">

        {/* Banner */}
        <div className={cn(
          'rounded-3xl border-2 p-6 text-center mb-5 relative overflow-hidden',
          isVictory ? 'bg-accent/10 border-accent/60' : 'bg-destructive/10 border-destructive/60'
        )}>
          {/* Icon */}
          <div className={cn(
            'w-20 h-20 mx-auto rounded-full flex items-center justify-center border-4 border-white/50 mb-3 relative',
            isVictory ? 'bg-accent' : 'bg-destructive'
          )}>
            {isVictory
              ? <Trophy className="w-10 h-10 text-accent-foreground" fill="currentColor" />
              : <Skull className="w-10 h-10 text-white" />}
            {isVictory && (
              <>
                <Star className="absolute -top-3 -left-3 w-7 h-7 text-accent animate-starPulse" fill="currentColor" />
                <Star className="absolute -bottom-2 -right-4 w-8 h-8 text-accent animate-starPulse" fill="currentColor" style={{ animationDelay: '0.25s' }} />
              </>
            )}
          </div>

          {/* Headline */}
          <h1 className={cn(
            'font-display text-3xl uppercase mb-4',
            isVictory ? 'text-game-title-gold' : 'text-game-title'
          )}>
            {isVictory ? 'Stage Clear!' : 'Game Over'}
          </h1>

          {/* Score row */}
          <div className="flex items-center justify-center gap-5">
            <div className="text-center">
              <div className={cn('font-display text-4xl leading-none', isVictory ? 'text-accent' : 'text-destructive')}>
                {percentage}%
              </div>
              <div className="text-white/55 text-xs font-bold mt-1 uppercase tracking-wider">Accuracy</div>
            </div>
            <div className="w-px h-10 bg-white/20" />
            <div className="text-center">
              <div className="font-display text-4xl text-white leading-none">{score}<span className="text-white/40 text-2xl">/{total}</span></div>
              <div className="text-white/55 text-xs font-bold mt-1 uppercase tracking-wider">Correct</div>
            </div>
          </div>
        </div>

        {/* Action buttons */}
        <div className="flex gap-3 mb-5">
          <Link href="/dashboard" className="flex-1">
            <button className="btn-game w-full py-3 text-sm justify-center">Play Again</button>
          </Link>
          <Link href="/history" className="flex-1">
            <button className="btn-game-secondary w-full py-3 text-sm justify-center">History</button>
          </Link>
        </div>

        {/* Certificate — shown on victory with user's real name */}
        {isVictory && currentUser && (
          <Certificate
            studentName={currentUser.name}
            subject={session.subject}
            year={session.year}
            week={session.week ?? 0}
            weekTopic={session.weekTopic ?? ''}
            score={score}
            total={total}
            percentage={percentage}
            completedAt={session.completedAt}
          />
        )}

        {/* Review */}
        <div className="card-game p-4 border-t-4 border-secondary mt-5">
          <div className="flex items-center gap-3 mb-4">
            <Target className="w-5 h-5 text-secondary shrink-0" />
            <h2 className="font-display text-white text-base uppercase">Answer Review</h2>
          </div>

          <Accordion type="multiple" className="space-y-2">
            {session.questions.map((q, idx) => {
              const answer = session.answers?.find(a => a.questionId === q.id);
              const isCorrect = answer?.isCorrect;

              return (
                <AccordionItem
                  value={`q-${q.id}`}
                  key={q.id}
                  className="border-2 border-white/10 bg-black/30 rounded-2xl overflow-hidden data-[state=open]:border-secondary/50 transition-all"
                >
                  <AccordionTrigger className="px-4 py-3 hover:no-underline">
                    <div className="flex items-center gap-3 text-left w-full">
                      <div className={cn(
                        'w-8 h-8 rounded-xl flex items-center justify-center shrink-0 border-2',
                        isCorrect ? 'bg-green-500/20 border-green-500' : 'bg-destructive/20 border-destructive'
                      )}>
                        {isCorrect
                          ? <CheckCircle2 className="w-4 h-4 text-green-400" strokeWidth={3} />
                          : <XCircle className="w-4 h-4 text-destructive" strokeWidth={3} />}
                      </div>
                      <div className="flex-1 min-w-0 pr-2">
                        <span className="font-display text-secondary text-xs uppercase tracking-wider block">Q{idx + 1}</span>
                        <span className="line-clamp-1 font-bold text-sm text-white">{q.questionText}</span>
                      </div>
                    </div>
                  </AccordionTrigger>

                  <AccordionContent className="px-4 pb-4 pt-1">
                    <p className="text-white font-bold text-sm leading-snug mb-3 border-t border-white/10 pt-3">{q.questionText}</p>
                    <div className="flex flex-col gap-2">
                      {(['A', 'B', 'C', 'D'] as const).map((key) => {
                        const text = q[`option${key}` as `option${'A'|'B'|'C'|'D'}`];
                        const isSelectedAns = answer?.selectedAnswer === key;
                        const isCorrectAns = q.correctAnswer === key;
                        return (
                          <div
                            key={key}
                            className={cn(
                              'px-3 py-2 rounded-xl border-2 flex items-center gap-2.5 text-sm',
                              isCorrectAns
                                ? 'bg-green-500/15 border-green-500 text-green-300 font-bold'
                                : isSelectedAns && !isCorrect
                                  ? 'bg-destructive/15 border-destructive text-destructive line-through'
                                  : 'bg-black/30 border-white/10 text-white/60'
                            )}
                          >
                            <span className={cn(
                              'w-7 h-7 rounded-lg flex items-center justify-center font-display text-sm border-2 shrink-0',
                              isCorrectAns
                                ? 'bg-green-500 text-white border-green-400'
                                : isSelectedAns && !isCorrect
                                  ? 'bg-destructive text-white border-red-400'
                                  : 'bg-black/40 border-white/15 text-white/40'
                            )}>
                              {key}
                            </span>
                            <span className="flex-1 leading-snug">{text}</span>
                            {isSelectedAns && <span className="text-xs font-bold opacity-70">Your answer</span>}
                          </div>
                        );
                      })}
                    </div>
                    {q.feedback && (
                      <div className="mt-3 p-3 bg-accent/10 border border-accent/30 rounded-xl">
                        <strong className="text-accent font-display text-xs uppercase tracking-wider flex items-center gap-1 mb-1">
                          <Star className="w-3.5 h-3.5" /> Feedback
                        </strong>
                        <p className="text-white/80 text-sm leading-snug font-bold">{q.feedback}</p>
                      </div>
                    )}
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
