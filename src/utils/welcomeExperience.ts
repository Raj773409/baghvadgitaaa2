import { toCoreLocale, type CoreLocale, type SupportedLocale } from './i18nHelpers';

export type WelcomeSceneId =
  | 'awakening'
  | 'temple-entrance'
  | 'sacred-light'
  | 'voice-welcome'
  | 'grand-title'
  | 'homepage-transition';

export interface WelcomeSceneDefinition {
  index: number;
  id: WelcomeSceneId;
  startSec: number;
  endSec: number;
  labelKey: string;
}

export const WELCOME_TOTAL_DURATION_SEC = 16.8;

export const WELCOME_SCENES: ReadonlyArray<WelcomeSceneDefinition> = [
  {
    index: 0,
    id: 'awakening',
    startSec: 0.0,
    endSec: 2.5,
    labelKey: 'welcome.sceneAwakening',
  },
  {
    index: 1,
    id: 'temple-entrance',
    startSec: 2.5,
    endSec: 5.8,
    labelKey: 'welcome.sceneEntrance',
  },
  {
    index: 2,
    id: 'sacred-light',
    startSec: 5.8,
    endSec: 8.6,
    labelKey: 'welcome.sceneSacredLight',
  },
  {
    index: 3,
    id: 'voice-welcome',
    startSec: 8.6,
    endSec: 13.4,
    labelKey: 'welcome.sceneVoiceWelcome',
  },
  {
    index: 4,
    id: 'grand-title',
    startSec: 13.4,
    endSec: 15.6,
    labelKey: 'welcome.sceneGrandTitle',
  },
  {
    index: 5,
    id: 'homepage-transition',
    startSec: 15.6,
    endSec: WELCOME_TOTAL_DURATION_SEC,
    labelKey: 'welcome.sceneTransition',
  },
];

export interface WelcomeNarrationLine {
  startRatio: number;
  endRatio: number;
  text: string;
}

export interface WelcomeNarrationScript {
  locale: CoreLocale;
  audioUrl: string;
  fallbackApiUrl: string;
  langTag: string;
  fullText: string;
  lines: ReadonlyArray<WelcomeNarrationLine>;
}

export const WELCOME_NARRATION_SCRIPTS: Record<CoreLocale, WelcomeNarrationScript> = {
  te: {
    locale: 'te',
    audioUrl: '/audio/welcome-te.wav',
    fallbackApiUrl: '/api/welcome/narration?locale=te',
    langTag: 'te-IN',
    fullText:
      'భగవద్గీత విశ్వ మహోత్సవం 2027కు హృదయపూర్వక స్వాగతం.\n\nభగవద్గీతలోని శాశ్వత జ్ఞానం, ధర్మం మరియు మానవీయ విలువలను ప్రపంచానికి చాటిచెప్పే ఈ మహోత్సవంలో మీకు స్వాగతం.',
    lines: [
      {
        startRatio: 0.0,
        endRatio: 0.42,
        text: 'భగవద్గీత విశ్వ మహోత్సవం 2027కు హృదయపూర్వక స్వాగతం.',
      },
      {
        startRatio: 0.42,
        endRatio: 1.0,
        text: 'భగవద్గీతలోని శాశ్వత జ్ఞానం, ధర్మం మరియు మానవీయ విలువలను ప్రపంచానికి చాటిచెప్పే ఈ మహోత్సవంలో మీకు స్వాగతం.',
      },
    ],
  },
  en: {
    locale: 'en',
    audioUrl: '/audio/welcome-en.wav',
    fallbackApiUrl: '/api/welcome/narration?locale=en',
    langTag: 'en-IN',
    fullText:
      'With great joy, we welcome you to Bhagavad Gita Vishwa Mahotsav 2027.\n\nA global celebration of timeless wisdom, dharma and the universal message of the Bhagavad Gita.',
    lines: [
      {
        startRatio: 0.0,
        endRatio: 0.45,
        text: 'With great joy, we welcome you to Bhagavad Gita Vishwa Mahotsav 2027.',
      },
      {
        startRatio: 0.45,
        endRatio: 1.0,
        text: 'A global celebration of timeless wisdom, dharma and the universal message of the Bhagavad Gita.',
      },
    ],
  },
  hi: {
    locale: 'hi',
    audioUrl: '/audio/welcome-hi.wav',
    fallbackApiUrl: '/api/welcome/narration?locale=hi',
    langTag: 'hi-IN',
    fullText:
      'भगवद्गीता विश्व महोत्सव २०२७ में आपका हार्दिक स्वागत है।\n\nश्रीमद्भगवद्गीता के शाश्वत ज्ञान, धर्म और मानवीय मूल्यों को संपूर्ण विश्व तक पहुँचाने वाले इस पावन उत्सव में आपका स्वागत है।',
    lines: [
      {
        startRatio: 0.0,
        endRatio: 0.42,
        text: 'भगवद्गीता विश्व महोत्सव २०२७ में आपका हार्दिक स्वागत है।',
      },
      {
        startRatio: 0.42,
        endRatio: 1.0,
        text: 'श्रीमद्भगवद्गीता के शाश्वत ज्ञान, धर्म और मानवीय मूल्यों को संपूर्ण विश्व तक पहुँचाने वाले इस पावन उत्सव में आपका स्वागत है।',
      },
    ],
  },
};

export const WELCOME_SESSION_SEEN_KEY = 'mahotsav_2027_welcome_session_seen_v1';
export const WELCOME_VISITED_STORAGE_KEY = 'mahotsav_2027_welcome_visited_v1';
export const WELCOME_PREFS_STORAGE_KEY = 'mahotsav_2027_welcome_prefs_v1';
export const REPLAY_WELCOME_EVENT = 'mahotsav:replay-welcome';

export interface WelcomePreferences {
  soundMuted: boolean;
  reducedMotionOverride: boolean | null;
}

export const DEFAULT_WELCOME_PREFERENCES: WelcomePreferences = {
  soundMuted: false,
  reducedMotionOverride: null,
};

export function deserializeWelcomePreferences(raw: string | null): WelcomePreferences {
  if (!raw) return { ...DEFAULT_WELCOME_PREFERENCES };
  try {
    const parsed = JSON.parse(raw) as Partial<WelcomePreferences>;
    return {
      soundMuted: Boolean(parsed.soundMuted),
      reducedMotionOverride:
        typeof parsed.reducedMotionOverride === 'boolean' ? parsed.reducedMotionOverride : null,
    };
  } catch {
    return { ...DEFAULT_WELCOME_PREFERENCES };
  }
}

export function serializeWelcomePreferences(prefs: WelcomePreferences): string {
  return JSON.stringify({
    soundMuted: Boolean(prefs.soundMuted),
    reducedMotionOverride:
      typeof prefs.reducedMotionOverride === 'boolean' ? prefs.reducedMotionOverride : null,
  });
}

export interface WelcomeGateInput {
  sessionSeen: boolean;
  localVisited: boolean;
  search: string;
}

/**
 * Intelligent visit frequency rule:
 * - `?skipIntro=1` always bypasses welcome intro.
 * - `?welcome=1` or `?replayWelcome=1` always opens welcome intro.
 * - First-time visitor (not seen in session and not previously visited) opens welcome intro.
 * - Returning visitors or subsequent intra-session navigation land directly on homepage.
 */
export function shouldShowWelcomeOnLoad(input: WelcomeGateInput): boolean {
  const params = new URLSearchParams(input.search.startsWith('?') ? input.search : `?${input.search}`);
  const skipParam = params.get('skipIntro');
  const autostartParam = params.get('autostart');
  if (
    skipParam === '1' ||
    skipParam === 'true' ||
    autostartParam === '1' ||
    autostartParam === 'true'
  ) {
    return false;
  }

  const forceParam = params.get('welcome') ?? params.get('replayWelcome');
  if (forceParam === '0' || forceParam === 'false') {
    return false;
  }
  if (forceParam === '1' || forceParam === 'true') {
    return true;
  }

  if (input.sessionSeen || input.localVisited) {
    return false;
  }

  return true;
}

export function resolveWelcomeNarrationLocale(locale: SupportedLocale): CoreLocale {
  return toCoreLocale(locale);
}

export function getWelcomeNarrationScript(locale: SupportedLocale | CoreLocale): WelcomeNarrationScript {
  const core = locale === 'te' || locale === 'hi' || locale === 'en' ? locale : toCoreLocale(locale);
  return WELCOME_NARRATION_SCRIPTS[core] ?? WELCOME_NARRATION_SCRIPTS.te;
}

export function getWelcomeSceneAtTime(elapsedSec: number): {
  scene: WelcomeSceneDefinition;
  normalizedProgress: number;
  sceneLocalProgress: number;
} {
  const clamped = Math.max(0, Math.min(WELCOME_TOTAL_DURATION_SEC, elapsedSec));
  const normalizedProgress = clamped / WELCOME_TOTAL_DURATION_SEC;

  for (let i = WELCOME_SCENES.length - 1; i >= 0; i -= 1) {
    const scene = WELCOME_SCENES[i];
    if (clamped >= scene.startSec) {
      const span = Math.max(0.01, scene.endSec - scene.startSec);
      const sceneLocalProgress = Math.max(0, Math.min(1, (clamped - scene.startSec) / span));
      return {
        scene,
        normalizedProgress,
        sceneLocalProgress,
      };
    }
  }

  return {
    scene: WELCOME_SCENES[0],
    normalizedProgress: 0,
    sceneLocalProgress: 0,
  };
}

export function getActiveNarrationCaption(
  script: WelcomeNarrationScript,
  audioProgressRatio: number,
): string {
  const ratio = Math.max(0, Math.min(1, audioProgressRatio));
  const matched = script.lines.find(
    (line, idx) =>
      ratio >= line.startRatio &&
      (ratio < line.endRatio || idx === script.lines.length - 1),
  );
  return matched?.text ?? script.lines[0]?.text ?? '';
}

export function dispatchReplayWelcome(): void {
  if (typeof window === 'undefined') return;
  window.dispatchEvent(new CustomEvent(REPLAY_WELCOME_EVENT));
}
