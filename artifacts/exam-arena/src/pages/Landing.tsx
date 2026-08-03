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
  icon, title, bg, border, glow, iconBg, href,
}: {
  icon: React.ReactNode;
  title: string;
  bg: string;
  border: string;
  glow: string;
  iconBg: string;
  href: string;
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
          fontSize: 'clamp(15px,1.8vw,19px)',
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
      {/* Dark overlay — light so bg text shows clearly */}
      <div className="fixed inset-0 z-0" style={{ background: 'rgba(5,3,25,0.35)' }} />

      <Navbar />
      <MusicPlayer />

      {/* ── Page content ── */}
      <div className="relative z-10 flex-1 flex flex-col pt-16 lg:pt-24 pb-4 px-3 sm:px-4">
        <div className="w-full max-w-5xl mx-auto flex flex-col gap-4 flex-1">

          {/* ══ DESKTOP: 3-column — QUIZ BUNKER bg text shows through center ══ */}
          <div
            className="hidden lg:grid gap-4 flex-1"
            style={{ gridTemplateColumns: '240px 1fr 240px' }}
          >
            {/* Left column */}
            <div className="flex flex-col justify-center gap-4">
              {LEFT_BTNS.map((b) => <FeatureBtn key={b.title} {...b} />)}
            </div>

            {/* Centre — intentionally empty so background QUIZ BUNKER text shows */}
            <div />

            {/* Right column */}
            <div className="flex flex-col justify-center gap-4">
              {RIGHT_BTNS.map((b) => <FeatureBtn key={b.title} {...b} />)}
            </div>
          </div>

          {/* ══ MOBILE / TABLET ════════════════════════════════════ */}
          <div className="lg:hidden flex flex-col gap-4">
            <div className="flex justify-center pt-4">
              <CtaButton user={user} isLoading={isLoading} />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-2">
              {[...LEFT_BTNS, ...RIGHT_BTNS].map((b) => (
                <FeatureBtn key={b.title} {...b} />
              ))}
            </div>
          </div>

          {/* Footer — centered below THINK. PLAY. CONQUER! */}
          <Footer />
        </div>
      </div>
    </div>
  );
}

/* ─── CTA button (Create Account / Continue Playing) ──────────────────── */
function CtaButton({ user, isLoading }: { user: unknown; isLoading: boolean }) {
  if (isLoading) return null;
  if (user) {
    return (
      <Link
        href="/dashboard"
        className="flex items-center justify-center gap-2 rounded-2xl font-display uppercase tracking-wide transition-transform hover:scale-105 active:scale-95 w-full max-w-xs"
        style={{
          background: 'linear-gradient(135deg,#facc15,#f97316)',
          color: '#1c1917',
          boxShadow: '0 6px 0 #92400e, 0 10px 28px rgba(249,115,22,0.5)',
          fontSize: 'clamp(18px,2.2vw,22px)',
          padding: '18px 28px',
        }}
      >
        ▶ Continue Playing
      </Link>
    );
  }
  return (
    <Link
      href="/register"
      className="flex items-center justify-center gap-2 rounded-2xl font-display uppercase tracking-wide transition-transform hover:scale-105 active:scale-95 w-full max-w-xs"
      style={{
        background: 'linear-gradient(135deg,#facc15,#f97316)',
        color: '#1c1917',
        boxShadow: '0 6px 0 #92400e, 0 10px 28px rgba(249,115,22,0.5)',
        fontSize: 'clamp(18px,2.2vw,22px)',
        padding: '18px 28px',
      }}
    >
      🚀 Create Account
    </Link>
  );
}

/* ─── Footer ───────────────────────────────────────────────────────────── */
function Footer() {
  return (
    <div
      className="rounded-2xl px-6 py-6 flex flex-col items-center gap-5"
      style={{
        background: 'rgba(10,6,30,0.78)',
        border: '1.5px solid rgba(129,140,248,0.4)',
        backdropFilter: 'blur(14px)',
        WebkitBackdropFilter: 'blur(14px)',
      }}
    >
      {/* Credits */}
      <p
        className="text-xl sm:text-2xl lg:text-3xl font-bold text-center leading-snug"
        style={{ color: 'rgba(199,210,254,0.97)', textShadow: '0 1px 4px rgba(0,0,0,0.6)' }}
      >
        © 2026 <span style={{ color: '#facc15' }}>Quiz Bunker</span>
        <span style={{ color: 'rgba(165,180,252,0.55)', margin: '0 10px' }}>·</span>
        Developed by{' '}
        <span style={{ color: '#facc15', fontStyle: 'italic' }}>Simeon Adjei</span>
      </p>

      {/* WhatsApp buttons — 3× size, centered */}
      <div className="flex flex-col sm:flex-row items-center justify-center gap-5 flex-wrap">
        <a
          href={`https://wa.me/?text=${encodeURIComponent(`🎓 Check out Quiz Bunker — Ghana's top exam practice platform! 🚀\n\n${typeof window !== 'undefined' ? window.location.origin : 'https://quizbunker.com'}`)}`}
          target="_blank" rel="noopener noreferrer"
          className="inline-flex items-center gap-3 rounded-xl font-bold transition-transform hover:scale-105 active:scale-95"
          style={{
            background: 'linear-gradient(135deg,#25D366,#128C7E)',
            color: '#fff',
            fontSize: 'clamp(20px,2.5vw,28px)',
            padding: '10px 22px',
            boxShadow: '0 4px 0 #075E54, 0 8px 18px rgba(18,140,126,0.45)',
          }}
        >
          <MessageCircle style={{ width: 26, height: 26, flexShrink: 0 }} />
          Share on WhatsApp
        </a>
        <a
          href="https://wa.me/233540984944"
          target="_blank" rel="noopener noreferrer"
          className="inline-flex items-center gap-3 rounded-xl font-bold transition-transform hover:scale-105 active:scale-95"
          style={{
            background: 'linear-gradient(135deg,#25D366,#128C7E)',
            color: '#fff',
            fontSize: 'clamp(20px,2.5vw,28px)',
            padding: '10px 22px',
            boxShadow: '0 4px 0 #075E54, 0 8px 18px rgba(18,140,126,0.45)',
          }}
        >
          <MessageCircle style={{ width: 26, height: 26, flexShrink: 0 }} />
          Contact Developer
        </a>
      </div>
    </div>
  );
}
