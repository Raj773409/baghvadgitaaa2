import React, { useMemo, useState } from 'react';
import { ChevronDown, Mail, MapPin, Phone, Shield } from 'lucide-react';
import { Link } from 'react-router-dom';
import { PublishedBlocksRenderer } from '../../components/cms/PublishedBlocksRenderer';
import { Footer } from '../../components/layout/Footer';
import { Header } from '../../components/layout/Header';
import { PageHeroBanner } from '../../components/layout/PageHeroBanner';
import { OFFICIAL_SECRETARIAT_CONTACT, SOCIAL_LINKS } from '../../content/eventContent';
import { OFFICIAL_FAQS } from '../../content/faqAndPolicyContent';
import { extractPublishedPageDetails } from '../../content/siteCatalog';
import { usePublicCms, usePublishedCollections } from '../../hooks/usePublicCms';
import { useI18n } from '../../i18n';
import type { FaqItem } from '../../types/cms';

type FaqFilter = 'all' | FaqItem['category'];

export const ContactFaqPage: React.FC = () => {
  const { contentLocale: locale, t } = useI18n();
  const cms = usePublicCms();
  const publishedFaqCollection = usePublishedCollections('faqs');
  const pageMeta = useMemo(
    () => extractPublishedPageDetails(cms?.pages, '/contact', locale),
    [cms?.pages, locale],
  );

  const allFaqs = useMemo<FaqItem[]>(() => {
    if (publishedFaqCollection.length === 0) return [...OFFICIAL_FAQS];
    const validCategories = new Set<FaqItem['category']>([
      'general',
      'curtain-raiser',
      'participation',
      'travel',
      'governance',
    ]);
    const dynamicItems: FaqItem[] = publishedFaqCollection.map((item) => {
      const rawCat = (item.meta?.category ?? 'general') as FaqItem['category'];
      const category = validCategories.has(rawCat) ? rawCat : 'general';
      const qText = item.title || item.subtitle || 'Question';
      const aText = item.description || item.subtitle || '';
      return {
        id: item.id,
        category,
        question: {
          en: qText,
          hi: item.meta?.titleHi || qText,
          te: item.meta?.titleTe || qText,
        },
        answer: {
          en: aText,
          hi: item.meta?.descriptionHi || aText,
          te: item.meta?.descriptionTe || aText,
        },
      };
    });
    const byId = new Map(OFFICIAL_FAQS.map((f) => [f.id, f]));
    for (const d of dynamicItems) byId.set(d.id, d);
    return Array.from(byId.values());
  }, [publishedFaqCollection]);

  const [faqFilter, setFaqFilter] = useState<FaqFilter>('all');
  const [openFaqId, setOpenFaqId] = useState<string>(OFFICIAL_FAQS[0].id);

  const filterTabs: Array<{ id: FaqFilter; label: Record<'en' | 'hi' | 'te', string> }> = [
    { id: 'all', label: { en: 'All Questions', hi: 'सभी प्रश्न', te: 'అన్ని ప్రశ్నలు' } },
    { id: 'general', label: { en: 'Overview', hi: 'सामान्य', te: 'సాధారణం' } },
    { id: 'curtain-raiser', label: { en: 'Curtain Raiser', hi: 'कर्टेन रेज़र', te: 'కర్టెన్ రైజర్' } },
    { id: 'participation', label: { en: 'Participation', hi: 'सहभागिता', te: 'భాగస్వామ్యం' } },
    { id: 'travel', label: { en: 'Hospitality', hi: 'आवास व यात्रा', te: 'వసతి & ప్రయాణం' } },
    { id: 'governance', label: { en: 'Donations & Rules', hi: 'नियम व दान', te: 'విరాళాలు & నియమాలు' } },
  ];

  const visibleFaqs =
    faqFilter === 'all'
      ? allFaqs
      : allFaqs.filter((item) => item.category === faqFilter);

  const deskTitle =
    locale === 'hi'
      ? 'आधिकारिक सचिवालय संपर्क (हैदराबाद)'
      : locale === 'te'
        ? 'అధికారిక సచివాలయ సంప్రదింపు (హైదరాబాద్)'
        : 'Official Secretariat Desk (Hyderabad)';

  const faqHeading =
    locale === 'hi'
      ? 'प्रायः पूछे जाने वाले प्रश्न (FAQs)'
      : locale === 'te'
        ? 'తరచుగా అడిగే ప్రశ్నలు (FAQs)'
        : 'Frequently Asked Questions';

  return (
    <div className="min-h-screen flex flex-col bg-[var(--color-canvas)] text-[var(--color-ink)]">
      <Header variant="solid-dark" />

      <main id="main-content" className="flex-1">
        <PageHeroBanner
          eyebrow={pageMeta.pickHeroEyebrow(t('pages.contactEyebrow'))}
          title={pageMeta.pickPageTitle(t('pages.contactTitle'))}
          lead={pageMeta.pickPageSubtitle(t('pages.contactLead'))}
          breadcrumbLabel={t('sitemap.contact')}
        />

        {/* Two-Column Secretariat Directory & Governance Policies */}
        <section className="py-16 sm:py-20 bg-[var(--surface-elevated)] border-b border-[var(--color-border)]">
          <div className="max-w-[1360px] mx-auto px-5 sm:px-8 lg:px-12 grid grid-cols-1 lg:grid-cols-12 gap-8">
            <div className="lg:col-span-7 bg-[var(--color-canvas)] border border-[var(--color-border)] p-7 sm:p-9 space-y-6">
              <div className="space-y-1">
                <p className="text-[11px] font-medium tracking-[0.18em] uppercase text-[var(--color-bronze)]">
                  {OFFICIAL_SECRETARIAT_CONTACT.foundationName}
                </p>
                <h2 className="font-editorial text-2xl sm:text-3xl font-normal text-[var(--color-ink)]">
                  {deskTitle}
                </h2>
              </div>

              <dl className="space-y-5 text-sm">
                <div className="flex items-start gap-3">
                  <MapPin className="w-4 h-4 text-[var(--color-bronze)] shrink-0 mt-1" aria-hidden="true" />
                  <div>
                    <dt className="text-xs font-semibold uppercase tracking-[0.1em] text-[var(--color-muted)]">
                      Secretariat Address
                    </dt>
                    <dd className="mt-1 text-[var(--color-ink)] leading-relaxed">
                      {OFFICIAL_SECRETARIAT_CONTACT.address}
                    </dd>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <Phone className="w-4 h-4 text-[var(--color-bronze)] shrink-0 mt-1" aria-hidden="true" />
                  <div>
                    <dt className="text-xs font-semibold uppercase tracking-[0.1em] text-[var(--color-muted)]">
                      Direct Telephone
                    </dt>
                    <dd className="mt-1 flex flex-wrap gap-x-6 gap-y-1 tabular-nums">
                      {OFFICIAL_SECRETARIAT_CONTACT.phones.map((p) => (
                        <a
                          key={p.number}
                          href={p.telHref}
                          className="text-[var(--color-ink)] hover:text-[var(--color-bronze)] font-medium underline underline-offset-4"
                        >
                          {p.number} <span className="text-xs text-[var(--color-muted)] no-underline">({p.label})</span>
                        </a>
                      ))}
                    </dd>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <Mail className="w-4 h-4 text-[var(--color-bronze)] shrink-0 mt-1" aria-hidden="true" />
                  <div>
                    <dt className="text-xs font-semibold uppercase tracking-[0.1em] text-[var(--color-muted)]">
                      Official Correspondence
                    </dt>
                    <dd className="mt-1 flex flex-wrap gap-x-6 gap-y-1">
                      {OFFICIAL_SECRETARIAT_CONTACT.emails.map((em) => (
                        <a
                          key={em.address}
                          href={em.mailtoHref}
                          className="text-[var(--color-ink)] hover:text-[var(--color-bronze)] font-medium underline underline-offset-4 break-all"
                        >
                          {em.address}
                        </a>
                      ))}
                    </dd>
                  </div>
                </div>
              </dl>

              {SOCIAL_LINKS.length > 0 && (
                <div className="pt-4 border-t border-[var(--color-border)] flex flex-wrap gap-4 text-xs">
                  {SOCIAL_LINKS.map((link) => (
                    <a
                      key={link.id}
                      href={link.href}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-[var(--color-bronze)] hover:underline"
                    >
                      {link.label}
                    </a>
                  ))}
                </div>
              )}
            </div>

            <div className="lg:col-span-5 bg-[#101426] text-[#FFF6E8] border border-[#D6A447]/30 p-7 sm:p-9 flex flex-col justify-between gap-6">
              <div className="space-y-4">
                <div className="flex items-center gap-2 text-xs font-medium tracking-[0.18em] uppercase text-[#F3CD82]">
                  <Shield className="w-4 h-4 shrink-0" aria-hidden="true" />
                  <span>{t('footer.legalHeading')}</span>
                </div>
                <h2 className="font-editorial text-2xl sm:text-3xl font-normal">
                  Governance &amp; Compliance Documents
                </h2>
                <p className="text-xs sm:text-sm leading-relaxed text-[#F4E8D3]/75">
                  Version 2026-11-05 · Effective 5 November 2026 · {OFFICIAL_SECRETARIAT_CONTACT.foundationName}
                </p>
              </div>

              <ul className="divide-y divide-[#D6A447]/20 border-t border-b border-[#D6A447]/20 text-sm">
                <li>
                  <Link
                    to="/privacy-policy"
                    className="flex items-center justify-between py-3.5 hover:text-[#F3CD82] transition-colors"
                  >
                    <span>{t('footer.privacyPolicy')}</span>
                    <span className="text-xs text-[#F3CD82]">→</span>
                  </Link>
                </li>
                <li>
                  <Link
                    to="/terms-conditions"
                    className="flex items-center justify-between py-3.5 hover:text-[#F3CD82] transition-colors"
                  >
                    <span>{t('footer.termsConditions')}</span>
                    <span className="text-xs text-[#F3CD82]">→</span>
                  </Link>
                </li>
                <li>
                  <Link
                    to="/cancellation-refund-policy"
                    className="flex items-center justify-between py-3.5 hover:text-[#F3CD82] transition-colors"
                  >
                    <span>{t('footer.refundPolicy')}</span>
                    <span className="text-xs text-[#F3CD82]">→</span>
                  </Link>
                </li>
              </ul>
            </div>
          </div>
        </section>

        {/* Interactive FAQ Section */}
        <section id="faqs" className="py-16 sm:py-24 bg-[var(--color-canvas)]">
          <div className="max-w-[1360px] mx-auto px-5 sm:px-8 lg:px-12 space-y-10">
            <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-6 border-b border-[var(--color-border)] pb-6">
              <h2 className="font-editorial text-3xl sm:text-4xl font-normal text-[var(--color-ink)]">
                {faqHeading}
              </h2>

              <div role="tablist" aria-label={faqHeading} className="flex flex-wrap gap-4">
                {filterTabs.map((tab) => {
                  const active = faqFilter === tab.id;
                  return (
                    <button
                      key={tab.id}
                      type="button"
                      role="tab"
                      aria-selected={active}
                      onClick={() => {
                        setFaqFilter(tab.id);
                        const first =
                          tab.id === 'all'
                            ? OFFICIAL_FAQS[0]
                            : OFFICIAL_FAQS.find((f) => f.category === tab.id);
                        if (first) setOpenFaqId(first.id);
                      }}
                      className={`min-h-[38px] py-1.5 text-xs font-medium border-b-2 transition-colors whitespace-nowrap cursor-pointer ${
                        active
                          ? 'border-[#D4A537] text-[var(--color-ink)]'
                          : 'border-transparent text-[var(--color-muted)] hover:text-[var(--color-ink)]'
                      }`}
                    >
                      {tab.label[locale]}
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="border-t border-[var(--color-border)] divide-y divide-[var(--color-border)]">
              {visibleFaqs.map((faq) => {
                const isOpen = openFaqId === faq.id;
                return (
                  <div key={faq.id} className="py-2">
                    <button
                      type="button"
                      aria-expanded={isOpen}
                      aria-controls={`faq-panel-${faq.id}`}
                      onClick={() => setOpenFaqId(isOpen ? '' : faq.id)}
                      className="w-full py-4 text-left flex items-center justify-between gap-6 cursor-pointer group"
                    >
                      <span className="font-editorial text-xl sm:text-2xl text-[var(--color-ink)] group-hover:text-[var(--color-bronze)] transition-colors">
                        {faq.question[locale]}
                      </span>
                      <ChevronDown
                        className={`w-5 h-5 text-[var(--color-bronze)] shrink-0 transition-transform duration-200 ${
                          isOpen ? 'rotate-180' : ''
                        }`}
                        aria-hidden="true"
                      />
                    </button>

                    {isOpen && (
                      <div
                        id={`faq-panel-${faq.id}`}
                        className="pb-5 pr-8 text-sm sm:text-base leading-[1.8] text-[var(--color-muted)] max-w-3xl"
                      >
                        {faq.answer[locale]}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </section>

        <PublishedBlocksRenderer blocks={pageMeta.extraBlocks} locale={locale} />
      </main>

      <Footer />
    </div>
  );
};
