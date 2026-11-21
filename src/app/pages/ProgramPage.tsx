import React, { useMemo, useState } from 'react';
import { ArrowRight, Calendar, Clock, Globe, MapPin } from 'lucide-react';
import { Link } from 'react-router-dom';
import { PublishedBlocksRenderer } from '../../components/cms/PublishedBlocksRenderer';
import { Footer } from '../../components/layout/Footer';
import { Header } from '../../components/layout/Header';
import { PageHeroBanner } from '../../components/layout/PageHeroBanner';
import { OFFICIAL_EVENTS_PROGRAM, OFFICIAL_SCHEDULE_LEDGER } from '../../content/eventContent';
import { extractPublishedPageDetails } from '../../content/siteCatalog';
import { usePublicCms, usePublishedCollections } from '../../hooks/usePublicCms';
import { useI18n } from '../../i18n';
import type { ApprovalStatus, EventRecord } from '../../types/cms';

type CategoryFilter = 'all' | EventRecord['category'];

export const ProgramPage: React.FC = () => {
  const { contentLocale: locale, t } = useI18n();
  const publicCms = usePublicCms();
  const [filter, setFilter] = useState<CategoryFilter>('all');

  const pageDetails = useMemo(
    () => extractPublishedPageDetails(publicCms?.pages, '/program', locale),
    [publicCms?.pages, locale],
  );
  const publishedEventsCollection = usePublishedCollections('events');
  const publishedScheduleCollection = usePublishedCollections('schedule');

  const mergedEvents: EventRecord[] = useMemo(() => {
    const baseById = new Map(OFFICIAL_EVENTS_PROGRAM.map((e) => [e.id, e]));
    if (publishedEventsCollection.length === 0) return [...OFFICIAL_EVENTS_PROGRAM];
    return publishedEventsCollection.map((item) => {
      const existing = baseById.get(item.id);
      if (existing) {
        return {
          ...existing,
          title: { ...existing.title, [locale]: item.title || existing.title[locale] },
          subtitle: { ...existing.subtitle, [locale]: item.subtitle || existing.subtitle[locale] },
          description: {
            ...existing.description,
            [locale]: item.description || existing.description[locale],
          },
          dateDisplay: item.dateLabel
            ? { ...existing.dateDisplay, [locale]: item.dateLabel }
            : existing.dateDisplay,
        };
      }
      return {
        id: item.id,
        slug: item.id,
        isoDate: item.dateLabel || '',
        category: (item.meta.category as EventRecord['category']) || 'cultural',
        title: { en: item.title, hi: item.title, te: item.title },
        subtitle: { en: item.subtitle, hi: item.subtitle, te: item.subtitle },
        description: { en: item.description, hi: item.description, te: item.description },
        dateDisplay: {
          en: item.dateLabel || 'Scheduled',
          hi: item.dateLabel || 'निर्धारित',
          te: item.dateLabel || 'నిర్ణయించబడినది',
        },
        format: (item.meta.format as EventRecord['format']) || 'hybrid',
        location: item.locationLabel
          ? { en: item.locationLabel, hi: item.locationLabel, te: item.locationLabel }
          : null,
        scheduleTime: null,
        highlights: [],
        status: (item.meta.approvalStatus as ApprovalStatus) || 'upcoming',
      };
    });
  }, [locale, publishedEventsCollection]);

  const mergedSchedule = useMemo(() => {
    const baseById = new Map(OFFICIAL_SCHEDULE_LEDGER.map((s) => [s.id, s]));
    if (publishedScheduleCollection.length === 0) return [...OFFICIAL_SCHEDULE_LEDGER];
    return publishedScheduleCollection.map((item) => {
      const existing = baseById.get(item.id);
      if (existing) {
        return {
          ...existing,
          isoDate: item.dateLabel || existing.isoDate,
          title: { ...existing.title, [locale]: item.title || existing.title[locale] },
          venue: item.locationLabel
            ? { ...(existing.venue ?? existing.title), [locale]: item.locationLabel }
            : existing.venue,
        };
      }
      return {
        id: item.id,
        isoDate: item.dateLabel || 'TBA',
        timeSlot: item.subtitle || undefined,
        title: { en: item.title, hi: item.title, te: item.title },
        venue: item.locationLabel
          ? { en: item.locationLabel, hi: item.locationLabel, te: item.locationLabel }
          : undefined,
        status: (item.meta.approvalStatus as ApprovalStatus) || 'upcoming',
      };
    });
  }, [locale, publishedScheduleCollection]);

  const statusText = (status: ApprovalStatus): string => {
    if (status === 'confirmed') return t('common.statusConfirmed');
    if (status === 'upcoming') return t('common.statusUpcoming');
    if (status === 'canonical-reference') return t('common.statusCanonical');
    return t('common.statusPending');
  };

  const formatLabel = (format: EventRecord['format']): string => {
    if (format === 'online') {
      return locale === 'hi' ? 'ऑनलाइन' : locale === 'te' ? 'ఆన్‌లైన్' : 'Online Global';
    }
    if (format === 'hybrid') {
      return locale === 'hi' ? 'हाइब्रिड' : locale === 'te' ? 'హైబ్రిడ్' : 'Hybrid Format';
    }
    return locale === 'hi' ? 'हैदराबाद प्रत्यक्ष' : locale === 'te' ? 'హైదరాబాద్ ప్రత్యక్షం' : 'In-Person · Hyderabad';
  };

  const filterTabs: Array<{ id: CategoryFilter; label: Record<'en' | 'hi' | 'te', string> }> = [
    { id: 'all', label: { en: 'All Programmes', hi: 'सभी कार्यक्रम', te: 'అన్ని కార్యక్రమాలు' } },
    { id: 'milestone', label: { en: 'Core Milestones', hi: 'मुख्य पड़ाव', te: 'ప్రధాన ఘట్టాలు' } },
    { id: 'parayana', label: { en: 'Grand Parayana', hi: 'महापारायण', te: 'మహా పారాయణమ్' } },
    { id: 'youth', label: { en: 'Youth Gita', hi: 'युवा गीता', te: 'యువ గీత' } },
    { id: 'cultural', label: { en: 'Cultural Arts', hi: 'सांस्कृतिक उत्सव', te: 'సాంస్కృతిక వేడుక' } },
    { id: 'global-connect', label: { en: 'Global Connect', hi: 'ग्लोबल कनेक्ट', te: 'గ్లోబల్ కనెక్ట్' } },
  ];

  const visibleEvents =
    filter === 'all'
      ? mergedEvents
      : mergedEvents.filter((e) => e.category === filter);

  const ledgerHeading =
    locale === 'hi'
      ? 'कालानुक्रमिक कार्यक्रम तालिका'
      : locale === 'te'
        ? 'తేదీల వారీగా కార్యక్రమ పట్టిక'
        : 'Chronological Convocation Schedule Ledger';

  const pendingTimeCopy =
    locale === 'hi'
      ? 'सटीक सत्र समय की घोषणा प्रतीक्षित'
      : locale === 'te'
        ? 'నిర్దిష్ట సమయం త్వరలో ప్రకటించబడుతుంది'
        : 'Exact Session Timing Pending Organizer Release';

  return (
    <div className="min-h-screen flex flex-col bg-[var(--color-canvas)] text-[var(--color-ink)]">
      <Header variant="solid-dark" />

      <main id="main-content" className="flex-1">
        <PageHeroBanner
          eyebrow={pageDetails.pickHeroEyebrow(t('pages.programEyebrow'))}
          title={pageDetails.pickPageTitle(t('pages.programTitle'))}
          lead={pageDetails.pickPageSubtitle(t('pages.programLead'))}
          breadcrumbLabel={t('sitemap.events')}
        />

        <PublishedBlocksRenderer blocks={pageDetails.extraBlocks} locale={locale} />

        {/* Two-Stage Participation Progression Band */}
        <section className="bg-[#161412] text-[#FFF6E8] border-b border-[#D6A447]/20 py-10">
          <div className="max-w-[1360px] mx-auto px-5 sm:px-8 lg:px-12 grid grid-cols-1 md:grid-cols-2 gap-6 items-center">
            <div className="border-l-2 border-[#D6A447] pl-5 space-y-1">
              <p className="text-xs font-medium tracking-[0.16em] uppercase text-[#F3CD82] tabular-nums">
                Stage 01 · 20 December 2026
              </p>
              <p className="font-editorial text-xl sm:text-2xl">
                {t('timeline.curtainRaiserTitle')}
              </p>
              <p className="text-xs sm:text-sm text-[#F4E8D3]/75">
                {t('timeline.curtainRaiserDesc')}
              </p>
            </div>
            <div className="border-l-2 border-[#D6A447]/55 pl-5 space-y-1">
              <p className="text-xs font-medium tracking-[0.16em] uppercase text-[#F3CD82] tabular-nums">
                Stage 02 · 27 February 2027
              </p>
              <p className="font-editorial text-xl sm:text-2xl">
                {t('timeline.mainMahotsavTitle')}
              </p>
              <p className="text-xs sm:text-sm text-[#F4E8D3]/75">
                {t('timeline.mainMahotsavDesc')}
              </p>
            </div>
          </div>
        </section>

        {/* Filterable Programme Tracks */}
        <section className="py-16 sm:py-24 bg-[var(--surface-elevated)] border-b border-[var(--color-border)]">
          <div className="max-w-[1360px] mx-auto px-5 sm:px-8 lg:px-12 space-y-10">
            <div
              role="tablist"
              aria-label={t('pages.programTitle')}
              className="flex flex-wrap items-center gap-5 border-b border-[var(--color-border)] pb-4"
            >
              {filterTabs.map((tab) => {
                const active = filter === tab.id;
                return (
                  <button
                    key={tab.id}
                    type="button"
                    role="tab"
                    aria-selected={active}
                    onClick={() => setFilter(tab.id)}
                    className={`min-h-[40px] py-2 text-xs font-medium border-b-2 transition-colors whitespace-nowrap cursor-pointer ${
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

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {visibleEvents.map((ev) => (
                <article
                  key={ev.id}
                  className="bg-[var(--color-canvas)] border border-[var(--color-border)] p-6 sm:p-8 flex flex-col justify-between gap-6"
                >
                  <div className="space-y-4">
                    <div className="flex flex-wrap items-center justify-between gap-3 text-xs pb-4 border-b border-[var(--color-border)]">
                      <span className="inline-flex items-center gap-2 font-medium text-[var(--color-bronze)] tabular-nums">
                        <Calendar className="w-3.5 h-3.5" aria-hidden="true" />
                        <span>{ev.dateDisplay[locale]}</span>
                      </span>
                      <span className="inline-flex items-center gap-2 text-[11px] font-medium tracking-[0.12em] uppercase text-[var(--color-ink)]">
                        <span
                          aria-hidden="true"
                          className={`w-1.5 h-1.5 rounded-full ${
                            ev.status === 'confirmed'
                              ? 'bg-[#2E6F40]'
                              : ev.status === 'upcoming'
                                ? 'bg-[#B47D27]'
                                : 'bg-[#6F685F]'
                          }`}
                        />
                        {statusText(ev.status)}
                      </span>
                    </div>

                    <div>
                      <p className="text-[11px] font-medium tracking-[0.14em] uppercase text-[var(--color-muted)]">
                        {formatLabel(ev.format)}
                      </p>
                      <h2 className="font-editorial text-2xl sm:text-3xl font-normal text-[var(--color-ink)] mt-1">
                        {ev.title[locale]}
                      </h2>
                      <p className="text-sm font-medium text-[var(--color-bronze)] mt-1">
                        {ev.subtitle[locale]}
                      </p>
                    </div>

                    <p className="text-sm sm:text-[15px] leading-[1.75] text-[var(--color-muted)]">
                      {ev.description[locale]}
                    </p>

                    <ul className="space-y-2 pt-2 border-t border-[var(--color-border)]">
                      {ev.highlights.map((hl, idx) => (
                        <li
                          key={idx}
                          className="text-xs sm:text-[13px] text-[var(--color-muted)] flex items-start gap-2.5"
                        >
                          <span className="text-[var(--color-bronze)] mt-0.5">—</span>
                          <span>{hl[locale]}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  <div className="pt-4 border-t border-[var(--color-border)] flex flex-wrap items-center justify-between gap-3 text-xs text-[var(--color-muted)]">
                    <span className="inline-flex items-center gap-1.5">
                      <MapPin className="w-3.5 h-3.5 text-[var(--color-bronze)] shrink-0" aria-hidden="true" />
                      <span>
                        {ev.location
                          ? ev.location[locale]
                          : locale === 'hi'
                            ? 'हैदराबाद (विवरण प्रतीक्षित)'
                            : locale === 'te'
                              ? 'హైదరాబాద్ (వివరాలు త్వరలో)'
                              : 'Hyderabad (Exact Precinct Pending Organizer Release)'}
                      </span>
                    </span>
                    <Link
                      to="/participate/register"
                      className="inline-flex items-center gap-1.5 font-medium text-[var(--color-bronze)] hover:underline"
                    >
                      <span>{t('nav.register')}</span>
                      <ArrowRight className="w-3.5 h-3.5" aria-hidden="true" />
                    </Link>
                  </div>
                </article>
              ))}
            </div>
          </div>
        </section>

        {/* Chronological Schedule Ledger */}
        <section className="py-16 sm:py-24 bg-[var(--color-canvas)]">
          <div className="max-w-[1360px] mx-auto px-5 sm:px-8 lg:px-12 space-y-10">
            <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
              <div className="space-y-2">
                <p className="text-[11px] font-medium tracking-[0.2em] uppercase text-[var(--color-bronze)]">
                  {t('timeline.eyebrow')}
                </p>
                <h2 className="font-editorial text-3xl sm:text-4xl font-normal text-[var(--color-ink)]">
                  {ledgerHeading}
                </h2>
              </div>
              <Link
                to="/participate"
                className="inline-flex items-center gap-2 text-sm font-medium text-[var(--color-bronze)] hover:underline"
              >
                <Globe className="w-4 h-4" aria-hidden="true" />
                <span>{t('sitemap.participate')}</span>
              </Link>
            </div>

            <div className="border-t border-[var(--color-border)] divide-y divide-[var(--color-border)]">
              {mergedSchedule.map((item) => (
                <div
                  key={item.id}
                  className="py-6 grid grid-cols-1 md:grid-cols-12 gap-4 items-center"
                >
                  <div className="md:col-span-3 space-y-1">
                    <p className="font-display text-xl text-[var(--color-bronze)] tabular-nums">
                      {item.isoDate}
                    </p>
                    <p className="inline-flex items-center gap-1.5 text-xs text-[var(--color-muted)]">
                      <Clock className="w-3.5 h-3.5 text-[var(--color-bronze)]" aria-hidden="true" />
                      <span>{item.timeSlot ?? pendingTimeCopy}</span>
                    </p>
                  </div>

                  <div className="md:col-span-6 space-y-1">
                    <h3 className="font-editorial text-xl sm:text-2xl text-[var(--color-ink)]">
                      {item.title[locale]}
                    </h3>
                    {item.venue && (
                      <p className="text-xs sm:text-sm text-[var(--color-muted)]">{item.venue[locale]}</p>
                    )}
                  </div>

                  <div className="md:col-span-3 md:text-right">
                    <span className="text-xs font-medium tracking-[0.1em] uppercase text-[var(--color-bronze)]">
                      {statusText(item.status)}
                    </span>
                  </div>
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
