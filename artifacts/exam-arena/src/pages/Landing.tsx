import { Link } from 'wouter';
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
      <div className="fixed inset-0 z-0" style={{ background: 'rgba(5,3,25,0.35)' }} />

      <Navbar />
      <MusicPlayer />

      {/* ── Page content ── */}
      <div className="relative z-10 flex-1 flex flex-col pt-16 lg:pt-24 pb-4">
        {/* Centre area — Mandela quote scrolls in the middle of the BUNKER bg text */}
        <div className="flex-1 flex flex-col items-center justify-center gap-6 px-3">
          <MandelaTicker />
        </div>

        {/* Footer — credits centered below the BUNKER writing */}
        <Footer />
      </div>

      {/* Marquee keyframe */}
      <style>{`
        @keyframes marquee {
          0%   { transform: translateX(100vw); }
          100% { transform: translateX(-100%); }
        }
        .marquee-track {
          animation: marquee 28s linear infinite;
          white-space: nowrap;
          will-change: transform;
        }
        .marquee-track:hover {
          animation-play-state: paused;
        }
      `}</style>
    </div>
  );
}

/* ─── Scrolling Mandela ticker ─────────────────────────────────────────── */
function MandelaTicker() {
  return (
    <div
      className="w-full overflow-hidden py-4 rounded-2xl"
      style={{
        background: 'rgba(10,6,30,0.60)',
        border: '1px solid rgba(250,204,21,0.22)',
        backdropFilter: 'blur(14px)',
        WebkitBackdropFilter: 'blur(14px)',
      }}
    >
      {/* Gold opening mark */}
      <div className="text-center mb-1">
        <span style={{ fontSize: 36, lineHeight: 1, color: '#facc15', opacity: 0.75, fontFamily: 'Georgia, serif' }}>"</span>
      </div>

      {/* Scrolling quote */}
      <div className="relative overflow-hidden">
        <p className="marquee-track inline-block"
          style={{
            fontFamily: 'Georgia, serif',
            fontSize: 'clamp(16px, 2.2vw, 22px)',
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
        className="text-center mt-2"
        style={{
          fontFamily: "'Fredoka One', cursive",
          fontSize: 'clamp(12px, 1.2vw, 15px)',
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

/* ─── Footer ───────────────────────────────────────────────────────────── */
function Footer() {
  return (
    <div className="flex justify-center px-3 pb-2">
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

        {/* WhatsApp buttons — compact */}
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
