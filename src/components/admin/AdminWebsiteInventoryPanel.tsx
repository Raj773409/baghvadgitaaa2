import React, { useMemo, useState } from 'react';
import {
  CheckCircle2,
  ExternalLink,
  Layers,
  PenSquare,
  RefreshCw,
  Search,
} from 'lucide-react';
import { adminFetch } from '../../utils/adminSession';
import { paginateRecords, type PageInventoryRecord } from '../../utils/cmsSync';
import {
  AdminConfirmModal,
  AdminPaginationBar,
  AdminStatusBadge,
  type AdminToastMessage,
} from './AdminUiPrimitives';
import { invalidatePublicCmsCache } from '../../hooks/usePublicCms';

interface AdminWebsiteInventoryPanelProps {
  pages: PageInventoryRecord[];
  canWrite: boolean;
  onEditPage: (pageId: string) => void;
  onRefresh: () => void;
  onToast: (toast: Omit<AdminToastMessage, 'id'>) => void;
}

const CATEGORIES: Array<{ id: 'all' | PageInventoryRecord['category']; label: string }> = [
  { id: 'all', label: 'All Routes' },
  { id: 'core', label: 'Core' },
  { id: 'scripture', label: 'Scripture' },
  { id: 'programme', label: 'Programme' },
  { id: 'participation', label: 'Participation' },
  { id: 'governance', label: 'Governance' },
  { id: 'media', label: 'Media' },
  { id: 'support', label: 'Support' },
  { id: 'legal', label: 'Legal' },
];

export const AdminWebsiteInventoryPanel: React.FC<AdminWebsiteInventoryPanelProps> = ({
  pages,
  canWrite,
  onEditPage,
  onRefresh,
  onToast,
}) => {
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] =
    useState<'all' | PageInventoryRecord['category']>('all');
  const [statusFilter, setStatusFilter] = useState<'all' | 'published' | 'has-draft'>('all');
  const [pageIdx, setPageIdx] = useState(1);
  const [confirmSyncOpen, setConfirmSyncOpen] = useState(false);
  const [syncing, setSyncing] = useState(false);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return pages.filter((p) => {
      if (categoryFilter !== 'all' && p.category !== categoryFilter) return false;
      if (statusFilter === 'published' && p.status !== 'published') return false;
      if (statusFilter === 'has-draft' && !p.hasUnpublishedDraft) return false;
      if (!q) return true;
      return `${p.name} ${p.route} ${p.slug} ${p.category} ${p.updatedBy}`
        .toLowerCase()
        .includes(q);
    });
  }, [pages, search, categoryFilter, statusFilter]);

  const pageSize = 10;
  const paged = paginateRecords(filtered, pageIdx, pageSize);

  const stats = useMemo(() => {
    const publishedCount = pages.filter((p) => p.status === 'published').length;
    const draftCount = pages.filter((p) => p.hasUnpublishedDraft).length;
    const totalBlocks = pages.reduce((sum, p) => sum + p.publishedVersion.blocks.length, 0);
    return {
      total: pages.length,
      publishedCount,
      draftCount,
      totalBlocks,
    };
  }, [pages]);

  const handleSyncAll = async () => {
    setSyncing(true);
    try {
      const res = await adminFetch('/api/admin/pages/sync-all', { method: 'POST' });
      const json = (await res.json().catch(() => ({}))) as {
        error?: string;
        totalPages?: number;
        backup?: { fileName: string };
      };
      if (!res.ok) {
        throw new Error(json.error || 'Could not synchronize website inventory.');
      }
      invalidatePublicCmsCache();
      setConfirmSyncOpen(false);
      onToast({
        kind: 'success',
        title: 'Website Inventory Synchronized',
        detail: `${json.totalPages ?? pages.length} routes verified · Pre-sync backup ${json.backup?.fileName ?? 'created'}.`,
      });
      onRefresh();
    } catch (err) {
      onToast({
        kind: 'error',
        title: 'Sync Failed',
        detail: err instanceof Error ? err.message : 'Unable to sync routes.',
      });
    } finally {
      setSyncing(false);
    }
  };

  return (
    <div className="space-y-6" data-testid="website-inventory-panel">
      {/* Top KPI Strip */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="rounded-xl border border-[var(--color-border)] bg-[var(--surface-elevated)] p-4 space-y-1">
          <p className="text-[11px] font-medium text-[var(--color-muted)]">Canonical Public Routes</p>
          <p className="font-display text-3xl font-light text-[var(--color-ink)] tabular-nums">
            {stats.total}
          </p>
        </div>
        <div className="rounded-xl border border-[var(--color-border)] bg-[var(--surface-elevated)] p-4 space-y-1">
          <p className="text-[11px] font-medium text-[var(--color-muted)]">CMS-Connected Live</p>
          <p className="font-display text-3xl font-light text-[var(--color-ink)] tabular-nums">
            {stats.publishedCount}
          </p>
        </div>
        <div className="rounded-xl border border-[var(--color-border)] bg-[var(--surface-elevated)] p-4 space-y-1">
          <p className="text-[11px] font-medium text-[var(--color-muted)]">Unpublished Drafts</p>
          <p className="font-display text-3xl font-light text-[var(--color-bronze)] tabular-nums">
            {stats.draftCount}
          </p>
        </div>
        <div className="rounded-xl border border-[var(--color-border)] bg-[var(--surface-elevated)] p-4 space-y-1">
          <p className="text-[11px] font-medium text-[var(--color-muted)]">Managed Section Blocks</p>
          <p className="font-display text-3xl font-light text-[var(--color-ink)] tabular-nums">
            {stats.totalBlocks}
          </p>
        </div>
      </div>

      {/* Filters & Sync Toolbar */}
      <div className="rounded-xl border border-[var(--color-border)] bg-[var(--surface-elevated)] p-4 space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-2.5 flex-1 min-w-[240px]">
            <div className="relative flex-1 max-w-sm">
              <Search className="w-4 h-4 text-[var(--color-muted)] absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="search"
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value);
                  setPageIdx(1);
                }}
                placeholder="Search route, page name, or slug…"
                className="w-full min-h-[38px] pl-9 pr-3 rounded-lg border border-[var(--color-border)] bg-[var(--color-canvas)] text-xs text-[var(--color-ink)]"
              />
            </div>

            <select
              value={statusFilter}
              onChange={(e) => {
                setStatusFilter(e.target.value as 'all' | 'published' | 'has-draft');
                setPageIdx(1);
              }}
              aria-label="Filter by sync state"
              className="min-h-[38px] px-3 rounded-lg border border-[var(--color-border)] bg-[var(--color-canvas)] text-xs text-[var(--color-ink)]"
            >
              <option value="all">All Sync States</option>
              <option value="published">Published Live</option>
              <option value="has-draft">Unpublished Drafts Staged</option>
            </select>
          </div>

          {canWrite && (
            <button
              type="button"
              data-testid="sync-all-routes-btn"
              onClick={() => setConfirmSyncOpen(true)}
              className="inline-flex items-center gap-2 min-h-[38px] px-4 rounded-lg royal-gold-surface text-xs font-semibold cursor-pointer whitespace-nowrap"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>Sync &amp; Backup Static Content</span>
            </button>
          )}
        </div>

        <div className="flex flex-wrap items-center gap-1.5">
          {CATEGORIES.map((cat) => {
            const active = categoryFilter === cat.id;
            return (
              <button
                key={cat.id}
                type="button"
                onClick={() => {
                  setCategoryFilter(cat.id);
                  setPageIdx(1);
                }}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors whitespace-nowrap cursor-pointer ${
                  active
                    ? 'bg-[#17233A] text-[#F7D774] dark:bg-[#D4A537] dark:text-[#171717]'
                    : 'bg-[var(--color-canvas)] text-[var(--color-muted)] hover:text-[var(--color-ink)]'
                }`}
              >
                {cat.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Routes Inventory Table */}
      <div className="rounded-xl border border-[var(--color-border)] bg-[var(--surface-elevated)] overflow-hidden">
        {paged.items.length === 0 ? (
          <div className="p-10 text-center space-y-2">
            <Layers className="w-6 h-6 mx-auto text-[var(--color-bronze)]" />
            <p className="text-sm font-medium text-[var(--color-ink)]">No matching routes</p>
            <p className="text-xs text-[var(--color-muted)]">
              Reset the category or search filter to inspect all 28 Mahotsav pages.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-[var(--color-border)] text-[var(--color-bronze)] uppercase tracking-[0.08em]">
                  <th className="p-3.5">Page Title</th>
                  <th className="p-3.5">Public Route</th>
                  <th className="p-3.5">Category</th>
                  <th className="p-3.5 text-right">Sections</th>
                  <th className="p-3.5">Sync &amp; Draft State</th>
                  <th className="p-3.5">Last Updated</th>
                  <th className="p-3.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--color-border)]">
                {paged.items.map((pg) => (
                  <tr key={pg.id} data-testid={`inventory-row-${pg.id}`} className="hover:bg-[#D4A537]/5">
                    <td className="p-3.5">
                      <p className="font-semibold text-[var(--color-ink)]">{pg.name}</p>
                      <p className="text-[11px] text-[var(--color-muted)] truncate max-w-xs">
                        {pg.publishedVersion.title.en}
                      </p>
                    </td>
                    <td className="p-3.5 font-mono text-[11px] text-[var(--color-ink)] whitespace-nowrap">
                      {pg.route}
                    </td>
                    <td className="p-3.5 capitalize text-[var(--color-muted)]">{pg.category}</td>
                    <td className="p-3.5 text-right tabular-nums font-mono">
                      {pg.draftVersion.blocks.length}
                    </td>
                    <td className="p-3.5">
                      <div className="flex flex-wrap items-center gap-1.5">
                        <AdminStatusBadge status={pg.status} />
                        {pg.hasUnpublishedDraft && (
                          <AdminStatusBadge status="unpublished-draft" />
                        )}
                      </div>
                    </td>
                    <td className="p-3.5 tabular-nums text-[var(--color-muted)] whitespace-nowrap">
                      <span>{new Date(pg.updatedAt).toLocaleDateString()}</span>
                      <span className="block text-[10px]">{pg.updatedBy}</span>
                    </td>
                    <td className="p-3.5 text-right">
                      <div className="inline-flex items-center justify-end gap-2">
                        <button
                          type="button"
                          data-testid={`edit-page-btn-${pg.id}`}
                          onClick={() => onEditPage(pg.id)}
                          className="inline-flex items-center gap-1 min-h-[32px] px-3 rounded-lg border border-[#9C6B1E]/45 text-[var(--color-ink)] hover:bg-[#D4A537]/15 cursor-pointer whitespace-nowrap"
                        >
                          <PenSquare className="w-3.5 h-3.5 text-[var(--color-bronze)]" />
                          <span>Edit in Studio</span>
                        </button>
                        <a
                          href={pg.route}
                          target="_blank"
                          rel="noopener noreferrer"
                          aria-label={`View live route ${pg.route}`}
                          className="inline-flex items-center justify-center w-8 h-8 rounded-lg border border-[var(--color-border)] text-[var(--color-muted)] hover:text-[var(--color-ink)] hover:border-[var(--color-bronze)]"
                        >
                          <ExternalLink className="w-3.5 h-3.5" />
                        </a>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        <AdminPaginationBar
          page={paged.page}
          totalPages={paged.totalPages}
          totalItems={paged.totalItems}
          pageSize={pageSize}
          onPageChange={setPageIdx}
        />
      </div>

      <div className="rounded-xl border border-[var(--color-border)] bg-[var(--surface-elevated)] p-4 flex items-center gap-3 text-xs text-[var(--color-muted)]">
        <CheckCircle2 className="w-4 h-4 text-[var(--color-bronze)] shrink-0" />
        <span>
          Every public route above reads published snapshots directly from{' '}
          <code className="font-mono text-[var(--color-ink)]">/api/public/cms</code>. Staged drafts remain isolated until explicitly published.
        </span>
      </div>

      <AdminConfirmModal
        open={confirmSyncOpen}
        title="Sync & Backup Website Inventory"
        description="This creates a full JSON database backup snapshot first, then verifies all 28 canonical public routes and missing baseline blocks without overwriting your customized content."
        targetSummary={`${pages.length} canonical routes across core, scripture, programme, participation, media, support, and legal sections.`}
        confirmLabel="Create Backup & Sync"
        busy={syncing}
        onCancel={() => setConfirmSyncOpen(false)}
        onConfirm={() => void handleSyncAll()}
      />
    </div>
  );
};
