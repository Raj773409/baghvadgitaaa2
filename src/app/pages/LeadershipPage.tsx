import React, { useMemo } from 'react';
import { ArrowUpRight, Users } from 'lucide-react';
import { PublishedBlocksRenderer } from '../../components/cms/PublishedBlocksRenderer';
import { Footer } from '../../components/layout/Footer';
import { Header } from '../../components/layout/Header';
import { PageHeroBanner } from '../../components/layout/PageHeroBanner';
import { LeadershipSection } from '../../components/sections/LeadershipSection';
import { VERIFIED_ORGANISING_COMMITTEE } from '../../content/eventContent';
import { extractPublishedPageDetails } from '../../content/siteCatalog';
import { usePublicCms, usePublishedCollections } from '../../hooks/usePublicCms';
import { useI18n } from '../../i18n';

function getInitials(name: string): string {
  const parts = name
    .replace(/[()]/g, ' ')
    .split(/\s+/)
    .filter((w) => w.length > 0 && w.toUpperCase() === w[0] + w.slice(1));
  if (parts.length === 0) return 'OM';
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
}

export const LeadershipPage: React.FC = () => {
  const { contentLocale: locale, t } = useI18n();
  const publicCms = usePublicCms();
  const pageDetails = useMemo(
    () => extractPublishedPageDetails(publicCms?.pages, '/leadership', locale),
    [publicCms?.pages, locale],
  );
  const publishedCommittee = usePublishedCollections('leadership');

  const committeeMembers = useMemo(() => {
    if (publishedCommittee.length === 0) return VERIFIED_ORGANISING_COMMITTEE;
    return publishedCommittee.map((item) => ({
      id: item.id,
      name: item.title,
      roleLabel: item.badgeLabel || 'Organising Committee',
      designation: item.subtitle,
      bio: item.description,
    }));
  }, [publishedCommittee]);

  const committeeHeading =
    locale === 'hi'
      ? 'प्रकाशित आयोजन समिति नेतृत्व'
      : locale === 'te'
        ? 'ప్రకటిత నిర్వాహక కమిటీ నాయకత్వం'
        : 'Published Organising Committee Leadership';

  const volunteerNote =
    locale === 'hi'
      ? '२७ फरवरी २०२७ के लक्ष्य की ओर कार्यरत २०० से अधिक समर्पित उप-समिति प्रमुखों, क्षेत्र समन्वयकों एवं विश्वभर के सहस्रों स्वयंसेवकों के सहयोग से संचालित।'
      : locale === 'te'
        ? '27 ఫిబ్రవరి 2027 మహావేడుక కోసం ప్రపంచవ్యాప్తంగా అంకితభావంతో పనిచేస్తున్న 200+ ఉప-కమిటీ నాయకులు, విభాగ సమన్వయకర్తలు మరియు వేలాది స్వచ్ఛంద సేవకుల సహకారంతో.'
        : 'Supported by over 200 dedicated sub-committee leaders, domain coordinators, and thousands of volunteers worldwide working collaboratively towards 27 February 2027.';

  return (
    <div className="min-h-screen flex flex-col bg-[var(--color-canvas)] text-[var(--color-ink)]">
      <Header variant="solid-dark" />

      <main id="main-content" className="flex-1">
        <PageHeroBanner
          eyebrow={pageDetails.pickHeroEyebrow(t('pages.leadershipEyebrow'))}
          title={pageDetails.pickPageTitle(t('pages.leadershipTitle'))}
          lead={pageDetails.pickPageSubtitle(t('pages.leadershipLead'))}
          breadcrumbLabel={t('sitemap.leadership')}
        />

        <PublishedBlocksRenderer blocks={pageDetails.extraBlocks} locale={locale} />

        {/* Published Organising Committee Profiles */}
        <section className="py-16 sm:py-24 bg-[var(--surface-elevated)] border-b border-[var(--color-border)]">
          <div className="max-w-[1360px] mx-auto px-5 sm:px-8 lg:px-12 space-y-12">
            <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-6 pb-8 border-b border-[var(--color-border)]">
              <div className="space-y-3 max-w-2xl">
                <div className="flex items-center gap-2.5 text-[11px] font-medium tracking-[0.2em] uppercase text-[var(--color-bronze)]">
                  <Users className="w-4 h-4 shrink-0" aria-hidden="true" />
                  <span>Aishwarya Sarvahith Foundation &amp; Sree Media</span>
                </div>
                <h2 className="font-editorial text-3xl sm:text-4xl font-normal text-[var(--color-ink)]">
                  {committeeHeading}
                </h2>
              </div>

              <a
                href="https://bhagavadgitavishwamahotsav.com/about/organising-committee"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 text-xs font-medium tracking-[0.06em] uppercase text-[var(--color-bronze)] hover:underline"
              >
                <span>{t('footer.officialWebsite')}</span>
                <ArrowUpRight className="w-4 h-4" aria-hidden="true" />
              </a>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-7">
              {committeeMembers.map((member) => (
                <article
                  key={member.id}
                  className="bg-[var(--color-canvas)] border border-[var(--color-border)] p-7 flex flex-col justify-between gap-6"
                >
                  <div className="space-y-4">
                    <div className="flex items-center justify-between gap-4">
                      <div
                        aria-hidden="true"
                        className="w-14 h-14 rounded-full bg-[#17233A] text-[#F3CD82] border border-[#D6A447]/60 flex items-center justify-center font-editorial text-xl tracking-[0.04em] shrink-0"
                      >
                        {getInitials(member.name)}
                      </div>
                      <span className="text-[11px] font-medium tracking-[0.12em] uppercase text-[#2E6F40] dark:text-[#6EE7B7]">
                        {t('common.statusConfirmed')}
                      </span>
                    </div>

                    <div>
                      <p className="text-[11px] font-medium tracking-[0.14em] uppercase text-[var(--color-bronze)]">
                        {member.roleLabel}
                      </p>
                      <h3 className="font-editorial text-2xl font-normal text-[var(--color-ink)] mt-1">
                        {member.name}
                      </h3>
                      <p className="text-xs font-medium text-[var(--color-muted)] mt-1">
                        {member.designation}
                      </p>
                    </div>

                    <p className="text-sm leading-[1.75] text-[var(--color-muted)]">{member.bio}</p>
                  </div>

                  <p className="pt-4 border-t border-[var(--color-border)] text-[11px] text-[var(--color-muted)]">
                    Official Portal · Organising Committee
                  </p>
                </article>
              ))}
            </div>

            <div className="bg-[#161412] text-[#FFF6E8] p-6 sm:p-8 border border-[#D6A447]/30 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <p className="text-sm sm:text-base leading-relaxed text-[#F5F0E7]/85 max-w-3xl">
                {volunteerNote}
              </p>
              <span className="text-xs font-medium tracking-[0.14em] uppercase text-[#F3CD82] whitespace-nowrap">
                200+ Coordinators
              </span>
            </div>
          </div>
        </section>

        {/* External Council & Spiritual Leadership Reserve */}
        <LeadershipSection />
      </main>

      <Footer />
    </div>
  );
};
