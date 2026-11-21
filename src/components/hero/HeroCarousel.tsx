import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { ChevronLeft, ChevronRight, Pause, Play } from 'lucide-react';
import { ASSET_MANIFEST } from '../../assets/assetManifest';
import { prefersReducedMotion } from '../../animations/gsapSetup';
import {
  detectSwipeDirection,
  formatSlideCounter,
  getAdjacentSlideIndices,
  nextSlideIndex,
  prevSlideIndex,
} from '../../utils/carouselHelpers';

export interface HeroSlideItem {
  id: string;
  src: string;
  mobileSrc?: string;
  title: string;
  subtitle: string;
  alt: string;
  objectPosition?: string;
  overscanScale?: boolean;
}

export const HERO_CAROUSEL_SLIDES: ReadonlyArray<HeroSlideItem> = [
  {
    id: 'eternal-pavilion',
    src: ASSET_MANIFEST.visualStudies.heroPavilion.src,
    mobileSrc: ASSET_MANIFEST.visualStudies.heroPavilionMobile.src,
    title: 'Bhagavad Gita Vishwa Mahotsav · Hyderabad',
    subtitle: 'Architectural Pavilion & Global Gathering Venue',
    alt: 'Illuminated sandstone and gold pavilion rising at dusk above reflective courtyard waters',
    objectPosition: 'object-bottom md:object-[66%_center] lg:object-center',
  },
  {
    id: 'kurukshetra-dialogue',
    src: ASSET_MANIFEST.visualStudies.heroKurukshetraDialogue.src,
    title: 'Kurukshetra Sacred Dialogue',
    subtitle: 'Lord Krishna & Arjuna · Eternal Dharma on the Chariot',
    alt: 'Classical oil painting of Lord Krishna imparting the wisdom of the Bhagavad Gita to Arjuna beside their chariot at dawn',
    objectPosition: 'object-center',
    overscanScale: true,
  },
  {
    id: 'vishvarupa-vision',
    src: ASSET_MANIFEST.visualStudies.heroVishvarupaVision.src,
    title: 'Vishvarupa · Cosmic Unity',
    subtitle: 'Chapter XI · One Harmony Across Cosmos & Humanity',
    alt: 'Monumental sacred Indian painting of the cosmic Vishvarupa form encircled by golden astronomical mandalas',
    objectPosition: 'object-center',
    overscanScale: true,
  },
  {
    id: 'ancient-temple-sanctum',
    src: ASSET_MANIFEST.visualStudies.heroAncientTempleSanctum.src,
    title: 'Timeless Sanctum Heritage',
    subtitle: 'Carved Stone Mandapas · Living Continuity of Sanatana Wisdom',
    alt: 'Sunbeams illuminating carved ancient Indian sandstone temple pillars and brass oil lamps',
    objectPosition: 'object-center',
  },
  {
    id: 'sacred-gita-volume',
    src: ASSET_MANIFEST.visualStudies.eternalGitaVolume.src,
    title: '700 Shlokas · 18 Chapters · 18 Languages',
    subtitle: 'Preserved Manuscript & Multilingual Global Study',
    alt: 'Illuminated sacred edition of the Bhagavad Gita resting upon a sculpted pedestal in quiet light',
    objectPosition: 'object-center',
  },
  {
    id: 'twilight-sanctum',
    src: ASSET_MANIFEST.visualStudies.eveningSanctum.src,
    title: 'Global Peace & Collective Parayana',
    subtitle: '20 Dec 2026 Online Curtain Raiser · 27 Feb 2027 Grand Conclave',
    alt: 'Twilight reflection basin before an illuminated sandstone sanctuary',
    objectPosition: 'object-center',
  },
  {
    id: 'youth-gita-forum',
    src: ASSET_MANIFEST.visualStudies.heroYouthGitaForum.src,
    title: 'Youth & University Gita Dialogue (15–35)',
    subtitle: 'Campus Leadership, Ethics & Conscious Action Forums',
    alt: 'International students and youth delegates gathered around Bhagavad Gita dialogue tables inside a sunlit stone hall',
    objectPosition: 'object-center',
  },
  {
    id: 'global-parayana-sanctum',
    src: ASSET_MANIFEST.visualStudies.heroGlobalParayanaSanctum.src,
    title: '18-Nation Synchronized Parayana',
    subtitle: 'Eighteen Chapters Chanted Across Eighteen Countries',
    alt: 'Sacred evening parayana assembly with brass lamps illuminated beneath carved sandstone arches',
    objectPosition: 'object-center',
  },
];

interface HeroCarouselProps {
  slides?: ReadonlyArray<HeroSlideItem>;
  autoAdvanceMs?: number;
  suspended?: boolean;
}

export const HeroCarousel: React.FC<HeroCarouselProps> = ({
  slides = HERO_CAROUSEL_SLIDES,
  autoAdvanceMs = 6500,
  suspended = false,
}) => {
  const [activeIndex, setActiveIndex] = useState(0);
  const [previousIndex, setPreviousIndex] = useState<number | null>(null);
  const [paused, setPaused] = useState(false);
  const touchStartXRef = useRef<number | null>(null);
  const transitionTimerRef = useRef<number | null>(null);
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

  // Preload previous and next slide assets in background without blocking initial paint
  useEffect(() => {
    if (typeof window === 'undefined' || total <= 1) return;
    const toPreload = [slides[adjacent.next], slides[adjacent.prev]];
    toPreload.forEach((slide) => {
      if (!slide) return;
      const img = new window.Image();
      img.decoding = 'async';
      img.src = slide.src;
    });
  }, [adjacent.next, adjacent.prev, slides, total]);

  const goToSlide = useCallback(
    (nextIdx: number) => {
      if (total <= 1 || nextIdx === activeIndex) return;
      if (transitionTimerRef.current !== null) {
        window.clearTimeout(transitionTimerRef.current);
      }
      setPreviousIndex(activeIndex);
      setActiveIndex(nextIdx);
      transitionTimerRef.current = window.setTimeout(() => {
        setPreviousIndex(null);
      }, 780);
    },
    [activeIndex, total],
  );

  const handleNext = useCallback(() => {
    goToSlide(nextSlideIndex(activeIndex, total));
  }, [activeIndex, goToSlide, total]);

  const handlePrev = useCallback(() => {
    goToSlide(prevSlideIndex(activeIndex, total));
  }, [activeIndex, goToSlide, total]);

  useEffect(() => {
    return () => {
      if (transitionTimerRef.current !== null) {
        window.clearTimeout(transitionTimerRef.current);
      }
    };
  }, []);

  useEffect(() => {
    if (paused || suspended || reducedMotion || total <= 1) return;
    const timer = window.setInterval(() => {
      handleNext();
    }, autoAdvanceMs);
    return () => window.clearInterval(timer);
  }, [autoAdvanceMs, handleNext, paused, reducedMotion, suspended, total]);

  const activeSlide = slides[activeIndex] ?? slides[0];

  return (
    <>
      {/* Full-bleed Horizontal Right-to-Left Viewport */}
      <div
        className="absolute inset-0 overflow-hidden bg-[#101D32] select-none"
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
        {slides.map((slide, idx) => {
          const isCurrent = idx === activeIndex;
          const isLeaving = idx === previousIndex;
          const isAdjacent = idx === adjacent.next || idx === adjacent.prev;

          if (!isCurrent && !isLeaving && !isAdjacent) {
            return null;
          }

          let transformClass = 'translate-x-full opacity-0 z-0';
          if (isCurrent) {
            transformClass = 'translate-x-0 opacity-100 z-10';
          } else if (isLeaving) {
            // Exits cleanly to the left while incoming slide glides from right to left
            transformClass = '-translate-x-full opacity-40 z-0';
          }

          return (
            <div
              key={slide.id}
              aria-hidden={!isCurrent}
              data-hero-slide={idx}
              className={`absolute inset-0 will-change-transform ${
                reducedMotion
                  ? ''
                  : 'transition-[transform,opacity] duration-[780ms] ease-[cubic-bezier(0.22,1,0.36,1)]'
              } ${transformClass}`}
            >
              <picture className="block w-full h-full">
                {slide.mobileSrc && (
                  <source media="(max-width: 767px)" srcSet={slide.mobileSrc} />
                )}
                <img
                  src={slide.src}
                  alt={slide.alt}
                  decoding="async"
                  fetchPriority={idx === 0 ? 'high' : 'auto'}
                  referrerPolicy="no-referrer"
                  className={`w-full h-full object-cover ${
                    slide.objectPosition ?? 'object-center'
                  } ${
                    slide.overscanScale ? 'scale-[1.09]' : isCurrent && !reducedMotion ? 'scale-[1.03]' : 'scale-100'
                  } transition-transform duration-[6200ms] ease-out`}
                />
              </picture>
            </div>
          );
        })}
      </div>

      {/* Subtle Floating Right-Bottom Carousel Bar (Aligned along bottom floor to keep spiritual showcase clear) */}
      <div
        className="absolute right-4 sm:right-8 lg:right-12 bottom-3 sm:bottom-4 z-20 flex flex-row items-center gap-3 pointer-events-auto"
        data-testid="hero-carousel-controls"
      >
        {/* Active Slide Caption Tag */}
        <div className="hidden xl:flex items-center gap-3 bg-[#17233A]/85 border border-[#C9A04E]/35 rounded-full px-4 py-1.5 max-w-xs">
          <span className="text-[10px] font-semibold tracking-[0.18em] uppercase text-[#F0D38B] shrink-0">
            {formatSlideCounter(activeIndex, total)}
          </span>
          <span className="text-xs text-[#FFFDF7] truncate">
            {activeSlide.title}
          </span>
        </div>

        {/* Manual Prev / Pause-Resume / Numbered Slide Indicators / Next */}
        <div className="inline-flex items-center gap-1 rounded-full bg-[#17233A]/88 border border-[#C9A04E]/45 p-1 shadow-[0_8px_28px_rgba(11,17,28,0.45)]">
          <button
            type="button"
            onClick={handlePrev}
            data-testid="hero-carousel-prev"
            aria-label="Previous hero image"
            className="inline-flex items-center justify-center w-8 h-8 rounded-full text-[#FFFDF7] hover:bg-[#C9A04E]/20 hover:text-[#F0D38B] transition-colors cursor-pointer"
          >
            <ChevronLeft className="w-4 h-4" aria-hidden="true" />
          </button>

          <button
            type="button"
            onClick={() => setPaused((p) => !p)}
            data-testid="hero-carousel-pause"
            aria-label={paused ? 'Resume hero slideshow' : 'Pause hero slideshow'}
            aria-pressed={paused}
            className="inline-flex items-center justify-center w-8 h-8 rounded-full text-[#F0D38B] hover:bg-[#C9A04E]/20 transition-colors cursor-pointer"
          >
            {paused ? (
              <Play className="w-3.5 h-3.5 fill-current" aria-hidden="true" />
            ) : (
              <Pause className="w-3.5 h-3.5" aria-hidden="true" />
            )}
          </button>

          <div className="hidden xs:flex sm:flex items-center gap-1 px-1" role="tablist" aria-label="Select hero slide">
            {slides.map((s, idx) => {
              const current = idx === activeIndex;
              return (
                <button
                  key={s.id}
                  type="button"
                  role="tab"
                  aria-selected={current}
                  aria-label={`Slide ${idx + 1}: ${s.title}`}
                  data-testid={`hero-slide-dot-${idx}`}
                  onClick={() => goToSlide(idx)}
                  className={`min-w-[26px] h-7 px-1.5 rounded-full text-[11px] font-medium tabular-nums transition-colors cursor-pointer ${
                    current
                      ? 'bg-[#C9A04E] text-[#171717] font-semibold'
                      : 'text-[#FFFDF7]/75 hover:text-[#F0D38B]'
                  }`}
                >
                  {String(idx + 1).padStart(2, '0')}
                </button>
              );
            })}
          </div>

          <button
            type="button"
            onClick={handleNext}
            data-testid="hero-carousel-next"
            aria-label="Next hero image"
            className="inline-flex items-center justify-center w-8 h-8 rounded-full text-[#FFFDF7] hover:bg-[#C9A04E]/20 hover:text-[#F0D38B] transition-colors cursor-pointer"
          >
            <ChevronRight className="w-4 h-4" aria-hidden="true" />
          </button>
        </div>
      </div>
    </>
  );
};
