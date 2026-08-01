import { useEffect, useState } from 'react';
import { Layout } from '@/components/Layout';
import { Loader2, CheckCircle2, XCircle, Mail } from 'lucide-react';
import { Link } from 'wouter';

// On Render the frontend and API are separate services — VITE_API_URL points at
// the API origin. On Replit (same-origin proxy) it is undefined and '' is correct.
const API_BASE = (import.meta.env.VITE_API_URL as string | undefined) ?? '';
// Cross-origin (Render) requires credentials: 'include' so session cookies travel.
const FETCH_CREDS: RequestCredentials = API_BASE ? 'include' : 'same-origin';

export default function VerifyEmail() {
  const params = new URLSearchParams(window.location.search);
  const token = params.get('token');

  const [status, setStatus] = useState<'loading' | 'success' | 'error' | 'notoken'>('loading');
  const [message, setMessage] = useState('');

  // Resend state
  const [resendEmail, setResendEmail] = useState('');
  const [resendStatus, setResendStatus] = useState<'idle' | 'sending' | 'sent' | 'error'>('idle');

  useEffect(() => {
    if (!token) {
      setStatus('notoken');
      return;
    }

    fetch(`${API_BASE}/api/auth/verify-email`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: FETCH_CREDS,
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

  const handleResend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!resendEmail.trim()) return;
    setResendStatus('sending');
    try {
      const res = await fetch(`${API_BASE}/api/auth/resend-verification`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: FETCH_CREDS,
        body: JSON.stringify({ email: resendEmail.trim() }),
      });
      if (res.ok) {
        setResendStatus('sent');
      } else {
        setResendStatus('error');
      }
    } catch {
      setResendStatus('error');
    }
  };

  return (
    <Layout>
      <div className="flex-1 flex items-center justify-center px-6 py-12">
        <div className="w-full max-w-sm text-center space-y-4">
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
                <button className="btn-game w-full py-3 justify-center mt-2">Go to Login</button>
              </Link>
            </div>
          )}

          {status === 'error' && (
            <div className="card-game p-8 space-y-4">
              <XCircle className="w-14 h-14 text-red-400 mx-auto" />
              <h2 className="text-game-title text-xl text-red-400">LINK EXPIRED</h2>
              <p className="text-white/70 text-sm font-bold">{message}</p>
              <ResendForm
                email={resendEmail}
                setEmail={setResendEmail}
                status={resendStatus}
                onSubmit={handleResend}
              />
            </div>
          )}

          {status === 'notoken' && (
            <div className="card-game p-8 space-y-4">
              <Mail className="w-14 h-14 text-secondary mx-auto" />
              <h2 className="text-game-title text-xl">CHECK YOUR EMAIL</h2>
              <p className="text-white/55 text-sm font-bold leading-relaxed">
                We sent a verification link to your email. Click the link to activate your account.
              </p>
              <p className="text-white/35 text-xs">Didn't get it? Check your spam folder or resend below.</p>
              <ResendForm
                email={resendEmail}
                setEmail={setResendEmail}
                status={resendStatus}
                onSubmit={handleResend}
              />
              <Link href="/login">
                <button className="btn-game-ghost w-full py-2.5 text-sm justify-center mt-1">Back to Login</button>
              </Link>
            </div>
          )}
        </div>
      </div>
    </Layout>
  );
}

function ResendForm({
  email, setEmail, status, onSubmit,
}: {
  email: string;
  setEmail: (v: string) => void;
  status: 'idle' | 'sending' | 'sent' | 'error';
  onSubmit: (e: React.FormEvent) => void;
}) {
  if (status === 'sent') {
    return (
      <div className="bg-secondary/10 border border-secondary/40 rounded-xl p-3 text-secondary text-sm font-bold">
        ✅ New link sent! Check your inbox (and spam).
      </div>
    );
  }

  return (
    <form onSubmit={onSubmit} className="space-y-2 text-left">
      <label className="text-white/60 text-xs font-bold uppercase tracking-wider block">
        Resend verification email
      </label>
      <input
        type="email"
        required
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        placeholder="your@email.com"
        className="w-full h-11 rounded-xl border-2 border-white/20 bg-black/40 px-3 text-white font-bold text-sm placeholder:text-white/30 focus:outline-none focus:border-primary"
      />
      {status === 'error' && (
        <p className="text-red-400 text-xs font-bold">Something went wrong. Try again shortly.</p>
      )}
      <button
        type="submit"
        disabled={status === 'sending'}
        className="btn-game w-full py-2.5 text-sm justify-center flex items-center gap-2"
      >
        {status === 'sending' ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Send new link'}
      </button>
    </form>
  );
}
