import React, { useMemo } from 'react';
import { ArrowRight, ArrowUpRight, Building2 } from 'lucide-react';
import { Link } from 'react-router-dom';
import { PublishedBlocksRenderer } from '../../components/cms/PublishedBlocksRenderer';
import { Footer } from '../../components/layout/Footer';
import { Header } from '../../components/layout/Header';
import { PageHeroBanner } from '../../components/layout/PageHeroBanner';
import { PartnershipSection } from '../../components/sections/PartnershipSection';
import { VERIFIED_ORGANIZING_PARTNERS } from '../../content/eventContent';
import { extractPublishedPageDetails } from '../../content/siteCatalog';
import { usePublicCms, usePublishedCollections } from '../../hooks/usePublicCms';
import { useI18n } from '../../i18n';

export const PartnersPage: React.FC = () => {
  const { contentLocale: locale, t } = useI18n();
  const publicCms = usePublicCms();
  const pageDetails = useMemo(
    () => extractPublishedPageDetails(publicCms?.pages, '/partners', locale),
    [publicCms?.pages, locale],
  );
  const publishedPartners = usePublishedCollections('partners');

  const partnersList = useMemo(() => {
    if (publishedPartners.length === 0) {
      return VERIFIED_ORGANIZING_PARTNERS.map((org) => ({
        id: org.id,
        name: org.name,
        tier: org.tier,
        websiteUrl: org.websiteUrl,
        description:
          org.id === 'aishwarya-sarvahith-foundation'
            ? 'Registered charitable organizing trust steering programme governance, statutory donations, and global delegate hospitality for Project Eternal.'
            : 'Official media production and broadcast collaborator stewarding television outreach, documentary archives, and multilingual communications.',
      }));
    }
    return publishedPartners.map((item) => ({
      id: item.id,
      name: item.title,
      tier: item.subtitle || item.badgeLabel || 'Organizing Partner',
      websiteUrl: item.href,
      description: item.description,
    }));
  }, [publishedPartners]);

  const organizersHeading =
    locale === 'hi'
      ? 'मुख्य आयोजक एवं प्रसारण संस्थान'
      : locale === 'te'
        ? 'ప్రధాన నిర్వాహక మరియు ప్రసార సంస్థలు'
        : 'Foundational Conveners & Broadcast Stewardship';

  const invitationHeading =
    locale === 'hi'
      ? 'संस्थागत, शैक्षणिक एवं सांस्कृतिक सहभागिता हेतु आमंत्रण'
      : locale === 'te'
        ? 'విద్యా మరియు సాంస్కృతిక సంస్థల భాగస్వామ్య ఆహ్వానం'
        : 'Invite Your University, Foundation, or Cultural Trust';

  const invitationCopy =
    locale === 'hi'
      ? 'विश्वविद्यालय, विद्यालय, आध्यात्मिक न्यास और अंतर्राष्ट्रीय सांस्कृतिक केंद्र स्थानीय गीता पारायण केंद्र अथवा प्रतिनिधिमंडल के रूप में जुड़ने के लिए सचिवालय से संपर्क कर सकते हैं।'
      : locale === 'te'
        ? 'విశ్వవిద్యాలయాలు, విద్యాసంస్థలు, ఆధ్యాత్మిక ట్రస్టులు మరియు సాంస్కృతిక సంస్థలు స్థానిక గీతా పారాయణ కేంద్రాలు లేదా ప్రతినిధి బృందాలుగా చేరడానికి సచివాలయాన్ని సంప్రదించవచ్చు.'
        : 'Academic departments, schools, cultural trusts, and diaspora community associations may collaborate as institutional partners or host affiliated local Parayana chapters.';

  return (
    <div className="min-h-screen flex flex-col bg-[var(--color-canvas)] text-[var(--color-ink)]">
      <Header variant="solid-dark" />

      <main id="main-content" className="flex-1">
        <PageHeroBanner
          eyebrow={pageDetails.pickHeroEyebrow(t('pages.partnersEyebrow'))}
          title={pageDetails.pickPageTitle(t('pages.partnersTitle'))}
          lead={pageDetails.pickPageSubtitle(t('pages.partnersLead'))}
          breadcrumbLabel={t('sitemap.partners')}
        />

        <PublishedBlocksRenderer blocks={pageDetails.extraBlocks} locale={locale} />

        {/* Verified Organizing Bodies */}
        <section className="py-16 sm:py-24 bg-[var(--surface-elevated)] border-b border-[var(--color-border)]">
          <div className="max-w-[1360px] mx-auto px-5 sm:px-8 lg:px-12 space-y-10">
            <div className="space-y-2 max-w-2xl">
              <div className="flex items-center gap-2.5 text-[11px] font-medium tracking-[0.2em] uppercase text-[var(--color-bronze)]">
                <Building2 className="w-4 h-4 shrink-0" aria-hidden="true" />
                <span>Hyderabad · Telangana</span>
              </div>
              <h2 className="font-editorial text-3xl sm:text-4xl font-normal text-[var(--color-ink)]">
                {organizersHeading}
              </h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {partnersList.map((org) => (
                <article
                  key={org.id}
                  className="bg-[var(--color-canvas)] border border-[var(--color-border)] p-8 flex flex-col justify-between gap-6"
                >
                  <div className="space-y-3">
                    <div className="flex items-center justify-between gap-3 text-xs">
                      <span className="uppercase tracking-[0.14em] text-[var(--color-bronze)] font-medium">
                        {org.tier} Anchor
                      </span>
                      <span className="text-[#2E6F40] dark:text-[#6EE7B7] font-medium uppercase tracking-[0.12em]">
                        {t('common.statusConfirmed')}
                      </span>
                    </div>
                    <h3 className="font-editorial text-2xl sm:text-3xl font-normal text-[var(--color-ink)]">
                      {org.name}
                    </h3>
                    <p className="text-sm leading-relaxed text-[var(--color-muted)]">
                      {org.description}
                    </p>
                  </div>

                  {org.websiteUrl && (
                    <div className="pt-4 border-t border-[var(--color-border)]">
                      <a
                        href={org.websiteUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-2 text-xs font-medium tracking-[0.06em] uppercase text-[var(--color-bronze)] hover:underline"
                      >
                        <span>{t('footer.officialWebsite')}</span>
                        <ArrowUpRight className="w-4 h-4" aria-hidden="true" />
                      </a>
                    </div>
                  )}
                </article>
              ))}
            </div>
          </div>
        </section>

        {/* External Partner Ledger (Awaiting Sign-Off) */}
        <PartnershipSection />

        {/* Institutional Partnership CTA */}
        <section className="py-16 sm:py-20 bg-[var(--color-canvas)]">
          <div className="max-w-[1360px] mx-auto px-5 sm:px-8 lg:px-12 flex flex-col lg:flex-row lg:items-center justify-between gap-8">
            <div className="space-y-3 max-w-2xl">
              <h2 className="font-editorial text-3xl sm:text-4xl font-normal text-[var(--color-ink)]">
                {invitationHeading}
              </h2>
              <p className="text-sm sm:text-base leading-relaxed text-[var(--color-muted)]">
                {invitationCopy}
              </p>
            </div>
            <div className="flex flex-wrap gap-4 shrink-0">
              <Link
                to="/contact"
                className="inline-flex items-center gap-2 min-h-[46px] px-6 py-3 rounded-full border border-[#D4A537] text-[var(--color-ink)] hover:bg-[#D4A537]/15 text-sm font-medium transition-colors"
              >
                <span>{t('sitemap.contact')}</span>
              </Link>
              <Link
                to="/participate/register?type=institutional"
                className="inline-flex items-center gap-2.5 min-h-[46px] px-7 py-3 rounded-full royal-gold-surface text-sm font-medium transition-colors"
              >
                <span>{t('registration.types.institutional')}</span>
                <ArrowRight className="w-4 h-4" aria-hidden="true" />
              </Link>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
};
