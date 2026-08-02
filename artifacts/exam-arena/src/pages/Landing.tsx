import { Link } from 'wouter';
import { useGetCurrentUser, getGetCurrentUserQueryKey } from '@workspace/api-client-react';
import { Target, Brain, BarChart2, Trophy, Zap, Shield, MessageCircle } from 'lucide-react';
import { Navbar } from '@/components/Navbar';
import { MusicPlayer } from '@/components/MusicPlayer';

/* ─── Feature button data ──────────────────────────────────────────────── */
const LEFT_BTNS = [
  {
    icon: <Target className="w-7 h-7 sm:w-8 sm:h-8 shrink-0" />,
    title: 'Thousands of Likely Questions',
    bg: 'linear-gradient(135deg,rgba(107,33,168,0.92),rgba(126,34,206,0.92))',
    border: '#a855f7',
    glow: 'rgba(168,85,247,0.6)',
    iconBg: 'rgba(168,85,247,0.3)',
    href: '/register',
  },
  {
    icon: <Brain className="w-7 h-7 sm:w-8 sm:h-8 shrink-0" />,
    title: 'Practice Smarter',
    bg: 'linear-gradient(135deg,rgba(20,83,45,0.92),rgba(22,101,52,0.92))',
    border: '#22c55e',
    glow: 'rgba(34,197,94,0.6)',
    iconBg: 'rgba(34,197,94,0.25)',
    href: '/register',
  },
  {
    icon: <BarChart2 className="w-7 h-7 sm:w-8 sm:h-8 shrink-0" />,
    title: 'Track Your Progress',
    bg: 'linear-gradient(135deg,rgba(30,58,138,0.92),rgba(29,78,216,0.92))',
    border: '#3b82f6',
    glow: 'rgba(59,130,246,0.6)',
    iconBg: 'rgba(59,130,246,0.25)',
    href: '/register',
  },
];

const RIGHT_BTNS = [
  {
    icon: <Trophy className="w-7 h-7 sm:w-8 sm:h-8 shrink-0" />,
    title: 'Score High, Be the Best!',
    bg: 'linear-gradient(135deg,rgba(146,64,14,0.92),rgba(180,83,9,0.92))',
    border: '#f59e0b',
    glow: 'rgba(245,158,11,0.6)',
    iconBg: 'rgba(245,158,11,0.25)',
    href: '/register',
  },
  {
    icon: <Zap className="w-7 h-7 sm:w-8 sm:h-8 shrink-0" />,
    title: 'Fast. Fun. Addictive!',
    bg: 'linear-gradient(135deg,rgba(30,27,75,0.92),rgba(49,46,129,0.92))',
    border: '#818cf8',
    glow: 'rgba(129,140,248,0.6)',
    iconBg: 'rgba(129,140,248,0.25)',
    href: '/register',
  },
  {
    icon: <Shield className="w-7 h-7 sm:w-8 sm:h-8 shrink-0" />,
    title: 'Prepare Today, Ace Tomorrow!',
    bg: 'linear-gradient(135deg,rgba(76,29,149,0.92),rgba(91,33,182,0.92))',
    border: '#c084fc',
    glow: 'rgba(192,132,252,0.6)',
    iconBg: 'rgba(192,132,252,0.25)',
    href: '/register',
  },
];

/* ─── Feature Button component ─────────────────────────────────────────── */
function FeatureBtn({
  icon, title, bg, border, glow, iconBg, href, align,
}: {
  icon: React.ReactNode;
  title: string;
  bg: string;
  border: string;
  glow: string;
  iconBg: string;
  href: string;
  align: 'left' | 'right';
}) {
  return (
    <Link
      href={href}
      className="flex items-center justify-center gap-3 sm:gap-4 w-full transition-transform hover:scale-[1.03] active:scale-[0.97]"
      style={{
        background: bg,
        border: `2.5px solid ${border}`,
        boxShadow: `0 0 20px ${glow}, 0 6px 16px rgba(0,0,0,0.55)`,
        backdropFilter: 'blur(10px)',
        WebkitBackdropFilter: 'blur(10px)',
        borderRadius: '16px',
        padding: '18px 20px',
        flexDirection: 'row',
        textDecoration: 'none',
        cursor: 'pointer',
      }}
    >
      <div
        className="w-12 h-12 sm:w-14 sm:h-14 rounded-xl flex items-center justify-center shrink-0"
        style={{ background: iconBg, color: border }}
      >
        {icon}
      </div>
      <p
        style={{
          fontFamily: "'Fredoka One', cursive",
          fontSize: 'clamp(16px,2vw,20px)',
          lineHeight: 1.25,
          color: '#fff',
          textShadow: '0 2px 6px rgba(0,0,0,0.7)',
          textAlign: 'center',
          margin: 0,
        }}
      >
        {title}
      </p>
    </Link>
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
      {/* Dark overlay */}
      <div className="fixed inset-0 z-0" style={{ background: 'rgba(5,3,25,0.48)' }} />

      <Navbar />
      <MusicPlayer />

      {/* ── Page content ── */}
      <div className="relative z-10 flex-1 flex flex-col pt-14 lg:pt-20 pb-6 px-3 sm:px-5">
        <div className="w-full max-w-6xl mx-auto flex flex-col gap-6 py-4 sm:py-6">

          {/* ══ DESKTOP: 3-column ══════════════════════════════ */}
          <div className="hidden lg:grid lg:grid-cols-[260px_1fr_260px] xl:grid-cols-[280px_1fr_280px] gap-5 items-center mx-auto w-full max-w-4xl">
            <div className="flex flex-col gap-5 w-full">
              {LEFT_BTNS.map((b) => <FeatureBtn key={b.title} {...b} align="left" />)}
            </div>
            <CentreHero user={user} isLoading={isLoading} />
            <div className="flex flex-col gap-5 w-full">
              {RIGHT_BTNS.map((b) => <FeatureBtn key={b.title} {...b} align="right" />)}
            </div>
          </div>

          {/* ══ MOBILE / TABLET ════════════════════════════════ */}
          <div className="lg:hidden flex flex-col gap-5">
            <CentreHero user={user} isLoading={isLoading} />
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {[...LEFT_BTNS, ...RIGHT_BTNS].map((b) => (
                <FeatureBtn key={b.title} {...b} align="left" />
              ))}
            </div>
          </div>

          <Footer />
        </div>
      </div>

      <style>{`
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
    <div className="flex flex-col items-center text-center gap-4 sm:gap-5">

      {/* Hexagon emblem */}
      <div
        className="relative flex items-center justify-center"
        style={{
          width: 'clamp(68px,11vw,100px)',
          height: 'clamp(68px,11vw,100px)',
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
        <span style={{ fontSize: 'clamp(24px,5vw,36px)', filter: 'drop-shadow(0 0 12px #facc15)', position: 'relative', zIndex: 1 }}>💡</span>
      </div>

      {/* Subtitle */}
      <p
        className="font-bold text-base sm:text-lg lg:text-xl max-w-xs sm:max-w-sm leading-relaxed"
        style={{ color: 'rgba(255,255,255,0.96)', textShadow: '0 1px 7px rgba(0,0,0,0.75)' }}
      >
        Ghana's top exam practice platform.{' '}
        <span style={{ color: '#fde68a' }}>Crush likely examinable questions.</span>
      </p>

      {/* CTA buttons — big */}
      <div className="flex flex-col sm:flex-row gap-3 w-full max-w-xs sm:max-w-sm">
        {isLoading ? null : user ? (
          <Link
            href="/dashboard"
            className="w-full flex items-center justify-center gap-2 rounded-2xl font-display uppercase tracking-wide transition-transform hover:scale-105 active:scale-95"
            style={{
              background: 'linear-gradient(135deg,#facc15,#f97316)',
              color: '#1c1917',
              boxShadow: '0 6px 0 #92400e, 0 10px 28px rgba(249,115,22,0.5)',
              fontSize: 'clamp(18px,2.2vw,22px)',
              padding: '16px 24px',
            }}
          >
            ▶ Continue Playing
          </Link>
        ) : (
          <>
            <Link
              href="/register"
              className="flex-1 flex items-center justify-center gap-2 rounded-2xl font-display uppercase tracking-wide transition-transform hover:scale-105 active:scale-95"
              style={{
                background: 'linear-gradient(135deg,#facc15,#f97316)',
                color: '#1c1917',
                boxShadow: '0 6px 0 #92400e, 0 10px 26px rgba(249,115,22,0.5)',
                fontSize: 'clamp(17px,2vw,21px)',
                padding: '16px 20px',
              }}
            >
              🚀 Create Account
            </Link>
            <Link
              href="/login"
              className="flex-1 flex items-center justify-center gap-2 rounded-2xl font-display uppercase tracking-wide transition-transform hover:scale-105 active:scale-95"
              style={{
                background: 'linear-gradient(135deg,#facc15,#f97316)',
                color: '#1c1917',
                boxShadow: '0 6px 0 #92400e, 0 10px 26px rgba(249,115,22,0.5)',
                fontSize: 'clamp(17px,2vw,21px)',
                padding: '16px 20px',
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
        background: 'rgba(10,6,30,0.75)',
        border: '1.5px solid rgba(129,140,248,0.4)',
        backdropFilter: 'blur(14px)',
        WebkitBackdropFilter: 'blur(14px)',
      }}
    >
      <p
        className="text-xl sm:text-2xl lg:text-3xl font-bold text-center sm:text-left leading-snug"
        style={{ color: 'rgba(199,210,254,0.97)', textShadow: '0 1px 4px rgba(0,0,0,0.6)' }}
      >
        © 2026 <span style={{ color: '#facc15' }}>Quiz Bunker</span>
        <span style={{ color: 'rgba(165,180,252,0.55)', margin: '0 8px' }}>·</span>
        Developed by{' '}
        <span style={{ color: '#facc15', fontStyle: 'italic' }}>Simeon Adjei</span>
      </p>
      <div className="flex items-center justify-center sm:justify-end gap-3 flex-wrap">
        <a
          href={`https://wa.me/?text=${encodeURIComponent(`🎓 Check out Quiz Bunker — Ghana's top exam practice platform! 🚀\n\n${typeof window !== 'undefined' ? window.location.origin : 'https://quizbunker.com'}`)}`}
          target="_blank" rel="noopener noreferrer"
          className="inline-flex items-center gap-2 px-5 py-3 rounded-xl font-bold transition-transform hover:scale-105 active:scale-95"
          style={{ background: 'linear-gradient(135deg,#25D366,#128C7E)', color: '#fff', fontSize: '15px', boxShadow: '0 3px 0 #075E54' }}
        >
          <MessageCircle className="w-5 h-5" /> Share
        </a>
        <a
          href="https://wa.me/233540984944"
          target="_blank" rel="noopener noreferrer"
          className="inline-flex items-center gap-2 px-5 py-3 rounded-xl font-bold transition-transform hover:scale-105 active:scale-95"
          style={{ background: 'linear-gradient(135deg,#25D366,#128C7E)', color: '#fff', fontSize: '15px', boxShadow: '0 3px 0 #075E54' }}
        >
          <MessageCircle className="w-5 h-5" /> Contact Dev
        </a>
      </div>
    </div>
  );
}
