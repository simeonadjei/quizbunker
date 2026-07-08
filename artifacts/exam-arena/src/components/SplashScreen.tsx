import { useEffect, useState } from 'react';

interface SplashScreenProps {
  onFinished: () => void;
}

export default function SplashScreen({ onFinished }: SplashScreenProps) {
  const [phase, setPhase] = useState<'visible' | 'fading'>('visible');

  useEffect(() => {
    // Start fade-out at 7s so the 1s fade completes at 8s total
    const fadeTimer = setTimeout(() => setPhase('fading'), 7000);
    const doneTimer = setTimeout(() => onFinished(), 8000);
    return () => {
      clearTimeout(fadeTimer);
      clearTimeout(doneTimer);
    };
  }, [onFinished]);

  return (
    <div
      className="fixed inset-0 z-[9999] flex flex-col items-center justify-center"
      style={{
        background: 'hsl(240 35% 11%)',
        transition: 'opacity 1s ease-in-out',
        opacity: phase === 'fading' ? 0 : 1,
        pointerEvents: phase === 'fading' ? 'none' : 'auto',
      }}
    >
      {/* Radial glow behind logo */}
      <div
        style={{
          position: 'absolute',
          width: '420px',
          height: '420px',
          borderRadius: '50%',
          background: 'radial-gradient(circle, hsl(32 95% 55% / 0.18) 0%, transparent 70%)',
          animation: 'starPulse 2s ease-in-out infinite alternate',
        }}
      />

      {/* Logo */}
      <img
        src={`${import.meta.env.BASE_URL}logo.png`}
        alt="Quiz Bunker"
        style={{
          width: 'clamp(160px, 40vw, 240px)',
          height: 'clamp(160px, 40vw, 240px)',
          objectFit: 'cover',
          borderRadius: '50%',
          position: 'relative',
          animation: 'splashEntrance 0.35s cubic-bezier(0.175, 0.885, 0.32, 1.275) forwards, float 4s ease-in-out 0.35s infinite',
          filter: 'drop-shadow(0 0 32px hsl(32 95% 55% / 0.55))',
          border: '3px solid hsl(32 95% 55% / 0.6)',
        }}
      />

      {/* Loading bar */}
      <div
        style={{
          marginTop: '48px',
          width: 'clamp(160px, 40vw, 280px)',
          height: '4px',
          borderRadius: '99px',
          background: 'hsl(240 30% 22%)',
          overflow: 'hidden',
          position: 'relative',
        }}
      >
        <div
          style={{
            position: 'absolute',
            inset: 0,
            background: 'linear-gradient(90deg, hsl(32 95% 55%), hsl(45 95% 65%))',
            borderRadius: '99px',
            animation: 'splashProgress 8s linear forwards',
          }}
        />
      </div>

      <style>{`
        @keyframes splashProgress {
          from { transform: scaleX(0); transform-origin: left; }
          to   { transform: scaleX(1); transform-origin: left; }
        }
        @keyframes splashEntrance {
          from { transform: scale(0.4); opacity: 0; }
          to   { transform: scale(1);   opacity: 1; }
        }
      `}</style>
    </div>
  );
}
