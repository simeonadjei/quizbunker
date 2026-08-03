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

        {/* Spacer — pushes content down so Mandela sits at the red-mark zone */}
        <div className="flex-1" />

        {/* Mandela ticker — positioned at the red mark area */}
        <div className="w-full max-w-xl mx-auto mb-3">
          <MandelaTicker />
        </div>

        {/* Spinning Q — overlaid on top of the background Q symbol */}
        <div className="flex justify-center mb-4">
          <SpinningQ />
        </div>

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

        @keyframes spin-cw {
          from { transform: rotate(0deg); }
          to   { transform: rotate(360deg); }
        }
        @keyframes spin-ring {
          from { transform: rotate(0deg); }
          to   { transform: rotate(360deg); }
        }
        @keyframes pulse-glow {
          0%, 100% { box-shadow: 0 0 28px 8px rgba(99,102,241,0.6), 0 0 60px 16px rgba(99,102,241,0.25); }
          50%       { box-shadow: 0 0 40px 14px rgba(139,92,246,0.8), 0 0 80px 28px rgba(139,92,246,0.35); }
        }
        .q-spin {
          animation: spin-cw 4s linear infinite;
        }
        .q-ring {
          animation: spin-ring 6s linear infinite reverse;
        }
        .q-glow {
          animation: pulse-glow 2.5s ease-in-out infinite;
        }
      `}</style>
    </div>
  );
}

/* ─── Scrolling Mandela ticker ─────────────────────────────────────────── */
function MandelaTicker() {
  return (
    <div
      className="w-full overflow-hidden py-3 rounded-2xl"
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
  );
}

/* ─── Spinning Q ──────────────────────────────────────────────────────── */
function SpinningQ() {
  return (
    <div className="relative flex items-center justify-center" style={{ width: 88, height: 88 }}>
      {/* Outer spinning ring */}
      <div
        className="q-ring absolute inset-0 rounded-full"
        style={{
          border: '3px solid transparent',
          borderTopColor: '#818cf8',
          borderRightColor: '#a78bfa',
          borderBottomColor: 'transparent',
          borderLeftColor: '#6366f1',
        }}
      />
      {/* Inner glowing disc */}
      <div
        className="q-glow absolute rounded-full"
        style={{
          inset: 8,
          background: 'radial-gradient(circle at 40% 35%, rgba(139,92,246,0.9), rgba(30,27,75,0.98))',
          border: '2px solid rgba(129,140,248,0.6)',
        }}
      />
      {/* Q letter — spins clockwise */}
      <span
        className="q-spin relative z-10 select-none"
        style={{
          fontFamily: "'Fredoka One', cursive",
          fontSize: 42,
          fontWeight: 900,
          color: '#fff',
          textShadow: '0 0 18px rgba(99,102,241,0.9), 0 2px 0 rgba(0,0,0,0.7)',
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
