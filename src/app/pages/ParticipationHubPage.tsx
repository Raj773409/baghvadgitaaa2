import React, { useMemo, useState } from 'react';
import { ArrowRight, CheckCircle2, Globe2, HandHeart, Loader2 } from 'lucide-react';
import { Link } from 'react-router-dom';
import { PublishedBlocksRenderer } from '../../components/cms/PublishedBlocksRenderer';
import { Footer } from '../../components/layout/Footer';
import { Header } from '../../components/layout/Header';
import { PageHeroBanner } from '../../components/layout/PageHeroBanner';
import {
  MOVEMENT_TEN_PATHWAYS,
  PARTICIPATION_PATHWAYS,
} from '../../content/participationContent';
import { extractPublishedPageDetails } from '../../content/siteCatalog';
import { usePublicCms, usePublishedCollections } from '../../hooks/usePublicCms';
import { useI18n } from '../../i18n';

export const ParticipationHubPage: React.FC = () => {
  const { contentLocale: locale, t } = useI18n();
  const publicCms = usePublicCms();
  const pageDetails = useMemo(
    () => extractPublishedPageDetails(publicCms?.pages, '/participate', locale),
    [publicCms?.pages, locale],
  );
  const publishedTracks = usePublishedCollections('participation');

  const mergedPathways = useMemo(() => {
    const baseById = new Map(PARTICIPATION_PATHWAYS.map((p) => [p.id, p]));
    if (publishedTracks.length === 0) return PARTICIPATION_PATHWAYS;
    return publishedTracks.map((item) => {
      const existing = baseById.get(item.id);
      if (existing) {
        return {
          ...existing,
          title: { ...existing.title, [locale]: item.title || existing.title[locale] },
          audience: { ...existing.audience, [locale]: item.subtitle || existing.audience[locale] },
          description: {
            ...existing.description,
            [locale]: item.description || existing.description[locale],
          },
          eligibility: item.badgeLabel
            ? { ...existing.eligibility, [locale]: item.badgeLabel }
            : existing.eligibility,
        };
      }
      return {
        id: item.id,
        registrationType: (item.meta.registrationType as typeof PARTICIPATION_PATHWAYS[number]['registrationType']) || 'general',
        title: { en: item.title, hi: item.title, te: item.title },
        audience: { en: item.subtitle, hi: item.subtitle, te: item.subtitle },
        description: { en: item.description, hi: item.description, te: item.description },
        eligibility: {
          en: item.badgeLabel || 'Open Worldwide',
          hi: item.badgeLabel || 'विश्वव्यापी खुला',
          te: item.badgeLabel || 'అందరికీ అవకాశం',
        },
        featuredVerse: '',
      };
    });
  }, [locale, publishedTracks]);
  const [volForm, setVolForm] = useState({
    fullName: '',
    email: '',
    phone: '',
    country: 'India',
    city: 'Hyderabad',
    department: 'hospitality',
  });
  const [volSubmitting, setVolSubmitting] = useState(false);
  const [volResult, setVolResult] = useState<{ badgeId: string; status: string } | null>(null);
  const [volError, setVolError] = useState<string | null>(null);

  const registerBtnLabel =
    locale === 'hi'
      ? 'इस श्रेणी में पंजीकरण करें'
      : locale === 'te'
        ? 'ఈ విభాగంలో నమోదు చేసుకోండి'
        : 'Register in This Track';

  const hospitalityHeading =
    locale === 'hi'
      ? 'अंतर्राष्ट्रीय प्रतिभागी आतिथ्य एवं चयन प्रक्रिया'
      : locale === 'te'
        ? 'అంతర్జాతీయ ప్రతినిధుల ఆతిథ్యం మరియు ఎంపిక విధానం'
        : 'International Delegate Hospitality & Shloka Flow';

  const hospitalityPoints =
    locale === 'hi'
      ? [
          '२० दिसम्बर २०२६ (ऑनलाइन विश्व आह्वानम्) में सभी पंजीकृत प्रतिभागी अपनी मातृभाषा व संस्कृत में ६ निर्धारित श्लोकों का पाठ करेंगे।',
          'चयनित अंतर्राष्ट्रीय प्रतिभागियों को २७ फरवरी २०२७ को हैदराबाद के मुख्य मंच पर कम-से-कम २ श्लोक प्रस्तुत करने का अवसर प्राप्त होगा (प्रशिक्षण सामग्री आयोजकों द्वारा दी जाएगी)।',
          'आधिकारिक नियमों (संस्करण 2026-11-05) के अनुसार चयनित अंतर्राष्ट्रीय प्रतिभागियों को हैदराबाद में ४ दिनों का आवास, भोजन और स्थानीय परिवहन उपलब्ध कराया जाएगा।',
        ]
      : locale === 'te'
        ? [
            '20 డిసెంబర్ 2026న ఆన్‌లైన్ విశ్వ ఆహ్వానమ్‌లో నమోదు చేసుకున్న ప్రతినిధులు తమ మాతృభాష మరియు సంస్కృతంలో 6 నిర్దేశిత శ్లోకాలను పఠిస్తారు.',
            'ఎంపికైన ప్రతినిధులకు 27 ఫిబ్రవరి 2027న హైదరాబాద్ ప్రధాన వేదికపై కనీసం 2 శ్లోకాలు పఠించే అవకాశం కల్పిస్తారు (శిక్షణా మార్గదర్శకాలు నిర్వాహకులు అందిస్తారు).',
            'ప్రకటిత నియమావళి (2026-11-05) ప్రకారం ఎంపికైన అంతర్జాతీయ ప్రతినిధులకు హైదరాబాద్‌లో 4 రోజుల వసతి, భోజనం మరియు స్థానిక రవాణా అందించబడుతుంది.',
          ]
        : [
            'Online Initiation (20 December 2026): Registered participants join Vishwa Ahvanam online to recite six designated Bhagavad Gita shlokas in both their mother tongue and Sanskrit.',
            'Main Stage Selection (27 February 2027): Selected participants recite at least two of the six shlokas live on stage in Hyderabad, with training guidance furnished by the organizers.',
            'Hospitality Provision (Terms Version 2026-11-05): For selected international delegates, the Organising Team provides accommodation, food, and local transportation in Hyderabad for four (4) days after arrival.',
          ];

  const handleVolunteerSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setVolError(null);
    setVolSubmitting(true);
    try {
      const res = await fetch('/api/public/volunteers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(volForm),
      });
      const json = (await res.json().catch(() => ({}))) as {
        volunteer?: { volunteerBadgeId: string; approvalStatus: string };
        error?: string;
      };
      if (!res.ok || !json.volunteer) {
        throw new Error(json.error || 'Could not record volunteer application.');
      }
      setVolResult({
        badgeId: json.volunteer.volunteerBadgeId,
        status: json.volunteer.approvalStatus,
      });
      setVolForm({
        fullName: '',
        email: '',
        phone: '',
        country: 'India',
        city: 'Hyderabad',
        department: 'hospitality',
      });
    } catch (err) {
      setVolError(err instanceof Error ? err.message : 'Unable to submit application.');
    } finally {
      setVolSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-[var(--color-canvas)] text-[var(--color-ink)]">
      <Header variant="solid-dark" />

      <main id="main-content" className="flex-1">
        <PageHeroBanner
          eyebrow={pageDetails.pickHeroEyebrow(t('pages.participateEyebrow'))}
          title={pageDetails.pickPageTitle(t('pages.participateTitle'))}
          lead={pageDetails.pickPageSubtitle(t('pages.participateLead'))}
          breadcrumbLabel={t('sitemap.participate')}
        />

        <PublishedBlocksRenderer blocks={pageDetails.extraBlocks} locale={locale} />

        {/* Six Primary Tracks + Complete Ten Movement Pathways Grid */}
        <section className="py-16 sm:py-24 bg-[var(--surface-elevated)] border-b border-[var(--color-border)]">
          <div className="max-w-[1360px] mx-auto px-5 sm:px-8 lg:px-12 space-y-14">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-7">
              {mergedPathways.map((pathway, index) => (
                <article
                  key={pathway.id}
                  className="bg-[var(--color-canvas)] border border-[var(--color-border)] p-7 flex flex-col justify-between gap-6 hover:border-[#D4A537] transition-colors"
                >
                  <div className="space-y-3">
                    <div className="flex items-center justify-between gap-2 text-xs text-[var(--color-bronze)] font-medium tracking-[0.14em] uppercase tabular-nums">
                      <span>{String(index + 1).padStart(2, '0')}</span>
                      <span>{pathway.eligibility[locale]}</span>
                    </div>
                    <h2 className="font-editorial text-2xl sm:text-[1.7rem] font-normal text-[var(--color-ink)] leading-snug">
                      {pathway.title[locale]}
                    </h2>
                    <p className="text-xs font-medium text-[var(--color-bronze)]">
                      {pathway.audience[locale]}
                    </p>
                    <p className="text-sm leading-[1.75] text-[var(--color-muted)]">
                      {pathway.description[locale]}
                    </p>
                  </div>

                  <div className="pt-4 border-t border-[var(--color-border)]">
                    <Link
                      to={`/participate/register?type=${pathway.registrationType}`}
                      className="inline-flex items-center justify-between w-full min-h-[44px] px-5 py-2.5 rounded-full bg-[#17233A] text-[#FFFDF7] hover:bg-[#0D1120] dark:bg-[#D4A537] dark:text-[#171717] dark:hover:bg-[#F7D774] text-xs font-medium tracking-[0.06em] uppercase transition-colors"
                    >
                      <span>{registerBtnLabel}</span>
                      <ArrowRight className="w-4 h-4 text-[#F3CD82] dark:text-[#171717]" aria-hidden="true" />
                    </Link>
                  </div>
                </article>
              ))}
            </div>

            <div className="pt-10 border-t border-[var(--color-border)] space-y-6">
              <div>
                <p className="text-xs font-semibold tracking-[0.18em] uppercase text-[var(--color-bronze)]">
                  Complete Directory · 10 Ways to Join
                </p>
                <h2 className="font-editorial text-2xl sm:text-3xl text-[var(--color-ink)] mt-1">
                  All Ten Global Movement Tracks
                </h2>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
                {MOVEMENT_TEN_PATHWAYS.map((item, idx) => (
                  <Link
                    key={item.id}
                    to={item.actionKind === 'volunteer' ? '#volunteer-seva' : item.actionHref}
                    className="rounded-xl bg-[var(--color-canvas)] border border-[var(--color-border)] hover:border-[#D4A537] p-4 flex flex-col justify-between gap-3 transition-colors"
                  >
                    <div className="space-y-1.5">
                      <span className="text-[10px] font-semibold tracking-[0.14em] uppercase text-[var(--color-bronze)]">
                        {String(idx + 1).padStart(2, '0')}
                      </span>
                      <h3 className="font-editorial text-lg text-[var(--color-ink)] leading-snug">
                        {item.title[locale]}
                      </h3>
                      <p className="text-xs text-[var(--color-muted)] leading-relaxed">
                        {item.subtitle[locale]}
                      </p>
                    </div>
                    <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#9C6B1E] dark:text-[#F7D774]">
                      <span>{item.ctaLabel[locale]}</span>
                      <ArrowRight className="w-3.5 h-3.5" aria-hidden="true" />
                    </span>
                  </Link>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* Volunteer Seva Application Desk */}
        <section
          id="volunteer-seva"
          className="py-16 sm:py-20 bg-[var(--color-canvas)] border-b border-[var(--color-border)]"
        >
          <div className="max-w-[1360px] mx-auto px-5 sm:px-8 lg:px-12 grid grid-cols-1 lg:grid-cols-12 gap-10 items-start">
            <div className="lg:col-span-5 space-y-4">
              <div className="flex items-center gap-2 text-xs font-semibold tracking-[0.18em] uppercase text-[var(--color-bronze)]">
                <HandHeart className="w-4 h-4 shrink-0" aria-hidden="true" />
                <span>Volunteer Seva Enrollment</span>
              </div>
              <h2 className="font-editorial text-3xl sm:text-4xl font-normal text-[var(--color-ink)]">
                Serve the Mahotsav in Hospitality, Translation, Media &amp; Stage
              </h2>
              <p className="text-sm sm:text-base text-[var(--color-muted)] leading-relaxed">
                Submitted applications enter the Secretariat Volunteer Desk immediately and are reviewed by our Volunteer Coordinators for official Seva badge issuance.
              </p>
            </div>

            <form
              onSubmit={handleVolunteerSubmit}
              className="lg:col-span-7 rounded-2xl bg-[var(--surface-elevated)] border border-[var(--color-border)] p-6 sm:p-8 space-y-4"
            >
              {volResult && (
                <div className="rounded-xl border border-[#2E6F40]/40 bg-[#2E6F40]/10 p-4 text-xs sm:text-sm flex items-center justify-between gap-4">
                  <span className="font-medium text-[var(--color-ink)]">
                    Volunteer Seva recorded ({volResult.status}).
                  </span>
                  <span className="font-mono font-semibold text-[var(--color-bronze)]">
                    {volResult.badgeId}
                  </span>
                </div>
              )}

              {volError && (
                <div className="rounded-xl border border-red-500/40 bg-red-500/10 p-3 text-xs text-red-700 dark:text-red-300">
                  {volError}
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <label className="space-y-1 text-xs font-medium text-[var(--color-muted)]">
                  <span>Full Name *</span>
                  <input
                    type="text"
                    required
                    value={volForm.fullName}
                    onChange={(e) => setVolForm({ ...volForm, fullName: e.target.value })}
                    className="w-full min-h-[42px] px-3.5 rounded-lg border border-[var(--color-border)] bg-[var(--color-canvas)] text-sm text-[var(--color-ink)]"
                  />
                </label>
                <label className="space-y-1 text-xs font-medium text-[var(--color-muted)]">
                  <span>Email Address *</span>
                  <input
                    type="email"
                    required
                    value={volForm.email}
                    onChange={(e) => setVolForm({ ...volForm, email: e.target.value })}
                    className="w-full min-h-[42px] px-3.5 rounded-lg border border-[var(--color-border)] bg-[var(--color-canvas)] text-sm text-[var(--color-ink)]"
                  />
                </label>
                <label className="space-y-1 text-xs font-medium text-[var(--color-muted)]">
                  <span>Phone / WhatsApp *</span>
                  <input
                    type="tel"
                    required
                    value={volForm.phone}
                    onChange={(e) => setVolForm({ ...volForm, phone: e.target.value })}
                    className="w-full min-h-[42px] px-3.5 rounded-lg border border-[var(--color-border)] bg-[var(--color-canvas)] text-sm text-[var(--color-ink)]"
                  />
                </label>
                <label className="space-y-1 text-xs font-medium text-[var(--color-muted)]">
                  <span>Department</span>
                  <select
                    value={volForm.department}
                    onChange={(e) => setVolForm({ ...volForm, department: e.target.value })}
                    className="w-full min-h-[42px] px-3.5 rounded-lg border border-[var(--color-border)] bg-[var(--color-canvas)] text-sm text-[var(--color-ink)]"
                  >
                    <option value="hospitality">International Hospitality</option>
                    <option value="translation">18-Language Translation</option>
                    <option value="media">Media &amp; Documentation</option>
                    <option value="logistics">Ground Logistics</option>
                    <option value="stage">Main Stage &amp; Parayana</option>
                  </select>
                </label>
                <label className="space-y-1 text-xs font-medium text-[var(--color-muted)]">
                  <span>Country *</span>
                  <input
                    type="text"
                    required
                    value={volForm.country}
                    onChange={(e) => setVolForm({ ...volForm, country: e.target.value })}
                    className="w-full min-h-[42px] px-3.5 rounded-lg border border-[var(--color-border)] bg-[var(--color-canvas)] text-sm text-[var(--color-ink)]"
                  />
                </label>
                <label className="space-y-1 text-xs font-medium text-[var(--color-muted)]">
                  <span>City</span>
                  <input
                    type="text"
                    value={volForm.city}
                    onChange={(e) => setVolForm({ ...volForm, city: e.target.value })}
                    className="w-full min-h-[42px] px-3.5 rounded-lg border border-[var(--color-border)] bg-[var(--color-canvas)] text-sm text-[var(--color-ink)]"
                  />
                </label>
              </div>

              <button
                type="submit"
                disabled={volSubmitting}
                className="inline-flex items-center gap-2 min-h-[44px] px-7 py-2.5 rounded-full royal-gold-surface text-xs font-semibold uppercase tracking-[0.08em] cursor-pointer disabled:opacity-60"
              >
                {volSubmitting && <Loader2 className="w-4 h-4 animate-spin" />}
                <span>Submit Seva Application</span>
              </button>
            </form>
          </div>
        </section>

        {/* International Hospitality & Terms Summary */}
        <section className="py-16 sm:py-24 bg-[#161412] text-[#FFF6E8]">
          <div className="max-w-[1360px] mx-auto px-5 sm:px-8 lg:px-12 grid grid-cols-1 lg:grid-cols-12 gap-10 items-start">
            <div className="lg:col-span-5 space-y-4">
              <div className="flex items-center gap-2.5 text-xs font-medium tracking-[0.18em] uppercase text-[#F3CD82]">
                <Globe2 className="w-4 h-4 shrink-0" aria-hidden="true" />
                <span>ASF Charter · 2026-11-05</span>
              </div>
              <h2 className="font-editorial text-3xl sm:text-4xl font-normal text-[#FFF6E8]">
                {hospitalityHeading}
              </h2>
              <div className="pt-2 flex flex-wrap gap-4 text-xs">
                <Link
                  to="/terms-conditions"
                  className="text-[#F3CD82] hover:text-white underline underline-offset-4"
                >
                  {t('footer.termsConditions')}
                </Link>
                <Link
                  to="/faqs"
                  className="text-[#F3CD82] hover:text-white underline underline-offset-4"
                >
                  {t('sitemap.faqs')}
                </Link>
              </div>
            </div>

            <div className="lg:col-span-7 space-y-5">
              {hospitalityPoints.map((pt, i) => (
                <div
                  key={i}
                  className="flex items-start gap-3.5 pb-5 border-b border-[rgba(213,172,112,0.2)] last:border-b-0"
                >
                  <CheckCircle2 className="w-4 h-4 text-[#D6A447] shrink-0 mt-1" aria-hidden="true" />
                  <p className="text-sm sm:text-base leading-[1.75] text-[#F5F0E7]/85">{pt}</p>
                </div>
              ))}
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
};
