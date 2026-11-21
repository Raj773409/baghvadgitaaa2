import React, { useMemo } from 'react';
import { ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import { PublishedBlocksRenderer } from '../../components/cms/PublishedBlocksRenderer';
import { Footer } from '../../components/layout/Footer';
import { Header } from '../../components/layout/Header';
import { PageHeroBanner } from '../../components/layout/PageHeroBanner';
import { GlobalJourney } from '../../components/sections/GlobalJourney';
import { STATIC_PARTICIPANT_STATEMENT } from '../../content/eventContent';
import { extractPublishedPageDetails } from '../../content/siteCatalog';
import { usePublicCms } from '../../hooks/usePublicCms';
import { useI18n } from '../../i18n';

export const GlobalJourneyPage: React.FC = () => {
  const { contentLocale: locale, t } = useI18n();
  const cms = usePublicCms();
  const pageMeta = useMemo(
    () => extractPublishedPageDetails(cms?.pages, '/global-journey', locale),
    [cms?.pages, locale],
  );

  const bridgeHeading =
    locale === 'hi'
      ? 'अपने देश के अध्याय से महोत्सव में सहभागी बनें'
      : locale === 'te'
        ? 'మీ దేశపు విభాగం ద్వారా మహోత్సవంలో భాగం కండి'
        : 'Represent Your Nation in the Eighteen-Country Gathering';

  const bridgeBody =
    locale === 'hi'
      ? '२० दिसम्बर २०२६ (ऑनलाइन विश्व आह्वानम्) और २७ फरवरी २०२७ (हैदराबाद मुख्य समारोह) हेतु सभी १८ देशों के प्रतिभागी आधिकारिक पंजीकरण प्रणाली से आवेदन कर सकते हैं।'
      : locale === 'te'
        ? '20 డిసెంబర్ 2026 (ఆన్‌లైన్ విశ్వ ఆహ్వానమ్) మరియు 27 ఫిబ్రవరి 2027 (హైదరాబాద్ ప్రధాన మహోత్సవం) కోసం 18 దేశాల ప్రతినిధులు అధికారిక పోర్టల్ ద్వారా నమోదు చేసుకోవచ్చు.'
        : 'Participants across all eighteen participating nations join Vishwa Ahvanam online on 20 December 2026 and become eligible for invitation to the main convocation in Hyderabad on 27 February 2027.';

  return (
    <div className="min-h-screen flex flex-col bg-[#131518] text-[#F5F0E7]">
      <Header variant="solid-dark" />

      <main id="main-content" className="flex-1">
        <PageHeroBanner
          eyebrow={pageMeta.pickHeroEyebrow(t('pages.globalEyebrow'))}
          title={pageMeta.pickPageTitle(t('pages.globalTitle'))}
          lead={pageMeta.pickPageSubtitle(t('pages.globalLead'))}
          breadcrumbLabel={t('sitemap.globalJourney')}
        />

        {/* Quick Architectural Scale Bar */}
        <section className="bg-[#101426] border-b border-[#D6A447]/20">
          <div className="max-w-[1360px] mx-auto px-5 sm:px-8 lg:px-12 grid grid-cols-2 lg:grid-cols-4 divide-y lg:divide-y-0 sm:divide-x divide-[#D6A447]/20">
            <div className="py-7 sm:px-6 first:pl-0">
              <p className="font-display text-3xl sm:text-4xl font-light text-[#F3CD82] tabular-nums">
                {t('intro.metricCountriesValue')}
              </p>
              <p className="text-xs sm:text-sm text-[#F4E8D3]/75 mt-1">
                {t('intro.metricCountriesLabel')}
              </p>
            </div>
            <div className="py-7 sm:px-6">
              <p className="font-display text-3xl sm:text-4xl font-light text-[#F3CD82] tabular-nums">
                {t('intro.metricChaptersValue')}
              </p>
              <p className="text-xs sm:text-sm text-[#F4E8D3]/75 mt-1">
                {t('intro.metricChaptersLabel')}
              </p>
            </div>
            <div className="py-7 sm:px-6">
              <p className="font-display text-3xl sm:text-4xl font-light text-[#F3CD82] tabular-nums">
                {t('intro.metricLanguagesValue')}
              </p>
              <p className="text-xs sm:text-sm text-[#F4E8D3]/75 mt-1">
                {t('intro.metricLanguagesLabel')}
              </p>
            </div>
            <div className="py-7 sm:px-6">
              <p className="font-display text-3xl sm:text-4xl font-light text-[#F3CD82] tabular-nums">
                {STATIC_PARTICIPANT_STATEMENT}
              </p>
              <p className="text-xs sm:text-sm text-[#F4E8D3]/75 mt-1">
                {t('intro.metricParticipantsLabel')}
              </p>
            </div>
          </div>
        </section>

        {/* Full Interactive 3D Earth & Geodesic Atlas Experience */}
        <GlobalJourney />

        {/* Country Delegate Registration CTA Band */}
        <section className="py-16 sm:py-20 bg-[var(--color-canvas)] text-[var(--color-ink)]">
          <div className="max-w-[1360px] mx-auto px-5 sm:px-8 lg:px-12 flex flex-col lg:flex-row lg:items-center justify-between gap-8">
            <div className="space-y-3 max-w-2xl">
              <p className="text-[11px] font-medium tracking-[0.2em] uppercase text-[var(--color-bronze)]">
                {t('participation.eyebrow')}
              </p>
              <h2 className="font-editorial text-3xl sm:text-4xl font-normal text-[var(--color-ink)]">
                {bridgeHeading}
              </h2>
              <p className="text-sm sm:text-base leading-relaxed text-[var(--color-muted)]">{bridgeBody}</p>
            </div>

            <div className="flex flex-wrap gap-4 shrink-0">
              <Link
                to="/participate"
                className="inline-flex items-center gap-2 min-h-[46px] px-6 py-3 rounded-full border border-[#C9A04E] text-[var(--color-ink)] hover:bg-[#C9A04E]/15 text-sm font-medium transition-colors"
              >
                <span>{t('sitemap.participate')}</span>
              </Link>
              <Link
                to="/participate/register"
                className="inline-flex items-center gap-2.5 min-h-[46px] px-7 py-3 rounded-full royal-gold-surface text-sm font-medium transition-colors"
              >
                <span>{t('participation.cta')}</span>
                <ArrowRight className="w-4 h-4" aria-hidden="true" />
              </Link>
            </div>
          </div>
        </section>

        <PublishedBlocksRenderer blocks={pageMeta.extraBlocks} locale={locale} />
      </main>

      <Footer />
    </div>
  );
};
