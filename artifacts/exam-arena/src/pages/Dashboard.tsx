import { Layout } from '@/components/Layout';
import {
  useGetQuestionFilters, useCreateQuizSession, useGetPaymentStatus,
  useGetReferralInfo, useSaveMomoDetails,
  getGetPaymentStatusQueryKey, getGetQuestionFiltersQueryKey, getGetReferralInfoQueryKey
} from '@workspace/api-client-react';
import { useState, useEffect } from 'react';
import { useLocation, Link } from 'wouter';
import { Loader2, Play, Lock, BookOpen, Sparkles, ChevronDown, Zap, X, WifiOff, ChevronUp, Gift, Copy, CheckCircle2, AlertTriangle, Check, Download } from 'lucide-react';
import { useOfflinePreCache } from '@/hooks/useOfflinePreCache';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';
import { useQueryClient } from '@tanstack/react-query';
import { getCachedSessionId, getCachedWeeksForSubject } from '@/lib/offlineSessions';
import { isSubscriptionActiveOffline } from '@/lib/offlineUser';

// ── Offline detection hook ─────────────────────────────────────────────────────
function useOnlineStatus() {
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  useEffect(() => {
    const on = () => setIsOnline(true);
    const off = () => setIsOnline(false);
    window.addEventListener('online', on);
    window.addEventListener('offline', off);
    return () => { window.removeEventListener('online', on); window.removeEventListener('offline', off); };
  }, []);
  return isOnline;
}

// ── Subscribe gate modal ───────────────────────────────────────────────────────
function SubscribeGate({ onClose }: { onClose: () => void }) {
  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-in fade-in">
      <div className="card-game w-full max-w-sm border-t-4 border-accent animate-in slide-in-from-bottom-8 sm:slide-in-from-bottom-0 sm:zoom-in-95">
        {/* Close */}
        <div className="flex items-start justify-between mb-5">
          <div className="w-14 h-14 rounded-2xl bg-accent/20 border-2 border-accent/50 flex items-center justify-center">
            <Lock className="w-7 h-7 text-accent" strokeWidth={2.5} />
          </div>
          <button
            onClick={onClose}
            className="w-9 h-9 flex items-center justify-center rounded-full text-white/40 hover:text-white hover:bg-white/10 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <h2 className="font-display text-white text-2xl uppercase mb-2">Level Locked</h2>
        <p className="text-white/70 text-base font-bold mb-6 leading-relaxed">
          This level requires an active subscription. Unlock full access to all 1,500+ questions across every subject and week.
        </p>

        {/* Feature highlights */}
        <div className="space-y-3 mb-7">
          {[
            'All subjects & weeks',
            'Dok 1–4 questions',
            'Certificates of Achievement',
            'Full battle history',
          ].map(f => (
            <div key={f} className="flex items-center gap-3 text-base text-white/80 font-bold">
              <Sparkles className="w-4 h-4 text-accent shrink-0" />
              {f}
            </div>
          ))}
        </div>

        <Link href="/subscribe" onClick={onClose}>
          <button className="btn-game w-full py-4 text-lg justify-center flex items-center gap-2">
            <Zap className="w-5 h-5" fill="currentColor" strokeWidth={0} />
            Unlock Full Access
          </button>
        </Link>

        <button
          onClick={onClose}
          className="btn-game-ghost w-full py-3 text-base justify-center mt-3"
        >
          Maybe later
        </button>
      </div>
    </div>
  );
}

// ── Referral & MoMo Modal ──────────────────────────────────────────────────────
function ReferralModal({ onClose }: { onClose: () => void }) {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const { data: referral, isLoading } = useGetReferralInfo({ query: { queryKey: getGetReferralInfoQueryKey() } });
  const saveMomo = useSaveMomoDetails();

  const [momoName, setMomoName] = useState('');
  const [momoNumber, setMomoNumber] = useState('');
  const [copiedLink, setCopiedLink] = useState(false);
  const [copiedCode, setCopiedCode] = useState(false);
  const [showMomoForm, setShowMomoForm] = useState(false);

  useEffect(() => {
    if (referral) {
      setMomoName(referral.momoName ?? '');
      setMomoNumber(referral.momoNumber ?? '');
    }
  }, [referral]);

  const referralLink = referral?.referralCode
    ? `${window.location.origin}/register?ref=${referral.referralCode}`
    : '';

  const handleCopyLink = () => {
    if (!referralLink) return;
    navigator.clipboard.writeText(referralLink).then(() => {
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 2000);
    });
  };

  const handleCopyCode = () => {
    if (!referral?.referralCode) return;
    navigator.clipboard.writeText(referral.referralCode).then(() => {
      setCopiedCode(true);
      setTimeout(() => setCopiedCode(false), 2000);
    });
  };

  const handleSaveMomo = () => {
    const num = momoNumber.trim();
    const name = momoName.trim();
    if (!num || num.length < 10) {
      toast({ title: 'Invalid MoMo number', description: 'Enter a valid 10-digit MoMo number.', variant: 'destructive' });
      return;
    }
    if (!name) {
      toast({ title: 'MoMo name required', description: 'Enter the name registered on your MoMo.', variant: 'destructive' });
      return;
    }
    saveMomo.mutate(
      { data: { momoNumber: num, momoName: name } },
      {
        onSuccess: () => {
          toast({ title: 'MoMo details saved', description: 'Your referral cashback will be sent here.' });
          queryClient.invalidateQueries({ queryKey: getGetReferralInfoQueryKey() });
          setShowMomoForm(false);
        },
        onError: () => toast({ title: 'Error', description: 'Could not save MoMo details. Try again.', variant: 'destructive' }),
      },
    );
  };

  const hasMomo = !!(referral?.momoNumber && referral?.momoName);
  const pendingGhs = ((referral?.pendingEarningsPesewas ?? 0) / 100).toFixed(2);
  const totalGhs = ((referral?.totalEarningsPesewas ?? 0) / 100).toFixed(2);
  const hasEarnings = (referral?.totalEarningsPesewas ?? 0) > 0;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-in fade-in"
      onClick={e => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div
        className="relative w-full max-w-sm rounded-2xl flex flex-col animate-in slide-in-from-bottom-6"
        style={{
          background: 'linear-gradient(160deg, hsl(240 25% 12%), hsl(240 30% 8%))',
          border: '2px solid hsl(38 90% 35%)',
          maxHeight: 'calc(100dvh - 2rem)',
        }}
      >
        {/* Fixed header */}
        <div className="flex items-center justify-between px-5 pt-5 pb-3 shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0" style={{ background: 'hsl(38 90% 15%)', border: '1.5px solid hsl(38 90% 35%)' }}>
              <Gift className="w-5 h-5 text-accent" />
            </div>
            <div>
              <h2 className="font-display text-accent text-xl uppercase tracking-wide leading-none">Refer & Earn</h2>
              <p className="text-white/50 text-xs font-bold mt-0.5">Earn 20% cashback per referral</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-9 h-9 flex items-center justify-center rounded-full text-white/40 hover:text-white hover:bg-white/10 transition-colors shrink-0"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable body */}
        <div className="overflow-y-auto px-5 pb-5 space-y-4 flex-1" style={{ overscrollBehavior: 'contain' }}>

          {isLoading ? (
            <div className="flex items-center justify-center py-10">
              <Loader2 className="w-8 h-8 animate-spin text-accent" />
            </div>
          ) : (
            <>
              <p className="text-white/70 text-sm font-bold leading-relaxed">
                Share your link. When a friend subscribes, you earn{' '}
                <span className="text-accent text-base">20%</span> of their payment —
                sent to your MoMo every 15th–20th.
              </p>

              {/* Referral link + copy */}
              {referral?.referralCode && (
                <div className="space-y-3">
                  <div className="rounded-xl overflow-hidden" style={{ border: '1.5px solid hsl(240 25% 28%)', background: 'hsl(240 25% 10%)' }}>
                    <div className="px-3 pt-3 pb-1">
                      <p className="text-white/40 text-xs font-bold uppercase tracking-wider mb-1.5">Your Referral Link</p>
                      <p className="font-mono text-xs text-white/60 break-all leading-relaxed">{referralLink}</p>
                    </div>
                    <button
                      onClick={handleCopyLink}
                      className="w-full flex items-center justify-center gap-2 py-3 font-bold text-sm transition-all border-t"
                      style={{
                        borderColor: 'hsl(240 25% 22%)',
                        background: copiedLink ? 'hsl(145 60% 12%)' : 'hsl(240 30% 14%)',
                        color: copiedLink ? '#25D366' : '#e2e8f0',
                      }}
                    >
                      {copiedLink ? <CheckCircle2 className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                      {copiedLink ? 'Link Copied!' : 'Copy Link'}
                    </button>
                  </div>

                  <div className="flex items-center justify-between rounded-xl px-4 py-3" style={{ background: 'hsl(240 25% 10%)', border: '1.5px solid hsl(240 25% 22%)' }}>
                    <div>
                      <p className="text-white/40 text-xs font-bold uppercase tracking-wider mb-1">Referral Code</p>
                      <p className="font-mono font-bold text-white text-lg tracking-widest">{referral.referralCode}</p>
                    </div>
                    <button
                      onClick={handleCopyCode}
                      className="flex items-center gap-1.5 px-3 py-2 rounded-lg font-bold text-xs transition-colors"
                      style={{ background: copiedCode ? 'hsl(145 60% 12%)' : 'hsl(240 30% 18%)', color: copiedCode ? '#25D366' : '#ccc', border: '1px solid hsl(240 25% 28%)' }}
                    >
                      {copiedCode ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                      {copiedCode ? 'Copied' : 'Copy'}
                    </button>
                  </div>
                </div>
              )}

              {/* Earnings summary */}
              {hasEarnings && (
                <div className="grid grid-cols-2 gap-3">
                  <div className="rounded-xl p-4 text-center" style={{ background: 'hsl(38 90% 8%)', border: '1.5px solid hsl(38 90% 25%)' }}>
                    <p className="text-white/40 text-xs font-bold uppercase tracking-wider mb-1.5">Total Earned</p>
                    <p className="font-display text-accent text-2xl">GHS {totalGhs}</p>
                  </div>
                  <div className="rounded-xl p-4 text-center" style={{ background: 'hsl(145 60% 7%)', border: '1.5px solid hsl(145 60% 18%)' }}>
                    <p className="text-white/40 text-xs font-bold uppercase tracking-wider mb-1.5">Pending</p>
                    <p className="font-display text-2xl" style={{ color: '#25D366' }}>GHS {pendingGhs}</p>
                  </div>
                </div>
              )}

              {/* Earnings list */}
              {(referral?.earnings ?? []).length > 0 && (
                <div className="rounded-xl overflow-hidden" style={{ border: '1.5px solid hsl(240 25% 20%)' }}>
                  <p className="text-white/40 text-xs font-bold uppercase tracking-wider px-4 py-2.5 border-b" style={{ borderColor: 'hsl(240 25% 18%)' }}>Referral History</p>
                  {referral!.earnings.map(e => (
                    <div key={e.id} className="flex items-center justify-between px-4 py-3 border-b border-white/5 last:border-b-0">
                      <div>
                        <p className="text-white/90 text-sm font-bold">{e.refereeName}</p>
                        <p className="text-white/40 text-xs uppercase mt-0.5">{e.plan}</p>
                      </div>
                      <div className="text-right">
                        <p className="font-mono font-bold text-base" style={{ color: e.status === 'paid' ? '#25D366' : 'hsl(45 100% 65%)' }}>
                          GHS {(e.amount / 100).toFixed(2)}
                        </p>
                        <p className="text-xs font-bold mt-0.5" style={{ color: e.status === 'paid' ? '#25D366' : 'hsl(45 100% 55%)' }}>
                          {e.status === 'paid' ? '✓ Sent' : '⏳ Pending'}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* MoMo details section */}
              <div>
                <p className="text-white/50 text-xs font-bold uppercase tracking-wider mb-2">MoMo for Cashback</p>
                {hasMomo && !showMomoForm ? (
                  <div className="flex items-center justify-between rounded-xl px-4 py-3.5" style={{ background: 'hsl(145 60% 7%)', border: '1.5px solid hsl(145 50% 22%)' }}>
                    <div>
                      <p className="text-white font-bold text-base">{referral?.momoName}</p>
                      <p className="font-mono text-sm mt-0.5" style={{ color: '#25D366' }}>{referral?.momoNumber}</p>
                    </div>
                    <button
                      onClick={() => setShowMomoForm(true)}
                      className="text-accent hover:text-accent/80 text-sm font-bold transition-colors px-3 py-1.5 rounded-lg"
                      style={{ background: 'hsl(38 90% 10%)', border: '1px solid hsl(38 90% 25%)' }}
                    >
                      Edit
                    </button>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {!hasMomo && (
                      <div className="flex items-start gap-3 rounded-xl p-3.5" style={{ background: 'hsl(45 100% 7%)', border: '1.5px solid hsl(45 90% 25%)' }}>
                        <AlertTriangle className="w-5 h-5 text-accent shrink-0 mt-0.5" />
                        <p className="text-sm font-bold leading-snug" style={{ color: 'hsl(45 100% 72%)' }}>
                          Add your MoMo details to receive cashback. Earnings cannot be sent without a valid MoMo number and name.
                        </p>
                      </div>
                    )}
                    <input
                      type="text"
                      value={momoName}
                      onChange={e => setMomoName(e.target.value)}
                      placeholder="MoMo registered name (e.g. Kofi Mensah)"
                      className="w-full h-12 rounded-xl border-2 border-white/15 bg-black/40 px-4 text-white font-bold text-base placeholder:text-white/30 focus:outline-none focus:border-accent"
                    />
                    <div className="flex items-start gap-2 px-1">
                      <AlertTriangle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
                      <p className="text-red-400 text-sm font-bold">Name must match your MoMo exactly — wrong name means payment cannot be sent.</p>
                    </div>
                    <input
                      type="tel"
                      value={momoNumber}
                      onChange={e => setMomoNumber(e.target.value.replace(/\D/g, '').slice(0, 10))}
                      placeholder="MoMo number (e.g. 0241234567)"
                      className="w-full h-12 rounded-xl border-2 border-white/15 bg-black/40 px-4 text-white font-mono font-bold text-base placeholder:text-white/30 focus:outline-none focus:border-accent"
                    />
                    <div className="flex gap-2 pt-1">
                      <button
                        onClick={handleSaveMomo}
                        disabled={saveMomo.isPending}
                        className="btn-game flex-1 py-3 text-base justify-center flex items-center gap-2"
                      >
                        {saveMomo.isPending ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Save MoMo Details'}
                      </button>
                      {showMomoForm && (
                        <button onClick={() => setShowMomoForm(false)} className="btn-game-ghost px-4 py-3 text-base">Cancel</button>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

export default function Dashboard() {
  const [, setLocation] = useLocation();
  const isOnline = useOnlineStatus();
  const { toast } = useToast();
  const { data: subStatus, isLoading: loadingSub } = useGetPaymentStatus({ query: { enabled: true, queryKey: getGetPaymentStatusQueryKey() } });
  const createSession = useCreateQuizSession();

  const [selectedYear, setSelectedYear] = useState<string>('');
  const [selectedSubject, setSelectedSubject] = useState<string>('');
  const [showSubscribeGate, setShowSubscribeGate] = useState(false);
  const [subBannerExpanded, setSubBannerExpanded] = useState(false);
  const [showReferral, setShowReferral] = useState(false);

  // --- Filtered question filters ---
  // 1. All available years (no filter)
  const { data: yearData, isLoading: loadingYears } = useGetQuestionFilters(
    undefined,
    { query: { enabled: true, queryKey: getGetQuestionFiltersQueryKey(undefined) } },
  );
  // 2. Subjects for the selected year
  const { data: subjectData, isLoading: loadingSubjects } = useGetQuestionFilters(
    selectedYear ? { year: selectedYear } : undefined,
    { query: { enabled: !!selectedYear, queryKey: getGetQuestionFiltersQueryKey(selectedYear ? { year: selectedYear } : undefined) } },
  );
  // 3. Weeks for the selected year + subject
  const { data: weekData, isLoading: loadingWeeks } = useGetQuestionFilters(
    selectedYear && selectedSubject ? { year: selectedYear, subject: selectedSubject } : undefined,
    { query: { enabled: !!selectedYear && !!selectedSubject, queryKey: getGetQuestionFiltersQueryKey(selectedYear && selectedSubject ? { year: selectedYear, subject: selectedSubject } : undefined) } },
  );

  const years = yearData?.years ?? [];
  const subjects = subjectData?.subjects ?? [];
  const weeks = weekData?.weeks ?? [];
  const loadingFilters = loadingYears || (!!selectedYear && loadingSubjects) || (!!selectedYear && !!selectedSubject && loadingWeeks);

  // Auto-select first year on load
  useEffect(() => {
    if (years.length > 0 && !selectedYear) setSelectedYear(years[0]);
  }, [years, selectedYear]);

  // Reset subject when year changes
  useEffect(() => {
    setSelectedSubject('');
  }, [selectedYear]);

  const isSubscribed = subStatus?.isActive;

  // Offline pre-cache — runs automatically; exposes manual trigger + needsDownload
  const { needsDownload, status: cacheStatus, progress: cacheProgress, label: cacheLabel, triggerManual } = useOfflinePreCache(true);

  const handleStartLevel = (week: number) => {
    // Online: server always re-checks; just use server truth
    if (isOnline) {
      if (!isSubscribed) {
        setShowSubscribeGate(true);
        return;
      }
      if (!selectedYear || !selectedSubject) return;

      createSession.mutate({ data: { year: selectedYear, subject: selectedSubject, week } }, {
        onSuccess: (session) => setLocation(`/quiz/${session.id}`),
        onError: (err: unknown) => {
          // 403 = subscription expired between page load and button tap
          const status = (err as { status?: number })?.status;
          if (status === 403) {
            setShowSubscribeGate(true);
          } else {
            const msg = (err as { data?: { error?: string } })?.data?.error
              || 'Could not start quiz. Please try again.';
            toast({ title: 'Error', description: msg, variant: 'destructive' });
          }
        },
      });
      return;
    }

    // Offline path — enforce expiry using cached subscription end date
    if (!isSubscriptionActiveOffline()) {
      toast({
        title: 'Subscription expired',
        description: 'Your subscription has expired. Connect to the internet to renew.',
        variant: 'destructive',
      });
      return;
    }

    if (!selectedYear || !selectedSubject) return;

    const cachedId = getCachedSessionId(selectedYear, selectedSubject, week);
    if (cachedId) {
      setLocation(`/quiz/${cachedId}`);
    } else {
      toast({
        title: 'Week not cached yet',
        description: `Connect to the internet once to download all content for offline use.`,
        variant: 'destructive',
      });
    }
  };

  // Weeks that already have a local cache (playable offline)
  const cachedWeeks =
    selectedYear && selectedSubject && !isOnline
      ? getCachedWeeksForSubject(selectedYear, selectedSubject)
      : new Set<number>();

  // Neon color palette cycling for week buttons
  const WEEK_COLORS = [
    { bg: 'hsl(195 100% 10%)', border: 'hsl(195 100% 45%)', text: 'hsl(195 100% 72%)', shadow: 'hsl(195 100% 40%)' },
    { bg: 'hsl(270 80% 12%)', border: 'hsl(270 80% 55%)', text: 'hsl(270 80% 78%)', shadow: 'hsl(270 80% 45%)' },
    { bg: 'hsl(145 70% 8%)',  border: 'hsl(145 70% 45%)', text: 'hsl(145 70% 65%)', shadow: 'hsl(145 70% 35%)' },
    { bg: 'hsl(38 95% 10%)',  border: 'hsl(38 95% 50%)',  text: 'hsl(38 95% 70%)',  shadow: 'hsl(38 95% 40%)'  },
    { bg: 'hsl(330 80% 10%)', border: 'hsl(330 80% 55%)', text: 'hsl(330 80% 75%)', shadow: 'hsl(330 80% 45%)' },
    { bg: 'hsl(220 90% 10%)', border: 'hsl(220 90% 55%)', text: 'hsl(220 90% 75%)', shadow: 'hsl(220 90% 45%)' },
  ];

  return (
    <Layout>
      {/* Subscribe gate modal */}
      {showSubscribeGate && <SubscribeGate onClose={() => setShowSubscribeGate(false)} />}

      {/* Referral modal */}
      {showReferral && <ReferralModal onClose={() => setShowReferral(false)} />}

      <div className="flex-1 w-full flex flex-col items-center justify-center px-4 py-6">
      <div className="w-full max-w-sm space-y-4">

        {/* Offline banner */}
        {!isOnline && (
          <div className="card-game border-l-4 border-yellow-500 px-3 py-2.5 flex items-center gap-2">
            <WifiOff className="w-4 h-4 text-yellow-400 shrink-0" />
            <p className="text-yellow-300 font-bold text-sm">Offline — payments need internet.</p>
          </div>
        )}

        {/* ── Offline Download Button ─────────────────────────────────────── */}
        {isOnline && (needsDownload || cacheStatus === 'running') && (
          <div className="w-full">
            {cacheStatus === 'running' ? (
              /* Progress state — shown while actively caching */
              <div
                className="w-full rounded-2xl px-4 py-3 flex flex-col gap-2"
                style={{
                  background: 'linear-gradient(135deg, hsl(195 100% 6%), hsl(220 40% 10%))',
                  border: '2px solid hsl(195 100% 35%)',
                }}
              >
                <div className="flex items-center gap-2">
                  <Download className="w-4 h-4 text-cyan-400 animate-pulse shrink-0" />
                  <span className="text-cyan-300 font-bold text-sm flex-1 truncate">{cacheLabel || 'Saving for offline…'}</span>
                  <span className="text-cyan-400 font-mono font-bold text-sm shrink-0">{cacheProgress}%</span>
                </div>
                <div className="w-full bg-white/10 rounded-full h-2 overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all duration-500"
                    style={{
                      width: `${cacheProgress}%`,
                      background: 'linear-gradient(90deg, hsl(195 100% 45%), hsl(220 90% 60%))',
                      boxShadow: '0 0 8px hsl(195 100% 45%)',
                    }}
                  />
                </div>
                <p className="text-white/40 text-[10px] font-bold">Stay connected until download finishes</p>
              </div>
            ) : (
              /* Idle / error state — glowing button that demands attention */
              <button
                onClick={triggerManual}
                className="animate-glow-pulse w-full rounded-2xl px-4 py-3.5 flex items-center gap-3 transition-transform active:scale-95"
                style={{
                  background: 'linear-gradient(135deg, hsl(195 100% 8%), hsl(220 60% 12%))',
                  border: '2px solid hsl(195 100% 45%)',
                  color: 'hsl(195 100% 72%)',
                }}
              >
                <div
                  className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
                  style={{ background: 'hsl(195 100% 12%)', border: '1.5px solid hsl(195 100% 40%)' }}
                >
                  <Download className="w-5 h-5 animate-bounce" style={{ color: 'hsl(195 100% 65%)' }} />
                </div>
                <div className="flex-1 text-left min-w-0">
                  <p className="animate-glow-text font-display font-bold text-base leading-tight" style={{ color: 'hsl(195 100% 72%)' }}>
                    {cacheStatus === 'error' ? 'Retry Download' : 'Download for Offline'}
                  </p>
                  <p className="text-[11px] font-bold mt-0.5" style={{ color: 'hsl(195 100% 45%)' }}>
                    {cacheStatus === 'error'
                      ? 'Last attempt failed — tap to retry'
                      : 'Tap to save all questions & songs for offline use'}
                  </p>
                </div>
                <div
                  className="shrink-0 w-8 h-8 rounded-full flex items-center justify-center"
                  style={{ background: 'hsl(195 100% 15%)', border: '1.5px solid hsl(195 100% 40%)' }}
                >
                  <span className="text-lg">→</span>
                </div>
              </button>
            )}
          </div>
        )}


        {/* Page title */}
        <div className="flex items-center justify-between">
          <h1 className="text-game-title text-3xl leading-tight tracking-wide">LEVEL SELECT</h1>
          <button
            onClick={() => setShowReferral(true)}
            className="flex items-center gap-1.5 font-bold text-sm transition-all px-3 py-1.5 rounded-xl"
            style={{ background: 'hsl(38 90% 10%)', border: '1.5px solid hsl(38 90% 35%)', color: 'hsl(38 95% 65%)' }}
          >
            <Gift className="w-4 h-4" />
            Refer &amp; Earn
          </button>
        </div>

        {/* Filters row */}
        <div className="flex gap-3">
          {/* Year */}
          <div className="flex-1">
            <label htmlFor="select-year" className="text-white/70 text-sm font-bold uppercase tracking-wider block mb-1.5">Year</label>
            <div className="relative">
              <select
                id="select-year"
                value={selectedYear}
                onChange={e => setSelectedYear(e.target.value)}
                disabled={loadingYears || !years.length}
                className="w-full rounded-xl border-2 border-white/20 bg-black/40 pl-3 pr-8 text-white font-bold text-base appearance-none focus:outline-none focus:border-primary disabled:opacity-50 disabled:cursor-not-allowed"
                style={{ colorScheme: 'dark', height: '3rem' }}
              >
                <option value="" disabled>Year</option>
                {years.map(y => (
                  <option key={y} value={y}>{y}</option>
                ))}
              </select>
              <ChevronDown className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-white/50" />
            </div>
          </div>

          {/* Subject */}
          <div className="flex-[2]">
            <label htmlFor="select-subject" className="text-white/70 text-sm font-bold uppercase tracking-wider block mb-1.5">Subject</label>
            <div className="relative">
              <select
                id="select-subject"
                value={selectedSubject}
                onChange={e => setSelectedSubject(e.target.value)}
                disabled={loadingSubjects || !subjects.length}
                className="w-full rounded-xl border-2 border-white/20 bg-black/40 pl-3 pr-8 text-white font-bold text-base appearance-none focus:outline-none focus:border-primary disabled:opacity-50 disabled:cursor-not-allowed"
                style={{ colorScheme: 'dark', height: '3rem' }}
              >
                <option value="" disabled>Subject</option>
                {subjects.map(s => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </select>
              <ChevronDown className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-white/50" />
            </div>
          </div>
        </div>

        {/* Subscription banner */}
        {!isSubscribed && !loadingSub && (
          <div className="rounded-xl border-2 border-accent/40 overflow-hidden" style={{ background: 'linear-gradient(135deg, rgba(255,170,0,0.08), rgba(255,80,0,0.05))' }}>
            <button
              onClick={() => setSubBannerExpanded(v => !v)}
              className="w-full flex items-center justify-between px-4 py-3 gap-2"
            >
              <div className="flex items-center gap-2 min-w-0">
                <Zap className="w-4 h-4 text-accent shrink-0" fill="currentColor" strokeWidth={0} />
                <span className="font-display text-sm text-accent uppercase tracking-wide truncate">Unlock Full Access</span>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <Link href="/subscribe" onClick={e => e.stopPropagation()}>
                  <span className="btn-game py-1 px-3 text-xs inline-flex items-center gap-1">
                    <Sparkles className="w-3 h-3" />
                    Subscribe
                  </span>
                </Link>
                {subBannerExpanded ? <ChevronUp className="w-4 h-4 text-white/40" /> : <ChevronDown className="w-4 h-4 text-white/40" />}
              </div>
            </button>
            {subBannerExpanded && (
              <div className="px-4 pb-4 border-t border-accent/20">
                <p className="text-white/70 text-sm font-bold leading-relaxed mt-3 mb-3">
                  Subscribe to play any level. Access 1,500+ exam questions across all subjects, weeks, and Dok levels.
                </p>
                <Link href="/subscribe">
                  <button className="btn-game py-2.5 px-5 text-sm inline-flex items-center gap-2">
                    <Sparkles className="w-4 h-4" />
                    Subscribe Now
                  </button>
                </Link>
              </div>
            )}
          </div>
        )}

        {/* Loading */}
        {loadingFilters && (
          <div className="flex items-center justify-center py-10">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
          </div>
        )}

        {/* Week grid */}
        {!loadingWeeks && selectedSubject && weeks.length > 0 && (
          <div>
            <div className="flex items-center justify-between mb-3">
              <span className="font-display text-white text-lg leading-tight truncate mr-2">{selectedSubject}</span>
              <span
                className="hud-badge text-sm px-3 py-1 shrink-0 font-bold"
                style={{ background: 'hsl(195 100% 10%)', border: '1.5px solid hsl(195 100% 35%)', color: 'hsl(195 100% 72%)' }}
              >
                {weeks.length} weeks
              </span>
            </div>
            <div className="grid grid-cols-5 gap-2.5 sm:grid-cols-6">
              {weeks.map((w, idx) => {
                const unlocked = !!isSubscribed;
                const isCachedOffline = cachedWeeks.has(w);
                const col = WEEK_COLORS[idx % WEEK_COLORS.length];
                return (
                  <button
                    key={w}
                    onClick={() => handleStartLevel(w)}
                    disabled={createSession.isPending}
                    className="relative aspect-square rounded-2xl flex flex-col items-center justify-center select-none transition-all duration-150 active:scale-90 active:translate-y-0.5"
                    style={unlocked ? {
                      background: col.bg,
                      border: `2px solid ${col.border}`,
                      boxShadow: `0 4px 0 ${col.shadow}66, 0 0 12px ${col.border}33`,
                    } : {
                      background: 'rgba(255,255,255,0.04)',
                      border: '2px solid rgba(255,255,255,0.1)',
                      boxShadow: 'none',
                    }}
                  >
                    {createSession.isPending ? (
                      <Loader2 className="w-5 h-5 animate-spin" style={{ color: col.text }} />
                    ) : unlocked ? (
                      <>
                        {isCachedOffline
                          ? <WifiOff className="w-3 h-3 mb-0.5 opacity-70" style={{ color: col.text }} strokeWidth={2} />
                          : <Play className="w-3 h-3 mb-0.5 opacity-60" style={{ color: col.text }} fill="currentColor" strokeWidth={0} />}
                        <span className="font-display text-xl leading-none font-black" style={{ color: col.text }}>{w}</span>
                      </>
                    ) : (
                      <>
                        <Lock className="w-3.5 h-3.5 mb-0.5 opacity-30 text-white" strokeWidth={2} />
                        <span className="font-display text-xl leading-none text-white/25 font-black">{w}</span>
                      </>
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* Prompt to pick subject */}
        {!loadingFilters && !selectedSubject && years.length > 0 && (
          <div className="card-game py-10 px-6 flex flex-col items-center justify-center text-center">
            <BookOpen className="w-12 h-12 text-primary mx-auto mb-4" />
            <p className="text-white/80 font-bold text-lg leading-snug text-center w-full">Select a subject above to see available weeks</p>
          </div>
        )}

        {/* Loading weeks after subject selected */}
        {loadingWeeks && selectedSubject && (
          <div className="flex items-center justify-center py-10">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
          </div>
        )}

        {/* Empty state */}
        {!loadingYears && years.length === 0 && (
          <div className="card-game p-8 text-center border-l-4 border-white/10">
            <BookOpen className="w-9 h-9 text-white/20 mx-auto mb-3" />
            <p className="text-white/40 font-bold text-base">No questions available yet.</p>
            <p className="text-white/25 text-sm mt-1.5">The admin needs to upload questions first.</p>
          </div>
        )}

      </div>
      </div>
    </Layout>
  );
}
