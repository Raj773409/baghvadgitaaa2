import React, { useMemo } from 'react';
import { ArrowRight, BookOpen, CheckCircle2, Clock, Globe, Landmark } from 'lucide-react';
import { Link } from 'react-router-dom';
import { ASSET_MANIFEST } from '../../assets/assetManifest';
import { PublishedBlocksRenderer } from '../../components/cms/PublishedBlocksRenderer';
import { Footer } from '../../components/layout/Footer';
import { Header } from '../../components/layout/Header';
import { PageHeroBanner } from '../../components/layout/PageHeroBanner';
import { CONTENT_PARITY_CHECKLIST } from '../../content/contentParityChecklist';
import { OFFICIAL_SECRETARIAT_CONTACT } from '../../content/eventContent';
import { FOUR_YOGA_PATHS, SIGNIFICANCE_OF_18_ITEMS } from '../../content/faqAndPolicyContent';
import { extractPublishedPageDetails, pickPublishedText, resolveCmsMediaUrl } from '../../content/siteCatalog';
import { usePublicCms } from '../../hooks/usePublicCms';
import { useI18n } from '../../i18n';

export const AboutPage: React.FC = () => {
  const { contentLocale: locale, t } = useI18n();
  const publicCms = usePublicCms();
  const pavilionStudy = ASSET_MANIFEST.visualStudies.sandstoneGallery;

  const pageDetails = useMemo(
    () => extractPublishedPageDetails(publicCms?.pages, '/about', locale),
    [publicCms?.pages, locale],
  );

  const stewardshipBlock = pageDetails.blocks.find((b) => b.id === 'about-stewardship');
  const canonicalStewardshipBlock =
    pageDetails.canonicalSnapshot?.blocks.find((b) => b.id === 'about-stewardship');

  const stewardshipHeading = pickPublishedText({
    publishedMap: stewardshipBlock?.heading,
    canonicalMap: canonicalStewardshipBlock?.heading,
    locale,
    fallback:
      locale === 'hi'
        ? 'संस्थागत संरक्षण एवं विज़न'
        : locale === 'te'
          ? 'సంస్థాగత సంరక్షణ మరియు దృక్కోణం'
          : 'Institutional Stewardship & Living Purpose',
  });

  const stewardshipParagraph1 = pickPublishedText({
    publishedMap: stewardshipBlock?.body,
    canonicalMap: canonicalStewardshipBlock?.body,
    locale,
    fallback:
      locale === 'hi'
        ? `${OFFICIAL_SECRETARIAT_CONTACT.foundationName} एवं ${OFFICIAL_SECRETARIAT_CONTACT.broadcastPartner} के संयुक्त तत्वावधान में आयोजित श्रीमद्भगवद्गीता विश्व महोत्सव 2027 केवल एक सम्मेलन नहीं, बल्कि भारत के शाश्वत दर्शन को १८ देशों की १८ भाषाओं तक पहुँचाने का वैश्विक सांस्कृतिक संकल्प है।`
        : locale === 'te'
          ? `${OFFICIAL_SECRETARIAT_CONTACT.foundationName} మరియు ${OFFICIAL_SECRETARIAT_CONTACT.broadcastPartner} సంయుక్త ఆధ్వర్యంలో నిర్వహించబడుతున్న భగవద్గీత విశ్వ మహోత్సవం 2027 కేవలం ఒక వేడుక మాత్రమే కాదు—సనాతన గీతా సందేశాన్ని 18 దేశాలలోని 18 భాషలకు చేరువ చేసే అంతర్జాతీయ సాంస్కృతిక ఉద్యమం.`
          : `Convened by ${OFFICIAL_SECRETARIAT_CONTACT.foundationName} in collaboration with ${OFFICIAL_SECRETARIAT_CONTACT.broadcastPartner}, Bhagavad Gita Vishwa Mahotsav 2027 ("Project Eternal") is conceived not as a single-day festival, but as a living cultural bridge linking eighteen nations and eighteen languages around India’s universal philosophical classic.`,
  });

  const stewardshipParagraph2 =
    locale === 'hi'
      ? '२० दिसम्बर २०२६ को विश्व आह्वानम् (ऑनलाइन कर्टेन रेज़र) से आरंभ होकर यह यात्रा २७ फरवरी २०२७ को हैदराबाद में मुख्य महोत्सव और प्रतिवर्ष "भगवद्गीता विश्व दिवस" मनाने के दीर्घकालिक संकल्प तक विस्तारित होती है।'
      : locale === 'te'
        ? '20 డిసెంబర్ 2026న విశ్వ ఆహ్వానమ్ (ఆన్‌లైన్ కర్టెన్ రైజర్)తో ప్రారంభమై, 27 ఫిబ్రవరి 2027న హైదరాబాద్‌లో ప్రధాన మహోత్సవం మరియు ప్రతి ఏటా "భగవద్గీత విశ్వ దివస్" నిర్వహణ సంకల్పంతో ఇది కొనసాగుతుంది.'
        : 'Opening online on 20 December 2026 with Vishwa Ahvanam (the synchronized Curtain Raiser) and culminating on 27 February 2027 in Hyderabad, the initiative establishes permanent civic and academic resolutions—including the annual observance of Bhagavad Gita Vishwa Diwas.';

  const yogaSectionTitle =
    locale === 'hi'
      ? 'चतुर्योग दर्शन — महोत्सव के चार स्तंभ'
      : locale === 'te'
        ? 'చతుర్యోగ దర్శనం — మహోత్సవ నాలుగు స్తంభాలు'
        : 'The Four Yoga Pillars of Project Eternal';

  const number18Heading =
    locale === 'hi'
      ? 'अंक १८ की सार्वभौमिक सार्थकता'
      : locale === 'te'
        ? '18 సంఖ్య యొక్క విశ్వజనీన ప్రాధాన్యత'
        : 'The Architecture of Eighteen';

  const aboutImageUrl =
    resolveCmsMediaUrl(undefined, stewardshipBlock?.mediaUrl) || pavilionStudy.src;

  return (
    <div className="min-h-screen flex flex-col bg-[var(--color-canvas)] text-[var(--color-ink)]">
      <Header variant="solid-dark" />

      <main id="main-content" className="flex-1">
        <PageHeroBanner
          eyebrow={pageDetails.pickHeroEyebrow(t('pages.aboutEyebrow'))}
          title={pageDetails.pickPageTitle(t('pages.aboutTitle'))}
          lead={pageDetails.pickPageSubtitle(t('pages.aboutLead'))}
          breadcrumbLabel={t('sitemap.about')}
          metaRight={
            <div className="inline-flex lg:flex-col lg:items-end gap-4 lg:gap-1 border-t lg:border-t-0 border-[#D6A447]/30 pt-4 lg:pt-0 text-xs text-[#F4E8D3]/80">
              <span className="uppercase tracking-[0.16em] text-[#F3CD82]">
                {t('navigationOverlay.secretariatLabel')}
              </span>
              <span>{OFFICIAL_SECRETARIAT_CONTACT.foundationName}</span>
              <span className="tabular-nums text-[#F4E8D3]/60">20 Dec 2026 · 27 Feb 2027</span>
            </div>
          }
        />

        {/* Section 1: Institutional Vision & Pavilion Visual Study */}
        <section className="py-16 sm:py-24 bg-[var(--color-canvas)] border-b border-[var(--color-border)]">
          <div className="max-w-[1360px] mx-auto px-5 sm:px-8 lg:px-12 grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-14 items-center">
            <div className="lg:col-span-6 space-y-6">
              <div className="flex items-center gap-3 text-xs font-medium tracking-[0.18em] uppercase text-[var(--color-bronze)]">
                <Landmark className="w-4 h-4 shrink-0" aria-hidden="true" />
                <span>{t('intro.eyebrow')}</span>
              </div>
              <h2 className="font-editorial text-3xl sm:text-4xl lg:text-[2.75rem] font-normal leading-[1.1] text-[var(--color-ink)]">
                {stewardshipHeading}
              </h2>
              <p className="text-base leading-[1.8] text-[var(--color-muted)]">{stewardshipParagraph1}</p>
              <p className="text-base leading-[1.8] text-[var(--color-muted)]">{stewardshipParagraph2}</p>

              <div className="pt-2 flex flex-wrap gap-4">
                <Link
                  to="/gita"
                  className="inline-flex items-center gap-2.5 min-h-[44px] px-6 py-2.5 rounded-full bg-[#17233A] text-[#FFFDF7] dark:bg-[#C9A04E] dark:text-[#171717] text-sm font-medium transition-colors"
                >
                  <BookOpen className="w-4 h-4 text-[#D5AC70] dark:text-[#171717]" aria-hidden="true" />
                  <span>{t('navigationOverlay.items.gitaTitle')}</span>
                </Link>
                <Link
                  to="/leadership"
                  className="inline-flex items-center gap-2.5 min-h-[44px] px-6 py-2.5 rounded-full border border-[#C9A04E] text-[var(--color-ink)] hover:bg-[#C9A04E]/15 text-sm font-medium transition-colors"
                >
                  <span>{t('navigationOverlay.items.leadershipTitle')}</span>
                  <ArrowRight className="w-4 h-4 text-[var(--color-bronze)]" aria-hidden="true" />
                </Link>
              </div>
            </div>

            <figure className="lg:col-span-6 space-y-3">
              <div className="overflow-hidden border border-[#C9A04E]/45 bg-[#161412] aspect-[16/10]">
                <img
                  src={aboutImageUrl}
                  alt={stewardshipBlock?.mediaAlt || t(pavilionStudy.altKey)}
                  referrerPolicy="no-referrer"
                  className="w-full h-full object-cover"
                />
              </div>
              <figcaption className="text-xs text-[var(--color-muted)] leading-relaxed">
                {t('media.studyOneCaption')}
              </figcaption>
            </figure>
          </div>
        </section>

        <PublishedBlocksRenderer blocks={pageDetails.extraBlocks} locale={locale} />

        {/* Section 2: Four Yoga Paths on Obsidian Charcoal Surface */}
        <section className="py-16 sm:py-24 bg-[#161412] text-[#F5F0E7] border-b border-[rgba(213,172,112,0.2)]">
          <div className="max-w-[1360px] mx-auto px-5 sm:px-8 lg:px-12 space-y-12">
            <div className="max-w-2xl space-y-3">
              <p className="text-[11px] font-medium tracking-[0.2em] uppercase text-[#C8A26A]">
                {t('message.eyebrow')}
              </p>
              <h2 className="font-editorial text-3xl sm:text-4xl font-normal text-[#FFF6E8]">
                {yogaSectionTitle}
              </h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 border-t border-[rgba(213,172,112,0.22)]">
              {FOUR_YOGA_PATHS.map((pillar) => (
                <article
                  key={pillar.id}
                  className="py-8 md:pr-10 md:odd:pr-10 md:even:pl-10 md:even:border-l border-b border-[rgba(213,172,112,0.22)] space-y-3"
                >
                  <span className="block text-xs font-medium tracking-[0.16em] text-[#D5AC70] tabular-nums">
                    {pillar.index}
                  </span>
                  <h3 className="font-editorial text-2xl sm:text-[1.7rem] font-normal text-[#FFF6E8]">
                    {pillar.title[locale]}
                  </h3>
                  <p className="text-sm sm:text-[15px] leading-[1.75] text-[#F5F0E7]/78 max-w-prose">
                    {pillar.description[locale]}
                  </p>
                </article>
              ))}
            </div>
          </div>
        </section>

        {/* Section 3: The Architecture of 18 */}
        <section className="py-16 sm:py-24 bg-[var(--surface-elevated)] text-[var(--color-ink)] border-b border-[var(--color-border)]">
          <div className="max-w-[1360px] mx-auto px-5 sm:px-8 lg:px-12 space-y-12">
            <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-6 pb-8 border-b border-[var(--color-border)]">
              <div className="space-y-3">
                <p className="text-[11px] font-medium tracking-[0.2em] uppercase text-[var(--color-bronze)]">
                  18 · 18 · 18 · 700
                </p>
                <h2 className="font-editorial text-3xl sm:text-4xl font-normal text-[var(--color-ink)]">
                  {number18Heading}
                </h2>
              </div>

              <Link
                to="/global-journey"
                className="inline-flex items-center gap-2 text-sm font-medium text-[var(--color-ink)] hover:text-[var(--color-bronze)] transition-colors"
              >
                <Globe className="w-4 h-4" aria-hidden="true" />
                <span>{t('global.exploreCta')}</span>
                <ArrowRight className="w-4 h-4" aria-hidden="true" />
              </Link>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 divide-y sm:divide-y-0 sm:divide-x divide-[var(--color-border)] border-b border-[var(--color-border)]">
              {SIGNIFICANCE_OF_18_ITEMS.map((item) => (
                <div
                  key={item.title.en}
                  className="py-8 sm:px-6 first:pl-0 last:pr-0 space-y-4"
                >
                  <p className="font-display text-5xl font-light text-[var(--color-bronze)] tabular-nums">
                    {item.value}
                  </p>
                  <h3 className="font-editorial text-xl font-medium text-[var(--color-ink)]">
                    {item.title[locale]}
                  </h3>
                  <p className="text-sm leading-relaxed text-[var(--color-muted)]">
                    {item.detail[locale]}
                  </p>
                </div>
              ))}
            </div>

            <div className="pt-4 flex flex-wrap items-center justify-between gap-4">
              <p className="text-sm text-[var(--color-muted)] max-w-2xl">
                {t('participation.description')}
              </p>
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

        {/* Section 4: Official Portal Content Parity & Verification Matrix */}
        <section
          data-testid="content-parity-matrix"
          className="py-16 sm:py-20 bg-[var(--color-canvas)] text-[var(--color-ink)] border-b border-[var(--color-border)]"
        >
          <div className="max-w-[1360px] mx-auto px-5 sm:px-8 lg:px-12 space-y-8">
            <div className="max-w-3xl space-y-2.5">
              <p className="text-[11px] font-semibold tracking-[0.2em] uppercase text-[var(--color-bronze)]">
                Verification Ledger · bhagavadgitavishwamahotsav.com
              </p>
              <h2 className="font-editorial text-3xl sm:text-4xl font-normal text-[var(--color-ink)]">
                Official Content Parity &amp; Readiness Matrix
              </h2>
              <p className="text-sm text-[var(--color-muted)] leading-relaxed">
                Every core public fact, date, 18-country roster, canonical Gita verse, and governance policy is mapped transparently below, distinguishing verified portal facts from items awaiting Secretariat release.
              </p>
            </div>

            <div className="rounded-2xl border border-[var(--color-border)] bg-[var(--surface-elevated)] overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs sm:text-[13px]">
                <thead>
                  <tr className="border-b border-[var(--color-border)] text-[var(--color-bronze)] uppercase tracking-[0.1em] text-[10.5px]">
                    <th className="p-4">Domain</th>
                    <th className="p-4">Official Portal Element</th>
                    <th className="p-4">Platform Implementation</th>
                    <th className="p-4">Status</th>
                    <th className="p-4">Verification Notes</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[var(--color-border)]">
                  {CONTENT_PARITY_CHECKLIST.map((item) => {
                    const isVerified = item.verificationStatus === 'verified';
                    return (
                      <tr key={item.id} className="hover:bg-[#C9A04E]/5">
                        <td className="p-4 font-semibold text-[var(--color-ink)] whitespace-nowrap">
                          {item.sectionGroup}
                        </td>
                        <td className="p-4 text-[var(--color-ink)]">{item.officialSourceElement}</td>
                        <td className="p-4 text-[var(--color-muted)]">
                          <Link
                            to={item.route}
                            className="font-medium text-[var(--color-bronze)] hover:underline"
                          >
                            {item.localImplementation}
                          </Link>
                        </td>
                        <td className="p-4 whitespace-nowrap">
                          <span
                            className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10.5px] font-semibold uppercase tracking-[0.06em] ${
                              isVerified
                                ? 'bg-[#2E6F40]/15 text-[#1B4A28] dark:text-[#6EE7B7]'
                                : 'bg-[#C9A04E]/20 text-[#8F6018] dark:text-[#F0D38B]'
                            }`}
                          >
                            {isVerified ? (
                              <CheckCircle2 className="w-3.5 h-3.5" aria-hidden="true" />
                            ) : (
                              <Clock className="w-3.5 h-3.5" aria-hidden="true" />
                            )}
                            <span>{isVerified ? 'Verified' : 'Awaiting Release'}</span>
                          </span>
                        </td>
                        <td className="p-4 text-[var(--color-muted)] leading-relaxed">
                          {item.notes}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
};
