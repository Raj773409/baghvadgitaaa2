import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { ChevronLeft, ChevronRight, Pause, Play, Sparkles } from 'lucide-react';
import { ensureGsapRegistered, gsap, prefersReducedMotion } from '../../animations/gsapSetup';
import { ASSET_MANIFEST } from '../../assets/assetManifest';
import {
  detectSwipeDirection,
  formatSlideCounter,
  getAdjacentSlideIndices,
  getHorizontalSlideVectors,
  nextSlideIndex,
  prevSlideIndex,
} from '../../utils/carouselHelpers';

export interface SpiritualSlideItem {
  id: string;
  src: string;
  caption: string;
  subtitle: string;
  chapterRef: string;
  alt: string;
  objectPosition?: string;
}

export const SPIRITUAL_CAROUSEL_SLIDES: ReadonlyArray<SpiritualSlideItem> = [
  {
    id: 'lord-krishna-portrait',
    src: ASSET_MANIFEST.visualStudies.lordKrishnaPortrait.src,
    caption: 'The Eternal Wisdom.',
    subtitle: 'Sri Krishna · Peacock Crown & Sacred Flute',
    chapterRef: 'Gita Mahotsav 2027',
    alt: 'Classical Indian devotional painting of Lord Krishna holding a golden flute inside a carved sandstone mandapa',
    objectPosition: '50% 22%',
  },
  {
    id: 'krishna-arjuna-chariot',
    src: ASSET_MANIFEST.visualStudies.heroKurukshetraDialogue.src,
    caption: 'The Divine Dialogue.',
    subtitle: 'Lord Krishna & Arjuna Upon the Chariot',
    chapterRef: 'Chapter II · Sankhya Yoga',
    alt: 'Classical painting of Lord Krishna and Arjuna standing beside their golden chariot at dawn',
    objectPosition: '50% 35%',
  },
  {
    id: 'open-bhagavad-gita',
    src: ASSET_MANIFEST.visualStudies.openBhagavadGitaBook.src,
    caption: 'The Sacred Scripture.',
    subtitle: 'Illuminated Sanskrit Verses & Temple Diya',
    chapterRef: '700 Timeless Shlokas',
    alt: 'Open antique Bhagavad Gita volume resting on a carved wooden bookstand lit by a brass lamp',
    objectPosition: '50% 48%',
  },
  {
    id: 'ancient-sanskrit-scripture',
    src: ASSET_MANIFEST.visualStudies.manuscriptCraft.src,
    caption: 'The Sacred Scripture.',
    subtitle: 'Preserved Palm-Leaf & Sanskrit Folio Tradition',
    chapterRef: '18 Languages · Global Archive',
    alt: 'Close study of preserved ancient Sanskrit palm-leaf manuscripts crafted in traditional gold ink',
    objectPosition: '50% 50%',
  },
  {
    id: 'golden-embossed-gita',
    src: ASSET_MANIFEST.visualStudies.eternalGitaVolume.src,
    caption: 'The Wisdom of the Gita.',
    subtitle: 'Gold-Embossed Commemorative Bhagavad Gita',
    chapterRef: 'Eternal Royal Edition',
    alt: 'Gold-embossed sacred edition of the Bhagavad Gita resting upon an illuminated pedestal',
    objectPosition: '50% 45%',
  },
  {
    id: 'vishvarupa-artwork',
    src: ASSET_MANIFEST.visualStudies.heroVishvarupaVision.src,
    caption: 'The Universal Vision.',
    subtitle: 'Vishvarupa · Cosmic Harmony & Oneness',
    chapterRef: 'Chapter XI · Vishvarupa Darshana',
    alt: 'Sacred classical painting of the cosmic Vishvarupa form surrounded by golden mandalas',
    objectPosition: '50% 32%',
  },
  {
    id: 'kurukshetra-battlefield',
    src: ASSET_MANIFEST.visualStudies.kurukshetraSacredBattlefield.src,
    caption: 'The Divine Dialogue.',
    subtitle: 'Kurukshetra · Sacred Dawn of Awakening',
    chapterRef: 'Chapter I · Kurukshetra Kshetra',
    alt: 'Golden sunrise breaking across the sacred plain of Kurukshetra with ancient Vedic banners and chariots',
    objectPosition: '50% 52%',
  },
  {
    id: 'krishna-teaching-arjuna',
    src: ASSET_MANIFEST.visualStudies.krishnaTeachingArjuna.src,
    caption: 'The Eternal Wisdom.',
    subtitle: 'Krishna Imparting Dharma to Arjuna',
    chapterRef: 'Chapter XVIII · Moksha Sannyasa',
    alt: 'Classical Indian artwork of Lord Krishna in chinmudra calmly teaching Arjuna beside their chariot',
    objectPosition: '50% 32%',
  },
];

export interface HomepageSpiritualImageCarouselProps {
  slides?: ReadonlyArray<SpiritualSlideItem>;
  autoAdvanceMs?: number;
  eyebrowOverride?: string;
  captionOverride?: string;
  suspended?: boolean;
}

export const HomepageSpiritualImageCarousel: React.FC<HomepageSpiritualImageCarouselProps> = ({
  slides = SPIRITUAL_CAROUSEL_SLIDES,
  autoAdvanceMs = 5200,
  eyebrowOverride,
  captionOverride,
  suspended = false,
}) => {
  const [activeIndex, setActiveIndex] = useState(0);
  const [previousIndex, setPreviousIndex] = useState<number | null>(null);
  const [direction, setDirection] = useState<'next' | 'prev'>('next');
  const [paused, setPaused] = useState(false);

  const stageRef = useRef<HTMLDivElement | null>(null);
  const incomingRef = useRef<HTMLDivElement | null>(null);
  const outgoingRef = useRef<HTMLDivElement | null>(null);
  const captionRef = useRef<HTMLDivElement | null>(null);
  const touchStartXRef = useRef<number | null>(null);
  const transitionGenRef = useRef(0);

  const total = slides.length;
  const reducedMotion = prefersReducedMotion();

  useEffect(() => {
    if (activeIndex >= total && total > 0) {
      setActiveIndex(0);
      setPreviousIndex(null);
    }
  }, [activeIndex, total]);

  const adjacent = useMemo(
    () => getAdjacentSlideIndices(activeIndex, total),
    [activeIndex, total],
  );

  // Preload adjacent slides in memory so right-to-left transitions render cleanly without lag
  useEffect(() => {
    if (typeof window === 'undefined' || total <= 1) return;
    const targets = [slides[adjacent.next], slides[adjacent.prev]];
    targets.forEach((slide) => {
      if (!slide) return;
      const img = new window.Image();
      img.decoding = 'async';
      img.src = slide.src;
    });
  }, [adjacent.next, adjacent.prev, slides, total]);

  const navigateTo = useCallback(
    (nextIdx: number, dir: 'next' | 'prev') => {
      if (total <= 1 || nextIdx === activeIndex) return;
      setDirection(dir);
      setPreviousIndex(activeIndex);
      setActiveIndex(nextIdx);
    },
    [activeIndex, total],
  );

  const handleNext = useCallback(() => {
    navigateTo(nextSlideIndex(activeIndex, total), 'next');
  }, [activeIndex, navigateTo, total]);

  const handlePrev = useCallback(() => {
    navigateTo(prevSlideIndex(activeIndex, total), 'prev');
  }, [activeIndex, navigateTo, total]);

  // Auto-advance continuously right-to-left
  useEffect(() => {
    if (paused || suspended || total <= 1) return;
    const interval = window.setInterval(() => {
      handleNext();
    }, autoAdvanceMs);
    return () => window.clearInterval(interval);
  }, [autoAdvanceMs, handleNext, paused, suspended, total]);

  // GSAP right-to-left slide transition + subtle zoom + gentle parallax
  useEffect(() => {
    if (previousIndex === null) return;
    const gen = ++transitionGenRef.current;

    const incomingEl = incomingRef.current;
    const outgoingEl = outgoingRef.current;
    const captionEl = captionRef.current;

    if (reducedMotion || !incomingEl) {
      setPreviousIndex(null);
      return;
    }

    ensureGsapRegistered();
    const vectors = getHorizontalSlideVectors(direction);
    const incomingImg = incomingEl.querySelector<HTMLImageElement>('img');
    const outgoingImg = outgoingEl?.querySelector<HTMLImageElement>('img');

    const ctx = gsap.context(() => {
      const tl = gsap.timeline({
        defaults: { duration: 0.85, ease: 'power3.inOut' },
        onComplete: () => {
          if (transitionGenRef.current === gen) {
            setPreviousIndex(null);
          }
        },
      });

      if (outgoingEl) {
        tl.fromTo(
          outgoingEl,
          { xPercent: 0, opacity: 1, zIndex: 1 },
          { xPercent: vectors.outgoingEndXPercent, opacity: 1, duration: 0.85, ease: 'power3.inOut' },
          0,
        );
      }

      if (outgoingImg) {
        tl.fromTo(
          outgoingImg,
          { scale: 1.0, x: 0 },
          { scale: 1.04, x: -vectors.parallaxOffsetPx, duration: 0.85, ease: 'power3.inOut' },
          0,
        );
      }

      tl.fromTo(
        incomingEl,
        { xPercent: vectors.incomingStartXPercent, opacity: 1, zIndex: 2 },
        { xPercent: 0, opacity: 1, duration: 0.85, ease: 'power3.inOut' },
        0,
      );

      if (incomingImg) {
        tl.fromTo(
          incomingImg,
          { scale: 1.08, x: vectors.parallaxOffsetPx },
          { scale: 1.01, x: 0, duration: 1.25, ease: 'power2.out' },
          0,
        );
      }

      if (captionEl) {
        tl.fromTo(
          captionEl,
          { y: 6, opacity: 0.45 },
          { y: 0, opacity: 1, duration: 0.48, ease: 'power2.out' },
          0.08,
        );
      }
    }, stageRef);

    return () => ctx.revert();
  }, [activeIndex, previousIndex, direction, reducedMotion]);

  const activeSlide = slides[activeIndex] ?? slides[0];
  const previousSlide = previousIndex !== null ? slides[previousIndex] : null;
  const displayedCaption =
    activeIndex === 0 && captionOverride ? captionOverride : activeSlide.caption;
  const displayedEyebrow =
    activeIndex === 0 && eyebrowOverride ? eyebrowOverride : activeSlide.chapterRef;

  return (
    <div
      data-testid="homepage-spiritual-carousel"
      className="relative w-full max-w-[590px] mx-auto lg:ml-auto lg:mr-0 rounded-[28px] overflow-hidden border border-[#D4A537]/60 bg-gradient-to-b from-[#17233A]/95 via-[#111B2E]/96 to-[#0B1220]/98 shadow-[0_30px_80px_rgba(6,10,20,0.68),0_0_48px_rgba(212,165,55,0.16)] backdrop-blur-md"
      role="region"
      aria-roledescription="carousel"
      aria-label="Sacred Devotional Heritage Showcase"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === 'ArrowRight') {
          e.preventDefault();
          handleNext();
        } else if (e.key === 'ArrowLeft') {
          e.preventDefault();
          handlePrev();
        }
      }}
      onTouchStart={(e) => {
        touchStartXRef.current = e.touches[0]?.clientX ?? null;
      }}
      onTouchEnd={(e) => {
        const endX = e.changedTouches[0]?.clientX;
        if (touchStartXRef.current !== null && typeof endX === 'number') {
          const dir = detectSwipeDirection(touchStartXRef.current, endX);
          if (dir === 'next') handleNext();
          if (dir === 'prev') handlePrev();
        }
        touchStartXRef.current = null;
      }}
    >
      {/* Subtle Outer Metallic Gold Filigree Accent Line */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-[7px] rounded-[22px] border border-[#F7D774]/22 z-20"
      />

      {/* Soft Warm Gold Aura Accent */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -top-24 -right-24 w-64 h-64 rounded-full bg-[#D4A537]/16 blur-3xl z-0"
      />

      {/* Fixed 4:3 Architectural Image Viewport (Zero Layout Shift) */}
      <div
        ref={stageRef}
        className="relative w-full aspect-[4/3] overflow-hidden bg-[#101A2D] select-none"
      >
        {/* Outgoing Slide (Exits cleanly right-to-left) */}
        {previousSlide && previousIndex !== activeIndex && (
          <div
            ref={outgoingRef}
            key={`out-${previousSlide.id}-${previousIndex}`}
            aria-hidden="true"
            className="absolute inset-0 will-change-transform"
          >
            <img
              src={previousSlide.src}
              alt=""
              decoding="async"
              style={{ objectPosition: previousSlide.objectPosition ?? '50% 38%' }}
              className="w-full h-full object-cover"
            />
          </div>
        )}

        {/* Active Incoming Slide */}
        <div
          ref={incomingRef}
          key={`in-${activeSlide.id}-${activeIndex}`}
          data-testid="spiritual-carousel-active-slide"
          data-slide-id={activeSlide.id}
          className="absolute inset-0 will-change-transform"
        >
          <img
            src={activeSlide.src}
            alt={activeSlide.alt}
            decoding="async"
            fetchPriority={activeIndex === 0 ? 'high' : 'auto'}
            style={{ objectPosition: activeSlide.objectPosition ?? '50% 38%' }}
            className="w-full h-full object-cover"
          />
        </div>

        {/* Royal Navy & Gold Editorial Vignette */}
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 z-10 bg-gradient-to-t from-[#0D1526]/92 via-[#0D1526]/20 to-transparent"
        />
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 z-10 bg-gradient-to-r from-[#0D1526]/30 via-transparent to-[#D4A537]/10"
        />

        {/* Top Chapter / Edition Pill Badge */}
        <div className="absolute top-4 left-4 right-4 z-20 flex items-center justify-between gap-2 pointer-events-none">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#17233A]/85 border border-[#D4A537]/45 backdrop-blur-md">
            <Sparkles className="w-3 h-3 text-[#F7D774]" aria-hidden="true" />
            <span className="text-[10px] font-semibold tracking-[0.18em] uppercase text-[#F7D774]">
              {displayedEyebrow}
            </span>
          </div>

          <span className="px-2.5 py-1 rounded-full bg-[#17233A]/82 border border-[#F7D774]/30 text-[10px] font-medium tracking-[0.14em] uppercase text-[#FFFDF7] tabular-nums">
            {formatSlideCounter(activeIndex, total)}
          </span>
        </div>

        {/* Bottom Editorial Caption Over Vignette */}
        <div
          ref={captionRef}
          className="absolute bottom-4 left-5 right-5 z-20 flex items-end justify-between gap-3 pointer-events-none"
        >
          <div className="space-y-0.5 min-w-0">
            <p
              data-testid="spiritual-carousel-caption"
              className="font-display text-xl sm:text-2xl font-normal text-[#FFFDF7] tracking-[0.01em] drop-shadow-sm"
            >
              {displayedCaption}
            </p>
            <p className="text-xs sm:text-[13px] text-[#F7D774]/92 truncate">
              {activeSlide.subtitle}
            </p>
          </div>
        </div>
      </div>

      {/* Royal Ivory-Gold Architectural Control Bar */}
      <div className="relative z-20 px-4 sm:px-5 py-3 bg-[#FFFDF7]/[0.04] border-t border-[#D4A537]/30 flex items-center justify-between gap-3">
        {/* Slide Progress Segments */}
        <div
          className="flex items-center gap-1.5 flex-wrap"
          role="tablist"
          aria-label="Select devotional image"
        >
          {slides.map((slide, idx) => {
            const isCurrent = idx === activeIndex;
            return (
              <button
                key={slide.id}
                type="button"
                role="tab"
                aria-selected={isCurrent}
                aria-label={`View image ${idx + 1}: ${slide.subtitle}`}
                data-testid={`spiritual-carousel-dot-${idx}`}
                onClick={() => navigateTo(idx, idx >= activeIndex ? 'next' : 'prev')}
                className={`h-2 rounded-full transition-all duration-300 cursor-pointer ${
                  isCurrent
                    ? 'w-7 bg-gradient-to-r from-[#D4A537] to-[#F7D774] shadow-[0_0_10px_rgba(247,215,116,0.55)]'
                    : 'w-2 bg-[#FFFDF7]/35 hover:bg-[#F7D774]/75'
                }`}
              />
            );
          })}
        </div>

        {/* Prev / Pause-Resume / Next Controls */}
        <div className="inline-flex items-center gap-1.5 shrink-0">
          <button
            type="button"
            onClick={handlePrev}
            data-testid="spiritual-carousel-prev"
            aria-label="Previous spiritual artwork"
            className="inline-flex items-center justify-center w-8 h-8 rounded-full border border-[#D4A537]/45 bg-[#17233A]/85 text-[#FFFDF7] hover:border-[#F7D774] hover:text-[#F7D774] transition-colors cursor-pointer"
          >
            <ChevronLeft className="w-4 h-4" aria-hidden="true" />
          </button>

          <button
            type="button"
            onClick={() => setPaused((p) => !p)}
            data-testid="spiritual-carousel-pause"
            aria-label={paused ? 'Resume spiritual carousel' : 'Pause spiritual carousel'}
            aria-pressed={paused}
            className="inline-flex items-center justify-center w-8 h-8 rounded-full border border-[#D4A537]/45 bg-[#17233A]/85 text-[#F7D774] hover:border-[#F7D774] hover:bg-[#D4A537]/15 transition-colors cursor-pointer"
          >
            {paused ? (
              <Play className="w-3.5 h-3.5 fill-current" aria-hidden="true" />
            ) : (
              <Pause className="w-3.5 h-3.5" aria-hidden="true" />
            )}
          </button>

          <button
            type="button"
            onClick={handleNext}
            data-testid="spiritual-carousel-next"
            aria-label="Next spiritual artwork"
            className="inline-flex items-center justify-center w-8 h-8 rounded-full border border-[#D4A537]/45 bg-[#17233A]/85 text-[#FFFDF7] hover:border-[#F7D774] hover:text-[#F7D774] transition-colors cursor-pointer"
          >
            <ChevronRight className="w-4 h-4" aria-hidden="true" />
          </button>
        </div>
      </div>
    </div>
  );
};
