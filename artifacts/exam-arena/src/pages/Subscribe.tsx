import { useGetPaymentStatus, getGetPaymentStatusQueryKey, useSubmitMomoPayment } from '@workspace/api-client-react';
import { Layout } from '@/components/Layout';
import { Zap, Check, Star, Shield, Clock, Copy, CheckCircle2, AlertCircle, Loader2 } from 'lucide-react';
import { useState } from 'react';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';
import { Link } from 'wouter';

const MOMO_NAME = 'Simeon Adjei';
const MOMO_NUMBER = '0538025040';

const PLANS = [
  {
    key: 'monthly' as const,
    label: 'Monthly',
    price: '15',
    amount: 15,
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
    amount: 30,
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
    price: '60',
    amount: 60,
    period: '/yr',
    icon: <Shield className="w-5 h-5" />,
    color: 'border-t-primary',
    textColor: 'text-primary',
    perks: ['Everything in Semester', 'Full academic year', 'All exam years', 'Priority access'],
  },
];

export default function Subscribe() {
  const { data: status } = useGetPaymentStatus({ query: { queryKey: getGetPaymentStatusQueryKey() } });
  const submitPayment = useSubmitMomoPayment();
  const { toast } = useToast();

  const [selectedPlan, setSelectedPlan] = useState<'monthly' | 'semester' | 'yearly'>('semester');
  const [step, setStep] = useState<'plan' | 'pay' | 'done'>('plan');
  const [txId, setTxId] = useState('');
  const [copied, setCopied] = useState(false);

  const plan = PLANS.find(p => p.key === selectedPlan)!;

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }).catch(() => {});
  };

  const handleSubmit = () => {
    const clean = txId.trim();
    if (!clean) {
      toast({ title: 'Transaction ID required', description: 'Enter the ID from your MoMo message.', variant: 'destructive' });
      return;
    }
    submitPayment.mutate(
      { data: { plan: selectedPlan, txId: clean } },
      {
        onSuccess: () => setStep('done'),
        onError: () => toast({ title: 'Error', description: 'Could not submit payment. Try again.', variant: 'destructive' }),
      },
    );
  };

  if (step === 'done') {
    return (
      <Layout>
        <div className="flex-1 flex items-center justify-center px-4 py-8">
          <div className="card-game p-8 max-w-sm w-full text-center space-y-5">
            <div className="w-20 h-20 rounded-full mx-auto flex items-center justify-center"
              style={{ background: 'hsl(145 60% 15%)', border: '3px solid #25D366' }}>
              <CheckCircle2 className="w-10 h-10" style={{ color: '#25D366' }} />
            </div>
            <h2 className="text-game-title text-2xl">PAYMENT SUBMITTED!</h2>
            <p className="text-white/70 text-sm font-bold leading-relaxed">
              We've received your transaction details. Your account will be activated shortly after we verify the payment on our MoMo.
            </p>
            <div className="rounded-xl p-4 text-left space-y-1" style={{ background: 'hsl(240 32% 11%)', border: '1px solid hsl(240 30% 22%)' }}>
              <p className="text-white/50 text-xs font-bold uppercase tracking-wider">What happens next?</p>
              <p className="text-white/80 text-sm">1. Admin checks MoMo and verifies your transaction ID</p>
              <p className="text-white/80 text-sm">2. You receive an email confirming your subscription</p>
              <p className="text-white/80 text-sm">3. Log back in and start playing!</p>
            </div>
            <Link href="/dashboard">
              <button className="btn-game w-full py-4 justify-center">Go to Dashboard</button>
            </Link>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="flex-1 flex items-start justify-center px-4 py-6">
      <div className="w-full max-w-sm">

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

        {step === 'plan' && (
          <>
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

                  <button
                    onClick={() => setStep('pay')}
                    className="btn-game w-full py-4 text-lg justify-center"
                  >
                    Pay with MoMo — GHS {p.price}
                  </button>
                </div>
              );
            })}

            <p className="text-center text-white font-bold text-base">
              Manual MoMo payment. Verified by admin within minutes.
            </p>
          </>
        )}

        {step === 'pay' && (
          <div className="space-y-4">
            {/* Back */}
            <button onClick={() => setStep('plan')} className="text-white/50 text-sm font-bold flex items-center gap-1 hover:text-white/80 transition-colors">
              ← Back to plans
            </button>

            {/* Step 1 — Send money */}
            <div className="card-game p-5 space-y-4">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-full bg-primary flex items-center justify-center text-white font-display text-sm shrink-0">1</div>
                <h3 className="font-display text-white text-base">Send GHS {plan.price} via MoMo</h3>
              </div>

              {/* MoMo recipient */}
              <div className="rounded-2xl p-4 space-y-3"
                style={{ background: 'hsl(145 60% 8%)', border: '1.5px solid hsl(145 60% 25%)' }}>
                <p className="text-white/50 text-xs font-bold uppercase tracking-wider">Send to this number</p>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-white font-display text-lg">{MOMO_NAME}</p>
                    <p className="font-mono text-2xl font-bold" style={{ color: '#25D366' }}>{MOMO_NUMBER}</p>
                  </div>
                  <button
                    onClick={() => handleCopy(MOMO_NUMBER)}
                    className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold transition-all"
                    style={{ background: copied ? 'hsl(145 60% 20%)' : 'hsl(145 60% 12%)', color: copied ? '#25D366' : '#ccc', border: '1px solid hsl(145 50% 25%)' }}
                  >
                    {copied ? <CheckCircle2 className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                    {copied ? 'Copied' : 'Copy'}
                  </button>
                </div>
                <div className="rounded-xl p-3 space-y-1" style={{ background: 'hsl(145 50% 6%)', border: '1px solid hsl(145 50% 18%)' }}>
                  <p className="text-white/50 text-xs font-bold uppercase tracking-widest mb-2">USSD Instructions</p>
                  <p className="text-white/80 text-sm">• MTN: Dial <span className="font-mono font-bold text-white">*170#</span> → Send Money → Enter number</p>
                  <p className="text-white/80 text-sm">• Vodafone: Dial <span className="font-mono font-bold text-white">*110#</span> → Send Money</p>
                  <p className="text-white/80 text-sm">• AirtelTigo: Dial <span className="font-mono font-bold text-white">*100#</span> → Send Money</p>
                </div>
                <div className="flex items-start gap-2 rounded-xl p-3" style={{ background: 'hsl(45 100% 10%)', border: '1px solid hsl(45 100% 25%)' }}>
                  <AlertCircle className="w-4 h-4 text-accent shrink-0 mt-0.5" />
                  <p className="text-xs font-bold" style={{ color: 'hsl(45 100% 75%)' }}>
                    Before confirming, make sure the name shows as <strong>"{MOMO_NAME}"</strong>. Do not send if a different name appears.
                  </p>
                </div>
              </div>
            </div>

            {/* Step 2 — Enter txId */}
            <div className="card-game p-5 space-y-4">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-full bg-primary flex items-center justify-center text-white font-display text-sm shrink-0">2</div>
                <h3 className="font-display text-white text-base">Enter your Transaction ID</h3>
              </div>
              <p className="text-white/60 text-sm">After sending, you'll get a confirmation SMS from MoMo with a Transaction ID (e.g. <span className="font-mono text-white/80">AB12345678</span>). Enter it below.</p>
              <input
                type="text"
                value={txId}
                onChange={e => setTxId(e.target.value.toUpperCase())}
                placeholder="e.g. AB12345678"
                className="w-full h-14 rounded-2xl border-2 border-white/20 bg-black/40 px-4 text-white font-mono font-bold text-lg placeholder:text-white/30 focus:outline-none focus:border-primary tracking-widest"
                autoComplete="off"
              />

              <button
                onClick={handleSubmit}
                disabled={submitPayment.isPending || !txId.trim()}
                className="btn-game w-full py-4 text-lg justify-center flex items-center gap-2"
              >
                {submitPayment.isPending
                  ? <><Loader2 className="w-5 h-5 animate-spin" /> Submitting...</>
                  : 'Payment Made — Submit'}
              </button>
            </div>

            <p className="text-center text-white/30 text-xs font-bold px-2">
              Your transaction ID is only used to verify your payment. We cannot charge or access your MoMo account.
            </p>
          </div>
        )}

      </div>
      </div>
    </Layout>
  );
}
