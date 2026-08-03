import { useGetCurrentUser, getGetCurrentUserQueryKey } from '@workspace/api-client-react';
import { MessageCircle } from 'lucide-react';
import { Navbar } from '@/components/Navbar';
import { MusicPlayer } from '@/components/MusicPlayer';

/* ─── Main page ────────────────────────────────────────────────────────── */
export default function Landing() {
  useGetCurrentUser({ query: { queryKey: getGetCurrentUserQueryKey() } });

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
      <div className="fixed inset-0 z-0" style={{ background: 'rgba(5,3,25,0.30)' }} />

      <Navbar />
      <MusicPlayer />

      {/* ── Page content ── */}
      <div className="relative z-10 flex-1 flex flex-col pt-16 lg:pt-24 pb-4 px-3">

        {/*
          MOBILE  : flex-1 spacer pushes everything down so the ticker lands
                    at the red-mark zone (~65-70% down the viewport, just above
                    the Q platform in the background image).
          DESKTOP : absolutely positioned dead-centre of the yellow bulb
                    (~37% down the viewport). Taken out of flow so the flex
                    spacers below still pin the footer.
        */}
        <div className="flex-1 lg:hidden" />

        {/* Mandela ticker — mobile: in flow; desktop: absolute in yellow bulb */}
        <div className="w-full max-w-xl mx-auto mb-3 lg:absolute lg:top-[37%] lg:-translate-y-1/2 lg:left-0 lg:right-0 lg:max-w-none lg:px-8">
          <MandelaTicker />
        </div>

        {/*
          SpinningQ — visible on mobile only, overlaid on the background Q platform.
          Hidden on desktop where the background Q is not the focal point.
        */}
        <div className="flex justify-center mb-3 lg:hidden">
          <SpinningQ />
        </div>

        {/* Desktop: flex fill so Footer stays pinned at the bottom */}
        <div className="hidden lg:block lg:flex-1" />

        {/* Footer — credits */}
        <Footer />
      </div>

      {/* Keyframes */}
      <style>{`
        @keyframes marquee {
          0%   { transform: translateX(100vw); }
          100% { transform: translateX(-100%); }
        }
        .marquee-track {
          animation: marquee 26s linear infinite;
          white-space: nowrap;
          will-change: transform;
        }
        .marquee-track:hover {
          animation-play-state: paused;
        }

        /* Clockwise (left → right) spin for the Q letter */
        @keyframes spin-cw {
          from { transform: rotate(0deg); }
          to   { transform: rotate(360deg); }
        }
        /* Clockwise ring — same direction, slower */
        @keyframes spin-ring-cw {
          from { transform: rotate(0deg); }
          to   { transform: rotate(360deg); }
        }
        /* Counter-clockwise outer ring */
        @keyframes spin-ring-ccw {
          from { transform: rotate(0deg); }
          to   { transform: rotate(-360deg); }
        }
        @keyframes pulse-glow {
          0%, 100% { box-shadow: 0 0 28px 8px rgba(99,102,241,0.55), 0 0 60px 18px rgba(99,102,241,0.22); }
          50%       { box-shadow: 0 0 44px 16px rgba(139,92,246,0.75), 0 0 90px 32px rgba(139,92,246,0.32); }
        }

        .q-spin      { animation: spin-cw       3.5s linear infinite; }
        .q-ring-cw   { animation: spin-ring-cw  5s   linear infinite; }
        .q-ring-ccw  { animation: spin-ring-ccw 7s   linear infinite; }
        .q-glow      { animation: pulse-glow    2.5s ease-in-out infinite; }
      `}</style>
    </div>
  );
}

/* ─── Scrolling Mandela ticker ─────────────────────────────────────────── */
function MandelaTicker() {
  return (
    <>
      {/* ── MOBILE: multi-line card ── */}
      <div
        className="lg:hidden w-full overflow-hidden py-3 rounded-2xl"
        style={{
          background: 'rgba(10,6,30,0.65)',
          border: '1px solid rgba(250,204,21,0.25)',
          backdropFilter: 'blur(14px)',
          WebkitBackdropFilter: 'blur(14px)',
        }}
      >
        {/* Gold opening mark */}
        <div className="text-center mb-0.5">
          <span style={{ fontSize: 32, lineHeight: 1, color: '#facc15', opacity: 0.8, fontFamily: 'Georgia, serif' }}>"</span>
        </div>
        {/* Scrolling quote */}
        <div className="relative overflow-hidden">
          <p
            className="marquee-track inline-block"
            style={{
              fontFamily: 'Georgia, serif',
              fontSize: 'clamp(14px, 1.9vw, 20px)',
              lineHeight: 1.5,
              color: 'rgba(255,255,255,0.95)',
              fontStyle: 'italic',
              textShadow: '0 1px 8px rgba(0,0,0,0.85)',
              paddingLeft: '2rem',
            }}
          >
            Education is the most powerful weapon which you can use to change the world.
          </p>
        </div>
        {/* Attribution */}
        <p
          className="text-center mt-1.5"
          style={{
            fontFamily: "'Fredoka One', cursive",
            fontSize: 'clamp(11px, 1.1vw, 14px)',
            color: '#facc15',
            letterSpacing: '0.08em',
            textShadow: '0 0 12px rgba(250,204,21,0.55)',
          }}
        >
          — Nelson Mandela
        </p>
      </div>

      {/* ── DESKTOP: single horizontal strip — fonts 2× mobile ── */}
      <div
        className="hidden lg:flex items-center gap-3 overflow-hidden rounded-full px-6 py-3"
        style={{
          background: 'rgba(10,6,30,0.70)',
          border: '1px solid rgba(250,204,21,0.30)',
          backdropFilter: 'blur(14px)',
          WebkitBackdropFilter: 'blur(14px)',
          whiteSpace: 'nowrap',
          maxWidth: '900px',
          margin: '0 auto',
        }}
      >
        {/* Opening mark */}
        <span style={{ fontSize: 40, lineHeight: 1, color: '#facc15', opacity: 0.85, fontFamily: 'Georgia, serif', flexShrink: 0 }}>"</span>
        {/* Scrolling quote — takes remaining width */}
        <div className="overflow-hidden flex-1 min-w-0">
          <p
            className="marquee-track inline-block"
            style={{
              fontFamily: 'Georgia, serif',
              fontSize: '30px',
              lineHeight: 1.4,
              color: 'rgba(255,255,255,0.95)',
              fontStyle: 'italic',
              textShadow: '0 1px 6px rgba(0,0,0,0.8)',
            }}
          >
            Education is the most powerful weapon which you can use to change the world.
          </p>
        </div>
        {/* Attribution — inline, right side */}
        <span
          style={{
            fontFamily: "'Fredoka One', cursive",
            fontSize: '26px',
            color: '#facc15',
            letterSpacing: '0.06em',
            textShadow: '0 0 10px rgba(250,204,21,0.5)',
            flexShrink: 0,
          }}
        >
          — Nelson Mandela
        </span>
      </div>
    </>
  );
}

/* ─── Spinning Q — overlaid on top of the background Q platform ────────── */
function SpinningQ() {
  const SIZE = 130;
  return (
    <div
      className="relative flex items-center justify-center"
      style={{ width: SIZE, height: SIZE }}
    >
      {/* Outermost ring — counter-clockwise */}
      <div
        className="q-ring-ccw absolute inset-0 rounded-full"
        style={{
          border: '3px solid transparent',
          borderTopColor: 'rgba(129,140,248,0.85)',
          borderRightColor: 'rgba(167,139,250,0.6)',
          borderBottomColor: 'rgba(99,102,241,0.3)',
          borderLeftColor: 'transparent',
        }}
      />
      {/* Middle ring — clockwise */}
      <div
        className="q-ring-cw absolute rounded-full"
        style={{
          inset: 10,
          border: '3px solid transparent',
          borderTopColor: 'rgba(250,204,21,0.9)',
          borderRightColor: 'rgba(251,146,60,0.6)',
          borderBottomColor: 'rgba(250,204,21,0.3)',
          borderLeftColor: 'transparent',
          borderRadius: '50%',
        }}
      />
      {/* Inner glowing disc */}
      <div
        className="q-glow absolute rounded-full"
        style={{
          inset: 20,
          background: 'radial-gradient(circle at 40% 35%, rgba(139,92,246,0.92), rgba(20,15,60,0.98))',
          border: '2px solid rgba(129,140,248,0.65)',
        }}
      />
      {/* Q letter — spins clockwise (left → right) */}
      <span
        className="q-spin relative z-10 select-none"
        style={{
          fontFamily: "'Fredoka One', cursive",
          fontSize: 54,
          fontWeight: 900,
          color: '#fff',
          textShadow: '0 0 20px rgba(99,102,241,0.95), 0 2px 0 rgba(0,0,0,0.7)',
          lineHeight: 1,
          display: 'block',
        }}
      >
        Q
      </span>
    </div>
  );
}

/* ─── Footer ───────────────────────────────────────────────────────────── */
function Footer() {
  return (
    <div className="flex justify-center">
      <div
        className="rounded-xl px-4 py-3 flex flex-col items-center gap-2 w-full max-w-lg"
        style={{
          background: 'rgba(10,6,30,0.78)',
          border: '1px solid rgba(129,140,248,0.35)',
          backdropFilter: 'blur(14px)',
          WebkitBackdropFilter: 'blur(14px)',
        }}
      >
        {/* Credits */}
        <p
          className="text-sm sm:text-base font-bold text-center leading-snug"
          style={{ color: 'rgba(199,210,254,0.97)', textShadow: '0 1px 4px rgba(0,0,0,0.6)' }}
        >
          © 2026 <span style={{ color: '#facc15' }}>Quiz Bunker</span>
          <span style={{ color: 'rgba(165,180,252,0.45)', margin: '0 6px' }}>·</span>
          Developed by{' '}
          <span style={{ color: '#facc15', fontStyle: 'italic' }}>Simeon Adjei</span>
        </p>

        {/* WhatsApp buttons */}
        <div className="flex flex-row items-center justify-center gap-3 flex-wrap">
          <a
            href={`https://wa.me/?text=${encodeURIComponent(`🎓 Check out Quiz Bunker — Ghana's top exam practice platform! 🚀\n\n${typeof window !== 'undefined' ? window.location.origin : 'https://quizbunker.com'}`)}`}
            target="_blank" rel="noopener noreferrer"
            className="inline-flex items-center gap-2 rounded-lg font-bold transition-transform hover:scale-105 active:scale-95"
            style={{
              background: 'linear-gradient(135deg,#25D366,#128C7E)',
              color: '#fff',
              fontSize: 'clamp(11px,1.2vw,14px)',
              padding: '7px 14px',
              boxShadow: '0 3px 0 #075E54',
            }}
          >
            <MessageCircle style={{ width: 15, height: 15, flexShrink: 0 }} />
            Share on WhatsApp
          </a>
          <a
            href="https://wa.me/233540984944"
            target="_blank" rel="noopener noreferrer"
            className="inline-flex items-center gap-2 rounded-lg font-bold transition-transform hover:scale-105 active:scale-95"
            style={{
              background: 'linear-gradient(135deg,#25D366,#128C7E)',
              color: '#fff',
              fontSize: 'clamp(11px,1.2vw,14px)',
              padding: '7px 14px',
              boxShadow: '0 3px 0 #075E54',
            }}
          >
            <MessageCircle style={{ width: 15, height: 15, flexShrink: 0 }} />
            Contact Developer
          </a>
        </div>
      </div>
    </div>
  );
}
