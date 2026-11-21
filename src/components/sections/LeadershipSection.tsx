import React, { useMemo } from 'react';
import { APPROVED_LEADERSHIP_RECORDS } from '../../content/eventContent';
import { usePublishedCollections } from '../../hooks/usePublicCms';
import { useI18n } from '../../i18n';
import { SectionLabel } from '../ui/SectionLabel';
import { EditorialHeading } from '../ui/EditorialHeading';

export const LeadershipSection: React.FC = () => {
  const { t } = useI18n();
  const publishedLeadership = usePublishedCollections('leadership');
  const approvedRecords = useMemo(() => {
    if (publishedLeadership.length > 0) {
      return publishedLeadership.map((item) => ({
        id: item.id,
        name: item.title,
        designation: item.subtitle,
        portraitSrc: item.imageUrl || null,
        categoryLabel: item.badgeLabel || t('leadership.categories.organizing'),
      }));
    }
    return APPROVED_LEADERSHIP_RECORDS.filter((r) => r.approved).map((r) => ({
      id: r.id,
      name: r.name,
      designation: r.designation,
      portraitSrc: r.portraitSrc,
      categoryLabel: t(`leadership.categories.${r.category}`),
    }));
  }, [publishedLeadership, t]);

  const trackKeys = [
    'leadership.categories.organizing',
    'leadership.categories.advisory',
    'leadership.categories.spiritual',
    'leadership.categories.dignitary',
    'leadership.categories.speaker',
  ];

  return (
    <section
      id="leadership"
      aria-labelledby="leadership-heading"
      className="scroll-mt-24 bg-[var(--color-canvas)] text-[var(--color-ink)] py-24 lg:py-32 hairline-b"
    >
      <div className="max-w-[1360px] mx-auto px-5 sm:px-8 lg:px-12">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-16 items-start">
          {/* Left 5 Columns: Curatorial Protocol Thesis */}
          <div className="lg:col-span-5 space-y-5">
            <SectionLabel>{t('leadership.eyebrow')}</SectionLabel>
            <EditorialHeading as="h2" size="section">
              <span id="leadership-heading">{t('leadership.heading')}</span>
            </EditorialHeading>
            <p className="text-sm sm:text-base leading-relaxed text-[var(--color-muted)] max-w-prose">
              {t('leadership.description')}
            </p>
            {approvedRecords.length === 0 && (
              <div className="pt-6 border-t border-[var(--color-border)] space-y-2">
                <p className="text-xs font-medium tracking-[0.1em] uppercase text-[var(--color-bronze)]">
                  {t('leadership.emptyTitle')}
                </p>
                <p className="text-sm leading-relaxed text-[var(--color-muted)]">
                  {t('leadership.emptyDescription')}
                </p>
              </div>
            )}
          </div>

          {/* Right 7 Columns: Clean Open Directory Ledger (Zero Boxed Cards) */}
          <div className="lg:col-span-7">
            {approvedRecords.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-10">
                {approvedRecords.map((person) => (
                  <article
                    key={person.id}
                    className="border-t border-[var(--color-border)] pt-6 space-y-4"
                  >
                    {person.portraitSrc && (
                      <img
                        src={person.portraitSrc}
                        alt={person.name}
                        referrerPolicy="no-referrer"
                        className="w-full aspect-[3/4] object-cover"
                      />
                    )}
                    <div>
                      <p className="text-xs font-medium tracking-[0.12em] uppercase text-[var(--color-bronze)]">
                        {person.categoryLabel}
                      </p>
                      <h3 className="font-display text-2xl font-normal text-[var(--color-ink)] mt-1">
                        {person.name}
                      </h3>
                      <p className="text-sm text-[var(--color-muted)] mt-1">
                        {person.designation}
                      </p>
                    </div>
                  </article>
                ))}
              </div>
            ) : (
              <ul className="border-t border-[var(--color-border)] divide-y divide-[var(--color-border)] border-b">
                {trackKeys.map((key, idx) => (
                  <li
                    key={key}
                    className="py-6 flex flex-col sm:flex-row sm:items-baseline justify-between gap-2"
                  >
                    <div className="flex items-baseline gap-5">
                      <span className="text-xs font-medium text-[var(--color-bronze)] tabular-nums w-6 shrink-0">
                        {String(idx + 1).padStart(2, '0')}
                      </span>
                      <span className="font-display text-xl sm:text-2xl font-light text-[var(--color-ink)]">
                        {t(key)}
                      </span>
                    </div>
                    <span className="text-xs text-[var(--color-muted)] sm:text-right pl-11 sm:pl-0">
                      {t('leadership.pendingTag')}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      </div>
    </section>
  );
};
