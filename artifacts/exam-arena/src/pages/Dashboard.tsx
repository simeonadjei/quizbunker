import { Layout } from '@/components/Layout';
import { useGetQuestionFilters, useCreateQuizSession, useGetPaymentStatus, getGetPaymentStatusQueryKey, getGetQuestionFiltersQueryKey } from '@workspace/api-client-react';
import { useState, useMemo } from 'react';
import { useLocation } from 'wouter';
import { Loader2, Play, Lock, AlertTriangle, ShieldAlert } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { cn } from '@/lib/utils';
import { Link } from 'wouter';

export default function Dashboard() {
  const [, setLocation] = useLocation();
  const { data: filters, isLoading: loadingFilters } = useGetQuestionFilters({ query: { enabled: true, queryKey: getGetQuestionFiltersQueryKey() } });
  const { data: subStatus, isLoading: loadingSub } = useGetPaymentStatus({ query: { enabled: true, queryKey: getGetPaymentStatusQueryKey() } });
  
  const createSession = useCreateQuizSession();

  const [selectedYear, setSelectedYear] = useState<string>('');
  const [selectedSubject, setSelectedSubject] = useState<string>('');

  // When filters load, set defaults if empty
  useMemo(() => {
    if (filters && !selectedYear && filters.years.length > 0) {
      setSelectedYear(filters.years[0]);
    }
  }, [filters]);

  const handleStartLevel = (week: number) => {
    if (!subStatus?.isActive) {
      setLocation('/subscribe');
      return;
    }
    if (!selectedYear || !selectedSubject) return;

    createSession.mutate({ data: { year: selectedYear, subject: selectedSubject, week } }, {
      onSuccess: (session) => {
        setLocation(`/quiz/${session.id}`);
      }
    });
  };

  const isSubscribed = subStatus?.isActive;

  // Give subjects a consistent color for the border
  const subjectColors = [
    'border-primary text-primary',
    'border-secondary text-secondary',
    'border-accent text-accent',
    'border-green-400 text-green-400',
    'border-purple-400 text-purple-400',
    'border-pink-400 text-pink-400'
  ];

  return (
    <Layout>
      <div className="container mx-auto px-4 py-8 md:py-16 pt-24">
        
        {/* Header Area */}
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-12 gap-6 bg-black/30 p-6 md:p-8 rounded-3xl border-2 border-white/10 backdrop-blur-md">
          <div>
            <h1 className="text-5xl md:text-6xl font-black uppercase tracking-tight text-outline text-white mb-2">Level Select</h1>
            <p className="text-white/80 font-bold tracking-widest uppercase bg-primary/20 inline-block px-4 py-1 rounded-full border border-primary/50">CHOOSE YOUR CHALLENGE</p>
          </div>

          <div className="flex items-center gap-4 bg-black/50 p-4 rounded-2xl border-2 border-white/20">
            <div className="space-y-1">
              <label className="text-xs font-bold text-white uppercase tracking-wider ml-1">Select Year</label>
              <Select value={selectedYear} onValueChange={setSelectedYear}>
                <SelectTrigger className="w-[180px] bg-white text-black font-bold h-12 rounded-xl border-2 border-transparent focus:ring-primary focus:border-primary text-lg">
                  <SelectValue placeholder="Year" />
                </SelectTrigger>
                <SelectContent className="bg-white border-2 border-black rounded-xl">
                  {filters?.years.map(y => (
                    <SelectItem key={y} value={y} className="font-bold text-lg cursor-pointer hover:bg-black/5">{y}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>

        {/* Subscription Warning */}
        {!isSubscribed && !loadingSub && (
          <div className="mb-12 bg-destructive/20 border-2 border-destructive p-6 rounded-3xl flex flex-col sm:flex-row items-center justify-between gap-6 animate-in slide-in-from-top-4 shadow-[0_0_30px_hsl(var(--destructive)/0.3)]">
            <div className="flex items-center gap-4 text-white">
              <div className="bg-destructive w-14 h-14 rounded-2xl flex items-center justify-center shrink-0 shadow-[0_4px_0_hsl(348,83%,27%)]">
                <ShieldAlert className="w-8 h-8 text-white" strokeWidth={2.5} />
              </div>
              <div>
                <h4 className="font-display text-2xl uppercase tracking-wider text-outline text-white">Access Restricted</h4>
                <p className="font-bold text-white/90">You need an active Power Up subscription to enter the arena.</p>
              </div>
            </div>
            <Link href="/subscribe" className="btn-game-accent px-8 py-4 whitespace-nowrap text-lg w-full sm:w-auto text-center">
              Unlock Now
            </Link>
          </div>
        )}

        {loadingFilters ? (
          <div className="flex justify-center py-20">
            <Loader2 className="w-16 h-16 animate-spin text-primary" />
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-8">
            {filters?.subjects.map((subject, i) => {
              const cColor = subjectColors[i % subjectColors.length];
              const isSelected = selectedSubject === subject;
              
              return (
                <div 
                  key={subject}
                  className={cn(
                    "card-game p-6 md:p-8 transition-all duration-300 animate-in fade-in slide-in-from-bottom-8 border-t-4 border-l-4 group cursor-pointer overflow-hidden",
                    isSelected ? `scale-[1.02] ${cColor.split(' ')[0]} bg-white/10 shadow-[0_0_30px_rgba(255,255,255,0.1)]` : "border-white/20 hover:bg-white/5",
                  )}
                  style={{ animationDelay: `${i * 50}ms` }}
                  onClick={() => setSelectedSubject(subject)}
                >
                  
                  {/* Decorative background element */}
                  <div className={cn(
                    "absolute -right-10 -bottom-10 w-40 h-40 rounded-full blur-[50px] opacity-20 pointer-events-none transition-colors",
                    isSelected ? cColor.replace('border-', 'bg-').replace('text-', '') : 'bg-white'
                  )} />

                  <h3 className={cn(
                    "text-3xl font-display uppercase mb-6 transition-colors text-outline drop-shadow-md",
                    isSelected ? cColor.split(' ')[1] : "text-white group-hover:text-primary"
                  )}>
                    {subject}
                  </h3>
                  
                  <div className="space-y-4 relative z-10">
                    <p className="text-sm font-bold text-white/70 uppercase tracking-widest bg-black/40 inline-block px-3 py-1 rounded-lg">Available Levels</p>
                    
                    <div className="grid grid-cols-4 sm:grid-cols-5 md:grid-cols-4 gap-3">
                      {filters?.weeks.map(w => (
                        <button
                          key={w}
                          disabled={!isSelected || createSession.isPending || !isSubscribed}
                          onClick={(e) => { e.stopPropagation(); handleStartLevel(w); }}
                          className={cn(
                            "relative aspect-square rounded-xl border-2 font-display text-xl transition-all duration-200 flex items-center justify-center shadow-sm overflow-hidden group/btn",
                            isSelected
                              ? isSubscribed 
                                ? "border-white/30 bg-black/40 text-white hover:border-white hover:bg-white hover:text-black hover:scale-110 active:scale-95 shadow-[0_4px_0_rgba(0,0,0,0.3)]" 
                                : "border-white/10 bg-black/20 text-white/30 cursor-not-allowed"
                              : "border-white/10 bg-black/20 text-white/30 cursor-default"
                          )}
                        >
                          {isSubscribed || !isSelected ? (
                            <>
                              <span className={cn("transition-transform duration-200", isSelected && isSubscribed && "group-hover/btn:scale-0")}>
                                {w}
                              </span>
                              {isSelected && isSubscribed && (
                                <Play className="w-8 h-8 absolute scale-0 group-hover/btn:scale-100 transition-transform duration-200" fill="currentColor" strokeWidth={0} />
                              )}
                            </>
                          ) : (
                            <Lock className="w-6 h-6 text-white/30" strokeWidth={2.5} />
                          )}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </Layout>
  );
}
