import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  FastForward,
  PauseCircle,
  PlayCircle,
  RotateCcw,
  Sparkles,
  Volume2,
  VolumeX,
} from 'lucide-react';
import { gsap, prefersReducedMotion } from '../../animations/gsapSetup';
import { useI18n } from '../../i18n';
import type { CoreLocale } from '../../utils/i18nHelpers';
import { WelcomeSoundscape } from '../../three/welcome/welcomeSoundscape';
import {
  DEFAULT_WELCOME_PREFERENCES,
  deserializeWelcomePreferences,
  getActiveNarrationCaption,
  getWelcomeNarrationScript,
  getWelcomeSceneAtTime,
  resolveWelcomeNarrationLocale,
  serializeWelcomePreferences,
  WELCOME_PREFS_STORAGE_KEY,
  WELCOME_TOTAL_DURATION_SEC,
  type WelcomePreferences,
} from '../../utils/welcomeExperience';
import { WelcomeScene3D } from './WelcomeScene3D';

export interface WelcomeExperienceProps {
  onComplete: () => void;
}

type SoundStatus = 'checking' | 'blocked' | 'playing' | 'muted' | 'unavailable';

export const WelcomeExperience: React.FC<WelcomeExperienceProps> = ({ onComplete }) => {
  const { locale, t } = useI18n();
  const overlayRef = useRef<HTMLDivElement | null>(null);
  const titleBlockRef = useRef<HTMLDivElement | null>(null);

  const [prefs, setPrefs] = useState<WelcomePreferences>(() => {
    try {
      const raw = window.localStorage.getItem(WELCOME_PREFS_STORAGE_KEY);
      return deserializeWelcomePreferences(raw);
    } catch {
      return { ...DEFAULT_WELCOME_PREFERENCES };
    }
  });

  const [osReducedMotion, setOsReducedMotion] = useState<boolean>(() => prefersReducedMotion());
  const effectiveReducedMotion = prefs.reducedMotionOverride ?? osReducedMotion;

  // Narration language defaults to active site core language, with manual TE/EN/HI switcher
  const [voiceLocale, setVoiceLocale] = useState<CoreLocale>(() =>
    resolveWelcomeNarrationLocale(locale),
  );

  useEffect(() => {
    setVoiceLocale(resolveWelcomeNarrationLocale(locale));
  }, [locale]);

  const narrationScript = useMemo(
    () => getWelcomeNarrationScript(voiceLocale),
    [voiceLocale],
  );

  const [elapsedSec, setElapsedSec] = useState<number>(0);
  const [isExiting, setIsExiting] = useState<boolean>(false);
  const [soundStatus, setSoundStatus] = useState<SoundStatus>(() =>
    prefs.soundMuted ? 'muted' : 'checking',
  );
  const [audioProgress, setAudioProgress] = useState<number>(0);
  const [isVoiceSpeaking, setIsVoiceSpeaking] = useState<boolean>(false);
  const [renderMode, setRenderMode] = useState<'webgl' | 'fallback'>('webgl');

  const soundscapeRef = useRef<WelcomeSoundscape | null>(null);
  const narrationAudioRef = useRef<HTMLAudioElement | null>(null);
  const voiceTriggeredRef = useRef<boolean>(false);
  const isVoiceSpeakingRef = useRef<boolean>(false);
  const completedRef = useRef<boolean>(false);
  const exitTimerRef = useRef<number | null>(null);
  isVoiceSpeakingRef.current = isVoiceSpeaking;

  const updatePrefs = useCallback((updater: (prev: WelcomePreferences) => WelcomePreferences) => {
    setPrefs((prev) => {
      const next = updater(prev);
      try {
        window.localStorage.setItem(WELCOME_PREFS_STORAGE_KEY, serializeWelcomePreferences(next));
      } catch {
        // Ignore storage restrictions
      }
      return next;
    });
  }, []);

  // Watch OS prefers-reduced-motion changes
  useEffect(() => {
    if (typeof window === 'undefined' || !window.matchMedia) return;
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
    setOsReducedMotion(mq.matches);
    const onChange = (e: MediaQueryListEvent) => setOsReducedMotion(e.matches);
    mq.addEventListener?.('change', onChange);
    return () => mq.removeEventListener?.('change', onChange);
  }, []);

  const finishIntro = useCallback(() => {
    if (completedRef.current) return;
    completedRef.current = true;
    setIsExiting(true);

    soundscapeRef.current?.fadeOutAndStop();
    if (narrationAudioRef.current) {
      narrationAudioRef.current.pause();
    }

    const fadeMs = effectiveReducedMotion ? 180 : 680;
    exitTimerRef.current = window.setTimeout(() => {
      onComplete();
    }, fadeMs);
  }, [effectiveReducedMotion, onComplete]);

  const stopNarrationAudio = useCallback(() => {
    const audio = narrationAudioRef.current;
    if (audio) {
      audio.pause();
      audio.currentTime = 0;
      audio.onended = null;
      audio.onerror = null;
      audio.ontimeupdate = null;
    }
    narrationAudioRef.current = null;
    setIsVoiceSpeaking(false);
    setAudioProgress(0);
    soundscapeRef.current?.setDucked(false);
  }, []);

  const playNarrationAudio = useCallback(
    async (targetScript: typeof narrationScript): Promise<boolean> => {
      stopNarrationAudio();

      const attemptSource = async (
        srcUrl: string,
      ): Promise<{ ok: boolean; blocked: boolean }> => {
        const audio = new Audio(srcUrl);
        audio.preload = 'auto';
        narrationAudioRef.current = audio;

        audio.ontimeupdate = () => {
          if (audio.duration && Number.isFinite(audio.duration) && audio.duration > 0) {
            setAudioProgress(Math.min(1, audio.currentTime / audio.duration));
          }
        };

        audio.onended = () => {
          setIsVoiceSpeaking(false);
          setAudioProgress(1);
          soundscapeRef.current?.setDucked(false);
        };

        try {
          await audio.play();
          setIsVoiceSpeaking(true);
          soundscapeRef.current?.setDucked(true);
          return { ok: true, blocked: false };
        } catch (err) {
          if (err instanceof DOMException && err.name === 'NotAllowedError') {
            setSoundStatus('blocked');
            return { ok: false, blocked: true };
          }
          return { ok: false, blocked: false };
        }
      };

      const staticRes = await attemptSource(targetScript.audioUrl);
      if (staticRes.ok) return true;
      if (staticRes.blocked) return false;

      const apiRes = await attemptSource(targetScript.fallbackApiUrl);
      if (apiRes.ok) return true;
      if (!apiRes.blocked) {
        setSoundStatus('unavailable');
      }
      return false;
    },
    [stopNarrationAudio],
  );

  // Initialize Soundscape & probe browser autoplay policy once
  useEffect(() => {
    const soundscape = new WelcomeSoundscape();
    soundscapeRef.current = soundscape;

    let cancelled = false;

    const initAudioPolicy = async () => {
      if (prefs.soundMuted) {
        soundscape.setMuted(true);
        setSoundStatus('muted');
        return;
      }

      const unlocked = await soundscape.ensureUnlocked();
      if (cancelled) return;

      if (unlocked) {
        soundscape.setMuted(false);
        soundscape.startAmbientDrone();
        setSoundStatus('playing');
      } else {
        setSoundStatus('blocked');
      }
    };

    void initAudioPolicy();

    return () => {
      cancelled = true;
      if (exitTimerRef.current !== null) {
        window.clearTimeout(exitTimerRef.current);
      }
      stopNarrationAudio();
      soundscape.dispose();
      soundscapeRef.current = null;
    };
  }, [stopNarrationAudio]);

  // Master 6-Scene Playback Clock (wall-clock synced so FPS never slows transitions; pauses on Reduced Motion or hidden tab)
  useEffect(() => {
    if (isExiting || completedRef.current) return;
    if (effectiveReducedMotion) {
      setElapsedSec(14.2);
      return;
    }

    let rafId = 0;
    let lastTs = performance.now();

    const step = (now: number) => {
      const dt = document.hidden ? 0 : Math.max(0, (now - lastTs) / 1000);
      lastTs = now;

      setElapsedSec((prev) => {
        const next = Math.min(WELCOME_TOTAL_DURATION_SEC, prev + dt);
        // Hold gracefully in Scene 5 Grand Title until active spoken narration finishes
        if (isVoiceSpeakingRef.current && next > 15.45) {
          return Math.max(prev, 15.45);
        }
        return next;
      });

      rafId = window.requestAnimationFrame(step);
    };

    rafId = window.requestAnimationFrame(step);
    return () => window.cancelAnimationFrame(rafId);
  }, [effectiveReducedMotion, isExiting]);

  // Trigger synchronized audio cues & Scene 6 completion
  useEffect(() => {
    const soundscape = soundscapeRef.current;

    if (soundStatus === 'playing' && soundscape) {
      if (elapsedSec >= 2.5) {
        soundscape.playTempleBell();
      }
      if (elapsedSec >= 4.2) {
        soundscape.playConchResonance();
      }
      if (elapsedSec >= 6.4 && !voiceTriggeredRef.current) {
        voiceTriggeredRef.current = true;
        void playNarrationAudio(narrationScript);
      }
    }

    if (
      !effectiveReducedMotion &&
      !isVoiceSpeaking &&
      elapsedSec >= WELCOME_TOTAL_DURATION_SEC &&
      !isExiting &&
      !completedRef.current
    ) {
      finishIntro();
    }
  }, [
    elapsedSec,
    soundStatus,
    isVoiceSpeaking,
    effectiveReducedMotion,
    isExiting,
    narrationScript,
    playNarrationAudio,
    finishIntro,
  ]);

  // Keyboard Escape shortcut for Skip Intro
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        finishIntro();
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [finishIntro]);

  // GSAP subtle entrance reveal for the Grand Title in Scene 5
  const sceneInfo = useMemo(() => getWelcomeSceneAtTime(elapsedSec), [elapsedSec]);
  const showGrandTitle = effectiveReducedMotion || sceneInfo.scene.index >= 4;
  const showVoiceCaptions =
    isVoiceSpeaking ||
    sceneInfo.scene.index === 3 ||
    (effectiveReducedMotion && soundStatus === 'playing');

  useEffect(() => {
    if (!showGrandTitle || !titleBlockRef.current || effectiveReducedMotion) return;
    gsap.fromTo(
      titleBlockRef.current,
      { opacity: 0, y: 18 },
      { opacity: 1, y: 0, duration: 1.05, ease: 'power3.out' },
    );
  }, [showGrandTitle, effectiveReducedMotion]);

  // Handle user clicking "Enable Sound" or "Unmute" -> immediately start narration + ambient bed
  const handleEnableSound = useCallback(async () => {
    const soundscape = soundscapeRef.current;
    updatePrefs((p) => ({ ...p, soundMuted: false }));

    if (soundscape) {
      const ok = await soundscape.ensureUnlocked();
      if (ok) {
        soundscape.setMuted(false);
        soundscape.startAmbientDrone();
      }
    }

    setSoundStatus('playing');
    voiceTriggeredRef.current = true;
    await playNarrationAudio(narrationScript);
  }, [narrationScript, playNarrationAudio, updatePrefs]);

  const handleMuteSound = useCallback(() => {
    updatePrefs((p) => ({ ...p, soundMuted: true }));
    soundscapeRef.current?.setMuted(true);
    stopNarrationAudio();
    setSoundStatus('muted');
  }, [stopNarrationAudio, updatePrefs]);

  const handleToggleReducedMotion = useCallback(() => {
    updatePrefs((p) => ({
      ...p,
      reducedMotionOverride: !(p.reducedMotionOverride ?? osReducedMotion),
    }));
  }, [osReducedMotion, updatePrefs]);

  const handleReplaySequence = useCallback(() => {
    voiceTriggeredRef.current = false;
    setElapsedSec(0);
    setAudioProgress(0);
    soundscapeRef.current?.resetCues();
    stopNarrationAudio();
    if (effectiveReducedMotion) {
      updatePrefs((p) => ({ ...p, reducedMotionOverride: false }));
    }
  }, [effectiveReducedMotion, stopNarrationAudio, updatePrefs]);

  const handleSelectVoiceLocale = useCallback(
    async (nextVoice: CoreLocale) => {
      setVoiceLocale(nextVoice);
      if (soundStatus === 'playing') {
        voiceTriggeredRef.current = true;
        const nextScript = getWelcomeNarrationScript(nextVoice);
        await playNarrationAudio(nextScript);
      }
    },
    [playNarrationAudio, soundStatus],
  );

  const activeCaptionText = useMemo(() => {
    const fallbackRatio =
      sceneInfo.scene.index === 3 ? sceneInfo.sceneLocalProgress : 0.05;
    const ratio = isVoiceSpeaking ? audioProgress : fallbackRatio;
    return getActiveNarrationCaption(narrationScript, ratio);
  }, [audioProgress, isVoiceSpeaking, narrationScript, sceneInfo]);

  const progressPct = Math.round(sceneInfo.normalizedProgress * 100);
  const transitionOverlayOpacity =
    sceneInfo.scene.index === 5 ? Math.min(0.88, sceneInfo.sceneLocalProgress * 0.92) : 0;

  return (
    <div
      ref={overlayRef}
      role="dialog"
      aria-modal="true"
      aria-label={t('welcome.ariaLabel')}
      data-testid="welcome-experience"
      data-welcome-scene={sceneInfo.scene.id}
      data-sound-status={soundStatus}
      data-render-mode={renderMode}
      className={`fixed inset-0 z-[70] bg-[#0A1022] text-[#FFF6E8] overflow-hidden transition-opacity ${
        effectiveReducedMotion ? 'duration-200' : 'duration-700'
      } ${isExiting ? 'opacity-0 pointer-events-none' : 'opacity-100'}`}
    >
      {/* 1. Fullscreen 3D Architectural Sanctuary (with SVG Fallback) */}
      <WelcomeScene3D
        elapsedSec={elapsedSec}
        reducedMotion={effectiveReducedMotion}
        onWebGLStatusChange={setRenderMode}
      />

      {/* 2. Atmospheric Midnight Navy Vignette & Scene 6 Golden Light Bloom */}
      <div
        aria-hidden="true"
        className="absolute inset-0 pointer-events-none"
        style={{
          background:
            'radial-gradient(circle at 50% 45%, transparent 32%, rgba(8, 12, 26, 0.56) 78%, rgba(6, 9, 20, 0.88) 100%)',
        }}
      />
      <div
        aria-hidden="true"
        className="absolute inset-0 pointer-events-none transition-opacity duration-300"
        style={{
          opacity: transitionOverlayOpacity,
          background:
            'radial-gradient(circle at 50% 46%, rgba(255, 240, 202, 0.94) 0%, rgba(243, 205, 130, 0.55) 38%, rgba(16, 29, 50, 0.86) 100%)',
        }}
      />

      {/* 3. Foreground Cinematic HUD & Controls */}
      <div className="relative z-10 h-full flex flex-col justify-between px-4 sm:px-8 lg:px-12 py-4 sm:py-6">
        {/* Top Minimal Utility Bar */}
        <div className="flex flex-wrap items-center justify-between gap-3">
          {/* Left: Subtle Scene Indicator + Voice Language Selector (TE / EN / HI) */}
          <div className="flex flex-wrap items-center gap-2 sm:gap-3">
            <span className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-[#0C1328]/88 border border-[#D6A447]/30 text-[10px] sm:text-[11px] font-medium tracking-[0.18em] uppercase text-[#F3CD82]">
              <Sparkles className="w-3 h-3 shrink-0" aria-hidden="true" />
              <span>{t(sceneInfo.scene.labelKey)}</span>
            </span>

            <div
              role="group"
              aria-label={t('welcome.voiceLanguageLabel')}
              className="inline-flex items-center rounded-full bg-[#0C1328]/88 border border-[#D6A447]/30 p-0.5"
            >
              {(
                [
                  { code: 'te', label: 'తెలుగు' },
                  { code: 'en', label: 'EN' },
                  { code: 'hi', label: 'हिन्दी' },
                ] as const
              ).map((opt) => {
                const active = voiceLocale === opt.code;
                return (
                  <button
                    key={opt.code}
                    type="button"
                    onClick={() => void handleSelectVoiceLocale(opt.code)}
                    aria-pressed={active}
                    data-testid={`welcome-voice-${opt.code}`}
                    className={`px-2.5 py-1 rounded-full text-[11px] font-medium tracking-[0.06em] transition-colors cursor-pointer focus-visible:outline-2 focus-visible:outline-[#F3CD82] ${
                      active
                        ? 'bg-[#F3CD82] text-[#101426]'
                        : 'text-[#FFF6E8]/80 hover:text-[#F3CD82]'
                    }`}
                  >
                    {opt.label}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Right: Non-Obstructive Controls (Sound, Reduced Motion, Replay, Skip Intro) */}
          <div className="flex flex-wrap items-center gap-2">
            {soundStatus === 'playing' ? (
              <button
                type="button"
                onClick={handleMuteSound}
                data-testid="welcome-mute-btn"
                className="inline-flex items-center gap-1.5 min-h-[38px] px-3.5 py-1.5 rounded-full bg-[#0C1328]/88 border border-[#F3CD82]/45 text-[#F3CD82] hover:bg-[#17213F] text-xs font-medium tracking-[0.05em] transition-colors cursor-pointer focus-visible:outline-2 focus-visible:outline-[#F3CD82]"
              >
                <Volume2 className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
                <span>{t('welcome.muteSound')}</span>
              </button>
            ) : (
              <button
                type="button"
                onClick={() => void handleEnableSound()}
                data-testid="welcome-enable-sound-btn"
                className="inline-flex items-center gap-1.5 min-h-[38px] px-3.5 py-1.5 rounded-full bg-[#0C1328]/92 border border-[#F3CD82]/65 text-[#FFF6E8] hover:bg-[#F3CD82] hover:text-[#101426] text-xs font-medium tracking-[0.05em] transition-colors cursor-pointer focus-visible:outline-2 focus-visible:outline-[#F3CD82]"
              >
                {soundStatus === 'muted' ? (
                  <VolumeX className="w-3.5 h-3.5 shrink-0 text-[#F3CD82]" aria-hidden="true" />
                ) : (
                  <Volume2 className="w-3.5 h-3.5 shrink-0 text-[#F3CD82]" aria-hidden="true" />
                )}
                <span>
                  {soundStatus === 'muted' ? t('welcome.unmuteSound') : t('welcome.enableSound')}
                </span>
              </button>
            )}

            <button
              type="button"
              onClick={handleToggleReducedMotion}
              aria-pressed={effectiveReducedMotion}
              data-testid="welcome-reduced-motion-btn"
              className={`inline-flex items-center gap-1.5 min-h-[38px] px-3 py-1.5 rounded-full border text-xs font-medium tracking-[0.04em] transition-colors cursor-pointer focus-visible:outline-2 focus-visible:outline-[#F3CD82] ${
                effectiveReducedMotion
                  ? 'bg-[#F3CD82]/18 border-[#F3CD82]/60 text-[#F3CD82]'
                  : 'bg-[#0C1328]/85 border-[#D6A447]/30 text-[#FFF6E8]/80 hover:text-white hover:border-[#F3CD82]/55'
              }`}
            >
              {effectiveReducedMotion ? (
                <PauseCircle className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
              ) : (
                <PlayCircle className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
              )}
              <span className="hidden md:inline">{t('welcome.reducedMotion')}</span>
            </button>

            <button
              type="button"
              onClick={handleReplaySequence}
              data-testid="welcome-replay-btn"
              aria-label={t('welcome.replay')}
              className="inline-flex items-center gap-1.5 min-h-[38px] px-3 py-1.5 rounded-full bg-[#0C1328]/85 border border-[#D6A447]/30 text-[#FFF6E8]/85 hover:text-[#F3CD82] hover:border-[#F3CD82]/60 text-xs font-medium tracking-[0.04em] transition-colors cursor-pointer focus-visible:outline-2 focus-visible:outline-[#F3CD82]"
            >
              <RotateCcw className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
              <span className="hidden sm:inline">{t('welcome.replay')}</span>
            </button>

            <button
              type="button"
              onClick={finishIntro}
              data-testid="welcome-skip-btn"
              className="inline-flex items-center gap-1.5 min-h-[38px] px-4 py-1.5 rounded-full bg-[#F3CD82] text-[#101426] hover:bg-[#FFF6E8] text-xs font-semibold tracking-[0.08em] uppercase transition-colors cursor-pointer focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#F3CD82]"
            >
              <span>{t('welcome.skipIntro')}</span>
              <FastForward className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
            </button>
          </div>
        </div>

        {/* Center Stage: Scene 5 Monumental Grand Title & Lotus Emblem */}
        <div className="my-auto flex flex-col items-center text-center px-3 pointer-events-none">
          {showGrandTitle && (
            <div
              ref={titleBlockRef}
              data-testid="welcome-grand-title"
              className="max-w-4xl mx-auto flex flex-col items-center space-y-4 sm:space-y-5 px-8 sm:px-20 py-10 sm:py-14"
              style={{
                background:
                  'radial-gradient(closest-side, rgba(8, 13, 28, 0.80) 0%, rgba(8, 13, 28, 0.48) 58%, transparent 100%)',
              }}
            >
              {/* Animated Antique Gold Lotus Crest */}
              <svg
                width="74"
                height="50"
                viewBox="0 0 88 58"
                fill="none"
                aria-hidden="true"
                className="text-[#F3CD82] drop-shadow-[0_0_24px_rgba(243,205,130,0.45)]"
              >
                <path
                  d="M44 5C39 16 39 29 44 41C49 29 49 16 44 5Z"
                  fill="rgba(243,205,130,0.18)"
                  stroke="currentColor"
                  strokeWidth="1.6"
                />
                <path
                  d="M44 41C32 34 25 23 23 11C33 16 40 26 44 41Z"
                  fill="rgba(243,205,130,0.14)"
                  stroke="currentColor"
                  strokeWidth="1.45"
                />
                <path
                  d="M44 41C56 34 63 23 65 11C55 16 48 26 44 41Z"
                  fill="rgba(243,205,130,0.14)"
                  stroke="currentColor"
                  strokeWidth="1.45"
                />
                <path
                  d="M44 43C29 41 17 34 9 21C22 23 34 31 44 43Z"
                  stroke="currentColor"
                  strokeWidth="1.3"
                />
                <path
                  d="M44 43C59 41 71 34 79 21C66 23 54 31 44 43Z"
                  stroke="currentColor"
                  strokeWidth="1.3"
                />
                <path
                  d="M22 52C36 48 52 48 66 52"
                  stroke="currentColor"
                  strokeWidth="1.4"
                  strokeLinecap="round"
                />
              </svg>

              <div className="space-y-1.5 sm:space-y-2">
                <h1 className="font-editorial text-[clamp(2.15rem,5.4vw,4.5rem)] font-medium leading-[1.06] tracking-[0.14em] text-[#FFF6E8] drop-shadow-[0_4px_24px_rgba(6,10,22,0.92)]">
                  <span className="block">{t('welcome.titleLine1')}</span>
                  <span className="block text-[#F3CD82] mt-1">{t('welcome.titleLine2')}</span>
                  <span className="block text-[0.72em] tracking-[0.34em] text-[#FFF6E8]/92 mt-1.5 tabular-nums">
                    {t('welcome.titleLine3')}
                  </span>
                </h1>
              </div>

              <div className="w-28 h-px bg-gradient-to-r from-transparent via-[#F3CD82]/75 to-transparent" />

              <p className="font-display text-xs sm:text-sm md:text-base font-medium tracking-[0.28em] uppercase text-[#FFF6E8] drop-shadow-[0_2px_14px_rgba(6,10,22,0.95)]">
                {t('welcome.subtitle')}
              </p>

              {effectiveReducedMotion && (
                <button
                  type="button"
                  onClick={finishIntro}
                  className="pointer-events-auto mt-3 inline-flex items-center gap-2 min-h-[42px] px-6 py-2 rounded-full bg-[#F3CD82] text-[#101426] hover:bg-[#FFF6E8] text-xs font-semibold tracking-[0.1em] uppercase transition-colors cursor-pointer"
                >
                  <span>{t('welcome.enterWebsite')}</span>
                </button>
              )}
            </div>
          )}
        </div>

        {/* Bottom Floor: Live Accessible Subtitles, Unobtrusive Enable Sound CTA, and Progress Line */}
        <div className="space-y-3.5 max-w-3xl mx-auto w-full">
          {/* Blocked Autoplay Prompt (honest, unobtrusive, starts narration immediately on tap) */}
          {soundStatus === 'blocked' && (
            <div className="flex justify-center">
              <button
                type="button"
                onClick={() => void handleEnableSound()}
                data-testid="welcome-blocked-audio-banner"
                className="inline-flex items-center gap-2.5 min-h-[42px] px-5 py-2 rounded-full bg-[#101933]/94 border border-[#F3CD82]/75 text-[#FFF6E8] hover:bg-[#F3CD82] hover:text-[#101426] text-xs font-medium tracking-[0.06em] shadow-[0_10px_30px_rgba(0,0,0,0.45)] transition-colors cursor-pointer focus-visible:outline-2 focus-visible:outline-[#F3CD82]"
              >
                <Volume2 className="w-4 h-4 text-[#F3CD82] shrink-0" aria-hidden="true" />
                <span>{t('welcome.enableVoicePrompt')}</span>
              </button>
            </div>
          )}

          {/* Live Accessible Captions for Voice Welcome */}
          {(showVoiceCaptions || soundStatus === 'blocked') && (
            <div
              aria-live="polite"
              data-testid="welcome-captions"
              className="mx-auto max-w-2xl rounded-xl bg-[#0B1122]/88 border border-[#D6A447]/28 px-4 sm:px-6 py-3 text-center"
            >
              <p
                lang={voiceLocale}
                className="text-sm sm:text-base leading-relaxed text-[#FFF6E8]/95 font-normal"
              >
                {activeCaptionText}
              </p>
            </div>
          )}

          {/* Hairline Sequence Progress Indicator */}
          <div className="space-y-1.5">
            <div
              role="progressbar"
              aria-valuemin={0}
              aria-valuemax={100}
              aria-valuenow={progressPct}
              aria-label={t('welcome.progressLabel')}
              className="h-[2px] w-full bg-white/15 overflow-hidden rounded-full"
            >
              <div
                className="h-full bg-gradient-to-r from-[#B88635] via-[#F3CD82] to-[#FFF2CE] transition-[width] duration-150 ease-linear"
                style={{ width: `${progressPct}%` }}
              />
            </div>
            <div className="flex items-center justify-between text-[10px] tracking-[0.16em] uppercase text-[#FFF6E8]/55">
              <span>{t('welcome.templeTag')}</span>
              <span className="tabular-nums">{progressPct}%</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default WelcomeExperience;
