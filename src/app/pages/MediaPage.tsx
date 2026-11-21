import React, { useMemo, useState } from 'react';
import { Expand, Film, Newspaper } from 'lucide-react';
import { ASSET_MANIFEST } from '../../assets/assetManifest';
import { PublishedBlocksRenderer } from '../../components/cms/PublishedBlocksRenderer';
import { Footer } from '../../components/layout/Footer';
import { Header } from '../../components/layout/Header';
import { PageHeroBanner } from '../../components/layout/PageHeroBanner';
import { GalleryLightbox } from '../../components/media/GalleryLightbox';
import { CulturalGallerySection } from '../../components/sections/CulturalGallerySection';
import {
  OFFICIAL_ANNOUNCEMENTS,
  type MediaCategory,
  type MediaRecord,
} from '../../content/eventContent';
import { extractPublishedPageDetails, resolveCmsMediaUrl } from '../../content/siteCatalog';
import { mapPublicMediaToArtwork, usePublicCms, usePublishedCollections } from '../../hooks/usePublicCms';
import { useI18n } from '../../i18n';

export const MediaPage: React.FC = () => {
  const { contentLocale: locale, t } = useI18n();
  const [filter, setFilter] = useState<MediaCategory>('all');
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);
  const publicCms = usePublicCms();

  const pageDetails = useMemo(
    () => extractPublishedPageDetails(publicCms?.pages, '/media', locale),
    [publicCms?.pages, locale],
  );
  const publishedAnnouncementsCollection = usePublishedCollections('announcements');

  const publishedArtworks = useMemo(
    () => (publicCms ? mapPublicMediaToArtwork(publicCms.media, publicCms.mediaAssets) : []),
    [publicCms],
  );

  const publishedVideos = useMemo(() => {
    const legacy = (publicCms?.media ?? []).filter((m) => m.kind === 'video');
    const seen = new Set(legacy.map((l) => l.id));
    const unified = (publicCms?.mediaAssets ?? [])
      .filter((a) => a.published && a.kind === 'video' && !seen.has(a.id))
      .map((a) => ({
        id: a.id,
        kind: 'video' as const,
        category: a.category,
        title: a.title,
        description: a.description,
        language: a.language,
        copyright: a.copyright,
        source: a.source,
        altText: a.altText,
        url: resolveCmsMediaUrl(a.assetKey, a.url),
        focalPoint: a.focalPoint,
        published: a.published,
        createdAt: a.createdAt,
      }));
    return [...legacy, ...unified];
  }, [publicCms]);

  const publishedAnnouncements = useMemo(() => {
    const collectionNews = publishedAnnouncementsCollection.map((item) => ({
      id: item.id,
      isoDate: item.dateLabel || item.updatedAt.slice(0, 10),
      title: item.title,
      summary: item.description,
    }));
    const legacyNews =
      publicCms?.cmsItems
        .filter((c) => c.section === 'news')
        .map((c) => ({
          id: c.id,
          isoDate: c.updatedAt.slice(0, 10),
          title: c.title,
          summary: c.body || c.subtitle,
        })) ?? [];
    return [...collectionNews, ...legacyNews];
  }, [publicCms, publishedAnnouncementsCollection]);

  const visualRecords: MediaRecord[] = [
    {
      id: 'hero-pavilion',
      category: 'photographs',
      titleKey: 'media.studyZeroTitle',
      captionKey: 'assets.heroPavilionAlt',
      dateLabelKey: 'media.studyBadge',
      imageSrc: ASSET_MANIFEST.visualStudies.heroPavilion.src,
      aspectRatio: '16:9',
      status: 'visual-study',
    },
    {
      id: 'eternal-gita-volume',
      category: 'photographs',
      titleKey: 'message.heading',
      captionKey: 'assets.eternalGitaVolumeAlt',
      dateLabelKey: 'media.studyBadge',
      imageSrc: ASSET_MANIFEST.visualStudies.eternalGitaVolume.src,
      aspectRatio: '16:9',
      status: 'visual-study',
    },
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

  const tabs: Array<{ id: MediaCategory; labelKey: string }> = [
    { id: 'all', labelKey: 'media.filterAll' },
    { id: 'photographs', labelKey: 'media.filterPhotographs' },
    { id: 'videos', labelKey: 'media.filterVideos' },
    { id: 'press', labelKey: 'media.filterPress' },
    { id: 'announcements', labelKey: 'media.filterAnnouncements' },
  ];

  const filteredPhotos =
    filter === 'all' || filter === 'photographs' ? visualRecords : [];

  const showAnnouncements = filter === 'all' || filter === 'announcements';

  const announcementsHeading =
    locale === 'hi'
      ? 'आधिकारिक सचिवालय सूचनाएँ एवं विज्ञप्तियाँ'
      : locale === 'te'
        ? 'అధికారిక సచివాలయ ప్రకటనలు మరియు వార్తలు'
        : 'Official Secretariat Releases & Announcements';

  return (
    <div className="min-h-screen flex flex-col bg-[var(--color-canvas)] text-[var(--color-ink)]">
      <Header variant="solid-dark" />

      <main id="main-content" className="flex-1">
        <PageHeroBanner
          eyebrow={pageDetails.pickHeroEyebrow(t('pages.mediaEyebrow'))}
          title={pageDetails.pickPageTitle(t('pages.mediaTitle'))}
          lead={pageDetails.pickPageSubtitle(t('pages.mediaLead'))}
          breadcrumbLabel={t('sitemap.media')}
        />

        <PublishedBlocksRenderer blocks={pageDetails.extraBlocks} locale={locale} />

        {/* Curated Cultural & Spiritual Heritage Library (synced with Admin Media) */}
        <CulturalGallerySection extraItems={publishedArtworks} />

        {/* Category Filter & Interactive Exhibition Plates */}
        <section className="py-16 sm:py-24 bg-[var(--surface-elevated)] text-[var(--color-ink)] border-b border-[var(--color-border)]">
          <div className="max-w-[1360px] mx-auto px-5 sm:px-8 lg:px-12 space-y-10">
            <div
              role="tablist"
              aria-label={t('media.heading')}
              className="flex flex-wrap items-center gap-6 border-b border-[var(--color-border)] pb-4"
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
                    className={`min-h-[40px] py-2 text-xs font-medium whitespace-nowrap border-b-2 transition-colors cursor-pointer ${
                      active
                        ? 'border-[#C9A04E] text-[var(--color-ink)]'
                        : 'border-transparent text-[var(--color-muted)] hover:text-[var(--color-ink)]'
                    }`}
                  >
                    {t(tab.labelKey)}
                  </button>
                );
              })}
            </div>

            {filteredPhotos.length > 0 && (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-7">
                {filteredPhotos.map((item, idx) => (
                  <article key={item.id} className="group flex flex-col space-y-3">
                    <button
                      type="button"
                      onClick={() => setLightboxIndex(idx)}
                      aria-label={`${t(item.titleKey)} — Open lightbox`}
                      className="relative overflow-hidden bg-[#101426] aspect-[16/10] border border-[var(--color-border)] group-hover:border-[#C9A04E] transition-colors cursor-pointer text-left"
                    >
                      {item.imageSrc && (
                        <img
                          src={item.imageSrc}
                          alt={t(item.titleKey)}
                          referrerPolicy="no-referrer"
                          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-[1.03]"
                        />
                      )}
                      <span
                        aria-hidden="true"
                        className="absolute bottom-3 right-3 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-[#101426]/80 text-[#FFF6E8] text-[11px] font-medium border border-[#D6A447]/45"
                      >
                        <Expand className="w-3 h-3" />
                        <span>View</span>
                      </span>
                    </button>

                    <div className="space-y-1">
                      <p className="text-[11px] font-medium tracking-[0.12em] uppercase text-[var(--color-bronze)]">
                        {t(item.dateLabelKey)}
                      </p>
                      <h2 className="font-editorial text-xl font-normal text-[var(--color-ink)]">
                        {t(item.titleKey)}
                      </h2>
                      <p className="text-xs leading-relaxed text-[var(--color-muted)]">
                        {t(item.captionKey)}
                      </p>
                    </div>
                  </article>
                ))}
              </div>
            )}

            {(filter === 'videos' || filter === 'press') && (
              <div className="space-y-4">
                {filter === 'videos' && publishedVideos.length > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {publishedVideos.map((vid) => (
                      <article
                        key={vid.id}
                        className="rounded-xl border border-[var(--color-border)] bg-[var(--color-canvas)] p-6 space-y-3"
                      >
                        <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-[var(--color-bronze)]">
                          {vid.category} · {vid.language}
                        </p>
                        <h3 className="font-editorial text-2xl text-[var(--color-ink)]">{vid.title}</h3>
                        <p className="text-sm text-[var(--color-muted)]">{vid.description}</p>
                        <a
                          href={vid.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.08em] text-[var(--color-bronze)] hover:underline"
                        >
                          Open Video Source ↗
                        </a>
                      </article>
                    ))}
                  </div>
                ) : (
                  <div className="bg-[var(--color-canvas)] border border-[var(--color-border)] p-8 flex items-start gap-4">
                    <Film className="w-5 h-5 text-[var(--color-bronze)] shrink-0 mt-0.5" aria-hidden="true" />
                    <div className="space-y-1.5">
                      <p className="text-xs font-medium tracking-[0.14em] uppercase text-[var(--color-bronze)]">
                        {t('common.statusPending')}
                      </p>
                      <p className="text-sm sm:text-base leading-relaxed text-[var(--color-muted)] max-w-2xl">
                        {t('media.emptyCategory')}
                      </p>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </section>

        {/* Official Secretariat Announcements */}
        {showAnnouncements && (
          <section className="py-16 sm:py-24 bg-[#161412] text-[#FFF6E8]">
            <div className="max-w-[1360px] mx-auto px-5 sm:px-8 lg:px-12 space-y-10">
              <div className="flex items-center gap-3 text-xs font-medium tracking-[0.18em] uppercase text-[#F3CD82]">
                <Newspaper className="w-4 h-4 shrink-0" aria-hidden="true" />
                <span>{announcementsHeading}</span>
              </div>

              <div className="border-t border-[rgba(213,172,112,0.25)] divide-y divide-[rgba(213,172,112,0.2)]">
                {publishedAnnouncements.map((ann) => (
                  <article
                    key={ann.id}
                    className="py-7 grid grid-cols-1 lg:grid-cols-12 gap-4 items-baseline"
                  >
                    <p className="lg:col-span-3 text-xs font-medium tracking-[0.14em] text-[#D5AC70] tabular-nums">
                      {ann.isoDate} · {t('common.statusConfirmed')}
                    </p>
                    <div className="lg:col-span-9 space-y-2">
                      <h3 className="font-editorial text-2xl sm:text-[1.75rem] font-normal text-[#FFF6E8]">
                        {ann.title}
                      </h3>
                      <p className="text-sm sm:text-[15px] leading-[1.75] text-[#F5F0E7]/78 max-w-3xl">
                        {ann.summary}
                      </p>
                    </div>
                  </article>
                ))}
                {OFFICIAL_ANNOUNCEMENTS.map((ann) => (
                  <article
                    key={ann.id}
                    className="py-7 grid grid-cols-1 lg:grid-cols-12 gap-4 items-baseline"
                  >
                    <p className="lg:col-span-3 text-xs font-medium tracking-[0.14em] text-[#D5AC70] tabular-nums">
                      {ann.isoDate} · {t('common.statusConfirmed')}
                    </p>
                    <div className="lg:col-span-9 space-y-2">
                      <h3 className="font-editorial text-2xl sm:text-[1.75rem] font-normal text-[#FFF6E8]">
                        {ann.title[locale]}
                      </h3>
                      <p className="text-sm sm:text-[15px] leading-[1.75] text-[#F5F0E7]/78 max-w-3xl">
                        {ann.summary[locale]}
                      </p>
                    </div>
                  </article>
                ))}
              </div>
            </div>
          </section>
        )}
      </main>

      <GalleryLightbox
        items={visualRecords}
        activeIndex={lightboxIndex}
        onClose={() => setLightboxIndex(null)}
        onSelectIndex={(idx) => setLightboxIndex(idx)}
      />

      <Footer />
    </div>
  );
};
