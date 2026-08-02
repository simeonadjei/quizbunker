import { Layout } from '@/components/Layout';
import {
  useGetQuestionFilters, useCreateQuizSession, useGetPaymentStatus,
  useGetReferralInfo, useSaveMomoDetails,
  getGetPaymentStatusQueryKey, getGetQuestionFiltersQueryKey, getGetReferralInfoQueryKey
} from '@workspace/api-client-react';
import { useState, useEffect } from 'react';
import { useLocation, Link } from 'wouter';
import { Loader2, Play, Lock, BookOpen, Sparkles, ChevronDown, Zap, X, WifiOff, ChevronUp, Gift, Copy, CheckCircle2, AlertTriangle, Check, Download, CheckCircle } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';
import { useQueryClient } from '@tanstack/react-query';
import { getCachedSessionId, getCachedWeeksForSubject } from '@/lib/offlineSessions';
import { useOfflinePreCache } from '@/hooks/useOfflinePreCache';
import { cacheSubscriptionEnd, isSubscriptionActiveOffline } from '@/lib/offlineUser';

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

// ── Referral & MoMo Panel ──────────────────────────────────────────────────────
function ReferralPanel() {
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

  if (isLoading) return null;

  const hasMomo = !!(referral?.momoNumber && referral?.momoName);
  const pendingGhs = ((referral?.pendingEarningsPesewas ?? 0) / 100).toFixed(2);
  const totalGhs = ((referral?.totalEarningsPesewas ?? 0) / 100).toFixed(2);
  const hasEarnings = (referral?.totalEarningsPesewas ?? 0) > 0;

  return (
    <div className="card-game p-4 space-y-4" style={{ border: '1.5px solid hsl(38 90% 30%)' }}>
      {/* Header */}
      <div className="flex items-center gap-2 mb-1">
        <Gift className="w-5 h-5 text-accent" />
        <h2 className="font-display text-accent text-base uppercase tracking-wide">Referral Cashback</h2>
      </div>
      <p className="text-white/60 text-xs font-bold leading-relaxed -mt-2">
        Share your link. When a friend subscribes using it, you earn <span className="text-accent">20%</span> of their payment — sent to your MoMo every 15th–20th.
      </p>

      {/* Referral code + copy */}
      {referral?.referralCode && (
        <div className="space-y-2">
          <div className="flex gap-2">
            <div className="flex-1 rounded-xl bg-black/40 border border-white/15 px-3 py-2 font-mono text-sm text-white/70 truncate">
              {referralLink}
            </div>
            <button
              onClick={handleCopyLink}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold transition-all shrink-0"
              style={{ background: copiedLink ? 'hsl(145 60% 20%)' : 'hsl(240 30% 18%)', color: copiedLink ? '#25D366' : '#ccc', border: '1px solid hsl(240 25% 28%)' }}
            >
              {copiedLink ? <CheckCircle2 className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
              {copiedLink ? 'Copied' : 'Copy'}
            </button>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-white/40 text-xs font-bold">Code:</span>
            <span className="font-mono font-bold text-white text-sm tracking-widest">{referral.referralCode}</span>
            <button
              onClick={handleCopyCode}
              className="text-white/30 hover:text-white/70 transition-colors ml-auto"
            >
              {copiedCode ? <Check className="w-3.5 h-3.5 text-green-400" /> : <Copy className="w-3.5 h-3.5" />}
            </button>
          </div>
        </div>
      )}

      {/* Earnings summary */}
      {hasEarnings && (
        <div className="grid grid-cols-2 gap-2">
          <div className="rounded-xl p-3 text-center" style={{ background: 'hsl(38 90% 8%)', border: '1px solid hsl(38 90% 20%)' }}>
            <p className="text-white/40 text-xs font-bold uppercase tracking-wider mb-1">Total Earned</p>
            <p className="font-display text-accent text-xl">GHS {totalGhs}</p>
          </div>
          <div className="rounded-xl p-3 text-center" style={{ background: 'hsl(145 60% 7%)', border: '1px solid hsl(145 60% 18%)' }}>
            <p className="text-white/40 text-xs font-bold uppercase tracking-wider mb-1">Pending</p>
            <p className="font-display text-lg" style={{ color: '#25D366' }}>GHS {pendingGhs}</p>
          </div>
        </div>
      )}

      {/* Earnings list */}
      {(referral?.earnings ?? []).length > 0 && (
        <div className="rounded-xl overflow-hidden" style={{ border: '1px solid hsl(240 25% 20%)' }}>
          {referral!.earnings.map(e => (
            <div key={e.id} className="flex items-center justify-between px-3 py-2 border-b border-white/5 last:border-b-0">
              <div>
                <p className="text-white/80 text-xs font-bold">{e.refereeName}</p>
                <p className="text-white/40 text-xs uppercase">{e.plan}</p>
              </div>
              <div className="text-right">
                <p className="font-mono font-bold text-sm" style={{ color: e.status === 'paid' ? '#25D366' : 'hsl(45 100% 65%)' }}>
                  GHS {(e.amount / 100).toFixed(2)}
                </p>
                <p className="text-xs" style={{ color: e.status === 'paid' ? '#25D366' : 'hsl(45 100% 55%)' }}>
                  {e.status === 'paid' ? '✓ Sent' : '⏳ Pending'}
                </p>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* MoMo details section */}
      <div>
        {hasMomo && !showMomoForm ? (
          <div className="flex items-center justify-between rounded-xl px-3 py-2.5" style={{ background: 'hsl(145 60% 7%)', border: '1px solid hsl(145 50% 18%)' }}>
            <div>
              <p className="text-white/40 text-xs font-bold uppercase tracking-wider mb-0.5">MoMo for cashback</p>
              <p className="text-white font-bold text-sm">{referral?.momoName}</p>
              <p className="font-mono text-xs" style={{ color: '#25D366' }}>{referral?.momoNumber}</p>
            </div>
            <button
              onClick={() => setShowMomoForm(true)}
              className="text-white/40 hover:text-white/70 text-xs font-bold transition-colors"
            >
              Edit
            </button>
          </div>
        ) : (
          <div className="space-y-3">
            {!hasMomo && (
              <div className="flex items-start gap-2 rounded-xl p-3" style={{ background: 'hsl(45 100% 7%)', border: '1px solid hsl(45 90% 22%)' }}>
                <AlertTriangle className="w-4 h-4 text-accent shrink-0 mt-0.5" />
                <p className="text-xs font-bold" style={{ color: 'hsl(45 100% 70%)' }}>
                  Add your MoMo details to receive cashback. Earnings cannot be sent without a valid MoMo number and name.
                </p>
              </div>
            )}
            <div className="space-y-2">
              <input
                type="text"
                value={momoName}
                onChange={e => setMomoName(e.target.value)}
                placeholder="MoMo registered name (e.g. Kofi Mensah)"
                className="w-full h-11 rounded-xl border-2 border-white/15 bg-black/40 px-3 text-white font-bold text-sm placeholder:text-white/30 focus:outline-none focus:border-accent"
              />
              <div className="flex items-start gap-1 px-1">
                <AlertTriangle className="w-3 h-3 text-red-400 shrink-0 mt-0.5" />
                <p className="text-red-400 text-xs font-bold">Name must match your MoMo exactly — if wrong, payment cannot be sent.</p>
              </div>
              <input
                type="tel"
                value={momoNumber}
                onChange={e => setMomoNumber(e.target.value.replace(/\D/g, '').slice(0, 10))}
                placeholder="MoMo number (e.g. 0241234567)"
                className="w-full h-11 rounded-xl border-2 border-white/15 bg-black/40 px-3 text-white font-mono font-bold text-sm placeholder:text-white/30 focus:outline-none focus:border-accent"
              />
            </div>
            <div className="flex gap-2">
              <button
                onClick={handleSaveMomo}
                disabled={saveMomo.isPending}
                className="btn-game flex-1 py-2.5 text-sm justify-center flex items-center gap-2"
              >
                {saveMomo.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Save MoMo Details'}
              </button>
              {showMomoForm && (
                <button onClick={() => setShowMomoForm(false)} className="btn-game-ghost px-4 py-2.5 text-sm">Cancel</button>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default function Dashboard() {
  const [, setLocation] = useLocation();
  const isOnline = useOnlineStatus();
  const { toast } = useToast();
  const { data: filters, isLoading: loadingFilters } = useGetQuestionFilters({ query: { enabled: true, queryKey: getGetQuestionFiltersQueryKey() } });
  const { data: subStatus, isLoading: loadingSub } = useGetPaymentStatus({ query: { enabled: true, queryKey: getGetPaymentStatusQueryKey() } });
  const createSession = useCreateQuizSession();

  const [selectedYear, setSelectedYear] = useState<string>('');
  const [selectedSubject, setSelectedSubject] = useState<string>('');
  const [showSubscribeGate, setShowSubscribeGate] = useState(false);
  const [subBannerExpanded, setSubBannerExpanded] = useState(false);
  const [showReferral, setShowReferral] = useState(false);

  useEffect(() => {
    if (filters && !selectedYear && filters.years.length > 0) setSelectedYear(filters.years[0]);
  }, [filters, selectedYear]);

  const isSubscribed = subStatus?.isActive;

  // Cache subscription end date whenever we get a fresh status from the server,
  // so offline expiry checks work without a network call.
  useEffect(() => {
    if (subStatus !== undefined) {
      cacheSubscriptionEnd(subStatus.isActive ? (subStatus.subscriptionEnd ?? null) : null);
    }
  }, [subStatus]);

  // Pre-cache all sessions + song audio for offline use once the user is subscribed and online
  const preCache = useOfflinePreCache(!!isSubscribed && isOnline);

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

  return (
    <Layout>
      {/* Subscribe gate modal */}
      {showSubscribeGate && <SubscribeGate onClose={() => setShowSubscribeGate(false)} />}

      <div className="px-3 pt-6 pb-4 max-w-lg mx-auto w-full space-y-3">

        {/* Offline banner */}
        {!isOnline && (
          <div className="card-game border-l-4 border-yellow-500 px-3 py-2 flex items-center gap-2">
            <WifiOff className="w-4 h-4 text-yellow-400 shrink-0" />
            <p className="text-yellow-300 font-bold text-sm">Offline — payments need internet.</p>
          </div>
        )}

        {/* Offline pre-cache progress bar */}
        {preCache.status === 'running' && (
          <div className="card-game border-l-4 border-cyan-500 px-3 py-2 space-y-1.5">
            <div className="flex items-center gap-2">
              <Download className="w-4 h-4 text-cyan-400 shrink-0 animate-pulse" />
              <p className="text-cyan-300 font-bold text-xs truncate">{preCache.label || 'Saving for offline…'}</p>
            </div>
            <div className="w-full bg-white/10 rounded-full h-1.5 overflow-hidden">
              <div
                className="h-full bg-cyan-400 rounded-full transition-all duration-300"
                style={{ width: `${preCache.progress}%` }}
              />
            </div>
          </div>
        )}
        {preCache.status === 'done' && (
          <div className="card-game border-l-4 border-green-500 px-3 py-2 flex items-center gap-2">
            <CheckCircle className="w-4 h-4 text-green-400 shrink-0" />
            <p className="text-green-300 font-bold text-xs">All content saved for offline use ✓</p>
          </div>
        )}

        {/* Page title — compact */}
        <div className="flex items-baseline justify-between">
          <h1 className="text-game-title text-2xl leading-tight">LEVEL SELECT</h1>
          <button
            onClick={() => setShowReferral(v => !v)}
            className="flex items-center gap-1.5 text-accent/80 hover:text-accent text-xs font-bold transition-colors"
          >
            <Gift className="w-3.5 h-3.5" />
            Refer & Earn
          </button>
        </div>

        {/* Referral panel — toggleable */}
        {showReferral && <ReferralPanel />}

        {/* Filters row — compact */}
        <div className="flex gap-2.5">
          {/* Year */}
          <div className="flex-1">
            <label htmlFor="select-year" className="text-white/60 text-xs font-bold uppercase tracking-wider block mb-1">Year</label>
            <div className="relative">
              <select
                id="select-year"
                value={selectedYear}
                onChange={e => setSelectedYear(e.target.value)}
                disabled={loadingFilters || !filters?.years.length}
                className="w-full rounded-xl border-2 border-white/20 bg-black/40 pl-3 pr-8 text-white font-bold text-base appearance-none focus:outline-none focus:border-primary disabled:opacity-50 disabled:cursor-not-allowed"
                style={{ colorScheme: 'dark', height: '2.75rem' }}
              >
                <option value="" disabled>Year</option>
                {filters?.years.map(y => (
                  <option key={y} value={y}>{y}</option>
                ))}
              </select>
              <ChevronDown className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 h-4 w-4 text-white/50" />
            </div>
          </div>

          {/* Subject */}
          <div className="flex-[2]">
            <label htmlFor="select-subject" className="text-white/60 text-xs font-bold uppercase tracking-wider block mb-1">Subject</label>
            <div className="relative">
              <select
                id="select-subject"
                value={selectedSubject}
                onChange={e => setSelectedSubject(e.target.value)}
                disabled={loadingFilters || !filters?.subjects.length}
                className="w-full rounded-xl border-2 border-white/20 bg-black/40 pl-3 pr-8 text-white font-bold text-base appearance-none focus:outline-none focus:border-primary disabled:opacity-50 disabled:cursor-not-allowed"
                style={{ colorScheme: 'dark', height: '2.75rem' }}
              >
                <option value="" disabled>Subject</option>
                {filters?.subjects.map(s => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </select>
              <ChevronDown className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 h-4 w-4 text-white/50" />
            </div>
          </div>
        </div>

        {/* Subscription banner — collapsed strip by default, expandable */}
        {!isSubscribed && !loadingSub && (
          <div className="rounded-xl border-2 border-accent/40 overflow-hidden" style={{ background: 'linear-gradient(135deg, rgba(255,170,0,0.08), rgba(255,80,0,0.05))' }}>
            {/* Always-visible strip */}
            <button
              onClick={() => setSubBannerExpanded(v => !v)}
              className="w-full flex items-center justify-between px-3 py-2.5 gap-2"
            >
              <div className="flex items-center gap-2 min-w-0">
                <Zap className="w-4 h-4 text-accent shrink-0" fill="currentColor" strokeWidth={0} />
                <span className="font-display text-sm text-accent uppercase tracking-wide truncate">Unlock Full Access</span>
                <div className="flex gap-1.5 shrink-0">
                  {['All Subjects', 'All Weeks', 'Certificates', 'History'].map(tag => (
                    <span key={tag} className="hidden sm:inline text-xs font-bold px-2 py-0.5 rounded-full border border-accent/40 text-accent/80 bg-accent/10">
                      {tag}
                    </span>
                  ))}
                </div>
              </div>
              <div className="flex items-center gap-1.5 shrink-0">
                <Link href="/subscribe" onClick={e => e.stopPropagation()}>
                  <span className="btn-game py-1 px-3 text-xs inline-flex items-center gap-1">
                    <Sparkles className="w-3 h-3" />
                    Subscribe
                  </span>
                </Link>
                {subBannerExpanded
                  ? <ChevronUp className="w-4 h-4 text-white/40" />
                  : <ChevronDown className="w-4 h-4 text-white/40" />
                }
              </div>
            </button>

            {/* Expanded detail */}
            {subBannerExpanded && (
              <div className="px-4 pb-4 border-t border-accent/20">
                <p className="text-white/70 text-sm font-bold leading-relaxed mt-3 mb-3">
                  Subscribe to play any level. Access 1,500+ exam questions across all subjects, weeks, and Dok levels.
                </p>
                <div className="flex flex-wrap gap-2 mb-3">
                  {['All Subjects', 'All Weeks', 'Certificates', 'History'].map(tag => (
                    <span key={tag} className="text-sm font-bold px-3 py-1 rounded-full border-2 border-accent/40 text-accent bg-accent/10">
                      {tag}
                    </span>
                  ))}
                </div>
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
        {!loadingFilters && selectedSubject && filters && (
          <div>
            <div className="flex items-center justify-between mb-2.5">
              <span className="font-display text-white text-base">{selectedSubject}</span>
              <span className="hud-badge text-xs px-2.5 py-0.5">{filters.weeks.length} weeks</span>
            </div>
            <div className="grid grid-cols-5 gap-2 sm:grid-cols-6">
              {filters.weeks.map(w => {
                const unlocked = !!isSubscribed;
                const isCachedOffline = cachedWeeks.has(w);
                return (
                  <button
                    key={w}
                    onClick={() => handleStartLevel(w)}
                    disabled={createSession.isPending}
                    className={cn(
                      'relative aspect-square rounded-xl flex flex-col items-center justify-center font-display text-lg transition-all duration-150 border-2 select-none',
                      unlocked && !isCachedOffline
                        ? 'bg-black/30 border-white/20 text-white active:scale-90 active:translate-y-0.5 hover:border-primary hover:bg-primary/20'
                        : unlocked && isCachedOffline
                          ? 'bg-secondary/15 border-secondary/60 text-white active:scale-90 active:translate-y-0.5'
                          : 'bg-black/20 border-white/10 text-white/30 hover:border-accent/30 hover:bg-accent/5'
                    )}
                    style={unlocked ? { boxShadow: '0 3px 0 rgba(0,0,0,0.35)' } : undefined}
                    title={isCachedOffline ? `Week ${w} — available offline` : undefined}
                  >
                    {createSession.isPending ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : unlocked ? (
                      <>
                        {isCachedOffline
                          ? <WifiOff className="w-3 h-3 mb-0.5 text-secondary opacity-80" strokeWidth={2} />
                          : <Play className="w-3 h-3 mb-0.5 opacity-50" fill="currentColor" strokeWidth={0} />}
                        <span>{w}</span>
                      </>
                    ) : (
                      <>
                        <Lock className="w-3 h-3 mb-0.5 opacity-40" strokeWidth={2} />
                        <span className="text-sm">{w}</span>
                      </>
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* Prompt to pick subject */}
        {!loadingFilters && !selectedSubject && filters && (
          <div className="card-game p-6 text-center">
            <BookOpen className="w-9 h-9 text-primary mx-auto mb-3" />
            <p className="text-white/70 font-bold text-base">Select a subject above to see available weeks</p>
          </div>
        )}

        {/* Empty state — no questions uploaded yet */}
        {!loadingFilters && filters && filters.years.length === 0 && (
          <div className="card-game p-8 text-center border-l-4 border-white/10">
            <BookOpen className="w-9 h-9 text-white/20 mx-auto mb-3" />
            <p className="text-white/40 font-bold text-base">No questions available yet.</p>
            <p className="text-white/25 text-sm mt-1.5">The admin needs to upload questions first.</p>
          </div>
        )}

      </div>
    </Layout>
  );
}
