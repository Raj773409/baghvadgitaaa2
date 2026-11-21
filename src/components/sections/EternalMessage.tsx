import React, { useEffect, useRef, useState } from 'react';
import { ArrowRight } from 'lucide-react';
import { ASSET_MANIFEST } from '../../assets/assetManifest';
import { APPROVED_ETERNAL_QUOTE } from '../../content/eventContent';
import { useI18n } from '../../i18n';
import { ensureGsapRegistered, gsap, prefersReducedMotion } from '../../animations/gsapSetup';
import { useScrollReveal } from '../../animations/useScrollReveal';

export const EternalMessage: React.FC = () => {
  const { t } = useI18n();
  const sectionRef = useRef<HTMLElement | null>(null);
  const backdropRef = useRef<HTMLDivElement | null>(null);
  const [imageError, setImageError] = useState(false);

  const gitaVolume = ASSET_MANIFEST.visualStudies.eternalGitaVolume;
  const approvedQuote =
    APPROVED_ETERNAL_QUOTE && APPROVED_ETERNAL_QUOTE.approved
      ? APPROVED_ETERNAL_QUOTE
      : null;

  useScrollReveal(sectionRef, '[data-message-reveal]');

  useEffect(() => {
    const sectionEl = sectionRef.current;
    const backdropEl = backdropRef.current;
    if (!sectionEl || !backdropEl || prefersReducedMotion()) return;

    ensureGsapRegistered();
    const ctx = gsap.context(() => {
      gsap.fromTo(
        backdropEl,
        { yPercent: -2.5 },
        {
          yPercent: 2.5,
          ease: 'none',
          scrollTrigger: {
            trigger: sectionEl,
            start: 'top bottom',
            end: 'bottom top',
            scrub: true,
          },
        },
      );
    }, sectionEl);

    return () => ctx.revert();
  }, []);

  const scrollToChapters = () => {
    const el = document.getElementById('chapters');
    if (el) {
      el.scrollIntoView({ behavior: prefersReducedMotion() ? 'auto' : 'smooth' });
    }
  };

  return (
    <section
      id="eternal-message"
      ref={sectionRef}
      aria-labelledby="message-heading"
      className="relative scroll-mt-20 overflow-hidden bg-[#161412] text-[#F5F0E7] border-t border-[rgba(213,172,112,0.18)]"
    >
      {/* Full-bleed Right Sanctuary Book Layer (Desktop & Large Viewports) */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 hidden lg:block overflow-hidden"
      >
        <div
          ref={backdropRef}
          className="absolute -inset-y-6 right-0 w-[62%] will-change-transform"
        >
          {!imageError ? (
            <img
              src={gitaVolume.src}
              alt=""
              decoding="async"
              referrerPolicy="no-referrer"
              onError={() => setImageError(true)}
              className="h-full w-full object-cover object-[56%_center] opacity-95"
            />
          ) : (
            <div className="h-full w-full bg-gradient-to-br from-[#231B13] via-[#1B1611] to-[#161412]" />
          )}
        </div>

        {/* Directional obsidian-charcoal feather for crisp left/center typography legibility */}
        <div className="absolute inset-0 bg-gradient-to-r from-[#161412] via-[#161412]/90 via-44% to-transparent" />
        <div className="absolute inset-0 bg-gradient-to-t from-[#161412] via-transparent to-[#161412]/70" />
        {/* Restrained warm antique-bronze ambient sanctuary glow */}
        <div
          className="absolute right-[12%] top-1/2 -translate-y-1/2 w-[520px] h-[360px] rounded-full opacity-35 blur-3xl"
          style={{
            background:
              'radial-gradient(circle, rgba(213, 172, 112, 0.24) 0%, rgba(213, 172, 112, 0.04) 55%, transparent 75%)',
          }}
        />
      </div>

      {/* Main Editorial Grid */}
      <div className="relative z-10 max-w-[1360px] mx-auto px-5 sm:px-8 lg:px-12 py-20 sm:py-24 lg:py-28">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-8 items-center">
          {/* Left Editorial Introduction */}
          <div className="lg:col-span-4 space-y-6" data-message-reveal>
            <div className="flex items-center gap-4">
              <span className="text-[11px] font-medium tracking-[0.22em] uppercase text-[#C8A26A]">
                {t('message.eyebrow')}
              </span>
              <span
                aria-hidden="true"
                className="h-px flex-1 max-w-[96px] bg-gradient-to-r from-[#C8A26A]/55 to-transparent"
              />
            </div>

            <h2
              id="message-heading"
              className="font-editorial font-normal text-[clamp(2.25rem,3.6vw,3.35rem)] leading-[1.06] tracking-[-0.02em] text-[#F5F0E7] text-balance"
            >
              <span className="block">{t('message.headingLine1')}</span>
              <span className="block">{t('message.headingLine2')}</span>
            </h2>

            <p className="text-sm sm:text-[15px] leading-[1.75] text-[#F5F0E7]/80 max-w-[38ch]">
              {t('message.bodyOne')}
            </p>

            <div className="pt-1">
              <button
                type="button"
                onClick={scrollToChapters}
                className="group inline-flex items-center gap-3 pb-1.5 border-b border-[#C8A26A]/55 hover:border-[#D5AC70] text-sm font-medium tracking-[0.04em] text-[#E5C99A] hover:text-[#F5F0E7] transition-colors cursor-pointer"
              >
                <span>{t('message.discoverCta')}</span>
                <ArrowRight
                  className="w-4 h-4 transition-transform duration-200 group-hover:translate-x-1"
                  aria-hidden="true"
                />
              </button>
            </div>
          </div>

          {/* Center Scripture Quotation Zone with Architectural Hairline & Lotus Watermark */}
          <div
            className="lg:col-span-4 relative lg:pl-10 lg:border-l lg:border-[rgba(213,172,112,0.2)] py-4"
            data-message-reveal
          >
            {/* Subtle geometric architectural lotus outline behind the quotation reserve */}
            <svg
              aria-hidden="true"
              viewBox="0 0 180 180"
              className="pointer-events-none absolute -left-10 top-1/2 -translate-y-1/2 w-44 h-44 text-[#D5AC70] opacity-[0.09] hidden lg:block"
              fill="none"
            >
              <path
                d="M90 22C102 48 112 68 112 90C112 112 102 132 90 154C78 132 68 112 68 90C68 68 78 48 90 22Z"
                stroke="currentColor"
                strokeWidth="0.8"
              />
              <path
                d="M90 150C66 136 44 114 36 86C58 88 78 104 90 130C102 104 122 88 144 86C136 114 114 136 90 150Z"
                stroke="currentColor"
                strokeWidth="0.8"
              />
              <path
                d="M90 150C54 142 28 122 20 96C42 104 62 118 76 138"
                stroke="currentColor"
                strokeWidth="0.8"
              />
              <path
                d="M90 150C126 142 152 122 160 96C138 104 118 118 104 138"
                stroke="currentColor"
                strokeWidth="0.8"
              />
            </svg>

            <div className="relative space-y-3 max-w-[34ch]">
              {approvedQuote ? (
                <figure className="space-y-4">
                  <blockquote className="font-editorial italic text-xl sm:text-2xl leading-[1.45] text-[#F5F0E7]/95">
                    “{approvedQuote.quote}”
                  </blockquote>
                  <figcaption className="text-xs tracking-[0.14em] uppercase text-[#C8A26A]">
                    — {approvedQuote.citation}
                  </figcaption>
                </figure>
              ) : (
                <div className="space-y-2.5 border-t border-[rgba(213,172,112,0.2)] pt-4 lg:border-t-0 lg:pt-0">
                  <p className="text-[11px] font-medium tracking-[0.16em] uppercase text-[#C8A26A]">
                    {t('message.quoteSectionTitle')} · {t('message.quoteUnpublishedTitle')}
                  </p>
                  <p className="text-sm leading-[1.7] text-[#F5F0E7]/68">
                    {t('message.scripturePolicyNotice')}
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Right Spacer on Desktop (keeps typography clear of the primary illuminated book plate) */}
          <div className="hidden lg:block lg:col-span-4" aria-hidden="true" />
        </div>

        {/* Tablet & Mobile Dedicated Gita Sacred Volume Plate */}
        <figure className="mt-10 lg:hidden space-y-3" data-message-reveal>
          <div className="relative overflow-hidden rounded-sm border border-[rgba(213,172,112,0.22)] aspect-[16/10] bg-[#1F1A15]">
            {!imageError ? (
              <img
                src={gitaVolume.src}
                alt={t(gitaVolume.altKey)}
                decoding="async"
                referrerPolicy="no-referrer"
                onError={() => setImageError(true)}
                className="h-full w-full object-cover object-center"
              />
            ) : (
              <div className="h-full w-full flex items-center justify-center text-xs tracking-[0.12em] uppercase text-[#C8A26A]">
                {t('assets.eternalGitaVolumeAlt')}
              </div>
            )}
            <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-[#161412]/70 via-transparent to-transparent" />
          </div>
          <figcaption className="text-xs leading-relaxed text-[#F5F0E7]/65">
            {t('message.figureCaptionOne')}
          </figcaption>
        </figure>
      </div>
    </section>
  );
};
