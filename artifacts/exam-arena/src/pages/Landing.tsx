import { Link } from 'wouter';
import { useGetCurrentUser, getGetCurrentUserQueryKey } from '@workspace/api-client-react';
import { Target, Brain, BarChart2, Trophy, Zap, Shield, MessageCircle } from 'lucide-react';
import { Navbar } from '@/components/Navbar';
import { MusicPlayer } from '@/components/MusicPlayer';

/* ─── Feature badge data ───────────────────────────────────────────────── */
const LEFT_BADGES = [
  {
    icon: <Target className="w-5 h-5 sm:w-6 sm:h-6" />,
    title: 'Thousands of Likely Questions',
    bg: 'linear-gradient(135deg,#6b21a8,#7e22ce)',
    border: '#a855f7',
    glow: 'rgba(168,85,247,0.45)',
    iconBg: 'rgba(168,85,247,0.25)',
  },
  {
    icon: <Brain className="w-5 h-5 sm:w-6 sm:h-6" />,
    title: 'Practice Smarter',
    bg: 'linear-gradient(135deg,#14532d,#166534)',
    border: '#22c55e',
    glow: 'rgba(34,197,94,0.45)',
    iconBg: 'rgba(34,197,94,0.2)',
  },
  {
    icon: <BarChart2 className="w-5 h-5 sm:w-6 sm:h-6" />,
    title: 'Track Your Progress',
    bg: 'linear-gradient(135deg,#1e3a8a,#1d4ed8)',
    border: '#3b82f6',
    glow: 'rgba(59,130,246,0.45)',
    iconBg: 'rgba(59,130,246,0.2)',
  },
];

const RIGHT_BADGES = [
  {
    icon: <Trophy className="w-5 h-5 sm:w-6 sm:h-6" />,
    title: 'Score High, Be the Best!',
    bg: 'linear-gradient(135deg,#92400e,#b45309)',
    border: '#f59e0b',
    glow: 'rgba(245,158,11,0.45)',
    iconBg: 'rgba(245,158,11,0.2)',
  },
  {
    icon: <Zap className="w-5 h-5 sm:w-6 sm:h-6" />,
    title: 'Fast. Fun. Addictive!',
    bg: 'linear-gradient(135deg,#1e1b4b,#312e81)',
    border: '#818cf8',
    glow: 'rgba(129,140,248,0.45)',
    iconBg: 'rgba(129,140,248,0.2)',
  },
  {
    icon: <Shield className="w-5 h-5 sm:w-6 sm:h-6" />,
    title: 'Prepare Today, Ace Tomorrow!',
    bg: 'linear-gradient(135deg,#4c1d95,#5b21b6)',
    border: '#c084fc',
    glow: 'rgba(192,132,252,0.45)',
    iconBg: 'rgba(192,132,252,0.2)',
  },
];

/* ─── Badge component ──────────────────────────────────────────────────── */
function Badge({
  icon, title, bg, border, glow, iconBg, align,
}: {
  icon: React.ReactNode;
  title: string;
  bg: string;
  border: string;
  glow: string;
  iconBg: string;
  align: 'left' | 'right';
}) {
  return (
    <div
      className="flex items-center gap-2.5 px-3 py-2.5 sm:px-4 sm:py-3 rounded-xl sm:rounded-2xl w-full"
      style={{
        background: bg,
        border: `2px solid ${border}`,
        boxShadow: `0 0 16px ${glow}, 0 4px 12px rgba(0,0,0,0.4)`,
        flexDirection: align === 'right' ? 'row-reverse' : 'row',
      }}
    >
      <div
        className="w-8 h-8 sm:w-10 sm:h-10 rounded-lg sm:rounded-xl flex items-center justify-center shrink-0"
        style={{ background: iconBg, color: border }}
      >
        {icon}
      </div>
      <p
        className="font-display text-sm sm:text-base leading-tight"
        style={{
          color: '#fff',
          textShadow: '0 1px 4px rgba(0,0,0,0.5)',
          textAlign: align === 'right' ? 'right' : 'left',
        }}
      >
        {title}
      </p>
    </div>
  );
}

/* ─── Main page ────────────────────────────────────────────────────────── */
export default function Landing() {
  const { data: user, isLoading } = useGetCurrentUser({ query: { queryKey: getGetCurrentUserQueryKey() } });

  return (
    <div
      className="min-h-[100dvh] w-full flex flex-col relative overflow-x-hidden"
      style={{
        background: 'linear-gradient(180deg, #0ea5e9 0%, #0284c7 15%, #7c3aed 55%, #4c1d95 80%, #2e1065 100%)',
      }}
    >
      {/* Navbar + MusicPlayer rendered directly (both fixed, don't need Layout) */}
      <Navbar />
      <MusicPlayer />

      {/* Atmospheric layers */}
      <div className="pointer-events-none fixed inset-0 z-0" aria-hidden>
        {/* Warm sun burst */}
        <div style={{
          position: 'absolute', top: '8%', left: '50%', transform: 'translateX(-50%)',
          width: '70%', height: '55%',
          background: 'radial-gradient(ellipse 60% 55% at 50% 28%, rgba(255,220,50,0.22) 0%, rgba(251,146,60,0.12) 40%, transparent 70%)',
          filter: 'blur(10px)',
        }} />
        {/* Floor glow */}
        <div style={{
          position: 'absolute', bottom: 0, left: 0, right: 0, height: '30%',
          background: 'linear-gradient(0deg, rgba(250,204,21,0.14) 0%, rgba(168,85,247,0.07) 50%, transparent 100%)',
        }} />
        {/* Left purple */}
        <div style={{
          position: 'absolute', left: '-5%', top: '15%', width: '32%', height: '65%',
          background: 'radial-gradient(ellipse 50% 70% at 0% 50%, rgba(168,85,247,0.22), transparent 70%)',
        }} />
        {/* Right orange */}
        <div style={{
          position: 'absolute', right: '-5%', top: '15%', width: '32%', height: '65%',
          background: 'radial-gradient(ellipse 50% 70% at 100% 50%, rgba(251,146,60,0.16), transparent 70%)',
        }} />
        {/* Sparkle dots */}
        {([
          { top: '8%',  left: '11%', size: 10, color: '#facc15' },
          { top: '5%',  left: '29%', size: 8,  color: '#a855f7' },
          { top: '10%', left: '66%', size: 12, color: '#38bdf8' },
          { top: '6%',  left: '83%', size: 9,  color: '#f97316' },
          { top: '19%', left: '5%',  size: 7,  color: '#4ade80' },
          { top: '14%', left: '93%', size: 8,  color: '#fb7185' },
        ] as const).map((s, i) => (
          <div key={i} style={{
            position: 'absolute', top: s.top, left: s.left,
            width: s.size, height: s.size, borderRadius: '50%',
            background: s.color,
            boxShadow: `0 0 ${s.size * 2}px ${s.color}`,
            animation: `starPulse ${1.2 + i * 0.3}s ease-in-out infinite alternate`,
          }} />
        ))}
      </div>

      {/* ── Scrollable page content ──────────────────────────────── */}
      {/* pt-14 lg:pt-24 = clear the fixed Navbar; pb-24 = clear the fixed MusicPlayer */}
      <div className="relative z-10 flex-1 flex flex-col pt-14 lg:pt-24 pb-24 px-3 sm:px-5">
        <div className="w-full max-w-6xl mx-auto flex flex-col flex-1 gap-5 py-4 sm:py-6">

          {/* ══ DESKTOP: 3-column layout ════════════════════════ */}
          <div className="hidden lg:grid lg:grid-cols-[300px_1fr_300px] xl:grid-cols-[330px_1fr_330px] gap-6 items-center flex-1">
            <div className="flex flex-col gap-4">
              {LEFT_BADGES.map((b) => <Badge key={b.title} {...b} align="left" />)}
            </div>
            <CentreHero user={user} isLoading={isLoading} />
            <div className="flex flex-col gap-4">
              {RIGHT_BADGES.map((b) => <Badge key={b.title} {...b} align="right" />)}
            </div>
          </div>

          {/* ══ MOBILE / TABLET ════════════════════════════════ */}
          <div className="lg:hidden flex flex-col gap-5">
            <CentreHero user={user} isLoading={isLoading} />
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {[...LEFT_BADGES, ...RIGHT_BADGES].map((b) => (
                <Badge key={b.title} {...b} align="left" />
              ))}
            </div>
          </div>

          <Footer />
        </div>
      </div>
    </div>
  );
}

/* ─── Centre hero ──────────────────────────────────────────────────────── */
function CentreHero({ user, isLoading }: { user: unknown; isLoading: boolean }) {
  return (
    <div className="flex flex-col items-center text-center gap-4 sm:gap-5">
      {/* Title lockup */}
      <div className="relative flex flex-col items-center select-none">
        {/* Glow halo */}
        <div className="absolute pointer-events-none" style={{
          inset: '-30%',
          background: 'radial-gradient(ellipse 70% 55% at 50% 50%, rgba(250,204,21,0.2) 0%, rgba(168,85,247,0.12) 50%, transparent 75%)',
          filter: 'blur(16px)',
        }} />

        {/* Hexagon emblem */}
        <div
          className="relative z-10 flex items-center justify-center mb-1"
          style={{
            width: 'clamp(70px,13vw,108px)',
            height: 'clamp(70px,13vw,108px)',
            background: 'linear-gradient(135deg,#1e1b4b,#312e81)',
            clipPath: 'polygon(50% 0%,93% 25%,93% 75%,50% 100%,7% 75%,7% 25%)',
            boxShadow: '0 0 28px rgba(129,140,248,0.5), 0 0 56px rgba(129,140,248,0.22)',
          }}
        >
          <div style={{
            position: 'absolute', inset: '9%',
            clipPath: 'polygon(50% 0%,93% 25%,93% 75%,50% 100%,7% 75%,7% 25%)',
            background: 'linear-gradient(135deg,rgba(250,204,21,0.18),rgba(168,85,247,0.12))',
          }} />
          <span style={{ fontSize: 'clamp(24px,5.5vw,38px)', filter: 'drop-shadow(0 0 10px #facc15)', position: 'relative', zIndex: 1 }}>💡</span>
        </div>

        {/* QUIZ */}
        <h1 className="relative z-10" style={{
          fontFamily: "'Fredoka One', cursive",
          fontSize: 'clamp(58px,11vw,98px)',
          lineHeight: 1,
          color: '#facc15',
          textShadow: '0 0 22px rgba(250,204,21,0.75), 0 4px 0 rgba(0,0,0,0.55), 2px 2px 0 #92400e',
          letterSpacing: '0.04em',
          WebkitTextStroke: '1px rgba(0,0,0,0.22)',
          margin: 0,
        }}>
          QUIZ
        </h1>

        {/* BUNKER */}
        <h1 className="relative z-10" style={{
          fontFamily: "'Fredoka One', cursive",
          fontSize: 'clamp(62px,13vw,112px)',
          lineHeight: 0.92,
          marginTop: '-0.03em',
          color: '#ffffff',
          textShadow: '0 0 26px rgba(129,140,248,0.65), 0 5px 0 rgba(0,0,0,0.6), 2px 2px 0 #1e1b4b',
          letterSpacing: '0.02em',
          WebkitTextStroke: '1.5px rgba(99,102,241,0.4)',
          marginBottom: 0,
        }}>
          BUNKER
        </h1>

        {/* Tagline */}
        <div
          className="relative z-10 mt-2.5 px-5 py-1.5 rounded-full font-display text-sm sm:text-base tracking-widest uppercase"
          style={{
            background: 'linear-gradient(90deg,#ec4899,#8b5cf6,#06b6d4)',
            color: '#fff',
            boxShadow: '0 0 18px rgba(236,72,153,0.5), 0 3px 0 rgba(0,0,0,0.4)',
            textShadow: '0 1px 3px rgba(0,0,0,0.4)',
          }}
        >
          Think. Play. Conquer!
        </div>

        <div className="relative z-10 mt-1.5 text-xl" style={{ color: '#facc15', filter: 'drop-shadow(0 0 5px #facc15)' }}>★</div>
      </div>

      {/* Subtitle */}
      <p
        className="font-bold text-sm sm:text-base lg:text-lg max-w-xs sm:max-w-sm lg:max-w-md leading-relaxed"
        style={{ color: 'rgba(255,255,255,0.92)', textShadow: '0 1px 5px rgba(0,0,0,0.5)' }}
      >
        Ghana's top exam practice platform.{' '}
        <span style={{ color: '#fde68a' }}>Crush likely examinable questions.</span>
      </p>

      {/* CTA buttons */}
      <div className="flex flex-col sm:flex-row gap-3 w-full max-w-sm sm:max-w-md">
        {isLoading ? null : user ? (
          <Link
            href="/dashboard"
            className="w-full flex items-center justify-center gap-2 py-3.5 sm:py-4 rounded-2xl font-display text-lg sm:text-xl uppercase tracking-wide transition-transform hover:scale-105 active:scale-95"
            style={{
              background: 'linear-gradient(135deg,#facc15,#f97316)',
              color: '#1c1917',
              boxShadow: '0 6px 0 #92400e, 0 8px 24px rgba(249,115,22,0.45)',
            }}
          >
            ▶ Continue Playing
          </Link>
        ) : (
          <>
            <Link
              href="/register"
              className="flex-1 flex items-center justify-center gap-2 py-3.5 sm:py-4 rounded-2xl font-display text-base sm:text-lg uppercase tracking-wide transition-transform hover:scale-105 active:scale-95"
              style={{
                background: 'linear-gradient(135deg,#facc15,#f97316)',
                color: '#1c1917',
                boxShadow: '0 5px 0 #92400e, 0 8px 20px rgba(249,115,22,0.4)',
              }}
            >
              🚀 Create Free Account
            </Link>
            <Link
              href="/login"
              className="flex-1 flex items-center justify-center gap-2 py-3 sm:py-3.5 rounded-2xl font-display text-base sm:text-lg uppercase tracking-wide transition-transform hover:scale-105 active:scale-95"
              style={{
                background: 'linear-gradient(135deg,#1e1b4b,#312e81)',
                color: '#c7d2fe',
                border: '2px solid #6366f1',
                boxShadow: '0 5px 0 rgba(30,27,75,0.8), 0 8px 20px rgba(99,102,241,0.35)',
              }}
            >
              🎮 Log In
            </Link>
          </>
        )}
      </div>
    </div>
  );
}

/* ─── Footer ───────────────────────────────────────────────────────────── */
function Footer() {
  return (
    <div
      className="rounded-2xl px-5 py-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3"
      style={{
        background: 'rgba(15,10,40,0.55)',
        border: '1px solid rgba(129,140,248,0.3)',
        backdropFilter: 'blur(10px)',
      }}
    >
      <p className="text-sm font-semibold text-center sm:text-left" style={{ color: 'rgba(165,180,252,0.9)' }}>
        © 2026 Quiz Bunker · Developed by{' '}
        <span style={{ color: '#facc15' }}>Simeon Adjei</span>
      </p>
      <div className="flex items-center justify-center sm:justify-end gap-2.5 flex-wrap">
        <a
          href={`https://wa.me/?text=${encodeURIComponent(`🎓 Check out Quiz Bunker — Ghana's top exam practice platform! 🚀\n\n${typeof window !== 'undefined' ? window.location.origin : 'https://quizbunker.com'}`)}`}
          target="_blank" rel="noopener noreferrer"
          className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-bold transition-transform hover:scale-105 active:scale-95"
          style={{ background: 'linear-gradient(135deg,#25D366,#128C7E)', color: '#fff', boxShadow: '0 3px 0 #075E54' }}
        >
          <MessageCircle className="w-4 h-4" /> Share
        </a>
        <a
          href="https://wa.me/233540984944"
          target="_blank" rel="noopener noreferrer"
          className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-bold transition-transform hover:scale-105 active:scale-95"
          style={{ background: 'linear-gradient(135deg,#25D366,#128C7E)', color: '#fff', boxShadow: '0 3px 0 #075E54' }}
        >
          <MessageCircle className="w-4 h-4" /> Contact Dev
        </a>
      </div>
    </div>
  );
}
