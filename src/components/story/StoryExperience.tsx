import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  ArrowLeft,
  ArrowRight,
  BookOpen,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Eye,
  EyeOff,
  Layers,
  ListOrdered,
  Loader2,
  Maximize2,
  Minimize2,
  Pause,
  Play,
  RotateCcw,
  Sparkles,
  Square,
  Subtitles,
  Volume2,
  VolumeX,
  X,
} from 'lucide-react';
import { AnimatePresence, motion } from 'motion/react';
import { Link } from 'react-router-dom';
import { ensureGsapRegistered, gsap, prefersReducedMotion, ScrollTrigger } from '../../animations/gsapSetup';
import { STORY_SCENES, getCueDialogueTrack, MAHABHARATA_18_DAYS } from '../../content/storyContent';
import { usePublicCms } from '../../hooks/usePublicCms';
import { useI18n } from '../../i18n';
import type { AssetValidationRecord } from '../../three/story/assetValidation';
import type { StoryModelLoadProgress } from '../../three/story/modelLoader';
import {
  evaluateStoryTimeline,
  getSceneAnchorProgress,
  STORY_SCENE_WINDOWS,
  type QualityTier,
} from '../../three/story/storyTimeline';
import { detectWebGLCapability } from '../../three/webglSupport';
import {
  clampSceneIndex,
  createDefaultStoryProgress,
  deserializeStoryProgress,
  getNextSceneIndex,
  getPrevSceneIndex,
  recordSceneCompleted,
  recordSceneVisited,
  serializeStoryProgress,
  STORY_PROGRESS_STORAGE_KEY,
  type StoryProgressState,
} from '../../utils/storyState';
import { LanguageSelector } from '../ui/LanguageSelector';
import { AssetReportDrawer } from './AssetReportDrawer';
import { StoryCanvas3D } from './StoryCanvas3D';
import { StoryLoadingOverlay } from './StoryLoadingOverlay';
import { StorySourcesDrawer } from './StorySourcesDrawer';

interface StoryExperienceProps {
  initialSceneIndex?: number | null;
  autoStart?: boolean;
}

export const StoryExperience: React.FC<StoryExperienceProps> = ({
  initialSceneIndex = null,
  autoStart = false,
}) => {
  const { contentLocale: locale, t } = useI18n();
  const cms = usePublicCms();
  const mergedStoryScenes = useMemo(() => {
    const overrides = cms?.storyScenes;
    if (!Array.isArray(overrides) || overrides.length === 0) {
      return STORY_SCENES;
    }
    const byId = new Map(overrides.filter((o) => o.status === 'published').map((o) => [o.id, o]));
    return STORY_SCENES.map((scene) => {
      const ov = byId.get(scene.id);
      if (!ov) return scene;
      const nextTitle = {
        en: ov.title?.en?.trim() || scene.title.en,
        hi: ov.title?.hi?.trim() || scene.title.hi,
        te: ov.title?.te?.trim() || scene.title.te,
      };
      const nextAtmosphere = {
        en: ov.narration?.en?.trim() || scene.atmosphereNote.en,
        hi: ov.narration?.hi?.trim() || scene.atmosphereNote.hi,
        te: ov.narration?.te?.trim() || scene.atmosphereNote.te,
      };
      const hasDialogueOverride = Boolean(
        ov.dialogue?.en?.trim() || ov.dialogue?.hi?.trim() || ov.dialogue?.te?.trim(),
      );
      const nextCues =
        hasDialogueOverride && scene.cues.length > 0
          ? scene.cues.map((cue, idx) =>
              idx === 0
                ? {
                    ...cue,
                    text: {
                      en: ov.dialogue?.en?.trim() || cue.text.en,
                      hi: ov.dialogue?.hi?.trim() || cue.text.hi,
                      te: ov.dialogue?.te?.trim() || cue.text.te,
                    },
                  }
                : cue,
            )
          : scene.cues;
      return {
        ...scene,
        title: nextTitle,
        chaptersReferenced: ov.chapterTag?.trim() || scene.chaptersReferenced,
        atmosphereNote: nextAtmosphere,
        cues: nextCues,
      };
    });
  }, [cms?.storyScenes]);
  const validSceneIds = useMemo(() => mergedStoryScenes.map((s) => s.id), [mergedStoryScenes]);
  const webglCap = useMemo(() => detectWebGLCapability(), []);

  const [progressState, setProgressState] = useState<StoryProgressState>(() => {
    let saved = createDefaultStoryProgress(validSceneIds[0]);
    try {
      const raw = window.localStorage.getItem(STORY_PROGRESS_STORAGE_KEY);
      saved = deserializeStoryProgress(raw, validSceneIds);
    } catch {
      // Ignore blocked storage
    }

    if (typeof initialSceneIndex === 'number') {
      const targetIdx = clampSceneIndex(initialSceneIndex, STORY_SCENES.length);
      return recordSceneVisited(saved, targetIdx, STORY_SCENES[targetIdx].id);
    }
    return saved;
  });

  // Real-time master scroll progress [0..1] synchronized via GSAP ScrollTrigger
  const [masterProgress, setMasterProgress] = useState<number>(() =>
    typeof initialSceneIndex === 'number'
      ? getSceneAnchorProgress(initialSceneIndex)
      : 0,
  );
  const [isAutoScrolling, setIsAutoScrolling] = useState<boolean>(Boolean(autoStart));
  const [zenHideControls, setZenHideControls] = useState<boolean>(false);

  // Genuine LoadingManager & AssetValidation state
  const [loadProgress, setLoadProgress] = useState<StoryModelLoadProgress>({
    loadedAssets: 0,
    totalAssets: 4,
    ratio: 0,
    activeItemLabel: 'Kurukshetra',
  });
  const [assetsReady, setAssetsReady] = useState<boolean>(!webglCap.supported);
  const [assetValidationReport, setAssetValidationReport] = useState<AssetValidationRecord[]>([]);
  const [activeShotName, setActiveShotName] = useState<string>('Aerial Kurukshetra Flyover');

  // Quality & Reduced Motion controls
  const [qualityTier, setQualityTier] = useState<QualityTier>(() =>
    webglCap.isSoftwareGl ? 'performance' : 'high',
  );
  const [osReducedMotion, setOsReducedMotion] = useState<boolean>(() => prefersReducedMotion());
  const [reducedMotionOverride, setReducedMotionOverride] = useState<boolean | null>(null);
  const effectiveReducedMotion = reducedMotionOverride ?? osReducedMotion;

  const [forceStaticWebglFallback, setForceStaticWebglFallback] = useState<boolean>(false);

  // Spoken narration & verse audio state (never autoplayed)
  const [soundEnabled, setSoundEnabled] = useState<boolean>(false);
  const [soundStatus, setSoundStatus] = useState<'muted' | 'loading' | 'playing' | 'unavailable'>('muted');
  const [soundNotice, setSoundNotice] = useState<string | null>(null);

  const [verseAudioState, setVerseAudioState] = useState<'idle' | 'loading' | 'playing'>('idle');
  const [verseAudioNotice, setVerseAudioNotice] = useState<string | null>(null);

  const [chaptersOpen, setChaptersOpen] = useState<boolean>(false);
  const [sourcesOpen, setSourcesOpen] = useState<boolean>(false);
  const [assetReportOpen, setAssetReportOpen] = useState<boolean>(false);
  const [isFullscreen, setIsFullscreen] = useState<boolean>(false);
  const [activePillarIndex, setActivePillarIndex] = useState<number>(0);
  const [warPackReady, setWarPackReady] = useState<boolean>(false);

  const shellRef = useRef<HTMLDivElement | null>(null);
  const scrollTrackRef = useRef<HTMLDivElement | null>(null);
  const restoringInitialSceneRef = useRef<boolean>(typeof initialSceneIndex === 'number');

  const narrationAudioRef = useRef<HTMLAudioElement | null>(null);
  const narrationAbortRef = useRef<AbortController | null>(null);
  const narrationBlobCacheRef = useRef<Map<string, string>>(new Map());
  const narrationServerQuotaRef = useRef<boolean>(false);

  const verseAudioRef = useRef<HTMLAudioElement | null>(null);
  const verseAbortRef = useRef<AbortController | null>(null);
  const verseBlobCacheRef = useRef<Map<number, string>>(new Map());

  // Evaluate synchronized 3D timeline snapshot from masterProgress
  const snapshot = useMemo(() => evaluateStoryTimeline(masterProgress), [masterProgress]);
  const currentSceneIndex = snapshot.sceneIndex;
  const activeScene = mergedStoryScenes[currentSceneIndex] ?? mergedStoryScenes[0];
  const activeCue =
    activeScene.cues[snapshot.cueIndex] ?? activeScene.cues[0];
  const activeCueTrack = useMemo(
    () => getCueDialogueTrack(activeScene, snapshot.cueIndex, locale),
    [activeScene, snapshot.cueIndex, locale],
  );

  // Record visited/completed scenes cleanly as user scrolls through chapters
  const lastTrackedSceneRef = useRef<number>(currentSceneIndex);
  useEffect(() => {
    const prevIdx = lastTrackedSceneRef.current;
    if (currentSceneIndex !== prevIdx) {
      lastTrackedSceneRef.current = currentSceneIndex;
      setActivePillarIndex(0);
      setVerseAudioNotice(null);
      setProgressState((prev) => {
        let updated = prev;
        if (currentSceneIndex > prevIdx && STORY_SCENES[prevIdx]) {
          updated = recordSceneCompleted(updated, STORY_SCENES[prevIdx].id);
        }
        return recordSceneVisited(updated, currentSceneIndex, activeScene.id);
      });
    }
  }, [currentSceneIndex, activeScene.id]);

  // Persist local progress
  useEffect(() => {
    try {
      window.localStorage.setItem(
        STORY_PROGRESS_STORAGE_KEY,
        serializeStoryProgress(progressState),
      );
    } catch {
      // Ignore storage failures
    }
  }, [progressState]);

  // Watch prefers-reduced-motion dynamically
  useEffect(() => {
    if (typeof window === 'undefined' || !window.matchMedia) return;
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
    setOsReducedMotion(mq.matches);
    const onChange = (e: MediaQueryListEvent) => setOsReducedMotion(e.matches);
    mq.addEventListener?.('change', onChange);
    return () => mq.removeEventListener?.('change', onChange);
  }, []);

  const getSpokenTimeSec = useCallback(() => {
    const audioEl = narrationAudioRef.current;
    if (audioEl && !audioEl.paused && Number.isFinite(audioEl.currentTime)) {
      return audioEl.currentTime;
    }
    return null;
  }, []);

  // GSAP ScrollTrigger Master Timeline binding across all 15 chapters
  useEffect(() => {
    const track = scrollTrackRef.current;
    if (!track) return;

    ensureGsapRegistered();

    const hasInitialScene = typeof initialSceneIndex === 'number';
    if (hasInitialScene) {
      restoringInitialSceneRef.current = true;
    }

    const ctx = gsap.context(() => {
      ScrollTrigger.create({
        trigger: track,
        start: 'top top',
        end: 'bottom bottom',
        scrub: 0.25,
        invalidateOnRefresh: true,
        onUpdate: (self) => {
          if (restoringInitialSceneRef.current) return;
          setMasterProgress(self.progress);
        },
      });
    }, track);

    ScrollTrigger.refresh();

    // Jump cleanly if initial ?scene=N param was supplied without resetting progress to 0
    if (hasInitialScene) {
      const anchor = getSceneAnchorProgress(initialSceneIndex);
      setMasterProgress(anchor);
      const timer = window.setTimeout(() => {
        ScrollTrigger.refresh();
        const maxScroll = Math.max(
          1,
          document.documentElement.scrollHeight - window.innerHeight,
        );
        window.scrollTo({ top: Math.round(anchor * maxScroll), behavior: 'auto' });
        window.requestAnimationFrame(() => {
          restoringInitialSceneRef.current = false;
          ScrollTrigger.update();
          setMasterProgress(anchor);
        });
      }, 60);
      return () => {
        window.clearTimeout(timer);
        restoringInitialSceneRef.current = false;
        ctx.revert();
      };
    }

    return () => ctx.revert();
  }, [initialSceneIndex]);

  // Optional Hands-Free Auto-Scroll that immediately yields to user wheel or touch
  useEffect(() => {
    if (!isAutoScrolling) return;

    const cancelOnManualInput = () => setIsAutoScrolling(false);
    window.addEventListener('wheel', cancelOnManualInput, { passive: true });
    window.addEventListener('touchstart', cancelOnManualInput, { passive: true });

    let rafId = 0;
    let lastTs = performance.now();

    const step = (now: number) => {
      const dt = Math.min(0.05, Math.max(0.001, (now - lastTs) / 1000));
      lastTs = now;
      const maxScroll = document.documentElement.scrollHeight - window.innerHeight;
      if (window.scrollY >= maxScroll - 2) {
        setIsAutoScrolling(false);
        return;
      }
      const pxPerSec = effectiveReducedMotion ? 55 : 135;
      window.scrollBy(0, pxPerSec * dt);
      rafId = window.requestAnimationFrame(step);
    };

    rafId = window.requestAnimationFrame(step);

    return () => {
      window.cancelAnimationFrame(rafId);
      window.removeEventListener('wheel', cancelOnManualInput);
      window.removeEventListener('touchstart', cancelOnManualInput);
    };
  }, [isAutoScrolling, effectiveReducedMotion]);

  // Helper to jump cleanly to any scene via scroll
  const scrollToSceneIndex = useCallback(
    (index: number) => {
      const targetIdx = clampSceneIndex(index, STORY_SCENES.length);
      const anchor = getSceneAnchorProgress(targetIdx);
      const maxScroll = Math.max(
        1,
        document.documentElement.scrollHeight - window.innerHeight,
      );
      setIsAutoScrolling(false);
      setChaptersOpen(false);
      window.scrollTo({
        top: Math.round(anchor * maxScroll),
        behavior: effectiveReducedMotion ? 'auto' : 'smooth',
      });
    },
    [effectiveReducedMotion],
  );

  // Helper to jump to a sub-progress inside the story
  const scrollToMasterProgress = useCallback(
    (progress: number) => {
      const clamped = Math.max(0, Math.min(1, progress));
      const maxScroll = Math.max(
        1,
        document.documentElement.scrollHeight - window.innerHeight,
      );
      setIsAutoScrolling(false);
      window.scrollTo({
        top: Math.round(clamped * maxScroll),
        behavior: effectiveReducedMotion ? 'auto' : 'smooth',
      });
    },
    [effectiveReducedMotion],
  );

  // Stop & manage spoken narration audio (muted on load)
  const stopNarrationAudio = useCallback(() => {
    narrationAbortRef.current?.abort();
    narrationAbortRef.current = null;
    if (narrationAudioRef.current) {
      narrationAudioRef.current.pause();
      narrationAudioRef.current.currentTime = 0;
      narrationAudioRef.current.onended = null;
      narrationAudioRef.current.onerror = null;
      narrationAudioRef.current = null;
    }
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      try {
        window.speechSynthesis.cancel();
      } catch {
        // Ignore speechSynthesis cancel errors
      }
    }
  }, []);

  const stopVerseAudio = useCallback(() => {
    verseAbortRef.current?.abort();
    verseAbortRef.current = null;
    if (verseAudioRef.current) {
      verseAudioRef.current.pause();
      verseAudioRef.current.currentTime = 0;
      verseAudioRef.current.onended = null;
      verseAudioRef.current.onerror = null;
      verseAudioRef.current = null;
    }
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      try {
        window.speechSynthesis.cancel();
      } catch {
        // Ignore speechSynthesis cancel errors
      }
    }
    setVerseAudioState('idle');
  }, []);

  useEffect(() => {
    const nCache = narrationBlobCacheRef.current;
    const vCache = verseBlobCacheRef.current;
    return () => {
      stopNarrationAudio();
      stopVerseAudio();
      for (const url of nCache.values()) URL.revokeObjectURL(url);
      for (const url of vCache.values()) URL.revokeObjectURL(url);
      nCache.clear();
      vCache.clear();
    };
  }, [stopNarrationAudio, stopVerseAudio]);

  const speakWithBrowserFallback = useCallback(
    (
      text: string,
      langTag: string,
      onStart: () => void,
      onDone: () => void,
      onUnavailable: () => void,
    ): boolean => {
      if (
        typeof window === 'undefined' ||
        !('speechSynthesis' in window) ||
        typeof SpeechSynthesisUtterance === 'undefined'
      ) {
        return false;
      }
      try {
        const voices = window.speechSynthesis.getVoices();
        if (!voices || voices.length === 0) {
          return false;
        }
        window.speechSynthesis.cancel();
        const utterance = new SpeechSynthesisUtterance(text);
        utterance.lang = langTag;
        // Prefer female Telugu voice when reading Telugu narration
        if (langTag.toLowerCase().startsWith('te')) {
          const teVoices = voices.filter((v) => v.lang.toLowerCase().startsWith('te'));
          const femaleTe =
            teVoices.find((v) => /female|woman|lekha|shruti|vani|swati|chitra/i.test(v.name)) ??
            teVoices[0];
          if (femaleTe) utterance.voice = femaleTe;
        }
        utterance.rate = 0.94;
        utterance.onend = onDone;
        utterance.onerror = onUnavailable;
        onStart();
        window.speechSynthesis.speak(utterance);
        return true;
      } catch {
        return false;
      }
    },
    [],
  );

  useEffect(() => {
    if (!soundEnabled) {
      stopNarrationAudio();
      setSoundStatus('muted');
      setSoundNotice(null);
      return;
    }

    let cancelled = false;
    const speakerTag = activeCueTrack.speaker;
    const cacheKey = `${activeScene.sceneNumber}:${locale}:${speakerTag}`;
    const langTag = locale === 'hi' ? 'hi-IN' : locale === 'te' ? 'te-IN' : 'en-US';
    const combinedScript = activeScene.cues.map((cue) => cue.text[locale]).join(' ');

    const triggerFallbackOrTextMode = (noticeMessage: string) => {
      if (cancelled) return;
      const startedSpeech = speakWithBrowserFallback(
        combinedScript,
        langTag,
        () => {
          if (!cancelled) {
            setSoundStatus('playing');
            setSoundNotice(null);
          }
        },
        () => {
          if (!cancelled) setSoundStatus('muted');
        },
        () => {
          if (!cancelled) {
            setSoundStatus('unavailable');
            setSoundNotice(noticeMessage);
          }
        },
      );
      if (!startedSpeech && !cancelled) {
        setSoundStatus('unavailable');
        setSoundNotice(noticeMessage);
      }
    };

    const playBlobUrl = async (url: string) => {
      if (cancelled) return;
      stopVerseAudio();
      stopNarrationAudio();
      const audio = new Audio(url);
      narrationAudioRef.current = audio;
      audio.onended = () => {
        if (!cancelled) setSoundStatus('muted');
      };
      audio.onerror = () => {
        if (!cancelled) {
          setSoundStatus('unavailable');
          setSoundNotice(t('story.soundUnavailable'));
        }
      };
      await audio.play();
      if (!cancelled) {
        setSoundStatus('playing');
        setSoundNotice(null);
      }
    };

    const loadNarration = async () => {
      try {
        const cached = narrationBlobCacheRef.current.get(cacheKey);
        if (cached) {
          await playBlobUrl(cached);
          return;
        }
        if (narrationServerQuotaRef.current) {
          triggerFallbackOrTextMode(t('story.soundUnavailable'));
          return;
        }
        setSoundStatus('loading');
        setSoundNotice(null);
        const controller = new AbortController();
        narrationAbortRef.current = controller;

        const res = await fetch(
          `/api/story/${activeScene.sceneNumber}/narration?locale=${locale}&speaker=${encodeURIComponent(speakerTag)}`,
          { signal: controller.signal },
        );
        if (!res.ok) {
          let errNotice = t('story.soundUnavailable');
          if (res.status === 429) {
            narrationServerQuotaRef.current = true;
          }
          try {
            const payload = (await res.json()) as { error?: string };
            if (payload.error && res.status !== 429) {
              errNotice = payload.error;
            }
          } catch {
            // Keep localized accessible notice
          }
          triggerFallbackOrTextMode(errNotice);
          return;
        }
        const blob = await res.blob();
        if (cancelled || controller.signal.aborted) return;
        const objectUrl = URL.createObjectURL(blob);
        narrationBlobCacheRef.current.set(cacheKey, objectUrl);
        await playBlobUrl(objectUrl);
      } catch (err) {
        if (err instanceof DOMException && err.name === 'AbortError') return;
        triggerFallbackOrTextMode(t('story.soundUnavailable'));
      }
    };

    void loadNarration();
    return () => {
      cancelled = true;
    };
  }, [
    soundEnabled,
    activeScene.sceneNumber,
    activeScene.cues,
    locale,
    speakWithBrowserFallback,
    stopNarrationAudio,
    stopVerseAudio,
    t,
  ]);

  const handleToggleVerseAudio = async (chapterNumber: number) => {
    if (verseAudioState !== 'idle') {
      stopVerseAudio();
      return;
    }
    stopNarrationAudio();
    setSoundEnabled(false);
    setVerseAudioNotice(null);
    setVerseAudioState('loading');

    const primaryVerse = activeScene.featuredVerses[0];

    const playUrl = async (url: string) => {
      const audio = new Audio(url);
      verseAudioRef.current = audio;
      audio.onended = () => {
        setVerseAudioState('idle');
        verseAudioRef.current = null;
      };
      audio.onerror = () => {
        setVerseAudioState('idle');
        verseAudioRef.current = null;
        setVerseAudioNotice(t('story.soundUnavailable'));
      };
      await audio.play();
      setVerseAudioState('playing');
    };

    const handleVerseUnavailable = (noticeText: string) => {
      const spoken = primaryVerse
        ? speakWithBrowserFallback(
            primaryVerse.sanskritDevanagari,
            'hi-IN',
            () => setVerseAudioState('playing'),
            () => setVerseAudioState('idle'),
            () => {
              setVerseAudioState('idle');
              setVerseAudioNotice(noticeText);
            },
          )
        : false;
      if (!spoken) {
        setVerseAudioState('idle');
        setVerseAudioNotice(noticeText);
      }
    };

    try {
      const cached = verseBlobCacheRef.current.get(chapterNumber);
      if (cached) {
        await playUrl(cached);
        return;
      }
      if (narrationServerQuotaRef.current) {
        handleVerseUnavailable(t('story.soundUnavailable'));
        return;
      }
      const controller = new AbortController();
      verseAbortRef.current = controller;
      const res = await fetch(`/api/chapters/${chapterNumber}/recitation`, {
        signal: controller.signal,
      });
      if (!res.ok) {
        if (res.status === 429) {
          narrationServerQuotaRef.current = true;
        }
        handleVerseUnavailable(t('story.soundUnavailable'));
        return;
      }
      const blob = await res.blob();
      if (controller.signal.aborted) return;
      const url = URL.createObjectURL(blob);
      verseBlobCacheRef.current.set(chapterNumber, url);
      await playUrl(url);
    } catch (err) {
      if (err instanceof DOMException && err.name === 'AbortError') return;
      handleVerseUnavailable(t('story.soundUnavailable'));
    }
  };

  useEffect(() => {
    const onFs = () => setIsFullscreen(Boolean(document.fullscreenElement));
    document.addEventListener('fullscreenchange', onFs);
    return () => document.removeEventListener('fullscreenchange', onFs);
  }, []);

  const handleToggleFullscreen = async () => {
    const el = shellRef.current;
    if (!el) return;
    try {
      if (document.fullscreenElement) {
        await document.exitFullscreen();
      } else if (typeof el.requestFullscreen === 'function') {
        await el.requestFullscreen();
      }
    } catch {
      // Ignore fullscreen denial in embedded iframes
    }
  };

  const hasPrev = getPrevSceneIndex(currentSceneIndex, STORY_SCENES.length) !== null;
  const hasNext = getNextSceneIndex(currentSceneIndex, STORY_SCENES.length) !== null;
  const vishvarupaPhaseNum = Math.min(8, Math.max(1, Math.floor(snapshot.vishvarupaPhase * 8) + 1));

  return (
    <div
      ref={shellRef}
      data-testid="story-player"
      data-scene-id={activeScene.id}
      data-playback-state={isAutoScrolling ? 'playing' : 'paused'}
      className="relative min-h-screen bg-[#0B0F1F] text-[#FFF6E8]"
    >
      {/* Real LoadingManager Progress Screen (no artificial timer faking) */}
      <StoryLoadingOverlay progress={loadProgress} visible={!assetsReady} />

      {/* Top Minimal Editorial HUD Bar */}
      {!zenHideControls && (
        <header className="fixed top-0 inset-x-0 z-30 h-14 sm:h-16 bg-[#0B0F1F]/92 border-b border-[#F3CD82]/18">
          <div className="max-w-[1440px] mx-auto h-full px-3 sm:px-6 lg:px-10 flex items-center justify-between gap-2 sm:gap-3">
            <div className="flex items-center gap-2.5 sm:gap-4 min-w-0">
              <Link
                to="/"
                aria-label={t('story.exitStory')}
                className="inline-flex items-center gap-1.5 min-h-[36px] px-3 py-1.5 rounded-full border border-[#F3CD82]/35 bg-[#1B2542] text-[#FFF6E8] hover:border-[#F3CD82] hover:text-[#F3CD82] text-xs font-medium whitespace-nowrap shrink-0 transition-colors"
              >
                <ArrowLeft className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
                <span className="hidden xs:inline sm:inline">{t('story.exitStory')}</span>
              </Link>

              <div className="hidden lg:flex items-center gap-2 text-xs text-[#F5F0E7]/85 min-w-0">
                <span className="tracking-[0.16em] uppercase text-[#F3CD82] font-medium whitespace-nowrap">
                  {t('story.eyebrow')}
                </span>
                <span className="text-[#F3CD82]/40">·</span>
                <span className="tabular-nums whitespace-nowrap font-medium">
                  {activeScene.paddedCode} / {STORY_SCENES.length}
                </span>
              </div>

              {/* Part A / Part B Quick Switcher */}
              <div className="hidden md:inline-flex items-center rounded-full border border-[#F3CD82]/28 bg-[#151D36] p-0.5 text-[11px] shrink-0">
                <button
                  type="button"
                  data-testid="part-a-switcher"
                  onClick={() => scrollToSceneIndex(0)}
                  aria-pressed={snapshot.partId === 'part-a'}
                  className={`px-2.5 py-1 rounded-full cursor-pointer whitespace-nowrap transition-colors ${
                    snapshot.partId === 'part-a'
                      ? 'bg-[#F3CD82] text-[#101426] font-semibold'
                      : 'text-[#F5F0E7]/78 hover:text-[#FFF6E8]'
                  }`}
                >
                  {t('story.partALabel')}
                </button>
                <button
                  type="button"
                  data-testid="part-b-switcher"
                  onClick={() => scrollToSceneIndex(7)}
                  aria-pressed={snapshot.partId === 'part-b'}
                  className={`px-2.5 py-1 rounded-full cursor-pointer whitespace-nowrap transition-colors ${
                    snapshot.partId === 'part-b'
                      ? 'bg-[#F3CD82] text-[#101426] font-semibold'
                      : 'text-[#F5F0E7]/78 hover:text-[#FFF6E8]'
                  }`}
                >
                  {t('story.partBLabel')}
                </button>
              </div>
            </div>

            <div className="flex items-center gap-1.5 sm:gap-2.5 shrink-0">
              <div className="hidden sm:block">
                <LanguageSelector tone="dark" compact />
              </div>

              {/* Adaptive Quality Selector */}
              <div className="hidden xl:inline-flex items-center rounded-full border border-[#F3CD82]/28 bg-[#151D36] p-0.5 text-[11px]">
                {(['high', 'balanced', 'performance'] as const).map((tier) => (
                  <button
                    key={tier}
                    type="button"
                    onClick={() => setQualityTier(tier)}
                    aria-pressed={qualityTier === tier}
                    className={`px-2 py-1 rounded-full cursor-pointer transition-colors ${
                      qualityTier === tier
                        ? 'bg-[#F3CD82] text-[#101426] font-semibold'
                        : 'text-[#F5F0E7]/72 hover:text-[#FFF6E8]'
                    }`}
                  >
                    {tier === 'high'
                      ? t('story.qualityHigh')
                      : tier === 'balanced'
                        ? t('story.qualityBalanced')
                        : t('story.qualityPerformance')}
                  </button>
                ))}
              </div>

              {/* Reduced Motion Toggle */}
              <button
                type="button"
                onClick={() =>
                  setReducedMotionOverride((prev) =>
                    prev === null ? !osReducedMotion : !prev,
                  )
                }
                aria-pressed={effectiveReducedMotion}
                className={`hidden 2xl:inline-flex items-center gap-1.5 min-h-[36px] px-3 py-1 rounded-full border text-[11px] font-medium whitespace-nowrap cursor-pointer transition-colors ${
                  effectiveReducedMotion
                    ? 'border-[#F3CD82] bg-[#F3CD82]/18 text-[#F3CD82]'
                    : 'border-[#F3CD82]/25 bg-[#151D36] text-[#F5F0E7]/80 hover:text-white'
                }`}
              >
                <span>{t('story.reducedMotionLabel')}</span>
              </button>

              {/* 3D Assets Verification Drawer */}
              <button
                type="button"
                data-testid="open-asset-report-btn"
                onClick={() => setAssetReportOpen(true)}
                className="inline-flex items-center gap-1.5 min-h-[36px] px-3 py-1.5 rounded-full border border-[#F3CD82]/32 bg-[#151D36] text-[#F5F0E7] hover:border-[#F3CD82] hover:text-[#F3CD82] text-xs font-medium whitespace-nowrap cursor-pointer transition-colors"
              >
                <Layers className="w-3.5 h-3.5 text-[#F3CD82]" aria-hidden="true" />
                <span className="hidden md:inline">
                  {t('story.assetsLabel')} ({assetValidationReport.length}{warPackReady ? '' : '+'})
                </span>
              </button>

              {/* Scriptural Sources, 18 Days & Characters Drawer */}
              <button
                type="button"
                data-testid="open-sources-drawer-btn"
                onClick={() => setSourcesOpen(true)}
                className="inline-flex items-center gap-1.5 min-h-[36px] px-3 py-1.5 rounded-full border border-[#F3CD82]/35 bg-[#1B2542] text-[#F3CD82] hover:border-[#F3CD82] text-xs font-medium whitespace-nowrap cursor-pointer transition-colors"
              >
                <BookOpen className="w-3.5 h-3.5" aria-hidden="true" />
                <span className="hidden sm:inline">{t('story.sourcesLabel')}</span>
              </button>

              {/* 01..07 Chapter Selector Menu */}
              <button
                type="button"
                onClick={() => setChaptersOpen((prev) => !prev)}
                aria-expanded={chaptersOpen}
                className={`inline-flex items-center gap-1.5 min-h-[36px] px-3 py-1.5 rounded-full border text-xs font-medium whitespace-nowrap cursor-pointer transition-colors ${
                  chaptersOpen
                    ? 'bg-[#F3CD82] text-[#101426] border-[#F3CD82]'
                    : 'border-[#F3CD82]/35 bg-[#1B2542] text-[#FFF6E8] hover:border-[#F3CD82]'
                }`}
              >
                <ListOrdered className="w-3.5 h-3.5" aria-hidden="true" />
                <span>{t('story.scenesMenu')}</span>
              </button>

              {/* Zen Hide-UI Button */}
              <button
                type="button"
                onClick={() => setZenHideControls(true)}
                aria-label={t('story.hideControls')}
                title={t('story.hideControls')}
                className="hidden sm:inline-flex items-center justify-center w-9 h-9 rounded-full border border-[#F3CD82]/28 bg-[#151D36] text-[#F5F0E7]/80 hover:border-[#F3CD82] hover:text-[#F3CD82] cursor-pointer"
              >
                <EyeOff className="w-3.5 h-3.5" aria-hidden="true" />
              </button>
            </div>
          </div>
        </header>
      )}

      {/* Restore UI Floating Pill in Zen Mode */}
      {zenHideControls && (
        <button
          type="button"
          onClick={() => setZenHideControls(false)}
          className="fixed top-4 right-4 z-40 inline-flex items-center gap-1.5 min-h-[36px] px-3.5 py-1.5 rounded-full bg-[#0B0F1F]/90 border border-[#F3CD82]/40 text-xs text-[#F3CD82] hover:border-[#F3CD82] cursor-pointer"
        >
          <Eye className="w-3.5 h-3.5" aria-hidden="true" />
          <span>{t('story.showControls')}</span>
        </button>
      )}

      {/* Expandable 01..07 Chapter Selector Overlay */}
      <AnimatePresence>
        {chaptersOpen && (
          <motion.nav
            aria-label={t('story.scenesMenu')}
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: effectiveReducedMotion ? 0 : 0.18 }}
            className="fixed inset-x-0 top-14 sm:top-16 bottom-0 z-40 overflow-y-auto border-t border-[#F3CD82]/25 bg-[#0B0F1F]/97 px-4 sm:px-6 lg:px-10 py-6"
          >
            <div className="max-w-[1440px] mx-auto space-y-4 pb-8">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="sm:hidden">
                  <LanguageSelector tone="dark" compact />
                </div>
                <div className="flex items-center gap-3 ml-auto">
                  <button
                    type="button"
                    onClick={() => {
                      setChaptersOpen(false);
                      scrollToMasterProgress(0);
                    }}
                    className="inline-flex items-center gap-1.5 min-h-[36px] px-3.5 py-1.5 rounded-full border border-[#F3CD82]/35 text-xs text-[#F3CD82] hover:border-[#F3CD82] cursor-pointer"
                  >
                    <RotateCcw className="w-3.5 h-3.5" aria-hidden="true" />
                    <span>{t('story.restartStory')}</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setChaptersOpen(false)}
                    aria-label={t('story.closeScenesMenu')}
                    className="inline-flex items-center justify-center w-9 h-9 rounded-full border border-[#F3CD82]/30 text-[#FFF6E8] hover:border-[#F3CD82] cursor-pointer"
                  >
                    <X className="w-4 h-4" aria-hidden="true" />
                  </button>
                </div>
              </div>

              <div className="space-y-4">
                <div>
                  <p className="text-[11px] uppercase tracking-[0.18em] text-[#F3CD82] mb-2">
                    {t('story.partALabel')} (01–07)
                  </p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-7 gap-2.5">
                    {mergedStoryScenes.slice(0, 7).map((scene, idx) => {
                      const isCurrent = idx === currentSceneIndex;
                      const isCompleted = progressState.completedSceneIds.includes(scene.id);
                      const isVisited = progressState.visitedSceneIds.includes(scene.id);
                      return (
                        <button
                          key={scene.id}
                          type="button"
                          onClick={() => scrollToSceneIndex(idx)}
                          aria-current={isCurrent ? 'step' : undefined}
                          className={`text-left p-3 rounded-lg border transition-colors cursor-pointer flex flex-col justify-between gap-2 min-h-[92px] ${
                            isCurrent
                              ? 'bg-[#202B48] border-[#F3CD82] text-[#FFF6E8]'
                              : 'bg-[#141A31] border-[#F3CD82]/22 text-[#F5F0E7]/85 hover:border-[#F3CD82]/60'
                          }`}
                        >
                          <div className="flex items-center justify-between gap-2 text-[11px] font-medium text-[#F3CD82] tabular-nums">
                            <span>{scene.paddedCode}</span>
                            {isCompleted ? (
                              <CheckCircle2 className="w-3.5 h-3.5 text-[#F3CD82]" aria-hidden="true" />
                            ) : isVisited ? (
                              <span className="text-[10px] text-[#F5F0E7]/55">
                                {t('story.visitedBadge')}
                              </span>
                            ) : null}
                          </div>
                          <div>
                            <p className="font-editorial text-base leading-snug text-[#FFF6E8]">
                              {scene.title[locale]}
                            </p>
                            <p className="text-[11px] text-[#F5F0E7]/60 mt-0.5">
                              {scene.chaptersReferenced}
                            </p>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div>
                  <p className="text-[11px] uppercase tracking-[0.18em] text-[#F3CD82] mb-2">
                    {t('story.partBLabel')} (08–15 · Days 1–18 + Epilogue)
                  </p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5">
                    {mergedStoryScenes.slice(7).map((scene, offsetIdx) => {
                      const idx = offsetIdx + 7;
                      const isCurrent = idx === currentSceneIndex;
                      const isCompleted = progressState.completedSceneIds.includes(scene.id);
                      const isVisited = progressState.visitedSceneIds.includes(scene.id);
                      return (
                        <button
                          key={scene.id}
                          type="button"
                          onClick={() => scrollToSceneIndex(idx)}
                          aria-current={isCurrent ? 'step' : undefined}
                          className={`text-left p-3 rounded-lg border transition-colors cursor-pointer flex flex-col justify-between gap-2 min-h-[92px] ${
                            isCurrent
                              ? 'bg-[#202B48] border-[#F3CD82] text-[#FFF6E8]'
                              : 'bg-[#141A31] border-[#F3CD82]/22 text-[#F5F0E7]/85 hover:border-[#F3CD82]/60'
                          }`}
                        >
                          <div className="flex items-center justify-between gap-2 text-[11px] font-medium text-[#F3CD82] tabular-nums">
                            <span>{scene.paddedCode}</span>
                            {isCompleted ? (
                              <CheckCircle2 className="w-3.5 h-3.5 text-[#F3CD82]" aria-hidden="true" />
                            ) : isVisited ? (
                              <span className="text-[10px] text-[#F5F0E7]/55">
                                {t('story.visitedBadge')}
                              </span>
                            ) : null}
                          </div>
                          <div>
                            <p className="font-editorial text-base leading-snug text-[#FFF6E8]">
                              {scene.title[locale]}
                            </p>
                            <p className="text-[11px] text-[#F5F0E7]/60 mt-0.5">
                              {scene.chaptersReferenced}
                            </p>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>
            </div>
          </motion.nav>
        )}
      </AnimatePresence>

      {/* PERSISTENT 3D STORY STAGE + 15-SEQUENCE SCROLL CHOREOGRAPHY TRACK */}
      <main id="main-content" ref={scrollTrackRef} className="relative">
        {/* Sticky 100vh Persistent WebGL World (stays mounted uninterrupted from Scene 01 -> 15) */}
        <div className="sticky top-0 h-screen w-full overflow-hidden z-0">
          <StoryCanvas3D
            masterProgress={masterProgress}
            activeScene={activeScene}
            isSoundPlaying={soundEnabled && soundStatus === 'playing'}
            getSpokenTimeSec={getSpokenTimeSec}
            qualityTier={qualityTier}
            reducedMotion={effectiveReducedMotion}
            isAutoScrolling={isAutoScrolling}
            forceStaticFallback={forceStaticWebglFallback}
            onLoadProgress={setLoadProgress}
            onAssetsReady={(report) => {
              setAssetValidationReport(report);
              setAssetsReady(true);
            }}
            onWarPackReady={() => setWarPackReady(true)}
            onQualityDowngrade={(next) => setQualityTier(next)}
            onShotNameChange={setActiveShotName}
          />
          {/* Subtle top/bottom vignette gradients without obscuring 3D center silhouettes */}
          <div
            aria-hidden="true"
            className="pointer-events-none absolute inset-x-0 top-0 h-28 bg-gradient-to-b from-[#0B0F1F]/70 to-transparent"
          />
          <div
            aria-hidden="true"
            className="pointer-events-none absolute inset-x-0 bottom-0 h-32 bg-gradient-to-t from-[#0B0F1F]/80 to-transparent"
          />
        </div>

        {/* Scroll Choreography Sections driving GSAP ScrollTrigger */}
        <div className="relative z-10 -mt-[100vh] pointer-events-none">
          {mergedStoryScenes.map((scene) => (
            <section
              key={scene.id}
              data-story-chapter={scene.id}
              aria-label={`${t('story.scenePrefix')} ${scene.paddedCode}: ${scene.title[locale]}`}
              className="min-h-[145vh] sm:min-h-[160vh]"
            >
              <h2 className="sr-only">
                {t('story.scenePrefix')} {scene.paddedCode}: {scene.title[locale]}
              </h2>
            </section>
          ))}
        </div>
      </main>

      {/* Single Viewport-Safe Active Editorial Chapter Card (never collides with header or bottom dock) */}
      {!zenHideControls && (() => {
        const scene = activeScene;
        const win = STORY_SCENE_WINDOWS[currentSceneIndex] ?? STORY_SCENE_WINDOWS[0];
        const primaryVerse = scene.featuredVerses[0];
        const isScene04 = scene.id === 'scene-04';
        const isClosingScene = scene.id === 'scene-07' || scene.id === 'scene-15';
        const isPartB = scene.partId === 'part-b';
        const currentDayRecord = isPartB
          ? MAHABHARATA_18_DAYS.find((d) => d.day === snapshot.activeWarDay)
          : undefined;

        return (
          <div className="fixed top-16 sm:top-20 inset-x-3 sm:inset-x-6 lg:inset-x-10 z-20 pointer-events-none">
            <div className="max-w-[1440px] mx-auto">
              <div
                key={scene.id}
                className="pointer-events-auto max-w-[390px] sm:max-w-[430px] w-full max-h-[36vh] sm:max-h-[calc(100vh-15.75rem)] overflow-y-auto bg-[#0D1225]/92 border border-[#F3CD82]/26 rounded-xl p-3.5 sm:p-4 shadow-[0_18px_50px_rgba(0,0,0,0.55)] space-y-2.5"
              >
                {/* Scene Header */}
                <div className="space-y-1">
                  <div className="flex flex-wrap items-center justify-between gap-2 text-[10px] sm:text-[11px] font-medium tracking-[0.15em] uppercase text-[#F3CD82] tabular-nums">
                    <span>
                      {t('story.scenePrefix')} {scene.paddedCode} · {scene.warDaysLabel ?? scene.chaptersReferenced}
                    </span>
                    <span className="px-2 py-0.5 rounded bg-[#18213D] border border-[#F3CD82]/30 text-[9px] tracking-[0.08em] text-[#F3CD82]">
                      {isPartB ? t('story.provenanceMahabharata') : t('story.provenanceGita')}
                    </span>
                  </div>

                  <div className="flex items-start justify-between gap-2">
                    <h1 className="font-editorial font-normal text-xl sm:text-[26px] leading-[1.12] text-[#FFF6E8]">
                      {scene.title[locale]}
                    </h1>
                    {isScene04 && (
                      <button
                        type="button"
                        onClick={() => setForceStaticWebglFallback((p) => !p)}
                        className="text-[10px] tracking-[0.06em] underline text-[#FFF6E8]/85 hover:text-[#F3CD82] cursor-pointer shrink-0 pt-1"
                      >
                        {forceStaticWebglFallback
                          ? t('story.toggleCosmosView')
                          : t('story.toggleFallbackView')}
                      </button>
                    )}
                  </div>

                  <p className="text-xs sm:text-[13px] text-[#F5F0E7]/78 leading-relaxed">
                    {scene.atmosphereNote[locale]}
                  </p>
                </div>

                {/* Part B Compact Day 1..18 Active War Chronicle Strip */}
                {isPartB && currentDayRecord && (
                  <div className="pt-2 border-t border-[#F3CD82]/16 space-y-1.5" data-testid="part-b-war-day-card">
                    <div className="flex items-center justify-between text-[11px] text-[#F3CD82]">
                      <span className="font-semibold">
                        Day {currentDayRecord.day} · {currentDayRecord.parva}
                      </span>
                      <button
                        type="button"
                        onClick={() => setSourcesOpen(true)}
                        className="underline hover:text-[#FFF6E8] cursor-pointer text-[10px]"
                      >
                        {t('story.daysChronicleTab')} →
                      </button>
                    </div>
                    <p className="text-xs font-medium text-[#FFF6E8]/92">
                      {currentDayRecord.title[locale]}
                    </p>
                  </div>
                )}

                {/* Scene 04 Progressive 8-Phase Vishvarupa Cosmic Indicator */}
                {isScene04 && (
                  <div className="pt-2 border-t border-[#F3CD82]/16 space-y-1.5">
                    <div className="flex items-center justify-between text-[11px] text-[#F3CD82]">
                      <span className="inline-flex items-center gap-1.5">
                        <Sparkles className="w-3.5 h-3.5" aria-hidden="true" />
                        <span>{t('story.vishvarupaPhaseLabel')}</span>
                      </span>
                      <span className="tabular-nums font-semibold">
                        {currentSceneIndex === 3 ? vishvarupaPhaseNum : 1} / 8
                      </span>
                    </div>
                    <div className="grid grid-cols-8 gap-1">
                      {Array.from({ length: 8 }).map((_, phaseIdx) => {
                        const phaseProg = win.start + ((phaseIdx + 0.5) / 8) * (win.end - win.start);
                        const isActivePhase =
                          currentSceneIndex === 3 && phaseIdx + 1 === vishvarupaPhaseNum;
                        return (
                          <button
                            key={phaseIdx}
                            type="button"
                            aria-label={`${t('story.vishvarupaPhaseLabel')} ${phaseIdx + 1}`}
                            onClick={() => scrollToMasterProgress(phaseProg)}
                            className={`h-2 rounded-full cursor-pointer transition-colors ${
                              isActivePhase
                                ? 'bg-[#F3CD82]'
                                : 'bg-[#F3CD82]/25 hover:bg-[#F3CD82]/55'
                            }`}
                          />
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* Canonical Scripture Verse with On-Demand Sanskrit Audio (Part A) */}
                {primaryVerse && (
                  <div className="pt-2.5 border-t border-[#F3CD82]/18 space-y-2">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <span className="text-[10px] font-medium tracking-[0.12em] uppercase text-[#F3CD82]">
                        {primaryVerse.reference}
                      </span>
                      <button
                        type="button"
                        onClick={() => void handleToggleVerseAudio(primaryVerse.chapter)}
                        className="inline-flex items-center gap-1.5 min-h-[28px] px-2.5 py-0.5 rounded-full border border-[#F3CD82]/38 bg-[#18213D] text-[#F3CD82] hover:border-[#F3CD82] text-[10px] font-medium uppercase tracking-[0.06em] cursor-pointer"
                      >
                        {verseAudioState === 'loading' ? (
                          <>
                            <Loader2 className="w-3 h-3 animate-spin" aria-hidden="true" />
                            <span>{t('story.loadingSanskritVerse')}</span>
                          </>
                        ) : verseAudioState === 'playing' ? (
                          <>
                            <Square className="w-2.5 h-2.5 fill-current" aria-hidden="true" />
                            <span>{t('story.stopSanskritVerse')}</span>
                          </>
                        ) : (
                          <>
                            <Volume2 className="w-3 h-3" aria-hidden="true" />
                            <span>{t('story.listenSanskritVerse')}</span>
                          </>
                        )}
                      </button>
                    </div>

                    {verseAudioNotice && (
                      <p role="status" className="text-[11px] text-[#F3CD82]">
                        {verseAudioNotice}
                      </p>
                    )}

                    <p lang="sa" className="text-sm sm:text-[15px] leading-relaxed text-[#F3CD82] whitespace-pre-line font-medium">
                      {primaryVerse.sanskritDevanagari}
                    </p>
                    <p className="font-editorial text-sm sm:text-[15px] leading-relaxed text-[#FFF6E8]/92">
                      “{primaryVerse.translation[locale]}”
                    </p>
                  </div>
                )}

                {/* Interactive Teaching Pillars (Scene 03 & Scene 05) */}
                {scene.teachingPillars && scene.teachingPillars.length > 0 && (
                  <div className="pt-2.5 border-t border-[#F3CD82]/18 space-y-2">
                    <p className="text-[10px] font-medium tracking-[0.16em] uppercase text-[#F3CD82]">
                      {scene.sceneNumber === 3
                        ? t('story.pillarsHeading')
                        : t('story.yogaPathsHeading')}
                    </p>
                    <div className="flex flex-wrap gap-1.5" role="tablist">
                      {scene.teachingPillars.map((pillar, pIdx) => {
                        const isSelected =
                          (scene.sceneNumber === 5 && currentSceneIndex === 4
                            ? snapshot.activeYogaIndex
                            : activePillarIndex) === pIdx;
                        return (
                          <button
                            key={pillar.id}
                            type="button"
                            role="tab"
                            aria-selected={isSelected}
                            onClick={() => {
                              setActivePillarIndex(pIdx);
                              if (scene.sceneNumber === 5) {
                                const targetP =
                                  win.start +
                                  ((pIdx + 0.35) / scene.teachingPillars!.length) *
                                    (win.end - win.start);
                                scrollToMasterProgress(targetP);
                              }
                            }}
                            className={`px-2.5 py-1 rounded text-[11px] font-medium cursor-pointer transition-colors ${
                              isSelected
                                ? 'bg-[#F3CD82] text-[#101426]'
                                : 'bg-[#1A2340] text-[#F5F0E7]/80 hover:text-[#F3CD82]'
                            }`}
                          >
                            {pillar.title[locale]}
                          </button>
                        );
                      })}
                    </div>

                    {(() => {
                      const pillarIdx =
                        scene.sceneNumber === 5 && currentSceneIndex === 4
                          ? snapshot.activeYogaIndex
                          : activePillarIndex;
                      const activePillar =
                        scene.teachingPillars[pillarIdx] ?? scene.teachingPillars[0];
                      return (
                        <div className="p-2.5 rounded-lg bg-[#141B33] border border-[#F3CD82]/16 space-y-1">
                          <div className="flex items-center justify-between text-[11px] text-[#F3CD82]">
                            <span>{activePillar.sanskritTerm}</span>
                            <span>{activePillar.verseRef}</span>
                          </div>
                          <p className="text-xs leading-relaxed text-[#FFF6E8]/88">
                            {activePillar.summary[locale]}
                          </p>
                        </div>
                      );
                    })()}
                  </div>
                )}

                {/* Closing Scene 07 or Scene 15 Mahotsav Epilogue & Conversion CTAs */}
                {isClosingScene && (
                  <div className="pt-2 border-t border-[#F3CD82]/22 space-y-2">
                    {scene.eternalValues && (
                      <>
                        <p className="text-[10px] font-medium tracking-[0.18em] uppercase text-[#F3CD82]">
                          {t('story.eternalValuesHeading')}
                        </p>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
                          {scene.eternalValues.map((val) => (
                            <div
                              key={val.id}
                              className="px-2 py-1.5 rounded bg-[#161E38] border border-[#F3CD82]/15"
                            >
                              <p className="text-[11px] font-semibold text-[#F3CD82]">
                                {val.title[locale]}
                              </p>
                              <p className="text-[10px] text-[#F5F0E7]/76 leading-snug">
                                {val.note[locale]}
                              </p>
                            </div>
                          ))}
                        </div>
                      </>
                    )}

                    <div className="pt-0.5 flex flex-col gap-1.5">
                      <Link
                        to="/participate/register"
                        className="inline-flex items-center justify-center gap-2 min-h-[38px] px-4 py-1.5 rounded-full bg-[#F3CD82] text-[#101426] hover:bg-[#FFF6E8] text-xs font-semibold uppercase tracking-[0.08em] transition-colors"
                      >
                        <span>{t('story.ctaRegisterMahotsav')}</span>
                        <ArrowRight className="w-4 h-4" aria-hidden="true" />
                      </Link>
                      <div className="grid grid-cols-2 gap-1.5">
                        <Link
                          to="/gita"
                          className="inline-flex items-center justify-center min-h-[34px] px-2.5 py-1 rounded-full border border-[#F3CD82]/40 text-[#FFF6E8] hover:border-[#F3CD82] hover:text-[#F3CD82] text-[11px] font-medium text-center transition-colors"
                        >
                          {t('story.ctaExploreChapters')}
                        </Link>
                        <Link
                          to="/about"
                          className="inline-flex items-center justify-center min-h-[34px] px-2.5 py-1 rounded-full border border-[#F3CD82]/40 text-[#FFF6E8] hover:border-[#F3CD82] hover:text-[#F3CD82] text-[11px] font-medium text-center transition-colors"
                        >
                          {t('story.ctaDiscoverMahotsav')}
                        </Link>
                      </div>
                    </div>
                  </div>
                )}

                {currentSceneIndex === 0 && (
                  <p className="text-[11px] text-[#F3CD82]/80 tracking-[0.06em] pt-0.5">
                    ↓ {t('story.scrollHint')}
                  </p>
                )}
              </div>
            </div>
          </div>
        );
      })()}

      {/* Bottom Floating Narration Caption + Cinema Scrubber Dock */}
      {!zenHideControls && (
        <div className="fixed bottom-3 inset-x-3 sm:inset-x-6 lg:inset-x-10 z-30 pointer-events-none">
          <div className="max-w-[1440px] mx-auto flex flex-col gap-2">
            {/* Synchronized Caption Card */}
            {progressState.captionsEnabled && activeCue && (
              <div
                aria-live="polite"
                data-testid="story-captions-panel"
                className="pointer-events-auto max-w-2xl bg-[#0D1225]/92 border border-[#F3CD82]/28 rounded-lg px-4 py-2.5 space-y-1 shadow-[0_12px_36px_rgba(0,0,0,0.5)]"
              >
                <div className="flex items-center justify-between gap-2 text-[10px] font-medium tracking-[0.14em] uppercase text-[#F3CD82]">
                  <span>{activeCue.speaker[locale]}</span>
                  <span className="text-[#F5F0E7]/60 tabular-nums">
                    {activeScene.paddedCode} · {snapshot.cueIndex + 1}/{activeScene.cues.length}
                  </span>
                </div>
                <p className="text-xs sm:text-sm leading-relaxed text-[#FFF6E8]">
                  {activeCue.text[locale]}
                </p>
              </div>
            )}

            {/* Slim Floating Playback & Chapter Control Bar */}
            <div className="pointer-events-auto bg-[#0D1225]/95 border border-[#F3CD82]/26 rounded-xl px-3 py-2 shadow-[0_14px_40px_rgba(0,0,0,0.55)] space-y-2">
              <div className="h-1 w-full rounded-full bg-[#202B48] overflow-hidden">
                <div
                  className="h-full bg-[#F3CD82] transition-[width] duration-150"
                  style={{ width: `${Math.round(masterProgress * 100)}%` }}
                />
              </div>

              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="flex items-center gap-1.5 sm:gap-2">
                  <button
                    type="button"
                    onClick={() => scrollToSceneIndex(currentSceneIndex - 1)}
                    disabled={!hasPrev}
                    aria-label={t('story.previousScene')}
                    className="inline-flex items-center justify-center w-8 h-8 rounded-full border border-[#F3CD82]/30 bg-[#17203B] text-[#FFF6E8] hover:border-[#F3CD82] disabled:opacity-35 cursor-pointer"
                  >
                    <ChevronLeft className="w-4 h-4" aria-hidden="true" />
                  </button>

                  <button
                    type="button"
                    data-testid="auto-scroll-toggle"
                    onClick={() => setIsAutoScrolling((p) => !p)}
                    className="inline-flex items-center gap-1.5 min-h-[34px] px-3.5 py-1 rounded-full bg-[#F3CD82] text-[#101426] hover:bg-[#FFF6E8] text-xs font-semibold cursor-pointer transition-colors"
                  >
                    {isAutoScrolling ? (
                      <>
                        <Pause className="w-3.5 h-3.5 fill-current" aria-hidden="true" />
                        <span>{t('story.pause')}</span>
                      </>
                    ) : (
                      <>
                        <Play className="w-3.5 h-3.5 fill-current" aria-hidden="true" />
                        <span>{t('story.autoScrollLabel')}</span>
                      </>
                    )}
                  </button>

                  <button
                    type="button"
                    onClick={() => scrollToSceneIndex(currentSceneIndex + 1)}
                    disabled={!hasNext}
                    aria-label={t('story.nextScene')}
                    className="inline-flex items-center justify-center w-8 h-8 rounded-full border border-[#F3CD82]/30 bg-[#17203B] text-[#FFF6E8] hover:border-[#F3CD82] disabled:opacity-35 cursor-pointer"
                  >
                    <ChevronRight className="w-4 h-4" aria-hidden="true" />
                  </button>
                </div>

                {/* Chapter 01..15 Interactive Timeline Buttons (scrollable container so 1440px never overflows) */}
                <div className="hidden md:flex items-center gap-1 overflow-x-auto max-w-[540px] py-0.5">
                  {mergedStoryScenes.map((s, idx) => {
                    const active = idx === currentSceneIndex;
                    return (
                      <button
                        key={s.id}
                        type="button"
                        onClick={() => scrollToSceneIndex(idx)}
                        aria-label={`${t('story.scenePrefix')} ${s.paddedCode}: ${s.title[locale]}`}
                        aria-current={active ? 'step' : undefined}
                        className={`h-7 min-w-[28px] px-2 rounded-full text-[11px] font-medium tabular-nums border cursor-pointer transition-colors shrink-0 ${
                          active
                            ? 'bg-[#F3CD82] text-[#101426] border-[#F3CD82] font-semibold'
                            : s.partId === 'part-b'
                              ? 'bg-[#1D2034] text-[#F5F0E7]/78 border-[#F3CD82]/22 hover:border-[#F3CD82]'
                              : 'bg-[#17203B] text-[#F5F0E7]/78 border-[#F3CD82]/25 hover:border-[#F3CD82]'
                        }`}
                      >
                        {s.paddedCode}
                      </button>
                    );
                  })}
                </div>

                {/* Captions + Spoken Sound + Fullscreen */}
                <div className="flex items-center gap-1.5 sm:gap-2">
                  {soundNotice && (
                    <span className="hidden xl:inline text-[11px] text-[#F3CD82]">
                      {soundNotice}
                    </span>
                  )}

                  <button
                    type="button"
                    onClick={() =>
                      setProgressState((prev) => ({
                        ...prev,
                        captionsEnabled: !prev.captionsEnabled,
                        updatedAt: Date.now(),
                      }))
                    }
                    aria-pressed={progressState.captionsEnabled}
                    className={`inline-flex items-center gap-1.5 min-h-[34px] px-3 py-1 rounded-full border text-xs font-medium cursor-pointer transition-colors ${
                      progressState.captionsEnabled
                        ? 'border-[#F3CD82] bg-[#F3CD82]/16 text-[#F3CD82]'
                        : 'border-[#F3CD82]/25 bg-[#17203B] text-[#F5F0E7]/75 hover:text-white'
                    }`}
                  >
                    <Subtitles className="w-3.5 h-3.5" aria-hidden="true" />
                    <span className="hidden sm:inline">
                      {progressState.captionsEnabled ? t('story.captionsOn') : t('story.captionsOff')}
                    </span>
                  </button>

                  <button
                    type="button"
                    onClick={() =>
                      setSoundEnabled((prev) => {
                        const next = !prev;
                        if (next) narrationServerQuotaRef.current = false;
                        return next;
                      })
                    }
                    aria-pressed={soundEnabled}
                    className={`inline-flex items-center gap-1.5 min-h-[34px] px-3 py-1 rounded-full border text-xs font-medium cursor-pointer transition-colors ${
                      soundEnabled
                        ? 'border-[#F3CD82] bg-[#F3CD82]/16 text-[#F3CD82]'
                        : 'border-[#F3CD82]/25 bg-[#17203B] text-[#F5F0E7]/75 hover:text-white'
                    }`}
                  >
                    {soundStatus === 'loading' ? (
                      <Loader2 className="w-3.5 h-3.5 animate-spin" aria-hidden="true" />
                    ) : soundEnabled ? (
                      <Volume2 className="w-3.5 h-3.5" aria-hidden="true" />
                    ) : (
                      <VolumeX className="w-3.5 h-3.5" aria-hidden="true" />
                    )}
                    <span className="hidden sm:inline">
                      {soundEnabled ? t('story.soundOn') : t('story.soundOff')}
                    </span>
                  </button>

                  <button
                    type="button"
                    onClick={() => void handleToggleFullscreen()}
                    aria-label={isFullscreen ? t('story.exitFullscreen') : t('story.enterFullscreen')}
                    className="inline-flex items-center justify-center w-8 h-8 rounded-full border border-[#F3CD82]/28 bg-[#17203B] text-[#F5F0E7]/85 hover:border-[#F3CD82] hover:text-[#F3CD82] cursor-pointer"
                  >
                    {isFullscreen ? (
                      <Minimize2 className="w-3.5 h-3.5" aria-hidden="true" />
                    ) : (
                      <Maximize2 className="w-3.5 h-3.5" aria-hidden="true" />
                    )}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Drawers */}
      <StorySourcesDrawer
        isOpen={sourcesOpen}
        onClose={() => setSourcesOpen(false)}
        scene={activeScene}
        onSelectSceneIndex={(idx) => scrollToSceneIndex(idx)}
      />

      <AssetReportDrawer
        isOpen={assetReportOpen}
        onClose={() => setAssetReportOpen(false)}
        records={assetValidationReport}
      />
    </div>
  );
};
