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

const CAMERA_PRESET_LABELS: Record<BookCameraPreset, string> = {
  desk: 'Altar',
  reading: 'Read',
  close: 'Close-up',
  spine: 'Spine',
};

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
      className="relative rounded-2xl border border-[#D4A537]/45 bg-[#11192A] text-[#FFFDF7] overflow-clip shadow-[0_24px_64px_rgba(8,12,20,0.55),0_0_0_1px_rgba(247,215,116,0.08),0_0_60px_-20px_rgba(212,165,55,0.45)]"
    >
      {/* Gold-leaf top edge */}
      <div className="absolute inset-x-0 top-0 h-[2px] gold-leaf-line" aria-hidden="true" />

      {/* Top Toolbar */}
      <div className="flex flex-wrap items-center justify-between gap-3 px-5 py-3.5 bg-gradient-to-r from-[#1B2944] via-[#17233A] to-[#1B2944] border-b border-[#D4A537]/30">
        <div className="flex items-center gap-3">
          <span className="grid place-items-center w-9 h-9 rounded-full royal-gold-surface shrink-0">
            <BookOpen className="w-4 h-4" aria-hidden="true" />
          </span>
          <div>
            <p className="text-[10px] font-semibold tracking-[0.2em] uppercase text-[#D4A537]">
              Interactive 3D Sacred Collector Edition
            </p>
            <h3 className="font-editorial text-lg sm:text-xl leading-tight">
              <span className="royal-gold-gradient-text">Chapter {chapterRecord.paddedCode}</span>
              <span className="text-[#FFFDF7]"> · {chapterRecord.transliteration}</span>
            </h3>
          </div>
        </div>

        {/* Controls: Open/Close, Camera Presets, Bookmark, Font Scale, Reading Progress */}
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            data-testid="book3d-toggle-open"
            onClick={() => setBookOpen((o) => !o)}
            className="inline-flex items-center gap-1.5 min-h-[34px] px-3 rounded-full border border-[#D4A537]/45 text-xs font-medium text-[#F7D774] hover:bg-[#D4A537]/20 cursor-pointer"
          >
            {bookOpen ? <Lock className="w-3.5 h-3.5" /> : <Unlock className="w-3.5 h-3.5" />}
            <span>{bookOpen ? 'Close Cover' : 'Open Cover'}</span>
          </button>

          <div className="hidden sm:inline-flex items-center rounded-full border border-[#D4A537]/35 p-0.5 bg-black/20">
            {(['desk', 'reading', 'close', 'spine'] as const).map((preset) => (
              <button
                key={preset}
                type="button"
                onClick={() => handlePreset(preset)}
                aria-pressed={cameraPreset === preset}
                className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] uppercase tracking-[0.06em] cursor-pointer transition-colors ${
                  cameraPreset === preset
                    ? 'royal-gold-surface font-semibold'
                    : 'text-[#FFFDF7]/75 hover:text-[#F7D774]'
                }`}
              >
                <Camera className="w-3 h-3" aria-hidden="true" />
                <span>{CAMERA_PRESET_LABELS[preset]}</span>
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
                ? 'royal-gold-surface border-[#F7D774]'
                : 'border-[#D4A537]/40 text-[#FFFDF7]/85 hover:border-[#F7D774]'
            }`}
          >
            <Bookmark className={`w-3.5 h-3.5 ${isBookmarked ? 'fill-current' : ''}`} aria-hidden="true" />
            <span>{isBookmarked ? 'Bookmarked' : 'Bookmark'}</span>
          </button>

          <div
            className="flex items-center gap-2 px-2.5 py-1 rounded-full border border-[#D4A537]/30"
            role="progressbar"
            aria-label="Reading progress"
            aria-valuemin={0}
            aria-valuemax={100}
            aria-valuenow={progressPct}
          >
            <span className="block w-16 sm:w-20 h-1.5 rounded-full bg-black/40 overflow-hidden">
              <span
                className="block h-full rounded-full transition-[width] duration-500 shadow-[0_0_8px_rgba(247,215,116,0.6)]"
                style={{ width: `${progressPct}%`, backgroundImage: 'var(--gold-gradient-metallic)' }}
              />
            </span>
            <span className="text-[11px] text-[#F7D774] tabular-nums">{progressPct}%</span>
          </div>
        </div>
      </div>

      {/* Main Split Stage: Left Interactive Three.js 3D Volume | Right Synced Folio Reader + Voice */}
      <div className="grid grid-cols-1 lg:grid-cols-12">
        {/* 3D WebGL Viewport */}
        <div className="lg:col-span-6 relative h-[380px] sm:h-[460px] lg:h-[min(600px,calc(100vh-7rem))] lg:min-h-[480px] lg:sticky lg:top-24 lg:self-start bg-[radial-gradient(ellipse_at_50%_38%,#2A3A5C_0%,#17233A_38%,#0B111C_100%)] border-b lg:border-b-0 lg:border-r border-[#D4A537]/25">
          {/* Warm sanctum glow behind the volume */}
          <div
            aria-hidden="true"
            className="pointer-events-none absolute left-1/2 top-[42%] -translate-x-1/2 -translate-y-1/2 w-[70%] aspect-square rounded-full bg-[radial-gradient(circle,rgba(247,215,116,0.22)_0%,rgba(212,165,55,0.08)_40%,transparent_70%)] blur-2xl"
          />
          {!webglFallback ? (
            <div ref={canvasHostRef} className="relative overflow-hidden w-full h-full" />
          ) : (
            <div className="p-8 h-full flex flex-col items-center justify-center text-center space-y-4">
              <div className="relative w-48 h-64 rounded-lg border-2 border-[#D4A537] bg-gradient-to-br from-[#6A1624] via-[#4A0E19] to-[#2C0710] p-5 flex flex-col items-center justify-between shadow-[0_20px_50px_rgba(0,0,0,0.5),0_0_40px_-10px_rgba(212,165,55,0.5)] outline outline-1 outline-offset-[-10px] outline-[#D4A537]/50">
                <span className="text-[10px] tracking-[0.2em] uppercase text-[#D4A537]">
                  Adhyaya {chapterRecord.paddedCode}
                </span>
                <p lang="sa" className="text-2xl text-[#F7D774] font-semibold">
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
              className="pointer-events-auto inline-flex items-center gap-1.5 min-h-[38px] px-4 py-1.5 rounded-full bg-[#17233A]/85 backdrop-blur-sm border border-[#D4A537]/55 text-xs font-medium text-[#FFFDF7] hover:border-[#F7D774] hover:text-[#F7D774] transition-colors cursor-pointer"
            >
              <ChevronLeft className="w-4 h-4 text-[#F7D774]" aria-hidden="true" />
              <span>Prev Folio</span>
            </button>

            <span className="hidden sm:inline-block px-3 py-1 rounded-full bg-[#17233A]/75 backdrop-blur-sm border border-[#D4A537]/30 text-[11px] text-[#E9DCC5]/85">
              Drag to orbit 360° · Scroll to zoom
            </span>

            <button
              type="button"
              data-testid="book3d-next-page"
              onClick={() => navigateChapter(chapterNum >= 18 ? 1 : chapterNum + 1, 'next')}
              className="pointer-events-auto inline-flex items-center gap-1.5 min-h-[38px] px-4 py-1.5 rounded-full royal-gold-surface text-xs font-semibold cursor-pointer"
            >
              <span>Turn Page</span>
              <ChevronRight className="w-4 h-4" aria-hidden="true" />
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
                      ? 'bg-[#17233A] text-[#F7D774] border-[#17233A] dark:bg-[#D4A537] dark:text-[#171717]'
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
                className="p-1.5 rounded border border-[var(--color-border)] hover:border-[#D4A537] cursor-pointer"
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
                className="p-1.5 rounded border border-[var(--color-border)] hover:border-[#D4A537] cursor-pointer"
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
                  aria-current={active ? 'true' : undefined}
                  className={`relative min-w-[34px] h-8 px-2 rounded-md text-xs font-medium tabular-nums border transition-colors cursor-pointer ${
                    active
                      ? 'royal-gold-surface border-[#9C6B1E] font-semibold scale-105'
                      : 'border-[var(--color-border)] text-[var(--color-muted)] hover:border-[#D4A537] hover:text-[var(--color-ink)]'
                  }`}
                >
                  {ch.paddedCode}
                  {marked && (
                    <span
                      aria-hidden="true"
                      className="absolute -top-1 -right-1 w-2 h-2 rounded-full bg-[#D9561C] ring-2 ring-[var(--surface-elevated)]"
                    />
                  )}
                </button>
              );
            })}
          </div>

          {/* Synchronized Shloka & Chapter Essence */}
          <div
            className="relative space-y-3 rounded-xl bg-[linear-gradient(160deg,#FBF4E4_0%,#F3E6CB_100%)] dark:bg-[linear-gradient(160deg,#1B2944_0%,#131D30_100%)] border border-[#D4A537]/45 p-4 sm:p-6 shadow-[inset_0_1px_0_rgba(255,255,255,0.6),0_8px_24px_-12px_rgba(156,107,30,0.35)] dark:shadow-[inset_0_1px_0_rgba(247,215,116,0.12),0_8px_24px_-12px_rgba(0,0,0,0.6)]"
            style={{ fontSize: `${fontScale}rem` }}
          >
            {/* Inner gold-leaf frame */}
            <div aria-hidden="true" className="pointer-events-none absolute inset-1.5 rounded-lg border border-[#D4A537]/25" />

            <div className="flex items-center justify-between gap-2 text-[11px] font-semibold tracking-[0.14em] uppercase text-[#9C6B1E] dark:text-[#F7D774]">
              <span>✦ {recitation.verseReference}</span>
              <span className="px-2 py-0.5 rounded-full border border-[#D4A537]/40">{chapterRecord.verseCount} Shlokas</span>
            </div>

            <p lang="sa" className="text-[1.2em] font-semibold text-[#6A1624] dark:text-[#F7D774] whitespace-pre-line leading-relaxed text-center py-1">
              {recitation.sanskritDevanagari}
            </p>
            <p className="text-[0.82em] italic text-[var(--color-muted)] whitespace-pre-line text-center">
              {recitation.transliteration}
            </p>

            <div aria-hidden="true" className="h-px w-2/3 mx-auto gold-leaf-line" />

            <p className="font-editorial text-[1.12em] leading-relaxed text-[var(--color-ink)]">
              “{bookLang === 'hi' ? recitation.meaning.hi : bookLang === 'te' ? recitation.meaning.te : recitation.meaning.en}”
            </p>

            <div className="pt-2 border-t border-[#D4A537]/20 text-[0.84em] text-[var(--color-muted)] leading-relaxed">
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
