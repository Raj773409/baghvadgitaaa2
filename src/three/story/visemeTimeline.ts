/**
 * Pure TypeScript Viseme & Dialogue Timeline Builder
 *
 * Implements the CMS-compatible DialogueAudio schema and maps spoken text across
 * English, Hindi (Devanagari), and Telugu into deterministic phoneme/viseme keyframes
 * synchronized to Web Audio playback or visual cue time.
 */

export type DialogueSpeakerId =
  | 'krishna'
  | 'arjuna'
  | 'narrator'
  | 'karna'
  | 'bhishma'
  | 'duryodhana'
  | 'scripture';

export type VisemeShape =
  | 'viseme_sil'
  | 'viseme_aa'
  | 'viseme_E'
  | 'viseme_oh'
  | 'viseme_PP'
  | 'viseme_FF'
  | 'viseme_TH';

export type FacialEmotionState =
  | 'serene'
  | 'compassionate'
  | 'sorrow'
  | 'awe'
  | 'resolve'
  | 'battle_focus';

export type DialogueSourceType =
  | 'bhagavad-gita-scripture'
  | 'mahabharata-narrative'
  | 'editorial-adaptation';

export interface VisemeKeyframe {
  timeSec: number;
  durationSec: number;
  viseme: VisemeShape;
  weight: number;
  jawOpen: number;
}

export interface PhonemeKeyframe {
  timeSec: number;
  phoneme: string;
  viseme: VisemeShape;
}

export interface EmotionKeyframe {
  timeSec: number;
  emotion: FacialEmotionState;
  intensity: number;
}

export interface DialogueAudioTrack {
  id: string;
  sceneId: string;
  speaker: DialogueSpeakerId;
  language: 'en' | 'hi' | 'te';
  transcript: string;
  sourceRef: string;
  sourceType: DialogueSourceType;
  phonemeTimeline: PhonemeKeyframe[];
  visemeTimeline: VisemeKeyframe[];
  emotionTrack: EmotionKeyframe[];
  animationTrack: string;
  durationSec: number;
}

export interface VisemeWeightsSnapshot {
  speaker: DialogueSpeakerId;
  activeViseme: VisemeShape;
  jawOpen: number;
  weights: Record<VisemeShape, number>;
  emotion: FacialEmotionState;
  emotionIntensity: number;
}

function classifyCharToPhonemeViseme(ch: string): {
  phoneme: string;
  viseme: VisemeShape;
  jawOpen: number;
} {
  const code = ch.codePointAt(0) ?? 0;

  // Labial consonants (Latin p/b/m + Devanagari प-म + Telugu ప-మ)
  if (
    /[pbmPBM]/.test(ch) ||
    (code >= 0x092a && code <= 0x092e) ||
    (code >= 0x0c2a && code <= 0x0c2e)
  ) {
    return { phoneme: 'PP', viseme: 'viseme_PP', jawOpen: 0.02 };
  }

  // Labiodental / Fricative (Latin f/v + Devanagari फ/व + Telugu ఫ/వ)
  if (
    /[fvFV]/.test(ch) ||
    code === 0x092b ||
    code === 0x0935 ||
    code === 0x0c2b ||
    code === 0x0c35
  ) {
    return { phoneme: 'FF', viseme: 'viseme_FF', jawOpen: 0.16 };
  }

  // Dental / Alveolar stops & sibilants (Latin t/d/n/l/s/z + Devanagari त-न/स + Telugu త-న/స)
  if (
    /[tdnlszTDNLSZ]/.test(ch) ||
    (code >= 0x0924 && code <= 0x0928) ||
    code === 0x0938 ||
    (code >= 0x0c24 && code <= 0x0c28) ||
    code === 0x0c38
  ) {
    return { phoneme: 'TH', viseme: 'viseme_TH', jawOpen: 0.28 };
  }

  // Rounded vowels (Latin o/u/w + Devanagari उ/ऊ/ओ/औ + Telugu ఉ/ఊ/ఒ/ఓ/ఔ)
  if (
    /[ouwOUW]/.test(ch) ||
    code === 0x0909 ||
    code === 0x090a ||
    code === 0x0913 ||
    code === 0x0914 ||
    code === 0x0941 ||
    code === 0x0942 ||
    code === 0x094b ||
    code === 0x0c09 ||
    code === 0x0c0a ||
    code === 0x0c12 ||
    code === 0x0c13 ||
    code === 0x0c41 ||
    code === 0x0c42 ||
    code === 0x0c4a ||
    code === 0x0c4b
  ) {
    return { phoneme: 'oh', viseme: 'viseme_oh', jawOpen: 0.42 };
  }

  // Wide front vowels (Latin e/i/y + Devanagari इ/ई/ए/ऐ + Telugu ఇ/ఈ/ఎ/ఏ)
  if (
    /[eiyEIY]/.test(ch) ||
    code === 0x0907 ||
    code === 0x0908 ||
    code === 0x090f ||
    code === 0x0910 ||
    code === 0x093f ||
    code === 0x0940 ||
    code === 0x0947 ||
    code === 0x0c07 ||
    code === 0x0c08 ||
    code === 0x0c0e ||
    code === 0x0c0f ||
    code === 0x0c3f ||
    code === 0x0c40 ||
    code === 0x0c46 ||
    code === 0x0c47
  ) {
    return { phoneme: 'E', viseme: 'viseme_E', jawOpen: 0.36 };
  }

  // Open low vowel (Latin a + Devanagari अ/आ/ा + Telugu అ/ఆ/ా)
  if (
    /[aA]/.test(ch) ||
    code === 0x0905 ||
    code === 0x0906 ||
    code === 0x093e ||
    code === 0x0c05 ||
    code === 0x0c06 ||
    code === 0x0c3e
  ) {
    return { phoneme: 'aa', viseme: 'viseme_aa', jawOpen: 0.68 };
  }

  // Default mid-syllable articulation
  return { phoneme: 'aa', viseme: 'viseme_aa', jawOpen: 0.46 };
}

export function buildVisemeTimelineFromTranscript(params: {
  id: string;
  sceneId: string;
  speaker: DialogueSpeakerId;
  language: 'en' | 'hi' | 'te';
  transcript: string;
  sourceRef: string;
  sourceType: DialogueSourceType;
  emotion: FacialEmotionState;
  animationTrack: string;
  durationSec?: number;
}): DialogueAudioTrack {
  const clean = params.transcript.trim();
  const durationSec = Math.max(
    1.8,
    params.durationSec ?? Math.max(2.4, clean.length * 0.068),
  );

  const tokens = clean.split(/(\s+)/).filter((t) => t.length > 0);
  const totalNonSpace = Math.max(1, clean.replace(/\s+/g, '').length);
  const phonemeTimeline: PhonemeKeyframe[] = [];
  const visemeTimeline: VisemeKeyframe[] = [];

  let cursor = 0;
  for (const tok of tokens) {
    if (/^\s+$/.test(tok)) {
      const pauseDur = Math.min(0.14, durationSec * 0.018);
      visemeTimeline.push({
        timeSec: cursor,
        durationSec: pauseDur,
        viseme: 'viseme_sil',
        weight: 0.9,
        jawOpen: 0,
      });
      cursor += pauseDur;
      continue;
    }

    // Group clusters cleanly into 1–3 syllables per word so lip motion looks organic
    const wordShare = (tok.length / totalNonSpace) * (durationSec * 0.88);
    const sampleStep = Math.max(1, Math.ceil(tok.length / 3));
    const subCount = Math.max(1, Math.ceil(tok.length / sampleStep));
    const subDur = Math.max(0.06, wordShare / subCount);

    for (let i = 0; i < tok.length; i += sampleStep) {
      const ch = tok[i];
      if (/[“”".,;:!?।॥—-]/.test(ch)) {
        visemeTimeline.push({
          timeSec: cursor,
          durationSec: Math.min(0.18, subDur),
          viseme: 'viseme_sil',
          weight: 1,
          jawOpen: 0,
        });
        cursor += Math.min(0.18, subDur);
        continue;
      }

      const mapped = classifyCharToPhonemeViseme(ch);
      phonemeTimeline.push({
        timeSec: cursor,
        phoneme: mapped.phoneme,
        viseme: mapped.viseme,
      });
      visemeTimeline.push({
        timeSec: cursor,
        durationSec: subDur,
        viseme: mapped.viseme,
        weight: 0.85,
        jawOpen: mapped.jawOpen,
      });
      cursor += subDur;
    }
  }

  // Always close mouth gently at cue tail
  visemeTimeline.push({
    timeSec: cursor,
    durationSec: Math.max(0.15, durationSec - cursor),
    viseme: 'viseme_sil',
    weight: 1,
    jawOpen: 0,
  });

  return {
    id: params.id,
    sceneId: params.sceneId,
    speaker: params.speaker,
    language: params.language,
    transcript: clean,
    sourceRef: params.sourceRef,
    sourceType: params.sourceType,
    phonemeTimeline,
    visemeTimeline,
    emotionTrack: [
      {
        timeSec: 0,
        emotion: params.emotion,
        intensity: 0.85,
      },
    ],
    animationTrack: params.animationTrack,
    durationSec: Math.max(durationSec, cursor + 0.1),
  };
}

export function sampleDialogueVisemeAtTime(
  track: DialogueAudioTrack,
  timeSec: number,
): VisemeWeightsSnapshot {
  const baseWeights: Record<VisemeShape, number> = {
    viseme_sil: 0,
    viseme_aa: 0,
    viseme_E: 0,
    viseme_oh: 0,
    viseme_PP: 0,
    viseme_FF: 0,
    viseme_TH: 0,
  };

  // Narrator / non-character speakers never open hero mouths
  if (track.speaker === 'narrator' || track.speaker === 'scripture') {
    baseWeights.viseme_sil = 1;
    return {
      speaker: track.speaker,
      activeViseme: 'viseme_sil',
      jawOpen: 0,
      weights: baseWeights,
      emotion: track.emotionTrack[0]?.emotion ?? 'serene',
      emotionIntensity: track.emotionTrack[0]?.intensity ?? 0.5,
    };
  }

  const t = ((timeSec % track.durationSec) + track.durationSec) % track.durationSec;
  let activeKf: VisemeKeyframe | undefined;
  for (const kf of track.visemeTimeline) {
    if (t >= kf.timeSec && t <= kf.timeSec + kf.durationSec) {
      activeKf = kf;
      break;
    }
  }

  if (!activeKf) {
    baseWeights.viseme_sil = 1;
    return {
      speaker: track.speaker,
      activeViseme: 'viseme_sil',
      jawOpen: 0,
      weights: baseWeights,
      emotion: track.emotionTrack[0]?.emotion ?? 'serene',
      emotionIntensity: track.emotionTrack[0]?.intensity ?? 0.75,
    };
  }

  // Smooth syllable bell curve envelope across phoneme duration
  const u = Math.max(
    0,
    Math.min(1, (t - activeKf.timeSec) / Math.max(0.01, activeKf.durationSec)),
  );
  const envelope = activeKf.viseme === 'viseme_sil' ? 1 : Math.sin(u * Math.PI);
  const weighted = activeKf.weight * (0.25 + 0.75 * envelope);
  baseWeights[activeKf.viseme] = weighted;
  baseWeights.viseme_sil = Math.max(0, 1 - weighted);

  return {
    speaker: track.speaker,
    activeViseme: activeKf.viseme,
    jawOpen: activeKf.jawOpen * envelope,
    weights: baseWeights,
    emotion: track.emotionTrack[0]?.emotion ?? 'serene',
    emotionIntensity: track.emotionTrack[0]?.intensity ?? 0.75,
  };
}
