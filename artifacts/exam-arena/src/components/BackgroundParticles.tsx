import { useEffect, useState } from 'react';

export function BackgroundParticles() {
  const [particles, setParticles] = useState<Array<{ id: number; x: number; y: number; size: number; delay: number; duration: number, color: string }>>([]);

  useEffect(() => {
    const colors = ['#f97316', '#06b6d4', '#eab308', '#ec4899', '#a855f7']; // Orange, Teal, Yellow, Pink, Purple
    // Generate static particles once on mount
    const newParticles = Array.from({ length: 30 }).map((_, i) => ({
      id: i,
      x: Math.random() * 100,
      y: Math.random() * 100,
      size: Math.random() * 6 + 2,
      delay: Math.random() * 5,
      duration: Math.random() * 10 + 10,
      color: colors[Math.floor(Math.random() * colors.length)]
    }));
    setParticles(newParticles);
  }, []);

  return (
    <div className="fixed inset-0 pointer-events-none overflow-hidden z-0">
      {/* Light rays/beams at the bottom for depth */}
      <div className="absolute bottom-0 left-0 right-0 h-1/2 bg-gradient-to-t from-black/40 to-transparent" />
      
      {/* Animated floating particles / dust */}
      {particles.map((p) => (
        <div
          key={p.id}
          className="absolute rounded-full animate-float mix-blend-screen"
          style={{
            left: `${p.x}%`,
            top: `${p.y}%`,
            width: `${p.size}px`,
            height: `${p.size}px`,
            backgroundColor: p.color,
            boxShadow: `0 0 ${p.size * 2}px ${p.color}`,
            opacity: 0.6,
            animationDelay: `${p.delay}s`,
            animationDuration: `${p.duration}s`,
          }}
        />
      ))}

      {/* Sun/Moon glow top right */}
      <div className="absolute -top-32 -right-32 w-96 h-96 bg-accent/20 rounded-full blur-[100px] animate-pulse" style={{ animationDuration: '8s' }} />
    </div>
  );
}
