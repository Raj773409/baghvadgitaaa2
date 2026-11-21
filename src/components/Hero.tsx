import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  ArrowRight,
  BookOpen,
  Calendar,
  Globe2,
  Play,
  PlayCircle,
  RotateCcw,
} from 'lucide-react';
import { ensureGsapRegistered, gsap, prefersReducedMotion } from '../animations/gsapSetup';
import { extractPublishedPageDetails, resolveCmsMediaUrl } from '../content/siteCatalog';
import { usePublicCms } from '../hooks/usePublicCms';
import { useI18n } from '../i18n';
import {
  resolvePublishedHeroSlides,
  resolvePublishedSpiritualSlides,
} from '../utils/cmsSync';
import { dispatchReplayWelcome } from '../utils/welcomeExperience';
import { HERO_CAROUSEL_SLIDES, HeroCarousel } from './hero/HeroCarousel';
import {
  HomepageSpiritualImageCarousel,
  SPIRITUAL_CAROUSEL_SLIDES,
} from './hero/HomepageSpiritualImageCarousel';
import { TrailerModal } from './hero/TrailerModal';

export interface HeroProps {
  suspended?: boolean;
}

export const Hero: React.FC<HeroProps> = ({ suspended = false }) => {
  const { t, locale, contentLocale } = useI18n();
  const publicCms = usePublicCms();
  const heroRef = useRef<HTMLElement | null>(null);
  const [trailerOpen, setTrailerOpen] = useState(false);

  const heroCmsOverride = useMemo(
    () =>
      publicCms?.cmsItems.find(
        (c) => c.section === 'hero' && (c.language === locale || c.language === 'en'),
      ),
    [publicCms, locale],
  );

  const krishnaCmsOverride = useMemo(
    () =>
      publicCms?.cmsItems.find(
        (c) => c.section === 'krishnaFeature' && (c.language === locale || c.language === 'en'),
      ),
    [publicCms, locale],
  );

  const homePageDetails = useMemo(
    () => extractPublishedPageDetails(publicCms?.pages, '/', contentLocale),
    [publicCms?.pages, contentLocale],
  );

  const publishedHeroSlides = useMemo(
    () =>
      resolvePublishedHeroSlides(HERO_CAROUSEL_SLIDES, publicCms?.carousels, resolveCmsMediaUrl),
    [publicCms?.carousels],
  );

  const heroAutoAdvanceMs = useMemo(
    () => publicCms?.carousels?.find((c) => c.id === 'hero-main')?.autoAdvanceMs ?? 6500,
    [publicCms?.carousels],
  );

  const publishedSpiritualConfig = useMemo(
    () =>
      resolvePublishedSpiritualSlides(
        SPIRITUAL_CAROUSEL_SLIDES,
        publicCms?.carousels,
        resolveCmsMediaUrl,
      ),
    [publicCms?.carousels],
  );

  const spiritualBlock = useMemo(
    () => homePageDetails.blocks.find((b) => b.id === 'home-spiritual-carousel') ?? null,
    [homePageDetails.blocks],
  );

  const heroEyebrowText =
    heroCmsOverride?.title ||
    homePageDetails.pickHeroEyebrow(t('hero.eyebrow'));

  const heroAccentText =
    heroCmsOverride?.subtitle ||
    homePageDetails.pickHeroHeading(t('hero.headlineAccent'));

  const heroBodyOverride =
    heroCmsOverride?.body ||
    homePageDetails.pickHeroSubheading('');

  useEffect(() => {
    const el = heroRef.current;
    if (!el || prefersReducedMotion()) return;
    ensureGsapRegistered();

    const ctx = gsap.context(() => {
      gsap.fromTo(
        '[data-hero-reveal]',
        { y: 16, opacity: 0.25 },
        {
          y: 0,
          opacity: 1,
          duration: 0.72,
          stagger: 0.075,
          ease: 'power3.out',
          clearProps: 'transform,opacity',
        },
      );
    }, el);

    return () => ctx.revert();
  }, []);

  return (
    <>
      <section
        id="top"
        ref={heroRef}
        aria-label={t('hero.eyebrow')}
        className="relative w-full min-h-[100svh] overflow-hidden bg-[#17233A] text-white"
      >
        {/* High-Resolution Right-to-Left Horizontal Carousel */}
        <HeroCarousel
          slides={publishedHeroSlides}
          autoAdvanceMs={heroAutoAdvanceMs}
          suspended={suspended}
        />

        {/* Calibrated Royal Navy Contrast Scrims */}
        <div
          aria-hidden="true"
          className="absolute inset-0 pointer-events-none z-10 md:hidden"
          style={{
            background:
              'linear-gradient(180deg, rgba(23, 35, 58, 0.84) 0%, rgba(23, 35, 58, 0.62) 55%, rgba(15, 22, 36, 0.88) 100%)',
          }}
        />
        <div
          aria-hidden="true"
          className="hidden md:block absolute inset-0 pointer-events-none z-10"
          style={{
            background:
              'linear-gradient(90deg, rgba(23, 35, 58, 0.88) 0%, rgba(23, 35, 58, 0.64) 46%, rgba(23, 35, 58, 0.28) 72%, rgba(23, 35, 58, 0.16) 100%)',
          }}
        />
        <div
          aria-hidden="true"
          className="absolute inset-x-0 top-0 h-28 pointer-events-none z-10 bg-gradient-to-b from-[rgba(15,22,36,0.65)] to-transparent"
        />
        <div
          aria-hidden="true"
          className="absolute inset-x-0 bottom-0 h-28 pointer-events-none z-10 bg-gradient-to-t from-[rgba(15,22,36,0.82)] via-[rgba(15,22,36,0.28)] to-transparent"
        />

        {/* Event-First Foreground Architecture */}
        <div className="relative z-15 max-w-[1360px] mx-auto px-5 sm:px-8 lg:px-12 min-h-[100svh] pt-24 sm:pt-28 pb-16 sm:pb-20 flex flex-col justify-between pointer-events-none">
          <div className="my-auto py-3 sm:py-4 grid grid-cols-1 lg:grid-cols-12 items-center gap-8 lg:gap-10">
            {/* Left Zone: Event Title, Theme Pillar, Official Dates, Primary & Secondary CTAs */}
            <div className="lg:col-span-7 xl:col-span-6 space-y-4 sm:space-y-5 pointer-events-auto">
              <div className="flex items-center gap-5" data-hero-reveal>
                <p className="text-[11px] sm:text-xs font-medium tracking-[0.26em] uppercase text-[#F7D774] whitespace-nowrap">
                  {heroEyebrowText}
                </p>
                <span
                  className="hidden sm:block h-px w-24 sm:w-28 bg-gradient-to-r from-[#D4A537]/80 to-transparent"
                  aria-hidden="true"
                />
              </div>

              <h1
                data-hero-reveal
                className={`font-display font-light text-[clamp(2.1rem,4.3vw,4rem)] leading-[1.06] tracking-[0.02em] text-[#FFFDF7] ${
                  locale === 'en' ? 'uppercase' : ''
                }`}
              >
                <span className="block">{t('hero.headlineLine1')}</span>
                <span className="block mt-0.5">{t('hero.headlineLine2')}</span>
                <span className="block royal-gold-gradient-text font-normal mt-0.5">
                  {heroAccentText}
                </span>
              </h1>

              {/* 18 Countries · 18 Chapters · 18 Languages Theme Pillar */}
              <div
                data-hero-reveal
                className="inline-flex items-center gap-2.5 text-xs sm:text-sm font-medium tracking-[0.12em] uppercase text-[#F7D774] border-l-2 border-[#D4A537] pl-3.5"
              >
                <Globe2 className="w-4 h-4 text-[#D4A537] shrink-0" aria-hidden="true" />
                <span className="tabular-nums">{t('hero.pillars')}</span>
              </div>

              <p
                data-hero-reveal
                className="text-base sm:text-lg text-[#FFFDF7]/90 leading-[1.6] max-w-xl font-normal"
              >
                {heroBodyOverride || (
                  <>
                    <span className="block">{t('hero.subtitleLine1')}</span>
                    <span className="block">{t('hero.subtitleLine2')}</span>
                  </>
                )}
              </p>

              {/* Official Dates */}
              <div
                data-hero-reveal
                className="flex flex-col sm:flex-row sm:items-center gap-4 sm:gap-8 pt-1"
              >
                <div className="flex items-center gap-3">
                  <Calendar className="w-5 h-5 text-[#F7D774] shrink-0" aria-hidden="true" />
                  <div>
                    <p className="font-display text-base sm:text-[17px] font-medium text-white tabular-nums leading-tight">
                      {t('hero.curtainRaiserDate')}
                    </p>
                    <p className="text-xs sm:text-[13px] text-[#E9DCC5]/85 mt-0.5">
                      {t('hero.curtainRaiserLabel')}
                    </p>
                  </div>
                </div>

                <span className="hidden sm:block h-9 w-px bg-[#D4A537]/40" aria-hidden="true" />

                <div className="flex items-center gap-3 sm:block">
                  <Calendar className="sm:hidden w-5 h-5 text-[#F7D774]/80 shrink-0" aria-hidden="true" />
                  <div>
                    <p className="font-display text-base sm:text-[17px] font-medium text-white tabular-nums leading-tight">
                      {t('hero.mainMahotsavDate')}
                    </p>
                    <p className="text-xs sm:text-[13px] text-[#E9DCC5]/85 mt-0.5">
                      {t('hero.mainMahotsavLabel')}
                    </p>
                  </div>
                </div>
              </div>

              {/* Action Bar: Join the Mahotsav (Register Now), Learn More (Discover), View the Story, 3D Gita, Trailer */}
              <div data-hero-reveal className="flex flex-wrap items-center gap-3 pt-2">
                <Link
                  to="/participate/register"
                  data-testid="hero-join-cta"
                  className="inline-flex items-center justify-center gap-2.5 min-h-[46px] px-6 sm:px-7 py-3 rounded-full royal-gold-surface text-sm font-semibold tracking-[0.02em] shadow-[0_10px_28px_rgba(212,165,55,0.32)] hover:brightness-105 transition-all duration-200 whitespace-nowrap shrink-0"
                >
                  <span>{t('hero.joinCta')}</span>
                  <ArrowRight className="w-4 h-4" aria-hidden="true" />
                </Link>

                <a
                  href="#mahotsav"
                  data-testid="hero-learn-more-cta"
                  className="inline-flex items-center justify-center gap-2 min-h-[46px] px-5 sm:px-6 py-3 rounded-full border border-[#F7D774]/65 bg-[#17233A]/75 text-[#FFFDF7] text-sm font-medium hover:border-[#F7D774] hover:text-[#F7D774] transition-colors duration-200 whitespace-nowrap shrink-0"
                >
                  <span>{t('hero.learnMoreCta')}</span>
                </a>

                <Link
                  to="/story"
                  className="inline-flex items-center justify-center gap-2 min-h-[46px] px-5 py-3 rounded-full border border-[#D4A537]/55 bg-[#171717]/75 text-[#FFFDF7] text-sm font-medium hover:border-[#F7D774] hover:text-[#F7D774] transition-colors duration-200 whitespace-nowrap shrink-0"
                >
                  <PlayCircle className="w-4 h-4 text-[#F7D774]" aria-hidden="true" />
                  <span>{t('hero.storyCta')}</span>
                </Link>

                <Link
                  to="/gita"
                  className="inline-flex items-center justify-center gap-2 min-h-[46px] px-5 py-3 rounded-full border border-white/35 bg-[#17233A]/75 text-[#FFFDF7] text-sm font-medium hover:border-[#F7D774] hover:text-[#F7D774] transition-colors duration-200 whitespace-nowrap shrink-0"
                >
                  <BookOpen className="w-4 h-4 text-[#F7D774]" aria-hidden="true" />
                  <span>3D Gita Book</span>
                </Link>

                <button
                  type="button"
                  onClick={() => setTrailerOpen(true)}
                  className="inline-flex items-center justify-center gap-2 min-h-[46px] px-5 py-3 rounded-full border border-white/30 bg-[#17233A]/65 text-white/95 text-sm font-medium hover:bg-white/15 hover:border-white transition-colors duration-200 whitespace-nowrap shrink-0 cursor-pointer"
                >
                  <Play className="w-3.5 h-3.5 fill-current" aria-hidden="true" />
                  <span>{t('hero.secondaryCta')}</span>
                </button>
              </div>
            </div>

            {/* Right Zone: Devotional Spiritual Image Showcase Carousel */}
            <div className="lg:col-span-5 xl:col-span-6 pointer-events-auto" data-hero-reveal>
              <HomepageSpiritualImageCarousel
                slides={publishedSpiritualConfig.slides}
                autoAdvanceMs={publishedSpiritualConfig.autoAdvanceMs}
                eyebrowOverride={
                  krishnaCmsOverride?.subtitle ||
                  (spiritualBlock?.eyebrow?.en &&
                  spiritualBlock.eyebrow.en !== 'Gita Mahotsav 2027'
                    ? spiritualBlock.eyebrow.en
                    : undefined)
                }
                captionOverride={
                  krishnaCmsOverride?.title ||
                  (spiritualBlock?.heading?.en &&
                  spiritualBlock.heading.en !== 'The Eternal Wisdom.'
                    ? spiritualBlock.heading.en
                    : undefined)
                }
                suspended={suspended}
              />
            </div>
          </div>

          {/* Bottom Floor Left Controls: Scroll Prompt + Replay Welcome (Right floor hosts HeroCarousel switcher) */}
          <div className="pt-2 flex flex-wrap items-center gap-6 pointer-events-auto">
            <a
              href="#mahotsav"
              className="inline-flex items-center gap-2.5 text-[11px] sm:text-xs font-medium text-[#FFFDF7]/90 hover:text-white transition-colors group shrink-0"
            >
              <span className="w-5 h-8 rounded-full border border-[#F7D774]/60 flex items-start justify-center pt-1.5 shrink-0">
                <span className="w-0.5 h-2 bg-[#F7D774] rounded-full group-hover:translate-y-1 transition-transform duration-200" />
              </span>
              <span>{t('hero.scrollCue')}</span>
            </a>

            <button
              type="button"
              onClick={dispatchReplayWelcome}
              data-testid="hero-replay-welcome"
              className="inline-flex items-center gap-1.5 text-[11px] sm:text-xs font-medium tracking-[0.06em] uppercase text-[#F7D774]/90 hover:text-[#FFFDF7] transition-colors cursor-pointer"
            >
              <RotateCcw className="w-3.5 h-3.5" aria-hidden="true" />
              <span>{t('welcome.replayWelcome')}</span>
            </button>
          </div>
        </div>
      </section>

      <TrailerModal isOpen={trailerOpen} onClose={() => setTrailerOpen(false)} />
    </>
  );
};

export default Hero;
