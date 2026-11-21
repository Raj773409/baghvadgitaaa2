import React, { useMemo } from 'react';
import { ArrowLeft, FileCheck2 } from 'lucide-react';
import { Link } from 'react-router-dom';
import { PublishedBlocksRenderer } from '../../components/cms/PublishedBlocksRenderer';
import { Footer } from '../../components/layout/Footer';
import { Header } from '../../components/layout/Header';
import { PageHeroBanner } from '../../components/layout/PageHeroBanner';
import { OFFICIAL_POLICY_DOCUMENTS } from '../../content/faqAndPolicyContent';
import { extractPublishedPageDetails } from '../../content/siteCatalog';
import { usePublicCms } from '../../hooks/usePublicCms';
import { useI18n } from '../../i18n';
import type { PolicyDocument } from '../../types/cms';

interface PolicyPageProps {
  policyId: PolicyDocument['id'];
}

const ROUTE_BY_POLICY: Record<PolicyDocument['id'], string> = {
  privacy: '/privacy-policy',
  terms: '/terms-conditions',
  refund: '/cancellation-refund-policy',
};

export const PolicyPage: React.FC<PolicyPageProps> = ({ policyId }) => {
  const { contentLocale: locale, t } = useI18n();
  const cms = usePublicCms();
  const doc = OFFICIAL_POLICY_DOCUMENTS[policyId];
  const pageMeta = useMemo(
    () => extractPublishedPageDetails(cms?.pages, ROUTE_BY_POLICY[policyId], locale),
    [cms?.pages, policyId, locale],
  );

  const siblingLinks: Array<{ id: PolicyDocument['id']; to: string; label: string }> = [
    { id: 'privacy', to: '/privacy-policy', label: t('footer.privacyPolicy') },
    { id: 'terms', to: '/terms-conditions', label: t('footer.termsConditions') },
    { id: 'refund', to: '/cancellation-refund-policy', label: t('footer.refundPolicy') },
  ];

  const resolvedTitle = pageMeta.pickPageTitle(doc.title[locale]);
  const resolvedSubtitle = pageMeta.pickPageSubtitle(doc.subtitle[locale]);

  return (
    <div className="min-h-screen flex flex-col bg-[var(--surface-elevated)] text-[var(--color-ink)]">
      <Header variant="solid-dark" />

      <main id="main-content" className="flex-1">
        <PageHeroBanner
          eyebrow={pageMeta.pickHeroEyebrow(t('footer.legalHeading'))}
          title={resolvedTitle}
          lead={resolvedSubtitle}
          breadcrumbLabel={resolvedTitle}
          metaRight={
            <div className="inline-flex flex-col lg:items-end gap-1 text-xs text-[#F4E8D3]/80">
              <span className="inline-flex items-center gap-1.5 text-[#F3CD82] uppercase tracking-[0.14em]">
                <FileCheck2 className="w-3.5 h-3.5" aria-hidden="true" />
                <span>{t('common.versionLabel')}: {doc.version}</span>
              </span>
              <span>
                {t('common.lastUpdated')}: {doc.effectiveDate}
              </span>
              <span className="text-[#F4E8D3]/65">{doc.governingEntity}</span>
            </div>
          }
        />

        {/* Policy Cross-Navigation Strip */}
        <div className="bg-[var(--color-canvas)] border-b border-[var(--color-border)]">
          <div className="max-w-[1360px] mx-auto px-5 sm:px-8 lg:px-12 flex flex-wrap items-center justify-between gap-4 py-3">
            <div className="flex flex-wrap items-center gap-6">
              {siblingLinks.map((link) => {
                const active = link.id === policyId;
                return (
                  <Link
                    key={link.id}
                    to={link.to}
                    aria-current={active ? 'page' : undefined}
                    className={`py-2 text-xs font-medium border-b-2 transition-colors ${
                      active
                        ? 'border-[#C9A04E] text-[var(--color-ink)]'
                        : 'border-transparent text-[var(--color-muted)] hover:text-[var(--color-ink)]'
                    }`}
                  >
                    {link.label}
                  </Link>
                );
              })}
            </div>

            <Link
              to="/participate/register"
              className="inline-flex items-center gap-2 text-xs font-medium text-[var(--color-bronze)] hover:underline"
            >
              <ArrowLeft className="w-3.5 h-3.5" aria-hidden="true" />
              <span>{t('nav.register')}</span>
            </Link>
          </div>
        </div>

        {/* Readable Long-Form Legal Column */}
        <article className="py-14 sm:py-20">
          <div className="max-w-3xl mx-auto px-5 sm:px-8 space-y-10">
            {doc.sections.map((section, idx) => (
              <section
                key={idx}
                className="space-y-4 pb-8 border-b border-[var(--color-border)] last:border-b-0"
              >
                <h2 className="font-editorial text-2xl sm:text-3xl font-normal text-[var(--color-ink)]">
                  {section.heading[locale]}
                </h2>
                <div className="space-y-3">
                  {section.paragraphs.map((p, pIdx) => (
                    <p
                      key={pIdx}
                      className="text-sm sm:text-base leading-[1.85] text-[var(--color-muted)]"
                    >
                      {p[locale]}
                    </p>
                  ))}
                </div>
                {section.bullets && section.bullets.length > 0 && (
                  <ul className="space-y-2.5 pt-2 pl-4 border-l-2 border-[#C9A04E]/55">
                    {section.bullets.map((b, bIdx) => (
                      <li
                        key={bIdx}
                        className="text-sm sm:text-[15px] leading-[1.75] text-[var(--color-ink)]"
                      >
                        {b[locale]}
                      </li>
                    ))}
                  </ul>
                )}
              </section>
            ))}
          </div>
        </article>

        <PublishedBlocksRenderer blocks={pageMeta.extraBlocks} locale={locale} />
      </main>

      <Footer />
    </div>
  );
};
