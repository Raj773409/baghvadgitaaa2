import React, { useMemo, useState } from 'react';
import { Expand, Sparkles, X } from 'lucide-react';
import {
  CULTURAL_HERITAGE_LIBRARY,
  type CulturalArtworkItem,
  type CulturalCategory,
} from '../../content/culturalLibrary';
import { resolveCmsMediaUrl } from '../../content/siteCatalog';
import { mapPublicMediaToArtwork, usePublicCms } from '../../hooks/usePublicCms';

const CATEGORIES: ReadonlyArray<{ id: CulturalCategory; label: string }> = [
  { id: 'all', label: 'All Heritage' },
  { id: 'mahabharata', label: 'Mahabharata & Krishna' },
  { id: 'devis', label: 'Sacred Feminine (Devis)' },
  { id: 'temples', label: 'Temple Architecture' },
  { id: 'manuscripts', label: 'Manuscript Traditions' },
];

export const CulturalGallerySection: React.FC<{
  extraItems?: ReadonlyArray<CulturalArtworkItem>;
}> = ({ extraItems = [] }) => {
  const [category, setCategory] = useState<CulturalCategory>('all');
  const [selectedArtwork, setSelectedArtwork] = useState<CulturalArtworkItem | null>(null);
  const publicCms = usePublicCms();

  const allItems = useMemo(() => {
    const assetsByKey = new Map(
      (publicCms?.mediaAssets ?? [])
        .filter((a) => a.published && a.kind === 'image' && a.assetKey)
        .map((a) => [a.assetKey as string, a]),
    );

    const updatedBuiltIn = CULTURAL_HERITAGE_LIBRARY.map((item) => {
      const override = Array.from(assetsByKey.values()).find(
        (a) =>
          a.url === `asset://${a.assetKey}` &&
          (a.id === item.id || resolveCmsMediaUrl(a.assetKey, a.url) === item.imageSrc),
      );
      if (!override) return item;
      return {
        ...item,
        title: override.title || item.title,
        description: override.description || item.description,
        altText: override.altText || item.altText,
        imageSrc: resolveCmsMediaUrl(override.assetKey, override.url) || item.imageSrc,
        copyright: override.copyright || item.copyright,
        source: override.source || item.source,
        focalPoint: override.focalPoint || item.focalPoint,
      };
    });

    const dynamicExtra =
      extraItems.length > 0
        ? extraItems
        : publicCms
          ? mapPublicMediaToArtwork(publicCms.media, publicCms.mediaAssets)
          : [];

    const seen = new Set(updatedBuiltIn.map((i) => i.id));
    const uniqueExtras = dynamicExtra.filter((e) => !seen.has(e.id));
    return [...updatedBuiltIn, ...uniqueExtras];
  }, [extraItems, publicCms]);

  const visibleItems = useMemo(() => {
    if (category === 'all') return allItems;
    return allItems.filter((item) => item.category === category);
  }, [allItems, category]);

  return (
    <section
      id="cultural-library"
      aria-labelledby="cultural-library-heading"
      className="py-16 sm:py-24 bg-[var(--color-canvas)] text-[var(--color-ink)] border-t border-[var(--color-border)]"
    >
      <div className="max-w-[1360px] mx-auto px-5 sm:px-8 lg:px-12 space-y-10">
        <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-6 pb-8 border-b border-[var(--color-border)]">
          <div className="space-y-3 max-w-2xl">
            <div className="flex items-center gap-2 text-[11px] font-semibold tracking-[0.2em] uppercase text-[var(--color-bronze)]">
              <Sparkles className="w-3.5 h-3.5" aria-hidden="true" />
              <span>Cultural & Spiritual Experience Library</span>
            </div>
            <h2
              id="cultural-library-heading"
              className="font-editorial text-3xl sm:text-4xl font-normal text-[var(--color-ink)]"
            >
              Sacred Art, Divinities & Ancient Indian Heritage
            </h2>
            <p className="text-sm sm:text-base text-[var(--color-muted)] leading-relaxed">
              Curated visual plates honoring Lord Krishna, Arjuna, cosmic Vishvarupa, Devi Saraswati, Devi Lakshmi, Maa Durga, ancient carved stone temples, and living manuscript craft.
            </p>
          </div>

          <div
            role="tablist"
            aria-label="Filter cultural artwork"
            className="flex flex-wrap items-center gap-2 sm:gap-3"
          >
            {CATEGORIES.map((cat) => {
              const active = category === cat.id;
              return (
                <button
                  key={cat.id}
                  type="button"
                  role="tab"
                  aria-selected={active}
                  onClick={() => setCategory(cat.id)}
                  className={`min-h-[38px] px-4 py-1.5 rounded-full text-xs font-medium border transition-colors cursor-pointer whitespace-nowrap ${
                    active
                      ? 'bg-[#17233A] text-[#F0D38B] border-[#17233A] dark:bg-[#C9A04E] dark:text-[#171717] dark:border-[#C9A04E]'
                      : 'border-[var(--color-border)] text-[var(--color-muted)] hover:border-[#C9A04E] hover:text-[var(--color-ink)]'
                  }`}
                >
                  {cat.label}
                </button>
              );
            })}
          </div>
        </div>

        {/* Curated Museum Plates Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-7">
          {visibleItems.map((item) => (
            <article
              key={item.id}
              data-testid={`cultural-card-${item.id}`}
              className="group rounded-xl overflow-hidden bg-[var(--surface-elevated)] border border-[var(--color-border)] hover:border-[#C9A04E] transition-colors flex flex-col justify-between"
            >
              <div>
                <button
                  type="button"
                  onClick={() => setSelectedArtwork(item)}
                  aria-label={`Inspect ${item.title}`}
                  className="relative w-full aspect-[4/3] overflow-hidden bg-[#17233A] block cursor-pointer text-left"
                >
                  <img
                    src={item.imageSrc}
                    alt={item.altText}
                    loading="lazy"
                    decoding="async"
                    referrerPolicy="no-referrer"
                    style={{ objectPosition: item.focalPoint || '50% 42%' }}
                    className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-[1.03]"
                  />
                  <span
                    aria-hidden="true"
                    className="absolute bottom-3 right-3 inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#17233A]/85 text-[#F0D38B] text-[11px] font-medium border border-[#C9A04E]/45"
                  >
                    <Expand className="w-3 h-3" />
                    <span>Inspect Plate</span>
                  </span>
                </button>

                <div className="p-5 space-y-2">
                  <p className="text-[10px] font-semibold tracking-[0.16em] uppercase text-[var(--color-bronze)]">
                    {item.publicationStatus}
                  </p>
                  <h3 className="font-editorial text-xl text-[var(--color-ink)] leading-snug">
                    {item.title}
                  </h3>
                  <p className="text-xs sm:text-[13px] text-[var(--color-muted)] leading-relaxed line-clamp-3">
                    {item.description}
                  </p>
                </div>
              </div>

              <div className="px-5 py-3 border-t border-[var(--color-border)] text-[11px] text-[var(--color-muted)] flex items-center justify-between gap-2">
                <span className="truncate">{item.source}</span>
                <span className="shrink-0 font-medium text-[var(--color-bronze)]">
                  {item.language.split('·')[0].trim()}
                </span>
              </div>
            </article>
          ))}
        </div>
      </div>

      {/* Full Metadata Artwork Modal */}
      {selectedArtwork && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="cultural-modal-title"
          onClick={() => setSelectedArtwork(null)}
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#0B111C]/85 backdrop-blur-xs"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-4xl rounded-2xl overflow-hidden bg-[#17233A] border border-[#C9A04E]/45 text-[#FFFDF7] shadow-2xl grid grid-cols-1 lg:grid-cols-12"
          >
            <div className="lg:col-span-7 bg-[#0B111C] flex items-center justify-center">
              <img
                src={selectedArtwork.imageSrc}
                alt={selectedArtwork.altText}
                className="w-full max-h-[75vh] object-contain"
              />
            </div>
            <div className="lg:col-span-5 p-6 flex flex-col justify-between gap-5">
              <div className="space-y-4">
                <div className="flex items-start justify-between gap-3">
                  <p className="text-[10px] font-semibold tracking-[0.18em] uppercase text-[#F0D38B]">
                    {selectedArtwork.publicationStatus}
                  </p>
                  <button
                    type="button"
                    onClick={() => setSelectedArtwork(null)}
                    aria-label="Close plate details"
                    className="p-1.5 rounded-full border border-[#C9A04E]/40 hover:border-[#F0D38B] cursor-pointer"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>

                <h3 id="cultural-modal-title" className="font-editorial text-2xl text-[#FFFDF7]">
                  {selectedArtwork.title}
                </h3>
                <p className="text-sm text-[#E9DCC5]/90 leading-relaxed">
                  {selectedArtwork.description}
                </p>

                <dl className="pt-3 border-t border-[#C9A04E]/25 space-y-2 text-xs">
                  <div>
                    <dt className="text-[#C9A04E] uppercase tracking-[0.12em]">Source Archive</dt>
                    <dd className="text-[#FFFDF7]/90">{selectedArtwork.source}</dd>
                  </div>
                  <div>
                    <dt className="text-[#C9A04E] uppercase tracking-[0.12em]">Languages / Script</dt>
                    <dd className="text-[#FFFDF7]/90">{selectedArtwork.language}</dd>
                  </div>
                  <div>
                    <dt className="text-[#C9A04E] uppercase tracking-[0.12em]">Rights & Attribution</dt>
                    <dd className="text-[#FFFDF7]/90">{selectedArtwork.copyright}</dd>
                  </div>
                </dl>
              </div>

              <button
                type="button"
                onClick={() => setSelectedArtwork(null)}
                className="w-full min-h-[40px] rounded-full royal-gold-surface text-xs font-semibold uppercase tracking-[0.08em] cursor-pointer"
              >
                Close Plate
              </button>
            </div>
          </div>
        </div>
      )}
    </section>
  );
};
