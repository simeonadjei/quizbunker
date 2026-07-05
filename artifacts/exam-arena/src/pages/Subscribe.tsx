import { useGetPaymentStatus, getGetPaymentStatusQueryKey, useInitializePayment } from '@workspace/api-client-react';
import { Layout } from '@/components/Layout';
import { Button } from '@/components/ui/button';
import { Zap, Check, Star, Shield, Clock } from 'lucide-react';
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
      <div className="container mx-auto px-4 py-12 max-w-6xl">
        <div className="text-center mb-16 animate-in slide-in-from-bottom-4">
          <h1 className="text-4xl md:text-5xl font-black uppercase tracking-tight text-accent glow-text flex items-center justify-center gap-3">
            <Zap className="w-10 h-10" fill="currentColor" /> POWER UP
          </h1>
          <p className="text-muted-foreground mt-4 font-mono">UNLOCK FULL ACCESS TO THE ARENA</p>
          
          {status?.isActive && (
            <div className="mt-6 inline-flex items-center gap-2 bg-primary/10 border border-primary text-primary px-4 py-2 rounded-full font-mono text-sm">
              <Check className="w-4 h-4" /> Active {status.plan} plan — {status.daysRemaining} days remaining
            </div>
          )}
        </div>

        <div className="grid md:grid-cols-3 gap-8">
          
          {/* Monthly */}
          <div className="bg-card border border-border p-8 rounded-2xl relative flex flex-col hover:border-primary/50 transition-colors animate-in slide-in-from-bottom-8" style={{animationDelay: '100ms'}}>
            <div className="mb-8">
              <h3 className="text-2xl font-bold uppercase tracking-wider mb-2 text-foreground">Casual</h3>
              <div className="text-4xl font-black">GHS 10<span className="text-lg text-muted-foreground font-normal">/mo</span></div>
            </div>
            
            <ul className="space-y-4 mb-8 flex-1">
              <li className="flex gap-3 text-muted-foreground"><Check className="w-5 h-5 text-primary shrink-0" /> Full Arena Access</li>
              <li className="flex gap-3 text-muted-foreground"><Check className="w-5 h-5 text-primary shrink-0" /> Battle History</li>
              <li className="flex gap-3 text-muted-foreground"><Check className="w-5 h-5 text-primary shrink-0" /> Global Leaderboards</li>
            </ul>

            <Button 
              onClick={() => handleSubscribe('monthly')}
              disabled={initPayment.isPending}
              className="w-full neon-button border border-primary text-primary hover:bg-primary hover:text-primary-foreground font-bold uppercase py-6"
              variant="outline"
            >
              Select Monthly
            </Button>
          </div>

          {/* Semester */}
          <div className="bg-card border border-secondary p-8 rounded-2xl relative flex flex-col shadow-[0_0_30px_-10px_hsl(var(--secondary)/0.4)] md:scale-105 z-10 animate-in slide-in-from-bottom-8" style={{animationDelay: '200ms'}}>
            <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-secondary text-secondary-foreground px-4 py-1 rounded-full text-xs font-bold uppercase tracking-wider flex items-center gap-1 whitespace-nowrap">
              <Star className="w-3 h-3" fill="currentColor" /> Most Popular
            </div>
            
            <div className="mb-6">
              <h3 className="text-2xl font-bold uppercase tracking-wider mb-2 text-secondary">Semester</h3>
              <div className="text-4xl font-black">GHS 30<span className="text-lg text-muted-foreground font-normal">/4mo</span></div>
            </div>
            
            <ul className="space-y-4 mb-6 flex-1">
              <li className="flex gap-3"><Check className="w-5 h-5 text-secondary shrink-0" /> Everything in Casual</li>
              <li className="flex gap-3"><Check className="w-5 h-5 text-secondary shrink-0" /> Save 25% vs Monthly</li>
              <li className="flex gap-3"><Check className="w-5 h-5 text-secondary shrink-0" /> Covers full academic term</li>
            </ul>

            <div className="space-y-2 mb-6 p-4 bg-background/50 rounded-xl border border-border">
              <label className="text-xs font-mono text-muted-foreground uppercase block">Select Term Start Date</label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "w-full justify-start text-left font-mono border-secondary/30 hover:border-secondary focus:ring-secondary",
                      !semesterStart && "text-muted-foreground"
                    )}
                  >
                    <Clock className="mr-2 h-4 w-4" />
                    {semesterStart ? format(semesterStart, "PPP") : <span>Pick a date</span>}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0 border-secondary bg-card">
                  <Calendar
                    mode="single"
                    selected={semesterStart}
                    onSelect={setSemesterStart}
                    initialFocus
                    className="bg-card text-foreground"
                  />
                </PopoverContent>
              </Popover>
            </div>

            <Button 
              onClick={() => handleSubscribe('semester')}
              disabled={initPayment.isPending}
              className="w-full neon-button bg-secondary text-secondary-foreground hover:bg-secondary/90 font-bold uppercase py-6"
            >
              Select Semester
            </Button>
          </div>

        {/* Yearly */}
        <div className="bg-card border border-border p-8 rounded-2xl relative flex flex-col hover:border-accent/50 transition-colors animate-in slide-in-from-bottom-8" style={{animationDelay: '300ms'}}>
          <div className="mb-8">
            <h3 className="text-2xl font-bold uppercase tracking-wider mb-2 text-foreground">Hardcore</h3>
            <div className="text-4xl font-black">GHS 50<span className="text-lg text-muted-foreground font-normal">/yr</span></div>
          </div>
          
          <ul className="space-y-4 mb-8 flex-1">
            <li className="flex gap-3 text-muted-foreground"><Check className="w-5 h-5 text-accent shrink-0" /> Everything in Semester</li>
            <li className="flex gap-3 text-muted-foreground"><Check className="w-5 h-5 text-accent shrink-0" /> Save 58% vs Monthly</li>
            <li className="flex gap-3 text-muted-foreground"><Shield className="w-5 h-5 text-accent shrink-0" /> Uninterrupted access</li>
          </ul>

          <Button 
            onClick={() => handleSubscribe('yearly')}
            disabled={initPayment.isPending}
            className="w-full neon-button border border-accent text-accent hover:bg-accent hover:text-accent-foreground font-bold uppercase py-6"
            variant="outline"
          >
            Select Yearly
          </Button>
        </div>

        </div>
      </div>
    </Layout>
  );
}
