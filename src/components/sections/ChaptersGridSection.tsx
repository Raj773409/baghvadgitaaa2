import React, { useMemo, useState } from 'react';
import { ArrowRight, BookOpen, Sparkles, X } from 'lucide-react';
import { Link } from 'react-router-dom';
import { GITA_CHAPTER_CATALOG } from '../../content/scriptureContent';
import { getChapterRecitation } from '../../content/chapterRecitations';
import { usePublicCms } from '../../hooks/usePublicCms';
import { useI18n } from '../../i18n';
import { IndianVoiceAssistant } from '../audio/IndianVoiceAssistant';

type Division = 'all' | 'karma' | 'bhakti' | 'jnana';

export const ChaptersGridSection: React.FC = () => {
  const { contentLocale, getChapterContent, t } = useI18n();
  const publicCms = usePublicCms();
  const [division, setDivision] = useState<Division>('all');
  const [modalChapter, setModalChapter] = useState<number | null>(null);

  const chapterOverridesMap = useMemo(
    () =>
      new Map(
        (publicCms?.scriptureChapters ?? [])
          .filter((c) => c.status === 'published')
          .map((c) => [c.chapterNumber, c]),
      ),
    [publicCms?.scriptureChapters],
  );

  const mergedChapters = useMemo(() => {
    return GITA_CHAPTER_CATALOG.map((ch) => {
      const ov = chapterOverridesMap.get(ch.chapterNumber);
      if (!ov) return ch;
      return {
        ...ch,
        sanskritDevanagari: ov.titleSanskrit || ch.sanskritDevanagari,
        verseCount: ov.verseCount || ch.verseCount,
        approvedAudioUrl: ov.audioUrl ?? ch.approvedAudioUrl,
        title: {
          en: ov.titleEn || ch.title.en,
          hi: ov.titleHi || ch.title.hi,
          te: ov.titleTe || ch.title.te,
        },
        essence: {
          en: ov.summaryEn || ch.essence.en,
          hi: ov.summaryHi || ch.essence.hi,
          te: ov.summaryTe || ch.essence.te,
        },
        featuredVerseRef: ov.featuredVerseRef,
      };
    });
  }, [chapterOverridesMap]);

  const visibleChapters = useMemo(() => {
    return mergedChapters.filter((ch) => {
      if (division === 'karma') return ch.chapterNumber <= 6;
      if (division === 'bhakti') return ch.chapterNumber >= 7 && ch.chapterNumber <= 12;
      if (division === 'jnana') return ch.chapterNumber >= 13;
      return true;
    });
  }, [division, mergedChapters]);

  const activeChapter = useMemo(() => {
    if (modalChapter === null) return null;
    return mergedChapters.find((c) => c.chapterNumber === modalChapter) ?? null;
  }, [modalChapter, mergedChapters]);

  const activeRecitation = useMemo(() => {
    if (!activeChapter) return null;
    return getChapterRecitation(activeChapter.chapterNumber);
  }, [activeChapter]);

  return (
    <section
      id="chapters-grid"
      aria-labelledby="chapters-grid-heading"
      className="py-16 sm:py-24 bg-[var(--color-canvas)] text-[var(--color-ink)] border-b border-[var(--color-border)]"
    >
      <div className="max-w-[1360px] mx-auto px-5 sm:px-8 lg:px-12 space-y-10">
        <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-6 pb-6 border-b border-[var(--color-border)]">
          <div className="space-y-2.5 max-w-2xl">
            <div className="flex items-center gap-2 text-[11px] font-semibold tracking-[0.2em] uppercase text-[var(--color-bronze)]">
              <Sparkles className="w-3.5 h-3.5" aria-hidden="true" />
              <span>18 Chapters · Complete Spiritual Atlas</span>
            </div>
            <h2
              id="chapters-grid-heading"
              className="font-editorial text-3xl sm:text-4xl font-normal text-[var(--color-ink)]"
            >
              Explore All 18 Chapters of the Bhagavad Gita
            </h2>
            <p className="text-sm text-[var(--color-muted)] leading-relaxed">
              Select any chapter card to inspect its core teaching, verified key verse, multilingual commentary across our supported languages, and listen via the Indian Voice Assistant.
            </p>
          </div>

          <div role="tablist" aria-label="Filter Gita divisions" className="flex flex-wrap gap-2">
            {(
              [
                { id: 'all', label: t('chapters.divisionAll') },
                { id: 'karma', label: t('chapters.divisionKarma') },
                { id: 'bhakti', label: t('chapters.divisionBhakti') },
                { id: 'jnana', label: t('chapters.divisionJnana') },
              ] as const
            ).map((tab) => {
              const active = division === tab.id;
              return (
                <button
                  key={tab.id}
                  type="button"
                  role="tab"
                  aria-selected={active}
                  onClick={() => setDivision(tab.id)}
                  className={`min-h-[36px] px-4 py-1.5 rounded-full text-xs font-medium border transition-colors cursor-pointer ${
                    active
                      ? 'bg-[#17233A] text-[#F7D774] border-[#17233A] dark:bg-[#D4A537] dark:text-[#171717]'
                      : 'border-[var(--color-border)] text-[var(--color-muted)] hover:border-[#D4A537]'
                  }`}
                >
                  {tab.label}
                </button>
              );
            })}
          </div>
        </div>

        {/* Responsive 18-Chapter Cards Grid */}
        <div
          data-testid="gita-18-chapters-grid"
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5"
        >
          {visibleChapters.map((ch) => {
            const ov = chapterOverridesMap.get(ch.chapterNumber);
            const fallbackLoc = getChapterContent(ch.chapterNumber);
            const displayTitle = ov
              ? contentLocale === 'hi'
                ? ov.titleHi || fallbackLoc.title
                : contentLocale === 'te'
                  ? ov.titleTe || fallbackLoc.title
                  : ov.titleEn || fallbackLoc.title
              : fallbackLoc.title;
            const displayEssence = ov
              ? contentLocale === 'hi'
                ? ov.summaryHi || fallbackLoc.essence
                : contentLocale === 'te'
                  ? ov.summaryTe || fallbackLoc.essence
                  : ov.summaryEn || fallbackLoc.essence
              : fallbackLoc.essence;
            const rec = getChapterRecitation(ch.chapterNumber);
            return (
              <button
                key={ch.chapterNumber}
                type="button"
                data-testid={`gita-card-${ch.chapterNumber}`}
                onClick={() => setModalChapter(ch.chapterNumber)}
                className="group text-left rounded-xl p-5 bg-[var(--surface-elevated)] border border-[var(--color-border)] hover:border-[#D4A537] hover:shadow-[0_12px_32px_rgba(212,165,55,0.14)] transition-all flex flex-col justify-between gap-4 cursor-pointer"
              >
                <div className="space-y-2.5">
                  <div className="flex items-center justify-between gap-2 text-[11px] font-semibold tracking-[0.16em] uppercase text-[var(--color-bronze)] tabular-nums">
                    <span>
                      Chapter {ch.paddedCode} · {ch.romanNumeral}
                    </span>
                    <span className="text-[var(--color-muted)]">{ch.verseCount} Verses</span>
                  </div>

                  <p lang="sa" className="text-lg font-medium text-[#8A693A] dark:text-[#F7D774]">
                    {ch.sanskritDevanagari}
                  </p>

                  <h3 className="font-editorial text-xl text-[var(--color-ink)] leading-snug group-hover:text-[#9C6B1E] dark:group-hover:text-[#F7D774] transition-colors">
                    {displayTitle}
                  </h3>

                  <p className="text-xs sm:text-[13px] text-[var(--color-muted)] leading-relaxed line-clamp-3">
                    {displayEssence}
                  </p>
                </div>

                <div className="pt-3 border-t border-[var(--color-border)] flex items-center justify-between text-xs font-medium text-[var(--color-bronze)]">
                  <span>{ov?.featuredVerseRef || rec.verseReference}</span>
                  <span className="inline-flex items-center gap-1 group-hover:translate-x-0.5 transition-transform">
                    <span>Key Teachings</span>
                    <ArrowRight className="w-3.5 h-3.5" aria-hidden="true" />
                  </span>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Chapter Key Teachings & Voice Modal */}
      {activeChapter && activeRecitation && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="chapter-modal-title"
          onClick={() => setModalChapter(null)}
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#0B111C]/85 backdrop-blur-xs overflow-y-auto"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-3xl my-8 rounded-2xl bg-[#17233A] border border-[#D4A537]/50 text-[#FFFDF7] p-6 sm:p-8 space-y-6 shadow-2xl"
          >
            <div className="flex items-start justify-between gap-4 pb-4 border-b border-[#D4A537]/25">
              <div className="space-y-1">
                <p className="text-xs font-semibold tracking-[0.16em] uppercase text-[#F7D774]">
                  Chapter {activeChapter.paddedCode} · {activeChapter.romanNumeral} ·{' '}
                  {activeChapter.verseCount} Shlokas
                </p>
                <p lang="sa" className="text-2xl font-medium text-[#F7D774]">
                  {activeChapter.sanskritDevanagari}
                </p>
                <h3 id="chapter-modal-title" className="font-editorial text-2xl sm:text-3xl text-[#FFFDF7]">
                  {activeChapter.title[contentLocale] || getChapterContent(activeChapter.chapterNumber).title}
                </h3>
              </div>

              <button
                type="button"
                onClick={() => setModalChapter(null)}
                aria-label="Close chapter modal"
                className="p-2 rounded-full border border-[#D4A537]/45 hover:border-[#F7D774] cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3">
              <p className="text-sm sm:text-base leading-relaxed text-[#E9DCC5]">
                {activeChapter.essence[contentLocale] || getChapterContent(activeChapter.chapterNumber).essence}
              </p>

              <div className="rounded-xl bg-[#0E1523]/75 border border-[#D4A537]/30 p-4 space-y-2">
                <p className="text-[11px] font-semibold tracking-[0.14em] uppercase text-[#D4A537]">
                  Canonical Anchor Verse · {activeRecitation.verseReference}
                </p>
                <p lang="sa" className="text-base sm:text-lg text-[#F7D774] whitespace-pre-line">
                  {activeRecitation.sanskritDevanagari}
                </p>
                <p className="text-xs italic text-[#E9DCC5]/75 whitespace-pre-line">
                  {activeRecitation.transliteration}
                </p>
                <p className="font-editorial text-lg text-[#FFFDF7] pt-1">
                  “{activeRecitation.meaning[contentLocale]}”
                </p>
              </div>
            </div>

            <IndianVoiceAssistant
              trackId={`modal-ch-${activeChapter.chapterNumber}`}
              title={`${activeRecitation.verseReference}`}
              defaultLanguage={contentLocale}
              tone="dark"
              textsByLang={{
                sa: activeRecitation.sanskritDevanagari,
                te: `${activeChapter.title.te}. ${activeRecitation.meaning.te}`,
                hi: `${activeChapter.title.hi}. ${activeRecitation.meaning.hi}`,
                en: `${activeChapter.title.en}. ${activeRecitation.meaning.en}`,
              }}
            />

            <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-[#D4A537]/25">
              <Link
                to="/gita"
                onClick={() => setModalChapter(null)}
                className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.08em] text-[#F7D774] hover:underline"
              >
                <BookOpen className="w-4 h-4" />
                <span>Read in 3D Collector Book</span>
              </Link>

              <button
                type="button"
                onClick={() => setModalChapter(null)}
                className="min-h-[40px] px-6 py-2 rounded-full royal-gold-surface text-xs font-semibold uppercase tracking-[0.06em] cursor-pointer"
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}
    </section>
  );
};
