import React, { useRef, useState } from 'react';
import {
  ArrowRight,
  ChevronLeft,
  ChevronRight,
  Globe,
  Map as MapIcon,
  RotateCcw,
} from 'lucide-react';
import { AnimatePresence, motion } from 'motion/react';
import { PARTICIPATING_COUNTRIES } from '../../content/countryContent';
import { useI18n } from '../../i18n';
import { useScrollReveal } from '../../animations/useScrollReveal';
import { prefersReducedMotion } from '../../animations/gsapSetup';
import { WorldAtlasMap } from './WorldAtlasMap';
import { GlobalJourneyGlobe } from './GlobalJourneyGlobe';
import { useNearViewport } from '../../hooks/useNearViewport';

export interface GlobalJourneyProps {
  suspended3D?: boolean;
}

export const GlobalJourney: React.FC<GlobalJourneyProps> = ({
  suspended3D = false,
}) => {
  const { t } = useI18n();
  const sectionRef = useRef<HTMLElement | null>(null);
  const explorationRef = useRef<HTMLDivElement | null>(null);
  const { hasEnteredViewport } = useNearViewport(
    sectionRef,
    '550px 0px',
    suspended3D,
  );

  const [selectedCountryId, setSelectedCountryId] = useState<string>('india');
  const [hoveredCountryId, setHoveredCountryId] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<'globe' | 'atlas'>('globe');
  const [resetSignal, setResetSignal] = useState(0);

  useScrollReveal(sectionRef, '[data-global-reveal]');

  const selectedIndex = PARTICIPATING_COUNTRIES.findIndex(
    (c) => c.id === selectedCountryId,
  );
  const safeIndex = selectedIndex >= 0 ? selectedIndex : 0;
  const selectedCountry = PARTICIPATING_COUNTRIES[safeIndex];
  const hoveredCountry = hoveredCountryId
    ? PARTICIPATING_COUNTRIES.find((c) => c.id === hoveredCountryId) ?? null
    : null;

  const firstColCountries = PARTICIPATING_COUNTRIES.slice(0, 9);
  const secondColCountries = PARTICIPATING_COUNTRIES.slice(9, 18);

  const handleReset = () => {
    setSelectedCountryId('india');
    setResetSignal((n) => n + 1);
  };

  const handlePrevCountry = () => {
    const prevIdx =
      safeIndex <= 0 ? PARTICIPATING_COUNTRIES.length - 1 : safeIndex - 1;
    setSelectedCountryId(PARTICIPATING_COUNTRIES[prevIdx].id);
  };

  const handleNextCountry = () => {
    const nextIdx =
      safeIndex >= PARTICIPATING_COUNTRIES.length - 1 ? 0 : safeIndex + 1;
    setSelectedCountryId(PARTICIPATING_COUNTRIES[nextIdx].id);
  };

  const scrollToExploration = () => {
    explorationRef.current?.scrollIntoView({
      behavior: prefersReducedMotion() ? 'auto' : 'smooth',
      block: 'nearest',
    });
  };

  return (
    <section
      id="global-journey"
      ref={sectionRef}
      aria-labelledby="global-heading"
      className="relative scroll-mt-20 overflow-hidden bg-[#131518] text-[#F5F0E7] border-t border-[rgba(213,172,112,0.18)] border-b border-[rgba(213,172,112,0.16)]"
    >
      {/* Subtle Atmospheric Radial Depth Behind 3D Earth on Right */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            'radial-gradient(62% 72% at 78% 42%, rgba(44, 68, 102, 0.34) 0%, rgba(19, 21, 24, 0.92) 68%, #131518 100%)',
        }}
      />

      <div className="relative z-10 max-w-[1360px] mx-auto px-5 sm:px-8 lg:px-12 py-20 sm:py-24 lg:py-28 space-y-14">
        {/* Section 1 — Cinematic 3-Zone Editorial + Country Columns + Illuminated 3D Earth */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-6 items-center">
          {/* Left 4 Columns: Eyebrow, Heading, Intro, Primary CTA */}
          <div className="lg:col-span-4 space-y-6" data-global-reveal>
            <div className="flex items-center gap-4">
              <span className="text-[11px] font-medium tracking-[0.22em] uppercase text-[#C8A26A]">
                {t('global.eyebrow')}
              </span>
              <span
                aria-hidden="true"
                className="h-px flex-1 max-w-[96px] bg-gradient-to-r from-[#C8A26A]/55 to-transparent"
              />
            </div>

            <h2
              id="global-heading"
              className="font-editorial lining-nums tabular-nums font-normal text-[clamp(2.25rem,3.6vw,3.4rem)] leading-[1.06] tracking-[-0.02em] text-[#F5F0E7] text-balance"
            >
              <span className="block">{t('global.headingLine1')}</span>
              <span className="block">{t('global.headingLine2')}</span>
            </h2>

            <p className="text-sm sm:text-[15px] leading-[1.75] text-[#F5F0E7]/78 max-w-[36ch]">
              {t('global.description')}
            </p>

            <div className="pt-1">
              <button
                type="button"
                onClick={scrollToExploration}
                className="group inline-flex items-center gap-3 px-6 py-3 rounded-full border border-[#C8A26A]/65 bg-[#1B1E23]/75 hover:bg-[#C8A26A]/15 hover:border-[#D5AC70] text-sm font-medium text-[#F5F0E7] transition-colors cursor-pointer"
              >
                <span>{t('global.exploreCta')}</span>
                <ArrowRight
                  className="w-4 h-4 text-[#D5AC70] transition-transform duration-200 group-hover:translate-x-1"
                  aria-hidden="true"
                />
              </button>
            </div>
          </div>

          {/* Middle 3 Columns: Verified 18-Country Interactive Two-Column List */}
          <div
            className="lg:col-span-3 lg:border-l lg:border-[rgba(213,172,112,0.22)] lg:pl-7 py-2"
            data-global-reveal
          >
            <p className="sr-only">{t('global.directoryHeading')}</p>
            <div className="grid grid-cols-2 gap-x-6 gap-y-1">
              <div className="space-y-1">
                {firstColCountries.map((country) => {
                  const active = country.id === selectedCountryId;
                  return (
                    <button
                      key={country.id}
                      type="button"
                      onClick={() => setSelectedCountryId(country.id)}
                      aria-pressed={active}
                      className={`w-full text-left py-1 text-[13.5px] leading-snug transition-colors cursor-pointer flex items-center gap-2 ${
                        active
                          ? 'text-[#D5AC70] font-medium'
                          : 'text-[#F5F0E7]/82 hover:text-[#F5F0E7]'
                      }`}
                    >
                      <span
                        aria-hidden="true"
                        className={`inline-block h-[1px] transition-all duration-150 ${
                          active ? 'w-3 bg-[#D5AC70]' : 'w-0 bg-transparent'
                        }`}
                      />
                      <span className="truncate">{t(country.nameKey)}</span>
                    </button>
                  );
                })}
              </div>

              <div className="space-y-1">
                {secondColCountries.map((country) => {
                  const active = country.id === selectedCountryId;
                  return (
                    <button
                      key={country.id}
                      type="button"
                      onClick={() => setSelectedCountryId(country.id)}
                      aria-pressed={active}
                      className={`w-full text-left py-1 text-[13.5px] leading-snug transition-colors cursor-pointer flex items-center gap-2 ${
                        active
                          ? 'text-[#D5AC70] font-medium'
                          : 'text-[#F5F0E7]/82 hover:text-[#F5F0E7]'
                      }`}
                    >
                      <span
                        aria-hidden="true"
                        className={`inline-block h-[1px] transition-all duration-150 ${
                          active ? 'w-3 bg-[#D5AC70]' : 'w-0 bg-transparent'
                        }`}
                      />
                      <span className="truncate">{t(country.nameKey)}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Right 5 Columns: Illuminated Interactive 3D Earth / Atlas View */}
          <div className="lg:col-span-5 space-y-3" data-global-reveal>
            {/* Quiet View Controls Bar */}
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div
                role="group"
                aria-label={t('global.heading')}
                className="inline-flex items-center border border-[rgba(213,172,112,0.24)] bg-[#191C21]"
              >
                <button
                  type="button"
                  onClick={() => setViewMode('globe')}
                  aria-pressed={viewMode === 'globe'}
                  className={`inline-flex items-center gap-1.5 min-h-[36px] px-3.5 py-1.5 text-xs font-medium whitespace-nowrap transition-colors cursor-pointer ${
                    viewMode === 'globe'
                      ? 'bg-[#D5AC70] text-[#131518]'
                      : 'text-[#F5F0E7]/75 hover:text-white'
                  }`}
                >
                  <Globe className="w-3.5 h-3.5" aria-hidden="true" />
                  <span>{t('global.viewGlobe')}</span>
                </button>
                <button
                  type="button"
                  onClick={() => setViewMode('atlas')}
                  aria-pressed={viewMode === 'atlas'}
                  className={`inline-flex items-center gap-1.5 min-h-[36px] px-3.5 py-1.5 text-xs font-medium whitespace-nowrap transition-colors cursor-pointer ${
                    viewMode === 'atlas'
                      ? 'bg-[#D5AC70] text-[#131518]'
                      : 'text-[#F5F0E7]/75 hover:text-white'
                  }`}
                >
                  <MapIcon className="w-3.5 h-3.5" aria-hidden="true" />
                  <span>{t('global.viewAtlas')}</span>
                </button>
              </div>

              <button
                type="button"
                onClick={handleReset}
                className="inline-flex items-center gap-1.5 min-h-[36px] px-3.5 py-1.5 text-xs font-medium text-[#F5F0E7]/85 border border-[rgba(213,172,112,0.24)] hover:border-[#D5AC70] hover:text-white transition-colors cursor-pointer"
              >
                <RotateCcw className="w-3.5 h-3.5" aria-hidden="true" />
                <span>{t('global.resetView')}</span>
              </button>
            </div>

            {/* 3D Earth Canvas or 2D Geodesic Atlas */}
            <div className="relative">
              {viewMode === 'globe' && !suspended3D && hasEnteredViewport ? (
                <GlobalJourneyGlobe
                  countries={PARTICIPATING_COUNTRIES}
                  selectedCountryId={selectedCountryId}
                  onSelectCountry={setSelectedCountryId}
                  onHoverCountry={setHoveredCountryId}
                  resetSignal={resetSignal}
                />
              ) : (
                <WorldAtlasMap
                  countries={PARTICIPATING_COUNTRIES}
                  selectedCountryId={selectedCountryId}
                  onSelectCountry={setSelectedCountryId}
                />
              )}

              {/* Subtle Non-Obstructing Hover Country Indicator at Bottom Edge */}
              <div className="flex items-center justify-between gap-4 pt-2 text-xs text-[#F5F0E7]/65">
                <span>
                  {viewMode === 'globe' ? t('global.globeHint') : t('global.atlasHint')}
                </span>
                {hoveredCountry && (
                  <span className="text-[#D5AC70] font-medium whitespace-nowrap shrink-0 tabular-nums">
                    {t(hoveredCountry.nameKey)} · {hoveredCountry.code}
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Section 2 — Interactive Country Exploration Panel */}
        <div
          id="country-exploration"
          ref={explorationRef}
          className="pt-10 border-t border-[rgba(213,172,112,0.2)]"
        >
          <AnimatePresence mode="wait">
            <motion.div
              key={selectedCountry.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -6 }}
              transition={{ duration: 0.24, ease: [0.16, 1, 0.3, 1] }}
              className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-10 items-start"
            >
              {/* Selected Nation Identity & Coordinates */}
              <div className="lg:col-span-5 space-y-4">
                <div className="flex items-center justify-between gap-4">
                  <span className="text-[11px] font-medium tracking-[0.18em] uppercase text-[#C8A26A]">
                    {t('global.countryExplorationEyebrow')} ·{' '}
                    {String(safeIndex + 1).padStart(2, '0')} / 18
                  </span>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={handlePrevCountry}
                      aria-label={t('global.prevCountry')}
                      className="inline-flex items-center justify-center w-9 h-9 rounded-full border border-[rgba(213,172,112,0.28)] text-[#F5F0E7]/85 hover:border-[#D5AC70] hover:text-white transition-colors cursor-pointer"
                    >
                      <ChevronLeft className="w-4 h-4" aria-hidden="true" />
                    </button>
                    <button
                      type="button"
                      onClick={handleNextCountry}
                      aria-label={t('global.nextCountry')}
                      className="inline-flex items-center justify-center w-9 h-9 rounded-full border border-[rgba(213,172,112,0.28)] text-[#F5F0E7]/85 hover:border-[#D5AC70] hover:text-white transition-colors cursor-pointer"
                    >
                      <ChevronRight className="w-4 h-4" aria-hidden="true" />
                    </button>
                  </div>
                </div>

                <div className="flex items-baseline gap-4">
                  <h3 className="font-editorial text-3xl sm:text-4xl font-normal text-[#F5F0E7] tracking-[-0.02em]">
                    {t(selectedCountry.nameKey)}
                  </h3>
                  <span className="text-xs font-medium tracking-[0.16em] text-[#C8A26A] tabular-nums">
                    {selectedCountry.code}
                  </span>
                </div>

                <dl className="grid grid-cols-2 gap-6 pt-2">
                  <div>
                    <dt className="text-xs text-[#F5F0E7]/55">{t('global.regionLabel')}</dt>
                    <dd className="mt-1 text-sm font-medium text-[#F5F0E7]">
                      {t(selectedCountry.regionKey)}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-xs text-[#F5F0E7]/55">
                      {t('global.coordinatesLabel')}
                    </dt>
                    <dd className="mt-1 text-sm font-medium text-[#F5F0E7] tabular-nums">
                      {selectedCountry.lat.toFixed(2)}°, {selectedCountry.lon.toFixed(2)}°
                    </dd>
                  </div>
                </dl>
              </div>

              {/* Verified & Client-Approved Event Information Slot */}
              <div className="lg:col-span-7 lg:border-l lg:border-[rgba(213,172,112,0.18)] lg:pl-10 space-y-3">
                <p className="text-[11px] font-medium tracking-[0.16em] uppercase text-[#C8A26A]">
                  {t('global.statusLabel')}
                </p>
                <p className="text-sm sm:text-base leading-[1.75] text-[#F5F0E7]/82 max-w-[62ch]">
                  {selectedCountry.approvedSummaryKey
                    ? t(selectedCountry.approvedSummaryKey)
                    : t('global.awaitingCountryCopy')}
                </p>
                <p className="pt-2 text-xs leading-relaxed text-[#F5F0E7]/52">
                  {t('global.integrityNote')}
                </p>
              </div>
            </motion.div>
          </AnimatePresence>
        </div>
      </div>
    </section>
  );
};
