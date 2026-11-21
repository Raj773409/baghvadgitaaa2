import React, { useState } from 'react';
import { ASSET_MANIFEST } from '../../assets/assetManifest';
import type { MediaCategory, MediaRecord } from '../../content/eventContent';
import { useI18n } from '../../i18n';
import { SectionLabel } from '../ui/SectionLabel';
import { EditorialHeading } from '../ui/EditorialHeading';
import { MotionImage } from '../ui/MotionImage';

export const MediaSection: React.FC = () => {
  const { t } = useI18n();
  const [filter, setFilter] = useState<MediaCategory>('all');

  const records: MediaRecord[] = [
    {
      id: 'study-colonnade',
      category: 'photographs',
      titleKey: 'media.studyOneTitle',
      captionKey: 'media.studyOneCaption',
      dateLabelKey: 'media.studyBadge',
      imageSrc: ASSET_MANIFEST.visualStudies.sandstoneGallery.src,
      aspectRatio: '16:9',
      status: 'visual-study',
    },
    {
      id: 'study-craft',
      category: 'photographs',
      titleKey: 'media.studyTwoTitle',
      captionKey: 'media.studyTwoCaption',
      dateLabelKey: 'media.studyBadge',
      imageSrc: ASSET_MANIFEST.visualStudies.manuscriptCraft.src,
      aspectRatio: '4:3',
      status: 'visual-study',
    },
    {
      id: 'study-evening',
      category: 'photographs',
      titleKey: 'media.studyThreeTitle',
      captionKey: 'media.studyThreeCaption',
      dateLabelKey: 'media.studyBadge',
      imageSrc: ASSET_MANIFEST.visualStudies.eveningSanctum.src,
      aspectRatio: '16:9',
      status: 'visual-study',
    },
  ];

  const visibleRecords =
    filter === 'all' ? records : records.filter((item) => item.category === filter);

  const tabs: Array<{ id: MediaCategory; labelKey: string }> = [
    { id: 'all', labelKey: 'media.filterAll' },
    { id: 'photographs', labelKey: 'media.filterPhotographs' },
    { id: 'videos', labelKey: 'media.filterVideos' },
    { id: 'press', labelKey: 'media.filterPress' },
    { id: 'announcements', labelKey: 'media.filterAnnouncements' },
  ];

  const leadItem = visibleRecords[0];
  const secondaryItems = visibleRecords.slice(1);

  return (
    <section
      id="media"
      aria-labelledby="media-heading"
      className="scroll-mt-24 bg-[var(--color-canvas)] text-[var(--color-ink)] py-24 lg:py-32 hairline-b"
    >
      <div className="max-w-[1360px] mx-auto px-5 sm:px-8 lg:px-12">
        <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-8 pb-8 hairline-b">
          <div className="max-w-2xl space-y-4">
            <SectionLabel>{t('media.eyebrow')}</SectionLabel>
            <EditorialHeading as="h2" size="section">
              <span id="media-heading">{t('media.heading')}</span>
            </EditorialHeading>
            <p className="text-sm sm:text-base leading-relaxed text-[var(--color-muted)] max-w-prose">
              {t('media.description')}
            </p>
          </div>

          {/* Crisp Underline Filter Tabs (Zero Boxed Pills) */}
          <div
            role="tablist"
            aria-label={t('media.heading')}
            className="flex flex-wrap items-center gap-6 self-start lg:self-auto"
          >
            {tabs.map((tab) => {
              const active = filter === tab.id;
              return (
                <button
                  key={tab.id}
                  type="button"
                  role="tab"
                  aria-selected={active}
                  onClick={() => setFilter(tab.id)}
                  className={`min-h-[40px] py-2 text-xs font-medium whitespace-nowrap shrink-0 border-b-2 transition-colors cursor-pointer ${
                    active
                      ? 'border-[var(--color-navy)] text-[var(--color-navy)]'
                      : 'border-transparent text-[var(--color-muted)] hover:text-[var(--color-ink)]'
                  }`}
                >
                  {t(tab.labelKey)}
                </button>
              );
            })}
          </div>
        </div>

        {visibleRecords.length > 0 && leadItem ? (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-12 pt-12 items-start">
            {/* Lead Asymmetric Exhibition Plate */}
            <article className="lg:col-span-7 space-y-4">
              {leadItem.imageSrc && (
                <MotionImage
                  src={leadItem.imageSrc}
                  alt={t(leadItem.titleKey)}
                  aspectClass="aspect-[16/10]"
                />
              )}
              <div className="space-y-1.5 pt-1">
                <p className="text-xs font-medium tracking-[0.08em] uppercase text-[var(--color-bronze)]">
                  {t(leadItem.dateLabelKey)}
                </p>
                <h3 className="font-display text-2xl sm:text-3xl font-light text-[var(--color-ink)] tracking-[-0.015em]">
                  {t(leadItem.titleKey)}
                </h3>
                <p className="text-sm leading-relaxed text-[var(--color-muted)] max-w-xl">
                  {t(leadItem.captionKey)}
                </p>
              </div>
            </article>

            {/* Stacked Secondary Studies */}
            <div className="lg:col-span-5 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-1 gap-10">
              {secondaryItems.map((item) => (
                <article
                  key={item.id}
                  className="grid grid-cols-1 sm:grid-cols-12 gap-5 items-center pt-6 first:pt-0 lg:border-t lg:first:border-t-0 border-[var(--color-border)]"
                >
                  {item.imageSrc && (
                    <div className="sm:col-span-6">
                      <MotionImage
                        src={item.imageSrc}
                        alt={t(item.titleKey)}
                        aspectClass="aspect-[4/3]"
                      />
                    </div>
                  )}
                  <div className="sm:col-span-6 space-y-1.5">
                    <p className="text-[11px] font-medium tracking-[0.08em] uppercase text-[var(--color-bronze)]">
                      {t(item.dateLabelKey)}
                    </p>
                    <h3 className="font-display text-xl font-normal text-[var(--color-ink)]">
                      {t(item.titleKey)}
                    </h3>
                    <p className="text-xs leading-relaxed text-[var(--color-muted)]">
                      {t(item.captionKey)}
                    </p>
                  </div>
                </article>
              ))}
            </div>
          </div>
        ) : (
          <div className="pt-12 pb-6 border-b border-[var(--color-border)]">
            <p className="text-sm text-[var(--color-muted)] max-w-lg">
              {t('media.emptyCategory')}
            </p>
          </div>
        )}
      </div>
    </section>
  );
};
