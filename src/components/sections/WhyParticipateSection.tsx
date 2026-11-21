import React, { useEffect, useMemo, useRef, useState } from 'react';
import { BookOpen, Loader2, Square, Volume2 } from 'lucide-react';
import { Link } from 'react-router-dom';
import { WHY_PARTICIPATE_REASONS } from '../../content/participationContent';
import { CANONICAL_GITA_VERSES } from '../../content/scriptureContent';
import { extractPublishedPageDetails, pickPublishedText } from '../../content/siteCatalog';
import { usePublicCms } from '../../hooks/usePublicCms';
import { useI18n } from '../../i18n';
import { EditorialHeading } from '../ui/EditorialHeading';
import { SectionLabel } from '../ui/SectionLabel';

export const WhyParticipateSection: React.FC = () => {
  const { contentLocale: locale } = useI18n();
  const publicCms = usePublicCms();
  const [selectedVerseIdx, setSelectedVerseIdx] = useState(0);
  const [audioStatus, setAudioStatus] = useState<'idle' | 'loading' | 'playing' | 'unavailable'>('idle');
  const [audioNote, setAudioNote] = useState<string | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const audioUrlRef = useRef<string | null>(null);

  const versesList = useMemo(() => {
    const published = (publicCms?.scriptureVerses ?? []).filter((v) => v.status === 'published');
    if (published.length === 0) return CANONICAL_GITA_VERSES;
    return published.map((pv) => {
      const base = CANONICAL_GITA_VERSES.find((c) => c.id === pv.id);
      return {
        id: pv.id,
        chapter: pv.chapterNumber,
        verse: pv.verseNumber,
        reference: `Bhagavad Gita ${pv.chapterNumber}.${pv.verseNumber}`,
        sanskritDevanagari: pv.sanskritDevanagari,
        transliteration: pv.transliteration,
        translationEn: pv.translationEn,
        meaningHi: pv.translationHi,
        meaningTe: pv.translationTe,
        theme: base?.theme ?? {
          en: pv.commentaryNote || 'Canonical Bhagavad Gita Wisdom',
          hi: pv.commentaryNote || 'श्रीमद्भगवद्गीता उपदेश',
          te: pv.commentaryNote || 'శ్రీమద్భగవద్గీత ఉపదేశం',
        },
        sourceAttribution: base?.sourceAttribution ?? {
          en: 'Bhagavad Gita · Critical Edition',
          hi: 'श्रीमद्भगवद्गीता',
          te: 'శ్రీమద్భగవద్గీత',
        },
        commentarySlot: base?.commentarySlot,
      };
    });
  }, [publicCms?.scriptureVerses]);

  const activeVerse = versesList[selectedVerseIdx] ?? versesList[0];

  const homeDetails = useMemo(
    () => extractPublishedPageDetails(publicCms?.pages, '/', locale),
    [publicCms?.pages, locale],
  );
  const homeWhyBlock = homeDetails.blocks.find((b) => b.id === 'home-why');
  const canonicalWhyBlock = homeDetails.canonicalSnapshot?.blocks.find((b) => b.id === 'home-why');

  const stopAudio = () => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current = null;
    }
    if (audioUrlRef.current) {
      URL.revokeObjectURL(audioUrlRef.current);
      audioUrlRef.current = null;
    }
    setAudioStatus('idle');
  };

  useEffect(() => () => stopAudio(), []);

  const handleToggleRecitation = async () => {
    if (audioStatus === 'playing') {
      stopAudio();
      return;
    }
    stopAudio();
    setAudioNote(null);
    setAudioStatus('loading');
    try {
      const res = await fetch(`/api/chapters/${activeVerse.chapter}/recitation`);
      if (!res.ok) {
        const json = (await res.json().catch(() => ({}))) as { error?: string };
        setAudioStatus('unavailable');
        setAudioNote(
          json.error || 'Chanting audio requires server TTS configuration; verified text remains visible.',
        );
        return;
      }
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      audioUrlRef.current = url;
      const audio = new Audio(url);
      audioRef.current = audio;
      audio.onended = () => stopAudio();
      audio.onerror = () => stopAudio();
      await audio.play();
      setAudioStatus('playing');
    } catch {
      setAudioStatus('unavailable');
      setAudioNote('Sanskrit audio stream unavailable; canonical verse text remains active.');
    }
  };

  const copy = {
    eyebrow: pickPublishedText({
      publishedMap: homeWhyBlock?.eyebrow,
      canonicalMap: canonicalWhyBlock?.eyebrow,
      locale,
      fallback:
        locale === 'hi'
          ? 'सहभागिता का महत्व एवं सार्थकता'
          : locale === 'te'
            ? 'మహోత్సవ ప్రాముఖ్యత మరియు ప్రయోజనం'
            : 'Purpose & Cultural Calling',
    }),
    heading: pickPublishedText({
      publishedMap: homeWhyBlock?.heading,
      canonicalMap: canonicalWhyBlock?.heading,
      locale,
      fallback:
        locale === 'hi'
          ? 'महोत्सव में क्यों भाग लें?'
          : locale === 'te'
            ? 'మహోత్సవంలో ఎందుకు పాల్గొనాలి?'
            : 'WHY PARTICIPATE IN THE MAHOTSAV?',
    }),
    lead: pickPublishedText({
      publishedMap: homeWhyBlock?.body,
      canonicalMap: canonicalWhyBlock?.body,
      locale,
      fallback:
        locale === 'hi'
          ? 'नौ प्रमुख कारण जो विद्वानों, परिवारों, युवाओं और अंतर्राष्ट्रीय संस्थानों को इस ऐतिहासिक महासंगम से जोड़ते हैं।'
          : locale === 'te'
            ? 'విద్వాంసులు, కుటుంబాలు, యువత మరియు అంతర్జాతీయ సంస్థలను ఈ చారిత్రాత్మక వేడుకలో ఏకం చేసే తొమ్మిది కారణాలు.'
            : 'Nine enduring pillars uniting families, youth seekers, civic thinkers, and global institutions around living scriptural wisdom.',
    }),
    readerTitle:
      locale === 'hi'
        ? 'प्रामाणिक भगवद्गीता श्लोक पाठक'
        : locale === 'te'
          ? 'ప్రామాణిక భగవద్గీత శ్లోక పఠనం'
          : 'Canonical Shloka Contemplation Reader',
  };

  return (
    <section
      id="why-participate"
      aria-labelledby="why-participate-heading"
      data-testid="why-participate-section"
      className="py-20 lg:py-28 bg-[var(--surface-elevated)] text-[var(--color-ink)] hairline-b"
    >
      <div className="max-w-[1360px] mx-auto px-5 sm:px-8 lg:px-12 space-y-14">
        {/* Heading Row */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-end pb-8 hairline-b">
          <div className="lg:col-span-7 space-y-4">
            <SectionLabel>{copy.eyebrow}</SectionLabel>
            <EditorialHeading as="h2" size="section" className="tracking-[0.01em]">
              <span id="why-participate-heading">{copy.heading}</span>
            </EditorialHeading>
          </div>
          <div className="lg:col-span-5">
            <p className="text-sm sm:text-base leading-relaxed text-[var(--color-muted)]">
              {copy.lead}
            </p>
          </div>
        </div>

        {/* 9 Enduring Reasons Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {WHY_PARTICIPATE_REASONS.map((reason) => (
            <article
              key={reason.id}
              data-testid={`why-reason-${reason.index}`}
              className="rounded-xl bg-[var(--color-canvas)] border border-[var(--color-border)] hover:border-[#C9A04E] p-6 flex flex-col justify-between gap-4 transition-colors"
            >
              <div className="space-y-3">
                <div className="flex items-center justify-between gap-2">
                  <span className="font-display text-2xl font-light text-[#A87932] dark:text-[#F0D38B] tabular-nums">
                    {reason.index}
                  </span>
                  <span className="text-[10px] font-semibold tracking-[0.16em] uppercase text-[var(--color-bronze)]">
                    {reason.pillarTag[locale]}
                  </span>
                </div>
                <h3 className="font-editorial text-xl text-[var(--color-ink)] leading-snug">
                  {reason.title[locale]}
                </h3>
                <p className="text-sm leading-relaxed text-[var(--color-muted)]">
                  {reason.description[locale]}
                </p>
              </div>
            </article>
          ))}
        </div>

        {/* Interactive Canonical Shloka Contemplation Panel */}
        <div
          data-testid="canonical-shloka-reader"
          className="rounded-2xl bg-[#17233A] text-[#FFFDF7] border border-[#C9A04E]/45 p-6 sm:p-8 lg:p-10 shadow-[0_20px_54px_rgba(14,21,35,0.22)] space-y-6"
        >
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-5 border-b border-[#C9A04E]/25">
            <div className="space-y-1">
              <div className="flex items-center gap-2 text-xs font-semibold tracking-[0.18em] uppercase text-[#F0D38B]">
                <BookOpen className="w-4 h-4" aria-hidden="true" />
                <span>{copy.readerTitle}</span>
              </div>
              <p className="text-xs text-[#E9DCC5]/80">
                {activeVerse.sourceAttribution[locale]} · {activeVerse.theme[locale]}
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              {CANONICAL_GITA_VERSES.map((verse, idx) => {
                const selected = idx === selectedVerseIdx;
                return (
                  <button
                    key={verse.id}
                    type="button"
                    onClick={() => {
                      stopAudio();
                      setAudioNote(null);
                      setSelectedVerseIdx(idx);
                    }}
                    data-testid={`shloka-select-${verse.id}`}
                    className={`px-3.5 py-1.5 rounded-full text-xs font-semibold border transition-colors cursor-pointer ${
                      selected
                        ? 'royal-gold-surface border-[#F0D38B] text-[#171717]'
                        : 'border-[#C9A04E]/40 text-[#FFFDF7] hover:border-[#F0D38B]'
                    }`}
                  >
                    BG {verse.chapter}.{verse.verse}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            <div className="lg:col-span-6 space-y-3">
              <p
                lang="sa"
                className="font-editorial text-2xl sm:text-3xl leading-[1.6] text-[#F0D38B] whitespace-pre-line"
              >
                {activeVerse.sanskritDevanagari}
              </p>
              <p className="text-sm italic text-[#E9DCC5]/85 whitespace-pre-line leading-relaxed">
                {activeVerse.transliteration}
              </p>

              <div className="pt-2 flex flex-wrap items-center gap-3">
                <button
                  type="button"
                  onClick={handleToggleRecitation}
                  disabled={audioStatus === 'loading'}
                  data-testid="why-shloka-recite"
                  className="inline-flex items-center gap-2 min-h-[40px] px-4 py-2 rounded-full border border-[#F0D38B]/65 bg-[#0E1729] text-xs font-semibold text-[#F0D38B] hover:bg-[#C9A04E] hover:text-[#171717] transition-colors cursor-pointer disabled:opacity-60"
                >
                  {audioStatus === 'loading' ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  ) : audioStatus === 'playing' ? (
                    <Square className="w-3.5 h-3.5 fill-current" />
                  ) : (
                    <Volume2 className="w-3.5 h-3.5" />
                  )}
                  <span>
                    {audioStatus === 'playing'
                      ? 'Stop Recitation'
                      : `Listen Recitation (${activeVerse.reference})`}
                  </span>
                </button>

                <Link
                  to="/gita"
                  className="text-xs font-medium text-[#E9DCC5] hover:text-[#F0D38B] underline underline-offset-4"
                >
                  Open Full 18-Chapter Gita &rarr;
                </Link>
              </div>

              {audioNote && (
                <p className="text-xs text-[#E9DCC5]/75 pt-1">{audioNote}</p>
              )}
            </div>

            <div className="lg:col-span-6 space-y-4">
              <div className="rounded-xl bg-[#101A2C] border border-[#C9A04E]/25 p-4 space-y-1.5">
                <p className="text-[10px] font-semibold tracking-[0.16em] uppercase text-[#F0D38B]">
                  English Translation
                </p>
                <p className="text-sm leading-relaxed text-[#FFFDF7]">
                  {activeVerse.translationEn}
                </p>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="rounded-xl bg-[#101A2C] border border-[#C9A04E]/25 p-4 space-y-1">
                  <p className="text-[10px] font-semibold tracking-[0.14em] uppercase text-[#F0D38B]">
                    हिन्दी भावार्थ
                  </p>
                  <p lang="hi" className="text-xs sm:text-sm leading-relaxed text-[#E9DCC5]">
                    {activeVerse.meaningHi}
                  </p>
                </div>
                <div className="rounded-xl bg-[#101A2C] border border-[#C9A04E]/25 p-4 space-y-1">
                  <p className="text-[10px] font-semibold tracking-[0.14em] uppercase text-[#F0D38B]">
                    తెలుగు తాత్పర్యం
                  </p>
                  <p lang="te" className="text-xs sm:text-sm leading-relaxed text-[#E9DCC5]">
                    {activeVerse.meaningTe}
                  </p>
                </div>
              </div>
              {activeVerse.commentarySlot && (
                <p className="text-xs text-[#E9DCC5]/80 leading-relaxed">
                  {activeVerse.commentarySlot[locale]}
                </p>
              )}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
