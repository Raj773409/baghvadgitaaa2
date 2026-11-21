import React, { useMemo, useState } from 'react';
import { ArrowRight, CheckCircle2, Globe2, HandHeart, Loader2, Users } from 'lucide-react';
import { Link } from 'react-router-dom';
import {
  MOVEMENT_TEN_PATHWAYS,
  type MovementPathwayItem,
} from '../../content/participationContent';
import { usePublicCms } from '../../hooks/usePublicCms';
import { useI18n } from '../../i18n';
import { EditorialHeading } from '../ui/EditorialHeading';
import { SectionLabel } from '../ui/SectionLabel';

type SpotlightFilter = 'all' | 'youth' | 'participant' | 'institution' | 'global' | 'volunteer';

export const BePartOfGlobalMovementSection: React.FC = () => {
  const { contentLocale: locale } = useI18n();
  const publicCms = usePublicCms();
  const [activeTab, setActiveTab] = useState<SpotlightFilter>('all');
  const [volunteerOpen, setVolunteerOpen] = useState(false);

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

  const cmsCategories = useMemo(
    () =>
      (publicCms?.cmsItems ?? []).filter(
        (c) => c.section === 'participationCategories',
      ),
    [publicCms],
  );

  const filteredPathways = useMemo(() => {
    if (activeTab === 'all') return MOVEMENT_TEN_PATHWAYS;
    return MOVEMENT_TEN_PATHWAYS.filter((item) => item.categoryGroup === activeTab);
  }, [activeTab]);

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
        throw new Error(json.error || 'Could not record volunteer seva application.');
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

  const tabs: ReadonlyArray<{ id: SpotlightFilter; label: { en: string; hi: string; te: string } }> = [
    { id: 'all', label: { en: 'All 10 Pathways', hi: 'सभी १० मार्ग', te: 'అన్ని 10 మార్గాలు' } },
    { id: 'youth', label: { en: 'Youth (15–35)', hi: 'युवा (१५–३५)', te: 'యువత (15–35)' } },
    { id: 'participant', label: { en: 'Individual, Family & Group', hi: 'व्यक्तिगत, परिवार व समूह', te: 'వ్యక్తిగత, కుటుంబ & బృందం' } },
    { id: 'institution', label: { en: 'Institutions & Partners', hi: 'संस्थाएँ एवं भागीदार', te: 'సంస్థలు & భాగస్వాములు' } },
    { id: 'global', label: { en: 'Global & Parayana', hi: 'वैश्विक एवं पारायण', te: 'గ్లోబల్ & పారాయణం' } },
    { id: 'volunteer', label: { en: 'Volunteer Seva', hi: 'स्वयंसेवक सेवा', te: 'స్వచ్ఛంద సేవ' } },
  ];

  const copy = {
    eyebrow:
      locale === 'hi'
        ? 'सहभागिता के दस आयाम'
        : locale === 'te'
          ? 'భాగస్వామ్యానికి పది మార్గాలు'
          : 'Ten Pathways of Participation',
    heading:
      locale === 'hi'
        ? 'वैश्विक अभियान का हिस्सा बनें'
        : locale === 'te'
          ? 'విశ్వ ఉద్యమంలో భాగస్వాములు కండి'
          : 'BE PART OF THE GLOBAL MOVEMENT',
    lead:
      locale === 'hi'
        ? 'व्यक्तिगत साधक से लेकर परिवार, युवा (15–35), विश्वविद्यालय, पारायण आयोजक और सेवा दल तक—प्रत्येक सहभागी के लिए समर्पित मार्ग।'
        : locale === 'te'
          ? 'వ్యక్తిగత సాధకుల నుండి కుటుంబాలు, యువత (15–35), విద్యాసంస్థలు, పారాయణ నిర్వాహకులు మరియు సేవా దళం వరకు ప్రతి ఒక్కరికీ ప్రత్యేక మార్గం.'
          : 'From individual chanter and multi-generational families to Youth Gita delegates (15–35), universities, regional Parayana hosts, and Seva coordinators.',
    volunteerTitle:
      locale === 'hi'
        ? 'त्वरित स्वयंसेवक सेवा नामांकन'
        : locale === 'te'
          ? 'తక్షణ స్వచ్ఛంద సేవా నమోదు'
          : 'Quick Volunteer Seva Enrollment',
  };

  const renderPathwayAction = (item: MovementPathwayItem) => {
    if (item.actionKind === 'volunteer') {
      return (
        <button
          type="button"
          onClick={() => {
            setVolunteerOpen(true);
            window.setTimeout(() => {
              document.getElementById('volunteer-seva-inline')?.scrollIntoView({
                behavior: 'smooth',
                block: 'center',
              });
            }, 60);
          }}
          data-testid={`movement-cta-${item.id}`}
          className="inline-flex items-center justify-between gap-1.5 w-full min-h-[40px] px-3.5 py-2 rounded-full bg-[#17233A] text-[#FFFDF7] hover:bg-[#0D1322] dark:bg-[#C9A04E] dark:text-[#171717] dark:hover:bg-[#F0D38B] text-[10.5px] font-semibold uppercase tracking-[0.04em] whitespace-nowrap transition-colors cursor-pointer"
        >
          <span className="truncate">{item.ctaLabel[locale]}</span>
          <HandHeart className="w-3.5 h-3.5 shrink-0 text-[#F0D38B] dark:text-[#171717]" aria-hidden="true" />
        </button>
      );
    }

    return (
      <Link
        to={item.actionHref}
        data-testid={`movement-cta-${item.id}`}
        className="inline-flex items-center justify-between gap-1.5 w-full min-h-[40px] px-3.5 py-2 rounded-full border border-[#C9A04E]/55 text-[var(--color-ink)] hover:bg-[#C9A04E] hover:text-[#171717] hover:border-[#C9A04E] text-[10.5px] font-semibold uppercase tracking-[0.04em] whitespace-nowrap transition-colors"
      >
        <span className="truncate">{item.ctaLabel[locale]}</span>
        <ArrowRight className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
      </Link>
    );
  };

  return (
    <section
      id="global-movement"
      aria-labelledby="global-movement-heading"
      data-testid="global-movement-section"
      className="py-20 lg:py-28 bg-[var(--color-canvas)] text-[var(--color-ink)] hairline-b"
    >
      <div className="max-w-[1360px] mx-auto px-5 sm:px-8 lg:px-12 space-y-10">
        {/* Header + Filter Controls */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-end pb-8 hairline-b">
          <div className="lg:col-span-7 space-y-4">
            <SectionLabel>{copy.eyebrow}</SectionLabel>
            <EditorialHeading as="h2" size="section" className="tracking-[0.01em]">
              <span id="global-movement-heading">{copy.heading}</span>
            </EditorialHeading>
          </div>
          <div className="lg:col-span-5">
            <p className="text-sm sm:text-base leading-relaxed text-[var(--color-muted)]">
              {copy.lead}
            </p>
          </div>
        </div>

        {/* Category Filter Tabs */}
        <div
          role="tablist"
          aria-label="Filter participation pathways"
          className="flex flex-wrap items-center gap-2"
        >
          {tabs.map((tab) => {
            const selected = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                role="tab"
                aria-selected={selected}
                onClick={() => setActiveTab(tab.id)}
                data-testid={`movement-tab-${tab.id}`}
                className={`px-4 py-2 rounded-full text-xs font-semibold tracking-[0.04em] border transition-colors cursor-pointer ${
                  selected
                    ? 'royal-gold-surface border-[#C9A04E] text-[#171717]'
                    : 'bg-[var(--surface-elevated)] border-[var(--color-border)] text-[var(--color-ink)] hover:border-[#C9A04E]'
                }`}
              >
                {tab.label[locale]}
              </button>
            );
          })}
        </div>

        {/* Dynamic 10-Pathway Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-5">
          {filteredPathways.map((item, idx) => {
            const cmsOverride = cmsCategories.find((c) => c.meta?.id === item.id);
            const titleText = cmsOverride?.title || item.title[locale];
            const subtitleText = cmsOverride?.subtitle || item.subtitle[locale];
            const descText = cmsOverride?.body || item.description[locale];

            return (
              <article
                key={item.id}
                data-testid={`movement-card-${item.id}`}
                className="rounded-xl bg-[var(--surface-elevated)] border border-[var(--color-border)] hover:border-[#C9A04E] p-5 flex flex-col justify-between gap-5 transition-colors shadow-[0_6px_22px_rgba(23,35,58,0.04)]"
              >
                <div className="space-y-2.5">
                  <div className="flex items-center justify-between gap-2 text-[10px] font-semibold tracking-[0.16em] uppercase text-[var(--color-bronze)] tabular-nums">
                    <span>{String(idx + 1).padStart(2, '0')}</span>
                    <Users className="w-3.5 h-3.5 text-[#C9A04E]" aria-hidden="true" />
                  </div>
                  <h3 className="font-editorial text-xl text-[var(--color-ink)] leading-snug">
                    {titleText}
                  </h3>
                  <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-[var(--color-bronze)]">
                    {subtitleText}
                  </p>
                  <p className="text-xs sm:text-[13px] leading-relaxed text-[var(--color-muted)]">
                    {descText}
                  </p>
                </div>

                <div className="pt-3 border-t border-[var(--color-border)]">
                  {renderPathwayAction(item)}
                </div>
              </article>
            );
          })}
        </div>

        {/* Toggleable Inline Volunteer Seva Application Form */}
        <div
          id="volunteer-seva-inline"
          className="rounded-2xl bg-[var(--surface-elevated)] border border-[#C9A04E]/45 p-6 sm:p-8"
        >
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="space-y-1">
              <div className="flex items-center gap-2 text-xs font-semibold tracking-[0.16em] uppercase text-[var(--color-bronze)]">
                <Globe2 className="w-4 h-4 text-[#C9A04E]" aria-hidden="true" />
                <span>Karma Yoga · Seva Desk</span>
              </div>
              <h3 className="font-editorial text-2xl sm:text-3xl text-[var(--color-ink)]">
                {copy.volunteerTitle}
              </h3>
            </div>
            <button
              type="button"
              onClick={() => setVolunteerOpen((v) => !v)}
              data-testid="toggle-inline-volunteer"
              className="inline-flex items-center justify-center gap-2 min-h-[42px] px-5 py-2 rounded-full royal-gold-surface text-xs font-semibold uppercase tracking-[0.06em] cursor-pointer shrink-0"
            >
              <HandHeart className="w-4 h-4" aria-hidden="true" />
              <span>{volunteerOpen ? 'Hide Seva Form' : 'Open Seva Form'}</span>
            </button>
          </div>

          {volunteerOpen && (
            <form
              onSubmit={handleVolunteerSubmit}
              data-testid="inline-volunteer-form"
              className="mt-6 pt-6 border-t border-[var(--color-border)] space-y-4"
            >
              {volResult && (
                <div
                  data-testid="inline-volunteer-success"
                  className="rounded-xl border border-[#2E6F40]/40 bg-[#2E6F40]/10 p-4 text-xs sm:text-sm flex items-center justify-between gap-4"
                >
                  <span className="inline-flex items-center gap-2 font-medium text-[var(--color-ink)]">
                    <CheckCircle2 className="w-4 h-4 text-[#2E6F40]" aria-hidden="true" />
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

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                <label className="space-y-1 text-xs font-medium text-[var(--color-muted)]">
                  <span>Full Name *</span>
                  <input
                    type="text"
                    required
                    value={volForm.fullName}
                    onChange={(e) => setVolForm({ ...volForm, fullName: e.target.value })}
                    placeholder="Enter full name"
                    className="w-full min-h-[40px] px-3 rounded-lg border border-[var(--color-border)] bg-[var(--color-canvas)] text-sm text-[var(--color-ink)]"
                  />
                </label>
                <label className="space-y-1 text-xs font-medium text-[var(--color-muted)]">
                  <span>Email *</span>
                  <input
                    type="email"
                    required
                    value={volForm.email}
                    onChange={(e) => setVolForm({ ...volForm, email: e.target.value })}
                    placeholder="seva@example.org"
                    className="w-full min-h-[40px] px-3 rounded-lg border border-[var(--color-border)] bg-[var(--color-canvas)] text-sm text-[var(--color-ink)]"
                  />
                </label>
                <label className="space-y-1 text-xs font-medium text-[var(--color-muted)]">
                  <span>Phone / WhatsApp *</span>
                  <input
                    type="tel"
                    required
                    value={volForm.phone}
                    onChange={(e) => setVolForm({ ...volForm, phone: e.target.value })}
                    placeholder="+91 98490 00000"
                    className="w-full min-h-[40px] px-3 rounded-lg border border-[var(--color-border)] bg-[var(--color-canvas)] text-sm text-[var(--color-ink)]"
                  />
                </label>
                <label className="space-y-1 text-xs font-medium text-[var(--color-muted)]">
                  <span>Department</span>
                  <select
                    value={volForm.department}
                    onChange={(e) => setVolForm({ ...volForm, department: e.target.value })}
                    className="w-full min-h-[40px] px-3 rounded-lg border border-[var(--color-border)] bg-[var(--color-canvas)] text-sm text-[var(--color-ink)]"
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
                    className="w-full min-h-[40px] px-3 rounded-lg border border-[var(--color-border)] bg-[var(--color-canvas)] text-sm text-[var(--color-ink)]"
                  />
                </label>
                <label className="space-y-1 text-xs font-medium text-[var(--color-muted)]">
                  <span>City</span>
                  <input
                    type="text"
                    value={volForm.city}
                    onChange={(e) => setVolForm({ ...volForm, city: e.target.value })}
                    className="w-full min-h-[40px] px-3 rounded-lg border border-[var(--color-border)] bg-[var(--color-canvas)] text-sm text-[var(--color-ink)]"
                  />
                </label>
              </div>

              <button
                type="submit"
                disabled={volSubmitting}
                data-testid="inline-volunteer-submit"
                className="inline-flex items-center gap-2 min-h-[42px] px-6 py-2 rounded-full royal-gold-surface text-xs font-semibold uppercase tracking-[0.06em] cursor-pointer disabled:opacity-60"
              >
                {volSubmitting && <Loader2 className="w-4 h-4 animate-spin" />}
                <span>Submit Seva Application</span>
              </button>
            </form>
          )}
        </div>
      </div>
    </section>
  );
};
