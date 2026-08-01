import { Layout } from '@/components/Layout';
import { Link } from 'wouter';
import { Trophy, Zap, BookOpen, Share2, MessageCircle } from 'lucide-react';
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
        className="font-display text-2xl tracking-widest"
        style={{
          display: 'inline-block',
          color: 'hsl(45 100% 65%)',
          textShadow: '0 0 16px hsl(45 100% 65% / 0.7), 0 0 32px hsl(45 100% 55% / 0.4)',
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
      <div className="flex-1 flex flex-col items-center px-7 text-center relative z-10 max-w-md mx-auto w-full">

        {/* ── Hero ─────────────────────────────────────────────────── */}
        <div className="w-full mt-8 mb-2">

          {/* Live badge */}
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-primary/20 border border-primary/50 font-bold text-xs uppercase tracking-widest mb-6"
            style={{ color: 'hsl(36 100% 80%)' }}>
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-accent opacity-75" />
              <span className="relative inline-flex rounded-full h-2 w-2 bg-accent" />
            </span>
            Live — Ghana Past Questions
          </div>

          {/* Rolling word + title */}
          <RollingWord />

          {/* Game logo lockup */}
          <div className="relative inline-block w-full">
            {/* Back glow plate */}
            <div className="absolute inset-0 pointer-events-none"
              style={{
                background: 'radial-gradient(ellipse 90% 60% at 50% 50%, hsl(32 100% 50% / 0.22), transparent 70%)',
                filter: 'blur(18px)',
              }} />
            <h1 className="text-game-title text-5xl sm:text-6xl leading-tight relative z-10">QUIZ</h1>
            <h1 className="text-game-title-orange text-6xl sm:text-7xl leading-none relative z-10"
              style={{ marginTop: '-0.05em' }}>BUNKER</h1>
            {/* Bottom fire line */}
            <div className="mx-auto mt-1 h-1 w-40 rounded-full relative z-10"
              style={{
                background: 'linear-gradient(90deg, transparent, hsl(40 100% 60%), hsl(20 100% 55%), transparent)',
                boxShadow: '0 0 12px hsl(35 100% 55% / 0.9), 0 0 28px hsl(35 100% 50% / 0.5)',
              }} />
          </div>

          {/* Tagline */}
          <p className="font-bold text-base leading-relaxed mt-5"
            style={{ color: 'hsl(210 80% 95%)', textShadow: '0 0 20px hsl(210 80% 70% / 0.4)' }}>
            Ghana's top exam practice platform.<br />
            <span style={{
              color: 'hsl(45 100% 78%)',
              textShadow: '0 0 16px hsl(45 100% 60% / 0.6)',
            }}>Crush real past questions, level by level.</span>
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

        {/* ── Ancient Quote ─────────────────────────────────────────── */}
        <div className="w-full mt-10 rounded-2xl px-5 py-5 relative overflow-hidden"
          style={{
            background: 'linear-gradient(135deg, hsl(263 80% 15% / 0.85), hsl(240 60% 12% / 0.9))',
            border: '1.5px solid hsl(263 80% 55% / 0.45)',
            boxShadow: '0 0 30px hsl(263 80% 40% / 0.2), inset 0 1px 0 hsl(263 80% 70% / 0.1)',
          }}
        >
          {/* decorative glow blob */}
          <div className="absolute -top-6 -right-6 w-24 h-24 rounded-full pointer-events-none"
            style={{ background: 'hsl(263 90% 60% / 0.15)', filter: 'blur(20px)' }} />

          <p className="font-mono text-sm italic leading-relaxed relative z-10"
            style={{ color: 'hsl(263 60% 90%)', textShadow: '0 0 12px hsl(263 80% 70% / 0.4)' }}>
            "Education is the most powerful weapon which you can use to change the world."
          </p>
          <p className="mt-2 text-xs font-bold tracking-widest uppercase relative z-10"
            style={{ color: 'hsl(45 100% 65%)', textShadow: '0 0 8px hsl(45 100% 55% / 0.5)' }}>
            — Nelson Mandela
          </p>
        </div>

        {/* ── Feature list ─────────────────────────────────────────── */}
        <div className="flex flex-col gap-5 w-full mt-8">
          <FeatureCard
            icon={<BookOpen className="w-6 h-6" style={{ color: 'hsl(45 100% 65%)' }} />}
            title="4,800+ Questions"
            desc="Organised by week and DOK level — tackle them like unlocking game levels."
            borderColor="hsl(45 100% 55%)"
            iconBg="hsl(45 100% 55% / 0.12)"
          />
          <FeatureCard
            icon={<Trophy className="w-6 h-6" style={{ color: 'hsl(28 100% 65%)' }} />}
            title="All Levels · Dok 1 to 4"
            desc="From quick recall to extended thinking — every difficulty, every topic."
            borderColor="hsl(28 100% 55%)"
            iconBg="hsl(28 100% 55% / 0.12)"
          />
          <FeatureCard
            icon={<Zap className="w-6 h-6" style={{ color: 'hsl(175 100% 55%)' }} />}
            title="Track Your Progress"
            desc="Review every answer after each session and watch your score climb."
            borderColor="hsl(175 100% 45%)"
            iconBg="hsl(175 100% 45% / 0.12)"
          />
        </div>

        {/* ── WhatsApp Share ───────────────────────────────────────── */}
        <WhatsAppShare />

        {/* ── Credits footer ───────────────────────────────────────── */}
        <footer className="w-full mt-8 mb-2 flex flex-col items-center gap-3">
          <div className="h-px w-full bg-white/10 rounded-full" />
          <p className="text-xs text-center" style={{ color: 'hsl(220 20% 55%)' }}>
            © 2026 Quiz Bunker · All rights reserved
          </p>
          <p className="text-xs font-semibold text-center" style={{ color: 'hsl(220 20% 70%)' }}>
            Developed by <span style={{ color: 'hsl(45 100% 70%)' }}>Simeon Adjei</span>
          </p>
          {/* Contact developer — number intentionally hidden, opens WhatsApp chat */}
          <a
            href="https://wa.me/233540984944"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-transform hover:scale-105 active:scale-95"
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
        <div className="h-4" />

      </div>
    </Layout>
  );
}

function WhatsAppShare() {
  const shareUrl = typeof window !== 'undefined' ? window.location.origin : 'https://quizbunker.com';
  const message = `🎓 Hey! Check out Quiz Bunker — Ghana's top exam practice platform. Crush real past questions, level by level! 🚀\n\n${shareUrl}`;
  const waUrl = `https://wa.me/?text=${encodeURIComponent(message)}`;

  return (
    <div className="w-full mt-8 rounded-2xl p-5 flex flex-col items-center gap-3 text-center"
      style={{
        background: 'linear-gradient(135deg, hsl(145 60% 10% / 0.85), hsl(160 50% 8% / 0.9))',
        border: '1.5px solid hsl(145 70% 35% / 0.4)',
        boxShadow: '0 0 24px hsl(145 70% 30% / 0.15)',
      }}
    >
      <div className="flex items-center gap-2" style={{ color: '#25D366' }}>
        <Share2 className="w-4 h-4" />
        <span className="font-bold text-sm tracking-wide uppercase">Share with Friends</span>
      </div>
      <p className="text-xs leading-relaxed" style={{ color: 'hsl(145 30% 75%)' }}>
        Know someone preparing for exams? Send them the link on WhatsApp!
      </p>
      <a
        href={waUrl}
        target="_blank"
        rel="noopener noreferrer"
        className="inline-flex items-center gap-2 px-5 py-3 rounded-xl font-bold text-sm transition-transform hover:scale-105 active:scale-95 w-full justify-center"
        style={{
          background: 'linear-gradient(180deg, #2ecc71 0%, #25D366 40%, #128C7E 100%)',
          color: '#fff',
          boxShadow: '0 5px 0 #075E54, 0 7px 16px rgba(18,140,126,0.4)',
        }}
      >
        <MessageCircle className="w-5 h-5" />
        Share on WhatsApp
      </a>
    </div>
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
      className="card-game p-5 flex items-start gap-4 text-left border-l-4"
      style={{ borderLeftColor: borderColor }}
    >
      <div className="w-12 h-12 rounded-xl flex items-center justify-center shrink-0 border border-white/20"
        style={{ background: iconBg }}>
        {icon}
      </div>
      <div className="pt-0.5">
        <h3 className="font-display text-base mb-1" style={{ color: '#ffffff' }}>{title}</h3>
        <p className="text-sm leading-relaxed" style={{ color: 'hsl(220 30% 82%)' }}>{desc}</p>
      </div>
    </div>
  );
}
