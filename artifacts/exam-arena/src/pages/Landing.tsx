import { Layout } from '@/components/Layout';
import { Link } from 'wouter';
import { ArrowRight, Trophy, Zap, Target } from 'lucide-react';
import { useGetCurrentUser, getGetCurrentUserQueryKey } from '@workspace/api-client-react';

export default function Landing() {
  const { data: user, isLoading } = useGetCurrentUser({ query: { queryKey: getGetCurrentUserQueryKey() } });

  return (
    <Layout>
      <div className="flex-1 flex flex-col items-center justify-center container mx-auto px-4 py-20 text-center">
        
        {/* Hero Section */}
        <div className="max-w-4xl space-y-8 animate-in fade-in slide-in-from-bottom-8 duration-1000">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-primary/30 bg-primary/10 text-primary text-sm font-mono mb-4">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-primary"></span>
            </span>
            SYSTEM ONLINE. TOURNAMENT ACTIVE.
          </div>
          
          <h1 className="text-5xl md:text-7xl font-black tracking-tighter uppercase glow-text">
            Enter the <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-secondary">Arena</span>
          </h1>
          
          <p className="text-xl md:text-2xl text-muted-foreground max-w-2xl mx-auto font-light">
            Ghana's most intense exam practice platform. Questions are challenges. Every correct answer is a victory. Are you ready player one?
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center pt-8">
            {isLoading ? null : user ? (
              <Link 
                href="/dashboard" 
                className="neon-button bg-primary text-primary-foreground text-lg font-bold px-8 py-4 rounded-lg flex items-center justify-center gap-2 uppercase"
              >
                Return to Arena <ArrowRight className="w-5 h-5" />
              </Link>
            ) : (
              <>
                <Link 
                  href="/register" 
                  className="neon-button bg-primary text-primary-foreground text-lg font-bold px-8 py-4 rounded-lg flex items-center justify-center gap-2 uppercase"
                >
                  Start New Game <GamepadIcon className="w-5 h-5" />
                </Link>
                <Link 
                  href="/login" 
                  className="bg-secondary/10 border border-secondary text-secondary hover:bg-secondary/20 transition-colors text-lg font-bold px-8 py-4 rounded-lg flex items-center justify-center gap-2 uppercase"
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
            icon={<Trophy className="w-8 h-8 text-accent" />}
            title="Boss Fights"
            desc="Face real past questions from BECE and WASSCE formatted as high-stakes levels."
            delay={100}
          />
          <FeatureCard 
            icon={<Zap className="w-8 h-8 text-primary" />}
            title="Power Up"
            desc="Track your stats, review your mistakes, and level up your knowledge."
            delay={200}
          />
          <FeatureCard 
            icon={<Target className="w-8 h-8 text-secondary" />}
            title="Leaderboard"
            desc="Compete against the curriculum. Every set you clear makes you stronger."
            delay={300}
          />
        </div>

      </div>
    </Layout>
  );
}

function FeatureCard({ icon, title, desc, delay }: { icon: React.ReactNode, title: string, desc: string, delay: number }) {
  return (
    <div 
      className="bg-card/50 backdrop-blur-sm border border-border p-6 rounded-xl text-left hover:border-primary/50 transition-colors group animate-in fade-in slide-in-from-bottom-8 fill-mode-both"
      style={{ animationDelay: `${delay}ms` }}
    >
      <div className="bg-background w-14 h-14 rounded-lg flex items-center justify-center border border-border group-hover:border-primary/50 group-hover:scale-110 transition-all mb-4">
        {icon}
      </div>
      <h3 className="text-xl font-bold mb-2 uppercase">{title}</h3>
      <p className="text-muted-foreground text-sm leading-relaxed">{desc}</p>
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
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <line x1="6" x2="10" y1="12" y2="12" />
      <line x1="8" x2="8" y1="10" y2="14" />
      <line x1="15" x2="15.01" y1="13" y2="13" />
      <line x1="18" x2="18.01" y1="11" y2="11" />
      <rect width="20" height="12" x="2" y="6" rx="2" />
    </svg>
  )
}
