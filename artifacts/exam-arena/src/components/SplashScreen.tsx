import { useEffect, useState } from 'react';

interface SplashScreenProps {
  onFinished: () => void;
}

const TITLE = 'Quiz Bunker';

const LETTER_COLORS = [
  '#FFD700', '#FF6B6B', '#4ECDC4', '#A8E063',
  '#FF8E53', '#C471ED', '#12C2E9', '#F64F59',
  '#43E97B', '#FA709A', '#FEE140', '#30CFD0',
];

export default function SplashScreen({ onFinished }: SplashScreenProps) {
  const [visibleLetters, setVisibleLetters] = useState(0);
  const [fading, setFading] = useState(false);

  useEffect(() => {
    // Reveal letters one by one starting at 300ms
    let idx = 0;
    const interval = setInterval(() => {
      idx += 1;
      setVisibleLetters(idx);
      if (idx >= TITLE.length) clearInterval(interval);
    }, 120);

    const fadeTimer = setTimeout(() => setFading(true), 7000);
    const doneTimer = setTimeout(() => onFinished(), 8000);

    return () => {
      clearInterval(interval);
      clearTimeout(fadeTimer);
      clearTimeout(doneTimer);
    };
  }, [onFinished]);

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 9999,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'hsl(240 35% 11%)',
        transition: 'opacity 1s ease-in-out',
        opacity: fading ? 0 : 1,
        pointerEvents: fading ? 'none' : 'auto',
        gap: '32px',
      }}
    >
      {/* Spinning gold ring + logo */}
      <div style={{ position: 'relative', width: 220, height: 220 }}>
        {/* Spinning ring SVG */}
        <svg
          width={220}
          height={220}
          viewBox="0 0 220 220"
          style={{
            position: 'absolute',
            inset: 0,
            animation: 'spinRing 2.4s linear infinite',
          }}
        >
          <defs>
            <linearGradient id="ringGrad" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%"   stopColor="#FFD700" stopOpacity="1" />
              <stop offset="40%"  stopColor="#FF8E53" stopOpacity="0.9" />
              <stop offset="100%" stopColor="#FFD700" stopOpacity="0.1" />
            </linearGradient>
          </defs>
          <circle
            cx="110" cy="110" r="102"
            fill="none"
            stroke="url(#ringGrad)"
            strokeWidth="6"
            strokeLinecap="round"
            strokeDasharray="200 450"
          />
        </svg>

        {/* Static glow ring */}
        <div style={{
          position: 'absolute',
          inset: 10,
          borderRadius: '50%',
          boxShadow: '0 0 40px 6px hsl(32 95% 55% / 0.35)',
        }} />

        {/* Logo — instant, no entrance animation */}
        <img
          src={`${import.meta.env.BASE_URL}logo.png`}
          alt="Quiz Bunker"
          style={{
            position: 'absolute',
            inset: 14,
            width: 'calc(100% - 28px)',
            height: 'calc(100% - 28px)',
            objectFit: 'cover',
            borderRadius: '50%',
            border: '2px solid hsl(32 95% 55% / 0.5)',
          }}
        />
      </div>

      {/* Letter-by-letter title */}
      <div style={{
        display: 'flex',
        gap: '2px',
        fontFamily: "'Fredoka One', cursive",
        fontSize: 'clamp(28px, 6vw, 42px)',
        letterSpacing: '2px',
        minHeight: '52px',
        alignItems: 'center',
      }}>
        {TITLE.split('').map((char, i) => (
          <span
            key={i}
            style={{
              color: LETTER_COLORS[i % LETTER_COLORS.length],
              opacity: i < visibleLetters ? 1 : 0,
              transform: i < visibleLetters ? 'translateY(0)' : 'translateY(12px)',
              transition: 'opacity 0.18s ease, transform 0.18s ease',
              display: 'inline-block',
              textShadow: `0 0 12px ${LETTER_COLORS[i % LETTER_COLORS.length]}88`,
              whiteSpace: char === ' ' ? 'pre' : 'normal',
            }}
          >
            {char === ' ' ? '\u00A0' : char}
          </span>
        ))}
      </div>

      {/* Three golden loading dots */}
      <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
        {[0, 1, 2].map(i => (
          <div
            key={i}
            style={{
              width: 10,
              height: 10,
              borderRadius: '50%',
              background: 'linear-gradient(135deg, #FFD700, #FF8E53)',
              boxShadow: '0 0 8px #FFD70099',
              animation: `dotBounce 1.2s ease-in-out ${i * 0.2}s infinite`,
            }}
          />
        ))}
      </div>

      <style>{`
        @keyframes spinRing {
          from { transform: rotate(0deg); }
          to   { transform: rotate(360deg); }
        }
        @keyframes dotBounce {
          0%, 80%, 100% { transform: translateY(0);    opacity: 0.4; }
          40%            { transform: translateY(-10px); opacity: 1;   }
        }
      `}</style>
    </div>
  );
}
