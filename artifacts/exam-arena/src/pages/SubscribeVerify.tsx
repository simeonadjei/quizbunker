import { useEffect, useState } from 'react';
import { useVerifyPayment, getGetPaymentStatusQueryKey, getVerifyPaymentQueryKey } from '@workspace/api-client-react';
import { useLocation } from 'wouter';
import { Loader2, CheckCircle, XCircle, ShieldAlert, Sparkles } from 'lucide-react';
import { Layout } from '@/components/Layout';
import { Link } from 'wouter';
import { useQueryClient } from '@tanstack/react-query';

export default function SubscribeVerify() {
  const [reference, setReference] = useState<string | null>(null);
  
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const ref = params.get('reference');
    if (ref) setReference(ref);
  }, []);

  if (!reference) {
    return (
      <Layout>
        <div className="flex-1 flex items-center justify-center p-4">
          <div className="card-game p-10 text-center max-w-md w-full border-l-4 border-t-4 border-destructive">
            <div className="w-24 h-24 bg-destructive rounded-full flex items-center justify-center mx-auto mb-6 shadow-[0_0_30px_hsl(var(--destructive))] border-4 border-white/50">
              <ShieldAlert className="w-12 h-12 text-white" />
            </div>
            <h2 className="text-3xl font-display uppercase mb-4 text-white text-outline">Invalid Request</h2>
            <Link href="/subscribe">
              <button className="btn-game-secondary w-full py-4 text-xl mt-4">Return to Plans</button>
            </Link>
          </div>
        </div>
      </Layout>
    );
  }

  return <VerifyProcessor reference={reference} />;
}

function VerifyProcessor({ reference }: { reference: string }) {
  const { data, isLoading, error } = useVerifyPayment(reference, { query: { enabled: true, retry: false, queryKey: getVerifyPaymentQueryKey(reference) } });
  const queryClient = useQueryClient();
  
  useEffect(() => {
    if (data?.success) {
      queryClient.invalidateQueries({ queryKey: getGetPaymentStatusQueryKey() });
    }
  }, [data, queryClient]);

  return (
    <Layout>
      <div className="flex-1 flex items-center justify-center p-4 relative">
        
        {/* Success Confetti Background */}
        {!isLoading && !error && data?.success && (
          <div className="fixed inset-0 pointer-events-none overflow-hidden z-0">
            {Array.from({ length: 30 }).map((_, i) => (
              <div 
                key={i} 
                className="absolute top-[-10%] w-4 h-4 rounded-full animate-confettiFall opacity-60"
                style={{
                  left: `${Math.random() * 100}%`,
                  backgroundColor: ['#ffaa00', '#00ffcc', '#ff0055'][Math.floor(Math.random() * 3)],
                  animationDelay: `${Math.random() * 2}s`,
                  animationDuration: `${Math.random() * 2 + 2}s`
                }}
              />
            ))}
          </div>
        )}

        <div className="card-game p-10 border-t-4 border-l-4 max-w-md w-full text-center relative z-10 border-accent">
          {isLoading ? (
            <div className="py-10">
              <div className="w-24 h-24 bg-accent/20 rounded-full flex items-center justify-center mx-auto mb-6 border-4 border-accent shadow-[0_0_30px_hsl(var(--accent)/0.5)]">
                <Loader2 className="w-12 h-12 animate-spin text-accent" />
              </div>
              <h2 className="text-2xl font-display uppercase tracking-widest text-accent text-outline animate-pulse">Verifying Payment...</h2>
            </div>
          ) : error || !data?.success ? (
            <div className="py-6 animate-in zoom-in-95 border-destructive border-t-4 border-l-4 -m-10 p-10 rounded-[inherit] bg-black/60 backdrop-blur-md">
              <div className="w-24 h-24 bg-destructive rounded-full flex items-center justify-center mx-auto mb-6 shadow-[0_0_30px_hsl(var(--destructive))] border-4 border-white/50">
                <XCircle className="w-12 h-12 text-white" strokeWidth={3} />
              </div>
              <h2 className="text-3xl font-display uppercase mb-4 text-destructive text-outline">Transaction Failed</h2>
              <p className="text-white/80 font-bold mb-8 bg-black/40 p-4 rounded-xl border border-white/10">We couldn't confirm your payment. Please try again.</p>
              <Link href="/subscribe">
                <button className="btn-game-destructive w-full py-4 text-xl">Return to Shop</button>
              </Link>
            </div>
          ) : (
            <div className="py-6 animate-in zoom-in-95">
              <div className="relative inline-block mb-6">
                <div className="absolute inset-0 bg-accent/40 blur-[40px] rounded-full" />
                <div className="w-24 h-24 bg-accent rounded-full flex items-center justify-center border-4 border-white shadow-[0_0_40px_hsl(var(--accent))] relative z-10 animate-starPulse">
                  <CheckCircle className="w-12 h-12 text-[#3b1a03]" strokeWidth={3} />
                </div>
              </div>
              <h2 className="text-4xl font-black uppercase mb-4 text-accent text-outline drop-shadow-md">Power Up Complete!</h2>
              <p className="text-white/90 font-bold mb-8 bg-black/40 p-4 rounded-xl border border-white/10 text-lg">
                Your account has been upgraded to the <span className="text-accent uppercase tracking-widest">{data.plan}</span> plan.
              </p>
              <Link href="/dashboard">
                <button className="w-full btn-game py-5 text-2xl flex items-center justify-center gap-3 animate-pulse">
                  <Sparkles className="w-6 h-6" /> Enter the Bunker
                </button>
              </Link>
            </div>
          )}
        </div>
      </div>
    </Layout>
  );
}
