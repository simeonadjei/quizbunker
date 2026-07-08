import { useEffect, useState } from 'react';
import { useLocation, Link } from 'wouter';
import { Layout } from '@/components/Layout';
import { Loader2, CheckCircle2, XCircle, Mail } from 'lucide-react';

export default function VerifyEmail() {
  const [location] = useLocation();
  const params = new URLSearchParams(window.location.search);
  const token = params.get('token');

  const [status, setStatus] = useState<'loading' | 'success' | 'error' | 'notoken'>('loading');
  const [message, setMessage] = useState('');

  useEffect(() => {
    if (!token) {
      setStatus('notoken');
      return;
    }

    fetch('/api/auth/verify-email', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ token }),
    })
      .then(async (res) => {
        const data = await res.json();
        if (res.ok) {
          setStatus('success');
          setMessage(data.message || 'Email verified!');
        } else {
          setStatus('error');
          setMessage(data.error || 'Verification failed.');
        }
      })
      .catch(() => {
        setStatus('error');
        setMessage('Network error. Please try again.');
      });
  }, [token]);

  return (
    <Layout>
      <div className="flex-1 flex items-center justify-center px-6 py-12">
        <div className="w-full max-w-sm text-center">
          {status === 'loading' && (
            <div className="card-game p-8 space-y-4">
              <Loader2 className="w-14 h-14 text-secondary animate-spin mx-auto" />
              <h2 className="text-game-title text-xl">VERIFYING...</h2>
              <p className="text-white/55 text-sm font-bold">Checking your verification link</p>
            </div>
          )}

          {status === 'success' && (
            <div className="card-game p-8 space-y-4">
              <CheckCircle2 className="w-14 h-14 text-green-400 mx-auto" />
              <h2 className="text-game-title text-xl text-green-400">VERIFIED! 🎉</h2>
              <p className="text-white/70 text-sm font-bold">{message}</p>
              <Link href="/login">
                <button className="btn-game w-full py-3 justify-center mt-2">
                  Go to Login
                </button>
              </Link>
            </div>
          )}

          {status === 'error' && (
            <div className="card-game p-8 space-y-4">
              <XCircle className="w-14 h-14 text-red-400 mx-auto" />
              <h2 className="text-game-title text-xl text-red-400">FAILED</h2>
              <p className="text-white/70 text-sm font-bold">{message}</p>
              <Link href="/register">
                <button className="btn-game w-full py-3 justify-center mt-2">
                  Back to Register
                </button>
              </Link>
            </div>
          )}

          {status === 'notoken' && (
            <div className="card-game p-8 space-y-4">
              <Mail className="w-14 h-14 text-secondary mx-auto" />
              <h2 className="text-game-title text-xl">CHECK YOUR EMAIL</h2>
              <p className="text-white/55 text-sm font-bold leading-relaxed">
                We sent a verification link to your email. Click the link in the email to activate your account.
              </p>
              <p className="text-white/35 text-xs">Didn't get it? Check your spam folder.</p>
              <Link href="/login">
                <button className="btn-game w-full py-3 justify-center mt-2">
                  Back to Login
                </button>
              </Link>
            </div>
          )}
        </div>
      </div>
    </Layout>
  );
}
