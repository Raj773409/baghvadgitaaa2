import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  AlertCircle,
  ArrowLeft,
  Bell,
  Loader2,
  LogOut,
  Menu,
  RefreshCw,
  Search,
  ShieldAlert,
  ShieldCheck,
  X,
} from 'lucide-react';
import { Link, Navigate, useLocation, useNavigate } from 'react-router-dom';
import { AdminCollectionsPanel } from '../../components/admin/AdminCollectionsPanel';
import { AdminCmsPanel } from '../../components/admin/AdminContentAndMediaPanels';
import { AdminDashboardOverview } from '../../components/admin/AdminDashboardOverview';
import { AdminGitaStudioPanel } from '../../components/admin/AdminGitaStudioPanel';
import { AdminMediaStudioPanel } from '../../components/admin/AdminMediaStudioPanel';
import {
  AdminMembershipsPanel,
  AdminParticipantsPanel,
  AdminPaymentsPanel,
  AdminVolunteersPanel,
} from '../../components/admin/AdminOperationsPanels';
import { AdminPageBuilderPanel } from '../../components/admin/AdminPageBuilderPanel';
import {
  AdminAnalyticsPanel,
  AdminAuditPanel,
  AdminSettingsPanel,
  AdminUsersPanel,
} from '../../components/admin/AdminSecurityPanels';
import {
  AdminStoryStudioPanel,
  type GlbInspectionRecord,
} from '../../components/admin/AdminStoryStudioPanel';
import {
  AdminStatusBadge,
  AdminToastStack,
  type AdminToastMessage,
} from '../../components/admin/AdminUiPrimitives';
import { AdminWebsiteInventoryPanel } from '../../components/admin/AdminWebsiteInventoryPanel';
import {
  ADMIN_MODULE_GROUPS,
  type AdminModuleId,
  type AdminPermissions,
  type AdminUserEntry,
  type AdminUserSession,
  type AuditLogEntry,
  type BackupEntry,
  type CmsEntry,
  type DashboardPayload,
  type GatewayStatus,
  type MembershipEntry,
  type ParticipantEntry,
  type PaymentEntry,
  type RefundEntry,
  type SystemSettingsEntry,
  type VolunteerEntry,
} from '../../components/admin/adminTypes';
import { LanguageSelector } from '../../components/ui/LanguageSelector';
import { ThemeToggle } from '../../components/ui/ThemeToggle';
import { adminFetch, clearAdminSessionToken } from '../../utils/adminSession';
import type {
  CarouselConfigRecord,
  MediaAssetRecord,
  PageInventoryRecord,
  ScriptureChapterOverride,
  ScriptureVerseRecord,
  StorySceneOverride,
  StructuredCollectionKind,
} from '../../utils/cmsSync';

const ALL_MODULE_IDS = new Set<string>(
  ADMIN_MODULE_GROUPS.flatMap((g) => g.items.map((item) => item.id)),
);

const COLLECTION_MODULE_MAP: Partial<
  Record<AdminModuleId, { kind: StructuredCollectionKind; heading: string }>
> = {
  events: { kind: 'events', heading: 'Events Program' },
  schedule: { kind: 'schedule', heading: 'Schedule Ledger' },
  participationCategories: { kind: 'participation', heading: 'Movement Pathways' },
  leadership: { kind: 'leadership', heading: 'Leadership Directory' },
  partners: { kind: 'partners', heading: 'Organizing Partners' },
  news: { kind: 'announcements', heading: 'Announcements & Press' },
  faqs: { kind: 'faqs', heading: 'Official FAQs' },
};

const LEGACY_CMS_SECTION_IDS = new Set<AdminModuleId>([
  'hero',
  'krishnaFeature',
  'donationConfig',
  'voiceScripts',
  'translations',
  'voice',
  'pages',
]);

const ForcedPasswordChangeScreen: React.FC<{ onSuccess: () => void }> = ({ onSuccess }) => {
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setError(null);
    if (newPassword.length < 12) {
      setError('New password must be at least 12 characters.');
      return;
    }
    if (newPassword !== confirmPassword) {
      setError('New password and confirmation do not match.');
      return;
    }
    setSubmitting(true);
    try {
      const res = await adminFetch('/api/admin/change-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ currentPassword, newPassword }),
      });
      const json = (await res.json().catch(() => ({}))) as { error?: string };
      if (!res.ok) {
        setError(json.error || 'Unable to update password.');
        return;
      }
      onSuccess();
    } catch {
      setError('Network error. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0D1422] text-[#FFFDF8] flex items-center justify-center px-4">
      <div className="w-full max-w-md rounded-2xl border border-[#D4A537]/35 bg-[#131B2C] p-6 sm:p-8 shadow-[0_24px_60px_rgba(11,17,28,0.55)]">
        <ShieldAlert className="w-8 h-8 text-[#F7D774] mb-3" />
        <h1 className="font-editorial text-xl sm:text-2xl text-[#FFFDF8] mb-1.5">
          Password Change Required
        </h1>
        <p className="text-sm text-[#EAE3D6]/80 mb-6">
          This account is using a temporary one-time password. Set a permanent password before
          continuing to the Command Centre.
        </p>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="currentPassword" className="block text-xs uppercase tracking-[0.12em] text-[#D4A537] mb-1.5">
              Current (temporary) password
            </label>
            <input
              id="currentPassword"
              type="password"
              required
              autoComplete="current-password"
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              className="w-full min-h-[44px] px-3 rounded-lg border border-[#D4A537]/40 bg-[#0D1422]/60 text-sm text-[#FFFDF8] focus:outline-none focus:border-[#F7D774]"
            />
          </div>
          <div>
            <label htmlFor="newPassword" className="block text-xs uppercase tracking-[0.12em] text-[#D4A537] mb-1.5">
              New password (minimum 12 characters)
            </label>
            <input
              id="newPassword"
              type="password"
              required
              minLength={12}
              autoComplete="new-password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              className="w-full min-h-[44px] px-3 rounded-lg border border-[#D4A537]/40 bg-[#0D1422]/60 text-sm text-[#FFFDF8] focus:outline-none focus:border-[#F7D774]"
            />
          </div>
          <div>
            <label htmlFor="confirmPassword" className="block text-xs uppercase tracking-[0.12em] text-[#D4A537] mb-1.5">
              Confirm new password
            </label>
            <input
              id="confirmPassword"
              type="password"
              required
              minLength={12}
              autoComplete="new-password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className="w-full min-h-[44px] px-3 rounded-lg border border-[#D4A537]/40 bg-[#0D1422]/60 text-sm text-[#FFFDF8] focus:outline-none focus:border-[#F7D774]"
            />
          </div>
          {error && <p className="text-sm text-rose-300">{error}</p>}
          <button
            type="submit"
            disabled={submitting}
            className="w-full min-h-[44px] rounded-lg bg-[#D4A537] text-[#17233A] font-semibold text-sm disabled:opacity-60 cursor-pointer"
          >
            {submitting ? 'Updating…' : 'Set Permanent Password'}
          </button>
        </form>
      </div>
    </div>
  );
};

const AdminPage: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();

  const [sessionState, setSessionState] = useState<
    'loading' | 'unauthenticated' | 'forbidden' | 'password-change-required' | 'authenticated'
  >('loading');
  const [user, setUser] = useState<AdminUserSession | null>(null);
  const [permissions, setPermissions] = useState<AdminPermissions>({ read: [], write: [] });
  const [activeModule, setActiveModule] = useState<AdminModuleId>('overview');
  const [selectedBuilderPageId, setSelectedBuilderPageId] = useState<string | null>(null);
  const [dashboardRange, setDashboardRange] = useState<'all' | '7d' | '30d'>('all');

  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const [globalSearch, setGlobalSearch] = useState('');
  const [notifOpen, setNotifOpen] = useState(false);
  const [toasts, setToasts] = useState<AdminToastMessage[]>([]);

  const [moduleLoading, setModuleLoading] = useState(false);
  const [moduleError, setModuleError] = useState<string | null>(null);
  const [moduleForbidden, setModuleForbidden] = useState<string | null>(null);

  const [dashboard, setDashboard] = useState<DashboardPayload | null>(null);
  const [pages, setPages] = useState<PageInventoryRecord[]>([]);
  const [mediaAssets, setMediaAssets] = useState<MediaAssetRecord[]>([]);
  const [carousels, setCarousels] = useState<CarouselConfigRecord[]>([]);
  const [scriptureData, setScriptureData] = useState<{
    chapters: ScriptureChapterOverride[];
    verses: ScriptureVerseRecord[];
  }>({ chapters: [], verses: [] });
  const [storyScenes, setStoryScenes] = useState<StorySceneOverride[]>([]);
  const [storyGlbs, setStoryGlbs] = useState<GlbInspectionRecord[]>([]);

  const [participants, setParticipants] = useState<ParticipantEntry[]>([]);
  const [paymentsData, setPaymentsData] = useState<{
    payments: PaymentEntry[];
    refunds: RefundEntry[];
    gatewayStatus: GatewayStatus;
  } | null>(null);
  const [volunteers, setVolunteers] = useState<VolunteerEntry[]>([]);
  const [memberships, setMemberships] = useState<MembershipEntry[]>([]);
  const [cmsItems, setCmsItems] = useState<CmsEntry[]>([]);
  const [users, setUsers] = useState<AdminUserEntry[]>([]);
  const [auditLogs, setAuditLogs] = useState<AuditLogEntry[]>([]);
  const [settingsData, setSettingsData] = useState<{
    settings: SystemSettingsEntry;
    backups: BackupEntry[];
  } | null>(null);

  const pushToast = useCallback((toast: Omit<AdminToastMessage, 'id'>) => {
    const id = `toast-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
    setToasts((prev) => [...prev.slice(-3), { ...toast, id }]);
    window.setTimeout(() => {
      setToasts((prev) => prev.filter((item) => item.id !== id));
    }, 4500);
  }, []);

  const dismissToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((item) => item.id !== id));
  }, []);

  // Sync URL sub-path (e.g. /admin/participants) cleanly if provided
  useEffect(() => {
    const slug = location.pathname.replace(/^\/admin\/?/, '').split('/')[0]?.trim();
    if (slug && ALL_MODULE_IDS.has(slug)) {
      setActiveModule(slug as AdminModuleId);
    }
  }, [location.pathname]);

  const loadModuleData = useCallback(
    async (
      mod: AdminModuleId,
      perms: AdminPermissions,
      range: 'all' | '7d' | '30d' = dashboardRange,
    ) => {
      setModuleError(null);
      setModuleForbidden(null);

      if (!perms.read.includes(mod)) {
        setModuleForbidden(`Your role does not grant read access to the "${mod}" module.`);
        return;
      }

      setModuleLoading(true);
      try {
        const handleHttpFailure = async (res: Response, label: string) => {
          const payload = (await res.json().catch(() => ({}))) as { error?: string };
          if (res.status === 401) {
            clearAdminSessionToken();
            setUser(null);
            setPermissions({ read: [], write: [] });
            setSessionState('unauthenticated');
            return false;
          }
          if (res.status === 403) {
            setModuleForbidden(payload.error || `Access denied to ${label}.`);
            return false;
          }
          throw new Error(payload.error || `Unable to load ${label} (HTTP ${res.status}).`);
        };

        if (mod === 'overview' || mod === 'analytics') {
          const res = await adminFetch(`/api/admin/dashboard?range=${encodeURIComponent(range)}`);
          if (!res.ok) {
            await handleHttpFailure(res, 'dashboard analytics');
            return;
          }
          setDashboard((await res.json()) as DashboardPayload);
        } else if (mod === 'websiteInventory') {
          const res = await adminFetch('/api/admin/pages');
          if (!res.ok) {
            await handleHttpFailure(res, 'website route inventory');
            return;
          }
          const j = (await res.json()) as { pages: PageInventoryRecord[] };
          setPages(j.pages ?? []);
        } else if (mod === 'pageBuilder') {
          const pagesRes = await adminFetch('/api/admin/pages');
          if (!pagesRes.ok) {
            await handleHttpFailure(pagesRes, 'Page Builder Studio');
            return;
          }
          const pj = (await pagesRes.json()) as { pages: PageInventoryRecord[] };
          setPages(pj.pages ?? []);

          if (perms.read.includes('gallery') || perms.read.includes('video')) {
            const mediaRes = await adminFetch('/api/admin/media-assets');
            if (mediaRes.ok) {
              const mj = (await mediaRes.json()) as { assets: MediaAssetRecord[] };
              setMediaAssets(mj.assets ?? []);
            }
          }
        } else if (mod === 'carousels' || mod === 'gallery' || mod === 'video') {
          const canMedia = perms.read.includes('gallery') || perms.read.includes('video');
          const canCarousels = perms.read.includes('carousels');

          if (canMedia) {
            const mediaRes = await adminFetch('/api/admin/media-assets');
            if (!mediaRes.ok && (mod === 'gallery' || mod === 'video')) {
              await handleHttpFailure(mediaRes, 'media archive');
              return;
            }
            if (mediaRes.ok) {
              const mj = (await mediaRes.json()) as { assets: MediaAssetRecord[] };
              setMediaAssets(mj.assets ?? []);
            }
          }

          if (canCarousels) {
            const carRes = await adminFetch('/api/admin/carousels');
            if (!carRes.ok && mod === 'carousels') {
              await handleHttpFailure(carRes, 'carousel studio');
              return;
            }
            if (carRes.ok) {
              const cj = (await carRes.json()) as { carousels: CarouselConfigRecord[] };
              setCarousels(cj.carousels ?? []);
            }
          }
        } else if (mod === 'chapters' || mod === 'scripture') {
          const res = await adminFetch('/api/admin/scripture');
          if (!res.ok) {
            await handleHttpFailure(res, 'Bhagavad Gita scripture bank');
            return;
          }
          const j = (await res.json()) as {
            chapters: ScriptureChapterOverride[];
            verses: ScriptureVerseRecord[];
          };
          setScriptureData({ chapters: j.chapters ?? [], verses: j.verses ?? [] });
        } else if (mod === 'story') {
          const [scenesRes, glbsRes] = await Promise.all([
            adminFetch('/api/admin/story/scenes'),
            adminFetch('/api/admin/story/inspect-glbs'),
          ]);
          if (!scenesRes.ok) {
            await handleHttpFailure(scenesRes, 'story scenes');
            return;
          }
          const sj = (await scenesRes.json()) as { scenes: StorySceneOverride[] };
          setStoryScenes(sj.scenes ?? []);
          if (glbsRes.ok) {
            const gj = (await glbsRes.json()) as { models: GlbInspectionRecord[] };
            setStoryGlbs(gj.models ?? []);
          }
        } else if (mod === 'participants' || mod === 'registrations') {
          const res = await adminFetch('/api/admin/participants');
          if (!res.ok) {
            await handleHttpFailure(res, 'participants');
            return;
          }
          const j = (await res.json()) as { participants: ParticipantEntry[] };
          setParticipants(j.participants ?? []);
        } else if (mod === 'payments') {
          const res = await adminFetch('/api/admin/payments');
          if (!res.ok) {
            await handleHttpFailure(res, 'payments ledger');
            return;
          }
          setPaymentsData(await res.json());
        } else if (mod === 'volunteers') {
          const res = await adminFetch('/api/admin/volunteers');
          if (!res.ok) {
            await handleHttpFailure(res, 'volunteers');
            return;
          }
          const j = (await res.json()) as { volunteers: VolunteerEntry[] };
          setVolunteers(j.volunteers ?? []);
        } else if (mod === 'membership') {
          const res = await adminFetch('/api/admin/memberships');
          if (!res.ok) {
            await handleHttpFailure(res, 'memberships');
            return;
          }
          const j = (await res.json()) as { memberships: MembershipEntry[] };
          setMemberships(j.memberships ?? []);
        } else if (COLLECTION_MODULE_MAP[mod]) {
          // Structured collections handle their own fetch inside AdminCollectionsPanel
          setModuleLoading(false);
          return;
        } else if (LEGACY_CMS_SECTION_IDS.has(mod)) {
          const res = await adminFetch(`/api/admin/cms?section=${encodeURIComponent(mod)}`);
          if (!res.ok) {
            await handleHttpFailure(res, `${mod} CMS`);
            return;
          }
          const j = (await res.json()) as { cmsItems: CmsEntry[] };
          setCmsItems(j.cmsItems ?? []);
        } else if (mod === 'users') {
          const res = await adminFetch('/api/admin/users');
          if (!res.ok) {
            await handleHttpFailure(res, 'RBAC users');
            return;
          }
          const j = (await res.json()) as { users: AdminUserEntry[] };
          setUsers(j.users ?? []);
        } else if (mod === 'audit') {
          const res = await adminFetch('/api/admin/audit');
          if (!res.ok) {
            await handleHttpFailure(res, 'audit logs');
            return;
          }
          const j = (await res.json()) as { auditLogs: AuditLogEntry[] };
          setAuditLogs(j.auditLogs ?? []);
        } else if (mod === 'settings') {
          const res = await adminFetch('/api/admin/settings');
          if (!res.ok) {
            await handleHttpFailure(res, 'system settings');
            return;
          }
          setSettingsData(await res.json());
        }
      } catch (err) {
        setModuleError(err instanceof Error ? err.message : 'Unable to load module data.');
      } finally {
        setModuleLoading(false);
      }
    },
    [dashboardRange],
  );

  // Verify active admin session on mount
  useEffect(() => {
    let active = true;
    adminFetch('/api/admin/session')
      .then((res) => (res.ok ? res.json() : { authenticated: false }))
      .then(
        (json: {
          authenticated: boolean;
          user?: AdminUserSession;
          permissions?: AdminPermissions;
        }) => {
          if (!active) return;
          if (json.authenticated && json.user && json.permissions) {
            if (json.user.mustChangePassword) {
              setUser(json.user);
              setSessionState('password-change-required');
              return;
            }
            if (json.permissions.read.length === 0) {
              setSessionState('forbidden');
              return;
            }
            setUser(json.user);
            setPermissions(json.permissions);
            setActiveModule((prev) =>
              json.permissions!.read.includes(prev) ? prev : json.permissions!.read[0],
            );
            setSessionState('authenticated');
          } else {
            clearAdminSessionToken();
            setSessionState('unauthenticated');
          }
        },
      )
      .catch(() => {
        if (active) setSessionState('unauthenticated');
      });
    return () => {
      active = false;
    };
  }, []);

  // Preload notifications (dashboard) and 28-page index for Global Search
  useEffect(() => {
    if (sessionState !== 'authenticated') return;
    if (permissions.read.includes('overview')) {
      adminFetch('/api/admin/dashboard?range=all')
        .then((r) => (r.ok ? r.json() : null))
        .then((j: DashboardPayload | null) => {
          if (j) setDashboard(j);
        })
        .catch(() => undefined);
    }
    if (permissions.read.includes('websiteInventory') || permissions.read.includes('pageBuilder')) {
      adminFetch('/api/admin/pages')
        .then((r) => (r.ok ? r.json() : null))
        .then((j: { pages?: PageInventoryRecord[] } | null) => {
          if (j?.pages) setPages(j.pages);
        })
        .catch(() => undefined);
    }
  }, [sessionState, permissions]);

  // Load current module data whenever activeModule or dashboardRange changes
  useEffect(() => {
    if (sessionState === 'authenticated') {
      void loadModuleData(activeModule, permissions, dashboardRange);
    }
  }, [sessionState, activeModule, permissions, dashboardRange, loadModuleData]);

  const handleLogout = async () => {
    try {
      await adminFetch('/api/admin/logout', { method: 'POST' });
    } finally {
      clearAdminSessionToken();
    }
    setUser(null);
    setPermissions({ read: [], write: [] });
    setSessionState('unauthenticated');
    navigate('/admin/login', { replace: true });
  };

  const handleSelectModule = useCallback(
    (mod: AdminModuleId) => {
      setActiveModule(mod);
      setMobileNavOpen(false);
      setNotifOpen(false);
      setGlobalSearch('');
      if (location.pathname !== '/admin') {
        navigate('/admin', { replace: true });
      }
    },
    [location.pathname, navigate],
  );

  const handleOpenPageInBuilder = useCallback(
    (pageId: string) => {
      setSelectedBuilderPageId(pageId);
      setActiveModule('pageBuilder');
      setGlobalSearch('');
      setMobileNavOpen(false);
      if (location.pathname !== '/admin') {
        navigate('/admin', { replace: true });
      }
    },
    [location.pathname, navigate],
  );

  // Global Search Results across modules + 28 public pages
  const globalSearchMatches = useMemo(() => {
    const q = globalSearch.trim().toLowerCase();
    if (!q) return { modules: [], pageRoutes: [] };

    const permittedModules = ADMIN_MODULE_GROUPS.flatMap((g) =>
      g.items.filter((item) => permissions.read.includes(item.id)),
    ).filter((item) => item.label.toLowerCase().includes(q) || item.id.toLowerCase().includes(q));

    const matchingPages = pages
      .filter(
        (p) =>
          p.name.toLowerCase().includes(q) ||
          p.route.toLowerCase().includes(q) ||
          p.slug.toLowerCase().includes(q),
      )
      .slice(0, 6);

    return {
      modules: permittedModules.slice(0, 5),
      pageRoutes: matchingPages,
    };
  }, [globalSearch, permissions.read, pages]);

  const notifications = dashboard?.notifications ?? [];

  if (sessionState === 'loading') {
    return (
      <div className="min-h-screen bg-[#0D1422] text-[#FFFDF8] flex items-center justify-center">
        <p className="font-editorial text-lg text-[#F7D774]">Verifying Secretariat Session…</p>
      </div>
    );
  }

  if (sessionState === 'unauthenticated' || !user) {
    return <Navigate to="/admin/login" replace state={{ from: location.pathname }} />;
  }

  if (sessionState === 'forbidden') {
    return <Navigate to="/admin/access-denied" replace />;
  }

  if (sessionState === 'password-change-required') {
    return (
      <ForcedPasswordChangeScreen
        onSuccess={() => {
          clearAdminSessionToken();
          navigate('/admin/login', { replace: true });
        }}
      />
    );
  }

  const canWriteActive = permissions.write.includes(activeModule);
  const currentGroupItem = ADMIN_MODULE_GROUPS.flatMap((g) => g.items).find(
    (i) => i.id === activeModule,
  );
  const activeCollectionSpec = COLLECTION_MODULE_MAP[activeModule];

  return (
    <div className="admin-executive-theme min-h-screen flex flex-col bg-[var(--color-canvas)] text-[var(--color-ink)]">
      {/* Executive Command Header */}
      <header className="sticky top-0 z-30 h-16 bg-[#17233A] text-[#FFFDF8] border-b border-[#D4A537]/35 px-4 sm:px-6 flex items-center justify-between gap-3 print:hidden">
        <div className="flex items-center gap-3 min-w-0">
          <button
            type="button"
            aria-label="Toggle admin navigation"
            onClick={() => setMobileNavOpen((prev) => !prev)}
            className="lg:hidden inline-flex items-center justify-center w-9 h-9 rounded-lg border border-[#D4A537]/40 text-[#F7D774] cursor-pointer"
          >
            {mobileNavOpen ? <X className="w-4 h-4" /> : <Menu className="w-4 h-4" />}
          </button>

          <ShieldCheck className="w-5 h-5 text-[#F7D774] shrink-0" />
          <div className="min-w-0">
            <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-[#D4A537] truncate">
              Mahotsav 2027 · Command Centre
            </p>
            <p className="font-editorial text-base sm:text-lg truncate">{user.name}</p>
          </div>
          <span
            data-testid="admin-active-role"
            className="hidden sm:inline-flex px-2.5 py-0.5 rounded border border-[#D4A537]/50 text-[10px] font-mono uppercase text-[#F7D774]"
          >
            {user.role}
          </span>
        </div>

        {/* Global Search Input */}
        <div className="hidden md:block relative flex-1 max-w-sm">
          <Search className="w-3.5 h-3.5 text-[#D4A537] absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="search"
            value={globalSearch}
            onChange={(e) => setGlobalSearch(e.target.value)}
            data-testid="admin-global-search"
            placeholder="Jump to page route (/about, /gita) or module…"
            aria-label="Search modules and public routes"
            className="w-full min-h-[36px] pl-8 pr-3 rounded-lg border border-[#D4A537]/40 bg-[#0D1422]/60 text-xs text-[#FFFDF8] placeholder:text-[#EAE3D6]/60 focus:outline-none focus:border-[#F7D774]"
          />
          {globalSearch.trim() && (
            <div className="absolute left-0 right-0 mt-1.5 rounded-xl border border-[var(--color-border)] bg-[var(--surface-elevated)] text-[var(--color-ink)] shadow-[0_18px_40px_rgba(11,17,28,0.45)] p-2 z-50 space-y-2 text-xs">
              {globalSearchMatches.pageRoutes.length === 0 &&
              globalSearchMatches.modules.length === 0 ? (
                <p className="px-3 py-2 text-[var(--color-muted)]">No matching routes or modules.</p>
              ) : (
                <>
                  {globalSearchMatches.pageRoutes.length > 0 && (
                    <div>
                      <p className="px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.12em] text-[var(--color-bronze)]">
                        Public Routes (Open in Page Builder)
                      </p>
                      {globalSearchMatches.pageRoutes.map((p) => (
                        <button
                          key={p.id}
                          type="button"
                          onClick={() => handleOpenPageInBuilder(p.id)}
                          className="w-full text-left px-2.5 py-1.5 rounded-lg hover:bg-[#D4A537]/15 flex items-center justify-between gap-2 cursor-pointer"
                        >
                          <span className="font-medium truncate">{p.name}</span>
                          <span className="font-mono text-[11px] text-[var(--color-muted)]">
                            {p.route}
                          </span>
                        </button>
                      ))}
                    </div>
                  )}
                  {globalSearchMatches.modules.length > 0 && (
                    <div>
                      <p className="px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.12em] text-[var(--color-bronze)]">
                        Admin Workspaces
                      </p>
                      {globalSearchMatches.modules.map((m) => (
                        <button
                          key={m.id}
                          type="button"
                          onClick={() => handleSelectModule(m.id)}
                          className="w-full text-left px-2.5 py-1.5 rounded-lg hover:bg-[#D4A537]/15 flex items-center justify-between gap-2 cursor-pointer"
                        >
                          <span className="font-medium">{m.label}</span>
                          <span className="font-mono text-[11px] text-[var(--color-muted)]">
                            {m.id}
                          </span>
                        </button>
                      ))}
                    </div>
                  )}
                </>
              )}
            </div>
          )}
        </div>

        {/* Right Utility Controls */}
        <div className="flex items-center gap-2">
          {/* Notifications Bell */}
          <div className="relative">
            <button
              type="button"
              data-testid="admin-notifications-btn"
              aria-label="Secretariat Notifications"
              onClick={() => setNotifOpen((prev) => !prev)}
              className="relative inline-flex items-center justify-center w-9 h-9 rounded-lg border border-[#D4A537]/45 text-[#F7D774] hover:bg-[#D4A537]/15 cursor-pointer"
            >
              <Bell className="w-4 h-4" />
              {notifications.length > 0 && (
                <span className=" -top-1.5 -right-1.5 absolute min-w-[18px] h-[18px] px-1 rounded-full bg-[#D4A537] text-[#171717] text-[10px] font-mono font-bold flex items-center justify-center tabular-nums">
                  {notifications.length}
                </span>
              )}
            </button>

            {notifOpen && (
              <div
                data-testid="admin-notifications-popover"
                className="absolute right-0 mt-2 w-80 sm:w-96 rounded-xl border border-[var(--color-border)] bg-[var(--surface-elevated)] text-[var(--color-ink)] shadow-[0_20px_50px_rgba(11,17,28,0.45)] overflow-hidden z-50"
              >
                <div className="px-4 py-3 border-b border-[var(--color-border)] flex items-center justify-between">
                  <span className="text-[11px] font-semibold uppercase tracking-[0.14em] text-[var(--color-bronze)]">
                    Secretariat Alerts ({notifications.length})
                  </span>
                  <button
                    type="button"
                    onClick={() => setNotifOpen(false)}
                    aria-label="Close notifications"
                    className="p-1 text-[var(--color-muted)] hover:text-[var(--color-ink)] cursor-pointer"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
                {notifications.length === 0 ? (
                  <p className="p-4 text-xs text-[var(--color-muted)]">
                    All workflows and drafts are settled.
                  </p>
                ) : (
                  <div className="divide-y divide-[var(--color-border)] max-h-80 overflow-y-auto">
                    {notifications.map((item) => (
                      <button
                        key={item.id}
                        type="button"
                        onClick={() => {
                          if (ALL_MODULE_IDS.has(item.targetModule)) {
                            handleSelectModule(item.targetModule as AdminModuleId);
                          } else {
                            setNotifOpen(false);
                          }
                        }}
                        className="w-full text-left px-4 py-3 hover:bg-[#D4A537]/10 space-y-1 cursor-pointer"
                      >
                        <div className="flex items-center justify-between gap-2">
                          <span className="text-xs font-semibold text-[var(--color-ink)]">
                            {item.title}
                          </span>
                          <AdminStatusBadge status={item.severity} />
                        </div>
                        <p className="text-[11px] text-[var(--color-muted)] leading-snug">
                          {item.detail}
                        </p>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>

          <div className="hidden sm:block">
            <LanguageSelector tone="dark" compact />
          </div>
          <ThemeToggle />

          <Link
            to="/"
            className="hidden md:inline-flex items-center gap-1.5 min-h-[36px] px-3 rounded-lg border border-[#D4A537]/40 text-xs text-[#EAE3D6] hover:border-[#F7D774]"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Public Site</span>
          </Link>
          <button
            type="button"
            data-testid="admin-logout-btn"
            onClick={() => void handleLogout()}
            className="inline-flex items-center gap-1.5 min-h-[36px] px-3 rounded-lg border border-[#D4A537]/45 text-xs font-medium text-[#F7D774] hover:bg-[#D4A537]/15 cursor-pointer"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Sign Out</span>
          </button>
        </div>
      </header>

      <div className="flex-1 flex flex-col lg:flex-row">
        {/* RBAC Filtered Sidebar Navigation (Desktop persistent + Mobile drawer) */}
        <aside
          className={`${
            mobileNavOpen ? 'block' : 'hidden'
          } lg:block lg:w-64 shrink-0 border-b lg:border-b-0 lg:border-r border-[var(--color-border)] bg-[var(--surface-elevated)] p-4 space-y-5 print:hidden`}
        >
          {ADMIN_MODULE_GROUPS.map((grp) => {
            const visibleItems = grp.items.filter((item) => permissions.read.includes(item.id));
            if (visibleItems.length === 0) return null;
            return (
              <div key={grp.group} className="space-y-1.5">
                <p className="px-2.5 text-[10px] font-semibold uppercase tracking-[0.16em] text-[var(--color-bronze)]">
                  {grp.group}
                </p>
                <div className="flex flex-wrap lg:flex-col gap-1">
                  {visibleItems.map((item) => {
                    const active = activeModule === item.id;
                    return (
                      <button
                        key={item.id}
                        type="button"
                        data-testid={`admin-nav-${item.id}`}
                        onClick={() => handleSelectModule(item.id)}
                        className={`text-left px-3 py-2 rounded-lg text-xs font-medium transition-colors whitespace-nowrap cursor-pointer ${
                          active
                            ? 'bg-[#17233A] text-[#F7D774] dark:bg-[#D4A537] dark:text-[#171717]'
                            : 'text-[var(--color-muted)] hover:text-[var(--color-ink)] hover:bg-[#D4A537]/10'
                        }`}
                      >
                        {item.label}
                      </button>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </aside>

        {/* Active Module Workspace */}
        <main className="flex-1 min-w-0 p-4 sm:p-6 lg:p-8 space-y-6 max-w-7xl">
          <div className="flex flex-wrap items-center justify-between gap-4 pb-4 border-b border-[var(--color-border)]">
            <div>
              <h1 className="font-editorial text-2xl sm:text-3xl text-[var(--color-ink)]">
                {currentGroupItem?.label ?? 'Executive Dashboard'}
              </h1>
              <p className="text-xs text-[var(--color-muted)]">
                Access Level: {canWriteActive ? 'Read & Write' : 'Read-Only Auditor Mode'}
              </p>
            </div>
            <button
              type="button"
              onClick={() => void loadModuleData(activeModule, permissions, dashboardRange)}
              className="inline-flex items-center gap-1.5 min-h-[36px] px-3.5 rounded-lg border border-[var(--color-border)] text-xs hover:border-[#D4A537] cursor-pointer print:hidden"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${moduleLoading ? 'animate-spin' : ''}`} />
              <span>Refresh</span>
            </button>
          </div>

          {moduleForbidden && (
            <div
              role="alert"
              data-testid="admin-module-forbidden"
              className="rounded-xl border border-amber-500/40 bg-amber-500/10 p-6 space-y-3"
            >
              <div className="flex items-center gap-2 text-amber-800 dark:text-amber-300 font-semibold text-sm">
                <ShieldAlert className="w-4 h-4 shrink-0" />
                <span>Module Authorization Restricted</span>
              </div>
              <p className="text-xs text-[var(--color-muted)]">{moduleForbidden}</p>
              <div className="flex flex-wrap gap-2">
                {permissions.read[0] && (
                  <button
                    type="button"
                    onClick={() => handleSelectModule(permissions.read[0])}
                    className="px-4 py-1.5 rounded-lg royal-gold-surface text-xs font-semibold cursor-pointer"
                  >
                    Return to Permitted Workspace
                  </button>
                )}
                <Link
                  to="/admin/access-denied"
                  state={{ reason: moduleForbidden }}
                  className="px-4 py-1.5 rounded-lg border border-[#D4A537]/55 text-xs font-medium"
                >
                  View Access Details
                </Link>
              </div>
            </div>
          )}

          {moduleError && (
            <div
              role="alert"
              data-testid="admin-module-error"
              className="rounded-xl border border-red-500/40 bg-red-500/10 p-5 flex flex-wrap items-center justify-between gap-4"
            >
              <div className="flex items-center gap-2.5 text-xs text-red-700 dark:text-red-300">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{moduleError}</span>
              </div>
              <button
                type="button"
                onClick={() => void loadModuleData(activeModule, permissions, dashboardRange)}
                className="px-4 py-1.5 rounded-lg border border-red-500/45 text-xs font-medium text-red-700 dark:text-red-300 cursor-pointer"
              >
                Retry
              </button>
            </div>
          )}

          {moduleLoading && !moduleError && !moduleForbidden && (
            <div
              data-testid="admin-module-loading"
              className="rounded-xl border border-[var(--color-border)] bg-[var(--surface-elevated)] p-10 flex items-center justify-center gap-3 text-xs text-[var(--color-muted)]"
            >
              <Loader2 className="w-4 h-4 animate-spin text-[#D4A537]" />
              <span>Loading {currentGroupItem?.label ?? activeModule} records…</span>
            </div>
          )}

          {!moduleLoading && !moduleError && !moduleForbidden && (
            <>
              {activeModule === 'overview' && dashboard && (
                <AdminDashboardOverview
                  data={dashboard}
                  activeRange={dashboardRange}
                  onRangeChange={setDashboardRange}
                  onNavigateModule={handleSelectModule}
                />
              )}

              {activeModule === 'websiteInventory' && (
                <AdminWebsiteInventoryPanel
                  pages={pages}
                  canWrite={canWriteActive}
                  onEditPage={handleOpenPageInBuilder}
                  onRefresh={() => void loadModuleData('websiteInventory', permissions)}
                  onToast={pushToast}
                />
              )}

              {activeModule === 'pageBuilder' && (
                <AdminPageBuilderPanel
                  pages={pages}
                  mediaAssets={mediaAssets}
                  initialPageId={selectedBuilderPageId}
                  canWrite={canWriteActive}
                  onRefresh={() => void loadModuleData('pageBuilder', permissions)}
                  onToast={pushToast}
                />
              )}

              {(activeModule === 'carousels' ||
                activeModule === 'gallery' ||
                activeModule === 'video') && (
                <AdminMediaStudioPanel
                  initialTab={
                    activeModule === 'carousels'
                      ? 'carousels'
                      : activeModule === 'video'
                        ? 'videos'
                        : 'images'
                  }
                  assets={mediaAssets}
                  carousels={carousels}
                  canWrite={
                    activeModule === 'video'
                      ? permissions.write.includes('video')
                      : permissions.write.includes('gallery')
                  }
                  canWriteCarousels={permissions.write.includes('carousels')}
                  onRefresh={() => void loadModuleData(activeModule, permissions)}
                  onToast={pushToast}
                />
              )}

              {(activeModule === 'chapters' || activeModule === 'scripture') && (
                <AdminGitaStudioPanel
                  initialTab={activeModule === 'scripture' ? 'verses' : 'chapters'}
                  chapters={scriptureData.chapters}
                  verses={scriptureData.verses}
                  canWrite={permissions.write.includes('scripture')}
                  onRefresh={() => void loadModuleData(activeModule, permissions)}
                  onToast={pushToast}
                />
              )}

              {activeModule === 'story' && (
                <AdminStoryStudioPanel
                  scenes={storyScenes}
                  glbs={storyGlbs}
                  canWrite={canWriteActive}
                  onRefresh={() => void loadModuleData('story', permissions)}
                  onToast={pushToast}
                />
              )}

              {activeCollectionSpec && (
                <AdminCollectionsPanel
                  kind={activeCollectionSpec.kind}
                  heading={activeCollectionSpec.heading}
                  canWrite={canWriteActive}
                  onToast={pushToast}
                />
              )}

              {(activeModule === 'participants' || activeModule === 'registrations') && (
                <AdminParticipantsPanel
                  participants={participants}
                  canWrite={canWriteActive}
                  onRefresh={() => void loadModuleData(activeModule, permissions)}
                  onToast={pushToast}
                />
              )}

              {activeModule === 'payments' && paymentsData && (
                <AdminPaymentsPanel
                  payments={paymentsData.payments}
                  refunds={paymentsData.refunds}
                  gatewayStatus={paymentsData.gatewayStatus}
                  canWrite={canWriteActive}
                  onRefresh={() => void loadModuleData('payments', permissions)}
                  onToast={pushToast}
                />
              )}

              {activeModule === 'volunteers' && (
                <AdminVolunteersPanel
                  volunteers={volunteers}
                  canWrite={canWriteActive}
                  onRefresh={() => void loadModuleData('volunteers', permissions)}
                  onToast={pushToast}
                />
              )}

              {activeModule === 'membership' && (
                <AdminMembershipsPanel
                  memberships={memberships}
                  canWrite={canWriteActive}
                  onRefresh={() => void loadModuleData('membership', permissions)}
                  onToast={pushToast}
                />
              )}

              {LEGACY_CMS_SECTION_IDS.has(activeModule) && (
                <AdminCmsPanel
                  section={activeModule as CmsEntry['section']}
                  sectionLabel={currentGroupItem?.label ?? activeModule}
                  items={cmsItems}
                  canWrite={canWriteActive}
                  onRefresh={() => void loadModuleData(activeModule, permissions)}
                />
              )}

              {activeModule === 'users' && (
                <AdminUsersPanel
                  users={users}
                  canWrite={canWriteActive}
                  onRefresh={() => void loadModuleData('users', permissions)}
                  onToast={pushToast}
                />
              )}

              {activeModule === 'analytics' && dashboard && (
                <AdminAnalyticsPanel data={dashboard} />
              )}

              {activeModule === 'audit' && <AdminAuditPanel auditLogs={auditLogs} />}

              {activeModule === 'settings' && settingsData && (
                <AdminSettingsPanel
                  settings={settingsData.settings}
                  backups={settingsData.backups}
                  canWrite={canWriteActive}
                  onRefresh={() => void loadModuleData('settings', permissions)}
                  onToast={pushToast}
                />
              )}
            </>
          )}
        </main>
      </div>

      <AdminToastStack toasts={toasts} onDismiss={dismissToast} />
    </div>
  );
};

export default AdminPage;
