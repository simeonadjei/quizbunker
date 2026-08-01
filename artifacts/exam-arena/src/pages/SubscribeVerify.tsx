import { Layout } from '@/components/Layout';
import { CheckCircle2, Clock } from 'lucide-react';
import { Link } from 'wouter';

/**
 * Legacy route kept for backwards compat (/subscribe/verify).
 * The MoMo flow no longer redirects here — payment confirmation
 * is handled inline in Subscribe.tsx. This page simply shows a
 * "pending verification" holding screen.
 */
export default function SubscribeVerify() {
  return (
    <Layout>
      <div className="flex-1 flex items-center justify-center px-4 py-10">
        <div className="card-game p-10 max-w-sm w-full text-center space-y-6">
          <div className="w-20 h-20 rounded-full mx-auto flex items-center justify-center"
            style={{ background: 'hsl(45 100% 10%)', border: '3px solid hsl(45 100% 55%)' }}>
            <Clock className="w-10 h-10 text-accent animate-pulse" />
          </div>
          <h2 className="text-game-title text-2xl text-accent">PAYMENT PENDING</h2>
          <p className="text-white/70 text-sm font-bold leading-relaxed">
            Your payment is being verified. You'll receive an email as soon as your subscription is activated — usually within a few minutes.
          </p>
          <div className="rounded-xl p-4 text-left space-y-2" style={{ background: 'hsl(240 32% 11%)', border: '1px solid hsl(240 30% 22%)' }}>
            <p className="text-white/50 text-xs font-bold uppercase tracking-wider">What happens next?</p>
            <div className="flex items-start gap-2">
              <CheckCircle2 className="w-4 h-4 text-accent shrink-0 mt-0.5" />
              <p className="text-white/80 text-sm">Admin verifies your MoMo transaction ID</p>
            </div>
            <div className="flex items-start gap-2">
              <CheckCircle2 className="w-4 h-4 text-accent shrink-0 mt-0.5" />
              <p className="text-white/80 text-sm">You get an email confirming your subscription</p>
            </div>
            <div className="flex items-start gap-2">
              <CheckCircle2 className="w-4 h-4 text-accent shrink-0 mt-0.5" />
              <p className="text-white/80 text-sm">Log back in and play!</p>
            </div>
          </div>
          <Link href="/dashboard">
            <button className="btn-game w-full py-4 justify-center">Go to Dashboard</button>
          </Link>
        </div>
      </div>
    </Layout>
  );
}
