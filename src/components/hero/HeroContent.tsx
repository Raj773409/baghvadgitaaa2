import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, BookOpen, Calendar, Globe2, Play, PlayCircle, RotateCcw } from 'lucide-react';
import { useI18n } from '../../i18n';
import { dispatchReplayWelcome } from '../../utils/welcomeExperience';
import { TrailerModal } from './TrailerModal';

export const HeroContent: React.FC = () => {
  const { t, locale } = useI18n();
  const [trailerOpen, setTrailerOpen] = useState(false);

  return (
    <>
      <div className="relative z-15 max-w-[1360px] mx-auto px-5 sm:px-8 lg:px-12 min-h-[100svh] pt-24 sm:pt-28 pb-6 sm:pb-8 flex flex-col justify-between pointer-events-none">
        {/* Main Asymmetric Hero Grid — Left Copy Zone, Right Clear for Illuminated Carousel Artwork */}
        <div className="my-auto py-3 sm:py-6 grid grid-cols-1 lg:grid-cols-12 items-center gap-8">
          <div className="lg:col-span-7 xl:col-span-6 space-y-5 sm:space-y-6 pointer-events-auto">
            {/* Minimal Eyebrow with Long Fading Royal Gold Rule */}
            <div className="flex items-center gap-5" data-hero-reveal>
              <p className="text-[11px] sm:text-xs font-medium tracking-[0.26em] uppercase text-[#F0D38B] whitespace-nowrap">
                {t('hero.eyebrow')}
              </p>
              <span
                className="hidden sm:block h-px w-24 sm:w-32 bg-gradient-to-r from-[#C9A04E]/75 to-transparent"
                aria-hidden="true"
              />
            </div>

            {/* Monumental 3-Line Headline */}
            <h1
              data-hero-reveal
              className={`font-display font-light text-[clamp(2.25rem,4.65vw,4.25rem)] leading-[1.06] tracking-[0.02em] text-[#FFFDF7] ${
                locale === 'en' ? 'uppercase' : ''
              }`}
            >
              <span className="block">{t('hero.headlineLine1')}</span>
              <span className="block mt-0.5">{t('hero.headlineLine2')}</span>
              <span className="block text-[#F0D38B] font-light mt-0.5">
                {t('hero.headlineAccent')}
              </span>
            </h1>

            {/* Prominent Global Scale Pillar Callout: 18 Countries · 18 Chapters · 18 Languages */}
            <div
              data-hero-reveal
              className="inline-flex items-center gap-2.5 text-xs sm:text-sm font-medium tracking-[0.12em] uppercase text-[#F0D38B] border-l-2 border-[#C9A04E] pl-3.5"
            >
              <Globe2 className="w-4 h-4 text-[#C9A04E] shrink-0" aria-hidden="true" />
              <span className="tabular-nums">{t('hero.pillars')}</span>
            </div>

            {/* Supporting Two-Line Statement */}
            <p
              data-hero-reveal
              className="text-base sm:text-lg text-[#FFFDF7]/90 leading-[1.6] max-w-lg font-normal"
            >
              <span className="block">{t('hero.subtitleLine1')}</span>
              <span className="block">{t('hero.subtitleLine2')}</span>
            </p>

            {/* Event Dates Block */}
            <div
              data-hero-reveal
              className="flex flex-col sm:flex-row sm:items-center gap-4 sm:gap-8 pt-1"
            >
              <div className="flex items-center gap-3.5">
                <Calendar
                  className="w-5 h-5 text-[#F0D38B] shrink-0"
                  aria-hidden="true"
                />
                <div>
                  <p className="font-display text-base sm:text-[17px] font-medium text-white tabular-nums leading-tight">
                    {t('hero.curtainRaiserDate')}
                  </p>
                  <p className="text-xs sm:text-[13px] text-[#E9DCC5]/85 mt-0.5">
                    {t('hero.curtainRaiserLabel')}
                  </p>
                </div>
              </div>

              <span className="hidden sm:block h-9 w-px bg-[#C9A04E]/40" aria-hidden="true" />

              <div className="flex items-center gap-3.5 sm:block">
                <Calendar
                  className="sm:hidden w-5 h-5 text-[#F0D38B]/80 shrink-0"
                  aria-hidden="true"
                />
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

            {/* Primary & Secondary Call-to-Action Buttons */}
            <div data-hero-reveal className="flex flex-wrap items-center gap-3 sm:gap-3.5 pt-2">
              <Link
                to="/participate/register"
                className="inline-flex items-center justify-center gap-2.5 min-h-[46px] px-6 sm:px-7 py-3 rounded-full royal-gold-surface text-sm font-semibold tracking-[0.02em] shadow-[0_10px_28px_rgba(201,160,78,0.28)] hover:brightness-105 transition-all duration-200 whitespace-nowrap shrink-0"
              >
                <span>{t('nav.register')}</span>
                <ArrowRight className="w-4 h-4" aria-hidden="true" />
              </Link>

              <a
                href="#eternal-message"
                className="inline-flex items-center justify-center gap-2 min-h-[46px] px-5 sm:px-6 py-3 rounded-full border border-[#F0D38B]/60 bg-[#17233A]/65 backdrop-blur-xs text-[#FFFDF7] text-sm font-medium hover:border-[#F0D38B] hover:text-[#F0D38B] transition-colors duration-200 whitespace-nowrap shrink-0"
              >
                <span>{t('hero.primaryCta')}</span>
              </a>

              <Link
                to="/gita"
                className="inline-flex items-center justify-center gap-2 min-h-[46px] px-5 py-3 rounded-full border border-white/35 bg-[#17233A]/65 backdrop-blur-xs text-[#FFFDF7] text-sm font-medium hover:border-[#F0D38B] hover:text-[#F0D38B] transition-colors duration-200 whitespace-nowrap shrink-0"
              >
                <BookOpen className="w-4 h-4 text-[#F0D38B]" aria-hidden="true" />
                <span>3D Gita Book</span>
              </Link>

              <Link
                to="/story"
                className="group inline-flex items-center justify-center gap-2 min-h-[46px] px-5 py-3 rounded-full border border-[#C9A04E]/55 bg-[#171717]/65 backdrop-blur-xs text-[#FFFDF7] text-sm font-medium hover:border-[#F0D38B] hover:text-[#F0D38B] transition-colors duration-200 whitespace-nowrap shrink-0"
              >
                <PlayCircle
                  className="w-4 h-4 text-[#F0D38B]"
                  aria-hidden="true"
                />
                <span>{t('hero.storyCta')}</span>
              </Link>

              <button
                type="button"
                onClick={() => setTrailerOpen(true)}
                className="inline-flex items-center justify-center gap-2 min-h-[46px] px-5 py-3 rounded-full border border-white/30 bg-[#17233A]/55 backdrop-blur-xs text-white/95 text-sm font-medium hover:bg-white/15 hover:border-white transition-colors duration-200 whitespace-nowrap shrink-0 cursor-pointer"
              >
                <Play className="w-3.5 h-3.5 fill-current" aria-hidden="true" />
                <span>{t('hero.secondaryCta')}</span>
              </button>
            </div>
          </div>
        </div>

        {/* Bottom Floor: Scroll Prompt + Replay Welcome */}
        <div className="pt-3 flex items-end justify-between gap-4 pointer-events-auto">
          <a
            href="#eternal-message"
            className="inline-flex flex-col items-start gap-2 text-[11px] sm:text-xs font-medium text-[#FFFDF7]/90 hover:text-white transition-colors group shrink-0"
          >
            <span className="inline-flex items-center gap-2.5 sm:gap-3">
              <span className="w-5 h-8 rounded-full border border-[#F0D38B]/60 flex items-start justify-center pt-1.5 shrink-0">
                <span className="w-0.5 h-2 bg-[#F0D38B] rounded-full group-hover:translate-y-1 transition-transform duration-200" />
              </span>
              <span>{t('hero.scrollCue')}</span>
            </span>
          </a>

          <button
            type="button"
            onClick={dispatchReplayWelcome}
            data-testid="hero-replay-welcome"
            className="inline-flex items-center gap-1.5 text-[11px] sm:text-xs font-medium tracking-[0.06em] uppercase text-[#F0D38B]/90 hover:text-[#FFFDF7] transition-colors cursor-pointer pb-1"
          >
            <RotateCcw className="w-3.5 h-3.5" aria-hidden="true" />
            <span>{t('welcome.replayWelcome')}</span>
          </button>
        </div>
      </div>

      <TrailerModal isOpen={trailerOpen} onClose={() => setTrailerOpen(false)} />
    </>
  );
};
