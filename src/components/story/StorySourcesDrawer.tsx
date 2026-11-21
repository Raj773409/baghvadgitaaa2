import React, { useEffect, useRef, useState } from 'react';
import { BookOpen, CheckCircle2, Loader2, Shield, Square, Users, Volume2, X } from 'lucide-react';
import {
  CHARACTER_REGISTRY,
  MAHABHARATA_18_DAYS,
  STORY_SOURCE_PROVENANCE,
  type StorySceneRecord,
} from '../../content/storyContent';
import { useI18n } from '../../i18n';

interface StorySourcesDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  scene: StorySceneRecord;
  onSelectSceneIndex?: (idx: number) => void;
}

export const StorySourcesDrawer: React.FC<StorySourcesDrawerProps> = ({
  isOpen,
  onClose,
  scene,
  onSelectSceneIndex,
}) => {
  const { contentLocale: locale, t } = useI18n();
  const closeRef = useRef<HTMLButtonElement | null>(null);
  const [activeTab, setActiveTab] = useState<'sources' | 'days' | 'characters'>('sources');
  const [audioStatus, setAudioStatus] = useState<'idle' | 'loading' | 'playing'>('idle');
  const [audioNotice, setAudioNotice] = useState<string | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const abortRef = useRef<AbortController | null>(null);
  const urlCacheRef = useRef<Map<number, string>>(new Map());

  const stopRecitation = () => {
    abortRef.current?.abort();
    abortRef.current = null;
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
      audioRef.current = null;
    }
    setAudioStatus('idle');
  };

  useEffect(() => {
    stopRecitation();
    setAudioNotice(null);
  }, [scene.id, isOpen]);

  useEffect(() => {
    const cache = urlCacheRef.current;
    return () => {
      stopRecitation();
      for (const url of cache.values()) {
        URL.revokeObjectURL(url);
      }
      cache.clear();
    };
  }, []);

  useEffect(() => {
    if (!isOpen) return;
    const timer = window.setTimeout(() => closeRef.current?.focus(), 40);
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        onClose();
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => {
      window.clearTimeout(timer);
      window.removeEventListener('keydown', onKeyDown);
    };
  }, [isOpen, onClose]);

  const handleToggleSanskritAudio = async () => {
    if (audioStatus !== 'idle') {
      stopRecitation();
      return;
    }

    setAudioNotice(null);
    setAudioStatus('loading');

    const playUrl = async (url: string) => {
      const audio = new Audio(url);
      audioRef.current = audio;
      audio.onended = () => {
        setAudioStatus('idle');
        audioRef.current = null;
      };
      audio.onerror = () => {
        setAudioStatus('idle');
        audioRef.current = null;
        setAudioNotice(t('story.soundUnavailable'));
      };
      await audio.play();
      setAudioStatus('playing');
    };

    try {
      const cached = urlCacheRef.current.get(scene.audioChapterNumber);
      if (cached) {
        await playUrl(cached);
        return;
      }
      const controller = new AbortController();
      abortRef.current = controller;
      const res = await fetch(`/api/chapters/${scene.audioChapterNumber}/recitation`, {
        signal: controller.signal,
      });
      if (!res.ok) {
        setAudioStatus('idle');
        setAudioNotice(t('story.soundUnavailable'));
        return;
      }
      const blob = await res.blob();
      if (controller.signal.aborted) return;
      const url = URL.createObjectURL(blob);
      urlCacheRef.current.set(scene.audioChapterNumber, url);
      await playUrl(url);
    } catch (err) {
      if (err instanceof DOMException && err.name === 'AbortError') return;
      setAudioStatus('idle');
      setAudioNotice(t('story.soundUnavailable'));
    }
  };

  if (!isOpen) return null;

  const isPartB = scene.partId === 'part-b';

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="story-sources-title"
      className="fixed inset-0 z-50 bg-[#070B16]/85 flex justify-end"
      onClick={onClose}
    >
      <div
        className="w-full max-w-xl h-full bg-[#101426] text-[#FFF6E8] border-l border-[#F3CD82]/25 overflow-y-auto p-5 sm:p-8 space-y-6"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-4 pb-4 border-b border-[#F3CD82]/20">
          <div className="space-y-1">
            <p className="text-[11px] font-medium tracking-[0.2em] uppercase text-[#F3CD82]">
              {t('story.scenePrefix')} {scene.paddedCode} · {scene.chaptersReferenced}
            </p>
            <h2 id="story-sources-title" className="font-editorial text-2xl sm:text-3xl text-[#FFF6E8]">
              {t('story.sourcesTitle')}
            </h2>
          </div>

          <button
            ref={closeRef}
            type="button"
            onClick={onClose}
            aria-label={t('story.closeSources')}
            className="inline-flex items-center justify-center w-10 h-10 rounded-full border border-[#F3CD82]/40 bg-[#202B48] text-[#FFF6E8] hover:border-[#F3CD82] cursor-pointer shrink-0"
          >
            <X className="w-4 h-4" aria-hidden="true" />
          </button>
        </div>

        {/* Navigation Tabs: Scriptural Sources / 18 War Days / Characters */}
        <div className="flex flex-wrap gap-2" role="tablist">
          <button
            type="button"
            role="tab"
            aria-selected={activeTab === 'sources'}
            onClick={() => setActiveTab('sources')}
            className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium cursor-pointer border transition-colors ${
              activeTab === 'sources'
                ? 'bg-[#F3CD82] text-[#101426] border-[#F3CD82]'
                : 'bg-[#17203B] text-[#F5F0E7]/80 border-[#F3CD82]/25 hover:border-[#F3CD82]'
            }`}
          >
            <BookOpen className="w-3.5 h-3.5" aria-hidden="true" />
            <span>{t('story.sourcesLabel')}</span>
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={activeTab === 'days'}
            onClick={() => setActiveTab('days')}
            className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium cursor-pointer border transition-colors ${
              activeTab === 'days'
                ? 'bg-[#F3CD82] text-[#101426] border-[#F3CD82]'
                : 'bg-[#17203B] text-[#F5F0E7]/80 border-[#F3CD82]/25 hover:border-[#F3CD82]'
            }`}
          >
            <Shield className="w-3.5 h-3.5" aria-hidden="true" />
            <span>{t('story.daysChronicleTab')}</span>
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={activeTab === 'characters'}
            onClick={() => setActiveTab('characters')}
            className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium cursor-pointer border transition-colors ${
              activeTab === 'characters'
                ? 'bg-[#F3CD82] text-[#101426] border-[#F3CD82]'
                : 'bg-[#17203B] text-[#F5F0E7]/80 border-[#F3CD82]/25 hover:border-[#F3CD82]'
            }`}
          >
            <Users className="w-3.5 h-3.5" aria-hidden="true" />
            <span>{t('story.charactersTab')}</span>
          </button>
        </div>

        {activeTab === 'sources' && (
          <div className="space-y-5">
            {/* Provenance Distinction Badge */}
            <div className="bg-[#202B48]/55 border border-[#F3CD82]/22 rounded-lg p-4 space-y-2">
              <div className="flex items-center gap-2 text-xs font-medium text-[#F3CD82]">
                <CheckCircle2 className="w-4 h-4 shrink-0" aria-hidden="true" />
                <span>
                  {isPartB ? t('story.provenanceMahabharata') : t('story.adaptationBadge')}
                </span>
              </div>
              <p className="text-xs sm:text-sm leading-relaxed text-[#F5F0E7]/84">
                {STORY_SOURCE_PROVENANCE.narrationPolicy[locale]}
              </p>
              {scene.parvaCitation && (
                <p className="text-xs font-semibold text-[#F3CD82]">
                  {scene.parvaCitation}
                </p>
              )}
              <p className="text-[11px] text-[#F5F0E7]/60 pt-1">
                {STORY_SOURCE_PROVENANCE.approvalRecord[locale]}
              </p>
            </div>

            {scene.featuredVerses.length > 0 ? (
              <div className="space-y-4">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div className="flex items-center gap-2 text-xs font-medium tracking-[0.14em] uppercase text-[#F3CD82]">
                    <BookOpen className="w-4 h-4 shrink-0" aria-hidden="true" />
                    <span>{t('story.sanskritVerdictBadge')}</span>
                  </div>

                  <button
                    type="button"
                    onClick={() => void handleToggleSanskritAudio()}
                    className="inline-flex items-center gap-2 min-h-[36px] px-3.5 py-1.5 rounded-full border border-[#F3CD82]/45 bg-[#202B48]/80 text-[#F3CD82] hover:border-[#F3CD82] text-xs font-medium whitespace-nowrap cursor-pointer"
                  >
                    {audioStatus === 'loading' ? (
                      <>
                        <Loader2 className="w-3.5 h-3.5 animate-spin" aria-hidden="true" />
                        <span>{t('story.loadingSanskritVerse')}</span>
                      </>
                    ) : audioStatus === 'playing' ? (
                      <>
                        <Square className="w-3 h-3 fill-current" aria-hidden="true" />
                        <span>{t('story.stopSanskritVerse')}</span>
                      </>
                    ) : (
                      <>
                        <Volume2 className="w-3.5 h-3.5" aria-hidden="true" />
                        <span>{t('story.listenSanskritVerse')}</span>
                      </>
                    )}
                  </button>
                </div>

                {audioNotice && (
                  <p role="status" className="text-xs text-[#F3CD82]/90">
                    {audioNotice}
                  </p>
                )}

                {scene.featuredVerses.map((verse) => (
                  <article
                    key={verse.id}
                    className="bg-[#202B48]/45 border border-[#F3CD82]/22 rounded-lg p-5 space-y-3"
                  >
                    <div className="flex items-center justify-between gap-2 text-xs text-[#F3CD82]">
                      <span className="font-semibold tracking-[0.1em] uppercase">{verse.reference}</span>
                      <span className="text-[#F5F0E7]/65">{verse.sourceEdition[locale]}</span>
                    </div>

                    <p lang="sa" className="text-base sm:text-lg leading-relaxed text-[#FFF6E8] whitespace-pre-line font-medium">
                      {verse.sanskritDevanagari}
                    </p>

                    <div className="pt-2 border-t border-[#F3CD82]/15 space-y-1">
                      <p className="text-[11px] uppercase tracking-[0.14em] text-[#F3CD82]/80">
                        {t('story.transliterationLabel')}
                      </p>
                      <p className="text-xs sm:text-sm italic text-[#F5F0E7]/75 whitespace-pre-line">
                        {verse.transliteration}
                      </p>
                    </div>

                    <div className="pt-2 border-t border-[#F3CD82]/15 space-y-1">
                      <p className="text-[11px] uppercase tracking-[0.14em] text-[#F3CD82]/80">
                        {t('story.translationLabel')}
                      </p>
                      <p className="font-editorial text-base sm:text-lg leading-relaxed text-[#FFF6E8]/92">
                        “{verse.translation[locale]}”
                      </p>
                    </div>
                  </article>
                ))}
              </div>
            ) : (
              <div className="space-y-3">
                <p className="text-xs font-medium tracking-[0.14em] uppercase text-[#F3CD82]">
                  {t('story.partBNarrativeBadge')}
                </p>
                {scene.cues.map((cue) => (
                  <article
                    key={cue.id}
                    className="bg-[#161D35] border border-[#F3CD82]/18 rounded-lg p-4 space-y-1.5"
                  >
                    <div className="flex items-center justify-between gap-2 text-[11px] text-[#F3CD82]">
                      <span className="font-semibold">{cue.speaker[locale]}</span>
                      <span className="text-[#F5F0E7]/65">{cue.sourceRef ?? scene.parvaCitation}</span>
                    </div>
                    <p className="text-xs sm:text-sm leading-relaxed text-[#FFF6E8]/90">
                      {cue.text[locale]}
                    </p>
                  </article>
                ))}
              </div>
            )}
          </div>
        )}

        {activeTab === 'days' && (
          <div className="space-y-2.5" data-testid="war-days-chronicle-list">
            {MAHABHARATA_18_DAYS.map((entry) => (
              <button
                key={entry.day}
                type="button"
                onClick={() => {
                  onSelectSceneIndex?.(entry.linkedSceneIndex);
                  onClose();
                }}
                className="w-full text-left bg-[#161D35] hover:bg-[#1E2745] border border-[#F3CD82]/20 hover:border-[#F3CD82] rounded-lg p-3.5 space-y-1 transition-colors cursor-pointer"
              >
                <div className="flex items-center justify-between gap-2 text-[11px] text-[#F3CD82]">
                  <span className="font-semibold uppercase tracking-[0.08em]">
                    Day {entry.day} · {entry.parva}
                  </span>
                  <span className="text-[#F5F0E7]/70">
                    {entry.kauravaCommander[locale]}
                  </span>
                </div>
                <p className="font-editorial text-base text-[#FFF6E8]">
                  {entry.title[locale]}
                </p>
                <p className="text-xs text-[#F5F0E7]/78 leading-relaxed">
                  {entry.summary[locale]}
                </p>
              </button>
            ))}
          </div>
        )}

        {activeTab === 'characters' && (
          <div className="space-y-2.5" data-testid="characters-registry-list">
            {CHARACTER_REGISTRY.map((char) => (
              <article
                key={char.id}
                className="bg-[#161D35] border border-[#F3CD82]/20 rounded-lg p-3.5 space-y-1.5"
              >
                <div className="flex items-center justify-between gap-2">
                  <p className="font-editorial text-base text-[#FFF6E8]">{char.name[locale]}</p>
                  <span className="text-[10px] uppercase tracking-[0.1em] px-2 py-0.5 rounded-full bg-[#202B48] border border-[#F3CD82]/30 text-[#F3CD82]">
                    {char.keyWarDays}
                  </span>
                </div>
                <p className="text-xs text-[#F3CD82]/90">{char.role[locale]}</p>
                <p className="text-[11px] text-[#F5F0E7]/75">{char.weaponOrSymbol[locale]}</p>
              </article>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
