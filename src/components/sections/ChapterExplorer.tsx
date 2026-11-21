import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  ArrowRight,
  BookOpen,
  ChevronLeft,
  ChevronRight,
  Compass,
  LayoutGrid,
  Loader2,
  Square,
  Volume2,
} from 'lucide-react';
import { AnimatePresence, motion, useReducedMotion } from 'motion/react';
import { Link } from 'react-router-dom';
import { GITA_CHAPTER_CATALOG } from '../../content/scriptureContent';
import { getChapterRecitation } from '../../content/chapterRecitations';
import { usePublicCms } from '../../hooks/usePublicCms';
import {
  buildChapterIndex,
  getChapterMarkerAnimationSpec,
  polarPoint,
  TOTAL_CHAPTERS,
} from '../../utils/chapters';
import { useI18n } from '../../i18n';

const DIAL_CENTER = 250;
const OUTER_RING_RADIUS = 198;
const MID_RING_RADIUS = 152;
const INNER_HALO_RADIUS = 88;
const LOTUS_ANGLES = Array.from({ length: 12 }, (_, idx) => idx * 30);

type ExplorerViewMode = 'dial' | 'grid';
type YogaDivision = 'all' | 'karma' | 'bhakti' | 'jnana';
type ScriptTab = 'all' | 'sa' | 'en' | 'hi' | 'te';

export const ChapterExplorer: React.FC = () => {
  const { locale, contentLocale, currentLocaleMeta, getChapterContent, t } = useI18n();
  const publicCms = usePublicCms();
  const sectionRef = useRef<HTMLElement | null>(null);
  const nodeRefs = useRef<Record<number, HTMLButtonElement | null>>({});
  const reduceMotion = useReducedMotion();

  const dialNodes = useMemo(() => buildChapterIndex(), []);
  const [selectedNumber, setSelectedNumber] = useState<number>(1);
  const [hoveredNumber, setHoveredNumber] = useState<number | null>(null);
  const [viewMode, setViewMode] = useState<ExplorerViewMode>('dial');
  const [division, setDivision] = useState<YogaDivision>('all');
  const [scriptTab, setScriptTab] = useState<ScriptTab>('all');

  const [audioStatus, setAudioStatus] = useState<'idle' | 'loading' | 'playing'>('idle');
  const [audioChapter, setAudioChapter] = useState<number | null>(null);
  const [audioError, setAudioError] = useState<string | null>(null);

  const audioRef = useRef<HTMLAudioElement | null>(null);
  const audioAbortRef = useRef<AbortController | null>(null);
  const audioUrlCacheRef = useRef<Map<number, string>>(new Map());

  const mergedCatalog = useMemo(() => {
    const ovMap = new Map(
      (publicCms?.scriptureChapters ?? [])
        .filter((c) => c.status === 'published')
        .map((c) => [c.chapterNumber, c]),
    );
    return GITA_CHAPTER_CATALOG.map((ch) => {
      const ov = ovMap.get(ch.chapterNumber);
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
      };
    });
  }, [publicCms?.scriptureChapters]);

  const activeNumber = hoveredNumber ?? selectedNumber;
  const selectedNode = dialNodes[selectedNumber - 1] ?? dialNodes[0];
  const selectedCatalog =
    mergedCatalog[selectedNumber - 1] ?? mergedCatalog[0];

  const activeNode = dialNodes[activeNumber - 1] ?? dialNodes[0];
  const activeCatalog =
    mergedCatalog[activeNumber - 1] ?? mergedCatalog[0];
  const baseTranslated = getChapterContent(selectedCatalog.chapterNumber);
  const selectedTranslated = {
    title: selectedCatalog.title[contentLocale] || baseTranslated.title,
    essence: selectedCatalog.essence[contentLocale] || baseTranslated.essence,
  };

  const keyRecitation = useMemo(
    () => getChapterRecitation(selectedCatalog.chapterNumber),
    [selectedCatalog.chapterNumber],
  );

  const filteredChapters = useMemo(() => {
    return mergedCatalog.filter((ch) => {
      if (division === 'karma') return ch.chapterNumber <= 6;
      if (division === 'bhakti') return ch.chapterNumber >= 7 && ch.chapterNumber <= 12;
      if (division === 'jnana') return ch.chapterNumber >= 13;
      return true;
    });
  }, [division, mergedCatalog]);

  // Web Animations API sequential entry for the 18 chapter markers respecting prefers-reduced-motion
  useEffect(() => {
    const sectionEl = sectionRef.current;
    if (!sectionEl) return;

    const bgEl = sectionEl.querySelector<HTMLElement>('[data-chapter-bg]');
    const dialEl = sectionEl.querySelector<HTMLElement>('[data-chapter-dial]');
    const infoEls = Array.from(
      sectionEl.querySelectorAll<HTMLElement>('[data-chapter-info]'),
    );
    const nodeEls = Array.from(
      sectionEl.querySelectorAll<HTMLElement>('[data-chapter-node]'),
    );
    const animatedEls = [
      ...(bgEl ? [bgEl] : []),
      ...(dialEl ? [dialEl] : []),
      ...infoEls,
      ...nodeEls,
    ];

    const mediaQuery =
      typeof window !== 'undefined' && typeof window.matchMedia === 'function'
        ? window.matchMedia('(prefers-reduced-motion: reduce)')
        : null;

    let activeAnimations: Animation[] = [];
    let hasPlayed = false;

    const cancelActiveAnimations = () => {
      for (const anim of activeAnimations) {
        try {
          anim.cancel();
        } catch {
          // Ignore already-cancelled animations
        }
      }
      activeAnimations = [];
    };

    const showImmediately = (motionAttr: string) => {
      cancelActiveAnimations();
      for (const el of animatedEls) {
        el.style.opacity = '';
      }
      sectionEl.dataset.chapterAnimation = motionAttr;
    };

    const runEntrySequence = () => {
      if (hasPlayed) return;
      hasPlayed = true;

      if (mediaQuery?.matches || typeof sectionEl.animate !== 'function') {
        showImmediately('reduced');
        return;
      }

      sectionEl.dataset.chapterAnimation = 'running';
      const created: Animation[] = [];
      let pendingFinishCount = 0;

      const trackAnimation = (el: HTMLElement, anim: Animation) => {
        created.push(anim);
        pendingFinishCount += 1;
        anim.onfinish = () => {
          el.style.opacity = '';
          try {
            anim.cancel();
          } catch {
            // Ignore cleanup errors
          }
          pendingFinishCount -= 1;
          if (pendingFinishCount <= 0) {
            sectionEl.dataset.chapterAnimation = 'complete';
          }
        };
      };

      if (bgEl) {
        trackAnimation(
          bgEl,
          bgEl.animate([{ opacity: 0.35 }, { opacity: 1 }], {
            duration: 460,
            easing: 'cubic-bezier(0.22, 1, 0.36, 1)',
            fill: 'both',
          }),
        );
      }

      if (dialEl) {
        trackAnimation(
          dialEl,
          dialEl.animate(
            [
              { opacity: 0, transform: 'scale(0.94)' },
              { opacity: 1, transform: 'scale(1)' },
            ],
            {
              duration: 500,
              delay: 40,
              easing: 'cubic-bezier(0.16, 1, 0.3, 1)',
              fill: 'both',
            },
          ),
        );
      }

      infoEls.forEach((infoEl, idx) => {
        trackAnimation(
          infoEl,
          infoEl.animate(
            [
              { opacity: 0, transform: 'translateY(14px)' },
              { opacity: 1, transform: 'translateY(0px)' },
            ],
            {
              duration: 440,
              delay: 100 + idx * 70,
              easing: 'cubic-bezier(0.16, 1, 0.3, 1)',
              fill: 'both',
            },
          ),
        );
      });

      nodeEls.forEach((nodeEl, idx) => {
        const spec = getChapterMarkerAnimationSpec(idx, false);
        if (!spec.shouldAnimate) {
          nodeEl.style.opacity = '';
          return;
        }
        trackAnimation(
          nodeEl,
          nodeEl.animate(
            [
              { opacity: spec.fromOpacity, transform: `scale(${spec.fromScale})` },
              { opacity: spec.toOpacity, transform: `scale(${spec.toScale})` },
            ],
            {
              duration: spec.durationMs,
              delay: spec.delayMs,
              easing: spec.easing,
              fill: 'both',
            },
          ),
        );
      });

      activeAnimations = created;
      if (created.length === 0) {
        sectionEl.dataset.chapterAnimation = 'complete';
      }
    };

    if (mediaQuery?.matches || typeof sectionEl.animate !== 'function') {
      hasPlayed = true;
      showImmediately('reduced');
    } else {
      const rect = sectionEl.getBoundingClientRect();
      if (rect.top < window.innerHeight * 0.94 && rect.bottom > 0) {
        runEntrySequence();
      } else {
        sectionEl.dataset.chapterAnimation = 'pending';
        for (const el of [...(dialEl ? [dialEl] : []), ...infoEls, ...nodeEls]) {
          el.style.opacity = '0';
        }
      }
    }

    let observer: IntersectionObserver | null = null;
    if (!hasPlayed && typeof IntersectionObserver !== 'undefined') {
      observer = new IntersectionObserver(
        (entries) => {
          if (entries.some((entry) => entry.isIntersecting)) {
            observer?.disconnect();
            runEntrySequence();
          }
        },
        { threshold: 0.12, rootMargin: '0px 0px -4% 0px' },
      );
      observer.observe(sectionEl);
    } else if (!hasPlayed) {
      runEntrySequence();
    }

    const handleReducedMotionChange = (event: MediaQueryListEvent) => {
      if (event.matches) {
        observer?.disconnect();
        hasPlayed = true;
        showImmediately('reduced');
      }
    };

    mediaQuery?.addEventListener?.('change', handleReducedMotionChange);

    return () => {
      observer?.disconnect();
      mediaQuery?.removeEventListener?.('change', handleReducedMotionChange);
      showImmediately(mediaQuery?.matches ? 'reduced' : 'complete');
    };
  }, []);

  const stopAudioPlayback = () => {
    audioAbortRef.current?.abort();
    audioAbortRef.current = null;
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
      audioRef.current.onended = null;
      audioRef.current.onerror = null;
      audioRef.current = null;
    }
    setAudioStatus('idle');
    setAudioChapter(null);
  };

  useEffect(() => {
    stopAudioPlayback();
    setAudioError(null);
  }, [selectedNumber]);

  useEffect(() => {
    const cache = audioUrlCacheRef.current;
    return () => {
      stopAudioPlayback();
      for (const objectUrl of cache.values()) {
        URL.revokeObjectURL(objectUrl);
      }
      cache.clear();
    };
  }, []);

  const handleToggleRecitation = async (chapterNumber: number) => {
    if (audioChapter === chapterNumber && audioStatus !== 'idle') {
      stopAudioPlayback();
      return;
    }

    stopAudioPlayback();
    setAudioError(null);
    setAudioChapter(chapterNumber);
    setAudioStatus('loading');

    const playAudioUrl = async (objectUrl: string) => {
      const audio = new Audio(objectUrl);
      audioRef.current = audio;
      audio.onended = () => {
        setAudioStatus('idle');
        setAudioChapter(null);
        audioRef.current = null;
      };
      audio.onerror = () => {
        setAudioStatus('idle');
        setAudioChapter(null);
        audioRef.current = null;
        setAudioError('Unable to play Sanskrit recitation audio.');
      };
      await audio.play();
      setAudioStatus('playing');
    };

    try {
      const cachedUrl = audioUrlCacheRef.current.get(chapterNumber);
      if (cachedUrl) {
        await playAudioUrl(cachedUrl);
        return;
      }

      const controller = new AbortController();
      audioAbortRef.current = controller;

      const response = await fetch(`/api/chapters/${chapterNumber}/recitation`, {
        signal: controller.signal,
      });

      if (!response.ok) {
        let errMessage = 'Unable to load Sanskrit recitation audio.';
        try {
          const errPayload = (await response.json()) as { error?: string };
          if (errPayload.error) {
            errMessage = errPayload.error;
          }
        } catch {
          // Use default error text
        }
        throw new Error(errMessage);
      }

      const blob = await response.blob();
      if (controller.signal.aborted) return;

      const objectUrl = URL.createObjectURL(blob);
      audioUrlCacheRef.current.set(chapterNumber, objectUrl);
      await playAudioUrl(objectUrl);
    } catch (err) {
      if (err instanceof DOMException && err.name === 'AbortError') {
        return;
      }
      setAudioStatus('idle');
      setAudioChapter(null);
      setAudioError(
        err instanceof Error ? err.message : 'Unable to play Sanskrit recitation audio.',
      );
    }
  };

  const handleSelectChapter = (chapterNumber: number) => {
    setSelectedNumber(chapterNumber);
  };

  const handleSelectDivision = (nextDivision: YogaDivision) => {
    setDivision(nextDivision);
    if (nextDivision === 'karma' && selectedNumber > 6) setSelectedNumber(1);
    if (nextDivision === 'bhakti' && (selectedNumber < 7 || selectedNumber > 12)) {
      setSelectedNumber(7);
    }
    if (nextDivision === 'jnana' && selectedNumber < 13) setSelectedNumber(13);
  };

  const handlePrev = () => {
    setSelectedNumber((prev) => (prev <= 1 ? TOTAL_CHAPTERS : prev - 1));
  };

  const handleNext = () => {
    setSelectedNumber((prev) => (prev >= TOTAL_CHAPTERS ? 1 : prev + 1));
  };

  const handleNodeKeyDown = (
    event: React.KeyboardEvent<HTMLButtonElement>,
    chapterNumber: number,
  ) => {
    let nextNumber: number | null = null;
    if (event.key === 'ArrowRight' || event.key === 'ArrowDown') {
      nextNumber = chapterNumber >= TOTAL_CHAPTERS ? 1 : chapterNumber + 1;
    } else if (event.key === 'ArrowLeft' || event.key === 'ArrowUp') {
      nextNumber = chapterNumber <= 1 ? TOTAL_CHAPTERS : chapterNumber - 1;
    } else if (event.key === 'Home') {
      nextNumber = 1;
    } else if (event.key === 'End') {
      nextNumber = TOTAL_CHAPTERS;
    }

    if (nextNumber !== null) {
      event.preventDefault();
      setSelectedNumber(nextNumber);
      setHoveredNumber(nextNumber);
      nodeRefs.current[nextNumber]?.focus();
    }
  };

  const isCurrentChapterLoading =
    audioStatus === 'loading' && audioChapter === selectedCatalog.chapterNumber;
  const isCurrentChapterPlaying =
    audioStatus === 'playing' && audioChapter === selectedCatalog.chapterNumber;

  const pointerRotationDeg = activeNode.angleDeg + 90;

  const divisionTabs: Array<{ id: YogaDivision; label: string }> = [
    { id: 'all', label: t('chapters.divisionAll') },
    { id: 'karma', label: t('chapters.divisionKarma') },
    { id: 'bhakti', label: t('chapters.divisionBhakti') },
    { id: 'jnana', label: t('chapters.divisionJnana') },
  ];

  const scriptTabs: Array<{ id: ScriptTab; label: string }> = [
    { id: 'all', label: t('chapters.multilingualTabAll') },
    { id: 'sa', label: t('chapters.multilingualTabSa') },
    { id: 'en', label: t('chapters.multilingualTabEn') },
    { id: 'hi', label: t('chapters.multilingualTabHi') },
    { id: 'te', label: t('chapters.multilingualTabTe') },
  ];

  return (
    <section
      id="chapters"
      ref={sectionRef}
      aria-labelledby="chapters-heading"
      className="relative scroll-mt-[70px] sm:scroll-mt-[76px] overflow-hidden bg-[#101426] text-[#FFF6E8] border-t border-[#F3CD82]/20 border-b border-[#F3CD82]/20"
    >
      {/* Celestial Indigo Radial Sanctuary Backdrop */}
      <div
        data-chapter-bg
        aria-hidden="true"
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            'radial-gradient(circle at 28% 54%, rgba(32, 43, 72, 0.92) 0%, rgba(16, 20, 38, 0.98) 56%, #0D1120 100%)',
        }}
      />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -top-24 left-[12%] w-[460px] h-[460px] rounded-full opacity-25 blur-3xl"
        style={{
          background:
            'radial-gradient(circle, rgba(243, 205, 130, 0.25) 0%, rgba(243, 205, 130, 0.02) 60%, transparent 78%)',
        }}
      />

      <div className="relative z-10 max-w-[1340px] mx-auto px-5 sm:px-8 lg:px-12 lg:pr-16 xl:pr-20 py-10 sm:py-12 xl:py-14 space-y-7">
        {/* Top Section Header Row */}
        <div
          data-chapter-info
          className="flex flex-col lg:flex-row lg:items-end justify-between gap-4 pb-5 border-b border-[#F3CD82]/20"
        >
          <div className="space-y-3 max-w-3xl">
            <div className="flex items-center gap-4">
              <span className="text-[11px] font-medium tracking-[0.22em] uppercase text-[#F3CD82]">
                {t('chapters.eyebrow')}
              </span>
              <span
                aria-hidden="true"
                className="h-px flex-1 max-w-[96px] bg-gradient-to-r from-[#F3CD82]/55 to-transparent"
              />
            </div>

            <h2
              id="chapters-heading"
              className="font-editorial font-normal text-[clamp(1.85rem,3.2vw,2.85rem)] leading-[1.08] tracking-[-0.02em] text-[#FFF6E8] text-balance"
            >
              {t('chapters.headlineBanner')}
            </h2>

            <p className="text-sm sm:text-[15px] leading-[1.65] text-[#F5F0E7]/78 max-w-2xl">
              {t('chapters.supportingText')}
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-5 self-start lg:self-auto">
            {/* Dial vs Grid Mode Switch */}
            <div
              role="group"
              aria-label={t('chapters.gridDirectoryTitle')}
              className="inline-flex items-center border border-[#F3CD82]/30 bg-[#0D1120]/65 rounded-md p-0.5"
            >
              <button
                type="button"
                data-testid="chapter-view-dial-btn"
                aria-pressed={viewMode === 'dial'}
                onClick={() => setViewMode('dial')}
                className={`inline-flex items-center gap-1.5 min-h-[36px] px-3 py-1.5 text-[11px] font-medium tracking-[0.08em] uppercase rounded transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                  viewMode === 'dial'
                    ? 'bg-[#F3CD82] text-[#101426]'
                    : 'text-[#FFF6E8]/80 hover:text-[#F3CD82]'
                }`}
              >
                <Compass className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
                <span>{t('chapters.viewDial')}</span>
              </button>
              <button
                type="button"
                data-testid="chapter-view-grid-btn"
                aria-pressed={viewMode === 'grid'}
                onClick={() => setViewMode('grid')}
                className={`inline-flex items-center gap-1.5 min-h-[36px] px-3 py-1.5 text-[11px] font-medium tracking-[0.08em] uppercase rounded transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                  viewMode === 'grid'
                    ? 'bg-[#F3CD82] text-[#101426]'
                    : 'text-[#FFF6E8]/80 hover:text-[#F3CD82]'
                }`}
              >
                <LayoutGrid className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
                <span>{t('chapters.viewGrid')}</span>
              </button>
            </div>

            <Link
              to="/gita"
              className="group inline-flex items-center gap-2.5 pb-1 border-b border-[#F3CD82]/45 hover:border-[#F3CD82] text-xs font-medium tracking-[0.12em] uppercase text-[#F3CD82] hover:text-[#FFF6E8] whitespace-nowrap transition-colors shrink-0"
            >
              <BookOpen className="w-4 h-4 shrink-0" aria-hidden="true" />
              <span>{t('chapters.allChaptersLink')}</span>
              <ArrowRight
                className="w-3.5 h-3.5 transition-transform group-hover:translate-x-0.5"
                aria-hidden="true"
              />
            </Link>
          </div>
        </div>

        {/* Two-Column Interactive 18-Chapter Explorer Stage */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-10 items-start">
          {/* Left 6 Columns: Circular Sacred Gold Mandala Dial OR Yoga-Tabbed Grid */}
          <div className="lg:col-span-6 space-y-5">
            {viewMode === 'dial' ? (
              <div className="flex flex-col items-center">
                <div
                  data-chapter-dial
                  className="relative w-full max-w-[330px] sm:max-w-[400px] lg:max-w-[410px] xl:max-w-[435px] aspect-square mx-auto select-none"
                  role="group"
                  aria-label={t('chapters.headlineBanner')}
                >
                  <svg
                    viewBox="0 0 500 500"
                    className="w-full h-full overflow-visible"
                    aria-hidden="true"
                  >
                    <defs>
                      <radialGradient id="navyDialAura" cx="50%" cy="50%" r="50%">
                        <stop offset="0%" stopColor="#F3CD82" stopOpacity="0.18" />
                        <stop offset="52%" stopColor="#202B48" stopOpacity="0.45" />
                        <stop offset="100%" stopColor="#101426" stopOpacity="0" />
                      </radialGradient>
                    </defs>

                    <circle cx={DIAL_CENTER} cy={DIAL_CENTER} r={226} fill="url(#navyDialAura)" />

                    <g stroke="#F3CD82" strokeWidth="0.85" fill="none" opacity="0.24">
                      {LOTUS_ANGLES.map((angle) => (
                        <path
                          key={`outer-petal-${angle}`}
                          d="M 250 108 C 272 146 272 198 250 250 C 228 198 228 146 250 108 Z"
                          transform={`rotate(${angle} 250 250)`}
                        />
                      ))}
                      {LOTUS_ANGLES.filter((_, i) => i % 2 === 0).map((angle) => (
                        <path
                          key={`inner-petal-${angle}`}
                          d="M 250 142 C 266 174 266 214 250 250 C 234 214 234 174 250 142 Z"
                          transform={`rotate(${angle + 15} 250 250)`}
                        />
                      ))}
                    </g>

                    <circle
                      cx={DIAL_CENTER}
                      cy={DIAL_CENTER}
                      r={OUTER_RING_RADIUS}
                      fill="none"
                      stroke="#F3CD82"
                      strokeWidth="1.2"
                      strokeOpacity="0.55"
                    />
                    <circle
                      cx={DIAL_CENTER}
                      cy={DIAL_CENTER}
                      r={MID_RING_RADIUS}
                      fill="none"
                      stroke="#F3CD82"
                      strokeWidth="0.9"
                      strokeOpacity="0.28"
                      strokeDasharray="3 5"
                    />
                    <circle
                      cx={DIAL_CENTER}
                      cy={DIAL_CENTER}
                      r={INNER_HALO_RADIUS}
                      fill="none"
                      stroke="#F3CD82"
                      strokeWidth="1"
                      strokeOpacity="0.45"
                    />

                    <g
                      style={{
                        transform: `rotate(${pointerRotationDeg}deg)`,
                        transformOrigin: '250px 250px',
                        transition: reduceMotion
                          ? 'none'
                          : 'transform 0.45s cubic-bezier(0.16, 1, 0.3, 1)',
                      }}
                    >
                      <line
                        x1={DIAL_CENTER}
                        y1={DIAL_CENTER - INNER_HALO_RADIUS}
                        x2={DIAL_CENTER}
                        y2={DIAL_CENTER - OUTER_RING_RADIUS + 20}
                        stroke="#F3CD82"
                        strokeWidth="2"
                        strokeOpacity="0.9"
                      />
                      <circle
                        cx={DIAL_CENTER}
                        cy={DIAL_CENTER - MID_RING_RADIUS}
                        r="3.2"
                        fill="#F3CD82"
                      />
                    </g>

                    {dialNodes.map((ch) => {
                      const outerPt = polarPoint(
                        DIAL_CENTER,
                        DIAL_CENTER,
                        OUTER_RING_RADIUS,
                        ch.angleDeg,
                      );
                      const innerPt = polarPoint(
                        DIAL_CENTER,
                        DIAL_CENTER,
                        INNER_HALO_RADIUS,
                        ch.angleDeg,
                      );
                      const isHighlighted = ch.chapterNumber === activeNumber;
                      return (
                        <line
                          key={`spoke-${ch.chapterNumber}`}
                          x1={innerPt.x}
                          y1={innerPt.y}
                          x2={outerPt.x}
                          y2={outerPt.y}
                          stroke="#F3CD82"
                          strokeWidth={isHighlighted ? 1.8 : 0.8}
                          strokeOpacity={isHighlighted ? 0.9 : 0.25}
                        />
                      );
                    })}
                  </svg>

                  {/* Central Medallion Hub */}
                  <div className="pointer-events-none absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-[32%] aspect-square rounded-full bg-[#202B48]/95 border border-[#F3CD82]/50 shadow-[0_12px_40px_rgba(0,0,0,0.45)] flex flex-col items-center justify-center text-center px-3">
                    <span className="text-[10px] font-medium tracking-[0.16em] uppercase text-[#F3CD82]">
                      {t('chapters.chapterPrefix')} {activeNode.romanNumeral}
                    </span>
                    <span className="font-display text-3xl sm:text-4xl font-light leading-none text-[#FFF6E8] tabular-nums mt-0.5">
                      {activeNode.paddedCode}
                    </span>
                    <span
                      lang="sa"
                      className="mt-1 text-[10px] sm:text-xs text-[#F3CD82]/90 line-clamp-1 max-w-full"
                    >
                      {activeCatalog.sanskritDevanagari}
                    </span>
                  </div>

                  {/* 18 Individually Clickable Circular Nodes */}
                  {dialNodes.map((ch) => {
                    const catalogEntry =
                      GITA_CHAPTER_CATALOG[ch.chapterNumber - 1] ?? GITA_CHAPTER_CATALOG[0];
                    const pt = polarPoint(
                      DIAL_CENTER,
                      DIAL_CENTER,
                      OUTER_RING_RADIUS,
                      ch.angleDeg,
                    );
                    const leftPct = (pt.x / 500) * 100;
                    const topPct = (pt.y / 500) * 100;
                    const isSelected = ch.chapterNumber === selectedNumber;
                    const isHovered = ch.chapterNumber === hoveredNumber;

                    return (
                      <button
                        key={ch.chapterNumber}
                        ref={(el) => {
                          nodeRefs.current[ch.chapterNumber] = el;
                        }}
                        data-chapter-node
                        type="button"
                        aria-pressed={isSelected}
                        aria-label={`${t('chapters.chapterPrefix')} ${ch.paddedCode} — ${catalogEntry.transliteration}`}
                        onMouseEnter={() => setHoveredNumber(ch.chapterNumber)}
                        onMouseLeave={() => setHoveredNumber(null)}
                        onFocus={() => setHoveredNumber(ch.chapterNumber)}
                        onBlur={() => setHoveredNumber(null)}
                        onClick={() => handleSelectChapter(ch.chapterNumber)}
                        onKeyDown={(e) => handleNodeKeyDown(e, ch.chapterNumber)}
                        style={{ left: `${leftPct}%`, top: `${topPct}%` }}
                        className={`absolute -translate-x-1/2 -translate-y-1/2 w-8 h-8 sm:w-10 sm:h-10 rounded-full flex items-center justify-center text-[11px] sm:text-sm font-medium tabular-nums transition-transform duration-150 cursor-pointer focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#F3CD82] ${
                          isSelected
                            ? 'bg-[#F3CD82] text-[#101426] border border-[#FFF6E8] ring-4 ring-[#F3CD82]/30 shadow-[0_0_24px_rgba(243,205,130,0.45)] scale-115 z-20 font-semibold'
                            : isHovered
                              ? 'bg-[#202B48] text-[#F3CD82] border border-[#F3CD82] scale-110 z-10'
                              : 'bg-[#202B48]/95 text-[#FFF6E8] border border-[#F3CD82]/45 hover:border-[#F3CD82]'
                        }`}
                      >
                        {ch.paddedCode}
                      </button>
                    );
                  })}
                </div>
              </div>
            ) : (
              /* Expanded Grid Preview Column when Grid View Mode is Active */
              <div className="space-y-4">
                <div
                  role="tablist"
                  aria-label={t('chapters.gridDirectoryTitle')}
                  className="flex flex-wrap items-center gap-x-5 gap-y-2 border-b border-[#F3CD82]/20 pb-2"
                >
                  {divisionTabs.map((tab) => {
                    const active = division === tab.id;
                    return (
                      <button
                        key={tab.id}
                        type="button"
                        role="tab"
                        aria-selected={active}
                        onClick={() => handleSelectDivision(tab.id)}
                        className={`min-h-[36px] py-1.5 text-xs font-medium border-b-2 transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                          active
                            ? 'border-[#F3CD82] text-[#F3CD82]'
                            : 'border-transparent text-[#FFF6E8]/70 hover:text-[#FFF6E8]'
                        }`}
                      >
                        {tab.label}
                      </button>
                    );
                  })}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-[540px] overflow-y-auto pr-1">
                  {filteredChapters.map((ch) => {
                    const active = ch.chapterNumber === selectedNumber;
                    return (
                      <button
                        key={`focus-grid-${ch.chapterNumber}`}
                        type="button"
                        onClick={() => handleSelectChapter(ch.chapterNumber)}
                        aria-pressed={active}
                        className={`text-left p-4 rounded-lg border transition-colors cursor-pointer flex flex-col justify-between gap-2.5 ${
                          active
                            ? 'bg-[#202B48] border-[#F3CD82] shadow-[0_0_24px_rgba(243,205,130,0.16)]'
                            : 'bg-[#202B48]/42 border-[#F3CD82]/20 hover:border-[#F3CD82]/55 hover:bg-[#202B48]/70'
                        }`}
                      >
                        <div className="flex items-baseline justify-between gap-2">
                          <span className="text-[11px] font-medium tracking-[0.14em] uppercase text-[#F3CD82] tabular-nums">
                            {ch.paddedCode} · {ch.romanNumeral}
                          </span>
                          <span className="text-[11px] text-[#FFF6E8]/60 tabular-nums">
                            {ch.verseCount} {t('chapters.verseCountSuffix')}
                          </span>
                        </div>
                        <div>
                          <p lang="sa" className="text-sm font-medium text-[#F3CD82] truncate">
                            {ch.sanskritDevanagari}
                          </p>
                          <p className="font-editorial text-lg text-[#FFF6E8] leading-snug line-clamp-1 mt-0.5">
                            {ch.transliteration}
                          </p>
                          <p className="text-xs text-[#F5F0E7]/72 line-clamp-2 mt-1">
                            {getChapterContent(ch.chapterNumber).essence}
                          </p>
                        </div>
                        <p className="text-[10px] tracking-[0.14em] uppercase text-[#F3CD82]/75 pt-1 border-t border-[#F3CD82]/15">
                          SA · {currentLocaleMeta.shortLabel} ({currentLocaleMeta.englishName})
                        </p>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}
          </div>

          {/* Right 6 Columns: Live Illuminated Chapter Information & Multilingual Dossier Panel */}
          <div data-chapter-info className="lg:col-span-6 space-y-4">
            <div className="bg-[#202B48]/58 border border-[#F3CD82]/28 rounded-xl p-5 sm:p-7 space-y-4">
              {/* Stepper Header Bar */}
              <div className="flex items-center justify-between gap-4 pb-3 border-b border-[#F3CD82]/20">
                <div className="flex items-center gap-3 text-xs font-medium tracking-[0.16em] uppercase text-[#F3CD82] tabular-nums">
                  <span>
                    {t('chapters.chapterPrefix')} {selectedNode.paddedCode} ·{' '}
                    {selectedNode.romanNumeral}
                  </span>
                  <span aria-hidden="true" className="text-[#F3CD82]/40">
                    /
                  </span>
                  <span className="text-[#FFF6E8]/75">
                    {selectedCatalog.verseCount} {t('chapters.verseCountSuffix')}
                  </span>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <button
                    type="button"
                    onClick={handlePrev}
                    aria-label={t('chapters.prevChapter')}
                    className="inline-flex items-center justify-center w-10 h-10 rounded-full border border-[#F3CD82]/35 bg-[#101426]/65 text-[#FFF6E8] hover:border-[#F3CD82] hover:text-[#F3CD82] transition-colors cursor-pointer"
                  >
                    <ChevronLeft className="w-4 h-4" aria-hidden="true" />
                  </button>
                  <button
                    type="button"
                    onClick={handleNext}
                    aria-label={t('chapters.nextChapter')}
                    className="inline-flex items-center justify-center w-10 h-10 rounded-full border border-[#F3CD82]/35 bg-[#101426]/65 text-[#FFF6E8] hover:border-[#F3CD82] hover:text-[#F3CD82] transition-colors cursor-pointer"
                  >
                    <ChevronRight className="w-4 h-4" aria-hidden="true" />
                  </button>
                </div>
              </div>

              {/* Multilingual Script Tabs */}
              <div
                role="tablist"
                aria-label={t('chapters.multilingualEditionsTitle')}
                className="flex flex-wrap items-center gap-x-4 gap-y-1.5 border-b border-[#F3CD82]/18 pb-2"
              >
                {scriptTabs.map((tab) => {
                  const active = scriptTab === tab.id;
                  return (
                    <button
                      key={tab.id}
                      type="button"
                      role="tab"
                      aria-selected={active}
                      onClick={() => setScriptTab(tab.id)}
                      className={`min-h-[32px] py-1 text-[11px] font-medium tracking-[0.08em] uppercase border-b-2 transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                        active
                          ? 'border-[#F3CD82] text-[#F3CD82]'
                          : 'border-transparent text-[#FFF6E8]/65 hover:text-[#FFF6E8]'
                      }`}
                    >
                      {tab.label}
                    </button>
                  );
                })}
              </div>

              {/* Animated Chapter Content Display */}
              <AnimatePresence mode="wait">
                <motion.div
                  key={`${selectedCatalog.chapterNumber}-${scriptTab}-${locale}`}
                  initial={reduceMotion ? false : { opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={reduceMotion ? { opacity: 0 } : { opacity: 0, y: -6 }}
                  transition={{ duration: reduceMotion ? 0 : 0.22 }}
                  className="space-y-4"
                  aria-live="polite"
                >
                  {/* Sanskrit Name + Transliteration */}
                  <div className="space-y-1">
                    <p
                      lang="sa"
                      className="text-2xl sm:text-[1.75rem] font-medium text-[#F3CD82] leading-snug"
                    >
                      {selectedCatalog.sanskritDevanagari}
                    </p>
                    <p className="text-xs font-medium tracking-[0.12em] uppercase text-[#FFF6E8]/65">
                      {selectedCatalog.transliteration}
                    </p>
                  </div>

                  {/* Localized Title & Summary / Multilingual Readout */}
                  {scriptTab === 'all' && (
                    <>
                      <h3 className="font-editorial text-2xl sm:text-3xl font-normal text-[#FFF6E8] leading-snug">
                        {selectedTranslated.title}
                      </h3>
                      <div className="space-y-2">
                        <div className="flex items-center justify-between gap-2">
                          <p className="text-[11px] font-medium tracking-[0.14em] uppercase text-[#F3CD82]/90">
                            {t('chapters.summarySlotTitle')}
                          </p>
                          <span className="text-[10px] font-medium tracking-[0.1em] uppercase text-[#F3CD82]/75">
                            {currentLocaleMeta.nativeLabel} · {currentLocaleMeta.shortLabel}
                          </span>
                        </div>
                        <p className="text-sm sm:text-[15px] leading-[1.75] text-[#F5F0E7]/86">
                          {selectedTranslated.essence}
                        </p>
                        <p className="text-xs leading-relaxed text-[#F5F0E7]/58 border-t border-[#F3CD82]/15 pt-2">
                          {t('chapters.extendedSummaryPlaceholder')}
                        </p>
                      </div>
                    </>
                  )}

                  {scriptTab === 'sa' && (
                    <div className="space-y-2.5">
                      <h3 lang="sa" className="font-editorial text-2xl font-normal text-[#FFF6E8]">
                        अध्यायः {selectedCatalog.paddedCode} · {selectedCatalog.sanskritDevanagari}
                      </h3>
                      <p className="text-xs leading-relaxed text-[#F5F0E7]/72">
                        {selectedCatalog.transliteration} — {selectedCatalog.verseCount}{' '}
                        {t('chapters.verseCountSuffix')}
                      </p>
                      <p className="text-xs leading-relaxed text-[#F5F0E7]/60 border-t border-[#F3CD82]/15 pt-2">
                        {t('chapters.awaitingApproval')}
                      </p>
                    </div>
                  )}

                  {scriptTab === 'en' && (
                    <div className="space-y-2">
                      <h3 className="font-editorial text-2xl font-normal text-[#FFF6E8]">
                        {selectedCatalog.title.en}
                      </h3>
                      <p className="text-sm sm:text-[15px] leading-[1.75] text-[#F5F0E7]/86">
                        {selectedCatalog.essence.en}
                      </p>
                      <p className="text-xs leading-relaxed text-[#F5F0E7]/58 border-t border-[#F3CD82]/15 pt-2">
                        {t('chapters.extendedSummaryPlaceholder')}
                      </p>
                    </div>
                  )}

                  {scriptTab === 'hi' && (
                    <div className="space-y-2" lang="hi">
                      <h3 className="font-editorial text-2xl font-normal text-[#FFF6E8]">
                        {selectedCatalog.title.hi}
                      </h3>
                      <p className="text-sm sm:text-[15px] leading-[1.75] text-[#F5F0E7]/86">
                        {selectedCatalog.essence.hi}
                      </p>
                      <p className="text-xs leading-relaxed text-[#F5F0E7]/58 border-t border-[#F3CD82]/15 pt-2">
                        {t('chapters.extendedSummaryPlaceholder')}
                      </p>
                    </div>
                  )}

                  {scriptTab === 'te' && (
                    <div className="space-y-2" lang="te">
                      <h3 className="font-editorial text-2xl font-normal text-[#FFF6E8]">
                        {selectedCatalog.title.te}
                      </h3>
                      <p className="text-sm sm:text-[15px] leading-[1.75] text-[#F5F0E7]/86">
                        {selectedCatalog.essence.te}
                      </p>
                      <p className="text-xs leading-relaxed text-[#F5F0E7]/58 border-t border-[#F3CD82]/15 pt-2">
                        {t('chapters.extendedSummaryPlaceholder')}
                      </p>
                    </div>
                  )}

                  {/* Key Sanskrit Shloka & Audio Recitation Toggle */}
                  <div className="pt-3.5 pb-0.5 border-t border-[#F3CD82]/20 space-y-2">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div className="flex items-center gap-2 text-[11px] font-medium tracking-[0.14em] uppercase text-[#F3CD82]">
                        <span>{t('chapters.keyVerseLabel')}</span>
                        <span aria-hidden="true" className="text-[#F3CD82]/40">
                          ·
                        </span>
                        <span className="tabular-nums text-[#FFF6E8]/80">
                          {keyRecitation.verseReference}
                        </span>
                      </div>

                      <button
                        type="button"
                        data-chapter-audio-toggle
                        aria-pressed={isCurrentChapterPlaying}
                        aria-label={
                          isCurrentChapterPlaying
                            ? `${t('chapters.recitationAriaStop')} (${keyRecitation.verseReference})`
                            : `${t('chapters.recitationAriaPlay')} (${keyRecitation.verseReference})`
                        }
                        onClick={() =>
                          void handleToggleRecitation(selectedCatalog.chapterNumber)
                        }
                        className={`inline-flex items-center gap-2 min-h-[34px] px-3.5 py-1.5 rounded-full border text-[11px] font-medium tracking-[0.08em] uppercase transition-colors cursor-pointer ${
                          isCurrentChapterPlaying
                            ? 'bg-[#F3CD82] text-[#101426] border-[#FFF6E8] shadow-[0_0_16px_rgba(243,205,130,0.35)]'
                            : isCurrentChapterLoading
                              ? 'bg-[#202B48] text-[#F3CD82] border-[#F3CD82]/60'
                              : 'bg-[#101426]/65 text-[#F3CD82] border-[#F3CD82]/40 hover:border-[#F3CD82] hover:bg-[#202B48]'
                        }`}
                      >
                        {isCurrentChapterLoading ? (
                          <>
                            <Loader2
                              className="w-3.5 h-3.5 animate-spin"
                              aria-hidden="true"
                            />
                            <span>{t('chapters.loadingRecitation')}</span>
                          </>
                        ) : isCurrentChapterPlaying ? (
                          <>
                            <Square className="w-3 h-3 fill-current" aria-hidden="true" />
                            <span>{t('chapters.stopRecitation')}</span>
                          </>
                        ) : (
                          <>
                            <Volume2 className="w-3.5 h-3.5" aria-hidden="true" />
                            <span>{t('chapters.listenVerse')}</span>
                          </>
                        )}
                      </button>
                    </div>

                    <p
                      lang="sa"
                      className="text-sm sm:text-[15px] leading-relaxed text-[#FFF6E8] whitespace-pre-line font-medium"
                    >
                      {keyRecitation.sanskritDevanagari}
                    </p>
                    <p className="text-xs italic text-[#F3CD82]/80 whitespace-pre-line">
                      {keyRecitation.transliteration}
                    </p>
                    <p className="font-editorial italic text-[15px] leading-relaxed text-[#F5F0E7]/85">
                      “
                      {scriptTab === 'en'
                        ? keyRecitation.meaning.en
                        : scriptTab === 'hi'
                          ? keyRecitation.meaning.hi
                          : scriptTab === 'te'
                            ? keyRecitation.meaning.te
                            : keyRecitation.meaning[contentLocale]}
                      ”
                    </p>

                    {audioError && (
                      <p role="status" className="text-xs text-[#F3CD82]/90 pt-1">
                        {audioError}
                      </p>
                    )}
                  </div>

                  {/* Multilingual Edition & Commentary Reserve Slots */}
                  <div className="pt-3 border-t border-[#F3CD82]/18 grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                    <div className="space-y-1">
                      <p className="text-[10px] font-medium tracking-[0.14em] uppercase text-[#F3CD82]">
                        {t('chapters.multilingualEditionsTitle')}
                      </p>
                      <p className="text-[#F5F0E7]/65 leading-relaxed">
                        {t('chapters.multilingualSlotPending')}
                      </p>
                    </div>
                    <div className="space-y-1">
                      <p className="text-[10px] font-medium tracking-[0.14em] uppercase text-[#F3CD82]">
                        {t('chapters.commentarySlotTitle')}
                      </p>
                      <p className="text-[#F5F0E7]/65 leading-relaxed">
                        {t('chapters.approvedDescriptionFallback')}
                      </p>
                    </div>
                  </div>
                </motion.div>
              </AnimatePresence>

              {/* CTA Row */}
              <div className="pt-4 border-t border-[#F3CD82]/20 flex flex-wrap items-center justify-between gap-4">
                <Link
                  to={`/gita?chapter=${selectedCatalog.chapterNumber}`}
                  className="inline-flex items-center gap-2.5 min-h-[44px] px-6 py-2.5 rounded-full bg-[#F3CD82] text-[#101426] hover:bg-[#FFF6E8] text-xs font-semibold tracking-[0.1em] uppercase transition-colors"
                >
                  <span>{t('chapters.exploreThisChapterCta')}</span>
                  <ArrowRight className="w-4 h-4" aria-hidden="true" />
                </Link>

                <Link
                  to="/gita"
                  className="text-xs font-medium tracking-[0.06em] text-[#F3CD82] hover:text-[#FFF6E8] transition-colors"
                >
                  {t('chapters.allChaptersLink')} →
                </Link>
              </div>
            </div>
          </div>
        </div>

        {/* Tabbed 18-Chapter Grid Directory (Visible below Dial mode for immediate exploration) */}
        {viewMode === 'dial' && (
          <div
            data-testid="chapter-tabbed-grid"
            className="pt-6 border-t border-[#F3CD82]/20 space-y-5"
          >
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <p className="text-xs font-medium tracking-[0.18em] uppercase text-[#F3CD82]">
                {t('chapters.gridDirectoryTitle')}
              </p>

              <div
                role="tablist"
                aria-label={t('chapters.gridDirectoryTitle')}
                className="flex flex-wrap items-center gap-x-5 gap-y-2"
              >
                {divisionTabs.map((tab) => {
                  const active = division === tab.id;
                  return (
                    <button
                      key={`bottom-tab-${tab.id}`}
                      type="button"
                      role="tab"
                      aria-selected={active}
                      onClick={() => handleSelectDivision(tab.id)}
                      className={`min-h-[36px] py-1 text-xs font-medium border-b-2 transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                        active
                          ? 'border-[#F3CD82] text-[#F3CD82]'
                          : 'border-transparent text-[#FFF6E8]/70 hover:text-[#FFF6E8]'
                      }`}
                    >
                      {tab.label}
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-3">
              {filteredChapters.map((ch) => {
                const active = ch.chapterNumber === selectedNumber;
                return (
                  <button
                    key={`card-${ch.chapterNumber}`}
                    type="button"
                    data-testid={`chapter-grid-card-${ch.chapterNumber}`}
                    aria-pressed={active}
                    onClick={() => handleSelectChapter(ch.chapterNumber)}
                    className={`text-left p-3.5 rounded-lg border transition-colors cursor-pointer flex flex-col justify-between gap-2 ${
                      active
                        ? 'bg-[#202B48] border-[#F3CD82] ring-1 ring-[#F3CD82]/40'
                        : 'bg-[#202B48]/38 border-[#F3CD82]/18 hover:border-[#F3CD82]/50 hover:bg-[#202B48]/68'
                    }`}
                  >
                    <div className="flex items-baseline justify-between gap-2">
                      <span className="text-[11px] font-medium tracking-[0.14em] uppercase text-[#F3CD82] tabular-nums">
                        {ch.paddedCode} · {ch.romanNumeral}
                      </span>
                      <span className="text-[10px] text-[#FFF6E8]/55 tabular-nums">
                        {ch.verseCount}v
                      </span>
                    </div>

                    <div>
                      <p lang="sa" className="text-xs font-medium text-[#F3CD82]/95 truncate">
                        {ch.sanskritDevanagari}
                      </p>
                      <p className="font-editorial text-base text-[#FFF6E8] leading-snug line-clamp-1 mt-0.5">
                        {ch.transliteration}
                      </p>
                      <p className="text-[11px] leading-snug text-[#F5F0E7]/68 line-clamp-2 mt-1">
                        {getChapterContent(ch.chapterNumber).essence}
                      </p>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </section>
  );
};
