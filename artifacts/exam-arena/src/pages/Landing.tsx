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
    bg: 'linear-gradient(135deg,rgba(107,33,168,0.88),rgba(126,34,206,0.88))',
    border: '#a855f7',
    glow: 'rgba(168,85,247,0.55)',
    iconBg: 'rgba(168,85,247,0.3)',
  },
  {
    icon: <Brain className="w-5 h-5 sm:w-6 sm:h-6" />,
    title: 'Practice Smarter',
    bg: 'linear-gradient(135deg,rgba(20,83,45,0.88),rgba(22,101,52,0.88))',
    border: '#22c55e',
    glow: 'rgba(34,197,94,0.55)',
    iconBg: 'rgba(34,197,94,0.25)',
  },
  {
    icon: <BarChart2 className="w-5 h-5 sm:w-6 sm:h-6" />,
    title: 'Track Your Progress',
    bg: 'linear-gradient(135deg,rgba(30,58,138,0.88),rgba(29,78,216,0.88))',
    border: '#3b82f6',
    glow: 'rgba(59,130,246,0.55)',
    iconBg: 'rgba(59,130,246,0.25)',
  },
];

const RIGHT_BADGES = [
  {
    icon: <Trophy className="w-5 h-5 sm:w-6 sm:h-6" />,
    title: 'Score High, Be the Best!',
    bg: 'linear-gradient(135deg,rgba(146,64,14,0.88),rgba(180,83,9,0.88))',
    border: '#f59e0b',
    glow: 'rgba(245,158,11,0.55)',
    iconBg: 'rgba(245,158,11,0.25)',
  },
  {
    icon: <Zap className="w-5 h-5 sm:w-6 sm:h-6" />,
    title: 'Fast. Fun. Addictive!',
    bg: 'linear-gradient(135deg,rgba(30,27,75,0.88),rgba(49,46,129,0.88))',
    border: '#818cf8',
    glow: 'rgba(129,140,248,0.55)',
    iconBg: 'rgba(129,140,248,0.25)',
  },
  {
    icon: <Shield className="w-5 h-5 sm:w-6 sm:h-6" />,
    title: 'Prepare Today, Ace Tomorrow!',
    bg: 'linear-gradient(135deg,rgba(76,29,149,0.88),rgba(91,33,182,0.88))',
    border: '#c084fc',
    glow: 'rgba(192,132,252,0.55)',
    iconBg: 'rgba(192,132,252,0.25)',
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
      className="flex items-center gap-2.5 px-3 py-3 sm:px-4 sm:py-3.5 rounded-xl sm:rounded-2xl w-full cursor-default"
      style={{
        background: bg,
        border: `2px solid ${border}`,
        boxShadow: `0 0 18px ${glow}, 0 4px 14px rgba(0,0,0,0.5)`,
        backdropFilter: 'blur(8px)',
        flexDirection: align === 'right' ? 'row-reverse' : 'row',
        WebkitBackdropFilter: 'blur(8px)',
      }}
    >
      <div
        className="w-9 h-9 sm:w-11 sm:h-11 rounded-lg sm:rounded-xl flex items-center justify-center shrink-0"
        style={{ background: iconBg, color: border }}
      >
        {icon}
      </div>
      <p
        className="font-display text-sm sm:text-base leading-tight"
        style={{
          color: '#fff',
          textShadow: '0 1px 5px rgba(0,0,0,0.7)',
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
    <div className="min-h-[100dvh] w-full flex flex-col relative overflow-x-hidden">
      {/* ── Full-screen hero background image ── */}
      <div
        className="fixed inset-0 z-0"
        style={{
          backgroundImage: `url(${import.meta.env.BASE_URL}hero-bg.png)`,
          backgroundSize: 'cover',
          backgroundPosition: 'center top',
          backgroundRepeat: 'no-repeat',
        }}
      />
      {/* Dark overlay for readability */}
      <div
        className="fixed inset-0 z-0"
        style={{ background: 'rgba(5,3,25,0.45)' }}
      />

      {/* Navbar + MusicPlayer */}
      <Navbar />
      <MusicPlayer />

      {/* ── Scrollable page content ── */}
      <div className="relative z-10 flex-1 flex flex-col pt-14 lg:pt-20 pb-28 px-3 sm:px-5">
        <div className="w-full max-w-6xl mx-auto flex flex-col flex-1 gap-4 py-4 sm:py-5">

          {/* ══ DESKTOP: 3-column layout ════════════════════════ */}
          <div className="hidden lg:grid lg:grid-cols-[280px_1fr_280px] xl:grid-cols-[310px_1fr_310px] gap-5 items-center flex-1">
            <div className="flex flex-col gap-4 self-center">
              {LEFT_BADGES.map((b) => <Badge key={b.title} {...b} align="left" />)}
            </div>
            <CentreHero user={user} isLoading={isLoading} />
            <div className="flex flex-col gap-4 self-center">
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

      {/* ── Keyframes ── */}
      <style>{`
        @keyframes marqueeRTL {
          0%   { transform: translateX(60%); }
          100% { transform: translateX(-110%); }
        }
        @keyframes starPulse {
          0%   { opacity: 0.6; transform: scale(0.9); }
          100% { opacity: 1;   transform: scale(1.2); }
        }
        @keyframes heroPulse {
          0%, 100% { opacity: 0.85; }
          50%       { opacity: 1; }
        }
      `}</style>
    </div>
  );
}

/* ─── Centre hero ──────────────────────────────────────────────────────── */
function CentreHero({ user, isLoading }: { user: unknown; isLoading: boolean }) {
  return (
    <div className="flex flex-col items-center text-center gap-5 sm:gap-6">

      {/* Hexagon emblem */}
      <div
        className="relative flex items-center justify-center"
        style={{
          width: 'clamp(64px,11vw,96px)',
          height: 'clamp(64px,11vw,96px)',
          background: 'linear-gradient(135deg,#1e1b4b,#312e81)',
          clipPath: 'polygon(50% 0%,93% 25%,93% 75%,50% 100%,7% 75%,7% 25%)',
          boxShadow: '0 0 32px rgba(129,140,248,0.6), 0 0 64px rgba(129,140,248,0.25)',
          animation: 'heroPulse 2.8s ease-in-out infinite',
        }}
      >
        <div style={{
          position: 'absolute', inset: '9%',
          clipPath: 'polygon(50% 0%,93% 25%,93% 75%,50% 100%,7% 75%,7% 25%)',
          background: 'linear-gradient(135deg,rgba(250,204,21,0.2),rgba(168,85,247,0.15))',
        }} />
        <span style={{ fontSize: 'clamp(22px,4.5vw,34px)', filter: 'drop-shadow(0 0 12px #facc15)', position: 'relative', zIndex: 1 }}>💡</span>
      </div>

      {/* ── Rotating QUIZ BUNKER marquee ── */}
      <div
        className="w-full overflow-hidden"
        style={{
          background: 'rgba(0,0,0,0.25)',
          backdropFilter: 'blur(4px)',
          borderRadius: '12px',
          padding: '4px 0',
        }}
      >
        <div
          style={{
            display: 'inline-block',
            whiteSpace: 'nowrap',
            animation: 'marqueeRTL 5s linear infinite',
          }}
        >
          {/* Repeated for seamless loop feel */}
          {['QUIZ BUNKER', 'QUIZ BUNKER', 'QUIZ BUNKER'].map((text, idx) => (
            <span
              key={idx}
              style={{
                fontFamily: "'Fredoka One', cursive",
                fontSize: 'clamp(52px,10vw,94px)',
                lineHeight: 1.05,
                letterSpacing: '0.03em',
                marginRight: 'clamp(32px,6vw,64px)',
                background: idx % 2 === 0
                  ? 'linear-gradient(180deg,#facc15 0%,#f97316 50%,#ffffff 100%)'
                  : 'linear-gradient(180deg,#ffffff 0%,#818cf8 50%,#facc15 100%)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                backgroundClip: 'text',
                filter: 'drop-shadow(0 0 14px rgba(250,204,21,0.7))',
              }}
            >
              {text}
            </span>
          ))}
        </div>
      </div>

      {/* Tagline */}
      <div
        className="px-5 py-2 rounded-full font-display text-sm sm:text-base tracking-widest uppercase"
        style={{
          background: 'linear-gradient(90deg,#ec4899,#8b5cf6,#06b6d4)',
          color: '#fff',
          boxShadow: '0 0 20px rgba(236,72,153,0.55), 0 3px 0 rgba(0,0,0,0.45)',
          textShadow: '0 1px 3px rgba(0,0,0,0.4)',
        }}
      >
        Think. Play. Conquer!
      </div>

      <div style={{ color: '#facc15', fontSize: 22, filter: 'drop-shadow(0 0 6px #facc15)', lineHeight: 1 }}>★</div>

      {/* Subtitle */}
      <p
        className="font-bold text-sm sm:text-base lg:text-lg max-w-xs sm:max-w-sm lg:max-w-md leading-relaxed"
        style={{
          color: 'rgba(255,255,255,0.95)',
          textShadow: '0 1px 6px rgba(0,0,0,0.7)',
        }}
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
              boxShadow: '0 6px 0 #92400e, 0 8px 28px rgba(249,115,22,0.5)',
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
                boxShadow: '0 5px 0 #92400e, 0 8px 24px rgba(249,115,22,0.45)',
              }}
            >
              🚀 Create Free Account
            </Link>
            <Link
              href="/login"
              className="flex-1 flex items-center justify-center gap-2 py-3 sm:py-3.5 rounded-2xl font-display text-base sm:text-lg uppercase tracking-wide transition-transform hover:scale-105 active:scale-95"
              style={{
                background: 'linear-gradient(135deg,rgba(30,27,75,0.92),rgba(49,46,129,0.92))',
                color: '#c7d2fe',
                border: '2px solid #6366f1',
                boxShadow: '0 5px 0 rgba(30,27,75,0.85), 0 8px 24px rgba(99,102,241,0.4)',
                backdropFilter: 'blur(6px)',
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
      className="rounded-2xl px-6 py-5 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4"
      style={{
        background: 'rgba(10,6,30,0.72)',
        border: '1.5px solid rgba(129,140,248,0.4)',
        backdropFilter: 'blur(14px)',
        WebkitBackdropFilter: 'blur(14px)',
      }}
    >
      <p
        className="text-base sm:text-lg font-bold text-center sm:text-left leading-snug"
        style={{ color: 'rgba(199,210,254,0.95)', textShadow: '0 1px 4px rgba(0,0,0,0.6)' }}
      >
        © 2026 <span style={{ color: '#facc15' }}>Quiz Bunker</span>
        <span style={{ color: 'rgba(165,180,252,0.6)', margin: '0 6px' }}>·</span>
        Developed by{' '}
        <span style={{ color: '#facc15', fontStyle: 'italic' }}>Simeon Adjei</span>
      </p>
      <div className="flex items-center justify-center sm:justify-end gap-3 flex-wrap">
        <a
          href={`https://wa.me/?text=${encodeURIComponent(`🎓 Check out Quiz Bunker — Ghana's top exam practice platform! 🚀\n\n${typeof window !== 'undefined' ? window.location.origin : 'https://quizbunker.com'}`)}`}
          target="_blank" rel="noopener noreferrer"
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm sm:text-base font-bold transition-transform hover:scale-105 active:scale-95"
          style={{ background: 'linear-gradient(135deg,#25D366,#128C7E)', color: '#fff', boxShadow: '0 3px 0 #075E54' }}
        >
          <MessageCircle className="w-4 h-4 sm:w-5 sm:h-5" /> Share
        </a>
        <a
          href="https://wa.me/233540984944"
          target="_blank" rel="noopener noreferrer"
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm sm:text-base font-bold transition-transform hover:scale-105 active:scale-95"
          style={{ background: 'linear-gradient(135deg,#25D366,#128C7E)', color: '#fff', boxShadow: '0 3px 0 #075E54' }}
        >
          <MessageCircle className="w-4 h-4 sm:w-5 sm:h-5" /> Contact Dev
        </a>
      </div>
    </div>
  );
}
