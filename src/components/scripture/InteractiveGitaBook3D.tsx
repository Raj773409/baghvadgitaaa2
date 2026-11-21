import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  Bookmark,
  BookOpen,
  Camera,
  ChevronLeft,
  ChevronRight,
  Lock,
  Unlock,
  ZoomIn,
  ZoomOut,
} from 'lucide-react';
import { CANONICAL_GITA_VERSES, GITA_CHAPTER_CATALOG } from '../../content/scriptureContent';
import { getChapterRecitation } from '../../content/chapterRecitations';
import { useI18n } from '../../i18n';
import {
  clampBookFontScale,
  clampChapterNumber,
  computeReadingProgressPercent,
  loadBookmarks,
  saveBookmarks,
  toggleChapterBookmark,
  type BookCameraPreset,
} from '../../utils/book3dPhysics';
import { SacredGitaBookEngine, type SacredBookTexts } from '../../three/book/SacredGitaBook3D';
import { detectWebGLCapability } from '../../three/webglSupport';
import { IndianVoiceAssistant } from '../audio/IndianVoiceAssistant';

interface InteractiveGitaBook3DProps {
  initialChapter?: number;
  compactHomepageMode?: boolean;
  paused?: boolean;
}

type BookLang = 'en' | 'hi' | 'te';

export const InteractiveGitaBook3D: React.FC<InteractiveGitaBook3DProps> = ({
  initialChapter = 1,
  compactHomepageMode = false,
  paused = false,
}) => {
  const { contentLocale, getChapterContent } = useI18n();
  const canvasHostRef = useRef<HTMLDivElement | null>(null);
  const engineRef = useRef<SacredGitaBookEngine | null>(null);

  const [chapterNum, setChapterNum] = useState<number>(() => clampChapterNumber(initialChapter));
  const [bookOpen, setBookOpen] = useState<boolean>(true);
  const [bookLang, setBookLang] = useState<BookLang>(contentLocale);
  const [fontScale, setFontScale] = useState<number>(1);
  const [cameraPreset, setCameraPreset] = useState<BookCameraPreset>('desk');
  const [bookmarks, setBookmarks] = useState<number[]>(() =>
    typeof window !== 'undefined' ? loadBookmarks(window.localStorage) : [],
  );
  const [webglFallback, setWebglFallback] = useState<boolean>(false);

  const chapterRecord =
    GITA_CHAPTER_CATALOG[chapterNum - 1] ?? GITA_CHAPTER_CATALOG[0];
  const recitation = useMemo(() => getChapterRecitation(chapterNum), [chapterNum]);
  const translated = getChapterContent(chapterNum);

  const featuredCanonical = useMemo(
    () => CANONICAL_GITA_VERSES.find((v) => v.chapter === chapterNum) ?? null,
    [chapterNum],
  );

  const spreadTexts: SacredBookTexts = useMemo(() => {
    const trans =
      bookLang === 'hi'
        ? recitation.meaning.hi
        : bookLang === 'te'
          ? recitation.meaning.te
          : recitation.meaning.en;
    return {
      chapterCode: chapterRecord.paddedCode,
      sanskritTitle: chapterRecord.sanskritDevanagari,
      englishTitle: chapterRecord.transliteration,
      shlokaSanskrit: recitation.sanskritDevanagari,
      translation: trans,
      reference: recitation.verseReference,
    };
  }, [bookLang, chapterRecord, recitation]);

  // Mount Three.js Sacred Book engine safely with cached WebGL capability & cleanup
  useEffect(() => {
    const host = canvasHostRef.current;
    if (!host) return;

    const { supported } = detectWebGLCapability();
    if (!supported) {
      setWebglFallback(true);
      return;
    }

    let engine: SacredGitaBookEngine | null = null;
    try {
      engine = new SacredGitaBookEngine(host, spreadTexts, {
        onWebglContextLost: () => setWebglFallback(true),
      });
      engine.setPaused(paused);
      engineRef.current = engine;
    } catch {
      setWebglFallback(true);
    }

    return () => {
      engine?.dispose();
      engineRef.current = null;
    };
    // Intentionally initialize WebGL once on mount; spread text updates propagate below
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    engineRef.current?.setPaused(paused);
  }, [paused]);

  useEffect(() => {
    engineRef.current?.updateTexts(spreadTexts);
  }, [spreadTexts]);

  useEffect(() => {
    engineRef.current?.setBookOpen(bookOpen);
  }, [bookOpen]);

  const navigateChapter = (target: number, direction: 'next' | 'prev') => {
    const next = clampChapterNumber(target);
    if (next === chapterNum) return;
    setChapterNum(next);
    setBookOpen(true);

    const nextRec = getChapterRecitation(next);
    const nextCat = GITA_CHAPTER_CATALOG[next - 1] ?? GITA_CHAPTER_CATALOG[0];
    const nextTrans =
      bookLang === 'hi'
        ? nextRec.meaning.hi
        : bookLang === 'te'
          ? nextRec.meaning.te
          : nextRec.meaning.en;

    engineRef.current?.triggerPageTurn(direction, {
      chapterCode: nextCat.paddedCode,
      sanskritTitle: nextCat.sanskritDevanagari,
      englishTitle: nextCat.transliteration,
      shlokaSanskrit: nextRec.sanskritDevanagari,
      translation: nextTrans,
      reference: nextRec.verseReference,
    });
  };

  const handleToggleBookmark = () => {
    const next = toggleChapterBookmark(bookmarks, chapterNum);
    setBookmarks(next);
    if (typeof window !== 'undefined') {
      saveBookmarks(window.localStorage, next);
    }
  };

  const handlePreset = (preset: BookCameraPreset) => {
    setCameraPreset(preset);
    engineRef.current?.setCameraPreset(preset);
  };

  const progressPct = computeReadingProgressPercent(chapterNum);
  const isBookmarked = bookmarks.includes(chapterNum);

  return (
    <div
      data-testid="interactive-gita-book-3d"
      className="rounded-2xl border border-[#C9A04E]/40 bg-[#11192A] text-[#FFFDF7] overflow-hidden shadow-[0_24px_64px_rgba(8,12,20,0.55)]"
    >
      {/* Top Toolbar */}
      <div className="flex flex-wrap items-center justify-between gap-3 px-5 py-3.5 bg-[#17233A]/95 border-b border-[#C9A04E]/30">
        <div className="flex items-center gap-3">
          <BookOpen className="w-4 h-4 text-[#F0D38B] shrink-0" aria-hidden="true" />
          <div>
            <p className="text-[10px] font-semibold tracking-[0.2em] uppercase text-[#C9A04E]">
              Interactive 3D Sacred Collector Edition
            </p>
            <h3 className="font-editorial text-lg sm:text-xl text-[#FFFDF7] leading-tight">
              Chapter {chapterRecord.paddedCode} · {chapterRecord.transliteration}
            </h3>
          </div>
        </div>

        {/* Controls: Open/Close, Camera Presets, Bookmark, Font Scale, Reading Progress */}
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            data-testid="book3d-toggle-open"
            onClick={() => setBookOpen((o) => !o)}
            className="inline-flex items-center gap-1.5 min-h-[34px] px-3 rounded-full border border-[#C9A04E]/45 text-xs font-medium text-[#F0D38B] hover:bg-[#C9A04E]/20 cursor-pointer"
          >
            {bookOpen ? <Lock className="w-3.5 h-3.5" /> : <Unlock className="w-3.5 h-3.5" />}
            <span>{bookOpen ? 'Close Cover' : 'Open Cover'}</span>
          </button>

          <div className="hidden sm:inline-flex items-center rounded-full border border-[#C9A04E]/35 p-0.5 bg-black/20">
            {(['desk', 'reading', 'close', 'spine'] as const).map((preset) => (
              <button
                key={preset}
                type="button"
                onClick={() => handlePreset(preset)}
                className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] uppercase tracking-[0.06em] cursor-pointer ${
                  cameraPreset === preset
                    ? 'bg-[#C9A04E] text-[#171717] font-semibold'
                    : 'text-[#FFFDF7]/75 hover:text-[#F0D38B]'
                }`}
              >
                <Camera className="w-3 h-3" aria-hidden="true" />
                <span>{preset}</span>
              </button>
            ))}
          </div>

          <button
            type="button"
            data-testid="book3d-bookmark-btn"
            onClick={handleToggleBookmark}
            aria-pressed={isBookmarked}
            className={`inline-flex items-center gap-1.5 min-h-[34px] px-3 rounded-full border text-xs font-medium cursor-pointer ${
              isBookmarked
                ? 'bg-[#C9A04E] text-[#171717] border-[#F0D38B]'
                : 'border-[#C9A04E]/40 text-[#FFFDF7]/85 hover:border-[#F0D38B]'
            }`}
          >
            <Bookmark className="w-3.5 h-3.5" aria-hidden="true" />
            <span>{isBookmarked ? 'Bookmarked' : 'Bookmark'}</span>
          </button>

          <span className="px-2.5 py-1 rounded-full border border-[#C9A04E]/30 text-[11px] text-[#F0D38B] tabular-nums">
            Progress {progressPct}%
          </span>
        </div>
      </div>

      {/* Main Split Stage: Left Interactive Three.js 3D Volume | Right Synced Folio Reader + Voice */}
      <div className="grid grid-cols-1 lg:grid-cols-12">
        {/* 3D WebGL Viewport */}
        <div className="lg:col-span-6 relative min-h-[360px] sm:min-h-[440px] lg:min-h-[520px] bg-gradient-to-b from-[#17233A] via-[#11192A] to-[#0B111C] border-b lg:border-b-0 lg:border-r border-[#C9A04E]/25">
          {!webglFallback ? (
            <div ref={canvasHostRef} className="relative overflow-hidden w-full h-full min-h-[360px] sm:min-h-[440px] lg:min-h-[520px]" />
          ) : (
            <div className="p-8 h-full flex flex-col items-center justify-center text-center space-y-4">
              <div className="w-48 h-64 rounded-lg border-2 border-[#C9A04E] bg-[#17233A] p-5 flex flex-col items-center justify-between shadow-2xl">
                <span className="text-[10px] tracking-[0.2em] uppercase text-[#C9A04E]">
                  Adhyaya {chapterRecord.paddedCode}
                </span>
                <p lang="sa" className="text-2xl text-[#F0D38B] font-semibold">
                  {chapterRecord.sanskritDevanagari}
                </p>
                <p className="font-editorial text-sm text-[#FFFDF7]/90">
                  {chapterRecord.transliteration}
                </p>
              </div>
              <p className="text-xs text-[#E9DCC5]/75">
                Interactive folio preview active (3D hardware acceleration unavailable in this context).
              </p>
            </div>
          )}

          {/* Bottom Floating Page Turn Bar */}
          <div className="absolute inset-x-4 bottom-4 flex items-center justify-between gap-2 pointer-events-none">
            <button
              type="button"
              data-testid="book3d-prev-page"
              onClick={() => navigateChapter(chapterNum <= 1 ? 18 : chapterNum - 1, 'prev')}
              className="pointer-events-auto inline-flex items-center gap-1.5 min-h-[38px] px-4 py-1.5 rounded-full bg-[#17233A]/90 border border-[#C9A04E]/55 text-xs font-medium text-[#FFFDF7] hover:border-[#F0D38B] cursor-pointer"
            >
              <ChevronLeft className="w-4 h-4 text-[#F0D38B]" aria-hidden="true" />
              <span>Prev Folio</span>
            </button>

            <span className="hidden sm:inline-block px-3 py-1 rounded-full bg-[#17233A]/85 border border-[#C9A04E]/30 text-[11px] text-[#E9DCC5]/85">
              Drag to orbit 360° · Scroll to zoom
            </span>

            <button
              type="button"
              data-testid="book3d-next-page"
              onClick={() => navigateChapter(chapterNum >= 18 ? 1 : chapterNum + 1, 'next')}
              className="pointer-events-auto inline-flex items-center gap-1.5 min-h-[38px] px-4 py-1.5 rounded-full bg-[#17233A]/90 border border-[#C9A04E]/55 text-xs font-medium text-[#FFFDF7] hover:border-[#F0D38B] cursor-pointer"
            >
              <span>Turn Page</span>
              <ChevronRight className="w-4 h-4 text-[#F0D38B]" aria-hidden="true" />
            </button>
          </div>
        </div>

        {/* Synchronized Parchment Reading Console */}
        <div className="lg:col-span-6 p-5 sm:p-7 space-y-5 bg-[#FFFDF7] dark:bg-[#141E32] text-[#171717] dark:text-[#FFFDF7]">
          {/* Chapter Quick Stepper + Typography Controls */}
          <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-[var(--color-border)]">
            <div className="flex flex-wrap items-center gap-1.5" role="group" aria-label="Reading language">
              {(['en', 'hi', 'te'] as const).map((lang) => (
                <button
                  key={lang}
                  type="button"
                  onClick={() => setBookLang(lang)}
                  aria-pressed={bookLang === lang}
                  className={`px-2.5 py-1 rounded text-[11px] font-semibold uppercase tracking-[0.06em] border cursor-pointer ${
                    bookLang === lang
                      ? 'bg-[#17233A] text-[#F0D38B] border-[#17233A] dark:bg-[#C9A04E] dark:text-[#171717]'
                      : 'border-[var(--color-border)] text-[var(--color-muted)] hover:text-[var(--color-ink)]'
                  }`}
                >
                  {lang === 'en' ? 'English' : lang === 'hi' ? 'हिन्दी' : 'తెలుగు'}
                </button>
              ))}
            </div>

            <div className="flex items-center gap-1.5">
              <button
                type="button"
                aria-label="Decrease text size"
                onClick={() => setFontScale((s) => clampBookFontScale(s - 0.1))}
                className="p-1.5 rounded border border-[var(--color-border)] hover:border-[#C9A04E] cursor-pointer"
              >
                <ZoomOut className="w-3.5 h-3.5" aria-hidden="true" />
              </button>
              <span className="text-[11px] tabular-nums w-10 text-center text-[var(--color-muted)]">
                {Math.round(fontScale * 100)}%
              </span>
              <button
                type="button"
                aria-label="Increase text size"
                onClick={() => setFontScale((s) => clampBookFontScale(s + 0.1))}
                className="p-1.5 rounded border border-[var(--color-border)] hover:border-[#C9A04E] cursor-pointer"
              >
                <ZoomIn className="w-3.5 h-3.5" aria-hidden="true" />
              </button>
            </div>
          </div>

          {/* Chapter 1–18 Compact Navigation Ribbon */}
          <div className="flex flex-wrap gap-1.5">
            {GITA_CHAPTER_CATALOG.map((ch) => {
              const active = ch.chapterNumber === chapterNum;
              const marked = bookmarks.includes(ch.chapterNumber);
              return (
                <button
                  key={ch.chapterNumber}
                  type="button"
                  data-testid={`book3d-chapter-${ch.chapterNumber}`}
                  onClick={() =>
                    navigateChapter(ch.chapterNumber, ch.chapterNumber >= chapterNum ? 'next' : 'prev')
                  }
                  className={`relative min-w-[34px] h-8 px-2 rounded text-xs font-medium tabular-nums border transition-colors cursor-pointer ${
                    active
                      ? 'bg-[#C9A04E] text-[#171717] border-[#A87932] font-semibold'
                      : 'border-[var(--color-border)] text-[var(--color-muted)] hover:border-[#C9A04E] hover:text-[var(--color-ink)]'
                  }`}
                >
                  {ch.paddedCode}
                  {marked && (
                    <span
                      aria-hidden="true"
                      className="absolute -top-1 -right-1 w-2 h-2 rounded-full bg-[#A87932]"
                    />
                  )}
                </button>
              );
            })}
          </div>

          {/* Synchronized Shloka & Chapter Essence */}
          <div
            className="space-y-3 rounded-xl bg-[#F8F3E8] dark:bg-[#17233A]/85 border border-[#C9A04E]/35 p-4 sm:p-5"
            style={{ fontSize: `${fontScale}rem` }}
          >
            <div className="flex items-center justify-between gap-2 text-[11px] font-semibold tracking-[0.14em] uppercase text-[#A87932] dark:text-[#F0D38B]">
              <span>{recitation.verseReference}</span>
              <span>{chapterRecord.verseCount} Shlokas</span>
            </div>

            <p lang="sa" className="text-[1.15em] font-medium text-[#4A251B] dark:text-[#F0D38B] whitespace-pre-line leading-relaxed">
              {recitation.sanskritDevanagari}
            </p>
            <p className="text-[0.82em] italic text-[var(--color-muted)] whitespace-pre-line">
              {recitation.transliteration}
            </p>

            <p className="font-editorial text-[1.12em] leading-relaxed text-[var(--color-ink)] pt-2 border-t border-[#C9A04E]/25">
              “{bookLang === 'hi' ? recitation.meaning.hi : bookLang === 'te' ? recitation.meaning.te : recitation.meaning.en}”
            </p>

            <div className="pt-2 border-t border-[#C9A04E]/20 text-[0.84em] text-[var(--color-muted)] leading-relaxed">
              <strong className="text-[var(--color-ink)]">Chapter Focus: </strong>
              {translated.essence}
              {featuredCanonical?.commentarySlot && (
                <span className="block mt-1">{featuredCanonical.commentarySlot[bookLang]}</span>
              )}
            </div>
          </div>

          {/* Integrated Indian Voice Assistant */}
          {!compactHomepageMode && (
            <IndianVoiceAssistant
              trackId={`gita-ch-${chapterNum}`}
              title={`${recitation.verseReference} — Chapter ${chapterRecord.paddedCode}`}
              defaultLanguage={bookLang}
              tone="dark"
              textsByLang={{
                sa: recitation.sanskritDevanagari,
                te: `${chapterRecord.title.te}. ${recitation.meaning.te}`,
                hi: `${chapterRecord.title.hi}. ${recitation.meaning.hi}`,
                en: `${chapterRecord.title.en}. ${recitation.meaning.en}`,
              }}
            />
          )}
        </div>
      </div>
    </div>
  );
};
