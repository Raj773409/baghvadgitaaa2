import React, { useState } from 'react';
import { Eye, EyeOff, Film, ImagePlus, Trash2 } from 'lucide-react';
import type { CmsEntry, MediaEntry } from './adminTypes';
import { adminFetch } from '../../utils/adminSession';

export const AdminMediaPanel: React.FC<{
  mode: 'gallery' | 'video';
  media: MediaEntry[];
  canWrite: boolean;
  onRefresh: () => void;
}> = ({ mode, media, canWrite, onRefresh }) => {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState<MediaEntry['category']>(
    mode === 'video' ? 'teaser' : 'temples',
  );
  const [url, setUrl] = useState('');
  const [imageBase64, setImageBase64] = useState('');
  const [focalPoint, setFocalPoint] = useState('50% 42%');
  const [language, setLanguage] = useState('English · Telugu · Hindi');
  const [altText, setAltText] = useState('');
  const [copyright, setCopyright] = useState(
    '© Aishwarya Sarvahith Foundation — Mahotsav Cultural Archive',
  );
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const visibleItems = media.filter((m) =>
    mode === 'video' ? m.kind === 'video' : m.kind === 'image',
  );

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        setImageBase64(reader.result);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      const res = await adminFetch('/api/admin/media', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          kind: mode === 'video' ? 'video' : 'image',
          category,
          title,
          description,
          url,
          imageBase64,
          focalPoint,
          language,
          altText: altText || title,
          copyright,
          published: true,
        }),
      });
      const json = (await res.json().catch(() => ({}))) as { error?: string };
      if (!res.ok) throw new Error(json.error || 'Could not save media asset.');
      setTitle('');
      setDescription('');
      setUrl('');
      setImageBase64('');
      setAltText('');
      onRefresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Upload failed.');
    } finally {
      setSubmitting(false);
    }
  };

  const togglePublish = async (item: MediaEntry) => {
    setError(null);
    const res = await adminFetch(`/api/admin/media/${item.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ published: !item.published }),
    });
    if (!res.ok) {
      const json = (await res.json().catch(() => ({}))) as { error?: string };
      setError(json.error || 'Could not update media status.');
      return;
    }
    onRefresh();
  };

  const deleteItem = async (id: string) => {
    setError(null);
    const res = await adminFetch(`/api/admin/media/${id}`, {
      method: 'DELETE',
    });
    if (!res.ok) {
      const json = (await res.json().catch(() => ({}))) as { error?: string };
      setError(json.error || 'Could not delete media asset.');
      return;
    }
    onRefresh();
  };

  return (
    <div className="space-y-6">
      {!canWrite && error && (
        <p className="text-xs text-red-600 dark:text-red-300 bg-red-500/10 rounded-lg px-3 py-2">
          {error}
        </p>
      )}
      {canWrite && (
        <form
          onSubmit={handleSubmit}
          className="rounded-xl border border-[var(--color-border)] bg-[var(--surface-elevated)] p-5 sm:p-6 space-y-4"
        >
          <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.14em] text-[var(--color-bronze)]">
            {mode === 'video' ? (
              <Film className="w-4 h-4" />
            ) : (
              <ImagePlus className="w-4 h-4" />
            )}
            <span>
              {mode === 'video'
                ? 'Publish Video Program / Promo Reel'
                : 'Upload & Publish Cultural Gallery Plate'}
            </span>
          </div>

          {error && (
            <p className="text-xs text-red-600 dark:text-red-300 bg-red-500/10 rounded-lg px-3 py-2">
              {error}
            </p>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            <label className="space-y-1 text-xs">
              <span className="text-[var(--color-muted)]">Title *</span>
              <input
                type="text"
                required
                data-testid="media-title-input"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full min-h-[38px] px-3 rounded-lg border border-[var(--color-border)] bg-[var(--color-canvas)]"
              />
            </label>
            <label className="space-y-1 text-xs">
              <span className="text-[var(--color-muted)]">Category</span>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value as MediaEntry['category'])}
                className="w-full min-h-[38px] px-3 rounded-lg border border-[var(--color-border)] bg-[var(--color-canvas)]"
              >
                <option value="mahabharata">Mahabharata &amp; Krishna</option>
                <option value="devis">Devis &amp; Sacred Feminine</option>
                <option value="temples">Ancient Indian Temples</option>
                <option value="manuscripts">Palm-Leaf Manuscripts</option>
                <option value="festival">Mahotsav Preparation</option>
                <option value="teaser">Teaser / Promo</option>
              </select>
            </label>
            <label className="space-y-1 text-xs">
              <span className="text-[var(--color-muted)]">Focal Crop Position</span>
              <select
                value={focalPoint}
                onChange={(e) => setFocalPoint(e.target.value)}
                className="w-full min-h-[38px] px-3 rounded-lg border border-[var(--color-border)] bg-[var(--color-canvas)]"
              >
                <option value="50% 25%">Upper Subject (50% 25%)</option>
                <option value="50% 42%">Balanced Portrait (50% 42%)</option>
                <option value="50% 50%">Center (50% 50%)</option>
                <option value="50% 70%">Lower Architecture (50% 70%)</option>
              </select>
            </label>
            {mode === 'gallery' && (
              <label className="space-y-1 text-xs">
                <span className="text-[var(--color-muted)]">Upload Image File (PNG/JPG/WebP)</span>
                <input
                  type="file"
                  accept="image/png,image/jpeg,image/webp"
                  onChange={handleFileChange}
                  className="w-full min-h-[38px] px-2 py-1.5 rounded-lg border border-[var(--color-border)] bg-[var(--color-canvas)] text-xs"
                />
              </label>
            )}
            <label className="space-y-1 text-xs">
              <span className="text-[var(--color-muted)]">
                {mode === 'video' ? 'Video Embed / Watch URL *' : 'Or External Image URL'}
              </span>
              <input
                type="text"
                required={mode === 'video' && !imageBase64}
                data-testid="media-url-input"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                placeholder={mode === 'video' ? 'https://...' : 'https://... or upload file'}
                className="w-full min-h-[38px] px-3 rounded-lg border border-[var(--color-border)] bg-[var(--color-canvas)]"
              />
            </label>
            <label className="space-y-1 text-xs">
              <span className="text-[var(--color-muted)]">Languages</span>
              <input
                type="text"
                value={language}
                onChange={(e) => setLanguage(e.target.value)}
                className="w-full min-h-[38px] px-3 rounded-lg border border-[var(--color-border)] bg-[var(--color-canvas)]"
              />
            </label>
            <label className="space-y-1 text-xs sm:col-span-2">
              <span className="text-[var(--color-muted)]">Description / Caption</span>
              <input
                type="text"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="w-full min-h-[38px] px-3 rounded-lg border border-[var(--color-border)] bg-[var(--color-canvas)]"
              />
            </label>
            <label className="space-y-1 text-xs">
              <span className="text-[var(--color-muted)]">Alt Text &amp; Copyright</span>
              <input
                type="text"
                value={altText}
                onChange={(e) => setAltText(e.target.value)}
                placeholder="Accessible alt description"
                className="w-full min-h-[38px] px-3 rounded-lg border border-[var(--color-border)] bg-[var(--color-canvas)]"
              />
            </label>
          </div>

          <button
            type="submit"
            disabled={submitting}
            data-testid="media-publish-btn"
            className="min-h-[40px] px-5 rounded-full royal-gold-surface text-xs font-semibold uppercase tracking-[0.08em] cursor-pointer disabled:opacity-60"
          >
            {submitting ? 'Uploading…' : `Publish ${mode === 'video' ? 'Video' : 'Plate'} Live`}
          </button>
        </form>
      )}

      {/* Existing Media Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {visibleItems.length === 0 ? (
          <p className="col-span-full text-sm text-[var(--color-muted)] p-8 text-center rounded-xl border border-[var(--color-border)] bg-[var(--surface-elevated)]">
            No custom {mode === 'video' ? 'videos' : 'gallery plates'} uploaded yet.
          </p>
        ) : (
          visibleItems.map((item) => (
            <article
              key={item.id}
              className="rounded-xl border border-[var(--color-border)] bg-[var(--surface-elevated)] overflow-hidden flex flex-col justify-between"
            >
              <div>
                {item.kind === 'image' && (
                  <div className="aspect-[16/10] bg-[#17233A] overflow-hidden">
                    <img
                      src={item.url}
                      alt={item.altText}
                      style={{ objectPosition: item.focalPoint || '50% 42%' }}
                      className="w-full h-full object-cover"
                    />
                  </div>
                )}
                <div className="p-4 space-y-1.5">
                  <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-[var(--color-bronze)]">
                    {item.category} · {item.published ? 'Published' : 'Hidden'}
                  </p>
                  <h4 className="font-editorial text-lg text-[var(--color-ink)]">{item.title}</h4>
                  <p className="text-xs text-[var(--color-muted)]">{item.description}</p>
                </div>
              </div>

              {canWrite && (
                <div className="px-4 py-3 border-t border-[var(--color-border)] flex items-center justify-between gap-2 text-xs">
                  <button
                    type="button"
                    onClick={() => void togglePublish(item)}
                    className="inline-flex items-center gap-1.5 text-[var(--color-ink)] hover:text-[var(--color-bronze)] cursor-pointer"
                  >
                    {item.published ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                    <span>{item.published ? 'Unpublish' : 'Publish'}</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => void deleteItem(item.id)}
                    className="inline-flex items-center gap-1 text-red-600 dark:text-red-300 cursor-pointer"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Delete</span>
                  </button>
                </div>
              )}
            </article>
          ))
        )}
      </div>
    </div>
  );
};

export const AdminCmsPanel: React.FC<{
  section: CmsEntry['section'];
  sectionLabel: string;
  items: CmsEntry[];
  canWrite: boolean;
  onRefresh: () => void;
}> = ({ section, sectionLabel, items, canWrite, onRefresh }) => {
  const [title, setTitle] = useState('');
  const [subtitle, setSubtitle] = useState('');
  const [body, setBody] = useState('');
  const [language, setLanguage] = useState<CmsEntry['language']>('en');
  const [status, setStatus] = useState<CmsEntry['status']>('published');
  const [saving, setSaving] = useState(false);
  const [feedback, setFeedback] = useState<{ kind: 'error' | 'success'; message: string } | null>(
    null,
  );

  const sectionItems = items.filter((c) => c.section === section);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;
    setFeedback(null);
    setSaving(true);
    try {
      const res = await adminFetch('/api/admin/cms', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          section,
          title: title.trim(),
          subtitle: subtitle.trim(),
          body: body.trim(),
          language,
          status,
        }),
      });
      const json = (await res.json().catch(() => ({}))) as { error?: string };
      if (!res.ok) throw new Error(json.error || `Failed to save ${sectionLabel} record.`);
      setTitle('');
      setSubtitle('');
      setBody('');
      setFeedback({ kind: 'success', message: `${sectionLabel} record saved and persisted.` });
      onRefresh();
    } catch (err) {
      setFeedback({
        kind: 'error',
        message: err instanceof Error ? err.message : 'Unable to save CMS record.',
      });
    } finally {
      setSaving(false);
    }
  };

  const toggleStatus = async (item: CmsEntry) => {
    setFeedback(null);
    const next: CmsEntry['status'] = item.status === 'published' ? 'draft' : 'published';
    const res = await adminFetch(`/api/admin/cms/${item.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: next }),
    });
    if (!res.ok) {
      const json = (await res.json().catch(() => ({}))) as { error?: string };
      setFeedback({ kind: 'error', message: json.error || 'Could not update CMS status.' });
      return;
    }
    onRefresh();
  };

  const removeItem = async (id: string) => {
    setFeedback(null);
    const res = await adminFetch(`/api/admin/cms/${id}`, {
      method: 'DELETE',
    });
    if (!res.ok) {
      const json = (await res.json().catch(() => ({}))) as { error?: string };
      setFeedback({ kind: 'error', message: json.error || 'Could not remove CMS record.' });
      return;
    }
    onRefresh();
  };

  return (
    <div className="space-y-6">
      {feedback && (
        <p
          role="status"
          className={`text-xs rounded-lg px-3.5 py-2.5 ${
            feedback.kind === 'error'
              ? 'text-red-600 dark:text-red-300 bg-red-500/10'
              : 'text-[#2E6F40] dark:text-[#6EE7B7] bg-[#2E6F40]/10'
          }`}
        >
          {feedback.message}
        </p>
      )}
      {canWrite && (
        <form
          onSubmit={handleCreate}
          className="rounded-xl border border-[var(--color-border)] bg-[var(--surface-elevated)] p-5 sm:p-6 space-y-4"
        >
          <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[var(--color-bronze)]">
            {sectionLabel} — {saving ? 'Saving…' : 'Add Content Record'}
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            <label className="space-y-1 text-xs">
              <span className="text-[var(--color-muted)]">Entry Title *</span>
              <input
                type="text"
                required
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full min-h-[38px] px-3 rounded-lg border border-[var(--color-border)] bg-[var(--color-canvas)]"
              />
            </label>
            <label className="space-y-1 text-xs">
              <span className="text-[var(--color-muted)]">Subtitle / Tagline</span>
              <input
                type="text"
                value={subtitle}
                onChange={(e) => setSubtitle(e.target.value)}
                className="w-full min-h-[38px] px-3 rounded-lg border border-[var(--color-border)] bg-[var(--color-canvas)]"
              />
            </label>
            <div className="grid grid-cols-2 gap-2">
              <label className="space-y-1 text-xs">
                <span className="text-[var(--color-muted)]">Language</span>
                <select
                  value={language}
                  onChange={(e) => setLanguage(e.target.value as CmsEntry['language'])}
                  className="w-full min-h-[38px] px-2 rounded-lg border border-[var(--color-border)] bg-[var(--color-canvas)]"
                >
                  <option value="en">EN</option>
                  <option value="hi">HI</option>
                  <option value="te">TE</option>
                  <option value="sa">SA</option>
                </select>
              </label>
              <label className="space-y-1 text-xs">
                <span className="text-[var(--color-muted)]">Status</span>
                <select
                  value={status}
                  onChange={(e) => setStatus(e.target.value as CmsEntry['status'])}
                  className="w-full min-h-[38px] px-2 rounded-lg border border-[var(--color-border)] bg-[var(--color-canvas)]"
                >
                  <option value="published">Published</option>
                  <option value="draft">Draft</option>
                  <option value="pending-review">Pending Review</option>
                </select>
              </label>
            </div>
            <label className="space-y-1 text-xs sm:col-span-2 lg:col-span-3">
              <span className="text-[var(--color-muted)]">Content / Translation / Structured Summary</span>
              <textarea
                rows={3}
                value={body}
                onChange={(e) => setBody(e.target.value)}
                className="w-full p-3 rounded-lg border border-[var(--color-border)] bg-[var(--color-canvas)] text-xs"
              />
            </label>
          </div>
          <button
            type="submit"
            className="min-h-[40px] px-5 rounded-full royal-gold-surface text-xs font-semibold uppercase tracking-[0.08em] cursor-pointer"
          >
            Save {sectionLabel} Record
          </button>
        </form>
      )}

      <div className="rounded-xl border border-[var(--color-border)] bg-[var(--surface-elevated)] divide-y divide-[var(--color-border)]">
        {sectionItems.length === 0 ? (
          <p className="p-8 text-sm text-[var(--color-muted)] text-center">
            No CMS override records saved for {sectionLabel}. Built-in verified Secretariat content remains active.
          </p>
        ) : (
          sectionItems.map((item) => (
            <div key={item.id} className="p-4 sm:p-5 flex flex-wrap items-start justify-between gap-4">
              <div className="space-y-1 max-w-2xl">
                <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-[var(--color-bronze)]">
                  {item.language.toUpperCase()} · {item.status} · Updated{' '}
                  {new Date(item.updatedAt).toLocaleDateString()}
                </p>
                <h4 className="font-editorial text-xl text-[var(--color-ink)]">{item.title}</h4>
                {item.subtitle && (
                  <p className="text-xs font-medium text-[var(--color-muted)]">{item.subtitle}</p>
                )}
                {item.body && (
                  <p className="text-xs text-[var(--color-muted)] leading-relaxed">{item.body}</p>
                )}
              </div>

              {canWrite && (
                <div className="flex items-center gap-2 text-xs">
                  <button
                    type="button"
                    onClick={() => void toggleStatus(item)}
                    className="px-3 py-1.5 rounded-lg border border-[#C9A04E]/50 hover:bg-[#C9A04E]/15 cursor-pointer"
                  >
                    {item.status === 'published' ? 'Move to Draft' : 'Publish'}
                  </button>
                  <button
                    type="button"
                    onClick={() => void removeItem(item.id)}
                    className="p-1.5 rounded-lg border border-red-500/40 text-red-600 dark:text-red-300 cursor-pointer"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
};
