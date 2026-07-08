import { Layout } from '@/components/Layout';
import { Link } from 'wouter';
import { Trophy, Zap, BookOpen } from 'lucide-react';
import { useGetCurrentUser, getGetCurrentUserQueryKey } from '@workspace/api-client-react';
import { useState, useEffect } from 'react';

const HYPE_WORDS = [
  'DOMINATE',
  'CONQUER',
  'MASTER',
  'ACE IT',
  'LEVEL UP',
  'CRUSH IT',
  'RISE UP',
  'WIN BIG',
];

function RollingWord() {
  const [index, setIndex] = useState(0);
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    const interval = setInterval(() => {
      setVisible(false);
      setTimeout(() => {
        setIndex((i) => (i + 1) % HYPE_WORDS.length);
        setVisible(true);
      }, 400);
    }, 2000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="h-9 flex items-center justify-center overflow-hidden">
      <span
        className="font-display text-2xl tracking-widest text-accent"
        style={{
          display: 'inline-block',
          opacity: visible ? 1 : 0,
          transform: visible ? 'translateY(0)' : 'translateY(-18px)',
          transition: 'opacity 0.35s ease, transform 0.35s ease',
        }}
      >
        {HYPE_WORDS[index]}
      </span>
    </div>
  );
}

export default function Landing() {
  const { data: user, isLoading } = useGetCurrentUser({ query: { queryKey: getGetCurrentUserQueryKey() } });

  return (
    <Layout>
      <div className="flex-1 flex flex-col items-center px-5 text-center relative z-10 max-w-md mx-auto w-full">

        {/* ── Hero ─────────────────────────────────────────────────── */}
        <div className="w-full mt-8 mb-2">

          {/* Live badge */}
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-primary/20 border border-primary/40 text-white font-bold text-xs uppercase tracking-widest mb-6">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-accent opacity-75" />
              <span className="relative inline-flex rounded-full h-2 w-2 bg-accent" />
            </span>
            Live — Ghana Past Questions
          </div>

          {/* Rolling word + title */}
          <RollingWord />
          <h1 className="text-game-title text-5xl sm:text-6xl leading-tight">QUIZ</h1>
          <h1 className="text-game-title-orange text-6xl sm:text-7xl leading-tight">BUNKER</h1>

          {/* Tagline */}
          <p className="text-white/70 font-bold text-base leading-relaxed mt-5">
            Ghana's top exam practice platform.<br />
            Crush real past questions, level by level.
          </p>
        </div>

        {/* ── CTA ──────────────────────────────────────────────────── */}
        <div className="flex flex-col gap-3 w-full mt-8">
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

        {/* ── Feature list ─────────────────────────────────────────── */}
        <div className="flex flex-col gap-5 w-full mt-12">
          <FeatureCard
            icon={<BookOpen className="w-6 h-6 text-accent" />}
            title="1,500+ Questions"
            desc="Organised by subject and year — tackle them week by week like game levels."
            colorClass="border-l-accent"
          />
          <FeatureCard
            icon={<Trophy className="w-6 h-6 text-primary" />}
            title="All Levels · Dok 1 to 4"
            desc="From straightforward recall all the way up to extended thinking questions."
            colorClass="border-l-primary"
          />
          <FeatureCard
            icon={<Zap className="w-6 h-6 text-secondary" />}
            title="Track Your Progress"
            desc="Review every answer after each session and watch your score climb."
            colorClass="border-l-secondary"
          />
        </div>

        {/* bottom breathing room above music player */}
        <div className="h-6" />

      </div>
    </Layout>
  );
}

function FeatureCard({ icon, title, desc, colorClass }: {
  icon: React.ReactNode; title: string; desc: string; colorClass: string;
}) {
  return (
    <div className={`card-game p-5 flex items-start gap-4 text-left border-l-4 ${colorClass}`}>
      <div className="bg-black/30 w-12 h-12 rounded-xl flex items-center justify-center shrink-0 border border-white/10">
        {icon}
      </div>
      <div className="pt-0.5">
        <h3 className="font-display text-white text-base mb-1">{title}</h3>
        <p className="text-white/60 text-sm leading-relaxed">{desc}</p>
      </div>
    </div>
  );
}
