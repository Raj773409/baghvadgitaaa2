import React, { useMemo } from 'react';
import { APPROVED_PARTNER_RECORDS } from '../../content/eventContent';
import { usePublishedCollections } from '../../hooks/usePublicCms';
import { useI18n } from '../../i18n';
import { SectionLabel } from '../ui/SectionLabel';
import { EditorialHeading } from '../ui/EditorialHeading';

export const PartnershipSection: React.FC = () => {
  const { t } = useI18n();
  const publishedPartners = usePublishedCollections('partners');
  const approvedPartners = useMemo(() => {
    if (publishedPartners.length > 0) {
      return publishedPartners.map((item) => ({
        id: item.id,
        name: item.title,
        logoSrc: item.imageUrl || null,
      }));
    }
    return APPROVED_PARTNER_RECORDS.filter((p) => p.approved);
  }, [publishedPartners]);

  return (
    <section
      id="partners"
      aria-labelledby="partners-heading"
      className="scroll-mt-24 bg-[var(--color-olive)] text-white py-24 lg:py-28 border-b border-[var(--border-hairline-dark)]"
    >
      <div className="max-w-[1360px] mx-auto px-5 sm:px-8 lg:px-12">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-14 items-center">
          <div className="lg:col-span-5 space-y-5">
            <SectionLabel tone="dark">{t('partners.eyebrow')}</SectionLabel>
            <EditorialHeading as="h2" size="section" tone="dark">
              <span id="partners-heading">{t('partners.heading')}</span>
            </EditorialHeading>
            <p className="text-sm sm:text-base leading-relaxed text-[var(--color-text-dark-muted)] max-w-prose">
              {t('partners.description')}
            </p>
          </div>

          <div className="lg:col-span-7">
            {approvedPartners.length > 0 ? (
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-6">
                {approvedPartners.map((partner) => (
                  <div
                    key={partner.id}
                    className="border-t border-[var(--border-hairline-dark)] pt-6 flex flex-col items-start justify-center min-h-[120px]"
                  >
                    {partner.logoSrc && (
                      <img
                        src={partner.logoSrc}
                        alt={partner.name}
                        referrerPolicy="no-referrer"
                        className="max-h-12 w-auto object-contain mb-3 brightness-0 invert"
                      />
                    )}
                    <span className="text-sm font-medium text-white">{partner.name}</span>
                  </div>
                ))}
              </div>
            ) : (
              <div className="border-t border-b border-[var(--border-hairline-dark)] py-10 space-y-3">
                <p className="text-xs font-medium tracking-[0.14em] uppercase text-[var(--color-bronze-light)]">
                  {t('partners.emptyTitle')}
                </p>
                <p className="text-base leading-relaxed text-white/85 max-w-xl">
                  {t('partners.emptyDescription')}
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </section>
  );
};
