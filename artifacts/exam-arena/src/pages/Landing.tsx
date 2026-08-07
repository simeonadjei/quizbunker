import { useRef, useEffect } from 'react';
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

        {/* Mandela ticker — mobile: in flow; desktop: absolute below navbar, on the yellow bulb glow */}
        <div className="w-full max-w-xl mx-auto mb-3 lg:absolute lg:top-[20%] lg:-translate-y-1/2 lg:left-0 lg:right-0 lg:max-w-none lg:px-0" style={{ zIndex: 50 }}>
          <MandelaTicker />
        </div>

        {/* Desktop: flex fill so Footer stays pinned at the bottom */}
        <div className="hidden lg:block lg:flex-1" />

        {/* Footer — credits */}
        <Footer />
      </div>

      <style>{``}</style>
    </div>
  );
}

/* ─── Quotes data ────────────────────────────────────────────────────────── */
const QUOTES = [
  { text: "Education is the most powerful weapon which you can use to change the world.", author: "Nelson Mandela" },
  { text: "We face neither East nor West; we face forward.", author: "Kwame Nkrumah" },
  { text: "Knowledge is power. Information is liberating. Education is the premise of progress.", author: "Kofi Annan" },
  { text: "One child, one teacher, one book, one pen can change the world.", author: "Malala Yousafzai" },
  { text: "An investment in knowledge pays the best interest.", author: "Benjamin Franklin" },
  { text: "Education is not preparation for life; education is life itself.", author: "John Dewey" },
  { text: "Once you learn to read, you will be forever free.", author: "Frederick Douglass" },
  { text: "The roots of education are bitter, but the fruit is sweet.", author: "Aristotle" },
  { text: "Development means putting people first — always.", author: "Jerry John Rawlings" },
  { text: "Imagination is more important than knowledge. Knowledge is limited; imagination encircles the world.", author: "Albert Einstein" },
  { text: "Education is the key to unlocking the world — a passport to freedom.", author: "Oprah Winfrey" },
  { text: "In learning you will teach, and in teaching you will learn.", author: "Phil Collins" },
  { text: "My humanity is bound up in yours, for we can only be human together.", author: "Desmond Tutu" },
  { text: "Success is not final, failure is not fatal: it is the courage to continue that counts.", author: "Winston Churchill" },
  { text: "You can't use up creativity. The more you use, the more you have.", author: "Maya Angelou" },
  { text: "Free quality education is the greatest equaliser a society can have.", author: "Nana Akufo-Addo" },
  { text: "Change will not come if we wait for some other person or some other time.", author: "Barack Obama" },
  { text: "Do not wait to strike till the iron is hot; but make it hot by striking.", author: "William B. Sprague" },
  { text: "The function of education is to teach one to think intensively and to think critically.", author: "Martin Luther King Jr." },
  { text: "Hard work beats talent when talent fails to work hard.", author: "Kevin Durant" },
] as const;

/* ─── Scrolling ticker (JS-driven, draggable/swipeable) ─────────────────── */
function QuoteStrip({ gap, quoteFontSize, authorFontSize, dividerSize, py }: {
  gap: number; quoteFontSize: string; authorFontSize: string; dividerSize: number; py: string;
}) {
  const doubled = [...QUOTES, ...QUOTES];
  const trackRef = useRef<HTMLDivElement>(null);

  // All mutable scroll state in a single ref — avoids re-renders
  const s = useRef({
    offset: 0,
    dragging: false,
    dragStartX: 0,
    dragStartOffset: 0,
    lastX: 0,
    lastTime: 0,
    velocity: 0,       // px/ms — used for momentum after release
    rafId: 0,
  });

  // px per ms auto-scroll speed (≈ 60 px/s — matches previous 852 s feel)
  const SPEED = 0.06;

  useEffect(() => {
    const state = s.current;
    let lastTs = 0;

    function loop(ts: number) {
      const dt = lastTs ? ts - lastTs : 0;
      lastTs = ts;

      const track = trackRef.current;
      if (track) {
        const halfWidth = track.scrollWidth / 2;
        if (halfWidth > 0) {
          if (!state.dragging) {
            // Apply momentum from last drag, decaying quickly
            if (Math.abs(state.velocity) > 0.01) {
              state.offset -= state.velocity * dt;
              state.velocity *= 0.92; // friction
            } else {
              state.velocity = 0;
              state.offset += SPEED * dt;
            }
          }
          // Seamless wrap
          state.offset = ((state.offset % halfWidth) + halfWidth) % halfWidth;
          track.style.transform = `translateX(${-state.offset}px)`;
        }
      }
      state.rafId = requestAnimationFrame(loop);
    }

    state.rafId = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(state.rafId);
  }, []);

  // ── Pointer (mouse) events ─────────────────────────────────────────────────
  const onMouseDown = (e: React.MouseEvent) => {
    const state = s.current;
    state.dragging = true;
    state.dragStartX = e.clientX;
    state.dragStartOffset = state.offset;
    state.lastX = e.clientX;
    state.lastTime = performance.now();
    state.velocity = 0;
    e.preventDefault();
  };

  const onMouseMove = (e: React.MouseEvent) => {
    const state = s.current;
    if (!state.dragging) return;
    const dx = e.clientX - state.dragStartX;
    state.offset = state.dragStartOffset - dx;
    const now = performance.now();
    const dt = now - state.lastTime;
    if (dt > 0) state.velocity = -(e.clientX - state.lastX) / dt;
    state.lastX = e.clientX;
    state.lastTime = now;
  };

  const onMouseUp = () => { s.current.dragging = false; };

  // ── Touch events ───────────────────────────────────────────────────────────
  const onTouchStart = (e: React.TouchEvent) => {
    const state = s.current;
    state.dragging = true;
    state.dragStartX = e.touches[0].clientX;
    state.dragStartOffset = state.offset;
    state.lastX = e.touches[0].clientX;
    state.lastTime = performance.now();
    state.velocity = 0;
  };

  const onTouchMove = (e: React.TouchEvent) => {
    const state = s.current;
    if (!state.dragging) return;
    const dx = e.touches[0].clientX - state.dragStartX;
    state.offset = state.dragStartOffset - dx;
    const now = performance.now();
    const dt = now - state.lastTime;
    if (dt > 0) state.velocity = -(e.touches[0].clientX - state.lastX) / dt;
    state.lastX = e.touches[0].clientX;
    state.lastTime = now;
  };

  const onTouchEnd = () => { s.current.dragging = false; };

  return (
    <div
      style={{ overflow: 'hidden', padding: `${py} 0`, cursor: 'grab', userSelect: 'none', WebkitUserSelect: 'none' }}
      onMouseDown={onMouseDown}
      onMouseMove={onMouseMove}
      onMouseUp={onMouseUp}
      onMouseLeave={onMouseUp}
      onTouchStart={onTouchStart}
      onTouchMove={onTouchMove}
      onTouchEnd={onTouchEnd}
    >
      <div
        ref={trackRef}
        style={{ display: 'inline-flex', alignItems: 'center', gap, whiteSpace: 'nowrap', willChange: 'transform' }}
      >
        {doubled.map((q, idx) => (
          <span key={idx} style={{ display: 'inline-flex', alignItems: 'center', gap: Math.round(gap * 0.28), whiteSpace: 'nowrap' }}>
            <span style={{ color: '#facc15', opacity: 0.8, fontFamily: 'Georgia, serif', fontSize: dividerSize * 1.2 }}>"</span>
            <span style={{
              fontFamily: 'Georgia, serif',
              fontSize: quoteFontSize,
              color: 'rgba(255,255,255,0.95)',
              fontStyle: 'italic',
              textShadow: '0 1px 6px rgba(0,0,0,0.8)',
            }}>
              {q.text}
            </span>
            <span style={{
              fontFamily: "'Fredoka One', cursive",
              fontSize: authorFontSize,
              color: '#facc15',
              letterSpacing: '0.06em',
              textShadow: '0 0 10px rgba(250,204,21,0.5)',
            }}>
              — {q.author}
            </span>
            <span style={{ color: 'rgba(250,204,21,0.32)', fontSize: dividerSize, marginLeft: Math.round(gap * 0.18) }}>✦</span>
          </span>
        ))}
      </div>
    </div>
  );
}

function MandelaTicker() {
  return (
    <div
      className="w-full overflow-hidden"
      style={{
        background: 'rgba(10,6,30,0.68)',
        border: '1px solid rgba(250,204,21,0.28)',
        backdropFilter: 'blur(14px)',
        WebkitBackdropFilter: 'blur(14px)',
      }}
    >
      {/* Mobile — smaller text, same scroll */}
      <div className="lg:hidden">
        <QuoteStrip gap={48} quoteFontSize="15px" authorFontSize="17px" dividerSize={22} py="10px" />
      </div>
      {/* Desktop — large, cinematic text */}
      <div className="hidden lg:block">
        <QuoteStrip gap={80} quoteFontSize="44px" authorFontSize="50px" dividerSize={58} py="10px" />
      </div>
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
