import { Layout } from '@/components/Layout';
import { useGetQuestionFilters, useCreateQuizSession, useGetPaymentStatus, getGetPaymentStatusQueryKey, getGetQuestionFiltersQueryKey } from '@workspace/api-client-react';
import { useState, useMemo } from 'react';
import { useLocation } from 'wouter';
import { Loader2, Play, Lock, AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/button';
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
    // Don't auto-select subject, force user to pick a card
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

  return (
    <Layout>
      <div className="container mx-auto px-4 py-8">
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-10 gap-6">
          <div>
            <h1 className="text-4xl font-black uppercase tracking-tight glow-text">Level Select</h1>
            <p className="text-muted-foreground font-mono text-sm mt-1">CHOOSE YOUR CHALLENGE</p>
          </div>

          <div className="flex items-center gap-4 bg-card/50 p-4 rounded-xl border border-border backdrop-blur-sm">
            <div className="space-y-1">
              <label className="text-xs font-mono text-primary uppercase">Select Year</label>
              <Select value={selectedYear} onValueChange={setSelectedYear}>
                <SelectTrigger className="w-[180px] bg-background border-primary/30 font-mono">
                  <SelectValue placeholder="Year" />
                </SelectTrigger>
                <SelectContent>
                  {filters?.years.map(y => (
                    <SelectItem key={y} value={y}>{y}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>

        {!isSubscribed && !loadingSub && (
          <div className="mb-8 bg-destructive/10 border border-destructive text-destructive p-4 rounded-xl flex items-center justify-between gap-4 animate-in slide-in-from-top-4">
            <div className="flex items-center gap-3">
              <AlertTriangle className="w-6 h-6" />
              <div>
                <h4 className="font-bold uppercase tracking-wider">Access Restricted</h4>
                <p className="text-sm opacity-80">You need an active Power Up subscription to enter the arena.</p>
              </div>
            </div>
            <Link href="/subscribe" className="neon-button bg-destructive text-destructive-foreground px-4 py-2 rounded font-bold uppercase whitespace-nowrap">
              Unlock Now
            </Link>
          </div>
        )}

        {loadingFilters ? (
          <div className="flex justify-center py-20">
            <Loader2 className="w-10 h-10 animate-spin text-primary" />
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filters?.subjects.map((subject, i) => (
              <div 
                key={subject}
                className={cn(
                  "bg-card/80 border p-6 rounded-2xl backdrop-blur-md transition-all duration-300 animate-in fade-in slide-in-from-bottom-8",
                  selectedSubject === subject 
                    ? "border-primary glow-border scale-[1.02]" 
                    : "border-border hover:border-primary/50 cursor-pointer"
                )}
                style={{ animationDelay: `${i * 50}ms` }}
                onClick={() => setSelectedSubject(subject)}
              >
                <h3 className="text-2xl font-bold uppercase mb-4 text-foreground group-hover:text-primary transition-colors">
                  {subject}
                </h3>
                
                <div className="space-y-3">
                  <p className="text-xs font-mono text-muted-foreground uppercase mb-2">Available Levels</p>
                  
                  <div className="grid grid-cols-4 sm:grid-cols-5 md:grid-cols-4 gap-2">
                    {filters?.weeks.map(w => (
                      <button
                        key={w}
                        disabled={selectedSubject !== subject || createSession.isPending || !isSubscribed}
                        onClick={(e) => { e.stopPropagation(); handleStartLevel(w); }}
                        className={cn(
                          "relative group flex items-center justify-center aspect-square rounded-lg border font-mono font-bold transition-all",
                          selectedSubject === subject
                            ? isSubscribed 
                              ? "border-primary/50 bg-primary/10 hover:bg-primary hover:text-primary-foreground hover:glow-border" 
                              : "border-muted bg-muted/50 opacity-50 cursor-not-allowed"
                            : "border-border bg-background opacity-50 cursor-default"
                        )}
                      >
                        {isSubscribed || selectedSubject !== subject ? (
                          <>
                            <span className={cn("transition-transform duration-200", selectedSubject === subject && isSubscribed && "group-hover:scale-0")}>
                              {w}
                            </span>
                            {selectedSubject === subject && isSubscribed && (
                              <Play className="w-5 h-5 absolute scale-0 group-hover:scale-100 transition-transform duration-200" fill="currentColor" />
                            )}
                          </>
                        ) : (
                          <Lock className="w-4 h-4 text-muted-foreground" />
                        )}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </Layout>
  );
}
