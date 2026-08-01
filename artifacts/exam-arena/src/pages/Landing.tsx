import { Layout } from '@/components/Layout';
import { Link } from 'wouter';
import { Trophy, Zap, BookOpen, MessageCircle } from 'lucide-react';
import { useGetCurrentUser, getGetCurrentUserQueryKey } from '@workspace/api-client-react';
import { useState, useEffect } from 'react';

const HYPE_WORDS = [
  'DOMINATE', 'CONQUER', 'MASTER', 'ACE IT',
  'LEVEL UP', 'CRUSH IT', 'RISE UP', 'WIN BIG',
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
        className="font-display text-2xl tracking-widest"
        style={{
          display: 'inline-block',
          color: 'hsl(45 100% 65%)',
          textShadow: '0 0 14px hsl(45 100% 65% / 0.7), 0 0 28px hsl(45 100% 55% / 0.4)',
          opacity: visible ? 1 : 0,
          transform: visible ? 'translateY(0)' : 'translateY(-14px)',
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
    <Layout wide>
      <div className="flex-1 flex flex-col items-center px-3 sm:px-6 text-center relative z-10 w-full">

        {/* ── Outer container ─────────────────────────────────────── */}
        <div className="w-full max-w-6xl mx-auto">

          {/* ── Hero ──────────────────────────────────────────────── */}
          <div className="w-full mt-4 sm:mt-8 mb-3">

            {/* Logo image — always visible, anchors the hero */}
            <div className="flex justify-center mb-3">
              <div className="relative">
                <div className="absolute inset-0 rounded-full pointer-events-none"
                  style={{ boxShadow: '0 0 40px 8px hsl(35 100% 55% / 0.35)', borderRadius: '50%' }} />
                <img
                  src="/logo.png"
                  alt="Quiz Bunker"
                  className="w-20 h-20 sm:w-24 sm:h-24 rounded-full object-cover relative z-10 border-2"
                  style={{ borderColor: 'hsl(40 100% 60% / 0.6)' }}
                />
              </div>
            </div>

            {/* Live badge */}
            <div
              className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border font-bold text-xs uppercase tracking-widest mb-3"
              style={{
                background: 'hsl(22 90% 50% / 0.18)',
                borderColor: 'hsl(22 90% 50% / 0.5)',
                color: 'hsl(36 100% 80%)',
              }}
            >
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-accent opacity-75" />
                <span className="relative inline-flex rounded-full h-2 w-2 bg-accent" />
              </span>
              Live — Ghana Past Questions
            </div>

            {/* Logo lockup */}
            <div className="relative inline-block w-full">
              <div className="absolute inset-0 pointer-events-none"
                style={{
                  background: 'radial-gradient(ellipse 80% 50% at 50% 50%, hsl(32 100% 50% / 0.18), transparent 70%)',
                  filter: 'blur(10px)',
                }} />
              <h1 className="text-game-title text-3xl sm:text-4xl lg:text-5xl leading-tight relative z-10">QUIZ</h1>
              <h1 className="text-game-title-orange text-4xl sm:text-5xl lg:text-6xl leading-none relative z-10"
                style={{ marginTop: '-0.03em' }}>BUNKER</h1>
              <div className="mx-auto mt-1 h-0.5 w-24 rounded-full relative z-10"
                style={{
                  background: 'linear-gradient(90deg, transparent, hsl(40 100% 60%), hsl(20 100% 55%), transparent)',
                  boxShadow: '0 0 8px hsl(35 100% 55% / 0.9)',
                }} />
            </div>

            {/* Rolling word — below the logo */}
            <div className="mt-1.5">
              <RollingWord />
            </div>

            {/* Tagline */}
            <p className="font-bold text-base sm:text-lg leading-relaxed mt-2"
              style={{ color: 'hsl(210 80% 95%)', textShadow: '0 0 20px hsl(210 80% 70% / 0.4)' }}>
              Ghana's top exam practice platform.<br />
              <span style={{ color: 'hsl(45 100% 78%)', textShadow: '0 0 16px hsl(45 100% 60% / 0.6)' }}>
                Crush likely examinable questions.
              </span>
            </p>
          </div>

          {/* ── CTA buttons — slightly compact ───────────────────── */}
          <div className="flex flex-col sm:flex-row gap-2.5 w-full mt-4">
            {isLoading ? null : user ? (
              <Link href="/dashboard" className="btn-game w-full py-3.5 text-lg justify-center">
                Continue Playing
              </Link>
            ) : (
              <>
                <Link href="/register" className="btn-game flex-1 py-3.5 text-lg justify-center">
                  Create Free Account
                </Link>
                <Link href="/login" className="btn-game-secondary flex-1 py-3 text-base justify-center">
                  I Have an Account
                </Link>
              </>
            )}
          </div>

          {/* ── Feature cards — full width, 1 col mobile → 3 col desktop ── */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 w-full mt-4">
            <FeatureCard
              icon={<BookOpen className="w-5 h-5" style={{ color: 'hsl(45 100% 65%)' }} />}
              title="4,800+ Questions"
              desc="Organised by week and DOK level — tackle them like unlocking game levels."
              borderColor="hsl(45 100% 55%)"
              iconBg="hsl(45 100% 55% / 0.12)"
            />
            <FeatureCard
              icon={<Trophy className="w-5 h-5" style={{ color: 'hsl(28 100% 65%)' }} />}
              title="All Levels · Dok 1 to 4"
              desc="From quick recall to extended thinking — every difficulty, every topic."
              borderColor="hsl(28 100% 55%)"
              iconBg="hsl(28 100% 55% / 0.12)"
            />
            <FeatureCard
              icon={<Zap className="w-5 h-5" style={{ color: 'hsl(175 100% 55%)' }} />}
              title="Track Your Progress"
              desc="Review every answer after each session and watch your score climb."
              borderColor="hsl(175 100% 45%)"
              iconBg="hsl(175 100% 45% / 0.12)"
            />
          </div>

          {/* ── Mandela Quote — below feature cards, above credits ── */}
          <div className="w-full mt-4 rounded-2xl px-5 py-5 relative overflow-hidden text-center"
            style={{
              background: 'linear-gradient(135deg, hsl(263 80% 15% / 0.85), hsl(240 60% 12% / 0.9))',
              border: '2px solid hsl(263 80% 55% / 0.55)',
              boxShadow: '0 0 28px hsl(263 80% 40% / 0.25), inset 0 1px 0 hsl(263 80% 70% / 0.1)',
            }}
          >
            <div className="absolute -top-6 -right-6 w-24 h-24 rounded-full pointer-events-none"
              style={{ background: 'hsl(263 90% 60% / 0.18)', filter: 'blur(20px)' }} />
            <div className="absolute -bottom-6 -left-6 w-24 h-24 rounded-full pointer-events-none"
              style={{ background: 'hsl(263 90% 50% / 0.12)', filter: 'blur(20px)' }} />
            <p className="font-display text-lg sm:text-xl lg:text-2xl leading-snug relative z-10"
              style={{ color: 'hsl(263 60% 95%)', textShadow: '0 0 18px hsl(263 80% 70% / 0.5)' }}>
              "Education is the most powerful weapon which you can use to change the world."
            </p>
            <p className="mt-3 text-sm sm:text-base font-bold tracking-widest uppercase relative z-10"
              style={{ color: 'hsl(45 100% 70%)', textShadow: '0 0 10px hsl(45 100% 55% / 0.6)' }}>
              — Nelson Mandela
            </p>
          </div>

          {/* ── WhatsApp Share — simple centered button above credits ── */}
          <div className="w-full mt-4 flex justify-center">
            <a
              href={`https://wa.me/?text=${encodeURIComponent(`🎓 Check out Quiz Bunker — Ghana's top exam practice platform. Crush likely examinable questions! 🚀\n\n${typeof window !== 'undefined' ? window.location.origin : 'https://quizbunker.com'}`)}`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl text-sm font-bold transition-transform hover:scale-105 active:scale-95"
              style={{
                background: 'linear-gradient(135deg, #25D366 0%, #128C7E 100%)',
                color: '#fff',
                boxShadow: '0 4px 0 #075E54, 0 6px 12px rgba(18,140,126,0.3)',
              }}
            >
              <MessageCircle className="w-4 h-4" />
              Share on WhatsApp
            </a>
          </div>

          {/* ── Credits footer ──────────────────────────────────── */}
          <footer className="w-full mt-6 mb-2 flex flex-col items-center gap-2.5">
            <div className="h-px w-full bg-white/10 rounded-full" />
            <p className="text-sm text-center font-semibold" style={{ color: 'hsl(220 20% 65%)' }}>
              © 2026 Quiz Bunker · All rights reserved
            </p>
            <p className="text-sm font-bold text-center" style={{ color: 'hsl(220 20% 75%)' }}>
              Developed by <span style={{ color: 'hsl(45 100% 70%)' }}>Simeon Adjei</span>
            </p>
            <a
              href="https://wa.me/233540984944"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold transition-transform hover:scale-105 active:scale-95"
              style={{
                background: 'linear-gradient(135deg, #25D366 0%, #128C7E 100%)',
                color: '#fff',
                boxShadow: '0 4px 0 #075E54, 0 6px 12px rgba(18,140,126,0.35)',
              }}
            >
              <MessageCircle className="w-4 h-4" />
              Contact Developer
            </a>
          </footer>

          {/* bottom breathing room above music player */}
          <div className="h-6" />

        </div>
      </div>
    </Layout>
  );
}


function FeatureCard({ icon, title, desc, borderColor, iconBg }: {
  icon: React.ReactNode;
  title: string;
  desc: string;
  borderColor: string;
  iconBg: string;
}) {
  return (
    <div
      className="card-game p-4 flex items-start gap-3 text-left border-l-4 h-full"
      style={{ borderLeftColor: borderColor }}
    >
      <div className="w-11 h-11 rounded-xl flex items-center justify-center shrink-0 border border-white/20"
        style={{ background: iconBg }}>
        {icon}
      </div>
      <div className="pt-0.5 min-w-0">
        <h3 className="font-display text-base mb-1" style={{ color: '#ffffff' }}>{title}</h3>
        <p className="text-sm leading-relaxed" style={{ color: 'hsl(220 30% 82%)' }}>{desc}</p>
      </div>
    </div>
  );
}
