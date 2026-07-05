import { Layout } from '@/components/Layout';
import { Link } from 'wouter';
import { Trophy, Zap, Target, Star } from 'lucide-react';
import { useGetCurrentUser, getGetCurrentUserQueryKey } from '@workspace/api-client-react';

export default function Landing() {
  const { data: user, isLoading } = useGetCurrentUser({ query: { queryKey: getGetCurrentUserQueryKey() } });

  return (
    <Layout>
      <div className="flex-1 flex flex-col items-center justify-center container mx-auto px-4 py-20 text-center relative z-10">
        
        {/* Floating background elements specific to hero */}
        <div className="absolute inset-0 pointer-events-none flex justify-center items-center opacity-40">
           <Star className="absolute top-1/4 left-1/4 w-12 h-12 text-accent animate-starPulse" />
           <Star className="absolute bottom-1/3 right-1/4 w-8 h-8 text-accent animate-starPulse" style={{ animationDelay: '0.5s' }} />
           <Trophy className="absolute top-1/3 right-1/3 w-16 h-16 text-primary animate-float" style={{ animationDelay: '1s' }} />
        </div>

        {/* Hero Section */}
        <div className="max-w-4xl space-y-8 animate-in zoom-in-95 duration-1000 relative">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border-2 border-primary/50 bg-primary/20 text-white font-display text-sm uppercase mb-4 shadow-[0_0_15px_hsl(var(--primary)/0.5)]">
            <span className="relative flex h-3 w-3">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-accent opacity-75"></span>
              <span className="relative inline-flex rounded-full h-3 w-3 bg-accent"></span>
            </span>
            System Online. Tournament Active.
          </div>
          
          <div className="space-y-2">
            <h1 className="text-6xl md:text-8xl font-black tracking-tighter uppercase text-outline">
              <span className="text-white">Enter the</span>
            </h1>
            <h1 className="text-7xl md:text-9xl font-black tracking-tighter uppercase text-outline-primary text-primary drop-shadow-[0_0_30px_hsl(var(--primary))] animate-pulse">
              Arena
            </h1>
          </div>
          
          <p className="text-xl md:text-2xl text-white/90 max-w-2xl mx-auto font-bold bg-black/30 p-4 rounded-2xl backdrop-blur-sm border-2 border-white/10">
            Ghana's most intense exam practice platform. Questions are challenges. Every correct answer is a victory. Are you ready player one?
          </p>
          
          <div className="flex flex-col sm:flex-row gap-6 justify-center pt-8">
            {isLoading ? null : user ? (
              <Link 
                href="/dashboard" 
                className="btn-game px-12 py-5 text-2xl animate-bounce"
              >
                Return to Arena 
              </Link>
            ) : (
              <>
                <Link 
                  href="/register" 
                  className="btn-game px-10 py-5 text-xl flex items-center justify-center gap-3 animate-pulse"
                >
                  Start New Game <GamepadIcon className="w-6 h-6" />
                </Link>
                <Link 
                  href="/login" 
                  className="btn-game-secondary px-10 py-5 text-xl flex items-center justify-center gap-3"
                >
                  Load Save Data
                </Link>
              </>
            )}
          </div>
        </div>

        {/* Feature grid */}
        <div className="grid md:grid-cols-3 gap-8 w-full max-w-5xl mt-32">
          <FeatureCard 
            icon={<Trophy className="w-10 h-10 text-accent drop-shadow-[0_0_10px_rgba(255,215,0,0.8)]" />}
            title="Boss Fights"
            desc="Face real past questions from BECE and WASSCE formatted as high-stakes levels."
            delay={100}
            colorClass="border-accent"
          />
          <FeatureCard 
            icon={<Zap className="w-10 h-10 text-primary drop-shadow-[0_0_10px_hsl(var(--primary))]" />}
            title="Power Up"
            desc="Track your stats, review your mistakes, and level up your knowledge."
            delay={200}
            colorClass="border-primary"
          />
          <FeatureCard 
            icon={<Target className="w-10 h-10 text-secondary drop-shadow-[0_0_10px_hsl(var(--secondary))]" />}
            title="Leaderboard"
            desc="Compete against the curriculum. Every set you clear makes you stronger."
            delay={300}
            colorClass="border-secondary"
          />
        </div>

      </div>
    </Layout>
  );
}

function FeatureCard({ icon, title, desc, delay, colorClass }: { icon: React.ReactNode, title: string, desc: string, delay: number, colorClass: string }) {
  return (
    <div 
      className={`card-game p-8 text-left group animate-in fade-in slide-in-from-bottom-8 fill-mode-both border-l-4 border-t-4 ${colorClass} hover:-translate-y-2 transition-transform duration-300`}
      style={{ animationDelay: `${delay}ms` }}
    >
      <div className="bg-black/50 w-20 h-20 rounded-2xl flex items-center justify-center border-2 border-white/20 group-hover:scale-110 transition-all mb-6 shadow-inner">
        {icon}
      </div>
      <h3 className="text-2xl font-display text-white text-outline mb-3 uppercase tracking-wide">{title}</h3>
      <p className="text-white/80 font-bold leading-relaxed">{desc}</p>
    </div>
  );
}

function GamepadIcon(props: any) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <line x1="6" x2="10" y1="12" y2="12" />
      <line x1="8" x2="8" y1="10" y2="14" />
      <line x1="15" x2="15.01" y1="13" y2="13" />
      <line x1="18" x2="18.01" y1="11" y2="11" />
      <rect width="20" height="12" x="2" y="6" rx="4" />
    </svg>
  )
}
