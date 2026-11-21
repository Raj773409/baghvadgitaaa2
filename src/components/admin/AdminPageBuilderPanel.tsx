import React, { useEffect, useMemo, useState } from 'react';
import {
  ArrowDown,
  ArrowUp,
  Eye,
  EyeOff,
  History,
  Image as ImageIcon,
  Plus,
  RotateCcw,
  Save,
  Send,
  Trash2,
  Upload,
} from 'lucide-react';
import { invalidatePublicCmsCache } from '../../hooks/usePublicCms';
import { resolveCmsMediaUrl } from '../../content/siteCatalog';
import { adminFetch } from '../../utils/adminSession';
import type {
  AdminLocaleCode,
  ContentRevisionRecord,
  MediaAssetRecord,
  PageBlockRecord,
  PageBlockType,
  PageInventoryRecord,
  PageSnapshotPayload,
} from '../../utils/cmsSync';
import {
  AdminConfirmModal,
  AdminPreviewModal,
  AdminStatusBadge,
  type AdminToastMessage,
} from './AdminUiPrimitives';

interface AdminPageBuilderPanelProps {
  pages: PageInventoryRecord[];
  mediaAssets: MediaAssetRecord[];
  initialPageId?: string | null;
  canWrite: boolean;
  onRefresh: () => void;
  onToast: (toast: Omit<AdminToastMessage, 'id'>) => void;
}

const BLOCK_TYPE_OPTIONS: ReadonlyArray<{ type: PageBlockType; label: string }> = [
  { type: 'hero', label: 'Hero Banner' },
  { type: 'text', label: 'Editorial Text Section' },
  { type: 'image', label: 'Image Feature Plate' },
  { type: 'image-carousel', label: 'Image Carousel Strip' },
  { type: 'video', label: 'Video Feature Block' },
  { type: 'scripture', label: 'Scripture / Shloka Callout' },
  { type: 'event-card', label: 'Event Highlight Card' },
  { type: 'participation-card', label: 'Participation Pathway Card' },
  { type: 'cta', label: 'Call To Action Band' },
  { type: 'gallery', label: 'Gallery Spotlight' },
  { type: 'timeline', label: 'Milestone Timeline Entry' },
  { type: 'leadership', label: 'Leadership Profile Callout' },
  { type: 'partners', label: 'Institutional Partner Block' },
  { type: 'faq', label: 'FAQ Clarification Block' },
];

export const AdminPageBuilderPanel: React.FC<AdminPageBuilderPanelProps> = ({
  pages,
  mediaAssets,
  initialPageId,
  canWrite,
  onRefresh,
  onToast,
}) => {
  const [selectedPageId, setSelectedPageId] = useState<string>(
    () => initialPageId || pages[0]?.id || 'pg-01',
  );
  const [locale, setLocale] = useState<AdminLocaleCode>('en');
  const [draft, setDraft] = useState<PageSnapshotPayload | null>(null);
  const [newBlockType, setNewBlockType] = useState<PageBlockType>('text');
  const [revisions, setRevisions] = useState<ContentRevisionRecord[]>([]);
  const [loadingRevisions, setLoadingRevisions] = useState(false);

  const [savingDraft, setSavingDraft] = useState(false);
  const [publishing, setPublishing] = useState(false);
  const [confirmPublishOpen, setConfirmPublishOpen] = useState(false);
  const [restoreTarget, setRestoreTarget] = useState<ContentRevisionRecord | null>(null);
  const [restoring, setRestoring] = useState(false);

  const [previewOpen, setPreviewOpen] = useState(false);
  const [previewMode, setPreviewMode] = useState<'draft' | 'published'>('draft');
  const [mediaPickerBlockId, setMediaPickerBlockId] = useState<string | null>(null);
  const [mediaSearch, setMediaSearch] = useState('');

  useEffect(() => {
    if (initialPageId && pages.some((p) => p.id === initialPageId)) {
      setSelectedPageId(initialPageId);
    }
  }, [initialPageId, pages]);

  const selectedPage = useMemo(
    () => pages.find((p) => p.id === selectedPageId) ?? pages[0] ?? null,
    [pages, selectedPageId],
  );

  useEffect(() => {
    if (!selectedPage) {
      setDraft(null);
      return;
    }
    setDraft(JSON.parse(JSON.stringify(selectedPage.draftVersion)) as PageSnapshotPayload);
  }, [selectedPage]);

  useEffect(() => {
    if (!selectedPage) return;
    let active = true;
    setLoadingRevisions(true);
    adminFetch(`/api/admin/revisions?entityId=${encodeURIComponent(selectedPage.id)}`)
      .then((res) => (res.ok ? res.json() : { revisions: [] }))
      .then((json: { revisions?: ContentRevisionRecord[] }) => {
        if (active) setRevisions(json.revisions ?? []);
      })
      .catch(() => {
        if (active) setRevisions([]);
      })
      .finally(() => {
        if (active) setLoadingRevisions(false);
      });
    return () => {
      active = false;
    };
  }, [selectedPage]);

  const updateLocalizedField = (
    map: { en: string; hi?: string; te?: string } | undefined,
    value: string,
  ): { en: string; hi?: string; te?: string } => ({
    en: locale === 'en' ? value : map?.en ?? '',
    hi: locale === 'hi' ? value : map?.hi,
    te: locale === 'te' ? value : map?.te,
  });

  const getLocaleField = (map: { en: string; hi?: string; te?: string } | undefined): string => {
    if (!map) return '';
    if (locale === 'hi') return map.hi ?? '';
    if (locale === 'te') return map.te ?? '';
    return map.en ?? '';
  };

  const updateBlock = (blockId: string, updater: (prev: PageBlockRecord) => PageBlockRecord) => {
    setDraft((prev) => {
      if (!prev) return prev;
      return {
        ...prev,
        blocks: prev.blocks.map((b) => (b.id === blockId ? updater(b) : b)),
      };
    });
  };

  const moveBlock = (index: number, delta: -1 | 1) => {
    setDraft((prev) => {
      if (!prev) return prev;
      const sorted = [...prev.blocks].sort((a, b) => a.order - b.order);
      const nextIdx = index + delta;
      if (nextIdx < 0 || nextIdx >= sorted.length) return prev;
      const temp = sorted[index];
      sorted[index] = sorted[nextIdx];
      sorted[nextIdx] = temp;
      return {
        ...prev,
        blocks: sorted.map((blk, i) => ({ ...blk, order: i + 1 })),
      };
    });
  };

  const addBlock = () => {
    setDraft((prev) => {
      if (!prev) return prev;
      const maxOrder = prev.blocks.reduce((m, b) => Math.max(m, b.order), 0);
      const labelMeta = BLOCK_TYPE_OPTIONS.find((t) => t.type === newBlockType);
      const nextBlock: PageBlockRecord = {
        id: `blk-${Date.now().toString(36)}`,
        type: newBlockType,
        label: labelMeta?.label ?? 'Custom Section',
        order: maxOrder + 1,
        visible: true,
        eyebrow: { en: '' },
        heading: { en: '' },
        subheading: { en: '' },
        body: { en: '' },
      };
      return {
        ...prev,
        blocks: [...prev.blocks, nextBlock],
      };
    });
  };

  const removeBlock = (blockId: string) => {
    setDraft((prev) => {
      if (!prev) return prev;
      const remaining = prev.blocks
        .filter((b) => b.id !== blockId)
        .sort((a, b) => a.order - b.order)
        .map((b, idx) => ({ ...b, order: idx + 1 }));
      return { ...prev, blocks: remaining };
    });
  };

  const handleSave = async (mode: 'draft' | 'publish') => {
    if (!selectedPage || !draft) return;
    if (mode === 'draft') setSavingDraft(true);
    else setPublishing(true);

    try {
      const res = await adminFetch(`/api/admin/pages/${selectedPage.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          mode,
          snapshot: draft,
        }),
      });
      const json = (await res.json().catch(() => ({}))) as { error?: string };
      if (!res.ok) {
        throw new Error(json.error || `Failed to ${mode === 'publish' ? 'publish' : 'save draft'}.`);
      }

      if (mode === 'publish') {
        invalidatePublicCmsCache();
        setConfirmPublishOpen(false);
        onToast({
          kind: 'success',
          title: 'Published Live',
          detail: `${selectedPage.name} (${selectedPage.route}) is now live on the public website.`,
        });
      } else {
        onToast({
          kind: 'success',
          title: 'Draft Staged',
          detail: `Draft saved for ${selectedPage.name}. Public visitors will not see draft changes until published.`,
        });
      }
      onRefresh();
    } catch (err) {
      onToast({
        kind: 'error',
        title: mode === 'publish' ? 'Publish Failed' : 'Draft Save Failed',
        detail: err instanceof Error ? err.message : 'Request failed.',
      });
    } finally {
      setSavingDraft(false);
      setPublishing(false);
    }
  };

  const handleRestoreRevision = async () => {
    if (!restoreTarget) return;
    setRestoring(true);
    try {
      const res = await adminFetch(`/api/admin/revisions/${restoreTarget.id}/restore`, {
        method: 'POST',
      });
      const json = (await res.json().catch(() => ({}))) as { error?: string };
      if (!res.ok) throw new Error(json.error || 'Could not restore selected revision.');
      invalidatePublicCmsCache();
      setRestoreTarget(null);
      onToast({
        kind: 'success',
        title: 'Revision Restored Live',
        detail: `${restoreTarget.entityTitle} reverted cleanly to snapshot from ${new Date(restoreTarget.createdAt).toLocaleString()}.`,
      });
      onRefresh();
    } catch (err) {
      onToast({
        kind: 'error',
        title: 'Rollback Failed',
        detail: err instanceof Error ? err.message : 'Restore failed.',
      });
    } finally {
      setRestoring(false);
    }
  };

  const handleDirectImageUpload = (blockId: string, file: File | undefined) => {
    if (!file) return;
    const reader = new FileReader();
    reader.onload = async () => {
      if (typeof reader.result !== 'string') return;
      try {
        const res = await adminFetch('/api/admin/media-assets', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            kind: 'image',
            category: 'festival',
            title: file.name.replace(/\.[^.]+$/, ''),
            imageBase64: reader.result,
            altText: file.name.replace(/\.[^.]+$/, ''),
            published: true,
          }),
        });
        const json = (await res.json().catch(() => ({}))) as {
          asset?: MediaAssetRecord;
          error?: string;
        };
        if (!res.ok || !json.asset) {
          throw new Error(json.error || 'Upload failed.');
        }
        updateBlock(blockId, (blk) => ({
          ...blk,
          mediaAssetId: json.asset!.id,
          mediaUrl: json.asset!.url,
          mediaAlt: blk.mediaAlt || json.asset!.altText,
        }));
        onToast({
          kind: 'success',
          title: 'Image Uploaded & Attached',
          detail: `${json.asset.title} added to Media Library and linked to section block.`,
        });
        onRefresh();
      } catch (err) {
        onToast({
          kind: 'error',
          title: 'Upload Failed',
          detail: err instanceof Error ? err.message : 'Could not upload image.',
        });
      }
    };
    reader.readAsDataURL(file);
  };

  const filteredPickerAssets = useMemo(() => {
    const q = mediaSearch.trim().toLowerCase();
    return mediaAssets
      .filter((a) => a.kind === 'image')
      .filter((a) =>
        q ? `${a.title} ${a.category} ${a.tags.join(' ')}`.toLowerCase().includes(q) : true,
      )
      .slice(0, 24);
  }, [mediaAssets, mediaSearch]);

  if (!selectedPage || !draft) {
    return (
      <div className="rounded-xl border border-[var(--color-border)] bg-[var(--surface-elevated)] p-8 text-sm text-[var(--color-muted)]">
        No pages loaded. Refresh the workspace or run Inventory Sync.
      </div>
    );
  }

  const orderedBlocks = [...draft.blocks].sort((a, b) => a.order - b.order);

  return (
    <div className="space-y-6" data-testid="page-builder-panel">
      {/* Top Workspace Control Bar */}
      <div className="rounded-xl border border-[var(--color-border)] bg-[var(--surface-elevated)] p-4 sm:p-5 flex flex-wrap items-center justify-between gap-4">
        <div className="flex flex-wrap items-center gap-3 flex-1 min-w-[260px]">
          <label className="space-y-1 text-xs min-w-[240px] flex-1 max-w-md">
            <span className="text-[var(--color-muted)] font-medium">Target Website Route</span>
            <select
              data-testid="page-builder-route-select"
              value={selectedPage.id}
              onChange={(e) => setSelectedPageId(e.target.value)}
              className="w-full min-h-[38px] px-3 rounded-lg border border-[var(--color-border)] bg-[var(--color-canvas)] text-xs font-medium text-[var(--color-ink)]"
            >
              {pages.map((pg) => (
                <option key={pg.id} value={pg.id}>
                  {pg.name} ({pg.route}){pg.hasUnpublishedDraft ? ' [Draft]' : ''}
                </option>
              ))}
            </select>
          </label>

          <div className="space-y-1 text-xs">
            <span className="text-[var(--color-muted)] font-medium block">Editing Locale</span>
            <div className="inline-flex items-center rounded-lg border border-[var(--color-border)] p-0.5 bg-[var(--color-canvas)]">
              {(['en', 'hi', 'te'] as const).map((code) => (
                <button
                  key={code}
                  type="button"
                  onClick={() => setLocale(code)}
                  className={`px-3 py-1.5 rounded text-xs font-semibold uppercase cursor-pointer ${
                    locale === code
                      ? 'bg-[#17233A] text-[#F7D774] dark:bg-[#D4A537] dark:text-[#171717]'
                      : 'text-[var(--color-muted)] hover:text-[var(--color-ink)]'
                  }`}
                >
                  {code}
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-1 text-xs">
            <span className="text-[var(--color-muted)] font-medium block">State</span>
            <div className="flex items-center gap-1.5">
              <AdminStatusBadge status={selectedPage.status} />
              {selectedPage.hasUnpublishedDraft && (
                <AdminStatusBadge status="unpublished-draft" />
              )}
            </div>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            data-testid="page-builder-preview-draft-btn"
            onClick={() => {
              setPreviewMode('draft');
              setPreviewOpen(true);
            }}
            className="inline-flex items-center gap-1.5 min-h-[38px] px-3.5 rounded-lg border border-[var(--color-border)] text-xs font-medium hover:border-[var(--color-bronze)] cursor-pointer whitespace-nowrap"
          >
            <Eye className="w-3.5 h-3.5" />
            <span>Preview Draft</span>
          </button>

          {canWrite && (
            <>
              <button
                type="button"
                disabled={savingDraft || publishing}
                data-testid="page-builder-save-draft-btn"
                onClick={() => void handleSave('draft')}
                className="inline-flex items-center gap-1.5 min-h-[38px] px-4 rounded-lg border border-[#9C6B1E]/60 text-xs font-semibold text-[var(--color-ink)] hover:bg-[#D4A537]/15 cursor-pointer whitespace-nowrap disabled:opacity-50"
              >
                <Save className="w-3.5 h-3.5 text-[var(--color-bronze)]" />
                <span>{savingDraft ? 'Saving Draft…' : 'Save Draft'}</span>
              </button>

              <button
                type="button"
                disabled={savingDraft || publishing}
                data-testid="page-builder-publish-btn"
                onClick={() => setConfirmPublishOpen(true)}
                className="inline-flex items-center gap-1.5 min-h-[38px] px-4 rounded-lg royal-gold-surface text-xs font-semibold cursor-pointer whitespace-nowrap disabled:opacity-50"
              >
                <Send className="w-3.5 h-3.5" />
                <span>Publish Changes Live</span>
              </button>
            </>
          )}
        </div>
      </div>

      {/* Page Metadata & SEO */}
      <div className="rounded-xl border border-[var(--color-border)] bg-[var(--surface-elevated)] p-5 space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-2 pb-3 border-b border-[var(--color-border)]">
          <h2 className="font-editorial text-xl text-[var(--color-ink)]">
            Page Header &amp; SEO Metadata ({locale.toUpperCase()})
          </h2>
          <span className="font-mono text-[11px] text-[var(--color-muted)]">
            Route: {selectedPage.route}
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
          <label className="space-y-1">
            <span className="text-[var(--color-muted)] font-medium">
              Page Display Title ({locale.toUpperCase()})
            </span>
            <input
              type="text"
              disabled={!canWrite}
              data-testid="page-builder-title-input"
              value={getLocaleField(draft.title)}
              onChange={(e) =>
                setDraft((prev) =>
                  prev
                    ? { ...prev, title: updateLocalizedField(prev.title, e.target.value) }
                    : prev,
                )
              }
              className="w-full min-h-[38px] px-3 rounded-lg border border-[var(--color-border)] bg-[var(--color-canvas)]"
            />
          </label>

          <label className="space-y-1">
            <span className="text-[var(--color-muted)] font-medium">
              Page Subtitle / Lead ({locale.toUpperCase()})
            </span>
            <input
              type="text"
              disabled={!canWrite}
              data-testid="page-builder-subtitle-input"
              value={getLocaleField(draft.subtitle)}
              onChange={(e) =>
                setDraft((prev) =>
                  prev
                    ? { ...prev, subtitle: updateLocalizedField(prev.subtitle, e.target.value) }
                    : prev,
                )
              }
              className="w-full min-h-[38px] px-3 rounded-lg border border-[var(--color-border)] bg-[var(--color-canvas)]"
            />
          </label>

          <label className="space-y-1">
            <span className="text-[var(--color-muted)] font-medium">SEO Meta Title</span>
            <input
              type="text"
              disabled={!canWrite}
              value={draft.seo.metaTitle}
              onChange={(e) =>
                setDraft((prev) =>
                  prev ? { ...prev, seo: { ...prev.seo, metaTitle: e.target.value } } : prev,
                )
              }
              className="w-full min-h-[38px] px-3 rounded-lg border border-[var(--color-border)] bg-[var(--color-canvas)]"
            />
          </label>

          <label className="space-y-1">
            <span className="text-[var(--color-muted)] font-medium">SEO Meta Description</span>
            <input
              type="text"
              disabled={!canWrite}
              value={draft.seo.metaDescription}
              onChange={(e) =>
                setDraft((prev) =>
                  prev
                    ? { ...prev, seo: { ...prev.seo, metaDescription: e.target.value } }
                    : prev,
                )
              }
              className="w-full min-h-[38px] px-3 rounded-lg border border-[var(--color-border)] bg-[var(--color-canvas)]"
            />
          </label>
        </div>
      </div>

      {/* Section Blocks Composer */}
      <div className="space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="font-editorial text-xl text-[var(--color-ink)]">
              Section Blocks ({orderedBlocks.length})
            </h2>
            <p className="text-xs text-[var(--color-muted)]">
              Reorder sections, toggle visibility, edit localized copy, or add new blocks below the canonical layout.
            </p>
          </div>

          {canWrite && (
            <div className="flex items-center gap-2">
              <select
                value={newBlockType}
                onChange={(e) => setNewBlockType(e.target.value as PageBlockType)}
                aria-label="New block type"
                className="min-h-[36px] px-3 rounded-lg border border-[var(--color-border)] bg-[var(--surface-elevated)] text-xs"
              >
                {BLOCK_TYPE_OPTIONS.map((opt) => (
                  <option key={opt.type} value={opt.type}>
                    {opt.label}
                  </option>
                ))}
              </select>
              <button
                type="button"
                data-testid="page-builder-add-block-btn"
                onClick={addBlock}
                className="inline-flex items-center gap-1.5 min-h-[36px] px-3.5 rounded-lg border border-[#9C6B1E]/55 text-xs font-semibold hover:bg-[#D4A537]/15 cursor-pointer whitespace-nowrap"
              >
                <Plus className="w-3.5 h-3.5 text-[var(--color-bronze)]" />
                <span>Add Section Block</span>
              </button>
            </div>
          )}
        </div>

        <div className="space-y-4">
          {orderedBlocks.map((block, index) => (
            <div
              key={block.id}
              data-testid={`page-block-${block.id}`}
              className="rounded-xl border border-[var(--color-border)] bg-[var(--surface-elevated)] p-5 space-y-4"
            >
              <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-[var(--color-border)]">
                <div className="flex items-center gap-2.5 min-w-0">
                  <span className="font-mono text-xs text-[var(--color-bronze)] tabular-nums">
                    {String(index + 1).padStart(2, '0')}.
                  </span>
                  <input
                    type="text"
                    disabled={!canWrite}
                    value={block.label}
                    onChange={(e) =>
                      updateBlock(block.id, (prev) => ({ ...prev, label: e.target.value }))
                    }
                    aria-label="Section block label"
                    className="font-semibold text-sm bg-transparent border-b border-transparent focus:border-[var(--color-bronze)] outline-none text-[var(--color-ink)]"
                  />
                  <span className="font-mono text-[10px] text-[var(--color-muted)]">
                    {block.type}
                  </span>
                </div>

                {canWrite && (
                  <div className="flex items-center gap-1.5">
                    <button
                      type="button"
                      disabled={index === 0}
                      onClick={() => moveBlock(index, -1)}
                      aria-label={`Move ${block.label} up`}
                      className="p-1.5 rounded border border-[var(--color-border)] text-[var(--color-muted)] hover:text-[var(--color-ink)] disabled:opacity-35 cursor-pointer"
                    >
                      <ArrowUp className="w-3.5 h-3.5" />
                    </button>
                    <button
                      type="button"
                      disabled={index === orderedBlocks.length - 1}
                      onClick={() => moveBlock(index, 1)}
                      aria-label={`Move ${block.label} down`}
                      className="p-1.5 rounded border border-[var(--color-border)] text-[var(--color-muted)] hover:text-[var(--color-ink)] disabled:opacity-35 cursor-pointer"
                    >
                      <ArrowDown className="w-3.5 h-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() =>
                        updateBlock(block.id, (prev) => ({ ...prev, visible: !prev.visible }))
                      }
                      className="inline-flex items-center gap-1 px-2.5 py-1 rounded border border-[var(--color-border)] text-xs hover:border-[var(--color-bronze)] cursor-pointer"
                    >
                      {block.visible ? (
                        <>
                          <Eye className="w-3.5 h-3.5 text-[var(--color-bronze)]" />
                          <span>Visible</span>
                        </>
                      ) : (
                        <>
                          <EyeOff className="w-3.5 h-3.5 text-[var(--color-muted)]" />
                          <span>Hidden</span>
                        </>
                      )}
                    </button>
                    <button
                      type="button"
                      onClick={() => removeBlock(block.id)}
                      aria-label={`Remove ${block.label}`}
                      className="p-1.5 rounded border border-red-500/35 text-red-600 dark:text-red-300 hover:bg-red-500/10 cursor-pointer"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                )}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5 text-xs">
                <label className="space-y-1">
                  <span className="text-[var(--color-muted)]">Eyebrow ({locale.toUpperCase()})</span>
                  <input
                    type="text"
                    disabled={!canWrite}
                    value={getLocaleField(block.eyebrow)}
                    onChange={(e) =>
                      updateBlock(block.id, (prev) => ({
                        ...prev,
                        eyebrow: updateLocalizedField(prev.eyebrow, e.target.value),
                      }))
                    }
                    className="w-full min-h-[36px] px-3 rounded-lg border border-[var(--color-border)] bg-[var(--color-canvas)]"
                  />
                </label>

                <label className="space-y-1">
                  <span className="text-[var(--color-muted)]">Heading ({locale.toUpperCase()})</span>
                  <input
                    type="text"
                    disabled={!canWrite}
                    value={getLocaleField(block.heading)}
                    onChange={(e) =>
                      updateBlock(block.id, (prev) => ({
                        ...prev,
                        heading: updateLocalizedField(prev.heading, e.target.value),
                      }))
                    }
                    className="w-full min-h-[36px] px-3 rounded-lg border border-[var(--color-border)] bg-[var(--color-canvas)]"
                  />
                </label>

                <label className="space-y-1 md:col-span-2">
                  <span className="text-[var(--color-muted)]">Subheading ({locale.toUpperCase()})</span>
                  <input
                    type="text"
                    disabled={!canWrite}
                    value={getLocaleField(block.subheading)}
                    onChange={(e) =>
                      updateBlock(block.id, (prev) => ({
                        ...prev,
                        subheading: updateLocalizedField(prev.subheading, e.target.value),
                      }))
                    }
                    className="w-full min-h-[36px] px-3 rounded-lg border border-[var(--color-border)] bg-[var(--color-canvas)]"
                  />
                </label>

                <label className="space-y-1 md:col-span-2">
                  <span className="text-[var(--color-muted)]">Body Copy ({locale.toUpperCase()})</span>
                  <textarea
                    rows={2}
                    disabled={!canWrite}
                    value={getLocaleField(block.body)}
                    onChange={(e) =>
                      updateBlock(block.id, (prev) => ({
                        ...prev,
                        body: updateLocalizedField(prev.body, e.target.value),
                      }))
                    }
                    className="w-full p-2.5 rounded-lg border border-[var(--color-border)] bg-[var(--color-canvas)]"
                  />
                </label>

                <label className="space-y-1">
                  <span className="text-[var(--color-muted)]">Primary CTA Label ({locale.toUpperCase()})</span>
                  <input
                    type="text"
                    disabled={!canWrite}
                    value={getLocaleField(block.ctaPrimaryLabel)}
                    onChange={(e) =>
                      updateBlock(block.id, (prev) => ({
                        ...prev,
                        ctaPrimaryLabel: updateLocalizedField(prev.ctaPrimaryLabel, e.target.value),
                      }))
                    }
                    className="w-full min-h-[36px] px-3 rounded-lg border border-[var(--color-border)] bg-[var(--color-canvas)]"
                  />
                </label>

                <label className="space-y-1">
                  <span className="text-[var(--color-muted)]">Primary CTA Route / URL</span>
                  <input
                    type="text"
                    disabled={!canWrite}
                    value={block.ctaPrimaryHref ?? ''}
                    onChange={(e) =>
                      updateBlock(block.id, (prev) => ({
                        ...prev,
                        ctaPrimaryHref: e.target.value,
                      }))
                    }
                    placeholder="/participate/register"
                    className="w-full min-h-[36px] px-3 rounded-lg border border-[var(--color-border)] bg-[var(--color-canvas)] font-mono"
                  />
                </label>

                <div className="space-y-1 md:col-span-2">
                  <span className="text-[var(--color-muted)] block">
                    Attached Media Image / Asset Reference
                  </span>
                  <div className="flex flex-wrap items-center gap-2">
                    <input
                      type="text"
                      disabled={!canWrite}
                      value={block.mediaUrl ?? ''}
                      onChange={(e) =>
                        updateBlock(block.id, (prev) => ({
                          ...prev,
                          mediaUrl: e.target.value,
                        }))
                      }
                      placeholder="asset://heroPavilion or /uploads/..."
                      className="flex-1 min-w-[200px] min-h-[36px] px-3 rounded-lg border border-[var(--color-border)] bg-[var(--color-canvas)] font-mono"
                    />
                    {canWrite && (
                      <>
                        <button
                          type="button"
                          onClick={() =>
                            setMediaPickerBlockId((cur) => (cur === block.id ? null : block.id))
                          }
                          className="inline-flex items-center gap-1 min-h-[36px] px-3 rounded-lg border border-[var(--color-border)] hover:border-[var(--color-bronze)] cursor-pointer whitespace-nowrap"
                        >
                          <ImageIcon className="w-3.5 h-3.5 text-[var(--color-bronze)]" />
                          <span>Browse Media</span>
                        </button>
                        <label className="inline-flex items-center gap-1 min-h-[36px] px-3 rounded-lg border border-[var(--color-border)] hover:border-[var(--color-bronze)] cursor-pointer whitespace-nowrap">
                          <Upload className="w-3.5 h-3.5 text-[var(--color-bronze)]" />
                          <span>Upload File</span>
                          <input
                            type="file"
                            accept="image/png,image/jpeg,image/webp"
                            className="sr-only"
                            onChange={(e) =>
                              handleDirectImageUpload(block.id, e.target.files?.[0])
                            }
                          />
                        </label>
                      </>
                    )}
                  </div>

                  {mediaPickerBlockId === block.id && (
                    <div className="mt-2 rounded-lg border border-[var(--color-border)] bg-[var(--color-canvas)] p-3 space-y-2.5">
                      <div className="flex items-center justify-between gap-2">
                        <input
                          type="search"
                          value={mediaSearch}
                          onChange={(e) => setMediaSearch(e.target.value)}
                          placeholder="Search image library…"
                          className="flex-1 min-h-[32px] px-2.5 rounded border border-[var(--color-border)] bg-[var(--surface-elevated)] text-xs"
                        />
                        <button
                          type="button"
                          onClick={() => setMediaPickerBlockId(null)}
                          className="px-2.5 py-1 text-xs text-[var(--color-muted)] hover:text-[var(--color-ink)] cursor-pointer"
                        >
                          Close
                        </button>
                      </div>
                      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-6 gap-2 max-h-48 overflow-y-auto">
                        {filteredPickerAssets.map((asset) => {
                          const resolved = resolveCmsMediaUrl(asset.assetKey, asset.url);
                          return (
                            <button
                              key={asset.id}
                              type="button"
                              onClick={() => {
                                updateBlock(block.id, (prev) => ({
                                  ...prev,
                                  mediaAssetId: asset.id,
                                  mediaUrl: asset.assetKey ? `asset://${asset.assetKey}` : asset.url,
                                  mediaAlt: prev.mediaAlt || asset.altText || asset.title,
                                }));
                                setMediaPickerBlockId(null);
                              }}
                              className="text-left rounded border border-[var(--color-border)] bg-[var(--surface-elevated)] hover:border-[var(--color-bronze)] overflow-hidden cursor-pointer"
                            >
                              {resolved && (
                                <img
                                  src={resolved}
                                  alt={asset.altText || asset.title}
                                  className="w-full h-14 object-cover"
                                />
                              )}
                              <p className="p-1.5 text-[10px] truncate text-[var(--color-ink)]">
                                {asset.title}
                              </p>
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Revision History & Rollback */}
      <div className="rounded-xl border border-[var(--color-border)] bg-[var(--surface-elevated)] p-5 space-y-3">
        <div className="flex items-center justify-between gap-2 pb-2 border-b border-[var(--color-border)]">
          <div className="flex items-center gap-2">
            <History className="w-4 h-4 text-[var(--color-bronze)]" />
            <h3 className="font-editorial text-xl text-[var(--color-ink)]">
              Revision History &amp; Rollback
            </h3>
          </div>
          <span className="text-xs text-[var(--color-muted)] tabular-nums">
            {revisions.length} recorded snapshots
          </span>
        </div>

        {loadingRevisions ? (
          <p className="text-xs text-[var(--color-muted)] py-3">Loading revision timeline…</p>
        ) : revisions.length === 0 ? (
          <p className="text-xs text-[var(--color-muted)] py-3">
            No revisions recorded yet for {selectedPage.name}. Save a draft or publish changes to create an immutable restore point.
          </p>
        ) : (
          <ul className="divide-y divide-[var(--color-border)] text-xs">
            {revisions.map((rev) => (
              <li
                key={rev.id}
                data-testid={`revision-row-${rev.id}`}
                className="py-3 flex flex-wrap items-center justify-between gap-3"
              >
                <div className="space-y-0.5 min-w-0">
                  <p className="font-medium text-[var(--color-ink)]">{rev.summary}</p>
                  <p className="text-[11px] text-[var(--color-muted)] tabular-nums">
                    {rev.action} · {rev.actorEmail} · {new Date(rev.createdAt).toLocaleString()}
                  </p>
                </div>

                {canWrite && (
                  <button
                    type="button"
                    data-testid={`restore-revision-${rev.id}`}
                    onClick={() => setRestoreTarget(rev)}
                    className="inline-flex items-center gap-1.5 min-h-[32px] px-3 rounded-lg border border-[#9C6B1E]/45 text-xs hover:bg-[#D4A537]/15 cursor-pointer whitespace-nowrap"
                  >
                    <RotateCcw className="w-3.5 h-3.5 text-[var(--color-bronze)]" />
                    <span>Restore Snapshot</span>
                  </button>
                )}
              </li>
            ))}
          </ul>
        )}
      </div>

      <AdminConfirmModal
        open={confirmPublishOpen}
        title="Publish Page Changes Live"
        description="Publishing replaces the live public snapshot for this route and clears its staged draft flag. A prior snapshot will be preserved automatically in Revision History for instant rollback."
        targetSummary={`${selectedPage.name} (${selectedPage.route}) · Display Title: "${draft.title.en}"`}
        confirmLabel="Publish Live Now"
        tone="publish"
        busy={publishing}
        onCancel={() => setConfirmPublishOpen(false)}
        onConfirm={() => void handleSave('publish')}
      />

      <AdminConfirmModal
        open={Boolean(restoreTarget)}
        title="Restore Previous Revision Live"
        description="Restoring this revision reverts both the live published snapshot and draft workspace for this page immediately."
        targetSummary={restoreTarget?.summary}
        confirmLabel="Restore Revision"
        tone="publish"
        busy={restoring}
        onCancel={() => setRestoreTarget(null)}
        onConfirm={() => void handleRestoreRevision()}
      />

      <AdminPreviewModal
        open={previewOpen}
        page={selectedPage}
        snapshot={previewMode === 'draft' ? draft : selectedPage.publishedVersion}
        modeLabel={
          previewMode === 'draft' ? 'Draft Staging Preview' : 'Live Published Snapshot'
        }
        locale={locale}
        onClose={() => setPreviewOpen(false)}
      />
    </div>
  );
};
