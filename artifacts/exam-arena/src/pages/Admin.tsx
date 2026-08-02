import { useState } from 'react';
import {
  useAdminLogin,
  useGetAdminStats,
  useListAdminUsers,
  useListSongs,
  useUpdateSong,
  useDeleteSong,
  useListAdminActivity,
  useListAdminPayments,
  useVerifyMomoPayment,
  useAdminSubscribeUser,
  useListAdminReferrals,
  useNotifyReferralPaid,
  getGetAdminStatsQueryKey,
  getListSongsQueryKey,
  getListAdminUsersQueryKey,
  getListAdminActivityQueryKey,
  getListAdminPaymentsQueryKey,
  getListAdminReferralsQueryKey,
  type AdminSubscribeInputPlan,
} from '@workspace/api-client-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import {
  Loader2, Upload, Trash2, CheckCircle, ShieldAlert, Activity,
  CreditCard, RefreshCw, Mail, Lock, UserPlus, CheckCircle2, XCircle, Gift,
} from 'lucide-react';
import { Switch } from '@/components/ui/switch';
import { format } from 'date-fns';
import { useQueryClient } from '@tanstack/react-query';

// Prepend the API base URL for direct fetch calls (cross-origin on Render)
const API_BASE = (import.meta.env.VITE_API_URL as string | undefined) ?? '';

export default function AdminPortal() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  if (!isAuthenticated) {
    return <AdminLogin onLogin={() => setIsAuthenticated(true)} />;
  }

  return (
    <div className="min-h-screen bg-zinc-900 text-gray-200 p-8 font-mono">
      <div className="max-w-6xl mx-auto space-y-12">
        <header className="border-b border-red-500/30 pb-4 mb-8 flex items-start justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-red-500">SYSTEM.ADMIN_OVERRIDE</h1>
            <p className="text-gray-500 text-sm mt-1">UNAUTHORIZED ACCESS STRICTLY PROHIBITED</p>
          </div>
          <button
            onClick={() => setIsAuthenticated(false)}
            className="flex items-center gap-2 px-4 py-2 bg-zinc-800 hover:bg-red-950 border border-zinc-700 hover:border-red-500/60 text-zinc-400 hover:text-red-400 text-sm font-bold rounded transition-colors shrink-0"
            title="Lock screen"
          >
            <Lock className="w-4 h-4" />
            LOCK SCREEN
          </button>
        </header>

        <StatsPanel />
        <EmailTestPanel />
        <PendingPaymentsPanel />
        <ManualSubscribePanel />

        <div className="grid md:grid-cols-2 gap-8">
          <QuestionUploader />
          <SongManager />
        </div>

        <ReferralEarningsPanel />
        <UsersPanel />
        <ActivityPanel />
        <PaymentsPanel />
      </div>
    </div>
  );
}

// ── Pending Payments Verification ─────────────────────────────────────────────

function PendingPaymentsPanel() {
  const queryClient = useQueryClient();
  const { data: payments = [], isFetching } = useListAdminPayments({
    query: { queryKey: getListAdminPaymentsQueryKey() }
  });
  const verify = useVerifyMomoPayment();
  const { toast } = useToast();
  const [txInputs, setTxInputs] = useState<Record<number, string>>({});
  const [verifying, setVerifying] = useState<Record<number, boolean>>({});

  const pending = payments.filter(p => p.status === 'pending' || p.status === 'mismatch');

  const handleVerify = async (paymentId: number) => {
    const txId = (txInputs[paymentId] ?? '').trim();
    if (!txId) {
      toast({ title: 'Enter transaction ID', description: 'Type the ID from your MoMo.', variant: 'destructive' });
      return;
    }
    setVerifying(v => ({ ...v, [paymentId]: true }));
    verify.mutate(
      { id: paymentId, data: { txId } },
      {
        onSuccess: (result) => {
          if (result.match) {
            toast({ title: '✅ Verified!', description: result.message });
          } else {
            toast({ title: '❌ Mismatch', description: result.message, variant: 'destructive' });
          }
          queryClient.invalidateQueries({ queryKey: getListAdminPaymentsQueryKey() });
          setTxInputs(v => { const n = { ...v }; delete n[paymentId]; return n; });
        },
        onError: () => toast({ title: 'Error', description: 'Verification failed.', variant: 'destructive' }),
        onSettled: () => setVerifying(v => ({ ...v, [paymentId]: false })),
      }
    );
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-bold text-yellow-400 flex items-center gap-2">
          <CreditCard className="w-5 h-5" /> PENDING PAYMENTS
          {pending.length > 0 && (
            <span className="text-xs bg-yellow-400/20 text-yellow-400 border border-yellow-400/30 px-2 py-0.5 rounded">
              {pending.length} awaiting
            </span>
          )}
        </h2>
        <Button
          size="sm"
          variant="ghost"
          onClick={() => queryClient.invalidateQueries({ queryKey: getListAdminPaymentsQueryKey() })}
          className="text-zinc-500 hover:text-zinc-300"
        >
          {isFetching ? <Loader2 className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4" />}
        </Button>
      </div>

      {pending.length === 0 ? (
        <div className="rounded border border-zinc-800 px-4 py-8 text-center text-zinc-600 text-sm">
          No pending payments.
        </div>
      ) : (
        <div className="space-y-3">
          {pending.map(p => (
            <div key={p.id} className="rounded border border-yellow-500/20 bg-zinc-900 p-4">
              <div className="flex flex-wrap gap-x-6 gap-y-1 text-xs mb-3">
                <span className="text-zinc-400"><span className="text-zinc-600">USER:</span> {p.userName ?? '—'} ({p.userEmail ?? '—'})</span>
                <span className="text-zinc-400"><span className="text-zinc-600">PLAN:</span> <span className="text-yellow-400 uppercase">{p.plan}</span></span>
                <span className="text-zinc-400"><span className="text-zinc-600">AMOUNT:</span> GHS {((p.amount ?? 0) / 100).toFixed(2)}</span>
                <span className="text-zinc-400"><span className="text-zinc-600">DATE:</span> {format(new Date(p.createdAt), 'MM-dd HH:mm')}</span>
                {p.status === 'mismatch' && (
                  <span className="text-red-400 font-bold">MISMATCH — user re-notified</span>
                )}
              </div>
              <div className="flex items-center gap-2 mb-1">
                <span className="text-zinc-600 text-xs shrink-0">USER'S TX ID:</span>
                <span className="font-mono font-bold text-cyan-400 text-sm">{p.userTxId ?? '(not provided)'}</span>
              </div>
              <p className="text-zinc-600 text-xs mb-3">Check your MoMo and enter the transaction ID you received below:</p>
              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder="Your MoMo transaction ID"
                  value={txInputs[p.id] ?? ''}
                  onChange={e => setTxInputs(v => ({ ...v, [p.id]: e.target.value.toUpperCase() }))}
                  className="flex-1 bg-black border border-zinc-700 text-zinc-300 font-mono text-sm rounded px-3 py-2 placeholder:text-zinc-600 focus:outline-none focus:border-yellow-500"
                />
                <button
                  onClick={() => handleVerify(p.id)}
                  disabled={verifying[p.id]}
                  className="px-4 py-2 bg-yellow-700 hover:bg-yellow-600 text-white text-sm font-bold rounded flex items-center gap-2 disabled:opacity-50 shrink-0"
                >
                  {verifying[p.id]
                    ? <Loader2 className="w-4 h-4 animate-spin" />
                    : <CheckCircle2 className="w-4 h-4" />}
                  Verify
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ── Manual Subscribe ───────────────────────────────────────────────────────────

function ManualSubscribePanel() {
  const subscribeUser = useAdminSubscribeUser();
  const { toast } = useToast();
  const [email, setEmail] = useState('');
  const [plan, setPlan] = useState<AdminSubscribeInputPlan>('monthly');
  const [months, setMonths] = useState('');
  const [genPassword, setGenPassword] = useState(false);
  const [result, setResult] = useState<{ message: string; generatedPassword?: string | null } | null>(null);

  const handleSubmit = () => {
    if (!email.trim()) {
      toast({ title: 'Email required', variant: 'destructive' });
      return;
    }
    subscribeUser.mutate(
      {
        data: {
          email: email.trim().toLowerCase(),
          plan,
          months: months ? parseInt(months, 10) : undefined,
          generatePassword: genPassword,
        },
      },
      {
        onSuccess: (res) => {
          setResult(res);
          setEmail('');
          setMonths('');
          setGenPassword(false);
          toast({ title: '✅ Subscribed', description: res.message });
        },
        onError: () => toast({ title: 'Error', description: 'Could not subscribe user.', variant: 'destructive' }),
      },
    );
  };

  return (
    <div className="bg-zinc-900 border border-zinc-800 p-6">
      <h2 className="text-xl font-bold text-green-400 flex items-center gap-2 mb-4">
        <UserPlus className="w-5 h-5" /> MANUAL SUBSCRIBE
      </h2>
      <p className="text-zinc-500 text-xs mb-4">
        Subscribe any user directly. Optionally generate a new password (useful for accounts you're creating on behalf of someone).
      </p>

      <div className="grid md:grid-cols-2 gap-4 mb-4">
        <div>
          <label className="text-xs text-zinc-500 uppercase tracking-wider block mb-1">User Email</label>
          <input
            type="email"
            value={email}
            onChange={e => setEmail(e.target.value)}
            placeholder="user@example.com"
            className="w-full bg-black border border-zinc-700 text-zinc-300 text-sm rounded px-3 py-2 placeholder:text-zinc-600 focus:outline-none focus:border-green-500"
          />
        </div>
        <div>
          <label className="text-xs text-zinc-500 uppercase tracking-wider block mb-1">Plan</label>
          <select
            value={plan}
            onChange={e => setPlan(e.target.value as AdminSubscribeInputPlan)}
            className="w-full bg-black border border-zinc-700 text-zinc-300 text-sm rounded px-3 py-2 focus:outline-none focus:border-green-500"
          >
            <option value="trial">Trial (2 days)</option>
            <option value="monthly">Monthly (1 month)</option>
            <option value="semester">Semester (4 months)</option>
            <option value="yearly">Yearly (12 months)</option>
            <option value="lifetime">Lifetime (unlimited)</option>
          </select>
        </div>
        <div>
          <label className="text-xs text-zinc-500 uppercase tracking-wider block mb-1">Custom Duration (months) — optional</label>
          <input
            type="number"
            min="1"
            max="120"
            value={months}
            onChange={e => setMonths(e.target.value)}
            placeholder="Leave blank to use plan default"
            className="w-full bg-black border border-zinc-700 text-zinc-300 text-sm rounded px-3 py-2 placeholder:text-zinc-600 focus:outline-none focus:border-green-500"
          />
        </div>
        <div className="flex items-center gap-3 mt-5">
          <Switch checked={genPassword} onCheckedChange={setGenPassword} />
          <span className="text-zinc-400 text-sm">Generate &amp; email new password</span>
        </div>
      </div>

      <button
        onClick={handleSubmit}
        disabled={subscribeUser.isPending}
        className="px-5 py-2 bg-green-800 hover:bg-green-700 text-white text-sm font-bold rounded flex items-center gap-2 disabled:opacity-50"
      >
        {subscribeUser.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <UserPlus className="w-4 h-4" />}
        Subscribe User
      </button>

      {result && (
        <div className="mt-4 p-4 bg-black border border-green-500/30 text-green-400 text-sm space-y-1 rounded">
          <div><CheckCircle className="w-4 h-4 inline mr-2" />SUCCESS</div>
          <div>{result.message}</div>
          {result.generatedPassword && (
            <div className="mt-2 text-cyan-400">
              GENERATED PASSWORD: <span className="font-mono font-bold text-lg">{result.generatedPassword}</span>
              <span className="text-zinc-500 text-xs ml-2">(sent to user via email)</span>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ── Activity Feed ─────────────────────────────────────────────────────────────

const TYPE_COLORS: Record<string, string> = {
  register: 'text-cyan-400',
  login: 'text-green-400',
  logout: 'text-zinc-400',
  email_verify: 'text-blue-400',
  resend_verification: 'text-yellow-400',
  password_reset_request: 'text-orange-400',
  password_reset: 'text-orange-300',
  payment_init: 'text-purple-400',
  payment_success: 'text-emerald-400',
  quiz_start: 'text-sky-400',
  quiz_complete: 'text-indigo-400',
  admin_login: 'text-red-400',
};

function ActivityPanel() {
  const [typeFilter, setTypeFilter] = useState('');
  const queryClient = useQueryClient();
  const { data: logs = [], isFetching } = useListAdminActivity(
    typeFilter ? { type: typeFilter } : undefined,
    { query: { queryKey: getListAdminActivityQueryKey(typeFilter ? { type: typeFilter } : undefined) } }
  );

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-bold text-red-500 flex items-center gap-2">
          <Activity className="w-5 h-5" /> ACTIVITY LOG
        </h2>
        <div className="flex gap-2 items-center">
          <select
            value={typeFilter}
            onChange={e => setTypeFilter(e.target.value)}
            className="bg-zinc-900 border border-zinc-700 text-zinc-300 text-xs rounded px-2 py-1.5"
          >
            <option value="">ALL EVENTS</option>
            {Object.keys(TYPE_COLORS).map(t => (
              <option key={t} value={t}>{t.toUpperCase()}</option>
            ))}
          </select>
          <Button
            size="sm"
            variant="ghost"
            onClick={() => queryClient.invalidateQueries({ queryKey: getListAdminActivityQueryKey() })}
            className="text-zinc-500 hover:text-zinc-300"
          >
            {isFetching ? <Loader2 className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4" />}
          </Button>
        </div>
      </div>
      <div className="overflow-x-auto rounded border border-zinc-800">
        <table className="w-full text-xs">
          <thead className="bg-zinc-900 text-zinc-500 text-left uppercase tracking-wider">
            <tr>
              <th className="px-4 py-3 font-normal">WHEN</th>
              <th className="px-4 py-3 font-normal">EVENT</th>
              <th className="px-4 py-3 font-normal">USER</th>
              <th className="px-4 py-3 font-normal">IP</th>
              <th className="px-4 py-3 font-normal">META</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-800/60">
            {logs.length === 0 && !isFetching && (
              <tr><td colSpan={5} className="px-4 py-6 text-center text-zinc-600">No activity yet</td></tr>
            )}
            {logs.map(log => (
              <tr key={log.id} className="hover:bg-zinc-800/30">
                <td className="px-4 py-2.5 text-zinc-500 whitespace-nowrap">
                  {format(new Date(log.createdAt), 'MM-dd HH:mm:ss')}
                </td>
                <td className={`px-4 py-2.5 font-mono font-bold whitespace-nowrap ${TYPE_COLORS[log.type] ?? 'text-zinc-300'}`}>
                  {log.type}
                </td>
                <td className="px-4 py-2.5 text-zinc-400">
                  {log.userName ?? log.userEmail ?? (log.userId ? `#${log.userId}` : '—')}
                </td>
                <td className="px-4 py-2.5 text-zinc-600">{log.ip ?? '—'}</td>
                <td className="px-4 py-2.5 text-zinc-600 font-mono text-[10px] max-w-xs truncate">
                  {log.metadata ?? ''}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ── Payments Panel (history) ──────────────────────────────────────────────────

function PaymentsPanel() {
  const queryClient = useQueryClient();
  const { data: payments = [], isFetching } = useListAdminPayments({
    query: { queryKey: getListAdminPaymentsQueryKey() }
  });

  const STATUS_COLORS: Record<string, string> = {
    success: 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30',
    pending: 'bg-yellow-500/20 text-yellow-400 border border-yellow-500/30',
    mismatch: 'bg-red-500/20 text-red-400 border border-red-500/30',
    failed: 'bg-red-500/20 text-red-400 border border-red-500/30',
  };

  const total = payments.filter(p => p.status === 'success').reduce((s, p) => s + p.amount, 0);

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-bold text-red-500 flex items-center gap-2">
          <CreditCard className="w-5 h-5" /> ALL PAYMENTS
          {total > 0 && (
            <span className="text-xs text-emerald-400 font-normal ml-2">
              Total verified: GHS {(total / 100).toFixed(2)}
            </span>
          )}
        </h2>
        <Button
          size="sm"
          variant="ghost"
          onClick={() => queryClient.invalidateQueries({ queryKey: getListAdminPaymentsQueryKey() })}
          className="text-zinc-500 hover:text-zinc-300"
        >
          {isFetching ? <Loader2 className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4" />}
        </Button>
      </div>
      <div className="overflow-x-auto rounded border border-zinc-800">
        <table className="w-full text-xs">
          <thead className="bg-zinc-900 text-zinc-500 text-left uppercase tracking-wider">
            <tr>
              <th className="px-4 py-3 font-normal">DATE</th>
              <th className="px-4 py-3 font-normal">USER</th>
              <th className="px-4 py-3 font-normal">PLAN</th>
              <th className="px-4 py-3 font-normal">AMOUNT</th>
              <th className="px-4 py-3 font-normal">STATUS</th>
              <th className="px-4 py-3 font-normal">USER TX ID</th>
              <th className="px-4 py-3 font-normal">EXPIRES</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-800/60">
            {payments.length === 0 && !isFetching && (
              <tr><td colSpan={7} className="px-4 py-6 text-center text-zinc-600">No payments yet</td></tr>
            )}
            {payments.map(p => (
              <tr key={p.id} className="hover:bg-zinc-800/30">
                <td className="px-4 py-2.5 text-zinc-500 whitespace-nowrap">
                  {format(new Date(p.createdAt), 'yyyy-MM-dd')}
                </td>
                <td className="px-4 py-2.5 text-zinc-300">
                  <div>{p.userName ?? '—'}</div>
                  <div className="text-zinc-600">{p.userEmail ?? ''}</div>
                </td>
                <td className="px-4 py-2.5 text-zinc-300 uppercase">{p.plan}</td>
                <td className="px-4 py-2.5 text-zinc-300">GHS {(p.amount / 100).toFixed(2)}</td>
                <td className="px-4 py-2.5">
                  <span className={`px-2 py-0.5 rounded text-[10px] ${STATUS_COLORS[p.status] ?? 'text-zinc-500'}`}>
                    {p.status.toUpperCase()}
                  </span>
                </td>
                <td className="px-4 py-2.5 text-cyan-400 font-mono text-[10px]">{p.userTxId ?? '—'}</td>
                <td className="px-4 py-2.5 text-zinc-500">
                  {p.endDate ? format(new Date(p.endDate), 'yyyy-MM-dd') : '—'}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function AdminLogin({ onLogin }: { onLogin: () => void }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const login = useAdminLogin();
  const { toast } = useToast();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    login.mutate({ data: { email, password } }, {
      onSuccess: () => onLogin(),
      onError: (err: unknown) => {
        const status = (err as { status?: number })?.status ?? (err as { response?: { status?: number } })?.response?.status;
        const description = status === 401
          ? "Wrong email or password."
          : status === 503
          ? "Server is temporarily unavailable. Try again in a moment."
          : "Login failed — please try again.";
        toast({ title: "Access Denied", description, variant: "destructive" });
      }
    });
  };

  return (
    <div className="min-h-screen bg-black flex items-center justify-center p-4">
      <form onSubmit={handleSubmit} className="border border-red-500/50 p-8 bg-zinc-950 w-full max-w-sm rounded font-mono shadow-[0_0_30px_-5px_rgba(239,68,68,0.3)]">
        <ShieldAlert className="w-12 h-12 text-red-500 mx-auto mb-6" />
        <h2 className="text-red-500 text-center mb-6 text-xl">AUTHENTICATION REQUIRED</h2>
        <Input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="bg-black border-red-500/30 text-red-500 focus-visible:ring-red-500 rounded-none mb-3"
          placeholder="ADMIN EMAIL"
          autoComplete="email"
        />
        <Input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="bg-black border-red-500/30 text-red-500 focus-visible:ring-red-500 rounded-none mb-4"
          placeholder="ENTER PASSKEY"
          autoComplete="current-password"
        />
        <Button
          type="submit"
          className="w-full bg-red-950 hover:bg-red-900 text-red-500 border border-red-500 rounded-none"
          disabled={login.isPending}
        >
          {login.isPending ? "VERIFYING..." : "ACCESS"}
        </Button>
      </form>
    </div>
  );
}

function StatsPanel() {
  const { data: stats } = useGetAdminStats({ query: { enabled: true, queryKey: getGetAdminStatsQueryKey() } });

  if (!stats) return null;

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
      {[
        { label: "TOTAL USERS", val: stats.totalUsers },
        { label: "ACTIVE SUBS", val: stats.activeSubscribers, color: "text-green-400" },
        { label: "QUESTIONS", val: stats.totalQuestions },
        { label: "SUBJECTS", val: stats.totalSubjects },
        { label: "SONGS", val: stats.totalSongs },
        { label: "SESSIONS", val: stats.recentSessions },
      ].map(s => (
        <div key={s.label} className="bg-zinc-900 border border-zinc-800 p-4">
          <div className="text-zinc-500 text-xs mb-1">{s.label}</div>
          <div className={`text-2xl font-bold ${s.color || 'text-zinc-100'}`}>{s.val}</div>
        </div>
      ))}
    </div>
  );
}

function QuestionUploader() {
  const { toast } = useToast();
  const [files, setFiles] = useState<File[]>([]);
  const [year, setYear] = useState('');
  const [subject, setSubject] = useState('');
  const [progress, setProgress] = useState<{ done: number; total: number; current: string } | null>(null);
  const [summary, setSummary] = useState<{ inserted: number; skipped: number; failed: string[] } | null>(null);

  const isUploading = progress !== null;

  const handleUpload = async () => {
    if (files.length === 0) return;
    setSummary(null);
    setProgress({ done: 0, total: files.length, current: files[0].name });

    let totalInserted = 0;
    let totalSkipped = 0;
    const failed: string[] = [];

    for (let i = 0; i < files.length; i++) {
      const f = files[i];
      setProgress({ done: i, total: files.length, current: f.name });

      const formData = new FormData();
      formData.append("file", f);
      if (year) formData.append("year", year);
      if (subject) formData.append("subject", subject);

      try {
        const res = await fetch(`${API_BASE}/api/admin/questions/upload`, {
          method: 'POST',
          body: formData,
          credentials: "include"
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || 'Upload failed');
        totalInserted += data.inserted ?? 0;
        totalSkipped += data.skipped ?? 0;
      } catch (e: unknown) {
        failed.push(`${f.name}: ${(e as Error).message}`);
      }
    }

    setProgress(null);
    setSummary({ inserted: totalInserted, skipped: totalSkipped, failed });
    setFiles([]);

    if (failed.length === 0) {
      toast({ title: `${files.length} file${files.length > 1 ? 's' : ''} ingested successfully` });
    } else {
      toast({ title: `${files.length - failed.length}/${files.length} succeeded`, variant: "destructive" });
    }
  };

  return (
    <div className="bg-zinc-900 border border-zinc-800 p-6">
      <h3 className="text-xl font-bold mb-4 flex items-center gap-2"><Upload className="w-5 h-5" /> BULK INGEST QUESTIONS</h3>

      <div className="space-y-4">
        <div>
          <label className="text-xs text-zinc-500">FILES (.docx, .txt) — SELECT ONE OR MANY</label>
          <Input
            type="file"
            accept=".docx,.txt"
            multiple
            onChange={(e) => setFiles(Array.from(e.target.files || []))}
            className="bg-black border-zinc-700 mt-1"
            disabled={isUploading}
          />
          {files.length > 1 && (
            <div className="mt-2 space-y-1 max-h-40 overflow-y-auto">
              {files.map((f, i) => (
                <div key={i} className="flex items-center justify-between text-xs text-zinc-400 bg-black border border-zinc-800 px-3 py-1.5">
                  <span className="truncate mr-2">{f.name}</span>
                  <span className="text-zinc-600 shrink-0">{(f.size / 1024).toFixed(0)} KB</span>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="text-xs text-zinc-500">YEAR OVERRIDE (OPTIONAL)</label>
            <Input value={year} onChange={(e) => setYear(e.target.value)} className="bg-black border-zinc-700 mt-1" placeholder="e.g. 2023" disabled={isUploading} />
          </div>
          <div>
            <label className="text-xs text-zinc-500">SUBJECT OVERRIDE (OPTIONAL)</label>
            <Input value={subject} onChange={(e) => setSubject(e.target.value)} className="bg-black border-zinc-700 mt-1" placeholder="e.g. MATH" disabled={isUploading} />
          </div>
        </div>

        <Button
          onClick={handleUpload}
          disabled={files.length === 0 || isUploading}
          className="w-full bg-blue-900 hover:bg-blue-800 text-blue-400 border border-blue-500 rounded-none"
        >
          {isUploading ? (
            <span className="flex items-center gap-2">
              <Loader2 className="w-4 h-4 animate-spin" />
              {progress!.done}/{progress!.total} — {progress!.current}
            </span>
          ) : (
            files.length > 1 ? `INGEST ${files.length} FILES` : "EXECUTE INGEST"
          )}
        </Button>

        {summary && (
          <div className="mt-4 p-4 bg-black border border-green-500/30 text-sm space-y-1">
            <div className="text-green-400"><CheckCircle className="w-4 h-4 inline mr-2" />INGEST COMPLETE</div>
            <div className="text-green-400">INSERTED: {summary.inserted}</div>
            <div className="text-zinc-400">SKIPPED: {summary.skipped}</div>
            {summary.failed.length > 0 && (
              <div className="mt-2 space-y-1">
                <div className="text-red-400 text-xs font-bold">FAILED ({summary.failed.length}):</div>
                {summary.failed.map((msg, i) => (
                  <div key={i} className="text-red-400 text-xs pl-2 border-l border-red-800">{msg}</div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

function SongManager() {
  const { data: songs = [], refetch } = useListSongs({ query: { enabled: true, queryKey: getListSongsQueryKey() } });
  const updateSong = useUpdateSong();
  const deleteSong = useDeleteSong();
  const { toast } = useToast();

  const [files, setFiles] = useState<File[]>([]);
  const [uploadProgress, setUploadProgress] = useState<{ done: number; total: number } | null>(null);
  const [isDeletingAll, setIsDeletingAll] = useState(false);

  // Upload files one-by-one so each request finishes well within Render's timeout
  const handleUpload = async () => {
    if (files.length === 0) return;
    setUploadProgress({ done: 0, total: files.length });

    let succeeded = 0;
    const failed: string[] = [];

    for (let i = 0; i < files.length; i++) {
      const f = files[i];
      const formData = new FormData();
      formData.append("file", f);

      try {
        const res = await fetch(`${API_BASE}/api/admin/songs`, {
          method: 'POST',
          body: formData,
          credentials: "include",
        });
        if (!res.ok) {
          let msg = `HTTP ${res.status}`;
          try { const d = await res.json(); msg = d.error || msg; } catch { /* ignore */ }
          failed.push(`${f.name}: ${msg}`);
        } else {
          succeeded++;
        }
      } catch (e: unknown) {
        failed.push(`${f.name}: ${(e as Error).message}`);
      }

      setUploadProgress({ done: i + 1, total: files.length });
    }

    setUploadProgress(null);
    setFiles([]);
    refetch();

    if (failed.length === 0) {
      toast({ title: `${succeeded} Track${succeeded > 1 ? 's' : ''} Added` });
    } else {
      toast({
        title: `${succeeded} uploaded, ${failed.length} failed`,
        description: failed.join('\n'),
        variant: "destructive",
      });
    }
  };

  const handleDeleteAll = async () => {
    if (!window.confirm(`Delete all ${songs.length} songs? This cannot be undone.`)) return;
    setIsDeletingAll(true);
    try {
      const res = await fetch(`${API_BASE}/api/admin/songs`, {
        method: 'DELETE',
        credentials: "include",
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      toast({ title: "All songs deleted" });
      refetch();
    } catch (e: unknown) {
      toast({ title: "Delete failed", description: (e as Error).message, variant: "destructive" });
    } finally {
      setIsDeletingAll(false);
    }
  };

  const isUploading = uploadProgress !== null;

  return (
    <div className="bg-zinc-900 border border-zinc-800 p-6 flex flex-col h-full">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-xl font-bold">AUDIO SUBSYSTEM</h3>
        {songs.length > 0 && (
          <button
            onClick={handleDeleteAll}
            disabled={isDeletingAll}
            className="flex items-center gap-1.5 px-3 py-1 text-xs font-bold text-red-400 hover:text-red-300 border border-red-800 hover:border-red-600 bg-red-950/40 hover:bg-red-950/70 rounded transition-colors disabled:opacity-50"
          >
            {isDeletingAll ? <Loader2 className="w-3 h-3 animate-spin" /> : <Trash2 className="w-3 h-3" />}
            DELETE ALL
          </button>
        )}
      </div>

      <div className="space-y-4 mb-8">
        <div>
          <label className="text-xs text-zinc-500">AUDIO FILES (select multiple)</label>
          <Input
            type="file"
            accept="audio/*"
            multiple
            onChange={(e) => setFiles(Array.from(e.target.files || []))}
            className="bg-black border-zinc-700 mt-1 p-1 text-sm"
            disabled={isUploading}
          />
          {files.length > 0 && (
            <div className="mt-2 space-y-1">
              {files.map((f, i) => (
                <div key={i} className="text-xs text-zinc-400 flex items-center gap-2">
                  <span className="text-zinc-600">▶</span>
                  <span className="truncate">{f.name}</span>
                  <span className="text-zinc-600 shrink-0">({(f.size / 1024 / 1024).toFixed(1)} MB)</span>
                </div>
              ))}
            </div>
          )}
        </div>
        <Button
          onClick={handleUpload}
          disabled={files.length === 0 || isUploading}
          className="w-full bg-zinc-800 hover:bg-zinc-700 text-zinc-300 rounded-none border border-zinc-600"
        >
          {isUploading ? (
            <span className="flex items-center gap-2">
              <Loader2 className="w-4 h-4 animate-spin" />
              Uploading {uploadProgress!.done}/{uploadProgress!.total}…
            </span>
          ) : `UPLOAD ${files.length > 1 ? `${files.length} TRACKS` : 'TRACK'}`}
        </Button>
      </div>

      <div className="flex-1 overflow-auto bg-black border border-zinc-800 p-2">
        {songs.length === 0 && (
          <p className="text-xs text-zinc-600 text-center py-4">No songs yet</p>
        )}
        {songs.map(song => (
          <div key={song.id} className="flex items-center justify-between p-2 border-b border-zinc-900 hover:bg-zinc-900/50">
            <span className="text-sm truncate mr-4">{song.title}</span>
            <div className="flex items-center gap-4 shrink-0">
              <Switch
                checked={song.isActive}
                onCheckedChange={(v) => updateSong.mutate({ id: song.id, data: { isActive: v } }, { onSuccess: () => refetch() })}
              />
              <button
                onClick={() => deleteSong.mutate({ id: song.id }, { onSuccess: () => refetch() })}
                className="text-red-500 hover:text-red-400"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function EmailTestPanel() {
  const [to, setTo] = useState('');
  const [status, setStatus] = useState<'idle' | 'loading' | 'ok' | 'error'>('idle');
  const [message, setMessage] = useState('');

  const handleTest = async () => {
    setStatus('loading');
    setMessage('');
    try {
      const res = await fetch(`${API_BASE}/api/admin/test-email`, {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ to: to.trim() || undefined }),
      });
      const raw = await res.text();
      let data: { ok?: boolean; message?: string; error?: string } = {};
      try {
        data = raw.trim() ? JSON.parse(raw) : {};
      } catch {
        setStatus('error');
        setMessage(`Unexpected response (HTTP ${res.status}): ${raw.slice(0, 200) || '(empty body)'}`);
        return;
      }
      if (data.ok) {
        setStatus('ok');
        setMessage(data.message ?? 'Email sent successfully');
      } else {
        setStatus('error');
        const detail = data.error ?? `HTTP ${res.status} — unexpected response: ${raw.slice(0, 300)}`;
        setMessage(detail);
      }
    } catch (err) {
      setStatus('error');
      setMessage(err instanceof Error ? err.message : 'Network error — could not reach the API');
    }
  };

  return (
    <div className="bg-zinc-900 border border-zinc-800 p-6">
      <h2 className="text-xl font-bold text-red-500 flex items-center gap-2 mb-4">
        <Mail className="w-5 h-5" /> EMAIL DIAGNOSTICS
      </h2>
      <p className="text-zinc-500 text-xs mb-4">
        Sends a test email via Brevo and shows the exact error if it fails.
      </p>
      <div className="flex gap-2 items-center">
        <input
          type="email"
          value={to}
          onChange={e => setTo(e.target.value)}
          placeholder="recipient@example.com (optional)"
          className="flex-1 bg-black border border-zinc-700 text-zinc-300 text-sm rounded px-3 py-2 placeholder:text-zinc-600 focus:outline-none focus:border-zinc-500"
        />
        <button
          onClick={handleTest}
          disabled={status === 'loading'}
          className="px-4 py-2 bg-red-700 hover:bg-red-600 text-white text-sm font-bold rounded flex items-center gap-2 disabled:opacity-50"
        >
          {status === 'loading' ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Send Test'}
        </button>
      </div>
      {message && (
        <div className={`mt-3 text-xs font-mono p-3 rounded border ${status === 'ok' ? 'bg-green-900/30 border-green-700 text-green-400' : 'bg-red-900/30 border-red-700 text-red-400'}`}>
          {status === 'ok' ? '✅ ' : '❌ '}{message}
        </div>
      )}
    </div>
  );
}

// ── Referral Earnings Panel ────────────────────────────────────────────────────

function ReferralEarningsPanel() {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const { data: rows = [], isLoading, refetch } = useListAdminReferrals({ query: { enabled: true, queryKey: getListAdminReferralsQueryKey() } });
  const notify = useNotifyReferralPaid();
  const [notifying, setNotifying] = useState<number | null>(null);

  const handleNotify = async (userId: number, userName: string) => {
    setNotifying(userId);
    notify.mutate(
      { userId },
      {
        onSuccess: (result) => {
          toast({ title: `Notified ${userName}`, description: (result as any).message ?? 'Earnings marked as paid and email sent.' });
          queryClient.invalidateQueries({ queryKey: getListAdminReferralsQueryKey() });
        },
        onError: (err: any) => {
          toast({ title: 'Error', description: err.error ?? 'Could not send notification.', variant: 'destructive' });
        },
        onSettled: () => setNotifying(null),
      },
    );
  };

  return (
    <div className="bg-zinc-900 border border-yellow-600/40 p-6">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Gift className="w-5 h-5 text-yellow-400" />
          <h3 className="text-xl font-bold text-yellow-400">REFERRAL CASHBACK</h3>
        </div>
        <button
          onClick={() => refetch()}
          className="text-xs text-zinc-500 hover:text-zinc-300 flex items-center gap-1 transition-colors"
        >
          <RefreshCw className="w-3 h-3" /> Refresh
        </button>
      </div>

      <p className="text-zinc-500 text-sm mb-5">
        Users earn 20% cashback when a friend they referred subscribes. Send payments manually between the 15th–20th, then click "Mark Paid &amp; Notify".
      </p>

      {isLoading && (
        <div className="flex items-center gap-2 text-zinc-500 py-4">
          <Loader2 className="w-4 h-4 animate-spin" /> Loading referral data…
        </div>
      )}

      {!isLoading && rows.length === 0 && (
        <p className="text-zinc-600 text-sm italic py-4">No referral earnings yet. Earnings appear here after a referred user subscribes.</p>
      )}

      {!isLoading && rows.length > 0 && (
        <div className="space-y-6">
          {rows.map((row) => {
            const pendingGhs = ((row.pendingAmount ?? 0) / 100).toFixed(2);
            const paidGhs = ((row.paidAmount ?? 0) / 100).toFixed(2);
            const hasPending = (row.pendingAmount ?? 0) > 0;
            const hasMomo = !!(row.momoName && row.momoNumber);

            return (
              <div key={row.userId} className="border border-zinc-800 rounded p-4 space-y-3">
                {/* User header */}
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="font-bold text-white">{row.userName}</p>
                    <p className="text-zinc-500 text-sm">{row.userEmail}</p>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="text-yellow-400 font-bold font-mono text-lg">GHS {pendingGhs} pending</p>
                    {Number(paidGhs) > 0 && (
                      <p className="text-green-600 text-xs font-mono">GHS {paidGhs} already paid</p>
                    )}
                  </div>
                </div>

                {/* MoMo details */}
                <div className="bg-zinc-800/50 rounded p-3 space-y-1">
                  <p className="text-xs text-zinc-500 uppercase tracking-wider mb-1">MoMo Cashback Details</p>
                  {hasMomo ? (
                    <>
                      <p className="text-sm"><span className="text-zinc-500">Name:</span> <span className="text-white font-bold">{row.momoName}</span></p>
                      <p className="text-sm font-mono"><span className="text-zinc-500">Number:</span> <span className="text-green-400 font-bold">{row.momoNumber}</span></p>
                    </>
                  ) : (
                    <p className="text-yellow-600 text-sm">⚠ User has not added MoMo details yet. Remind them before paying.</p>
                  )}
                </div>

                {/* Earnings breakdown */}
                {(row.earnings ?? []).length > 0 && (
                  <table className="w-full text-xs text-left border-collapse">
                    <thead>
                      <tr className="text-zinc-500 border-b border-zinc-800">
                        <th className="py-1 pr-3 font-normal">Referee</th>
                        <th className="py-1 pr-3 font-normal">Plan</th>
                        <th className="py-1 pr-3 font-normal text-right">Amount</th>
                        <th className="py-1 font-normal text-right">Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {row.earnings!.map((e: any) => (
                        <tr key={e.id} className="border-b border-zinc-800/50">
                          <td className="py-1.5 pr-3 text-zinc-300">{e.refereeName}</td>
                          <td className="py-1.5 pr-3 text-zinc-400 uppercase">{e.plan}</td>
                          <td className="py-1.5 pr-3 text-right font-mono text-yellow-400">GHS {(e.amount / 100).toFixed(2)}</td>
                          <td className="py-1.5 text-right">
                            {e.status === 'paid'
                              ? <span className="text-green-500">✓ Paid</span>
                              : <span className="text-yellow-600">⏳ Pending</span>}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}

                {/* Action button */}
                {hasPending && (
                  <button
                    onClick={() => handleNotify(row.userId!, row.userName!)}
                    disabled={notifying === row.userId}
                    className="flex items-center gap-2 px-4 py-2 bg-yellow-600 hover:bg-yellow-500 disabled:opacity-50 text-black font-bold text-sm rounded transition-colors"
                  >
                    {notifying === row.userId
                      ? <><Loader2 className="w-4 h-4 animate-spin" /> Notifying…</>
                      : <><Mail className="w-4 h-4" /> Mark Paid &amp; Notify User</>}
                  </button>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

function UsersPanel() {
  const { data: users = [] } = useListAdminUsers({ query: { enabled: true, queryKey: getListAdminUsersQueryKey() } });

  return (
    <div className="bg-zinc-900 border border-zinc-800 p-6">
      <h3 className="text-xl font-bold mb-4">USER DATABASE</h3>
      <div className="overflow-x-auto">
        <table className="w-full text-sm text-left">
          <thead className="text-xs text-zinc-500 bg-black">
            <tr>
              <th className="px-4 py-3 font-normal">ID</th>
              <th className="px-4 py-3 font-normal">NAME</th>
              <th className="px-4 py-3 font-normal">EMAIL</th>
              <th className="px-4 py-3 font-normal">PLAN</th>
              <th className="px-4 py-3 font-normal">EXPIRES</th>
              <th className="px-4 py-3 font-normal">CREATED</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-800">
            {users.map(u => (
              <tr key={u.id} className="hover:bg-zinc-800/50">
                <td className="px-4 py-3 text-zinc-500">{u.id}</td>
                <td className="px-4 py-3 text-zinc-300">{u.name}</td>
                <td className="px-4 py-3 text-zinc-400">{u.email}</td>
                <td className="px-4 py-3">
                  <span className={`px-2 py-0.5 rounded text-xs ${u.subscriptionPlan !== 'none' ? 'bg-green-500/20 text-green-400 border border-green-500/30' : 'text-zinc-500'}`}>
                    {u.subscriptionPlan.toUpperCase()}
                  </span>
                </td>
                <td className="px-4 py-3 text-zinc-500">
                  {u.subscriptionEnd ? format(new Date(u.subscriptionEnd), 'yyyy-MM-dd') : '-'}
                </td>
                <td className="px-4 py-3 text-zinc-500">
                  {format(new Date(u.createdAt), 'yyyy-MM-dd')}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
