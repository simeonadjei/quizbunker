import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';

const COLORS = ['#f97316', '#06b6d4', '#eab308', '#ec4899', '#a855f7', '#22d3ee', '#fb923c'];
const SPLASH_COUNT = 16;
const FLOAT_COUNT = 30;
const STAR_COUNT = 7;

function rnd(min: number, max: number) {
  return Math.random() * (max - min) + min;
}

type Shape = 'circle' | 'star' | 'diamond';

interface Floater {
  id: number; x: number; y: number; size: number;
  delay: number; duration: number; color: string; shape: Shape;
}
interface Star {
  id: number; y: number; width: number; delay: number; duration: number; color: string;
}

// Pre-compute splash orbs (stable, no rerenders)
const SPLASH_ORBS = Array.from({ length: SPLASH_COUNT }).map((_, i) => {
  const angle = (i / SPLASH_COUNT) * 360;
  const dist  = 140 + Math.random() * 160;
  const rad   = (angle * Math.PI) / 180;
  return {
    tx:    Math.cos(rad) * dist,
    ty:    Math.sin(rad) * dist,
    color: COLORS[i % COLORS.length],
    size:  10 + Math.random() * 10,
    delay: i * 0.022,
  };
});

export function BackgroundParticles() {
  const [floaters, setFloaters] = useState<Floater[]>([]);
  const [stars,    setStars]    = useState<Star[]>([]);
  const [splashVisible, setSplashVisible] = useState(true);

  useEffect(() => {
    setFloaters(
      Array.from({ length: FLOAT_COUNT }).map((_, i) => ({
        id:       i,
        x:        rnd(0, 100),
        y:        rnd(0, 100),
        size:     rnd(4, 11),
        delay:    rnd(0, 8),
        duration: rnd(9, 20),
        color:    COLORS[Math.floor(rnd(0, COLORS.length))],
        shape:    (['circle', 'star', 'diamond'] as Shape[])[Math.floor(rnd(0, 3))],
      }))
    );

    setStars(
      Array.from({ length: STAR_COUNT }).map((_, i) => ({
        id:       i,
        y:        rnd(4, 65),
        width:    rnd(70, 160),
        delay:    rnd(0, 14),
        duration: rnd(2.8, 5.5),
        color:    COLORS[Math.floor(rnd(0, COLORS.length))],
      }))
    );

    // Hide splash burst after it completes
    const t = setTimeout(() => setSplashVisible(false), 1400);
    return () => clearTimeout(t);
  }, []);

  return (
    <div className="fixed inset-0 pointer-events-none overflow-hidden" style={{ zIndex: -1 }}>

      {/* ── Ambient gradient base ── */}
      <div
        className="absolute inset-0"
        style={{
          background: `
            radial-gradient(ellipse 70% 50% at 50% -5%,  hsl(32  80% 28% / 0.42), transparent),
            radial-gradient(ellipse 55% 40% at 88% 96%,  hsl(175 80% 22% / 0.30), transparent),
            radial-gradient(ellipse 40% 30% at  8% 62%,  hsl(260 70% 30% / 0.22), transparent)
          `,
        }}
      />

      {/* ── Soft pulsing glow blobs ── */}
      <div
        className="absolute top-1/4 left-1/4 w-72 h-72 rounded-full blur-[90px] animate-pulse"
        style={{ background: 'hsl(32 95% 52% / 0.14)', animationDuration: '7s' }}
      />
      <div
        className="absolute bottom-1/3 right-1/5 w-56 h-56 rounded-full blur-[75px] animate-pulse"
        style={{ background: 'hsl(175 80% 42% / 0.14)', animationDuration: '11s', animationDelay: '3s' }}
      />
      <div
        className="absolute -top-24 -right-24 w-96 h-96 rounded-full blur-[110px] animate-pulse"
        style={{ background: 'hsl(45 100% 50% / 0.16)', animationDuration: '9s', animationDelay: '1.5s' }}
      />

      {/* ── Splash burst — fires once on mount ── */}
      {splashVisible && (
        <div className="absolute inset-0 flex items-center justify-center">
          {/* Central flash ring */}
          <motion.div
            className="absolute rounded-full"
            style={{
              background: 'radial-gradient(circle, rgba(255,210,60,0.85), rgba(249,115,22,0.5), transparent)',
            }}
            initial={{ width: 0, height: 0, opacity: 1 }}
            animate={{ width: 380, height: 380, opacity: 0 }}
            transition={{ duration: 0.75, ease: 'easeOut' }}
          />

          {/* Burst orbs */}
          {SPLASH_ORBS.map((orb, i) => (
            <motion.div
              key={i}
              className="absolute rounded-full"
              style={{
                width:     orb.size,
                height:    orb.size,
                backgroundColor: orb.color,
                boxShadow: `0 0 ${orb.size * 2.5}px ${orb.color}`,
              }}
              initial={{ x: 0, y: 0, scale: 0, opacity: 1 }}
              animate={{
                x:       orb.tx,
                y:       orb.ty,
                scale:   [0, 1.5, 1, 0.6],
                opacity: [1, 1, 0.8, 0],
              }}
              transition={{
                duration: 0.95,
                delay:    orb.delay,
                ease:     [0.15, 0.8, 0.5, 1],
              }}
            />
          ))}
        </div>
      )}

      {/* ── Shooting stars ── */}
      {stars.map((s) => (
        <div
          key={s.id}
          className="absolute h-[2px] rounded-full"
          style={{
            top:                    `${s.y}%`,
            left:                   '-12%',
            width:                  `${s.width}px`,
            background:             `linear-gradient(90deg, transparent, ${s.color}, rgba(255,255,255,0.95), transparent)`,
            animationName:          'shootingStar',
            animationDuration:      `${s.duration}s`,
            animationDelay:         `${s.delay}s`,
            animationTimingFunction:'linear',
            animationIterationCount:'infinite',
            opacity:                0,
          }}
        />
      ))}

      {/* ── Floating ambient particles ── */}
      {floaters.map((p) => (
        <div
          key={p.id}
          className="absolute animate-float mix-blend-screen"
          style={{
            left:       `${p.x}%`,
            top:        `${p.y}%`,
            width:      `${p.shape === 'star' ? p.size * 1.5 : p.size}px`,
            height:     `${p.shape === 'star' ? p.size * 1.5 : p.size}px`,
            backgroundColor: p.color,
            borderRadius:
              p.shape === 'circle'  ? '50%' :
              p.shape === 'diamond' ? '3px' : undefined,
            transform:  p.shape === 'diamond' ? 'rotate(45deg)' : undefined,
            clipPath:
              p.shape === 'star'
                ? 'polygon(50% 0%,61% 35%,98% 35%,68% 57%,79% 91%,50% 70%,21% 91%,32% 57%,2% 35%,39% 35%)'
                : undefined,
            boxShadow:  `0 0 ${p.size * 2}px ${p.color}`,
            opacity:    0.55,
            animationDelay:    `${p.delay}s`,
            animationDuration: `${p.duration}s`,
          }}
        />
      ))}

      {/* Bottom depth vignette */}
      <div className="absolute bottom-0 left-0 right-0 h-1/3 bg-gradient-to-t from-black/35 to-transparent" />
    </div>
  );
}
