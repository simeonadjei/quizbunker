import { useGetPaymentStatus, getGetPaymentStatusQueryKey, useInitializePayment } from '@workspace/api-client-react';
import { Layout } from '@/components/Layout';
import { Zap, Check, Star, Shield, Clock, CircleDollarSign, Trophy } from 'lucide-react';
import { useState } from 'react';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';

export default function Subscribe() {
  const { data: status, isLoading } = useGetPaymentStatus({ query: { queryKey: getGetPaymentStatusQueryKey() } });
  const initPayment = useInitializePayment();
  const { toast } = useToast();

  const [semesterStart, setSemesterStart] = useState<Date>();

  const handleSubscribe = (plan: 'monthly' | 'semester' | 'yearly') => {
    if (plan === 'semester' && !semesterStart) {
      toast({ title: "Date required", description: "Please select your semester start date.", variant: "destructive" });
      return;
    }

    const payload = {
      plan,
      semesterStart: plan === 'semester' && semesterStart ? semesterStart.toISOString().split('T')[0] : undefined
    };

    initPayment.mutate({ data: payload }, {
      onSuccess: (res) => {
        window.location.href = res.authorizationUrl;
      },
      onError: () => {
        toast({ title: "Error", description: "Could not initialize payment.", variant: "destructive" });
      }
    });
  };

  return (
    <Layout>
      <div className="container mx-auto px-4 py-12 md:py-20 max-w-6xl">
        <div className="text-center mb-16 animate-in slide-in-from-bottom-4">
          <div className="inline-block relative">
            <div className="absolute inset-0 bg-accent/30 blur-[60px] rounded-full" />
            <div className="w-24 h-24 bg-accent mx-auto rounded-full flex items-center justify-center mb-6 shadow-[0_0_40px_hsl(var(--accent))] border-4 border-white relative z-10 animate-starPulse">
              <Zap className="w-12 h-12 text-[#3b1a03]" fill="currentColor" />
            </div>
          </div>
          
          <h1 className="text-5xl md:text-7xl font-black uppercase tracking-tight text-accent text-outline drop-shadow-[0_0_15px_hsl(var(--accent))] mb-4">
            Power Up
          </h1>
          <p className="text-white/90 font-bold bg-black/40 inline-block px-6 py-2 rounded-full border border-white/20 tracking-widest uppercase shadow-inner">UNLOCK FULL ACCESS TO THE ARENA</p>
          
          {status?.isActive && (
            <div className="mt-6 flex justify-center">
              <div className="hud-badge-gold px-6 py-3 text-lg shadow-[0_0_30px_rgba(255,215,0,0.5)]">
                <Check className="w-6 h-6" strokeWidth={3} /> Active {status.plan} plan — {status.daysRemaining} days left
              </div>
            </div>
          )}
        </div>

        <div className="grid md:grid-cols-3 gap-8 items-end max-w-5xl mx-auto">
          
          {/* Monthly */}
          <div className="card-game border-t-4 border-l-4 border-primary p-8 md:p-10 flex flex-col transition-all duration-300 animate-in slide-in-from-bottom-8 hover:-translate-y-2 hover:shadow-[0_20px_50px_rgba(0,0,0,0.5)]" style={{animationDelay: '100ms'}}>
            <div className="mb-8 border-b-2 border-white/10 pb-8">
              <h3 className="text-3xl font-display uppercase tracking-wider mb-4 text-primary text-outline">Casual</h3>
              <div className="flex items-start gap-2">
                <span className="text-xl font-bold text-white/50 mt-1">GHS</span>
                <span className="text-6xl font-display text-white text-outline">10</span>
                <span className="text-xl font-bold text-white/50 self-end mb-2">/mo</span>
              </div>
            </div>
            
            <ul className="space-y-5 mb-10 flex-1">
              <li className="flex items-center gap-4 text-white font-bold"><div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center border border-primary"><Check className="w-5 h-5 text-primary" strokeWidth={3} /></div> Full Arena Access</li>
              <li className="flex items-center gap-4 text-white font-bold"><div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center border border-primary"><Check className="w-5 h-5 text-primary" strokeWidth={3} /></div> Battle History</li>
              <li className="flex items-center gap-4 text-white font-bold"><div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center border border-primary"><Check className="w-5 h-5 text-primary" strokeWidth={3} /></div> Global Leaderboards</li>
            </ul>

            <button 
              onClick={() => handleSubscribe('monthly')}
              disabled={initPayment.isPending}
              className="w-full btn-game py-5 text-xl"
            >
              Select Casual
            </button>
          </div>

          {/* Semester */}
          <div className="card-game border-4 border-accent p-8 md:p-10 flex flex-col md:-translate-y-4 md:scale-105 z-10 shadow-[0_0_50px_hsl(var(--accent)/0.3)] bg-gradient-to-b from-black/80 to-black/60 animate-in slide-in-from-bottom-8" style={{animationDelay: '200ms'}}>
            <div className="absolute -top-5 left-1/2 -translate-x-1/2 bg-accent text-[#3b1a03] px-6 py-2 rounded-full font-display uppercase tracking-widest flex items-center gap-2 border-2 border-white shadow-[0_4px_0_#b57f00] text-sm whitespace-nowrap">
              <Star className="w-5 h-5 animate-pulse" fill="currentColor" /> Most Popular
            </div>
            
            <div className="mb-8 border-b-2 border-white/10 pb-8 mt-4">
              <h3 className="text-4xl font-display uppercase tracking-wider mb-4 text-accent text-outline drop-shadow-md">Semester</h3>
              <div className="flex items-start gap-2">
                <span className="text-xl font-bold text-white/50 mt-1">GHS</span>
                <span className="text-7xl font-display text-white text-outline">30</span>
                <span className="text-xl font-bold text-white/50 self-end mb-2">/4mo</span>
              </div>
            </div>
            
            <ul className="space-y-5 mb-8 flex-1">
              <li className="flex items-center gap-4 text-white font-bold"><div className="w-8 h-8 rounded-full bg-accent/20 flex items-center justify-center border border-accent"><Check className="w-5 h-5 text-accent" strokeWidth={3} /></div> Everything in Casual</li>
              <li className="flex items-center gap-4 text-white font-bold"><div className="w-8 h-8 rounded-full bg-accent/20 flex items-center justify-center border border-accent"><CircleDollarSign className="w-5 h-5 text-accent" strokeWidth={3} /></div> Save 25% vs Monthly</li>
              <li className="flex items-center gap-4 text-white font-bold"><div className="w-8 h-8 rounded-full bg-accent/20 flex items-center justify-center border border-accent"><Shield className="w-5 h-5 text-accent" strokeWidth={3} /></div> Covers full academic term</li>
            </ul>

            <div className="space-y-3 mb-8 p-5 bg-black/50 rounded-2xl border-2 border-white/10 shadow-inner">
              <label className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
                <Clock className="w-4 h-4 text-accent" /> Term Start Date
              </label>
              <Popover>
                <PopoverTrigger asChild>
                  <button
                    className={cn(
                      "w-full h-12 px-4 rounded-xl border-2 text-left font-bold transition-colors flex items-center text-lg bg-black/40",
                      semesterStart ? "border-accent text-white" : "border-white/20 text-white/50 hover:border-white/50"
                    )}
                  >
                    {semesterStart ? format(semesterStart, "PPP") : <span>Pick a date</span>}
                  </button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0 border-2 border-accent bg-black/90 backdrop-blur-xl rounded-2xl">
                  <Calendar
                    mode="single"
                    selected={semesterStart}
                    onSelect={setSemesterStart}
                    initialFocus
                    className="text-white"
                  />
                </PopoverContent>
              </Popover>
            </div>

            <button 
              onClick={() => handleSubscribe('semester')}
              disabled={initPayment.isPending}
              className="w-full btn-game-accent py-6 text-2xl animate-pulse"
            >
              Select Semester
            </button>
          </div>

          {/* Yearly */}
          <div className="card-game border-t-4 border-l-4 border-secondary p-8 md:p-10 flex flex-col transition-all duration-300 animate-in slide-in-from-bottom-8 hover:-translate-y-2 hover:shadow-[0_20px_50px_rgba(0,0,0,0.5)]" style={{animationDelay: '300ms'}}>
            <div className="mb-8 border-b-2 border-white/10 pb-8">
              <h3 className="text-3xl font-display uppercase tracking-wider mb-4 text-secondary text-outline">Hardcore</h3>
              <div className="flex items-start gap-2">
                <span className="text-xl font-bold text-white/50 mt-1">GHS</span>
                <span className="text-6xl font-display text-white text-outline">50</span>
                <span className="text-xl font-bold text-white/50 self-end mb-2">/yr</span>
              </div>
            </div>
            
            <ul className="space-y-5 mb-10 flex-1">
              <li className="flex items-center gap-4 text-white font-bold"><div className="w-8 h-8 rounded-full bg-secondary/20 flex items-center justify-center border border-secondary"><Check className="w-5 h-5 text-secondary" strokeWidth={3} /></div> Everything in Semester</li>
              <li className="flex items-center gap-4 text-white font-bold"><div className="w-8 h-8 rounded-full bg-secondary/20 flex items-center justify-center border border-secondary"><CircleDollarSign className="w-5 h-5 text-secondary" strokeWidth={3} /></div> Save 58% vs Monthly</li>
              <li className="flex items-center gap-4 text-white font-bold"><div className="w-8 h-8 rounded-full bg-secondary/20 flex items-center justify-center border border-secondary"><Trophy className="w-5 h-5 text-secondary" strokeWidth={3} /></div> Uninterrupted access</li>
            </ul>

            <button 
              onClick={() => handleSubscribe('yearly')}
              disabled={initPayment.isPending}
              className="w-full btn-game-secondary py-5 text-xl"
            >
              Select Yearly
            </button>
          </div>

        </div>
      </div>
    </Layout>
  );
}
