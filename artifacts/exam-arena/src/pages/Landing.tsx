import { Layout } from '@/components/Layout';
import { Link } from 'wouter';
import { Trophy, Zap, BookOpen, MessageCircle, Star, Shield } from 'lucide-react';
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
        className="font-display text-2xl lg:text-3xl tracking-widest"
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
      {/* ── Arena-inspired layered background (desktop only enhancement) ── */}
      <div className="pointer-events-none fixed inset-0 -z-10 hidden lg:block" aria-hidden>
        {/* Sky-to-horizon gradient */}
        <div style={{
          position: 'absolute', inset: 0,
          background: 'linear-gradient(180deg, hsl(215 80% 14%) 0%, hsl(230 60% 10%) 35%, hsl(240 40% 8%) 60%, hsl(240 40% 6%) 100%)',
        }} />
        {/* Warm arena glow in the center */}
        <div style={{
          position: 'absolute', inset: 0,
          background: 'radial-gradient(ellipse 90% 55% at 50% 45%, hsl(35 100% 55% / 0.12) 0%, hsl(22 90% 45% / 0.06) 40%, transparent 70%)',
        }} />
        {/* Horizon rim light */}
        <div style={{
          position: 'absolute', left: '5%', right: '5%', top: '28%', height: '2px',
          background: 'linear-gradient(90deg, transparent, hsl(35 100% 65% / 0.18), hsl(180 100% 60% / 0.15), transparent)',
          filter: 'blur(2px)',
        }} />
        {/* Left atmospheric column */}
        <div style={{
          position: 'absolute', left: '-10%', top: '10%', width: '45%', height: '70%',
          background: 'radial-gradient(ellipse 60% 80% at 15% 40%, hsl(210 90% 55% / 0.06), transparent 70%)',
        }} />
        {/* Right atmospheric column */}
        <div style={{
          position: 'absolute', right: '-10%', top: '10%', width: '45%', height: '70%',
          background: 'radial-gradient(ellipse 60% 80% at 85% 40%, hsl(28 100% 55% / 0.06), transparent 70%)',
        }} />
        {/* Ground band */}
        <div style={{
          position: 'absolute', bottom: 0, left: 0, right: 0, height: '18%',
          background: 'linear-gradient(0deg, hsl(140 50% 8% / 0.6) 0%, transparent 100%)',
        }} />
      </div>

      <div className="flex-1 flex flex-col items-center px-3 sm:px-6 lg:px-8 text-center relative z-10 w-full">

        {/* ── Outer container ─────────────────────────────────────── */}
        <div className="w-full max-w-6xl mx-auto">

          {/* ── WATERMARK logo (desktop only, sits behind everything) ── */}
          <div
            className="pointer-events-none select-none hidden lg:block fixed"
            aria-hidden
            style={{
              top: '50%', left: '50%',
              transform: 'translate(-50%, -50%)',
              width: 'min(52vw, 520px)',
              height: 'min(52vw, 520px)',
              zIndex: 0,
            }}
          >
            <img
              src="/logo.png"
              alt=""
              style={{
                width: '100%', height: '100%',
                objectFit: 'contain',
                opacity: 0.04,
                filter: 'blur(1px) saturate(0.4)',
              }}
            />
          </div>

          {/* ── Hero ──────────────────────────────────────────────── */}
          <div className="w-full mt-4 sm:mt-8 lg:mt-12 mb-3 lg:mb-6 relative z-10">

            {/* Logo image — visible on mobile; hidden on desktop (it's the watermark there) */}
            <div className="flex justify-center mb-3 lg:hidden">
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
              className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border font-bold text-xs uppercase tracking-widest mb-3 lg:mb-4"
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
              <h1 className="text-game-title text-3xl sm:text-4xl lg:text-6xl xl:text-7xl leading-tight relative z-10">QUIZ</h1>
              <h1 className="text-game-title-orange text-4xl sm:text-5xl lg:text-7xl xl:text-8xl leading-none relative z-10"
                style={{ marginTop: '-0.03em' }}>BUNKER</h1>
              <div className="mx-auto mt-1 h-0.5 w-24 lg:w-36 rounded-full relative z-10"
                style={{
                  background: 'linear-gradient(90deg, transparent, hsl(40 100% 60%), hsl(20 100% 55%), transparent)',
                  boxShadow: '0 0 8px hsl(35 100% 55% / 0.9)',
                }} />
            </div>

            {/* Rolling word */}
            <div className="mt-1.5 lg:mt-3">
              <RollingWord />
            </div>

            {/* Tagline */}
            <p className="font-bold text-base sm:text-lg lg:text-xl leading-relaxed mt-2 lg:mt-4"
              style={{ color: 'hsl(210 80% 95%)' }}>
              Ghana's top exam practice platform.<br />
              <span style={{ color: 'hsl(45 100% 78%)' }}>
                Crush likely examinable questions.
              </span>
            </p>
          </div>

          {/* ── CTA buttons ───────────────────────────────────────── */}
          <div className="flex flex-col sm:flex-row gap-2.5 lg:gap-4 w-full mt-4 lg:mt-8 relative z-10">
            {isLoading ? null : user ? (
              <Link href="/dashboard" className="btn-game w-full py-3.5 lg:py-5 text-lg lg:text-xl justify-center">
                Continue Playing
              </Link>
            ) : (
              <>
                <Link href="/register" className="btn-game flex-1 py-3.5 lg:py-5 text-lg lg:text-xl justify-center">
                  Create Free Account
                </Link>
                <Link href="/login" className="btn-game-secondary flex-1 py-3 lg:py-4 text-base lg:text-lg justify-center">
                  I Have an Account
                </Link>
              </>
            )}
          </div>

          {/* ── Feature cards ─────────────────────────────────────── */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 lg:gap-5 w-full mt-4 lg:mt-10 relative z-10">
            <FeatureCard
              icon={<BookOpen className="w-5 h-5 lg:w-6 lg:h-6" style={{ color: 'hsl(45 100% 65%)' }} />}
              title="4,800+ Questions"
              desc="Organised by week and DOK level — tackle them like unlocking game levels."
              borderColor="hsl(45 100% 55%)"
              iconBg="hsl(45 100% 55% / 0.12)"
              glowColor="hsl(45 100% 55% / 0.08)"
            />
            <FeatureCard
              icon={<Trophy className="w-5 h-5 lg:w-6 lg:h-6" style={{ color: 'hsl(28 100% 65%)' }} />}
              title="All Levels · Dok 1 to 4"
              desc="From quick recall to extended thinking — every difficulty, every topic."
              borderColor="hsl(28 100% 55%)"
              iconBg="hsl(28 100% 55% / 0.12)"
              glowColor="hsl(28 100% 55% / 0.08)"
            />
            <FeatureCard
              icon={<Zap className="w-5 h-5 lg:w-6 lg:h-6" style={{ color: 'hsl(175 100% 55%)' }} />}
              title="Track Your Progress"
              desc="Review every answer after each session and watch your score climb."
              borderColor="hsl(175 100% 45%)"
              iconBg="hsl(175 100% 45% / 0.12)"
              glowColor="hsl(175 100% 45% / 0.08)"
            />
          </div>

          {/* ── Mandela Quote ─────────────────────────────────────── */}
          <div className="w-full mt-4 lg:mt-10 rounded-2xl lg:rounded-3xl px-5 lg:px-12 py-5 lg:py-8 relative overflow-hidden text-center z-10"
            style={{
              background: 'linear-gradient(135deg, hsl(263 80% 15% / 0.85), hsl(240 60% 12% / 0.9))',
              border: '2px solid hsl(263 80% 55% / 0.55)',
              boxShadow: '0 0 28px hsl(263 80% 40% / 0.25), inset 0 1px 0 hsl(263 80% 70% / 0.1)',
            }}
          >
            <div className="absolute -top-6 -right-6 w-24 h-24 lg:w-40 lg:h-40 rounded-full pointer-events-none"
              style={{ background: 'hsl(263 90% 60% / 0.18)', filter: 'blur(20px)' }} />
            <div className="absolute -bottom-6 -left-6 w-24 h-24 lg:w-40 lg:h-40 rounded-full pointer-events-none"
              style={{ background: 'hsl(263 90% 50% / 0.12)', filter: 'blur(20px)' }} />
            {/* Decorative quote marks */}
            <div className="hidden lg:block absolute top-4 left-8 font-display text-6xl leading-none pointer-events-none select-none"
              style={{ color: 'hsl(263 80% 55% / 0.25)' }}>"</div>
            <div className="hidden lg:block absolute bottom-2 right-8 font-display text-6xl leading-none pointer-events-none select-none"
              style={{ color: 'hsl(263 80% 55% / 0.25)' }}>"</div>
            <p className="font-display text-lg sm:text-xl lg:text-2xl xl:text-3xl leading-snug relative z-10"
              style={{ color: 'hsl(263 60% 95%)', textShadow: '0 0 18px hsl(263 80% 70% / 0.5)' }}>
              "Education is the most powerful weapon which you can use to change the world."
            </p>
            <p className="mt-3 lg:mt-5 text-sm sm:text-base lg:text-lg font-bold tracking-widest uppercase relative z-10"
              style={{ color: 'hsl(45 100% 70%)', textShadow: '0 0 10px hsl(45 100% 55% / 0.6)' }}>
              — Nelson Mandela
            </p>
          </div>

          {/* ── Footer row: WhatsApp share + credits (horizontal on desktop) ── */}
          <div className="w-full mt-6 lg:mt-10 mb-2 relative z-10">

            {/* Divider */}
            <div className="relative flex items-center justify-center mb-5 lg:mb-6">
              <div className="h-px flex-1 rounded-full" style={{
                background: 'linear-gradient(90deg, transparent, hsl(40 100% 55% / 0.4), hsl(175 100% 50% / 0.4), transparent)',
              }} />
              <div className="mx-4 flex items-center gap-1.5">
                <Star className="w-3 h-3" style={{ color: 'hsl(45 100% 65%)' }} />
                <Star className="w-4 h-4" style={{ color: 'hsl(28 100% 65%)' }} />
                <Star className="w-3 h-3" style={{ color: 'hsl(45 100% 65%)' }} />
              </div>
              <div className="h-px flex-1 rounded-full" style={{
                background: 'linear-gradient(90deg, transparent, hsl(175 100% 50% / 0.4), hsl(40 100% 55% / 0.4), transparent)',
              }} />
            </div>

            {/* Credits card — stacked on mobile, horizontal on desktop */}
            <div
              className="rounded-2xl lg:rounded-3xl px-5 lg:px-10 py-5 lg:py-6 flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 lg:gap-6"
              style={{
                background: 'linear-gradient(135deg, hsl(230 60% 12% / 0.7), hsl(220 50% 10% / 0.85))',
                border: '1px solid hsl(215 50% 30% / 0.35)',
                boxShadow: '0 0 40px hsl(220 60% 15% / 0.5), inset 0 1px 0 hsl(215 80% 70% / 0.07)',
              }}
            >
              {/* Copyright */}
              <div className="flex items-center justify-center lg:justify-start gap-2 shrink-0">
                <Shield className="w-4 h-4 lg:w-5 lg:h-5 shrink-0" style={{ color: 'hsl(175 100% 60%)' }} />
                <p className="text-sm lg:text-base font-semibold" style={{ color: 'hsl(220 20% 65%)' }}>
                  © 2026 Quiz Bunker · All rights reserved
                </p>
              </div>

              {/* Developer credit + buttons row */}
              <div className="flex flex-col sm:flex-row items-center justify-center lg:justify-end gap-3 lg:gap-4">
                {/* Developer pill */}
                <div
                  className="inline-flex items-center gap-3 px-4 lg:px-5 py-2 lg:py-2.5 rounded-xl lg:rounded-2xl shrink-0"
                  style={{
                    background: 'linear-gradient(135deg, hsl(40 100% 55% / 0.12), hsl(28 100% 50% / 0.08))',
                    border: '1px solid hsl(40 100% 55% / 0.25)',
                  }}
                >
                  <div
                    className="w-8 h-8 lg:w-9 lg:h-9 rounded-full flex items-center justify-center text-sm font-display font-bold shrink-0"
                    style={{
                      background: 'linear-gradient(135deg, hsl(40 100% 55%), hsl(28 100% 50%))',
                      color: '#000',
                      boxShadow: '0 0 12px hsl(40 100% 55% / 0.4)',
                    }}
                  >
                    SA
                  </div>
                  <div className="text-left">
                    <p className="text-[10px] lg:text-xs uppercase tracking-widest font-bold"
                      style={{ color: 'hsl(220 20% 55%)' }}>Developed by</p>
                    <p className="text-sm lg:text-base font-bold" style={{ color: 'hsl(45 100% 72%)' }}>
                      Simeon Adjei
                    </p>
                  </div>
                </div>

                {/* Share on WhatsApp */}
                <a
                  href={`https://wa.me/?text=${encodeURIComponent(`🎓 Check out Quiz Bunker — Ghana's top exam practice platform. Crush likely examinable questions! 🚀\n\n${typeof window !== 'undefined' ? window.location.origin : 'https://quizbunker.com'}`)}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 px-5 lg:px-6 py-2.5 lg:py-3 rounded-xl lg:rounded-2xl text-sm lg:text-base font-bold transition-transform hover:scale-105 active:scale-95 shrink-0"
                  style={{
                    background: 'linear-gradient(135deg, #25D366 0%, #128C7E 100%)',
                    color: '#fff',
                    boxShadow: '0 4px 0 #075E54, 0 6px 20px rgba(18,140,126,0.35)',
                  }}
                >
                  <MessageCircle className="w-4 h-4 lg:w-5 lg:h-5" />
                  Share on WhatsApp
                </a>

                {/* Contact Developer */}
                <a
                  href="https://wa.me/233540984944"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2.5 px-5 lg:px-6 py-2.5 lg:py-3 rounded-xl lg:rounded-2xl text-sm lg:text-base font-bold transition-all hover:scale-105 active:scale-95 shrink-0"
                  style={{
                    background: 'linear-gradient(135deg, #25D366 0%, #128C7E 100%)',
                    color: '#fff',
                    boxShadow: '0 4px 0 #075E54, 0 6px 20px rgba(18,140,126,0.3)',
                  }}
                >
                  <MessageCircle className="w-4 h-4 lg:w-5 lg:h-5" />
                  Contact Developer
                </a>
              </div>
            </div>
          </div>

          {/* bottom breathing room */}
          <div className="h-6 lg:h-12" />

        </div>
      </div>
    </Layout>
  );
}


function FeatureCard({ icon, title, desc, borderColor, iconBg, glowColor }: {
  icon: React.ReactNode;
  title: string;
  desc: string;
  borderColor: string;
  iconBg: string;
  glowColor: string;
}) {
  return (
    <div
      className="card-game p-4 lg:p-6 flex items-start gap-3 lg:gap-4 text-left border-l-4 h-full relative overflow-hidden transition-transform hover:scale-[1.02]"
      style={{ borderLeftColor: borderColor }}
    >
      {/* Subtle glow bg */}
      <div className="absolute inset-0 pointer-events-none" style={{
        background: `radial-gradient(ellipse 70% 60% at 10% 30%, ${glowColor}, transparent 70%)`,
      }} />
      <div className="w-11 h-11 lg:w-14 lg:h-14 rounded-xl flex items-center justify-center shrink-0 border border-white/20 relative z-10"
        style={{ background: iconBg }}>
        {icon}
      </div>
      <div className="pt-0.5 min-w-0 relative z-10">
        <h3 className="font-display text-base lg:text-lg mb-1" style={{ color: '#ffffff' }}>{title}</h3>
        <p className="text-sm lg:text-base leading-relaxed" style={{ color: 'hsl(220 30% 82%)' }}>{desc}</p>
      </div>
    </div>
  );
}
