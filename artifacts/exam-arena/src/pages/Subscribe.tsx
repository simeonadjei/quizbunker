import { useGetPaymentStatus, getGetPaymentStatusQueryKey, useInitializePayment } from '@workspace/api-client-react';
import { Layout } from '@/components/Layout';
import { Zap, Check, Star, Shield, Clock, RefreshCw } from 'lucide-react';
import { useState } from 'react';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';

const PLANS = [
  {
    key: 'monthly' as const,
    label: 'Monthly',
    price: '10',
    period: '/mo',
    icon: <Clock className="w-5 h-5" />,
    color: 'border-t-secondary',
    textColor: 'text-secondary',
    perks: ['All subjects', 'All weeks', 'Dok 1–4 questions', 'Battle history'],
  },
  {
    key: 'semester' as const,
    label: 'Semester',
    price: '30',
    period: '/4 mo',
    icon: <Star className="w-5 h-5" />,
    color: 'border-t-accent',
    textColor: 'text-accent',
    featured: true,
    perks: ['Everything in Monthly', 'Best value for school term', 'Aligned to semester dates', '1,500+ questions'],
  },
  {
    key: 'yearly' as const,
    label: 'Yearly',
    price: '50',
    period: '/yr',
    icon: <Shield className="w-5 h-5" />,
    color: 'border-t-primary',
    textColor: 'text-primary',
    perks: ['Everything in Semester', 'Full academic year', 'All exam years', 'Priority access'],
  },
];

export default function Subscribe() {
  const { data: status } = useGetPaymentStatus({ query: { queryKey: getGetPaymentStatusQueryKey() } });
  const initPayment = useInitializePayment();
  const { toast } = useToast();
  const [semesterStart, setSemesterStart] = useState<Date>();
  const [selectedPlan, setSelectedPlan] = useState<'monthly' | 'semester' | 'yearly'>('semester');

  const handleSubscribe = () => {
    if (selectedPlan === 'semester' && !semesterStart) {
      toast({ title: 'Date required', description: 'Select your semester start date.', variant: 'destructive' });
      return;
    }
    initPayment.mutate({
      data: {
        plan: selectedPlan,
        semesterStart: selectedPlan === 'semester' && semesterStart
          ? semesterStart.toISOString().split('T')[0]
          : undefined,
      }
    }, {
      onSuccess: (res) => {
        // Store reference so the user can re-verify if the redirect fails
        localStorage.setItem('pendingPayRef', res.reference ?? '');
        window.location.href = res.authorizationUrl;
      },
      onError: () => toast({ title: 'Error', description: 'Could not start payment.', variant: 'destructive' }),
    });
  };

  const pendingRef = typeof window !== 'undefined' ? localStorage.getItem('pendingPayRef') : null;

  return (
    <Layout>
      <div className="px-4 py-5 max-w-lg mx-auto w-full">

        {/* Header */}
        <div className="text-center mb-6">
          <div
            className="w-14 h-14 bg-accent rounded-2xl flex items-center justify-center mx-auto mb-3 border-2 border-white/50"
            style={{ boxShadow: '0 5px 0 hsl(38 90% 30%), 0 8px 16px rgba(0,0,0,0.4)' }}
          >
            <Zap className="w-7 h-7 text-accent-foreground" fill="currentColor" />
          </div>
          <h1 className="text-game-title text-3xl leading-tight">UNLOCK FULL ACCESS</h1>
          <p className="text-white/60 text-sm mt-1 font-bold">1,500+ questions — Dok 1 to 4 per subject</p>
        </div>

        {/* Active sub notice */}
        {status?.isActive && (
          <div className="card-game border-l-4 border-accent p-4 mb-5 flex items-center gap-3">
            <Check className="w-5 h-5 text-accent shrink-0" strokeWidth={3} />
            <span className="text-white font-bold text-sm">
              Active {status.plan} plan — {status.daysRemaining} days remaining
            </span>
          </div>
        )}

        {/* Pending payment recovery — shown when user paid but redirect failed */}
        {!status?.isActive && pendingRef && (
          <div className="card-game border-l-4 border-primary p-4 mb-5 flex items-start gap-3">
            <RefreshCw className="w-5 h-5 text-primary shrink-0 mt-0.5" />
            <div className="flex-1 min-w-0">
              <p className="text-white font-bold text-sm mb-2">
                You have a pending payment. If you already paid, tap below to confirm.
              </p>
              <a
                href={`/subscribe/verify?reference=${encodeURIComponent(pendingRef)}`}
                className="btn-game py-2 px-4 text-sm inline-flex"
              >
                Verify My Payment
              </a>
            </div>
          </div>
        )}

        {/* Plan selector */}
        <div className="flex gap-2 mb-4">
          {PLANS.map(p => (
            <button
              key={p.key}
              onClick={() => setSelectedPlan(p.key)}
              className={cn(
                'flex-1 py-2.5 rounded-2xl font-display text-sm border-2 transition-all duration-150',
                selectedPlan === p.key
                  ? 'bg-primary text-white border-white/40 shadow-[0_4px_0_hsl(22,90%,30%)]'
                  : 'bg-black/30 text-white/60 border-white/15 hover:border-white/30'
              )}
            >
              {p.label}
            </button>
          ))}
        </div>

        {/* Selected plan detail card */}
        {PLANS.map(p => {
          if (p.key !== selectedPlan) return null;
          return (
            <div key={p.key} className={`card-game border-t-4 ${p.color} p-5 mb-4`}>
              <div className="flex items-start justify-between mb-4">
                <div>
                  <div className={`flex items-center gap-1.5 font-display ${p.textColor} text-lg mb-1`}>
                    {p.icon} {p.label}
                  </div>
                  <div className="flex items-baseline gap-1">
                    <span className="text-white/50 text-sm font-bold">GHS</span>
                    <span className="text-5xl font-display text-white leading-none">{p.price}</span>
                    <span className="text-white/50 text-sm font-bold self-end pb-1">{p.period}</span>
                  </div>
                </div>
                {p.featured && (
                  <span className="hud-badge-gold text-xs px-2.5 py-1">BEST VALUE</span>
                )}
              </div>

              <ul className="space-y-2 mb-5">
                {p.perks.map(perk => (
                  <li key={perk} className="flex items-center gap-2 text-white/80 text-sm font-bold">
                    <Check className="w-4 h-4 text-accent shrink-0" strokeWidth={3} />
                    {perk}
                  </li>
                ))}
              </ul>

              {/* Semester date picker */}
              {p.key === 'semester' && (
                <div className="mb-4">
                  <p className="text-white/60 text-xs font-bold uppercase tracking-wider mb-2">Semester start date</p>
                  <Popover>
                    <PopoverTrigger asChild>
                      <button className="btn-game-ghost w-full py-2.5 text-sm justify-center">
                        {semesterStart ? format(semesterStart, 'MMM d, yyyy') : 'Pick a date'}
                      </button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0 bg-card border-2 border-border rounded-2xl" align="center">
                      <Calendar
                        mode="single"
                        selected={semesterStart}
                        onSelect={setSemesterStart}
                        disabled={(d) => d < new Date()}
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                </div>
              )}

              <button
                onClick={handleSubscribe}
                disabled={initPayment.isPending}
                className="btn-game w-full py-4 text-lg justify-center"
              >
                {initPayment.isPending ? 'Redirecting...' : `Pay GHS ${p.price}`}
              </button>
            </div>
          );
        })}

        <p className="text-center text-white/40 text-xs font-bold">
          Secure payment via Paystack. Cancel anytime.
        </p>

      </div>
    </Layout>
  );
}
