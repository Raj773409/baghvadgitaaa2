import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Copy, LogOut, RefreshCw, ShieldAlert } from 'lucide-react';
import { useNavigate, useParams } from 'react-router-dom';
import { Footer } from '../../components/layout/Footer';
import { Header } from '../../components/layout/Header';
import { useToast } from '../../components/ui/Toaster';
import { ApiError, announcePortalSessionChange, portalApi, type PortalDashboard } from '../../utils/portalApi';
import { SignInPanel } from '../../components/dashboard/SignInPanel';
import { OverviewTab } from '../../components/dashboard/OverviewTab';
import { PassesTab } from '../../components/dashboard/PassesTab';
import { TransactionsTab } from '../../components/dashboard/TransactionsTab';
import { ProfileTab } from '../../components/dashboard/ProfileTab';
import { NotificationsTab } from '../../components/dashboard/NotificationsTab';
import { ActivityTab } from '../../components/dashboard/ActivityTab';
import { DASHBOARD_TABS, isDashboardTab, type DashboardTab } from '../../components/dashboard/tabs';
import { initialsOf, titleCase } from '../../components/dashboard/format';

type LoadState = 'loading' | 'signed-out' | 'ready' | 'error';

/** Print only the element tagged by printElement() (pass ticket / receipt). */
const PRINT_CSS = `
@media print {
  body.dashboard-printing * { visibility: hidden !important; }
  body.dashboard-printing .dashboard-print-target,
  body.dashboard-printing .dashboard-print-target * { visibility: visible !important; }
  body.dashboard-printing .dashboard-print-target {
    position: fixed !important; left: 0 !important; top: 0 !important; width: 100% !important;
    margin: 0 !important; box-shadow: none !important; animation: none !important; transform: none !important;
    -webkit-print-color-adjust: exact; print-color-adjust: exact;
  }
  body.dashboard-printing .dashboard-no-print { display: none !important; }
}`;

const LotusMandala: React.FC<{ className?: string }> = ({ className }) => (
  <svg viewBox="0 0 200 200" className={className} aria-hidden="true" fill="none" stroke="currentColor">
    <circle cx="100" cy="100" r="96" strokeWidth="0.6" />
    <circle cx="100" cy="100" r="78" strokeWidth="0.4" />
    <circle cx="100" cy="100" r="30" strokeWidth="0.8" />
    {Array.from({ length: 18 }, (_, i) => (
      <path
        key={i}
        d="M100 70 Q112 48 100 24 Q88 48 100 70 Z"
        strokeWidth="0.7"
        transform={`rotate(${i * 20} 100 100)`}
      />
    ))}
    {Array.from({ length: 36 }, (_, i) => (
      <line key={`r${i}`} x1="100" y1="4" x2="100" y2="14" strokeWidth="0.5" transform={`rotate(${i * 10} 100 100)`} />
    ))}
  </svg>
);

const DashboardSkeleton: React.FC = () => (
  <div className="max-w-[1200px] mx-auto px-4 sm:px-8 pt-28 pb-16 space-y-6" role="status" aria-label="Loading your dashboard">
    {[{ h: 'h-44' }, { h: 'h-12' }, { h: 'h-64' }].map((s, i) => (
      <div key={i} className={`relative overflow-hidden rounded-3xl border border-[#D4A537]/20 bg-[#0F1829]/80 ${s.h}`}>
        <span className="shimmer-sweep absolute inset-y-0 w-1/3 bg-[linear-gradient(90deg,transparent,rgba(247,215,116,0.08),transparent)]" />
      </div>
    ))}
  </div>
);

export const DashboardPage: React.FC = () => {
  const { tab: tabParam } = useParams<{ tab?: string }>();
  const navigate = useNavigate();
  const { notify } = useToast();
  const activeTab: DashboardTab = isDashboardTab(tabParam) ? tabParam : 'overview';

  const [state, setState] = useState<LoadState>('loading');
  const [data, setData] = useState<PortalDashboard | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [markingRead, setMarkingRead] = useState(false);
  const toastedFreshRef = useRef(false);

  const load = useCallback(async () => {
    setState((s) => (s === 'ready' ? s : 'loading'));
    try {
      const me = await portalApi.me();
      setData(me);
      setState('ready');
    } catch (err) {
      if (err instanceof ApiError && err.status === 401) {
        setData(null);
        setState('signed-out');
      } else {
        setErrorMessage(err instanceof ApiError ? err.message : 'Could not load your dashboard.');
        setState('error');
      }
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  useEffect(() => {
    document.title = 'My Dashboard · Bhagavad Gita Vishwa Mahotsav 2027';
  }, []);

  // Unknown tab in the URL → canonical overview path.
  useEffect(() => {
    if (tabParam && !isDashboardTab(tabParam)) navigate('/dashboard', { replace: true });
  }, [tabParam, navigate]);

  // Surface very recent unread notifications (e.g. right after payment) as toasts, once.
  useEffect(() => {
    if (state !== 'ready' || !data || toastedFreshRef.current) return;
    toastedFreshRef.current = true;
    const fresh = data.notifications
      .filter((n) => !n.read && Date.now() - new Date(n.createdAt).getTime() < 2 * 60 * 1000)
      .slice(0, 2);
    fresh.forEach((n, i) =>
      window.setTimeout(() => notify({ tone: n.tone, title: n.title, body: n.body, duration: 7000 }), 400 + i * 700),
    );
  }, [state, data, notify]);

  const markRead = useCallback(
    async (ids?: string[]) => {
      if (!data) return;
      setMarkingRead(true);
      try {
        await portalApi.markNotificationsRead(ids);
        setData((d) =>
          d
            ? {
                ...d,
                notifications: d.notifications.map((n) => (!ids || ids.includes(n.id) ? { ...n, read: true } : n)),
              }
            : d,
        );
        announcePortalSessionChange();
      } catch {
        notify({ tone: 'error', title: 'Could not update notifications' });
      } finally {
        setMarkingRead(false);
      }
    },
    [data, notify],
  );

  // Opening the Notifications tab marks what was visible as read after a short pause.
  const unreadIds = data?.notifications.filter((n) => !n.read).map((n) => n.id) ?? [];
  const unreadKey = unreadIds.join(',');
  useEffect(() => {
    if (activeTab !== 'notifications' || !unreadKey) return;
    const ids = unreadKey.split(',');
    const id = window.setTimeout(() => void markRead(ids), 1500);
    return () => window.clearTimeout(id);
  }, [activeTab, unreadKey, markRead]);

  const goTab = (tab: DashboardTab) => navigate(tab === 'overview' ? '/dashboard' : `/dashboard/${tab}`);

  const handleSignOut = async () => {
    try {
      await portalApi.logout();
    } finally {
      setData(null);
      setState('signed-out');
      toastedFreshRef.current = false;
      announcePortalSessionChange();
      notify({ tone: 'info', title: 'Signed out', body: 'You have been signed out of your dashboard.' });
      navigate('/dashboard', { replace: true });
    }
  };

  const copyReference = async (code: string) => {
    try {
      await navigator.clipboard.writeText(code);
      notify({ tone: 'success', title: 'Reference copied', body: code, duration: 2800 });
    } catch {
      notify({ tone: 'warning', title: 'Copy not available', body: `Your reference is ${code}` });
    }
  };

  const profile = data?.profile;
  const unread = unreadIds.length;
  const isTestMode = Boolean(data?.payments.some((p) => p.mode === 'test'));
  const statusChip =
    profile?.paymentStatus === 'paid'
      ? { label: 'Paid & confirmed', className: 'border-emerald-300/50 bg-emerald-400/10 text-emerald-100' }
      : profile?.paymentStatus === 'refunded'
        ? { label: 'Refunded', className: 'border-sky-300/50 bg-sky-400/10 text-sky-100' }
        : { label: 'Payment pending', className: 'border-amber-300/50 bg-amber-400/10 text-amber-100' };

  return (
    <div className="min-h-screen flex flex-col bg-[#0B111C] text-[#FFFDF7]">
      <style>{PRINT_CSS}</style>
      <Header variant="solid-dark" />

      <main className="flex-1 relative">
        {/* Ambient cinematic backdrop */}
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_50%_0%,#22355A_0%,#131D30_38%,#0B111C_75%)]"
        />

        {state === 'loading' && <DashboardSkeleton />}

        {state === 'signed-out' && <SignInPanel onSignedIn={() => void load()} />}

        {state === 'error' && (
          <div className="relative min-h-[70vh] flex items-center justify-center px-4 pt-24">
            <div className="cinematic-rise max-w-md text-center space-y-4 rounded-3xl border border-red-400/30 bg-[#0F1829]/90 p-8">
              <ShieldAlert className="w-10 h-10 mx-auto text-red-300" aria-hidden="true" />
              <h1 className="font-editorial text-2xl">We couldn't load your dashboard</h1>
              <p className="text-sm text-[#E9DCC5]/75">{errorMessage}</p>
              <button
                type="button"
                onClick={() => void load()}
                className="inline-flex items-center gap-2 min-h-[42px] px-6 rounded-full royal-gold-surface text-xs font-semibold cursor-pointer"
              >
                <RefreshCw className="w-3.5 h-3.5" aria-hidden="true" /> Try again
              </button>
            </div>
          </div>
        )}

        {state === 'ready' && data && profile && (
          <div className="relative max-w-[1200px] mx-auto px-4 sm:px-8 pt-24 sm:pt-28 pb-16 space-y-6">
            {/* Hero */}
            <section className="cinematic-rise relative overflow-hidden rounded-3xl border border-[#D4A537]/40 bg-[radial-gradient(ellipse_at_80%_20%,#2A3A5C_0%,#17233A_45%,#0E1523_100%)] p-5 sm:p-8 shadow-[0_30px_80px_-30px_rgba(0,0,0,0.8),0_0_60px_-25px_rgba(212,165,55,0.55)]">
              <div className="absolute inset-x-0 top-0 h-[2px] gold-leaf-line" aria-hidden="true" />
              <LotusMandala className="slow-spin absolute -right-16 -top-16 sm:-right-10 sm:-top-20 w-64 sm:w-80 text-[#D4A537]/15" />
              <div className="relative flex flex-col md:flex-row md:items-center gap-5 md:gap-7">
                <span className="relative grid place-items-center w-16 h-16 sm:w-20 sm:h-20 rounded-full royal-gold-surface text-xl sm:text-2xl font-semibold font-editorial shrink-0">
                  <span className="absolute inset-0 rounded-full border border-[#F7D774]/50 gold-pulse-ring" aria-hidden="true" />
                  {initialsOf(profile.fullName)}
                </span>
                <div className="min-w-0 flex-1 space-y-2">
                  <p className="text-[11px] font-semibold tracking-[0.22em] uppercase text-[#D4A537]">Namaste</p>
                  <h1 className="relative inline-block overflow-hidden font-editorial text-3xl sm:text-4xl lg:text-5xl leading-tight">
                    <span className="royal-gold-gradient-text">{profile.fullName}</span>
                    <span
                      aria-hidden="true"
                      className="shimmer-sweep pointer-events-none absolute inset-y-0 left-0 w-1/4 bg-[linear-gradient(90deg,transparent,rgba(255,250,225,0.35),transparent)]"
                    />
                  </h1>
                  <div className="flex flex-wrap items-center gap-2">
                    <button
                      type="button"
                      onClick={() => void copyReference(profile.referenceCode)}
                      className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full border border-[#D4A537]/45 bg-black/25 font-mono text-xs tracking-[0.08em] text-[#F7D774] hover:border-[#F7D774] cursor-pointer"
                      aria-label={`Copy reference code ${profile.referenceCode}`}
                    >
                      {profile.referenceCode} <Copy className="w-3 h-3" aria-hidden="true" />
                    </button>
                    <span className={`px-3 py-1 rounded-full border text-[11px] font-semibold ${statusChip.className}`}>{statusChip.label}</span>
                    <span className="px-3 py-1 rounded-full border border-white/15 text-[11px] text-[#E9DCC5]/80">
                      {titleCase(profile.registrationType)} · {profile.noOfPersons} {profile.noOfPersons === 1 ? 'person' : 'people'}
                    </span>
                    {isTestMode && (
                      <span className="px-3 py-1 rounded-full border border-amber-300/50 bg-amber-400/10 text-[11px] font-semibold text-amber-100">
                        Test mode
                      </span>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-2 md:self-start">
                  <button
                    type="button"
                    onClick={() => void load()}
                    aria-label="Refresh dashboard"
                    className="grid place-items-center w-10 h-10 rounded-full border border-[#D4A537]/40 text-[#E9DCC5] hover:text-[#F7D774] hover:border-[#F7D774] cursor-pointer"
                  >
                    <RefreshCw className="w-4 h-4" aria-hidden="true" />
                  </button>
                  <button
                    type="button"
                    onClick={() => void handleSignOut()}
                    className="inline-flex items-center gap-1.5 min-h-[40px] px-4 rounded-full border border-[#D4A537]/40 text-xs font-medium text-[#FFFDF7] hover:border-[#F7D774] hover:text-[#F7D774] cursor-pointer"
                  >
                    <LogOut className="w-3.5 h-3.5" aria-hidden="true" /> Sign out
                  </button>
                </div>
              </div>
            </section>

            {/* Tabs */}
            <nav aria-label="Dashboard sections" className="-mx-4 sm:mx-0 overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
              <div role="tablist" className="flex gap-1.5 px-4 sm:px-1.5 sm:py-1.5 sm:rounded-full sm:border sm:border-[#D4A537]/25 sm:bg-[#0F1829]/70 w-max sm:w-auto">
                {DASHBOARD_TABS.map((t) => {
                  const active = t.id === activeTab;
                  return (
                    <button
                      key={t.id}
                      type="button"
                      role="tab"
                      aria-selected={active}
                      onClick={() => goTab(t.id)}
                      className={`relative inline-flex items-center gap-1.5 min-h-[40px] px-4 rounded-full text-xs sm:text-[13px] font-medium whitespace-nowrap cursor-pointer transition-colors ${
                        active ? 'royal-gold-surface font-semibold' : 'text-[#E9DCC5]/80 hover:text-[#F7D774] hover:bg-white/5'
                      }`}
                    >
                      {t.label}
                      {t.id === 'notifications' && unread > 0 && (
                        <span
                          className={`min-w-[18px] h-[18px] px-1 grid place-items-center rounded-full text-[10px] font-bold ${
                            active ? 'bg-[#17233A] text-[#F7D774]' : 'bg-[#F7D774] text-[#17233A] shadow-[0_0_10px_rgba(247,215,116,0.7)]'
                          }`}
                        >
                          {unread}
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
            </nav>

            <div key={activeTab} role="tabpanel">
              {activeTab === 'overview' && <OverviewTab data={data} onNavigate={goTab} />}
              {activeTab === 'passes' && (
                <PassesTab passes={data.passes} holderName={profile.fullName} paid={profile.paymentStatus === 'paid'} />
              )}
              {activeTab === 'transactions' && <TransactionsTab payments={data.payments} />}
              {activeTab === 'profile' && (
                <ProfileTab profile={profile} onUpdated={(d) => setData((prev) => ({ ...d, gateway: prev?.gateway }))} />
              )}
              {activeTab === 'notifications' && (
                <NotificationsTab notifications={data.notifications} marking={markingRead} onMarkAllRead={() => void markRead()} />
              )}
              {activeTab === 'activity' && <ActivityTab activity={data.activity} />}
            </div>
          </div>
        )}
      </main>

      <Footer />
    </div>
  );
};

export default DashboardPage;
