import React, { useState } from 'react';
import { BookOpen, Calendar, Users } from 'lucide-react';
import { ASSET_MANIFEST } from '../../assets/assetManifest';
import { useI18n } from '../../i18n';

const GoldenOrnamentalRule: React.FC = () => (
  <div className="flex items-center justify-center gap-3 w-full max-w-[360px]" aria-hidden="true">
    <span className="flex-1 h-px bg-gradient-to-r from-transparent via-[#D6A447]/65 to-[#F3CD82]" />
    <svg width="24" height="13" viewBox="0 0 26 14" fill="none" className="text-[#F3CD82] shrink-0">
      <path
        d="M13 2C11.6 4.8 11.6 7.5 13 10.5C14.4 7.5 14.4 4.8 13 2Z"
        fill="currentColor"
        fillOpacity="0.28"
        stroke="currentColor"
        strokeWidth="1"
      />
      <path
        d="M13 10.5C9.5 9.2 7.4 6.5 6.8 3.5C9.8 4.8 11.8 7.2 13 10.5Z"
        stroke="currentColor"
        strokeWidth="0.95"
      />
      <path
        d="M13 10.5C16.5 9.2 18.6 6.5 19.2 3.5C16.2 4.8 14.2 7.2 13 10.5Z"
        stroke="currentColor"
        strokeWidth="0.95"
      />
      <path d="M2 12H24" stroke="currentColor" strokeWidth="0.75" strokeOpacity="0.65" />
    </svg>
    <span className="flex-1 h-px bg-gradient-to-l from-transparent via-[#D6A447]/65 to-[#F3CD82]" />
  </div>
);

export const DevotionalArtworkPanel: React.FC = () => {
  const { t } = useI18n();
  const [mobileImgError, setMobileImgError] = useState(false);
  const mobileArtwork = ASSET_MANIFEST.visualStudies.registrationKurukshetraMobile;

  return (
    <div
      data-reg-artwork-panel
      className="relative flex flex-col justify-end w-full lg:w-[48%] lg:min-h-[calc(100svh-88px)] shrink-0"
    >
      {/* Mobile & Tablet Compact Devotional Hero: Unobstructed Krishna & Arjuna Artwork Blending Cleanly into Dark Navy Text Region */}
      <div className="lg:hidden w-full bg-[#101426] overflow-hidden">
        <div className="relative w-full h-[330px] sm:h-[430px] overflow-hidden">
          {!mobileImgError && (
            <img
              src={mobileArtwork.src}
              alt={t(mobileArtwork.altKey)}
              decoding="async"
              fetchPriority="high"
              referrerPolicy="no-referrer"
              onError={() => setMobileImgError(true)}
              className="w-full h-full object-cover object-[center_22%] select-none"
            />
          )}
          <div
            aria-hidden="true"
            className="absolute inset-0 pointer-events-none"
            style={{
              background:
                'linear-gradient(180deg, rgba(16, 20, 38, 0.14) 0%, rgba(16, 20, 38, 0.08) 45%, rgba(16, 20, 38, 0.78) 82%, #101426 100%)',
            }}
          />
        </div>

        <div className="relative z-10 -mt-12 px-5 sm:px-8 pb-6">
          <ArtworkEditorialBlock />
        </div>
      </div>

      {/* Desktop Overlay Sitting Cleanly at Bottom-Left of the Panoramic Devotional Canvas */}
      <div className="hidden lg:block relative z-10 pt-44 pb-3 pr-6 xl:pr-10">
        <div
          aria-hidden="true"
          className="pointer-events-none absolute -inset-x-10 -bottom-6 top-8 -z-10"
          style={{
            background:
              'radial-gradient(ellipse 96% 84% at 38% 82%, rgba(16, 20, 38, 0.9) 0%, rgba(16, 20, 38, 0.65) 56%, rgba(16, 20, 38, 0) 100%)',
          }}
        />
        <ArtworkEditorialBlock />
      </div>
    </div>
  );
};

const ArtworkEditorialBlock: React.FC = () => {
  const { t } = useI18n();

  const metrics = [
    {
      id: 'curtain',
      icon: Calendar,
      value: t('registration.hero.curtainDate'),
      label: t('registration.hero.curtainLabel'),
    },
    {
      id: 'main',
      icon: Calendar,
      value: t('registration.hero.mainDate'),
      label: t('registration.hero.mainLabel'),
    },
    {
      id: 'countries',
      icon: Users,
      value: t('registration.hero.countriesValue'),
      label: t('registration.hero.countriesLabel'),
    },
    {
      id: 'chapters',
      icon: BookOpen,
      value: t('registration.hero.chaptersValue'),
      label: t('registration.hero.chaptersLabel'),
    },
  ];

  return (
    <div className="space-y-3">
      <p
        data-reg-hero-reveal
        className="text-[11px] font-medium tracking-[0.22em] uppercase text-[#F3CD82]"
      >
        {t('registration.hero.eyebrow')}
      </p>

      <h1
        data-reg-hero-reveal
        className="font-editorial font-normal text-[clamp(2.1rem,3.65vw,3.2rem)] leading-[1.03] tracking-[-0.015em] text-[#FFF6E8] text-balance drop-shadow-[0_2px_18px_rgba(16,20,38,0.85)]"
      >
        <span className="block">{t('registration.hero.headlineLine1')}</span>
        <span className="block italic text-[#FFF6E8]">{t('registration.hero.headlineLine2')}</span>
      </h1>

      <p
        data-reg-hero-reveal
        className="text-sm sm:text-[14.5px] leading-[1.55] text-[#F4E8D3]/92 max-w-[44ch] drop-shadow-[0_1px_10px_rgba(16,20,38,0.85)]"
      >
        {t('registration.hero.subtitle')}
      </p>

      <div data-reg-hero-reveal className="pt-1.5 space-y-2.5 max-w-[490px]">
        <div className="flex justify-center sm:justify-start sm:pl-14">
          <GoldenOrnamentalRule />
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-y-2 sm:gap-y-0 items-start">
          {metrics.map((item, idx) => {
            const Icon = item.icon;
            return (
              <div
                key={item.id}
                className={`flex flex-col items-center text-center px-2.5 py-1.5 ${
                  idx > 0 ? 'sm:border-l sm:border-[#F3CD82]/28' : ''
                } ${idx % 2 === 1 ? 'border-l border-[#F3CD82]/22 sm:border-l' : ''}`}
              >
                <Icon className="w-[17px] h-[17px] text-[#F3CD82] mb-1" strokeWidth={1.6} aria-hidden="true" />
                <span className="text-[13px] font-semibold text-[#FFF6E8] tabular-nums leading-snug whitespace-nowrap">
                  {item.value}
                </span>
                <span className="text-[11px] text-[#F4E8D3]/80 leading-tight mt-0.5 whitespace-nowrap">
                  {item.label}
                </span>
              </div>
            );
          })}
        </div>

        <div className="flex justify-center sm:justify-start sm:pl-14">
          <GoldenOrnamentalRule />
        </div>
      </div>
    </div>
  );
};
