import React, { useRef } from 'react';
import { ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import { STATIC_PARTICIPANT_STATEMENT } from '../../content/eventContent';
import { useI18n } from '../../i18n';
import { useScrollReveal } from '../../animations/useScrollReveal';
import { SectionLabel } from '../ui/SectionLabel';
import { EditorialHeading } from '../ui/EditorialHeading';

export const EventIntroduction: React.FC = () => {
  const { t } = useI18n();
  const sectionRef = useRef<HTMLElement | null>(null);

  useScrollReveal(sectionRef, '[data-intro-item]');

  const metrics = [
    {
      index: '01',
      value: t('intro.metricCountriesValue'),
      label: t('intro.metricCountriesLabel'),
      note: null,
    },
    {
      index: '02',
      value: t('intro.metricChaptersValue'),
      label: t('intro.metricChaptersLabel'),
      note: null,
    },
    {
      index: '03',
      value: t('intro.metricLanguagesValue'),
      label: t('intro.metricLanguagesLabel'),
      note: null,
    },
    {
      index: '04',
      value: STATIC_PARTICIPANT_STATEMENT,
      label: t('intro.metricParticipantsLabel'),
      note: t('intro.participantNote'),
    },
  ];

  return (
    <section
      id="mahotsav"
      ref={sectionRef}
      aria-labelledby="intro-heading"
      className="scroll-mt-24 bg-[var(--surface-elevated)] text-[var(--color-ink)] py-24 lg:py-32 hairline-b"
    >
      <div className="max-w-[1360px] mx-auto px-5 sm:px-8 lg:px-12">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-end pb-16 hairline-b">
          <div className="lg:col-span-7 space-y-5" data-intro-item>
            <SectionLabel>{t('intro.eyebrow')}</SectionLabel>
            <EditorialHeading as="h2" size="section" className="max-w-2xl">
              <span id="intro-heading">{t('intro.heading')}</span>
            </EditorialHeading>
          </div>
          <div className="lg:col-span-5" data-intro-item>
            <p className="text-base sm:text-lg leading-relaxed text-[var(--color-muted)] max-w-prose">
              {t('intro.lead')}
            </p>
          </div>
        </div>

        {/* Clean Monolithic Architectural Index Strip */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 divide-y sm:divide-y-0 sm:divide-x divide-[var(--color-border)] border-b border-[var(--color-border)]">
          {metrics.map((item) => (
            <div
              key={item.label}
              data-intro-item
              className="py-10 sm:px-7 first:pl-0 last:pr-0 flex flex-col justify-between"
            >
              <div>
                <span className="block text-[11px] font-medium tracking-[0.12em] text-[var(--color-navy)] tabular-nums mb-5">
                  {item.index}
                </span>
                <p className="font-display text-5xl lg:text-6xl font-light text-[var(--color-navy)] tabular-nums tracking-[-0.03em]">
                  {item.value}
                </p>
                <p className="mt-3 text-sm font-medium text-[var(--color-ink)]">
                  {item.label}
                </p>
              </div>
              {item.note && (
                <p className="mt-4 text-xs leading-relaxed text-[var(--color-muted)]">
                  {item.note}
                </p>
              )}
            </div>
          ))}
        </div>

        <div className="pt-8 flex flex-wrap items-center justify-between gap-4" data-intro-item>
          <p className="text-xs sm:text-sm text-[var(--color-muted)]">
            Journey interactively through Kurukshetra&rsquo;s 15-scene 3D chronicle or inspect the sacred eighteen chapters.
          </p>
          <div className="flex flex-wrap items-center gap-3">
            <Link
              to="/story"
              className="inline-flex items-center gap-2 min-h-[40px] px-5 py-2 rounded-full bg-[#17233A] text-[#FFFDF7] hover:bg-[#0D1322] dark:bg-[#C9A04E] dark:text-[#171717] text-xs font-semibold uppercase tracking-[0.06em] transition-colors"
            >
              <span>Experience 3D Story</span>
              <ArrowRight className="w-3.5 h-3.5" aria-hidden="true" />
            </Link>
            <Link
              to="/gita"
              className="inline-flex items-center gap-2 min-h-[40px] px-5 py-2 rounded-full border border-[#C9A04E]/60 text-xs font-semibold uppercase tracking-[0.06em] text-[var(--color-ink)] hover:bg-[#C9A04E]/15 transition-colors"
            >
              <span>Open 3D Gita Book</span>
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
};
