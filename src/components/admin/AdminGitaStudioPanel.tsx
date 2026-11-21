import React, { useEffect, useMemo, useState } from 'react';
import { BookOpen, Plus, Save, ScrollText, Search, Trash2 } from 'lucide-react';
import { invalidatePublicCmsCache } from '../../hooks/usePublicCms';
import { adminFetch } from '../../utils/adminSession';
import {
  paginateRecords,
  type PublishStatus,
  type ScriptureChapterOverride,
  type ScriptureVerseRecord,
} from '../../utils/cmsSync';
import {
  AdminConfirmModal,
  AdminPaginationBar,
  AdminStatusBadge,
  type AdminToastMessage,
} from './AdminUiPrimitives';

interface AdminGitaStudioPanelProps {
  initialTab: 'chapters' | 'verses';
  chapters: ScriptureChapterOverride[];
  verses: ScriptureVerseRecord[];
  canWrite: boolean;
  onRefresh: () => void;
  onToast: (toast: Omit<AdminToastMessage, 'id'>) => void;
}

export const AdminGitaStudioPanel: React.FC<AdminGitaStudioPanelProps> = ({
  initialTab,
  chapters,
  verses,
  canWrite,
  onRefresh,
  onToast,
}) => {
  const [tab, setTab] = useState<'chapters' | 'verses'>(initialTab);
  const [selectedChapterNum, setSelectedChapterNum] = useState<number>(
    () => chapters[0]?.chapterNumber ?? 1,
  );
  const [chapterForm, setChapterForm] = useState<ScriptureChapterOverride | null>(null);
  const [confirmSaveChapter, setConfirmSaveChapter] = useState(false);
  const [savingChapter, setSavingChapter] = useState(false);

  const [verseSearch, setVerseSearch] = useState('');
  const [verseChapterFilter, setVerseChapterFilter] = useState<number | 'all'>('all');
  const [versePage, setVersePage] = useState(1);

  const [newVerseChapter, setNewVerseChapter] = useState(2);
  const [newVerseNumber, setNewVerseNumber] = useState(47);
  const [newVerseSanskrit, setNewVerseSanskrit] = useState('');
  const [newVerseTranslit, setNewVerseTranslit] = useState('');
  const [newVerseEn, setNewVerseEn] = useState('');
  const [newVerseHi, setNewVerseHi] = useState('');
  const [newVerseTe, setNewVerseTe] = useState('');
  const [newVerseNote, setNewVerseNote] = useState('');
  const [newVerseAudio, setNewVerseAudio] = useState('');
  const [newVerseStatus, setNewVerseStatus] = useState<PublishStatus>('published');
  const [savingVerse, setSavingVerse] = useState(false);

  const [editingVerse, setEditingVerse] = useState<ScriptureVerseRecord | null>(null);
  const [confirmVerseUpdate, setConfirmVerseUpdate] = useState(false);
  const [deleteVerseTarget, setDeleteVerseTarget] = useState<ScriptureVerseRecord | null>(null);

  useEffect(() => {
    setTab(initialTab);
  }, [initialTab]);

  const activeChapter = useMemo(
    () => chapters.find((c) => c.chapterNumber === selectedChapterNum) ?? chapters[0] ?? null,
    [chapters, selectedChapterNum],
  );

  useEffect(() => {
    setChapterForm(activeChapter ? { ...activeChapter } : null);
  }, [activeChapter]);

  const filteredVerses = useMemo(() => {
    const q = verseSearch.trim().toLowerCase();
    return verses.filter((v) => {
      if (verseChapterFilter !== 'all' && v.chapterNumber !== verseChapterFilter) return false;
      if (!q) return true;
      return `${v.chapterNumber}.${v.verseNumber} ${v.sanskritDevanagari} ${v.transliteration} ${v.translationEn} ${v.commentaryNote}`
        .toLowerCase()
        .includes(q);
    });
  }, [verses, verseSearch, verseChapterFilter]);

  const pagedVerses = paginateRecords(filteredVerses, versePage, 8);

  const saveChapterOverride = async () => {
    if (!chapterForm) return;
    setSavingChapter(true);
    try {
      const res = await adminFetch(`/api/admin/scripture/chapters/${chapterForm.chapterNumber}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(chapterForm),
      });
      const json = (await res.json().catch(() => ({}))) as { error?: string };
      if (!res.ok) throw new Error(json.error || 'Failed to update chapter.');
      invalidatePublicCmsCache();
      setConfirmSaveChapter(false);
      onToast({
        kind: 'success',
        title: `Chapter ${chapterForm.chapterNumber} Saved`,
        detail: `${chapterForm.titleEn} (${chapterForm.status}) updated.`,
      });
      onRefresh();
    } catch (err) {
      onToast({
        kind: 'error',
        title: 'Chapter Save Failed',
        detail: err instanceof Error ? err.message : 'Save error.',
      });
    } finally {
      setSavingChapter(false);
    }
  };

  const handleAddVerse = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newVerseSanskrit.trim() || !newVerseEn.trim()) return;
    setSavingVerse(true);
    try {
      const res = await adminFetch('/api/admin/scripture/verses', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          chapterNumber: newVerseChapter,
          verseNumber: newVerseNumber,
          sanskritDevanagari: newVerseSanskrit.trim(),
          transliteration: newVerseTranslit.trim(),
          translationEn: newVerseEn.trim(),
          translationHi: newVerseHi.trim(),
          translationTe: newVerseTe.trim(),
          commentaryNote: newVerseNote.trim(),
          audioUrl: newVerseAudio.trim() || undefined,
          status: newVerseStatus,
        }),
      });
      const json = (await res.json().catch(() => ({}))) as { error?: string };
      if (!res.ok) throw new Error(json.error || 'Could not add verse.');
      setNewVerseSanskrit('');
      setNewVerseTranslit('');
      setNewVerseEn('');
      setNewVerseHi('');
      setNewVerseTe('');
      setNewVerseNote('');
      setNewVerseAudio('');
      invalidatePublicCmsCache();
      onToast({
        kind: 'success',
        title: 'Shloka Added',
        detail: `BG ${newVerseChapter}.${newVerseNumber} saved (${newVerseStatus}).`,
      });
      onRefresh();
    } catch (err) {
      onToast({
        kind: 'error',
        title: 'Shloka Save Failed',
        detail: err instanceof Error ? err.message : 'Add failed.',
      });
    } finally {
      setSavingVerse(false);
    }
  };

  const handlePatchVerse = async () => {
    if (!editingVerse) return;
    setSavingVerse(true);
    try {
      const res = await adminFetch(`/api/admin/scripture/verses/${editingVerse.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editingVerse),
      });
      const json = (await res.json().catch(() => ({}))) as { error?: string };
      if (!res.ok) throw new Error(json.error || 'Could not update verse.');
      setConfirmVerseUpdate(false);
      setEditingVerse(null);
      invalidatePublicCmsCache();
      onToast({
        kind: 'success',
        title: 'Shloka Updated',
        detail: `BG ${editingVerse.chapterNumber}.${editingVerse.verseNumber} updated.`,
      });
      onRefresh();
    } catch (err) {
      onToast({
        kind: 'error',
        title: 'Verse Update Failed',
        detail: err instanceof Error ? err.message : 'Update error.',
      });
    } finally {
      setSavingVerse(false);
    }
  };

  const handleDeleteVerse = async () => {
    if (!deleteVerseTarget) return;
    setSavingVerse(true);
    try {
      const res = await adminFetch(`/api/admin/scripture/verses/${deleteVerseTarget.id}`, {
        method: 'DELETE',
      });
      if (!res.ok) {
        const j = (await res.json().catch(() => ({}))) as { error?: string };
        throw new Error(j.error || 'Could not delete verse.');
      }
      setDeleteVerseTarget(null);
      invalidatePublicCmsCache();
      onToast({
        kind: 'success',
        title: 'Shloka Removed',
        detail: `BG ${deleteVerseTarget.chapterNumber}.${deleteVerseTarget.verseNumber} deleted.`,
      });
      onRefresh();
    } catch (err) {
      onToast({
        kind: 'error',
        title: 'Delete Failed',
        detail: err instanceof Error ? err.message : 'Delete error.',
      });
    } finally {
      setSavingVerse(false);
    }
  };

  return (
    <div className="space-y-6" data-testid="gita-studio-panel">
      {/* Sub-Tabs */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[var(--color-border)] pb-3">
        <div role="tablist" className="inline-flex items-center gap-1 p-1 rounded-xl border border-[var(--color-border)] bg-[var(--surface-elevated)]">
          <button
            type="button"
            role="tab"
            aria-selected={tab === 'chapters'}
            data-testid="gita-tab-chapters"
            onClick={() => setTab('chapters')}
            className={`inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-medium cursor-pointer whitespace-nowrap ${
              tab === 'chapters'
                ? 'bg-[#17233A] text-[#F5E2B5] dark:bg-[#D5AF62] dark:text-[#171717]'
                : 'text-[var(--color-muted)] hover:text-[var(--color-ink)]'
            }`}
          >
            <BookOpen className="w-3.5 h-3.5" />
            <span>18 Chapters Catalog</span>
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={tab === 'verses'}
            data-testid="gita-tab-verses"
            onClick={() => setTab('verses')}
            className={`inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-medium cursor-pointer whitespace-nowrap ${
              tab === 'verses'
                ? 'bg-[#17233A] text-[#F5E2B5] dark:bg-[#D5AF62] dark:text-[#171717]'
                : 'text-[var(--color-muted)] hover:text-[var(--color-ink)]'
            }`}
          >
            <ScrollText className="w-3.5 h-3.5" />
            <span>Shloka &amp; Commentary Bank ({verses.length})</span>
          </button>
        </div>

        <span className="text-xs text-[var(--color-muted)] tabular-nums">
          {chapters.length} Chapters · {verses.length} Curated Verses
        </span>
      </div>

      {/* 18 CHAPTERS EDITOR */}
      {tab === 'chapters' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          <div className="lg:col-span-4 rounded-xl border border-[var(--color-border)] bg-[var(--surface-elevated)] divide-y divide-[var(--color-border)] max-h-[640px] overflow-y-auto">
            {chapters.map((ch) => {
              const active = ch.chapterNumber === chapterForm?.chapterNumber;
              return (
                <button
                  key={ch.chapterNumber}
                  type="button"
                  data-testid={`chapter-select-${ch.chapterNumber}`}
                  onClick={() => setSelectedChapterNum(ch.chapterNumber)}
                  className={`w-full text-left p-3.5 transition-colors cursor-pointer flex items-center justify-between gap-2 ${
                    active
                      ? 'bg-[#17233A] text-[#F5E2B5] dark:bg-[#D5AF62]/20 dark:text-[#FFFDF8]'
                      : 'hover:bg-[#D5AF62]/10'
                  }`}
                >
                  <div className="min-w-0">
                    <p className="text-[11px] font-mono tabular-nums opacity-80">
                      Chapter {String(ch.chapterNumber).padStart(2, '0')} · {ch.verseCount} verses
                    </p>
                    <p className="font-editorial text-base truncate">{ch.titleEn}</p>
                  </div>
                  <AdminStatusBadge status={ch.status} />
                </button>
              );
            })}
          </div>

          {chapterForm && (
            <div className="lg:col-span-8 rounded-xl border border-[var(--color-border)] bg-[var(--surface-elevated)] p-5 sm:p-6 space-y-4 text-xs">
              <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-[var(--color-border)]">
                <div>
                  <p className="text-[11px] font-mono text-[var(--color-bronze)] uppercase">
                    Adhyaya {chapterForm.chapterNumber} · {chapterForm.featuredVerseRef}
                  </p>
                  <h2 className="font-editorial text-2xl text-[var(--color-ink)]">
                    {chapterForm.titleEn}
                  </h2>
                </div>
                {canWrite && (
                  <button
                    type="button"
                    data-testid="save-chapter-btn"
                    onClick={() => setConfirmSaveChapter(true)}
                    className="inline-flex items-center gap-1.5 min-h-[38px] px-4 rounded-lg royal-gold-surface font-semibold cursor-pointer"
                  >
                    <Save className="w-3.5 h-3.5" />
                    <span>Save Chapter Changes</span>
                  </button>
                )}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <label className="space-y-1">
                  <span className="text-[var(--color-muted)]">Title (English)</span>
                  <input
                    type="text"
                    disabled={!canWrite}
                    value={chapterForm.titleEn}
                    onChange={(e) =>
                      setChapterForm({ ...chapterForm, titleEn: e.target.value })
                    }
                    className="w-full min-h-[36px] px-3 rounded-lg border border-[var(--color-border)] bg-[var(--color-canvas)]"
                  />
                </label>

                <label className="space-y-1">
                  <span className="text-[var(--color-muted)]">Sanskrit Title</span>
                  <input
                    type="text"
                    disabled={!canWrite}
                    value={chapterForm.titleSanskrit}
                    onChange={(e) =>
                      setChapterForm({ ...chapterForm, titleSanskrit: e.target.value })
                    }
                    className="w-full min-h-[36px] px-3 rounded-lg border border-[var(--color-border)] bg-[var(--color-canvas)]"
                  />
                </label>

                <label className="space-y-1">
                  <span className="text-[var(--color-muted)]">Title (Hindi)</span>
                  <input
                    type="text"
                    disabled={!canWrite}
                    value={chapterForm.titleHi ?? ''}
                    onChange={(e) =>
                      setChapterForm({ ...chapterForm, titleHi: e.target.value })
                    }
                    className="w-full min-h-[36px] px-3 rounded-lg border border-[var(--color-border)] bg-[var(--color-canvas)]"
                  />
                </label>

                <label className="space-y-1">
                  <span className="text-[var(--color-muted)]">Title (Telugu)</span>
                  <input
                    type="text"
                    disabled={!canWrite}
                    value={chapterForm.titleTe ?? ''}
                    onChange={(e) =>
                      setChapterForm({ ...chapterForm, titleTe: e.target.value })
                    }
                    className="w-full min-h-[36px] px-3 rounded-lg border border-[var(--color-border)] bg-[var(--color-canvas)]"
                  />
                </label>

                <label className="space-y-1 sm:col-span-2">
                  <span className="text-[var(--color-muted)]">Key Philosophical Teaching</span>
                  <input
                    type="text"
                    disabled={!canWrite}
                    value={chapterForm.keyTeaching}
                    onChange={(e) =>
                      setChapterForm({ ...chapterForm, keyTeaching: e.target.value })
                    }
                    className="w-full min-h-[36px] px-3 rounded-lg border border-[var(--color-border)] bg-[var(--color-canvas)]"
                  />
                </label>

                <label className="space-y-1 sm:col-span-2">
                  <span className="text-[var(--color-muted)]">Summary (English)</span>
                  <textarea
                    rows={3}
                    disabled={!canWrite}
                    value={chapterForm.summaryEn}
                    onChange={(e) =>
                      setChapterForm({ ...chapterForm, summaryEn: e.target.value })
                    }
                    className="w-full p-2.5 rounded-lg border border-[var(--color-border)] bg-[var(--color-canvas)]"
                  />
                </label>

                <label className="space-y-1">
                  <span className="text-[var(--color-muted)]">Summary (Hindi)</span>
                  <textarea
                    rows={2}
                    disabled={!canWrite}
                    value={chapterForm.summaryHi ?? ''}
                    onChange={(e) =>
                      setChapterForm({ ...chapterForm, summaryHi: e.target.value })
                    }
                    className="w-full p-2.5 rounded-lg border border-[var(--color-border)] bg-[var(--color-canvas)]"
                  />
                </label>

                <label className="space-y-1">
                  <span className="text-[var(--color-muted)]">Summary (Telugu)</span>
                  <textarea
                    rows={2}
                    disabled={!canWrite}
                    value={chapterForm.summaryTe ?? ''}
                    onChange={(e) =>
                      setChapterForm({ ...chapterForm, summaryTe: e.target.value })
                    }
                    className="w-full p-2.5 rounded-lg border border-[var(--color-border)] bg-[var(--color-canvas)]"
                  />
                </label>

                <label className="space-y-1">
                  <span className="text-[var(--color-muted)]">Recitation Audio URL</span>
                  <input
                    type="text"
                    disabled={!canWrite}
                    value={chapterForm.audioUrl ?? ''}
                    onChange={(e) =>
                      setChapterForm({ ...chapterForm, audioUrl: e.target.value })
                    }
                    placeholder="/api/chapters/1/recitation or CDN MP3"
                    className="w-full min-h-[36px] px-3 rounded-lg border border-[var(--color-border)] bg-[var(--color-canvas)] font-mono"
                  />
                </label>

                <label className="space-y-1">
                  <span className="text-[var(--color-muted)]">Publication Status</span>
                  <select
                    disabled={!canWrite}
                    value={chapterForm.status}
                    onChange={(e) =>
                      setChapterForm({
                        ...chapterForm,
                        status: e.target.value as PublishStatus,
                      })
                    }
                    className="w-full min-h-[36px] px-3 rounded-lg border border-[var(--color-border)] bg-[var(--color-canvas)]"
                  >
                    <option value="published">Published</option>
                    <option value="draft">Draft</option>
                    <option value="pending-review">Pending Review</option>
                  </select>
                </label>
              </div>
            </div>
          )}
        </div>
      )}

      {/* SHLOKA / VERSE BANK */}
      {tab === 'verses' && (
        <div className="space-y-5">
          {canWrite && (
            <form
              onSubmit={handleAddVerse}
              className="rounded-xl border border-[var(--color-border)] bg-[var(--surface-elevated)] p-5 space-y-4 text-xs"
            >
              <p className="font-semibold uppercase tracking-[0.12em] text-[var(--color-bronze)] flex items-center gap-1.5">
                <Plus className="w-3.5 h-3.5" />
                <span>Add Canonical Shloka / Featured Verse</span>
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                <label className="space-y-1">
                  <span className="text-[var(--color-muted)]">Chapter (1–18)</span>
                  <input
                    type="number"
                    min={1}
                    max={18}
                    value={newVerseChapter}
                    onChange={(e) => setNewVerseChapter(Number(e.target.value) || 1)}
                    className="w-full min-h-[36px] px-3 rounded-lg border border-[var(--color-border)] bg-[var(--color-canvas)] tabular-nums"
                  />
                </label>
                <label className="space-y-1">
                  <span className="text-[var(--color-muted)]">Verse #</span>
                  <input
                    type="number"
                    min={1}
                    value={newVerseNumber}
                    onChange={(e) => setNewVerseNumber(Number(e.target.value) || 1)}
                    className="w-full min-h-[36px] px-3 rounded-lg border border-[var(--color-border)] bg-[var(--color-canvas)] tabular-nums"
                  />
                </label>
                <label className="space-y-1">
                  <span className="text-[var(--color-muted)]">Recitation Audio URL</span>
                  <input
                    type="text"
                    value={newVerseAudio}
                    onChange={(e) => setNewVerseAudio(e.target.value)}
                    placeholder="Optional audio path"
                    className="w-full min-h-[36px] px-3 rounded-lg border border-[var(--color-border)] bg-[var(--color-canvas)]"
                  />
                </label>
                <label className="space-y-1">
                  <span className="text-[var(--color-muted)]">Status</span>
                  <select
                    value={newVerseStatus}
                    onChange={(e) => setNewVerseStatus(e.target.value as PublishStatus)}
                    className="w-full min-h-[36px] px-3 rounded-lg border border-[var(--color-border)] bg-[var(--color-canvas)]"
                  >
                    <option value="published">Published</option>
                    <option value="draft">Draft</option>
                  </select>
                </label>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <label className="space-y-1">
                  <span className="text-[var(--color-muted)]">Sanskrit Devanagari *</span>
                  <textarea
                    required
                    rows={2}
                    value={newVerseSanskrit}
                    onChange={(e) => setNewVerseSanskrit(e.target.value)}
                    className="w-full p-2.5 rounded-lg border border-[var(--color-border)] bg-[var(--color-canvas)]"
                  />
                </label>
                <label className="space-y-1">
                  <span className="text-[var(--color-muted)]">IAST Transliteration</span>
                  <textarea
                    rows={2}
                    value={newVerseTranslit}
                    onChange={(e) => setNewVerseTranslit(e.target.value)}
                    className="w-full p-2.5 rounded-lg border border-[var(--color-border)] bg-[var(--color-canvas)]"
                  />
                </label>
                <label className="space-y-1">
                  <span className="text-[var(--color-muted)]">English Meaning *</span>
                  <textarea
                    required
                    rows={2}
                    value={newVerseEn}
                    onChange={(e) => setNewVerseEn(e.target.value)}
                    className="w-full p-2.5 rounded-lg border border-[var(--color-border)] bg-[var(--color-canvas)]"
                  />
                </label>
                <label className="space-y-1">
                  <span className="text-[var(--color-muted)]">Editorial Commentary</span>
                  <textarea
                    rows={2}
                    value={newVerseNote}
                    onChange={(e) => setNewVerseNote(e.target.value)}
                    className="w-full p-2.5 rounded-lg border border-[var(--color-border)] bg-[var(--color-canvas)]"
                  />
                </label>
                <input
                  type="text"
                  placeholder="Hindi translation (optional)"
                  value={newVerseHi}
                  onChange={(e) => setNewVerseHi(e.target.value)}
                  className="min-h-[36px] px-3 rounded-lg border border-[var(--color-border)] bg-[var(--color-canvas)]"
                />
                <input
                  type="text"
                  placeholder="Telugu translation (optional)"
                  value={newVerseTe}
                  onChange={(e) => setNewVerseTe(e.target.value)}
                  className="min-h-[36px] px-3 rounded-lg border border-[var(--color-border)] bg-[var(--color-canvas)]"
                />
              </div>

              <button
                type="submit"
                disabled={savingVerse}
                data-testid="add-verse-submit-btn"
                className="min-h-[38px] px-5 rounded-lg royal-gold-surface font-semibold cursor-pointer"
              >
                {savingVerse ? 'Saving…' : 'Save Shloka to Scripture Bank'}
              </button>
            </form>
          )}

          {/* Filter Toolbar */}
          <div className="rounded-xl border border-[var(--color-border)] bg-[var(--surface-elevated)] p-4 flex flex-wrap items-center justify-between gap-3">
            <div className="relative flex-1 min-w-[220px] max-w-sm">
              <Search className="w-4 h-4 text-[var(--color-muted)] absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="search"
                value={verseSearch}
                onChange={(e) => {
                  setVerseSearch(e.target.value);
                  setVersePage(1);
                }}
                placeholder="Search Sanskrit, transliteration, or translation…"
                className="w-full min-h-[36px] pl-9 pr-3 rounded-lg border border-[var(--color-border)] bg-[var(--color-canvas)] text-xs"
              />
            </div>

            <select
              value={verseChapterFilter}
              onChange={(e) => {
                const v = e.target.value;
                setVerseChapterFilter(v === 'all' ? 'all' : Number(v));
                setVersePage(1);
              }}
              aria-label="Filter verses by chapter"
              className="min-h-[36px] px-3 rounded-lg border border-[var(--color-border)] bg-[var(--color-canvas)] text-xs"
            >
              <option value="all">All 18 Chapters</option>
              {Array.from({ length: 18 }, (_, i) => i + 1).map((n) => (
                <option key={n} value={n}>
                  Chapter {n}
                </option>
              ))}
            </select>
          </div>

          <div className="rounded-xl border border-[var(--color-border)] bg-[var(--surface-elevated)] divide-y divide-[var(--color-border)]">
            {pagedVerses.items.length === 0 ? (
              <p className="p-8 text-center text-xs text-[var(--color-muted)]">
                No verses match the current filter.
              </p>
            ) : (
              pagedVerses.items.map((v) => (
                <div key={v.id} className="p-4 sm:p-5 space-y-2 text-xs">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <span className="font-mono font-semibold text-[var(--color-bronze)] tabular-nums">
                        BG {v.chapterNumber}.{v.verseNumber}
                      </span>
                      <AdminStatusBadge status={v.status} />
                    </div>
                    {canWrite && (
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => setEditingVerse({ ...v })}
                          className="px-2.5 py-1 rounded border border-[var(--color-border)] hover:border-[var(--color-bronze)] cursor-pointer"
                        >
                          Edit Shloka
                        </button>
                        <button
                          type="button"
                          onClick={() => setDeleteVerseTarget(v)}
                          aria-label={`Delete BG ${v.chapterNumber}.${v.verseNumber}`}
                          className="p-1.5 rounded border border-red-500/35 text-red-600 dark:text-red-300 cursor-pointer"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    )}
                  </div>
                  <p lang="sa" className="text-sm font-medium text-[var(--color-ink)] whitespace-pre-line">
                    {v.sanskritDevanagari}
                  </p>
                  <p className="text-[var(--color-muted)]">{v.translationEn}</p>
                </div>
              ))
            )}
            <AdminPaginationBar
              page={pagedVerses.page}
              totalPages={pagedVerses.totalPages}
              totalItems={pagedVerses.totalItems}
              pageSize={8}
              onPageChange={setVersePage}
            />
          </div>
        </div>
      )}

      {/* Edit Existing Verse Modal */}
      {editingVerse && (
        <div className="fixed inset-0 z-50 bg-[#0D1422]/70 flex items-center justify-center p-4">
          <div className="w-full max-w-xl rounded-xl border border-[var(--color-border)] bg-[var(--surface-elevated)] p-6 space-y-4 text-xs">
            <h3 className="font-editorial text-2xl text-[var(--color-ink)]">
              Edit Verse BG {editingVerse.chapterNumber}.{editingVerse.verseNumber}
            </h3>
            <label className="space-y-1 block">
              <span className="text-[var(--color-muted)]">Sanskrit Devanagari</span>
              <textarea
                rows={2}
                value={editingVerse.sanskritDevanagari}
                onChange={(e) =>
                  setEditingVerse({ ...editingVerse, sanskritDevanagari: e.target.value })
                }
                className="w-full p-2.5 rounded-lg border border-[var(--color-border)] bg-[var(--color-canvas)]"
              />
            </label>
            <label className="space-y-1 block">
              <span className="text-[var(--color-muted)]">English Translation</span>
              <textarea
                rows={2}
                value={editingVerse.translationEn}
                onChange={(e) =>
                  setEditingVerse({ ...editingVerse, translationEn: e.target.value })
                }
                className="w-full p-2.5 rounded-lg border border-[var(--color-border)] bg-[var(--color-canvas)]"
              />
            </label>
            <label className="space-y-1 block">
              <span className="text-[var(--color-muted)]">Commentary Note</span>
              <input
                type="text"
                value={editingVerse.commentaryNote}
                onChange={(e) =>
                  setEditingVerse({ ...editingVerse, commentaryNote: e.target.value })
                }
                className="w-full min-h-[36px] px-3 rounded-lg border border-[var(--color-border)] bg-[var(--color-canvas)]"
              />
            </label>
            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setEditingVerse(null)}
                className="min-h-[36px] px-4 rounded-lg border border-[var(--color-border)] cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => setConfirmVerseUpdate(true)}
                className="min-h-[36px] px-5 rounded-lg royal-gold-surface font-semibold cursor-pointer"
              >
                Save Shloka Update
              </button>
            </div>
          </div>
        </div>
      )}

      <AdminConfirmModal
        open={confirmSaveChapter}
        title="Confirm Canonical Chapter Update"
        description="Updating a Bhagavad Gita chapter modifies the public /gita explorer and chapter summaries immediately when published."
        targetSummary={
          chapterForm ? `Chapter ${chapterForm.chapterNumber}: ${chapterForm.titleEn}` : undefined
        }
        confirmLabel="Confirm & Save Chapter"
        tone="publish"
        busy={savingChapter}
        onCancel={() => setConfirmSaveChapter(false)}
        onConfirm={() => void saveChapterOverride()}
      />

      <AdminConfirmModal
        open={confirmVerseUpdate}
        title="Confirm Canonical Shloka Overwrite"
        description="Verify Sanskrit spelling and citation accuracy before overwriting a canonical Bhagavad Gita verse."
        targetSummary={
          editingVerse
            ? `BG ${editingVerse.chapterNumber}.${editingVerse.verseNumber}`
            : undefined
        }
        confirmLabel="Overwrite Shloka"
        tone="publish"
        busy={savingVerse}
        onCancel={() => setConfirmVerseUpdate(false)}
        onConfirm={() => void handlePatchVerse()}
      />

      <AdminConfirmModal
        open={Boolean(deleteVerseTarget)}
        title="Delete Shloka Entry"
        description="Deleting this entry removes it from the CMS Shloka Bank. Canonical hardcoded verses on public pages revert to default if removed."
        targetSummary={
          deleteVerseTarget
            ? `BG ${deleteVerseTarget.chapterNumber}.${deleteVerseTarget.verseNumber}`
            : undefined
        }
        confirmLabel="Delete Shloka"
        tone="danger"
        busy={savingVerse}
        onCancel={() => setDeleteVerseTarget(null)}
        onConfirm={() => void handleDeleteVerse()}
      />
    </div>
  );
};
