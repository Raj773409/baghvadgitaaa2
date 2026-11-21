import React, { useEffect, useMemo, useState } from 'react';
import {
  ArrowDown,
  ArrowUp,
  Eye,
  EyeOff,
  Film,
  Image as ImageIcon,
  Layers,
  Pencil,
  Plus,
  RefreshCw,
  Save,
  Search,
  Send,
  Trash2,
  Upload,
} from 'lucide-react';
import { invalidatePublicCmsCache } from '../../hooks/usePublicCms';
import { resolveCmsMediaUrl } from '../../content/siteCatalog';
import { adminFetch } from '../../utils/adminSession';
import {
  paginateRecords,
  type CarouselConfigRecord,
  type CarouselSlideConfig,
  type MediaAssetRecord,
} from '../../utils/cmsSync';
import {
  AdminConfirmModal,
  AdminPaginationBar,
  AdminStatusBadge,
  type AdminToastMessage,
} from './AdminUiPrimitives';

interface AdminMediaStudioPanelProps {
  initialTab: 'images' | 'videos' | 'carousels';
  assets: MediaAssetRecord[];
  carousels: CarouselConfigRecord[];
  canWrite: boolean;
  canWriteCarousels: boolean;
  onRefresh: () => void;
  onToast: (toast: Omit<AdminToastMessage, 'id'>) => void;
}

export const AdminMediaStudioPanel: React.FC<AdminMediaStudioPanelProps> = ({
  initialTab,
  assets,
  carousels,
  canWrite,
  canWriteCarousels,
  onRefresh,
  onToast,
}) => {
  const [tab, setTab] = useState<'images' | 'videos' | 'carousels'>(initialTab);
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<'all' | MediaAssetRecord['category']>('all');
  const [pageIdx, setPageIdx] = useState(1);

  const [dragActive, setDragActive] = useState(false);
  const [uploadingFiles, setUploadingFiles] = useState(false);
  const [newVideoTitle, setNewVideoTitle] = useState('');
  const [newVideoUrl, setNewVideoUrl] = useState('');
  const [newVideoDesc, setNewVideoDesc] = useState('');
  const [newVideoCat, setNewVideoCat] = useState<MediaAssetRecord['category']>('teaser');

  const [editingAsset, setEditingAsset] = useState<MediaAssetRecord | null>(null);
  const [editTitle, setEditTitle] = useState('');
  const [editAlt, setEditAlt] = useState('');
  const [editCaption, setEditCaption] = useState('');
  const [editTags, setEditTags] = useState('');
  const [editFocal, setEditFocal] = useState('50% 42%');
  const [savingMeta, setSavingMeta] = useState(false);

  const [replaceAssetTarget, setReplaceAssetTarget] = useState<MediaAssetRecord | null>(null);
  const [replaceUrl, setReplaceUrl] = useState('');
  const [replacing, setReplacing] = useState(false);

  const [deleteTarget, setDeleteTarget] = useState<MediaAssetRecord | null>(null);
  const [deleting, setDeleting] = useState(false);

  // Carousel Editor State
  const [selectedCarouselId, setSelectedCarouselId] = useState<string>(
    () => carousels[0]?.id || 'hero-main',
  );
  const [carouselDraftSlides, setCarouselDraftSlides] = useState<CarouselSlideConfig[]>([]);
  const [autoAdvanceMs, setAutoAdvanceMs] = useState(5500);
  const [transitionStyle, setTransitionStyle] =
    useState<CarouselConfigRecord['transitionStyle']>('slide-rtl');
  const [savingCarousel, setSavingCarousel] = useState(false);
  const [confirmCarouselPublish, setConfirmCarouselPublish] = useState(false);

  useEffect(() => {
    setTab(initialTab);
    setPageIdx(1);
  }, [initialTab]);

  const activeCarousel = useMemo(
    () => carousels.find((c) => c.id === selectedCarouselId) ?? carousels[0] ?? null,
    [carousels, selectedCarouselId],
  );

  useEffect(() => {
    if (!activeCarousel) return;
    setCarouselDraftSlides(
      JSON.parse(JSON.stringify(activeCarousel.draftSlides)) as CarouselSlideConfig[],
    );
    setAutoAdvanceMs(activeCarousel.autoAdvanceMs || 5500);
    setTransitionStyle(activeCarousel.transitionStyle || 'slide-rtl');
  }, [activeCarousel]);

  const filteredAssets = useMemo(() => {
    const q = search.trim().toLowerCase();
    const targetKind = tab === 'videos' ? 'video' : 'image';
    return assets.filter((a) => {
      if (a.kind !== targetKind) return false;
      if (categoryFilter !== 'all' && a.category !== categoryFilter) return false;
      if (!q) return true;
      return `${a.title} ${a.caption} ${a.category} ${a.tags.join(' ')} ${a.usageLocations.join(' ')}`
        .toLowerCase()
        .includes(q);
    });
  }, [assets, tab, categoryFilter, search]);

  const pageSize = 9;
  const pagedAssets = paginateRecords(filteredAssets, pageIdx, pageSize);

  const uploadImageFiles = async (files: FileList | null) => {
    if (!files || files.length === 0) return;
    setUploadingFiles(true);
    let successCount = 0;

    try {
      for (const file of Array.from(files)) {
        const dataUrl = await new Promise<string>((resolve, reject) => {
          const reader = new FileReader();
          reader.onload = () =>
            typeof reader.result === 'string'
              ? resolve(reader.result)
              : reject(new Error('Could not read file.'));
          reader.onerror = () => reject(new Error('File read aborted.'));
          reader.readAsDataURL(file);
        });

        const res = await adminFetch('/api/admin/media-assets', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            kind: 'image',
            category: categoryFilter === 'all' ? 'festival' : categoryFilter,
            title: file.name.replace(/\.[^.]+$/, ''),
            altText: file.name.replace(/\.[^.]+$/, ''),
            imageBase64: dataUrl,
            published: true,
          }),
        });
        if (res.ok) successCount += 1;
      }

      if (successCount > 0) {
        invalidatePublicCmsCache();
        onToast({
          kind: 'success',
          title: 'Media Uploaded',
          detail: `${successCount} image asset(s) uploaded to the Media Library.`,
        });
        onRefresh();
      } else {
        throw new Error('No files could be uploaded. Check image format (PNG/JPG/WebP, max 8MB).');
      }
    } catch (err) {
      onToast({
        kind: 'error',
        title: 'Upload Failed',
        detail: err instanceof Error ? err.message : 'Upload error.',
      });
    } finally {
      setUploadingFiles(false);
    }
  };

  const handleCreateVideo = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newVideoTitle.trim() || !newVideoUrl.trim()) return;
    setUploadingFiles(true);
    try {
      const res = await adminFetch('/api/admin/media-assets', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          kind: 'video',
          category: newVideoCat,
          title: newVideoTitle.trim(),
          url: newVideoUrl.trim(),
          description: newVideoDesc.trim(),
          published: true,
        }),
      });
      const json = (await res.json().catch(() => ({}))) as { error?: string };
      if (!res.ok) throw new Error(json.error || 'Could not add video record.');
      setNewVideoTitle('');
      setNewVideoUrl('');
      setNewVideoDesc('');
      invalidatePublicCmsCache();
      onToast({
        kind: 'success',
        title: 'Video Program Published',
        detail: `${newVideoTitle.trim()} is now listed in the Media Archive.`,
      });
      onRefresh();
    } catch (err) {
      onToast({
        kind: 'error',
        title: 'Video Save Failed',
        detail: err instanceof Error ? err.message : 'Failed to save video.',
      });
    } finally {
      setUploadingFiles(false);
    }
  };

  const toggleAssetField = async (
    asset: MediaAssetRecord,
    patch: Partial<Pick<MediaAssetRecord, 'published' | 'featured'>>,
  ) => {
    try {
      const res = await adminFetch(`/api/admin/media-assets/${asset.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(patch),
      });
      if (!res.ok) {
        const j = (await res.json().catch(() => ({}))) as { error?: string };
        throw new Error(j.error || 'Could not update asset.');
      }
      invalidatePublicCmsCache();
      onRefresh();
    } catch (err) {
      onToast({
        kind: 'error',
        title: 'Update Failed',
        detail: err instanceof Error ? err.message : 'Update error.',
      });
    }
  };

  const saveMetadataEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingAsset) return;
    setSavingMeta(true);
    try {
      const res = await adminFetch(`/api/admin/media-assets/${editingAsset.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: editTitle.trim(),
          altText: editAlt.trim(),
          caption: editCaption.trim(),
          focalPoint: editFocal.trim(),
          tags: editTags
            .split(',')
            .map((t) => t.trim())
            .filter(Boolean),
        }),
      });
      if (!res.ok) {
        const j = (await res.json().catch(() => ({}))) as { error?: string };
        throw new Error(j.error || 'Could not save metadata.');
      }
      setEditingAsset(null);
      invalidatePublicCmsCache();
      onToast({
        kind: 'success',
        title: 'Metadata Updated',
        detail: `${editTitle.trim()} updated.`,
      });
      onRefresh();
    } catch (err) {
      onToast({
        kind: 'error',
        title: 'Save Failed',
        detail: err instanceof Error ? err.message : 'Error saving metadata.',
      });
    } finally {
      setSavingMeta(false);
    }
  };

  const handleReplaceAcrossSite = async (file?: File) => {
    if (!replaceAssetTarget) return;
    setReplacing(true);
    try {
      let imageBase64: string | undefined;
      if (file) {
        imageBase64 = await new Promise<string>((resolve, reject) => {
          const reader = new FileReader();
          reader.onload = () =>
            typeof reader.result === 'string'
              ? resolve(reader.result)
              : reject(new Error('Could not read file.'));
          reader.onerror = () => reject(new Error('File read aborted.'));
          reader.readAsDataURL(file);
        });
      }
      const res = await adminFetch(`/api/admin/media-assets/${replaceAssetTarget.id}/replace`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          imageBase64,
          url: replaceUrl.trim() || undefined,
        }),
      });
      const json = (await res.json().catch(() => ({}))) as {
        error?: string;
        propagation?: { updatedPagesCount: number; updatedSlidesCount: number };
      };
      if (!res.ok) throw new Error(json.error || 'Could not replace asset.');
      setReplaceAssetTarget(null);
      setReplaceUrl('');
      invalidatePublicCmsCache();
      onToast({
        kind: 'success',
        title: 'Asset Replaced Across Site',
        detail: `Updated ${json.propagation?.updatedPagesCount ?? 0} page(s) and ${json.propagation?.updatedSlidesCount ?? 0} carousel slide(s).`,
      });
      onRefresh();
    } catch (err) {
      onToast({
        kind: 'error',
        title: 'Replacement Failed',
        detail: err instanceof Error ? err.message : 'Error replacing asset.',
      });
    } finally {
      setReplacing(false);
    }
  };

  const handleDeleteAsset = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      const res = await adminFetch(`/api/admin/media-assets/${deleteTarget.id}`, {
        method: 'DELETE',
      });
      if (!res.ok) {
        const j = (await res.json().catch(() => ({}))) as { error?: string };
        throw new Error(j.error || 'Could not delete asset.');
      }
      setDeleteTarget(null);
      invalidatePublicCmsCache();
      onToast({
        kind: 'success',
        title: 'Asset Deleted',
        detail: `"${deleteTarget.title}" removed from library.`,
      });
      onRefresh();
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

  const saveCarousel = async (mode: 'draft' | 'publish') => {
    if (!activeCarousel) return;
    setSavingCarousel(true);
    try {
      const res = await adminFetch(`/api/admin/carousels/${activeCarousel.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          mode,
          slides: carouselDraftSlides,
          autoAdvanceMs,
          transitionStyle,
        }),
      });
      const json = (await res.json().catch(() => ({}))) as { error?: string };
      if (!res.ok) throw new Error(json.error || 'Could not update carousel.');
      if (mode === 'publish') {
        invalidatePublicCmsCache();
        setConfirmCarouselPublish(false);
        onToast({
          kind: 'success',
          title: 'Carousel Published Live',
          detail: `${activeCarousel.name} slides are now live on the homepage.`,
        });
      } else {
        onToast({
          kind: 'success',
          title: 'Carousel Draft Staged',
          detail: `Draft saved for ${activeCarousel.name}.`,
        });
      }
      onRefresh();
    } catch (err) {
      onToast({
        kind: 'error',
        title: 'Carousel Save Failed',
        detail: err instanceof Error ? err.message : 'Save failed.',
      });
    } finally {
      setSavingCarousel(false);
    }
  };

  const moveSlide = (idx: number, delta: -1 | 1) => {
    setCarouselDraftSlides((prev) => {
      const next = idx + delta;
      if (next < 0 || next >= prev.length) return prev;
      const copy = [...prev];
      const temp = copy[idx];
      copy[idx] = copy[next];
      copy[next] = temp;
      return copy.map((s, i) => ({ ...s, order: i + 1 }));
    });
  };

  const addCarouselSlide = () => {
    setCarouselDraftSlides((prev) => [
      ...prev,
      {
        id: `slide-${Date.now().toString(36)}`,
        src: assets.find((a) => a.kind === 'image')?.url ?? '',
        title: 'Mahotsav Cultural Highlight',
        subtitle: '18 Countries · 18 Chapters · 18 Languages',
        caption: 'Sacred Heritage Frame',
        chapterRef: 'Gita Mahotsav 2027',
        alt: 'Mahotsav Cultural Slide',
        objectPosition: '50% 42%',
        order: prev.length + 1,
        enabled: true,
      },
    ]);
  };

  return (
    <div className="space-y-6" data-testid="media-studio-panel">
      {/* Studio Sub-Navigation Tabs */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[var(--color-border)] pb-3">
        <div role="tablist" className="inline-flex items-center gap-1 p-1 rounded-xl border border-[var(--color-border)] bg-[var(--surface-elevated)]">
          {(
            [
              { id: 'images', label: 'Image Library', icon: ImageIcon },
              { id: 'videos', label: 'Video Library', icon: Film },
              { id: 'carousels', label: 'Carousel Manager', icon: Layers },
            ] as const
          ).map((item) => {
            const Icon = item.icon;
            const active = tab === item.id;
            return (
              <button
                key={item.id}
                type="button"
                role="tab"
                aria-selected={active}
                data-testid={`media-tab-${item.id}`}
                onClick={() => {
                  setTab(item.id);
                  setPageIdx(1);
                }}
                className={`inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-medium transition-colors whitespace-nowrap cursor-pointer ${
                  active
                    ? 'bg-[#17233A] text-[#F7D774] dark:bg-[#D4A537] dark:text-[#171717]'
                    : 'text-[var(--color-muted)] hover:text-[var(--color-ink)]'
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                <span>{item.label}</span>
              </button>
            );
          })}
        </div>

        <span className="text-xs text-[var(--color-muted)] tabular-nums">
          {assets.filter((a) => a.kind === 'image').length} images ·{' '}
          {assets.filter((a) => a.kind === 'video').length} videos ·{' '}
          {carousels.length} managed carousels
        </span>
      </div>

      {/* IMAGE & VIDEO LIBRARIES */}
      {tab !== 'carousels' && (
        <div className="space-y-5">
          {canWrite && tab === 'images' && (
            <div
              onDragOver={(e) => {
                e.preventDefault();
                setDragActive(true);
              }}
              onDragLeave={() => setDragActive(false)}
              onDrop={(e) => {
                e.preventDefault();
                setDragActive(false);
                void uploadImageFiles(e.dataTransfer.files);
              }}
              className={`rounded-xl border-2 border-dashed p-5 flex flex-wrap items-center justify-between gap-4 transition-colors ${
                dragActive
                  ? 'border-[var(--color-bronze)] bg-[#D4A537]/15'
                  : 'border-[var(--color-border)] bg-[var(--surface-elevated)]'
              }`}
            >
              <div className="space-y-1">
                <p className="text-xs font-semibold uppercase tracking-[0.12em] text-[var(--color-bronze)]">
                  Multi-Image Upload Dropzone
                </p>
                <p className="text-xs text-[var(--color-muted)]">
                  Drag PNG, JPEG, or WebP images here or browse files (up to 8 MB each) to add them directly to the live catalog.
                </p>
              </div>
              <label className="inline-flex items-center gap-2 min-h-[38px] px-4 rounded-lg royal-gold-surface text-xs font-semibold cursor-pointer whitespace-nowrap">
                <Upload className="w-3.5 h-3.5" />
                <span>{uploadingFiles ? 'Uploading…' : 'Select Images'}</span>
                <input
                  type="file"
                  multiple
                  accept="image/png,image/jpeg,image/webp"
                  className="sr-only"
                  onChange={(e) => void uploadImageFiles(e.target.files)}
                />
              </label>
            </div>
          )}

          {canWrite && tab === 'videos' && (
            <form
              onSubmit={handleCreateVideo}
              className="rounded-xl border border-[var(--color-border)] bg-[var(--surface-elevated)] p-5 space-y-4"
            >
              <p className="text-xs font-semibold uppercase tracking-[0.12em] text-[var(--color-bronze)]">
                Add Video Broadcast / Promo Reel
              </p>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs">
                <input
                  type="text"
                  required
                  placeholder="Video Title *"
                  value={newVideoTitle}
                  onChange={(e) => setNewVideoTitle(e.target.value)}
                  className="min-h-[38px] px-3 rounded-lg border border-[var(--color-border)] bg-[var(--color-canvas)]"
                />
                <input
                  type="url"
                  required
                  placeholder="Video Embed / Stream URL *"
                  value={newVideoUrl}
                  onChange={(e) => setNewVideoUrl(e.target.value)}
                  className="min-h-[38px] px-3 rounded-lg border border-[var(--color-border)] bg-[var(--color-canvas)]"
                />
                <select
                  value={newVideoCat}
                  onChange={(e) => setNewVideoCat(e.target.value as MediaAssetRecord['category'])}
                  className="min-h-[38px] px-3 rounded-lg border border-[var(--color-border)] bg-[var(--color-canvas)]"
                >
                  <option value="teaser">Teaser / Promo</option>
                  <option value="festival">Festival Reel</option>
                  <option value="mahabharata">Mahabharata Discourse</option>
                </select>
                <input
                  type="text"
                  placeholder="Description / Broadcast Notes"
                  value={newVideoDesc}
                  onChange={(e) => setNewVideoDesc(e.target.value)}
                  className="min-h-[38px] px-3 rounded-lg border border-[var(--color-border)] bg-[var(--color-canvas)] md:col-span-2"
                />
                <button
                  type="submit"
                  disabled={uploadingFiles}
                  className="min-h-[38px] px-4 rounded-lg royal-gold-surface text-xs font-semibold cursor-pointer"
                >
                  {uploadingFiles ? 'Saving…' : 'Publish Video'}
                </button>
              </div>
            </form>
          )}

          {/* Filter Bar */}
          <div className="rounded-xl border border-[var(--color-border)] bg-[var(--surface-elevated)] p-4 flex flex-wrap items-center justify-between gap-3">
            <div className="relative flex-1 min-w-[220px] max-w-sm">
              <Search className="w-4 h-4 text-[var(--color-muted)] absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="search"
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value);
                  setPageIdx(1);
                }}
                placeholder="Search media title, tags, or page usage…"
                className="w-full min-h-[36px] pl-9 pr-3 rounded-lg border border-[var(--color-border)] bg-[var(--color-canvas)] text-xs"
              />
            </div>
            <div className="flex flex-wrap gap-1.5">
              {(
                ['all', 'mahabharata', 'devis', 'temples', 'manuscripts', 'festival', 'story', 'teaser'] as const
              ).map((cat) => (
                <button
                  key={cat}
                  type="button"
                  onClick={() => {
                    setCategoryFilter(cat);
                    setPageIdx(1);
                  }}
                  className={`px-2.5 py-1 rounded text-xs capitalize cursor-pointer ${
                    categoryFilter === cat
                      ? 'bg-[#17233A] text-[#F7D774] dark:bg-[#D4A537] dark:text-[#171717] font-semibold'
                      : 'bg-[var(--color-canvas)] text-[var(--color-muted)] hover:text-[var(--color-ink)]'
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>

          {/* Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {pagedAssets.items.length === 0 ? (
              <div className="col-span-full rounded-xl border border-[var(--color-border)] bg-[var(--surface-elevated)] p-10 text-center text-xs text-[var(--color-muted)]">
                No {tab === 'videos' ? 'video' : 'image'} assets match the selected filter.
              </div>
            ) : (
              pagedAssets.items.map((asset) => {
                const resolvedSrc = resolveCmsMediaUrl(asset.assetKey, asset.url);
                return (
                  <article
                    key={asset.id}
                    data-testid={`media-asset-card-${asset.id}`}
                    className="rounded-xl border border-[var(--color-border)] bg-[var(--surface-elevated)] overflow-hidden flex flex-col justify-between"
                  >
                    <div>
                      {asset.kind === 'image' && resolvedSrc && (
                        <div className="aspect-[16/10] bg-[#17233A] overflow-hidden">
                          <img
                            src={resolvedSrc}
                            alt={asset.altText || asset.title}
                            style={{ objectPosition: asset.focalPoint || '50% 42%' }}
                            className="w-full h-full object-cover"
                          />
                        </div>
                      )}
                      <div className="p-4 space-y-2">
                        <div className="flex items-center justify-between gap-2 text-[11px] text-[var(--color-muted)]">
                          <span className="capitalize font-medium text-[var(--color-bronze)]">
                            {asset.category}
                          </span>
                          <AdminStatusBadge status={asset.published ? 'published' : 'draft'} />
                        </div>
                        <h3 className="font-editorial text-lg text-[var(--color-ink)] leading-snug">
                          {asset.title}
                        </h3>
                        <p className="text-xs text-[var(--color-muted)] line-clamp-2">
                          {asset.caption || asset.description}
                        </p>
                        {asset.usageLocations.length > 0 && (
                          <p className="text-[11px] text-[var(--color-muted)]">
                            Used in: <span className="text-[var(--color-ink)]">{asset.usageLocations.join(' · ')}</span>
                          </p>
                        )}
                      </div>
                    </div>

                    {canWrite && (
                      <div className="px-4 py-3 border-t border-[var(--color-border)] flex flex-wrap items-center justify-between gap-2 text-xs">
                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() =>
                              void toggleAssetField(asset, { published: !asset.published })
                            }
                            className="inline-flex items-center gap-1 hover:text-[var(--color-bronze)] cursor-pointer"
                          >
                            {asset.published ? (
                              <EyeOff className="w-3.5 h-3.5" />
                            ) : (
                              <Eye className="w-3.5 h-3.5" />
                            )}
                            <span>{asset.published ? 'Hide' : 'Publish'}</span>
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              setEditingAsset(asset);
                              setEditTitle(asset.title);
                              setEditAlt(asset.altText);
                              setEditCaption(asset.caption);
                              setEditTags(asset.tags.join(', '));
                              setEditFocal(asset.focalPoint || '50% 42%');
                            }}
                            className="inline-flex items-center gap-1 hover:text-[var(--color-bronze)] cursor-pointer"
                          >
                            <Pencil className="w-3.5 h-3.5" />
                            <span>Edit</span>
                          </button>
                          {asset.kind === 'image' && (
                            <button
                              type="button"
                              onClick={() => {
                                setReplaceAssetTarget(asset);
                                setReplaceUrl('');
                              }}
                              className="inline-flex items-center gap-1 hover:text-[var(--color-bronze)] cursor-pointer"
                            >
                              <RefreshCw className="w-3.5 h-3.5" />
                              <span>Replace</span>
                            </button>
                          )}
                        </div>
                        <button
                          type="button"
                          onClick={() => setDeleteTarget(asset)}
                          aria-label={`Delete ${asset.title}`}
                          className="p-1 text-red-600 dark:text-red-300 hover:bg-red-500/10 rounded cursor-pointer"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    )}
                  </article>
                );
              })
            )}
          </div>

          <div className="rounded-xl border border-[var(--color-border)] bg-[var(--surface-elevated)] overflow-hidden">
            <AdminPaginationBar
              page={pagedAssets.page}
              totalPages={pagedAssets.totalPages}
              totalItems={pagedAssets.totalItems}
              pageSize={pageSize}
              onPageChange={setPageIdx}
            />
          </div>
        </div>
      )}

      {/* CAROUSEL MANAGER */}
      {tab === 'carousels' && activeCarousel && (
        <div className="space-y-5" data-testid="carousel-manager-panel">
          <div className="rounded-xl border border-[var(--color-border)] bg-[var(--surface-elevated)] p-4 sm:p-5 flex flex-wrap items-center justify-between gap-4">
            <div className="flex flex-wrap items-center gap-3">
              <label className="space-y-1 text-xs">
                <span className="text-[var(--color-muted)] block">Target Carousel</span>
                <select
                  data-testid="carousel-select"
                  value={activeCarousel.id}
                  onChange={(e) => setSelectedCarouselId(e.target.value)}
                  className="min-h-[38px] px-3 rounded-lg border border-[var(--color-border)] bg-[var(--color-canvas)] font-medium"
                >
                  {carousels.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name} ({c.placement})
                    </option>
                  ))}
                </select>
              </label>

              <label className="space-y-1 text-xs">
                <span className="text-[var(--color-muted)] block">Auto-Advance (ms)</span>
                <input
                  type="number"
                  min={1500}
                  max={20000}
                  step={250}
                  disabled={!canWriteCarousels}
                  value={autoAdvanceMs}
                  onChange={(e) => setAutoAdvanceMs(Number(e.target.value) || 5500)}
                  className="w-32 min-h-[38px] px-3 rounded-lg border border-[var(--color-border)] bg-[var(--color-canvas)] tabular-nums"
                />
              </label>

              <label className="space-y-1 text-xs">
                <span className="text-[var(--color-muted)] block">Transition Style</span>
                <select
                  disabled={!canWriteCarousels}
                  value={transitionStyle}
                  onChange={(e) =>
                    setTransitionStyle(e.target.value as CarouselConfigRecord['transitionStyle'])
                  }
                  className="min-h-[38px] px-3 rounded-lg border border-[var(--color-border)] bg-[var(--color-canvas)]"
                >
                  <option value="slide-rtl">Slide RTL</option>
                  <option value="crossfade">Crossfade</option>
                  <option value="cinematic-pan">Cinematic Pan</option>
                </select>
              </label>
            </div>

            {canWriteCarousels && (
              <div className="flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  onClick={addCarouselSlide}
                  className="inline-flex items-center gap-1 min-h-[38px] px-3 rounded-lg border border-[var(--color-border)] text-xs font-medium hover:border-[var(--color-bronze)] cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5 text-[var(--color-bronze)]" />
                  <span>Add Slide</span>
                </button>
                <button
                  type="button"
                  disabled={savingCarousel}
                  data-testid="carousel-save-draft-btn"
                  onClick={() => void saveCarousel('draft')}
                  className="inline-flex items-center gap-1.5 min-h-[38px] px-3.5 rounded-lg border border-[#9C6B1E]/60 text-xs font-semibold cursor-pointer"
                >
                  <Save className="w-3.5 h-3.5 text-[var(--color-bronze)]" />
                  <span>Save Draft</span>
                </button>
                <button
                  type="button"
                  disabled={savingCarousel}
                  data-testid="carousel-publish-btn"
                  onClick={() => setConfirmCarouselPublish(true)}
                  className="inline-flex items-center gap-1.5 min-h-[38px] px-4 rounded-lg royal-gold-surface text-xs font-semibold cursor-pointer"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>Publish Carousel Live</span>
                </button>
              </div>
            )}
          </div>

          <div className="space-y-4">
            {carouselDraftSlides.map((slide, idx) => {
              const previewSrc = resolveCmsMediaUrl(slide.assetKey, slide.src);
              return (
                <div
                  key={slide.id}
                  data-testid={`carousel-slide-${slide.id}`}
                  className="rounded-xl border border-[var(--color-border)] bg-[var(--surface-elevated)] p-4 sm:p-5 grid grid-cols-1 lg:grid-cols-12 gap-4 items-start"
                >
                  <div className="lg:col-span-3 space-y-2">
                    <div className="aspect-[16/10] rounded-lg bg-[#17233A] border border-[var(--color-border)] overflow-hidden">
                      {previewSrc && (
                        <img
                          src={previewSrc}
                          alt={slide.alt || slide.title}
                          className="w-full h-full object-cover"
                        />
                      )}
                    </div>
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-mono text-[var(--color-bronze)] tabular-nums">
                        Slide {String(idx + 1).padStart(2, '0')}
                      </span>
                      <AdminStatusBadge status={slide.enabled ? 'published' : 'draft'} />
                    </div>
                  </div>

                  <div className="lg:col-span-9 space-y-3 text-xs">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <label className="space-y-1">
                        <span className="text-[var(--color-muted)]">Slide Title / Headline</span>
                        <input
                          type="text"
                          disabled={!canWriteCarousels}
                          value={slide.title}
                          onChange={(e) =>
                            setCarouselDraftSlides((prev) =>
                              prev.map((s) =>
                                s.id === slide.id ? { ...s, title: e.target.value } : s,
                              ),
                            )
                          }
                          className="w-full min-h-[36px] px-3 rounded-lg border border-[var(--color-border)] bg-[var(--color-canvas)]"
                        />
                      </label>

                      <label className="space-y-1">
                        <span className="text-[var(--color-muted)]">Subtitle / Citation</span>
                        <input
                          type="text"
                          disabled={!canWriteCarousels}
                          value={slide.subtitle}
                          onChange={(e) =>
                            setCarouselDraftSlides((prev) =>
                              prev.map((s) =>
                                s.id === slide.id ? { ...s, subtitle: e.target.value } : s,
                              ),
                            )
                          }
                          className="w-full min-h-[36px] px-3 rounded-lg border border-[var(--color-border)] bg-[var(--color-canvas)]"
                        />
                      </label>

                      <label className="space-y-1">
                        <span className="text-[var(--color-muted)]">Caption / Chapter Ref</span>
                        <input
                          type="text"
                          disabled={!canWriteCarousels}
                          value={slide.caption ?? slide.chapterRef ?? ''}
                          onChange={(e) =>
                            setCarouselDraftSlides((prev) =>
                              prev.map((s) =>
                                s.id === slide.id
                                  ? { ...s, caption: e.target.value, chapterRef: e.target.value }
                                  : s,
                              ),
                            )
                          }
                          className="w-full min-h-[36px] px-3 rounded-lg border border-[var(--color-border)] bg-[var(--color-canvas)]"
                        />
                      </label>

                      <label className="space-y-1">
                        <span className="text-[var(--color-muted)]">Image Source URL / Asset Key</span>
                        <input
                          type="text"
                          disabled={!canWriteCarousels}
                          value={slide.src}
                          onChange={(e) =>
                            setCarouselDraftSlides((prev) =>
                              prev.map((s) =>
                                s.id === slide.id ? { ...s, src: e.target.value } : s,
                              ),
                            )
                          }
                          className="w-full min-h-[36px] px-3 rounded-lg border border-[var(--color-border)] bg-[var(--color-canvas)] font-mono"
                        />
                      </label>
                    </div>

                    {canWriteCarousels && (
                      <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-[var(--color-border)]">
                        <div className="flex items-center gap-1.5">
                          <button
                            type="button"
                            disabled={idx === 0}
                            onClick={() => moveSlide(idx, -1)}
                            aria-label="Move slide up"
                            className="p-1.5 rounded border border-[var(--color-border)] disabled:opacity-35 cursor-pointer"
                          >
                            <ArrowUp className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            disabled={idx === carouselDraftSlides.length - 1}
                            onClick={() => moveSlide(idx, 1)}
                            aria-label="Move slide down"
                            className="p-1.5 rounded border border-[var(--color-border)] disabled:opacity-35 cursor-pointer"
                          >
                            <ArrowDown className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() =>
                              setCarouselDraftSlides((prev) =>
                                prev.map((s) =>
                                  s.id === slide.id ? { ...s, enabled: !s.enabled } : s,
                                ),
                              )
                            }
                            className="px-2.5 py-1 rounded border border-[var(--color-border)] hover:border-[var(--color-bronze)] cursor-pointer"
                          >
                            {slide.enabled ? 'Disable Slide' : 'Enable Slide'}
                          </button>
                        </div>

                        <button
                          type="button"
                          onClick={() =>
                            setCarouselDraftSlides((prev) =>
                              prev
                                .filter((s) => s.id !== slide.id)
                                .map((s, i) => ({ ...s, order: i + 1 })),
                            )
                          }
                          className="inline-flex items-center gap-1 px-2.5 py-1 rounded border border-red-500/35 text-red-600 dark:text-red-300 cursor-pointer"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                          <span>Remove</span>
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Edit Metadata Dialog */}
      {editingAsset && (
        <div className="fixed inset-0 z-50 bg-[#0D1422]/70 flex items-center justify-center p-4">
          <form
            onSubmit={saveMetadataEdit}
            className="w-full max-w-lg rounded-xl border border-[var(--color-border)] bg-[var(--surface-elevated)] p-6 space-y-4 text-xs"
          >
            <h3 className="font-editorial text-2xl text-[var(--color-ink)]">
              Edit Asset Metadata
            </h3>
            <label className="space-y-1 block">
              <span className="text-[var(--color-muted)]">Title *</span>
              <input
                type="text"
                required
                value={editTitle}
                onChange={(e) => setEditTitle(e.target.value)}
                className="w-full min-h-[38px] px-3 rounded-lg border border-[var(--color-border)] bg-[var(--color-canvas)]"
              />
            </label>
            <label className="space-y-1 block">
              <span className="text-[var(--color-muted)]">Accessible Alt Text</span>
              <input
                type="text"
                value={editAlt}
                onChange={(e) => setEditAlt(e.target.value)}
                className="w-full min-h-[38px] px-3 rounded-lg border border-[var(--color-border)] bg-[var(--color-canvas)]"
              />
            </label>
            <label className="space-y-1 block">
              <span className="text-[var(--color-muted)]">Caption</span>
              <input
                type="text"
                value={editCaption}
                onChange={(e) => setEditCaption(e.target.value)}
                className="w-full min-h-[38px] px-3 rounded-lg border border-[var(--color-border)] bg-[var(--color-canvas)]"
              />
            </label>
            <div className="grid grid-cols-2 gap-3">
              <label className="space-y-1 block">
                <span className="text-[var(--color-muted)]">Tags (comma-separated)</span>
                <input
                  type="text"
                  value={editTags}
                  onChange={(e) => setEditTags(e.target.value)}
                  className="w-full min-h-[38px] px-3 rounded-lg border border-[var(--color-border)] bg-[var(--color-canvas)]"
                />
              </label>
              <label className="space-y-1 block">
                <span className="text-[var(--color-muted)]">Focal Point</span>
                <input
                  type="text"
                  value={editFocal}
                  onChange={(e) => setEditFocal(e.target.value)}
                  className="w-full min-h-[38px] px-3 rounded-lg border border-[var(--color-border)] bg-[var(--color-canvas)] font-mono"
                />
              </label>
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setEditingAsset(null)}
                className="min-h-[36px] px-4 rounded-lg border border-[var(--color-border)] cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={savingMeta}
                className="min-h-[36px] px-5 rounded-lg royal-gold-surface font-semibold cursor-pointer"
              >
                {savingMeta ? 'Saving…' : 'Save Metadata'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Replace Asset Across Site Dialog */}
      {replaceAssetTarget && (
        <div className="fixed inset-0 z-50 bg-[#0D1422]/70 flex items-center justify-center p-4">
          <div className="w-full max-w-md rounded-xl border border-[var(--color-border)] bg-[var(--surface-elevated)] p-6 space-y-4 text-xs">
            <h3 className="font-editorial text-2xl text-[var(--color-ink)]">
              Replace Asset Across Site
            </h3>
            <p className="text-[var(--color-muted)]">
              Replacing <strong className="text-[var(--color-ink)]">{replaceAssetTarget.title}</strong> updates every page block and carousel slide referencing it.
            </p>
            <label className="space-y-1 block">
              <span className="text-[var(--color-muted)]">New Image File (PNG/JPG/WebP)</span>
              <input
                type="file"
                accept="image/png,image/jpeg,image/webp"
                disabled={replacing}
                onChange={(e) => void handleReplaceAcrossSite(e.target.files?.[0])}
                className="w-full min-h-[38px] px-2 py-1.5 rounded-lg border border-[var(--color-border)] bg-[var(--color-canvas)]"
              />
            </label>
            <label className="space-y-1 block">
              <span className="text-[var(--color-muted)]">Or Replacement URL</span>
              <input
                type="text"
                value={replaceUrl}
                onChange={(e) => setReplaceUrl(e.target.value)}
                placeholder="https://... or /uploads/..."
                className="w-full min-h-[38px] px-3 rounded-lg border border-[var(--color-border)] bg-[var(--color-canvas)]"
              />
            </label>
            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                disabled={replacing}
                onClick={() => setReplaceAssetTarget(null)}
                className="min-h-[36px] px-4 rounded-lg border border-[var(--color-border)] cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={replacing || !replaceUrl.trim()}
                onClick={() => void handleReplaceAcrossSite()}
                className="min-h-[36px] px-5 rounded-lg royal-gold-surface font-semibold cursor-pointer disabled:opacity-50"
              >
                {replacing ? 'Replacing…' : 'Apply URL Replacement'}
              </button>
            </div>
          </div>
        </div>
      )}

      <AdminConfirmModal
        open={Boolean(deleteTarget)}
        title="Delete Media Asset"
        description="Deleting this asset removes it from the CMS Media Library. Verify that no active carousel slide or page section requires it."
        targetSummary={deleteTarget ? `${deleteTarget.title} (${deleteTarget.kind})` : undefined}
        confirmLabel="Delete Asset"
        tone="danger"
        busy={deleting}
        onCancel={() => setDeleteTarget(null)}
        onConfirm={() => void handleDeleteAsset()}
      />

      <AdminConfirmModal
        open={confirmCarouselPublish}
        title="Publish Carousel Slides Live"
        description="Publishing updates the live public homepage carousel immediately and records a snapshot for rollback."
        targetSummary={
          activeCarousel
            ? `${activeCarousel.name} · ${carouselDraftSlides.filter((s) => s.enabled).length} enabled slide(s)`
            : undefined
        }
        confirmLabel="Publish Carousel Live"
        tone="publish"
        busy={savingCarousel}
        onCancel={() => setConfirmCarouselPublish(false)}
        onConfirm={() => void saveCarousel('publish')}
      />
    </div>
  );
};
