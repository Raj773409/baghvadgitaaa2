import React from 'react';
import { Calendar } from 'lucide-react';
import { PUBLISHED_MILESTONES } from '../../content/eventContent';
import { useI18n } from '../../i18n';
import { SectionLabel } from '../ui/SectionLabel';
import { EditorialHeading } from '../ui/EditorialHeading';
import { MilestoneCountdownDigits, useLiveCountdowns } from './EventCountdown';

export const EventTimeline: React.FC = () => {
  const { t } = useI18n();
  const countdowns = useLiveCountdowns();

  return (
    <section
      id="timeline"
      aria-labelledby="timeline-heading"
      className="scroll-mt-24 bg-[var(--surface-elevated)] text-[var(--color-ink)] py-24 lg:py-32 hairline-b"
    >
      <div className="max-w-[1360px] mx-auto px-5 sm:px-8 lg:px-12">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 pb-14 hairline-b items-end">
          <div className="lg:col-span-6 space-y-4">
            <SectionLabel>{t('timeline.eyebrow')}</SectionLabel>
            <EditorialHeading as="h2" size="section">
              <span id="timeline-heading">{t('timeline.heading')}</span>
            </EditorialHeading>
          </div>
          <div className="lg:col-span-6">
            <p className="text-sm sm:text-base leading-relaxed text-[var(--color-muted)] max-w-prose">
              {t('timeline.description')}
            </p>
          </div>
        </div>

        {/* Dual Architectural Calendar Columns */}
        <div className="grid grid-cols-1 md:grid-cols-2 divide-y md:divide-y-0 md:divide-x divide-[var(--color-border)] border-b border-[var(--color-border)]">
          {PUBLISHED_MILESTONES.map((milestone, index) => (
            <article
              key={milestone.id}
              className="py-12 md:px-10 first:pl-0 last:pr-0 flex flex-col justify-between gap-8"
            >
              <div className="space-y-5">
                <div className="flex items-center justify-between gap-4">
                  <span className="text-xs font-medium tracking-[0.14em] uppercase text-[var(--color-bronze)] tabular-nums">
                    {String(index + 1).padStart(2, '0')} · {milestone.isoDate}
                  </span>
                  <Calendar className="w-4 h-4 text-[var(--color-bronze)]" aria-hidden="true" />
                </div>

                <div>
                  <p className="font-display text-3xl sm:text-4xl font-light text-[var(--color-ink)] tracking-[-0.025em] tabular-nums">
                    {t(milestone.labelKey)}
                  </p>
                  <h3 className="mt-2 text-lg font-medium text-[var(--color-ink)]">
                    {t(milestone.titleKey)}
                  </h3>
                </div>

                <p className="text-sm sm:text-base leading-relaxed text-[var(--color-muted)] max-w-prose">
                  {t(milestone.descriptionKey)}
                </p>

                <div className="pt-4 border-t border-[var(--color-border)] space-y-2">
                  <p className="text-[11px] font-medium tracking-[0.14em] uppercase text-[var(--color-bronze)]">
                    {t('countdown.timeRemainingPrefix')}
                  </p>
                  <MilestoneCountdownDigits
                    breakdown={countdowns[milestone.id]}
                    tone="light"
                    compact
                  />
                </div>
              </div>

              <p className="pt-4 border-t border-[var(--color-border)] text-xs text-[var(--color-muted)]">
                {milestone.venueApproved ?? t('timeline.venuePending')}
              </p>
            </article>
          ))}
        </div>

        <div className="pt-8 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <p className="text-xs font-medium tracking-[0.14em] uppercase text-[var(--color-bronze)]">
            {t('timeline.upcomingProgramsLabel')}
          </p>
          <p className="text-sm text-[var(--color-muted)] max-w-2xl">
            {t('timeline.upcomingProgramsNote')}
          </p>
        </div>
      </div>
    </section>
  );
};
