import React, { useRef, useState } from 'react';
import { ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import { ASSET_MANIFEST } from '../../assets/assetManifest';
import { useI18n } from '../../i18n';
import { useScrollReveal } from '../../animations/useScrollReveal';

export const ParticipationSection: React.FC = () => {
  const { t } = useI18n();
  const sectionRef = useRef<HTMLElement | null>(null);
  const [bgError, setBgError] = useState(false);

  const pavilionStudy = ASSET_MANIFEST.visualStudies.sandstoneGallery;

  useScrollReveal(sectionRef, '[data-participation-reveal]');

  return (
    <section
      id="participation"
      ref={sectionRef}
      aria-labelledby="participation-heading"
      className="relative scroll-mt-20 overflow-hidden bg-[var(--color-canvas)] text-[var(--color-ink)] border-t border-[var(--color-border)]"
    >
      {/* Left Architectural Sanctuary Horizon Silhouette Fading Seamlessly into Surface */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-y-0 left-0 w-full sm:w-[62%] lg:w-[44%] overflow-hidden"
      >
        {!bgError && (
          <img
            src={pavilionStudy.src}
            alt=""
            decoding="async"
            referrerPolicy="no-referrer"
            onError={() => setBgError(true)}
            className="h-full w-full object-cover object-left opacity-[0.26] sepia-[0.25] contrast-[0.95]"
          />
        )}
        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-[var(--color-canvas)]/75 to-[var(--color-canvas)]" />
        <div className="absolute inset-0 bg-gradient-to-t from-[var(--color-canvas)] via-transparent to-[var(--color-canvas)]" />
      </div>

      <div className="relative z-10 max-w-[1360px] mx-auto px-5 sm:px-8 lg:px-12 py-20 sm:py-24 lg:py-28">
        <div
          className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-8 items-center"
          data-participation-reveal
        >
          {/* Left Spacer Keeping Silhouette Unobstructed */}
          <div className="hidden lg:block lg:col-span-2" aria-hidden="true" />

          {/* Center Editorial Invitation Bracketed by Fine Antique-Gold Rules */}
          <div className="lg:col-span-7 text-center space-y-4">
            <div className="flex items-center justify-center gap-5">
              <span
                aria-hidden="true"
                className="hidden sm:block h-px w-16 md:w-24 bg-gradient-to-r from-transparent to-[#D4A537]/65"
              />
              <h2
                id="participation-heading"
                className="font-editorial font-normal text-[clamp(2rem,3.6vw,3.15rem)] leading-[1.1] tracking-[-0.02em] text-[var(--color-ink)] text-balance"
              >
                {t('participation.heading')}
              </h2>
              <span
                aria-hidden="true"
                className="hidden sm:block h-px w-16 md:w-24 bg-gradient-to-l from-transparent to-[#D4A537]/65"
              />
            </div>

            <p className="text-sm sm:text-base leading-relaxed text-[var(--color-muted)] max-w-xl mx-auto">
              {t('participation.description')}
            </p>

            {/* Centered Sacred Lotus Line Emblem */}
            <div className="pt-2 flex justify-center" aria-hidden="true">
              <svg
                width="36"
                height="24"
                viewBox="0 0 38 28"
                fill="none"
                className="text-[var(--color-bronze)]"
              >
                <path
                  d="M19 3C16.2 8.2 16.2 14.5 19 20.5C21.8 14.5 21.8 8.2 19 3Z"
                  stroke="currentColor"
                  strokeWidth="1.2"
                  strokeLinejoin="round"
                />
                <path
                  d="M19 20.5C13.5 17.5 10.5 12.2 10 6C14.8 8.5 17.8 13.5 19 20.5Z"
                  stroke="currentColor"
                  strokeWidth="1.2"
                  strokeLinejoin="round"
                />
                <path
                  d="M19 20.5C24.5 17.5 27.5 12.2 28 6C23.2 8.5 20.2 13.5 19 20.5Z"
                  stroke="currentColor"
                  strokeWidth="1.2"
                  strokeLinejoin="round"
                />
                <path
                  d="M19 21.5C12.2 21 6.5 17.5 3.5 11.5C9.2 12.2 14.6 15.8 19 21.5Z"
                  stroke="currentColor"
                  strokeWidth="1.1"
                  strokeLinejoin="round"
                />
                <path
                  d="M19 21.5C25.8 21 31.5 17.5 34.5 11.5C28.8 12.2 23.4 15.8 19 21.5Z"
                  stroke="currentColor"
                  strokeWidth="1.1"
                  strokeLinejoin="round"
                />
                <path
                  d="M12 24.5H26"
                  stroke="currentColor"
                  strokeWidth="1.1"
                  strokeLinecap="round"
                />
              </svg>
            </div>
          </div>

          {/* Right Official Registration Action */}
          <div className="lg:col-span-3 flex flex-col items-center lg:items-end gap-3">
            <Link
              to="/participate/register"
              className="group inline-flex items-center justify-center gap-3 min-h-[48px] px-8 py-3.5 rounded-full bg-[#17233A] dark:bg-[#D4A537] text-[#FFFDF7] dark:text-[#171717] hover:bg-[#171717] dark:hover:bg-[#F7D774] text-sm font-medium tracking-[0.02em] shadow-[0_10px_28px_rgba(23,24,23,0.16)] transition-colors duration-200 whitespace-nowrap shrink-0"
            >
              <span>{t('participation.cta')}</span>
              <ArrowRight
                className="w-4 h-4 text-[#F7D774] dark:text-[#171717] transition-transform duration-200 group-hover:translate-x-1"
                aria-hidden="true"
              />
            </Link>
            <p className="text-[11px] text-[var(--color-muted)] text-center lg:text-right max-w-[26ch] leading-relaxed">
              {t('participation.externalNote')}
            </p>
          </div>
        </div>
      </div>
    </section>
  );
};
