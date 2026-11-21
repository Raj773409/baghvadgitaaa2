import React from 'react';
import { ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import { resolveCmsMediaUrl } from '../../content/siteCatalog';
import {
  resolveLocalizedText,
  type AdminLocaleCode,
  type PageBlockRecord,
} from '../../utils/cmsSync';

interface PublishedBlocksRendererProps {
  blocks: ReadonlyArray<PageBlockRecord>;
  locale: AdminLocaleCode;
}

export const PublishedBlocksRenderer: React.FC<PublishedBlocksRendererProps> = ({
  blocks,
  locale,
}) => {
  if (!blocks || blocks.length === 0) return null;

  return (
    <section
      data-testid="cms-extra-blocks"
      className="py-12 sm:py-16 bg-[var(--surface-elevated)] text-[var(--color-ink)] border-b border-[var(--color-border)]"
    >
      <div className="max-w-[1360px] mx-auto px-5 sm:px-8 lg:px-12 space-y-8">
        {blocks.map((block) => {
          const eyebrow = resolveLocalizedText(block.eyebrow, locale, '');
          const heading = resolveLocalizedText(block.heading, locale, '');
          const subheading = resolveLocalizedText(block.subheading, locale, '');
          const body = resolveLocalizedText(block.body, locale, '');
          const mediaSrc = resolveCmsMediaUrl(undefined, block.mediaUrl);
          const ctaLabel = resolveLocalizedText(block.ctaPrimaryLabel, locale, '');

          return (
            <article
              key={block.id}
              data-block-id={block.id}
              className="rounded-xl border border-[var(--color-border)] bg-[var(--color-canvas)] p-6 sm:p-8 space-y-4"
            >
              {eyebrow && (
                <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[var(--color-bronze)]">
                  {eyebrow}
                </p>
              )}
              {heading && (
                <h2 className="font-editorial text-2xl sm:text-3xl text-[var(--color-ink)]">
                  {heading}
                </h2>
              )}
              {subheading && (
                <p className="text-sm font-medium text-[var(--color-bronze)]">{subheading}</p>
              )}
              {body && (
                <p className="text-sm sm:text-base leading-[1.8] text-[var(--color-muted)] whitespace-pre-line">
                  {body}
                </p>
              )}
              {mediaSrc && (
                <div className="overflow-hidden rounded-lg border border-[var(--color-border)] max-w-3xl">
                  <img
                    src={mediaSrc}
                    alt={block.mediaAlt || heading || block.label}
                    className="w-full h-auto max-h-[420px] object-cover"
                  />
                </div>
              )}
              {block.videoUrl && (
                <p className="text-xs text-[var(--color-bronze)]">
                  <a
                    href={block.videoUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="underline"
                  >
                    Open Published Video Source ↗
                  </a>
                </p>
              )}
              {ctaLabel && block.ctaPrimaryHref && (
                <div className="pt-2">
                  <Link
                    to={block.ctaPrimaryHref}
                    className="inline-flex items-center gap-2 min-h-[40px] px-5 py-2 rounded-full royal-gold-surface text-xs font-semibold uppercase tracking-[0.06em]"
                  >
                    <span>{ctaLabel}</span>
                    <ArrowRight className="w-3.5 h-3.5" aria-hidden="true" />
                  </Link>
                </div>
              )}
            </article>
          );
        })}
      </div>
    </section>
  );
};
