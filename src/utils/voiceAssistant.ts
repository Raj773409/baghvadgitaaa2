export type VoiceGender = 'female' | 'male';
export type VoiceLanguageCode = 'te' | 'hi' | 'en' | 'sa';

export interface VoicePersonaSpec {
  id: VoiceGender;
  geminiVoiceName: string;
  labelKey: string;
  stylePromptByLang: Record<VoiceLanguageCode, string>;
}

export const VOICE_PERSONAS: Record<VoiceGender, VoicePersonaSpec> = {
  female: {
    id: 'female',
    geminiVoiceName: 'Aoede',
    labelKey: 'voice.femaleVoice',
    stylePromptByLang: {
      te: 'Speak in refined, warm, dignified classical Telugu female storytelling tone with clear South Indian Sanskrit diction, serene pacing, and natural emotional poise.',
      hi: 'Speak in a serene, respectful, dignified Indian female narrator voice in clear Shuddha Hindi with calm ceremonial pacing.',
      en: 'Speak in a poised, warm, refined Indian English female narrator voice suitable for an international museum and cultural gathering.',
      sa: 'Chant and recite in a reverent, crystal-clear traditional Indian Sanskrit female recitation style with balanced meter and respectful pauses.',
    },
  },
  male: {
    id: 'male',
    geminiVoiceName: 'Charon',
    labelKey: 'voice.maleVoice',
    stylePromptByLang: {
      te: 'Speak in a composed, resonant, scholarly Indian male Telugu narrator voice with calm authority and crystal-clear articulation.',
      hi: 'Speak in a deep, composed, scholarly Indian male Hindi voice with serene gravitas and respectful clarity.',
      en: 'Speak in a calm, cultured, resonant Indian English male narrator voice with institutional clarity.',
      sa: 'Recite in a dignified, deep, traditional Vedic Sanskrit male chanting style with measured pada breaks and clear visarga articulation.',
    },
  },
};

export function clampPlaybackRate(rate: number): number {
  if (!Number.isFinite(rate)) return 1;
  return Math.min(1.5, Math.max(0.75, Number(rate.toFixed(2))));
}

export function clampVolume(volume: number): number {
  if (!Number.isFinite(volume)) return 0.9;
  return Math.min(1, Math.max(0, Number(volume.toFixed(2))));
}

/**
 * Splits verse or narrative text into clean readable caption segments for
 * synchronized real-time verse / line highlighting during audio playback.
 */
export function splitNarrationSegments(text: string): string[] {
  const cleaned = text.trim();
  if (!cleaned) return [];
  const rawLines = cleaned
    .split(/\n+|(?<=[।॥.?!])\s+/)
    .map((line) => line.trim())
    .filter(Boolean);
  return rawLines.length > 0 ? rawLines : [cleaned];
}

/**
 * Computes active caption segment index based on audio currentTime and duration,
 * weighted by relative character length of each line so long lines stay highlighted proportionally.
 */
export function getActiveSegmentIndex(
  segments: ReadonlyArray<string>,
  currentTimeSec: number,
  durationSec: number,
): number {
  if (segments.length <= 1) return 0;
  if (!Number.isFinite(durationSec) || durationSec <= 0 || currentTimeSec <= 0) {
    return 0;
  }
  const progress = Math.min(1, Math.max(0, currentTimeSec / durationSec));
  const lengths = segments.map((s) => Math.max(4, s.length));
  const totalWeight = lengths.reduce((sum, len) => sum + len, 0);
  const targetWeight = progress * totalWeight;

  let accumulated = 0;
  for (let i = 0; i < segments.length; i++) {
    accumulated += lengths[i];
    if (targetWeight <= accumulated) {
      return i;
    }
  }
  return segments.length - 1;
}

export function normalizeVoiceLang(code: string | null | undefined): VoiceLanguageCode {
  if (code === 'te' || code === 'hi' || code === 'en' || code === 'sa') {
    return code;
  }
  return 'en';
}

export function buildVoiceCacheKey(params: {
  trackId: string;
  lang: VoiceLanguageCode;
  gender: VoiceGender;
}): string {
  const safeTrack = params.trackId.replace(/[^a-zA-Z0-9_-]/g, '_');
  return `${safeTrack}-${params.lang}-${params.gender}.wav`;
}
