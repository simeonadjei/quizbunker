import { useEffect, useState } from 'react';
import { useVerifyPayment, getGetPaymentStatusQueryKey, getVerifyPaymentQueryKey } from '@workspace/api-client-react';
import { useLocation } from 'wouter';
import { Loader2, CheckCircle, XCircle } from 'lucide-react';
import { Layout } from '@/components/Layout';
import { Button } from '@/components/ui/button';
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
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <XCircle className="w-16 h-16 text-destructive mx-auto mb-4" />
            <h2 className="text-2xl font-bold uppercase mb-2">Invalid Request</h2>
            <Link href="/subscribe">
              <Button variant="outline">Return to Plans</Button>
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
      <div className="flex-1 flex items-center justify-center p-4">
        <div className="bg-card border border-border p-8 rounded-2xl max-w-md w-full text-center">
          {isLoading ? (
            <div className="py-8">
              <Loader2 className="w-16 h-16 animate-spin text-primary mx-auto mb-6" />
              <h2 className="text-xl font-mono uppercase text-muted-foreground animate-pulse">Verifying Payment...</h2>
            </div>
          ) : error || !data?.success ? (
            <div className="py-8 animate-in zoom-in-95">
              <XCircle className="w-16 h-16 text-destructive mx-auto mb-6" />
              <h2 className="text-2xl font-bold uppercase mb-2 text-destructive">Transaction Failed</h2>
              <p className="text-muted-foreground mb-8">We couldn't confirm your payment. Please try again.</p>
              <Link href="/subscribe">
                <Button className="w-full uppercase font-bold neon-button" variant="destructive">Return</Button>
              </Link>
            </div>
          ) : (
            <div className="py-8 animate-in zoom-in-95">
              <CheckCircle className="w-16 h-16 text-primary mx-auto mb-6" />
              <h2 className="text-3xl font-black uppercase mb-2 text-primary glow-text">Power Up Complete!</h2>
              <p className="text-muted-foreground mb-8">Your account has been upgraded to the {data.plan} plan.</p>
              <Link href="/dashboard">
                <Button className="w-full bg-primary text-primary-foreground uppercase font-bold neon-button py-6">Enter the Arena</Button>
              </Link>
            </div>
          )}
        </div>
      </div>
    </Layout>
  );
}
