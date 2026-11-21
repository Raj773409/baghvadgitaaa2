import React, { useEffect, useMemo, useRef, useState } from 'react';
import { ArrowRight, ChevronLeft, ChevronRight, Volume2 } from 'lucide-react';
import { Link, useLocation } from 'react-router-dom';
import { PublishedBlocksRenderer } from '../../components/cms/PublishedBlocksRenderer';
import { Footer } from '../../components/layout/Footer';
import { Header } from '../../components/layout/Header';
import { PageHeroBanner } from '../../components/layout/PageHeroBanner';
import { InteractiveGitaBook3D } from '../../components/scripture/InteractiveGitaBook3D';
import { ScriptureExperience } from '../../components/scripture/ScriptureExperience';
import { ChaptersGridSection } from '../../components/sections/ChaptersGridSection';
import { ChapterExplorer } from '../../components/sections/ChapterExplorer';
import { GITA_CHAPTER_CATALOG } from '../../content/scriptureContent';
import { extractPublishedPageDetails } from '../../content/siteCatalog';
import { usePublicCms } from '../../hooks/usePublicCms';
import { useI18n } from '../../i18n';
import { parseChapterQueryParam } from '../../utils/navigationAndRoutes';

type DivisionFilter = 'all' | 'karma' | 'bhakti' | 'jnana';

export const GitaPage: React.FC = () => {
  const { contentLocale, currentLocaleMeta, getChapterContent, t } = useI18n();
  const publicCms = usePublicCms();
  const location = useLocation();
  const dossierSectionRef = useRef<HTMLElement | null>(null);
  const initialChapter = parseChapterQueryParam(location.search) ?? 1;
  const [division, setDivision] = useState<DivisionFilter>('all');
  const [selectedChapterNum, setSelectedChapterNum] = useState<number>(initialChapter);
  const [dossierScript, setDossierScript] = useState<'all' | 'sa' | 'en' | 'hi' | 'te'>('all');

  useEffect(() => {
    const requested = parseChapterQueryParam(location.search);
    if (requested !== null) {
      setDivision('all');
      setSelectedChapterNum(requested);
      window.requestAnimationFrame(() => {
        dossierSectionRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      });
    }
  }, [location.search]);

  const pageDetails = useMemo(
    () => extractPublishedPageDetails(publicCms?.pages, '/gita', contentLocale),
    [publicCms?.pages, contentLocale],
  );

  const mergedCatalog = useMemo(() => {
    const ovMap = new Map(
      (publicCms?.scriptureChapters ?? [])
        .filter((c) => c.status === 'published')
        .map((c) => [c.chapterNumber, c]),
    );
    return GITA_CHAPTER_CATALOG.map((ch) => {
      const ov = ovMap.get(ch.chapterNumber);
      if (!ov) return ch;
      return {
        ...ch,
        sanskritDevanagari: ov.titleSanskrit || ch.sanskritDevanagari,
        verseCount: ov.verseCount || ch.verseCount,
        approvedAudioUrl: ov.audioUrl ?? ch.approvedAudioUrl,
        title: {
          en: ov.titleEn || ch.title.en,
          hi: ov.titleHi || ch.title.hi,
          te: ov.titleTe || ch.title.te,
        },
        essence: {
          en: ov.summaryEn || ch.essence.en,
          hi: ov.summaryHi || ch.essence.hi,
          te: ov.summaryTe || ch.essence.te,
        },
      };
    });
  }, [publicCms?.scriptureChapters]);

  const visibleChapters = mergedCatalog.filter((ch) => {
    if (division === 'karma') return ch.chapterNumber <= 6;
    if (division === 'bhakti') return ch.chapterNumber >= 7 && ch.chapterNumber <= 12;
    if (division === 'jnana') return ch.chapterNumber >= 13;
    return true;
  });

  const activeChapter =
    mergedCatalog.find((ch) => ch.chapterNumber === selectedChapterNum) ??
    mergedCatalog[0];

  const baseTranslated = getChapterContent(activeChapter.chapterNumber);
  const activeTranslated = {
    title: activeChapter.title[contentLocale] || baseTranslated.title,
    essence: activeChapter.essence[contentLocale] || baseTranslated.essence,
  };

  const handleSelectDivision = (next: DivisionFilter) => {
    setDivision(next);
    if (next === 'karma') setSelectedChapterNum(1);
    if (next === 'bhakti') setSelectedChapterNum(7);
    if (next === 'jnana') setSelectedChapterNum(13);
  };

  const divisionTabs: Array<{ id: DivisionFilter; label: string }> = [
    { id: 'all', label: t('chapters.divisionAll') },
    { id: 'karma', label: t('chapters.divisionKarma') },
    { id: 'bhakti', label: t('chapters.divisionBhakti') },
    { id: 'jnana', label: t('chapters.divisionJnana') },
  ];

  const catalogHeading =
    contentLocale === 'hi'
      ? 'अष्टादश अध्याय संदर्भ सूची (१८ अध्याय · ७०० श्लोक)'
      : contentLocale === 'te'
        ? 'భగవద్గీత అష్టాదశ అధ్యాయ సూచిక (18 అధ్యాయాలు · 700 శ్లోకాలు)'
        : t('chapters.gridDirectoryTitle');

  return (
    <div className="min-h-screen flex flex-col bg-[#F5F0E7] text-[#171817]">
      <Header variant="solid-dark" />

      <main id="main-content" className="flex-1">
        <PageHeroBanner
          eyebrow={pageDetails.pickHeroEyebrow(t('pages.gitaEyebrow'))}
          title={pageDetails.pickPageTitle(t('pages.gitaTitle'))}
          lead={pageDetails.pickPageSubtitle(t('pages.gitaLead'))}
          breadcrumbLabel={t('sitemap.chapters')}
          metaRight={
            <div className="inline-flex lg:flex-col lg:items-end gap-3 lg:gap-1 text-xs text-[#F4E8D3]/80">
              <span className="uppercase tracking-[0.16em] text-[#F3CD82]">
                {t('common.statusCanonical')}
              </span>
              <span className="tabular-nums font-editorial text-lg text-[#FFF6E8]">
                18 Chapters · 700 Verses
              </span>
            </div>
          }
        />

        <PublishedBlocksRenderer blocks={pageDetails.extraBlocks} locale={contentLocale} />

        {/* Interactive 3D Bhagavad Gita Book + Indian Voice Assistant */}
        <section className="py-14 sm:py-20 bg-[#0E1523] text-[#FFFDF7] border-b border-[#C9A04E]/25">
          <div className="max-w-[1360px] mx-auto px-5 sm:px-8 lg:px-12">
            <InteractiveGitaBook3D initialChapter={selectedChapterNum} />
          </div>
        </section>

        {/* Responsive 18-Chapter Grid Cards with Click-to-View Teachings */}
        <ChaptersGridSection />

        {/* Interactive Multilingual Scripture Reader */}
        <section className="py-16 sm:py-20 bg-[#101426] text-[#FFF6E8] border-b border-[#D6A447]/20">
          <div className="max-w-[1360px] mx-auto px-5 sm:px-8 lg:px-12">
            <ScriptureExperience />
          </div>
        </section>

        {/* Full 18-Chapter Editorial Dossier */}
        <section
          id="chapter-dossier"
          ref={dossierSectionRef}
          className="scroll-mt-24 py-16 sm:py-24 bg-[#FFFDF9] text-[#171817] border-b border-[#DDD3C4]"
        >
          <div className="max-w-[1360px] mx-auto px-5 sm:px-8 lg:px-12 space-y-10">
            <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-6 pb-8 border-b border-[#DDD3C4]">
              <div className="space-y-2.5 max-w-2xl">
                <p className="text-[11px] font-medium tracking-[0.2em] uppercase text-[#8A693A]">
                  {t('chapters.eyebrow')}
                </p>
                <h2 className="font-editorial text-3xl sm:text-4xl font-normal text-[#171817]">
                  {catalogHeading}
                </h2>
              </div>

              <div
                role="tablist"
                aria-label={catalogHeading}
                className="flex flex-wrap items-center gap-5"
              >
                {divisionTabs.map((tab) => {
                  const active = division === tab.id;
                  return (
                    <button
                      key={tab.id}
                      type="button"
                      role="tab"
                      aria-selected={active}
                      onClick={() => handleSelectDivision(tab.id)}
                      className={`min-h-[40px] py-2 text-xs font-medium border-b-2 transition-colors whitespace-nowrap cursor-pointer ${
                        active
                          ? 'border-[#101D32] text-[#101D32]'
                          : 'border-transparent text-[#50555E] hover:text-[#171817]'
                      }`}
                    >
                      {tab.label}
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
              {/* Chapter Numbered Directory List */}
              <div className="lg:col-span-5 border-t border-[#DDD3C4] divide-y divide-[#DDD3C4]">
                {visibleChapters.map((ch) => {
                  const active = ch.chapterNumber === activeChapter.chapterNumber;
                  return (
                    <button
                      key={ch.chapterNumber}
                      type="button"
                      onClick={() => setSelectedChapterNum(ch.chapterNumber)}
                      aria-pressed={active}
                      className={`w-full text-left py-4 px-3 flex items-baseline justify-between gap-4 transition-colors cursor-pointer ${
                        active
                          ? 'bg-[#101D32] text-[#FFF6E8]'
                          : 'hover:bg-[#F5F0E7] text-[#171817]'
                      }`}
                    >
                      <div className="flex items-baseline gap-4 min-w-0">
                        <span
                          className={`text-xs font-medium tabular-nums shrink-0 ${
                            active ? 'text-[#F3CD82]' : 'text-[#8A693A]'
                          }`}
                        >
                          {ch.paddedCode}
                        </span>
                        <div className="min-w-0">
                          <p className="font-editorial text-lg leading-snug truncate">
                            {ch.transliteration}
                          </p>
                          <p
                            className={`text-xs mt-0.5 truncate ${
                              active ? 'text-[#F4E8D3]/75' : 'text-[#50555E]'
                            }`}
                          >
                            {getChapterContent(ch.chapterNumber).title}
                          </p>
                        </div>
                      </div>
                      <span
                        className={`text-xs tabular-nums shrink-0 ${
                          active ? 'text-[#F3CD82]' : 'text-[#50555E]'
                        }`}
                      >
                        {ch.verseCount} vv
                      </span>
                    </button>
                  );
                })}
              </div>

              {/* Active Chapter Detail Panel */}
              <div className="lg:col-span-7 bg-[#F5F0E7] border border-[#C8A26A]/45 p-6 sm:p-10 space-y-6 lg:sticky lg:top-28">
                <div className="flex flex-wrap items-start justify-between gap-4 pb-6 border-b border-[#DDD3C4]">
                  <div className="space-y-1.5">
                    <p className="text-xs font-medium tracking-[0.16em] uppercase text-[#8A693A] tabular-nums">
                      {t('chapters.chapterPrefix')} {activeChapter.paddedCode} ·{' '}
                      {activeChapter.romanNumeral} · {activeChapter.verseCount} Shlokas
                    </p>
                    <p lang="sa" className="text-xl sm:text-2xl text-[#4A251B] font-medium">
                      {activeChapter.sanskritDevanagari}
                    </p>
                    <h3 className="font-editorial text-2xl sm:text-3xl font-normal text-[#171817] leading-snug">
                      {activeTranslated.title}
                    </h3>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      aria-label={t('chapters.prevChapter')}
                      onClick={() =>
                        setSelectedChapterNum((n) => (n <= 1 ? 18 : n - 1))
                      }
                      className="inline-flex items-center justify-center w-10 h-10 rounded-full border border-[#DDD3C4] bg-[#FFFDF9] text-[#171817] hover:border-[#8A693A] cursor-pointer"
                    >
                      <ChevronLeft className="w-4 h-4" aria-hidden="true" />
                    </button>
                    <button
                      type="button"
                      aria-label={t('chapters.nextChapter')}
                      onClick={() =>
                        setSelectedChapterNum((n) => (n >= 18 ? 1 : n + 1))
                      }
                      className="inline-flex items-center justify-center w-10 h-10 rounded-full border border-[#DDD3C4] bg-[#FFFDF9] text-[#171817] hover:border-[#8A693A] cursor-pointer"
                    >
                      <ChevronRight className="w-4 h-4" aria-hidden="true" />
                    </button>
                  </div>
                </div>

                {/* Multilingual Script Selector Tabs */}
                <div
                  role="tablist"
                  aria-label={t('chapters.multilingualEditionsTitle')}
                  className="flex flex-wrap items-center gap-4 border-b border-[#DDD3C4] pb-2"
                >
                  {(
                    [
                      { id: 'all', label: t('chapters.multilingualTabAll') },
                      { id: 'sa', label: t('chapters.multilingualTabSa') },
                      { id: 'en', label: t('chapters.multilingualTabEn') },
                      { id: 'hi', label: t('chapters.multilingualTabHi') },
                      { id: 'te', label: t('chapters.multilingualTabTe') },
                    ] as const
                  ).map((tab) => {
                    const active = dossierScript === tab.id;
                    return (
                      <button
                        key={tab.id}
                        type="button"
                        role="tab"
                        aria-selected={active}
                        onClick={() => setDossierScript(tab.id)}
                        className={`min-h-[34px] py-1 text-xs font-medium border-b-2 transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                          active
                            ? 'border-[#101D32] text-[#101D32]'
                            : 'border-transparent text-[#50555E] hover:text-[#171817]'
                        }`}
                      >
                        {tab.label}
                      </button>
                    );
                  })}
                </div>

                <div className="space-y-4">
                  <div className="flex items-center justify-between gap-2">
                    <p className="text-xs font-medium tracking-[0.14em] uppercase text-[#8A693A]">
                      {t('chapters.summarySlotTitle')}
                    </p>
                    <span className="text-[11px] font-medium tracking-[0.08em] uppercase text-[#8A693A]">
                      {currentLocaleMeta.nativeLabel} · {currentLocaleMeta.shortLabel}
                    </span>
                  </div>
                  {dossierScript === 'all' ? (
                    <div className="space-y-3">
                      <p className="text-base sm:text-[17px] leading-[1.8] text-[#24201C]">
                        {activeTranslated.essence}
                      </p>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-3 border-t border-[#DDD3C4] text-xs leading-relaxed text-[#50555E]">
                        <div>
                          <p className="font-semibold text-[#171817] mb-1">English</p>
                          <p>{activeChapter.essence.en}</p>
                        </div>
                        <div lang="hi">
                          <p className="font-semibold text-[#171817] mb-1">हिन्दी</p>
                          <p>{activeChapter.essence.hi}</p>
                        </div>
                        <div lang="te">
                          <p className="font-semibold text-[#171817] mb-1">తెలుగు</p>
                          <p>{activeChapter.essence.te}</p>
                        </div>
                      </div>
                    </div>
                  ) : dossierScript === 'sa' ? (
                    <div className="space-y-2">
                      <p lang="sa" className="text-lg font-medium text-[#4A251B]">
                        {activeChapter.sanskritDevanagari} ({activeChapter.transliteration})
                      </p>
                      <p className="text-sm text-[#50555E]">{t('chapters.awaitingApproval')}</p>
                    </div>
                  ) : (
                    <div className="space-y-2" lang={dossierScript}>
                      <p className="font-editorial text-xl text-[#171817]">
                        {activeChapter.title[dossierScript]}
                      </p>
                      <p className="text-base leading-[1.8] text-[#24201C]">
                        {activeChapter.essence[dossierScript]}
                      </p>
                    </div>
                  )}
                  <p className="text-xs text-[#50555E] pt-3 border-t border-[#DDD3C4]">
                    {t('chapters.extendedSummaryPlaceholder')}
                  </p>
                  <p className="text-xs text-[#50555E]">
                    {t('chapters.multilingualSlotPending')}
                  </p>
                </div>

                <div className="pt-5 border-t border-[#DDD3C4] flex items-start gap-2.5 text-xs text-[#50555E]">
                  <Volume2 className="w-4 h-4 text-[#8A693A] shrink-0 mt-0.5" aria-hidden="true" />
                  <span>{activeChapter.approvedAudioUrl ?? t('scripture.audioPending')}</span>
                </div>

                <div className="pt-2 flex flex-wrap items-center justify-between gap-4 border-t border-[#DDD3C4]">
                  <span className="text-xs text-[#50555E]">
                    {t('common.statusCanonical')} · {activeChapter.transliteration}
                  </span>
                  <Link
                    to="/participate/register"
                    className="inline-flex items-center gap-2 text-sm font-medium text-[#101D32] hover:text-[#8A693A] transition-colors"
                  >
                    <span>{t('participation.cta')}</span>
                    <ArrowRight className="w-4 h-4" aria-hidden="true" />
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Radial Mandala Explorer */}
        <ChapterExplorer />
      </main>

      <Footer />
    </div>
  );
};
