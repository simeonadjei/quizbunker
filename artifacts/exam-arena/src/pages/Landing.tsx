import { Layout } from '@/components/Layout';
import { Link } from 'wouter';
import { Trophy, Zap, BookOpen, Star } from 'lucide-react';
import { useGetCurrentUser, getGetCurrentUserQueryKey } from '@workspace/api-client-react';

export default function Landing() {
  const { data: user, isLoading } = useGetCurrentUser({ query: { queryKey: getGetCurrentUserQueryKey() } });

  return (
    <Layout>
      <div className="flex-1 flex flex-col items-center px-4 py-6 text-center relative z-10 max-w-lg mx-auto w-full">

        {/* Hero */}
        <div className="w-full space-y-4 mt-4">

          {/* Badge */}
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-primary/20 border border-primary/40 text-white font-bold text-xs uppercase tracking-widest">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-accent opacity-75" />
              <span className="relative inline-flex rounded-full h-2 w-2 bg-accent" />
            </span>
            Live — Ghana Past Questions
          </div>

          {/* Title */}
          <div>
            <h1 className="text-game-title text-5xl sm:text-6xl leading-tight">
              QUIZ
            </h1>
            <h1 className="text-game-title-orange text-6xl sm:text-7xl leading-tight">
              BUNKER
            </h1>
          </div>

          {/* Tagline */}
          <p className="text-white/80 font-bold text-base leading-snug">
            Ghana's top exam practice platform.<br />
            Crush real past questions, level by level.
          </p>

          {/* 1500+ callout */}
          <div className="card-game px-5 py-4 text-left space-y-2 border-l-4 border-accent">
            <div className="flex items-center gap-2">
              <BookOpen className="w-5 h-5 text-accent shrink-0" />
              <span className="font-display text-accent text-lg leading-none">1,500+ Questions</span>
            </div>
            <p className="text-white/75 text-sm leading-snug">
              Dok 1 – 4 per subject topic. Real past questions organised by year and week. Practice exactly what comes in the exam.
            </p>
          </div>

          {/* CTA */}
          <div className="flex flex-col gap-3 pt-2">
            {isLoading ? null : user ? (
              <Link href="/dashboard" className="btn-game w-full py-4 text-lg justify-center">
                Continue Playing
              </Link>
            ) : (
              <>
                <Link href="/register" className="btn-game w-full py-4 text-lg justify-center">
                  Create Free Account
                </Link>
                <Link href="/login" className="btn-game-secondary w-full py-3 text-base justify-center">
                  I Already Have an Account
                </Link>
              </>
            )}
          </div>
        </div>

        {/* Stats strip */}
        <div className="grid grid-cols-3 gap-3 w-full mt-8">
          {[
            { icon: <BookOpen className="w-5 h-5 text-accent" />, value: '1,500+', label: 'Questions' },
            { icon: <Trophy className="w-5 h-5 text-primary" />, label: 'Dok 1–4', value: 'All Levels' },
            { icon: <Star className="w-5 h-5 text-secondary" />, value: 'Weekly', label: 'Sets' },
          ].map((s) => (
            <div key={s.label} className="card-game p-3 flex flex-col items-center gap-1">
              {s.icon}
              <span className="font-display text-white text-sm leading-none">{s.value}</span>
              <span className="text-white/60 text-xs">{s.label}</span>
            </div>
          ))}
        </div>

        {/* Feature cards */}
        <div className="flex flex-col gap-4 w-full mt-6">
          <FeatureCard
            icon={<Trophy className="w-6 h-6 text-accent" />}
            title="Past Questions"
            desc="All subjects organised by year — tackle them week by week like game levels."
            colorClass="border-l-accent"
          />
          <FeatureCard
            icon={<Zap className="w-6 h-6 text-primary" />}
            title="Track Progress"
            desc="Review every answer after each session and watch your score rise."
            colorClass="border-l-primary"
          />
          <FeatureCard
            icon={<BookOpen className="w-6 h-6 text-secondary" />}
            title="Dok 1 to 4"
            desc="Questions across all difficulty levels — from recall to extended thinking."
            colorClass="border-l-secondary"
          />
        </div>

      </div>
    </Layout>
  );
}

function FeatureCard({ icon, title, desc, colorClass }: {
  icon: React.ReactNode; title: string; desc: string; colorClass: string;
}) {
  return (
    <div className={`card-game p-4 flex items-start gap-4 text-left border-l-4 ${colorClass}`}>
      <div className="bg-black/30 w-11 h-11 rounded-xl flex items-center justify-center shrink-0 border border-white/10">
        {icon}
      </div>
      <div>
        <h3 className="font-display text-white text-base mb-0.5">{title}</h3>
        <p className="text-white/65 text-sm leading-snug">{desc}</p>
      </div>
    </div>
  );
}
