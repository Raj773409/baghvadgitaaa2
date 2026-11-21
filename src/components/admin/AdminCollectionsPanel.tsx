import React, { useEffect, useMemo, useState } from 'react';
import { Pencil, Plus, Trash2 } from 'lucide-react';
import { invalidatePublicCmsCache } from '../../hooks/usePublicCms';
import { adminFetch } from '../../utils/adminSession';
import {
  paginateRecords,
  type PublishStatus,
  type StructuredCollectionItem,
  type StructuredCollectionKind,
} from '../../utils/cmsSync';
import {
  AdminConfirmModal,
  AdminPaginationBar,
  AdminStatusBadge,
  type AdminToastMessage,
} from './AdminUiPrimitives';

interface AdminCollectionsPanelProps {
  kind: StructuredCollectionKind;
  heading: string;
  canWrite: boolean;
  onToast: (toast: Omit<AdminToastMessage, 'id'>) => void;
}

export const AdminCollectionsPanel: React.FC<AdminCollectionsPanelProps> = ({
  kind,
  heading,
  canWrite,
  onToast,
}) => {
  const [items, setItems] = useState<StructuredCollectionItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [pageIdx, setPageIdx] = useState(1);

  const [editingId, setEditingId] = useState<string | null>(null);
  const [title, setTitle] = useState('');
  const [subtitle, setSubtitle] = useState('');
  const [description, setDescription] = useState('');
  const [dateLabel, setDateLabel] = useState('');
  const [locationLabel, setLocationLabel] = useState('');
  const [badgeLabel, setBadgeLabel] = useState('');
  const [href, setHref] = useState('');
  const [status, setStatus] = useState<PublishStatus>('published');
  const [extraCategory, setExtraCategory] = useState('general');
  const [saving, setSaving] = useState(false);

  const [deleteTarget, setDeleteTarget] = useState<StructuredCollectionItem | null>(null);
  const [deleting, setDeleting] = useState(false);

  const fetchCollection = async () => {
    setLoading(true);
    try {
      const res = await adminFetch(`/api/admin/collections/${kind}`);
      if (!res.ok) throw new Error('Unable to load collection records.');
      const json = (await res.json()) as { items: StructuredCollectionItem[] };
      setItems(json.items ?? []);
    } catch (err) {
      onToast({
        kind: 'error',
        title: `Load Failed (${heading})`,
        detail: err instanceof Error ? err.message : 'Request failed.',
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    setEditingId(null);
    setTitle('');
    setSubtitle('');
    setDescription('');
    setDateLabel('');
    setLocationLabel('');
    setBadgeLabel('');
    setHref('');
    setStatus('published');
    setPageIdx(1);
    void fetchCollection();
  }, [kind]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return items;
    return items.filter((item) =>
      `${item.title} ${item.subtitle} ${item.description} ${item.locationLabel ?? ''} ${item.dateLabel ?? ''}`
        .toLowerCase()
        .includes(q),
    );
  }, [items, search]);

  const paged = paginateRecords(filtered, pageIdx, 10);

  const resetForm = () => {
    setEditingId(null);
    setTitle('');
    setSubtitle('');
    setDescription('');
    setDateLabel('');
    setLocationLabel('');
    setBadgeLabel('');
    setHref('');
    setStatus('published');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;
    setSaving(true);
    try {
      const url = editingId
        ? `/api/admin/collections/${kind}/${editingId}`
        : `/api/admin/collections/${kind}`;
      const method = editingId ? 'PATCH' : 'POST';
      const res = await adminFetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: title.trim(),
          subtitle: subtitle.trim(),
          description: description.trim(),
          dateLabel: dateLabel.trim() || undefined,
          locationLabel: locationLabel.trim() || undefined,
          badgeLabel: badgeLabel.trim() || undefined,
          href: href.trim() || undefined,
          status,
          meta: kind === 'faqs' ? { category: extraCategory } : {},
        }),
      });
      const json = (await res.json().catch(() => ({}))) as { error?: string };
      if (!res.ok) throw new Error(json.error || 'Could not save entry.');
      invalidatePublicCmsCache();
      onToast({
        kind: 'success',
        title: editingId ? `${heading} Updated` : `${heading} Created`,
        detail: `"${title.trim()}" saved (${status}).`,
      });
      resetForm();
      await fetchCollection();
    } catch (err) {
      onToast({
        kind: 'error',
        title: 'Save Failed',
        detail: err instanceof Error ? err.message : 'Save error.',
      });
    } finally {
      setSaving(false);
    }
  };

  const toggleStatus = async (item: StructuredCollectionItem) => {
    const next: PublishStatus = item.status === 'published' ? 'draft' : 'published';
    try {
      const res = await adminFetch(`/api/admin/collections/${kind}/${item.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: next }),
      });
      if (!res.ok) throw new Error('Could not update status.');
      invalidatePublicCmsCache();
      await fetchCollection();
    } catch (err) {
      onToast({
        kind: 'error',
        title: 'Status Update Failed',
        detail: err instanceof Error ? err.message : 'Error.',
      });
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      const res = await adminFetch(`/api/admin/collections/${kind}/${deleteTarget.id}`, {
        method: 'DELETE',
      });
      if (!res.ok) throw new Error('Delete failed.');
      setDeleteTarget(null);
      invalidatePublicCmsCache();
      onToast({
        kind: 'success',
        title: 'Entry Removed',
        detail: `"${deleteTarget.title}" removed from ${heading}.`,
      });
      await fetchCollection();
    } catch (err) {
      onToast({
        kind: 'error',
        title: 'Delete Failed',
        detail: err instanceof Error ? err.message : 'Delete error.',
      });
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div className="space-y-6" data-testid={`collections-panel-${kind}`}>
      {canWrite && (
        <form
          onSubmit={handleSubmit}
          className="rounded-xl border border-[var(--color-border)] bg-[var(--surface-elevated)] p-5 space-y-4 text-xs"
        >
          <div className="flex items-center justify-between gap-2">
            <p className="font-semibold uppercase tracking-[0.12em] text-[var(--color-bronze)] flex items-center gap-1.5">
              <Plus className="w-3.5 h-3.5" />
              <span>{editingId ? `Edit ${heading} Record` : `Add ${heading} Record`}</span>
            </p>
            {editingId && (
              <button
                type="button"
                onClick={resetForm}
                className="text-xs underline text-[var(--color-muted)] hover:text-[var(--color-ink)] cursor-pointer"
              >
                Cancel Edit
              </button>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <label className="space-y-1">
              <span className="text-[var(--color-muted)]">Title / Question *</span>
              <input
                type="text"
                required
                data-testid="collection-title-input"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full min-h-[36px] px-3 rounded-lg border border-[var(--color-border)] bg-[var(--color-canvas)]"
              />
            </label>
            <label className="space-y-1">
              <span className="text-[var(--color-muted)]">Subtitle / Role / Time Slot</span>
              <input
                type="text"
                value={subtitle}
                onChange={(e) => setSubtitle(e.target.value)}
                className="w-full min-h-[36px] px-3 rounded-lg border border-[var(--color-border)] bg-[var(--color-canvas)]"
              />
            </label>
            <label className="space-y-1">
              <span className="text-[var(--color-muted)]">Publish Status</span>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value as PublishStatus)}
                className="w-full min-h-[36px] px-3 rounded-lg border border-[var(--color-border)] bg-[var(--color-canvas)]"
              >
                <option value="published">Published Live</option>
                <option value="draft">Staged Draft</option>
                <option value="pending-review">Pending Review</option>
              </select>
            </label>

            <label className="space-y-1">
              <span className="text-[var(--color-muted)]">Date / Milestone Label</span>
              <input
                type="text"
                value={dateLabel}
                onChange={(e) => setDateLabel(e.target.value)}
                placeholder="e.g. 27 February 2027"
                className="w-full min-h-[36px] px-3 rounded-lg border border-[var(--color-border)] bg-[var(--color-canvas)]"
              />
            </label>
            <label className="space-y-1">
              <span className="text-[var(--color-muted)]">Location / Track Audience</span>
              <input
                type="text"
                value={locationLabel}
                onChange={(e) => setLocationLabel(e.target.value)}
                placeholder="Hyderabad / Global"
                className="w-full min-h-[36px] px-3 rounded-lg border border-[var(--color-border)] bg-[var(--color-canvas)]"
              />
            </label>
            <label className="space-y-1">
              <span className="text-[var(--color-muted)]">Badge / Classification</span>
              <input
                type="text"
                value={badgeLabel}
                onChange={(e) => setBadgeLabel(e.target.value)}
                placeholder="Confirmed / Role"
                className="w-full min-h-[36px] px-3 rounded-lg border border-[var(--color-border)] bg-[var(--color-canvas)]"
              />
            </label>

            {kind === 'faqs' && (
              <label className="space-y-1">
                <span className="text-[var(--color-muted)]">FAQ Category</span>
                <select
                  value={extraCategory}
                  onChange={(e) => setExtraCategory(e.target.value)}
                  className="w-full min-h-[36px] px-3 rounded-lg border border-[var(--color-border)] bg-[var(--color-canvas)]"
                >
                  <option value="general">General Overview</option>
                  <option value="curtain-raiser">Curtain Raiser</option>
                  <option value="participation">Participation</option>
                  <option value="travel">Hospitality &amp; Travel</option>
                  <option value="governance">Donations &amp; Rules</option>
                </select>
              </label>
            )}

            <label className="space-y-1 md:col-span-2">
              <span className="text-[var(--color-muted)]">Description / Answer / Summary</span>
              <textarea
                rows={2}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="w-full p-2.5 rounded-lg border border-[var(--color-border)] bg-[var(--color-canvas)]"
              />
            </label>
            <label className="space-y-1">
              <span className="text-[var(--color-muted)]">External Link (optional)</span>
              <input
                type="text"
                value={href}
                onChange={(e) => setHref(e.target.value)}
                placeholder="https://..."
                className="w-full min-h-[36px] px-3 rounded-lg border border-[var(--color-border)] bg-[var(--color-canvas)]"
              />
            </label>
          </div>

          <button
            type="submit"
            disabled={saving}
            data-testid="collection-save-btn"
            className="min-h-[38px] px-5 rounded-lg royal-gold-surface font-semibold cursor-pointer"
          >
            {saving ? 'Saving…' : editingId ? 'Save Changes' : `Add ${heading} Item`}
          </button>
        </form>
      )}

      {/* Records List */}
      <div className="rounded-xl border border-[var(--color-border)] bg-[var(--surface-elevated)] overflow-hidden">
        <div className="p-4 border-b border-[var(--color-border)] flex flex-wrap items-center justify-between gap-3">
          <input
            type="search"
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPageIdx(1);
            }}
            placeholder={`Search ${heading.toLowerCase()}…`}
            className="min-h-[36px] px-3 rounded-lg border border-[var(--color-border)] bg-[var(--color-canvas)] text-xs w-full sm:w-72"
          />
          <span className="text-xs text-[var(--color-muted)] tabular-nums">
            {items.length} structured records
          </span>
        </div>

        {loading ? (
          <p className="p-8 text-center text-xs text-[var(--color-muted)]">Loading records…</p>
        ) : paged.items.length === 0 ? (
          <p className="p-8 text-center text-xs text-[var(--color-muted)]">
            No custom records in {heading}. Built-in verified Secretariat content remains active on the public site.
          </p>
        ) : (
          <div className="divide-y divide-[var(--color-border)]">
            {paged.items.map((item) => (
              <div
                key={item.id}
                className="p-4 flex flex-wrap items-start justify-between gap-4 text-xs"
              >
                <div className="space-y-1 max-w-2xl">
                  <div className="flex flex-wrap items-center gap-2">
                    <AdminStatusBadge status={item.status} />
                    {item.dateLabel && (
                      <span className="font-mono text-[11px] text-[var(--color-bronze)] tabular-nums">
                        {item.dateLabel}
                      </span>
                    )}
                    {item.locationLabel && (
                      <span className="text-[var(--color-muted)]">{item.locationLabel}</span>
                    )}
                  </div>
                  <h3 className="font-editorial text-lg text-[var(--color-ink)]">{item.title}</h3>
                  {item.subtitle && (
                    <p className="font-medium text-[var(--color-muted)]">{item.subtitle}</p>
                  )}
                  {item.description && (
                    <p className="text-[var(--color-muted)] leading-relaxed">{item.description}</p>
                  )}
                </div>

                {canWrite && (
                  <div className="flex items-center gap-1.5">
                    <button
                      type="button"
                      onClick={() => void toggleStatus(item)}
                      className="px-2.5 py-1 rounded border border-[#9C6B1E]/45 hover:bg-[#D4A537]/15 cursor-pointer"
                    >
                      {item.status === 'published' ? 'Move to Draft' : 'Publish'}
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setEditingId(item.id);
                        setTitle(item.title);
                        setSubtitle(item.subtitle);
                        setDescription(item.description);
                        setDateLabel(item.dateLabel ?? '');
                        setLocationLabel(item.locationLabel ?? '');
                        setBadgeLabel(item.badgeLabel ?? '');
                        setHref(item.href ?? '');
                        setStatus(item.status);
                        setExtraCategory(item.meta?.category ?? 'general');
                      }}
                      aria-label={`Edit ${item.title}`}
                      className="p-1.5 rounded border border-[var(--color-border)] hover:border-[var(--color-bronze)] cursor-pointer"
                    >
                      <Pencil className="w-3.5 h-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => setDeleteTarget(item)}
                      aria-label={`Delete ${item.title}`}
                      className="p-1.5 rounded border border-red-500/35 text-red-600 dark:text-red-300 cursor-pointer"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        <AdminPaginationBar
          page={paged.page}
          totalPages={paged.totalPages}
          totalItems={paged.totalItems}
          pageSize={10}
          onPageChange={setPageIdx}
        />
      </div>

      <AdminConfirmModal
        open={Boolean(deleteTarget)}
        title={`Delete ${heading} Entry`}
        description="Removing this structured record deletes it from the CMS store."
        targetSummary={deleteTarget?.title}
        confirmLabel="Delete Record"
        tone="danger"
        busy={deleting}
        onCancel={() => setDeleteTarget(null)}
        onConfirm={() => void handleDelete()}
      />
    </div>
  );
};
