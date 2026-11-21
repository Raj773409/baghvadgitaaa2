import React from 'react';
import {
  BookOpen,
  CalendarDays,
  CheckCircle2,
  FileCode2,
  Globe2,
  HandHeart,
  History,
  Image as ImageIcon,
  ShieldAlert,
  Users,
  Wallet,
} from 'lucide-react';
import type { AdminModuleId, DashboardPayload } from './adminTypes';
import { AdminStatusBadge } from './AdminUiPrimitives';

interface AdminDashboardOverviewProps {
  data: DashboardPayload;
  activeRange: 'all' | '7d' | '30d';
  onRangeChange: (nextRange: 'all' | '7d' | '30d') => void;
  onNavigateModule: (id: AdminModuleId) => void;
}

const RANGE_OPTIONS: ReadonlyArray<{ id: 'all' | '7d' | '30d'; label: string }> = [
  { id: 'all', label: 'All Time' },
  { id: '30d', label: 'Last 30 Days' },
  { id: '7d', label: 'Last 7 Days' },
];

export const AdminDashboardOverview: React.FC<AdminDashboardOverviewProps> = ({
  data,
  activeRange,
  onRangeChange,
  onNavigateModule,
}) => {
  const {
    metrics,
    countryBreakdown,
    typeBreakdown,
    recentAudit,
    recentRevisions = [],
    gatewayStatus,
  } = data;

  const cards: ReadonlyArray<{
    label: string;
    value: string;
    detail: string;
    icon: React.ComponentType<{ className?: string }>;
    target: AdminModuleId;
  }> = [
    {
      label: 'Delegate Registrations',
      value: String(metrics.totalRegistrations),
      detail: `${metrics.totalHeadcount} total persons · ${metrics.totalMembers} charter members`,
      icon: Users,
      target: 'participants',
    },
    {
      label: 'Verified / Flagged',
      value: `${metrics.verifiedParticipants} / ${metrics.flaggedParticipants}`,
      detail: `${metrics.pendingParticipants} pending Secretariat verification`,
      icon: CheckCircle2,
      target: 'registrations',
    },
    {
      label: 'Declared Contributions',
      value: `₹ ${metrics.totalDeclaredInr.toLocaleString('en-IN')}`,
      detail: `Captured gateway: ₹ ${metrics.capturedRevenueInr.toLocaleString('en-IN')}`,
      icon: Wallet,
      target: 'payments',
    },
    {
      label: 'Volunteer Seva Force',
      value: String(metrics.totalVolunteers),
      detail: `${metrics.approvedVolunteers} approved · ${metrics.pendingVolunteers} pending review`,
      icon: HandHeart,
      target: 'volunteers',
    },
    {
      label: 'Website Routes & Drafts',
      value: `${metrics.publishedPages ?? 28} / ${metrics.totalPages ?? 28}`,
      detail: `${metrics.unpublishedDraftPages ?? 0} page draft(s) awaiting publish · ${metrics.totalCarousels ?? 2} carousels`,
      icon: FileCode2,
      target: 'websiteInventory',
    },
    {
      label: 'Media, Gita & 3D Studio',
      value: `${metrics.publishedMedia} / ${metrics.totalMedia}`,
      detail: `${metrics.totalChapters ?? 18} chapters · ${metrics.totalVerses ?? 0} verses · ${metrics.totalStoryScenes ?? 15} scenes`,
      icon: ImageIcon,
      target: 'gallery',
    },
  ];

  const maxCountryCount = Math.max(1, ...countryBreakdown.map((c) => c.count));
  const chartRows = countryBreakdown.slice(0, 8);
  const totalTypeCount = Math.max(
    1,
    typeBreakdown.reduce((sum, item) => sum + item.count, 0),
  );

  return (
    <div className="space-y-6">
      {/* Control Strip: Date Range Filter & Confirmed Milestones */}
      <div className="rounded-xl border border-[var(--color-border)] bg-[var(--surface-elevated)] p-4 flex flex-wrap items-center justify-between gap-4">
        <div className="flex flex-wrap items-center gap-3 text-xs">
          <span className="inline-flex items-center gap-1.5 font-semibold text-[var(--color-bronze)] uppercase tracking-[0.12em]">
            <CalendarDays className="w-3.5 h-3.5" />
            <span>Confirmed Schedule</span>
          </span>
          <span className="text-[var(--color-ink)] font-medium tabular-nums">
            20 Dec 2026 — Online Vishwa Ahvanam Curtain Raiser
          </span>
          <span className="text-[var(--color-muted)]" aria-hidden="true">
            ·
          </span>
          <span className="text-[var(--color-ink)] font-medium tabular-nums">
            27 Feb 2027 — Hyderabad Main Mahotsav
          </span>
        </div>

        <div
          role="group"
          aria-label="Filter dashboard metrics by date window"
          className="inline-flex items-center rounded-lg border border-[var(--color-border)] bg-[var(--color-canvas)] p-0.5"
        >
          {RANGE_OPTIONS.map((opt) => (
            <button
              key={opt.id}
              type="button"
              data-testid={`dashboard-range-${opt.id}`}
              onClick={() => onRangeChange(opt.id)}
              className={`px-3 py-1.5 rounded text-xs cursor-pointer transition-colors ${
                activeRange === opt.id
                  ? 'bg-[#17233A] text-[#F5E2B5] dark:bg-[#D5AF62] dark:text-[#171717] font-semibold'
                  : 'text-[var(--color-muted)] hover:text-[var(--color-ink)]'
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>

      {/* KPI Metrics Grid */}
      <div
        data-testid="admin-kpi-grid"
        className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4"
      >
        {cards.map((card) => {
          const Icon = card.icon;
          return (
            <button
              key={card.label}
              type="button"
              onClick={() => onNavigateModule(card.target)}
              className="text-left rounded-xl border border-[var(--color-border)] bg-[var(--surface-elevated)] p-5 hover:border-[#D5AF62] transition-colors cursor-pointer space-y-2"
            >
              <div className="flex items-center justify-between gap-2">
                <span className="text-[11px] font-semibold uppercase tracking-[0.14em] text-[var(--color-bronze)]">
                  {card.label}
                </span>
                <Icon className="w-4 h-4 text-[#D5AF62]" />
              </div>
              <p className="font-display text-3xl font-light text-[var(--color-ink)] tabular-nums">
                {card.value}
              </p>
              <p className="text-xs text-[var(--color-muted)] tabular-nums">{card.detail}</p>
            </button>
          );
        })}
      </div>

      {/* SVG Geographic Bar Chart + Track Breakdown + Gateway / Revisions */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div className="lg:col-span-7 rounded-xl border border-[var(--color-border)] bg-[var(--surface-elevated)] p-5 space-y-5">
          <div className="flex items-center justify-between gap-3 pb-3 border-b border-[var(--color-border)]">
            <div className="flex items-center gap-2">
              <Globe2 className="w-4 h-4 text-[#D5AF62]" />
              <h3 className="font-editorial text-xl text-[var(--color-ink)]">
                Country &amp; Track Breakdown
              </h3>
            </div>
            <span className="text-xs font-mono text-[var(--color-muted)]">
              Window: {activeRange.toUpperCase()}
            </span>
          </div>

          {chartRows.length === 0 ? (
            <div className="py-8 text-center space-y-1.5">
              <p className="text-sm text-[var(--color-ink)] font-medium">
                No delegate registrations in this time window
              </p>
              <p className="text-xs text-[var(--color-muted)]">
                Verified submissions on /participate/register populate this live distribution chart.
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              <svg
                viewBox={`0 0 560 ${chartRows.length * 32 + 12}`}
                role="img"
                aria-label="Registrations by country bar chart"
                className="w-full h-auto overflow-visible"
              >
                {chartRows.map((row, idx) => {
                  const y = idx * 32 + 6;
                  const barWidth = Math.max(8, Math.round((row.count / maxCountryCount) * 320));
                  return (
                    <g key={row.country}>
                      <text
                        x={0}
                        y={y + 15}
                        fill="currentColor"
                        className="text-[11px] fill-[var(--color-ink)] font-medium"
                      >
                        {row.country.length > 20 ? `${row.country.slice(0, 19)}…` : row.country}
                      </text>
                      <rect
                        x={160}
                        y={y + 3}
                        width={320}
                        height={14}
                        rx={3}
                        className="fill-[var(--color-canvas)] stroke-[var(--color-border)]"
                        strokeWidth={1}
                      />
                      <rect
                        x={160}
                        y={y + 3}
                        width={barWidth}
                        height={14}
                        rx={3}
                        fill="#D5AF62"
                      />
                      <text
                        x={494}
                        y={y + 14}
                        fill="currentColor"
                        className="text-[11px] font-mono fill-[var(--color-bronze)]"
                      >
                        {row.count}
                      </text>
                    </g>
                  );
                })}
              </svg>

              {typeBreakdown.length > 0 && (
                <div className="pt-4 border-t border-[var(--color-border)] space-y-2.5">
                  <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-[var(--color-bronze)]">
                    Registration Track Mix
                  </p>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
                    {typeBreakdown.map((t) => {
                      const share = Math.round((t.count / totalTypeCount) * 100);
                      return (
                        <div
                          key={t.type}
                          className="rounded-lg border border-[var(--color-border)] bg-[var(--color-canvas)] px-3 py-2 flex items-center justify-between gap-2 text-xs tabular-nums"
                        >
                          <span className="uppercase font-medium text-[var(--color-ink)]">
                            {t.type}
                          </span>
                          <span className="font-mono text-[var(--color-bronze)]">
                            {t.count} ({share}%)
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Quick Studio Shortcuts */}
          <div className="pt-3 border-t border-[var(--color-border)] flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => onNavigateModule('pageBuilder')}
              className="inline-flex items-center gap-1.5 min-h-[34px] px-3 rounded-lg border border-[var(--color-border)] text-xs hover:border-[var(--color-bronze)] cursor-pointer"
            >
              <FileCode2 className="w-3.5 h-3.5 text-[var(--color-bronze)]" />
              <span>Open Page Builder</span>
            </button>
            <button
              type="button"
              onClick={() => onNavigateModule('carousels')}
              className="inline-flex items-center gap-1.5 min-h-[34px] px-3 rounded-lg border border-[var(--color-border)] text-xs hover:border-[var(--color-bronze)] cursor-pointer"
            >
              <ImageIcon className="w-3.5 h-3.5 text-[var(--color-bronze)]" />
              <span>Manage Carousels</span>
            </button>
            <button
              type="button"
              onClick={() => onNavigateModule('chapters')}
              className="inline-flex items-center gap-1.5 min-h-[34px] px-3 rounded-lg border border-[var(--color-border)] text-xs hover:border-[var(--color-bronze)] cursor-pointer"
            >
              <BookOpen className="w-3.5 h-3.5 text-[var(--color-bronze)]" />
              <span>Gita 18 Chapters</span>
            </button>
          </div>
        </div>

        {/* Right Column: Gateway, Recent CMS Revisions & Audit Stream */}
        <div className="lg:col-span-5 space-y-5">
          <div className="rounded-xl border border-[var(--color-border)] bg-[var(--surface-elevated)] p-5 space-y-2.5">
            <div className="flex items-center justify-between gap-2">
              <span className="text-[11px] font-semibold uppercase tracking-[0.14em] text-[var(--color-bronze)]">
                Payment Gateway Integration
              </span>
              <ShieldAlert className="w-4 h-4 text-[#D5AF62]" />
            </div>
            <p className="text-sm font-medium text-[var(--color-ink)]">
              {gatewayStatus.configured
                ? 'Active Webhook HMAC Verification Configured'
                : 'External Payment Portal Handoff Mode'}
            </p>
            <p className="text-xs text-[var(--color-muted)] leading-relaxed">
              {gatewayStatus.configured
                ? `Configured providers: ${Object.entries(gatewayStatus.providers)
                    .filter(([, ok]) => ok)
                    .map(([name]) => name)
                    .join(', ')}.`
                : 'Zero simulated captures are generated. Set RAZORPAY_WEBHOOK_SECRET, STRIPE_WEBHOOK_SECRET, or PAYMENT_WEBHOOK_SECRET on the server to verify live webhooks.'}
            </p>
          </div>

          <div className="rounded-xl border border-[var(--color-border)] bg-[var(--surface-elevated)] p-5 space-y-3">
            <div className="flex items-center justify-between gap-2">
              <h3 className="font-editorial text-lg text-[var(--color-ink)] flex items-center gap-2">
                <History className="w-4 h-4 text-[var(--color-bronze)]" />
                <span>Recent CMS Revisions</span>
              </h3>
              <button
                type="button"
                onClick={() => onNavigateModule('pageBuilder')}
                className="text-[11px] font-medium text-[var(--color-bronze)] hover:underline cursor-pointer"
              >
                History
              </button>
            </div>
            {recentRevisions.length === 0 ? (
              <p className="text-xs text-[var(--color-muted)]">
                Save a draft or publish a page/carousel update to record versioned revisions.
              </p>
            ) : (
              <ul className="space-y-2.5 max-h-44 overflow-y-auto">
                {recentRevisions.slice(0, 5).map((rev) => (
                  <li
                    key={rev.id}
                    className="text-xs pb-2 border-b border-[var(--color-border)] last:border-b-0 space-y-1"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span className="font-semibold text-[var(--color-ink)] truncate">
                        {rev.entityTitle}
                      </span>
                      <AdminStatusBadge status={rev.action} />
                    </div>
                    <p className="text-[11px] text-[var(--color-muted)]">{rev.summary}</p>
                    <p className="text-[10px] font-mono text-[var(--color-muted)] tabular-nums">
                      {rev.actorEmail} · {new Date(rev.createdAt).toLocaleString()}
                    </p>
                  </li>
                ))}
              </ul>
            )}
          </div>

          <div className="rounded-xl border border-[var(--color-border)] bg-[var(--surface-elevated)] p-5 space-y-3">
            <div className="flex items-center justify-between gap-2">
              <h3 className="font-editorial text-lg text-[var(--color-ink)]">
                Recent Audit Stream
              </h3>
              <button
                type="button"
                onClick={() => onNavigateModule('audit')}
                className="text-[11px] font-medium text-[var(--color-bronze)] hover:underline cursor-pointer"
              >
                Full Log
              </button>
            </div>
            {recentAudit.length === 0 ? (
              <p className="text-xs text-[var(--color-muted)]">No audit actions logged yet.</p>
            ) : (
              <ul className="space-y-2.5 max-h-48 overflow-y-auto">
                {recentAudit.slice(0, 6).map((log) => (
                  <li
                    key={log.id}
                    className="text-xs pb-2 border-b border-[var(--color-border)] last:border-b-0"
                  >
                    <p className="font-medium text-[var(--color-ink)]">{log.summary}</p>
                    <p className="text-[11px] text-[var(--color-muted)] mt-0.5 tabular-nums">
                      {log.action} · {log.actorEmail} · {new Date(log.timestamp).toLocaleString()}
                    </p>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
