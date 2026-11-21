import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  AlertCircle,
  Loader2,
  Pause,
  Play,
  Square,
  Volume2,
  VolumeX,
} from 'lucide-react';
import {
  clampPlaybackRate,
  clampVolume,
  getActiveSegmentIndex,
  splitNarrationSegments,
  type VoiceGender,
  type VoiceLanguageCode,
} from '../../utils/voiceAssistant';

interface IndianVoiceAssistantProps {
  trackId: string;
  title: string;
  textsByLang: Partial<Record<VoiceLanguageCode, string>>;
  defaultLanguage?: VoiceLanguageCode;
  tone?: 'dark' | 'light';
}

const LANG_OPTIONS: ReadonlyArray<{ id: VoiceLanguageCode; label: string }> = [
  { id: 'te', label: 'తెలుగు (TE)' },
  { id: 'hi', label: 'हिन्दी (HI)' },
  { id: 'en', label: 'English (EN)' },
  { id: 'sa', label: 'संस्कृतम् (SA)' },
];

export const IndianVoiceAssistant: React.FC<IndianVoiceAssistantProps> = ({
  trackId,
  title,
  textsByLang,
  defaultLanguage = 'te',
  tone = 'dark',
}) => {
  const initialLang: VoiceLanguageCode = textsByLang[defaultLanguage]
    ? defaultLanguage
    : (Object.keys(textsByLang)[0] as VoiceLanguageCode) || 'en';

  const [language, setLanguage] = useState<VoiceLanguageCode>(initialLang);
  const [gender, setGender] = useState<VoiceGender>('female');
  const [speed, setSpeed] = useState<number>(1);
  const [volume, setVolume] = useState<number>(0.9);
  const [muted, setMuted] = useState<boolean>(false);
  const [status, setStatus] = useState<'idle' | 'loading' | 'playing' | 'paused'>('idle');
  const [currentTime, setCurrentTime] = useState<number>(0);
  const [duration, setDuration] = useState<number>(0);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const audioRef = useRef<HTMLAudioElement | null>(null);
  const abortRef = useRef<AbortController | null>(null);
  const urlCacheRef = useRef<Map<string, string>>(new Map());

  const activeText = useMemo(() => {
    return (
      textsByLang[language] ??
      textsByLang.en ??
      textsByLang.te ??
      textsByLang.hi ??
      textsByLang.sa ??
      ''
    );
  }, [language, textsByLang]);

  const segments = useMemo(() => splitNarrationSegments(activeText), [activeText]);
  const activeSegmentIdx = useMemo(
    () => getActiveSegmentIndex(segments, currentTime, duration),
    [segments, currentTime, duration],
  );

  const stopPlayback = useCallback(() => {
    abortRef.current?.abort();
    abortRef.current = null;
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
      audioRef.current.onended = null;
      audioRef.current.ontimeupdate = null;
      audioRef.current.onerror = null;
      audioRef.current = null;
    }
    setStatus('idle');
    setCurrentTime(0);
    setDuration(0);
  }, []);

  useEffect(() => {
    stopPlayback();
    setErrorMsg(null);
  }, [trackId, language, gender, stopPlayback]);

  useEffect(() => {
    const cache = urlCacheRef.current;
    return () => {
      stopPlayback();
      for (const objectUrl of cache.values()) {
        URL.revokeObjectURL(objectUrl);
      }
      cache.clear();
    };
  }, [stopPlayback]);

  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.playbackRate = clampPlaybackRate(speed);
      audioRef.current.volume = muted ? 0 : clampVolume(volume);
    }
  }, [speed, volume, muted]);

  const attachAudioAndPlay = async (objectUrl: string) => {
    const audio = new Audio(objectUrl);
    audioRef.current = audio;
    audio.playbackRate = clampPlaybackRate(speed);
    audio.volume = muted ? 0 : clampVolume(volume);

    audio.onloadedmetadata = () => {
      setDuration(Number.isFinite(audio.duration) ? audio.duration : 0);
    };
    audio.ontimeupdate = () => {
      setCurrentTime(audio.currentTime);
      if (Number.isFinite(audio.duration)) {
        setDuration(audio.duration);
      }
    };
    audio.onended = () => {
      setStatus('idle');
      setCurrentTime(0);
    };
    audio.onerror = () => {
      setStatus('idle');
      setErrorMsg('Voice playback could not be decoded in this browser.');
    };

    await audio.play();
    setStatus('playing');
  };

  const handlePlayPause = async () => {
    if (status === 'playing' && audioRef.current) {
      audioRef.current.pause();
      setStatus('paused');
      return;
    }
    if (status === 'paused' && audioRef.current) {
      await audioRef.current.play();
      setStatus('playing');
      return;
    }

    if (!activeText.trim()) return;
    stopPlayback();
    setErrorMsg(null);
    setStatus('loading');

    const cacheKey = `${trackId}|${language}|${gender}`;
    try {
      const existingUrl = urlCacheRef.current.get(cacheKey);
      if (existingUrl) {
        await attachAudioAndPlay(existingUrl);
        return;
      }

      const controller = new AbortController();
      abortRef.current = controller;

      const res = await fetch('/api/voice/synthesize', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        signal: controller.signal,
        body: JSON.stringify({
          trackId,
          language,
          gender,
          text: activeText,
        }),
      });

      if (!res.ok) {
        const data = (await res.json().catch(() => ({}))) as { error?: string };
        throw new Error(data.error || 'Voice assistant synthesis is temporarily unavailable.');
      }

      const blob = await res.blob();
      if (controller.signal.aborted) return;
      const objectUrl = URL.createObjectURL(blob);
      urlCacheRef.current.set(cacheKey, objectUrl);
      await attachAudioAndPlay(objectUrl);
    } catch (err) {
      if (err instanceof DOMException && err.name === 'AbortError') return;
      setStatus('idle');
      setErrorMsg(err instanceof Error ? err.message : 'Unable to generate voice audio.');
    }
  };

  const handleScrub = (nextSec: number) => {
    if (!audioRef.current) return;
    audioRef.current.currentTime = nextSec;
    setCurrentTime(nextSec);
  };

  const formatSec = (s: number) => {
    if (!Number.isFinite(s) || s < 0) return '0:00';
    const mins = Math.floor(s / 60);
    const secs = Math.floor(s % 60);
    return `${mins}:${String(secs).padStart(2, '0')}`;
  };

  const containerCls =
    tone === 'dark'
      ? 'bg-[#17233A]/90 border border-[#D4A537]/35 text-[#FFFDF7]'
      : 'bg-[#FFFDF7] dark:bg-[#17233A] border border-[#D4A537]/45 text-[var(--color-ink)]';

  return (
    <div
      data-testid="indian-voice-assistant"
      className={`rounded-xl p-4 sm:p-5 space-y-4 ${containerCls}`}
    >
      {/* Header Row: Title + Gender Voice Selector */}
      <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-[#D4A537]/22">
        <div className="space-y-0.5 min-w-0">
          <p className="text-[10px] font-semibold tracking-[0.18em] uppercase text-[#D4A537]">
            Indian Sacred Voice Assistant · {title}
          </p>
          <p className="text-xs text-[#E9DCC5]/80 dark:text-[#C6BA9F] opacity-90">
            Natural neural Indian articulation ({gender === 'female' ? 'Female · Aoede' : 'Male · Charon'})
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Female vs Male Voice Selector */}
          <div
            role="group"
            aria-label="Select narrator voice gender"
            className="inline-flex rounded-full border border-[#D4A537]/40 p-0.5 bg-black/15"
          >
            {(['female', 'male'] as const).map((g) => (
              <button
                key={g}
                type="button"
                data-testid={`voice-gender-${g}`}
                aria-pressed={gender === g}
                onClick={() => setGender(g)}
                className={`px-3 py-1 rounded-full text-[11px] font-medium uppercase tracking-[0.06em] transition-colors cursor-pointer ${
                  gender === g
                    ? 'bg-[#D4A537] text-[#171717]'
                    : 'text-current/75 hover:text-[#F7D774]'
                }`}
              >
                {g === 'female' ? 'Female Voice' : 'Male Voice'}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Language Tabs */}
      <div className="flex flex-wrap items-center gap-2" role="tablist" aria-label="Voice narration language">
        {LANG_OPTIONS.filter((opt) => Boolean(textsByLang[opt.id])).map((opt) => {
          const active = language === opt.id;
          return (
            <button
              key={opt.id}
              type="button"
              role="tab"
              aria-selected={active}
              data-testid={`voice-lang-${opt.id}`}
              onClick={() => setLanguage(opt.id)}
              className={`px-3 py-1.5 rounded-md text-xs font-medium border transition-colors cursor-pointer ${
                active
                  ? 'border-[#D4A537] bg-[#D4A537]/20 text-[#F7D774]'
                  : 'border-[#D4A537]/25 opacity-75 hover:opacity-100'
              }`}
            >
              {opt.label}
            </button>
          );
        })}
      </div>

      {/* Synchronized Highlighting Captions */}
      <div
        className="rounded-lg bg-black/15 dark:bg-black/30 border border-[#D4A537]/20 p-3.5 space-y-1.5 max-h-40 overflow-y-auto"
        aria-live="polite"
      >
        {segments.map((line, i) => {
          const isCurrent = (status === 'playing' || status === 'paused') && i === activeSegmentIdx;
          return (
            <p
              key={`${i}-${line.slice(0, 12)}`}
              className={`text-sm leading-relaxed transition-colors px-2 py-0.5 rounded ${
                isCurrent
                  ? 'bg-[#D4A537]/25 text-[#F7D774] font-medium'
                  : 'opacity-80'
              }`}
            >
              {line}
            </p>
          );
        })}
      </div>

      {/* Player Controls Row */}
      <div className="flex flex-wrap items-center gap-3 pt-1">
        <button
          type="button"
          onClick={() => void handlePlayPause()}
          data-testid="voice-play-toggle"
          disabled={status === 'loading'}
          className="inline-flex items-center gap-2 min-h-[40px] px-5 py-2 rounded-full royal-gold-surface text-xs font-semibold uppercase tracking-[0.06em] cursor-pointer disabled:opacity-60"
        >
          {status === 'loading' ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" aria-hidden="true" />
              <span>Preparing Voice…</span>
            </>
          ) : status === 'playing' ? (
            <>
              <Pause className="w-4 h-4 fill-current" aria-hidden="true" />
              <span>Pause</span>
            </>
          ) : (
            <>
              <Play className="w-4 h-4 fill-current" aria-hidden="true" />
              <span>{status === 'paused' ? 'Resume' : 'Listen'}</span>
            </>
          )}
        </button>

        {status !== 'idle' && (
          <button
            type="button"
            onClick={stopPlayback}
            aria-label="Stop narration"
            className="inline-flex items-center justify-center w-9 h-9 rounded-full border border-[#D4A537]/40 hover:border-[#F7D774] cursor-pointer"
          >
            <Square className="w-3.5 h-3.5 fill-current" aria-hidden="true" />
          </button>
        )}

        {/* Progress Bar */}
        <div className="flex-1 min-w-[140px] flex items-center gap-2 text-[11px] tabular-nums">
          <span>{formatSec(currentTime)}</span>
          <input
            type="range"
            min={0}
            max={Math.max(1, duration)}
            step={0.1}
            value={currentTime}
            onChange={(e) => handleScrub(Number(e.target.value))}
            aria-label="Audio progress"
            className="w-full accent-[#D4A537] cursor-pointer"
          />
          <span>{formatSec(duration)}</span>
        </div>

        {/* Speed Selector */}
        <div className="flex items-center gap-1 text-[11px] tabular-nums">
          {[0.85, 1, 1.25].map((rate) => (
            <button
              key={rate}
              type="button"
              onClick={() => setSpeed(rate)}
              aria-pressed={speed === rate}
              className={`px-2 py-1 rounded border text-[11px] cursor-pointer ${
                speed === rate
                  ? 'border-[#D4A537] bg-[#D4A537]/25 text-[#F7D774]'
                  : 'border-[#D4A537]/25 opacity-75 hover:opacity-100'
              }`}
            >
              {rate}x
            </button>
          ))}
        </div>

        {/* Volume */}
        <div className="flex items-center gap-1.5">
          <button
            type="button"
            onClick={() => setMuted((m) => !m)}
            aria-label={muted ? 'Unmute voice' : 'Mute voice'}
            className="p-1.5 rounded hover:bg-[#D4A537]/20 cursor-pointer"
          >
            {muted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
          </button>
          <input
            type="range"
            min={0}
            max={1}
            step={0.05}
            value={muted ? 0 : volume}
            onChange={(e) => {
              setMuted(false);
              setVolume(Number(e.target.value));
            }}
            aria-label="Volume"
            className="w-16 accent-[#D4A537] cursor-pointer"
          />
        </div>
      </div>

      {language === 'sa' && (
        <p className="text-[11px] text-[#E9DCC5]/70">
          Note: Neural Sanskrit audio rendition is assistive study audio; formal Vedic recitation recordings await Secretariat confirmation.
        </p>
      )}

      {errorMsg && (
        <div
          role="alert"
          className="flex items-center gap-2 text-xs text-amber-300 bg-amber-950/40 border border-amber-500/35 rounded-lg px-3 py-2"
        >
          <AlertCircle className="w-4 h-4 shrink-0" aria-hidden="true" />
          <span>{errorMsg}</span>
        </div>
      )}
    </div>
  );
};
