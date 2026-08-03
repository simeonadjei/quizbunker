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
        <div className="w-full max-w-xl mx-auto mb-3 lg:absolute lg:top-[18%] lg:-translate-y-1/2 lg:left-0 lg:right-0 lg:max-w-none lg:px-0">
          <MandelaTicker />
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
        className="lg:hidden w-full overflow-hidden py-1.5 rounded-2xl"
        style={{
          background: 'rgba(10,6,30,0.65)',
          border: '1px solid rgba(250,204,21,0.25)',
          backdropFilter: 'blur(14px)',
          WebkitBackdropFilter: 'blur(14px)',
        }}
      >
        {/* Gold opening mark */}
        <div className="text-center mb-0.5">
          <span style={{ fontSize: 16, lineHeight: 1, color: '#facc15', opacity: 0.8, fontFamily: 'Georgia, serif' }}>"</span>
        </div>
        {/* Centered static quote */}
        <div className="px-4 text-center">
          <p
            style={{
              fontFamily: 'Georgia, serif',
              fontSize: 'clamp(7px, 0.95vw, 10px)',
              lineHeight: 1.5,
              color: 'rgba(255,255,255,0.95)',
              fontStyle: 'italic',
              textShadow: '0 1px 8px rgba(0,0,0,0.85)',
            }}
          >
            Education is the most powerful weapon which you can use to change the world.
          </p>
        </div>
        {/* Attribution */}
        <p
          className="text-center mt-1"
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

      {/* ── DESKTOP: full-width scrolling marquee pill ── */}
      <div
        className="hidden lg:block overflow-hidden py-2"
        style={{
          background: 'rgba(10,6,30,0.70)',
          border: '1px solid rgba(250,204,21,0.30)',
          backdropFilter: 'blur(14px)',
          WebkitBackdropFilter: 'blur(14px)',
          width: '100%',
        }}
      >
        <div className="marquee-track" style={{ display: 'inline-flex', alignItems: 'center', gap: 64 }}>
          {/* Repeat twice so the loop is seamless */}
          {[0, 1].map((i) => (
            <span key={i} style={{ display: 'inline-flex', alignItems: 'center', gap: 16, whiteSpace: 'nowrap' }}>
              <span style={{ color: '#facc15', opacity: 0.85, fontFamily: 'Georgia, serif', fontSize: 18 }}>"</span>
              <span style={{
                fontFamily: 'Georgia, serif',
                fontSize: '15px',
                color: 'rgba(255,255,255,0.95)',
                fontStyle: 'italic',
                textShadow: '0 1px 6px rgba(0,0,0,0.8)',
              }}>
                Education is the most powerful weapon which you can use to change the world.
              </span>
              <span style={{
                fontFamily: "'Fredoka One', cursive",
                fontSize: '17px',
                color: '#facc15',
                letterSpacing: '0.06em',
                textShadow: '0 0 10px rgba(250,204,21,0.5)',
              }}>
                — Nelson Mandela
              </span>
              <span style={{ color: 'rgba(250,204,21,0.35)', fontSize: 20 }}>✦</span>
            </span>
          ))}
        </div>
      </div>
    </>
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
