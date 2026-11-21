import React, { useState } from 'react';
import { BookOpen, Volume2 } from 'lucide-react';
import { CANONICAL_GITA_VERSES } from '../../content/scriptureContent';
import { useI18n } from '../../i18n';
import type { ScriptureVerseRecord } from '../../types/cms';

interface ScriptureExperienceProps {
  compact?: boolean;
  initialVerseId?: string;
}

export const ScriptureExperience: React.FC<ScriptureExperienceProps> = ({
  compact = false,
  initialVerseId,
}) => {
  const { contentLocale: locale, t } = useI18n();
  const [selectedId, setSelectedId] = useState<string>(
    initialVerseId ?? CANONICAL_GITA_VERSES[0].id,
  );
  const [showAllLanguages, setShowAllLanguages] = useState<boolean>(!compact);

  const selectedVerse: ScriptureVerseRecord =
    CANONICAL_GITA_VERSES.find((v) => v.id === selectedId) ?? CANONICAL_GITA_VERSES[0];

  const primaryMeaning =
    locale === 'hi'
      ? selectedVerse.meaningHi
      : locale === 'te'
        ? selectedVerse.meaningTe
        : selectedVerse.translationEn;

  const primaryMeaningLabel =
    locale === 'hi'
      ? t('scripture.hindiLabel')
      : locale === 'te'
        ? t('scripture.teluguLabel')
        : t('scripture.englishLabel');

  return (
    <div className="bg-[#161412] text-[#F5F0E7] border border-[rgba(213,172,112,0.28)] rounded-xl overflow-hidden">
      {/* Header & Verse Switcher Bar */}
      <div className="px-5 sm:px-8 py-5 border-b border-[rgba(213,172,112,0.2)] flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <BookOpen className="w-4 h-4 text-[#D5AC70] shrink-0" aria-hidden="true" />
          <div>
            <p className="text-[11px] font-medium tracking-[0.18em] uppercase text-[#C8A26A]">
              {t('scripture.eyebrow')}
            </p>
            <h3 className="font-editorial text-xl sm:text-2xl text-[#FFF6E8]">
              {t('scripture.heading')}
            </h3>
          </div>
        </div>

        <div
          role="tablist"
          aria-label={t('scripture.verseLabel')}
          className="flex flex-wrap items-center gap-2"
        >
          {CANONICAL_GITA_VERSES.map((verse) => {
            const active = verse.id === selectedVerse.id;
            return (
              <button
                key={verse.id}
                type="button"
                role="tab"
                aria-selected={active}
                onClick={() => setSelectedId(verse.id)}
                className={`min-h-[38px] px-3.5 py-1.5 rounded-full text-xs font-medium tabular-nums whitespace-nowrap transition-colors cursor-pointer ${
                  active
                    ? 'bg-[#D5AC70] text-[#161412]'
                    : 'border border-[rgba(213,172,112,0.3)] text-[#F5F0E7]/85 hover:border-[#D5AC70]'
                }`}
              >
                {verse.chapter}.{verse.verse}
              </button>
            );
          })}
        </div>
      </div>

      {/* Verse Body */}
      <div className="p-5 sm:p-8 lg:p-10 space-y-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Sanskrit Devanagari & Transliteration */}
          <div className="lg:col-span-6 space-y-5">
            <div className="space-y-1.5">
              <p className="text-[11px] font-medium tracking-[0.16em] uppercase text-[#C8A26A]">
                {selectedVerse.reference} · {selectedVerse.theme[locale]}
              </p>
              <p className="text-xs text-[#F5F0E7]/55">{t('scripture.sanskritLabel')}</p>
            </div>

            <blockquote
              lang="sa"
              className="text-xl sm:text-2xl leading-[1.8] text-[#F3CD82] font-medium whitespace-pre-line border-y border-[rgba(213,172,112,0.2)] py-5"
            >
              {selectedVerse.sanskritDevanagari}
            </blockquote>

            <div className="space-y-1">
              <p className="text-[11px] tracking-[0.12em] uppercase text-[#F5F0E7]/50">
                {t('scripture.transliterationLabel')}
              </p>
              <p className="font-editorial italic text-base sm:text-lg leading-relaxed text-[#F5F0E7]/85 whitespace-pre-line">
                {selectedVerse.transliteration}
              </p>
            </div>
          </div>

          {/* Multilingual Meanings & Commentary */}
          <div className="lg:col-span-6 space-y-5 lg:border-l lg:border-[rgba(213,172,112,0.18)] lg:pl-8">
            <div className="space-y-2">
              <p className="text-[11px] font-medium tracking-[0.14em] uppercase text-[#C8A26A]">
                {primaryMeaningLabel}
              </p>
              <p className="text-base sm:text-[17px] leading-[1.75] text-[#FFF6E8]">
                {primaryMeaning}
              </p>
            </div>

            {selectedVerse.commentarySlot && (
              <div className="pt-4 border-t border-[rgba(213,172,112,0.16)] space-y-1.5">
                <p className="text-[11px] font-medium tracking-[0.14em] uppercase text-[#C8A26A]">
                  {t('scripture.commentaryLabel')}
                </p>
                <p className="text-sm leading-relaxed text-[#F5F0E7]/78">
                  {selectedVerse.commentarySlot[locale]}
                </p>
              </div>
            )}

            <div className="pt-4 border-t border-[rgba(213,172,112,0.16)] flex flex-wrap items-center justify-between gap-3">
              <span className="text-xs text-[#F5F0E7]/60">
                {selectedVerse.sourceAttribution[locale]}
              </span>
              <button
                type="button"
                onClick={() => setShowAllLanguages((prev) => !prev)}
                className="text-xs font-medium text-[#F3CD82] hover:text-white underline underline-offset-4 cursor-pointer"
              >
                {showAllLanguages ? 'EN / HI / TE −' : 'EN / HI / TE +'}
              </button>
            </div>

            {showAllLanguages && (
              <div className="grid grid-cols-1 gap-3.5 pt-3 border-t border-[rgba(213,172,112,0.16)]">
                <div>
                  <p className="text-[11px] uppercase tracking-[0.1em] text-[#C8A26A]">
                    {t('scripture.englishLabel')}
                  </p>
                  <p className="text-xs sm:text-sm leading-relaxed text-[#F5F0E7]/85 mt-0.5">
                    {selectedVerse.translationEn}
                  </p>
                </div>
                <div>
                  <p className="text-[11px] uppercase tracking-[0.1em] text-[#C8A26A]">
                    {t('scripture.hindiLabel')}
                  </p>
                  <p lang="hi" className="text-xs sm:text-sm leading-relaxed text-[#F5F0E7]/85 mt-0.5">
                    {selectedVerse.meaningHi}
                  </p>
                </div>
                <div>
                  <p className="text-[11px] uppercase tracking-[0.1em] text-[#C8A26A]">
                    {t('scripture.teluguLabel')}
                  </p>
                  <p lang="te" className="text-xs sm:text-sm leading-relaxed text-[#F5F0E7]/85 mt-0.5">
                    {selectedVerse.meaningTe}
                  </p>
                </div>
              </div>
            )}

            {/* Audio Slot */}
            <div className="pt-4 border-t border-[rgba(213,172,112,0.16)] flex items-start gap-2.5 text-xs text-[#F5F0E7]/60">
              <Volume2 className="w-4 h-4 text-[#C8A26A] shrink-0 mt-0.5" aria-hidden="true" />
              <span>
                <strong className="font-medium text-[#E5C99A]">{t('scripture.audioLabel')}:</strong>{' '}
                {selectedVerse.audioRecitationUrl ?? t('scripture.audioPending')}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
