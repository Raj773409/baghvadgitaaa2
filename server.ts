import 'dotenv/config';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import express from 'express';
import { GoogleGenAI } from '@google/genai';
import { getChapterRecitation } from './src/content/chapterRecitations.ts';
import { STORY_SCENES } from './src/content/storyContent.ts';
import { WELCOME_NARRATION_SCRIPTS } from './src/utils/welcomeExperience.ts';
import {
  parseGeminiQuotaError,
  TTS_MODEL_PRIORITY,
  TtsModelCircuitBreaker,
  TtsQuotaExceededError,
} from './src/utils/ttsResilience.ts';
import { mountPlatformRoutes } from './server/routes.ts';
import { createRateLimiter } from './server/rateLimit.ts';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const PORT = Number(process.env.PORT) || 3000;
const isProduction = process.env.NODE_ENV === 'production';

const TTS_DISK_CACHE_DIR = path.resolve(__dirname, '.cache', 'tts-audio');
const PUBLIC_AUDIO_DIR = path.resolve(__dirname, 'public', 'audio');
const recitationCache = new Map<number, Buffer>();
const inFlightRecitations = new Map<number, Promise<Buffer>>();
const storyNarrationCache = new Map<string, Buffer>();
const inFlightStoryNarration = new Map<string, Promise<Buffer>>();
const welcomeNarrationCache = new Map<string, Buffer>();
const inFlightWelcomeNarration = new Map<string, Promise<Buffer>>();
const ttsCircuitBreaker = new TtsModelCircuitBreaker();

function ensureDiskCacheDir(): void {
  try {
    fs.mkdirSync(TTS_DISK_CACHE_DIR, { recursive: true });
  } catch {
    // Non-fatal if cache directory cannot be created
  }
}

function readDiskCachedWav(fileName: string): Buffer | null {
  try {
    const filePath = path.join(TTS_DISK_CACHE_DIR, fileName);
    if (fs.existsSync(filePath)) {
      const buf = fs.readFileSync(filePath);
      if (buf.length > 44) return buf;
    }
  } catch {
    // Ignore disk cache read errors
  }
  return null;
}

function writeDiskCachedWav(fileName: string, wavBuffer: Buffer): void {
  try {
    ensureDiskCacheDir();
    const filePath = path.join(TTS_DISK_CACHE_DIR, fileName);
    fs.writeFileSync(filePath, wavBuffer);
  } catch {
    // Ignore disk cache write errors
  }
}

function getConfiguredApiKey(): string | null {
  const key = process.env.GEMINI_API_KEY?.trim();
  if (!key || key === 'MY_GEMINI_API_KEY') {
    return null;
  }
  return key;
}

function createGeminiClient(apiKey: string): GoogleGenAI {
  return new GoogleGenAI({
    apiKey,
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build',
      },
    },
  });
}

function delayMs(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function generateTtsWavWithResilience(params: {
  text: string;
  style: string;
  voiceName?: string;
  apiKey: string;
  diskFileName: string;
  contextLabel: string;
}): Promise<Buffer> {
  const diskCached = readDiskCachedWav(params.diskFileName);
  if (diskCached) return diskCached;

  const availableModels = ttsCircuitBreaker.getAvailableModels(TTS_MODEL_PRIORITY);
  if (availableModels.length === 0) {
    throw new TtsQuotaExceededError(
      ttsCircuitBreaker.getMaxRemainingCooldownSeconds(TTS_MODEL_PRIORITY),
    );
  }

  const ai = createGeminiClient(params.apiKey);
  let lastNonQuotaError: unknown = null;
  let sawQuotaError = false;
  const resolvedVoice = params.voiceName || 'Charon';

  for (const model of availableModels) {
    for (let attempt = 0; attempt < 2; attempt++) {
      try {
        const response = await ai.models.generateContent({
          model,
          contents: [
            {
              role: 'user',
              parts: [
                {
                  text: params.text,
                  speechMetadata: {
                    style: params.style,
                  },
                },
              ],
            },
          ],
          config: {
            responseModalities: ['AUDIO'],
            speechConfig: {
              voiceConfig: {
                prebuiltVoiceConfig: {
                  voiceName: resolvedVoice,
                },
              },
            },
          },
        });

        const base64Audio =
          response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;

        if (!base64Audio) {
          throw new Error(`Empty audio payload returned by ${model}`);
        }

        const wavBuffer = Buffer.from(base64Audio, 'base64');
        writeDiskCachedWav(params.diskFileName, wavBuffer);
        return wavBuffer;
      } catch (err) {
        const quotaInfo = parseGeminiQuotaError(err);
        if (quotaInfo.isQuotaExceeded) {
          sawQuotaError = true;
          if (quotaInfo.isTransientRateLimit && attempt === 0) {
            await delayMs(Math.min(quotaInfo.retryAfterSeconds, 5) * 1000);
            continue;
          }
          const isFirstTrip = ttsCircuitBreaker.tripCooldown(
            model,
            quotaInfo.retryAfterSeconds,
          );
          if (isFirstTrip) {
            console.warn(
              `[${params.contextLabel}] ${model} quota reached; cooling down and falling back gracefully.`,
            );
          }
          break;
        }
        lastNonQuotaError = err;
        break;
      }
    }
  }

  if (sawQuotaError || ttsCircuitBreaker.getAvailableModels(TTS_MODEL_PRIORITY).length === 0) {
    throw new TtsQuotaExceededError(
      ttsCircuitBreaker.getMaxRemainingCooldownSeconds(TTS_MODEL_PRIORITY),
    );
  }

  throw lastNonQuotaError instanceof Error
    ? lastNonQuotaError
    : new Error('Unable to synthesize speech audio.');
}

async function synthesizeChapterRecitationWav(
  chapterNumber: number,
  apiKey: string,
): Promise<Buffer> {
  const cached = recitationCache.get(chapterNumber);
  if (cached) return cached;

  const existing = inFlightRecitations.get(chapterNumber);
  if (existing) return existing;

  const entry = getChapterRecitation(chapterNumber);
  const task = (async () => {
    const wavBuffer = await generateTtsWavWithResilience({
      text: entry.sanskritDevanagari,
      style:
        'Serene, authentic traditional Sanskrit shloka recitation with clear classical Vedic pronunciation, steady metrical cadence, and calm devotional reverence',
      apiKey,
      diskFileName: `chapter-${chapterNumber}.wav`,
      contextLabel: 'recitation-api',
    });
    recitationCache.set(chapterNumber, wavBuffer);
    return wavBuffer;
  })();

  inFlightRecitations.set(chapterNumber, task);
  try {
    return await task;
  } finally {
    inFlightRecitations.delete(chapterNumber);
  }
}

function resolveStoryVoiceConfig(
  locale: 'en' | 'hi' | 'te',
  speakerParam?: string,
): { voiceName: string; style: string; speakerTag: string } {
  const speaker = (speakerParam ?? 'narrator').trim().toLowerCase();

  // Telugu narration uses expressive female voice Aoede unless an explicit warrior speaker is requested
  if (locale === 'te' && (speaker === 'narrator' || speaker === 'scripture' || speaker === 'female')) {
    return {
      voiceName: 'Aoede',
      style:
        'Warm, dignified, eloquent female Telugu classical storyteller voice with natural devotional warmth, poetic clarity, and respectful epic gravitas',
      speakerTag: speaker === 'female' ? 'female' : 'default',
    };
  }

  if (speaker === 'krishna' || speaker === 'bhishma') {
    return {
      voiceName: 'Charon',
      style:
        'Deep, serene, compassionate classical mentor voice with calm authority and steady devotional cadence',
      speakerTag: speaker,
    };
  }

  if (speaker === 'arjuna' || speaker === 'karna' || speaker === 'duryodhana') {
    return {
      voiceName: 'Fenrir',
      style:
        'Resonant, expressive warrior dialogue voice with heroic emotion, dignity, and dramatic clarity',
      speakerTag: speaker,
    };
  }

  return {
    voiceName: locale === 'te' ? 'Aoede' : 'Charon',
    style:
      'Dignified museum documentary narrator voice with calm warmth, unhurried classical cadence, and respectful devotional gravitas',
    speakerTag: 'default',
  };
}

async function synthesizeStoryNarrationWav(
  sceneNumber: number,
  locale: 'en' | 'hi' | 'te',
  apiKey: string,
  speakerParam?: string,
): Promise<Buffer> {
  const voiceCfg = resolveStoryVoiceConfig(locale, speakerParam);
  const cacheKey = `${sceneNumber}:${locale}:${voiceCfg.speakerTag}`;
  const diskFileName =
    voiceCfg.speakerTag === 'default'
      ? `story-scene-${sceneNumber}-${locale}.wav`
      : `story-scene-${sceneNumber}-${locale}-${voiceCfg.speakerTag}.wav`;

  const cached = storyNarrationCache.get(cacheKey);
  if (cached) return cached;

  const existing = inFlightStoryNarration.get(cacheKey);
  if (existing) return existing;

  const scene = STORY_SCENES[sceneNumber - 1] ?? STORY_SCENES[0];
  const combinedScript = scene.cues.map((cue) => cue.text[locale]).join(' ');

  const task = (async () => {
    const wavBuffer = await generateTtsWavWithResilience({
      text: combinedScript,
      style: voiceCfg.style,
      voiceName: voiceCfg.voiceName,
      apiKey,
      diskFileName,
      contextLabel: 'story-api',
    });
    storyNarrationCache.set(cacheKey, wavBuffer);
    return wavBuffer;
  })();

  inFlightStoryNarration.set(cacheKey, task);
  try {
    return await task;
  } finally {
    inFlightStoryNarration.delete(cacheKey);
  }
}

function readWelcomeAssetWav(locale: 'en' | 'hi' | 'te'): Buffer | null {
  try {
    const publicPath = path.join(PUBLIC_AUDIO_DIR, `welcome-${locale}.wav`);
    if (fs.existsSync(publicPath)) {
      const buf = fs.readFileSync(publicPath);
      if (buf.length > 44) return buf;
    }
  } catch {
    // Ignore static audio read errors
  }
  return readDiskCachedWav(`welcome-${locale}.wav`);
}

function writePublicWelcomeWav(locale: 'en' | 'hi' | 'te', wavBuffer: Buffer): void {
  try {
    fs.mkdirSync(PUBLIC_AUDIO_DIR, { recursive: true });
    fs.writeFileSync(path.join(PUBLIC_AUDIO_DIR, `welcome-${locale}.wav`), wavBuffer);
  } catch {
    // Non-fatal if public/audio cannot be written
  }
}

function resolveWelcomeVoiceConfig(locale: 'en' | 'hi' | 'te'): {
  voiceName: string;
  style: string;
} {
  if (locale === 'te') {
    return {
      voiceName: 'Aoede',
      style:
        'Warm, mature, calm, dignified native Indian Telugu female host voice with serene cultural reverence, crystal-clear native Telugu pronunciation, graceful unhurried cadence, and welcoming emotional poise',
    };
  }
  if (locale === 'hi') {
    return {
      voiceName: 'Aoede',
      style:
        'Warm, mature, calm, dignified Indian female cultural host voice with natural Hindi pronunciation, serene devotional warmth, clear articulation, and welcoming poise',
    };
  }
  return {
    voiceName: 'Aoede',
    style:
      'Warm, mature, calm, dignified Indian female cultural ambassador voice with natural grace, crystal-clear articulation, restrained international gravitas, and welcoming warmth',
  };
}

async function synthesizeWelcomeNarrationWav(
  locale: 'en' | 'hi' | 'te',
  apiKey: string,
): Promise<Buffer> {
  const cached = welcomeNarrationCache.get(locale);
  if (cached) return cached;

  const existingAsset = readWelcomeAssetWav(locale);
  if (existingAsset) {
    welcomeNarrationCache.set(locale, existingAsset);
    return existingAsset;
  }

  const existing = inFlightWelcomeNarration.get(locale);
  if (existing) return existing;

  const script = WELCOME_NARRATION_SCRIPTS[locale];
  const voiceCfg = resolveWelcomeVoiceConfig(locale);

  const task = (async () => {
    const wavBuffer = await generateTtsWavWithResilience({
      text: script.fullText,
      style: voiceCfg.style,
      voiceName: voiceCfg.voiceName,
      apiKey,
      diskFileName: `welcome-${locale}.wav`,
      contextLabel: 'welcome-api',
    });
    writePublicWelcomeWav(locale, wavBuffer);
    welcomeNarrationCache.set(locale, wavBuffer);
    return wavBuffer;
  })();

  inFlightWelcomeNarration.set(locale, task);
  try {
    return await task;
  } finally {
    inFlightWelcomeNarration.delete(locale);
  }
}

async function startServer() {
  const app = express();
  // Correct ONLY when exactly one trusted reverse proxy sits in front of this process and
  // that proxy itself sets/overwrites X-Forwarded-For and X-Forwarded-Proto (stripping any
  // client-supplied values) — req.ip and req.secure, which the admin login rate limiter and
  // session cookie Secure/SameSite logic both depend on, are otherwise spoofable by the
  // client. Verify this matches the real deployment topology before relying on it in
  // production (see PROJECT_ETERNAL_BUGS_AND_RISKS.md, finding H3).
  app.set('trust proxy', 1);

  // Baseline security headers. Deliberately NOT setting X-Frame-Options / a frame-ancestors
  // CSP or a script-src CSP here: this app's admin session design explicitly supports being
  // embedded in a cross-origin iframe (see the Bearer-token fallback and SameSite=None cookie
  // logic in server/routes.ts), and the Vite dev client plus the voice assistant's microphone
  // access have not been verified against a stricter policy in a real browser in this pass.
  // Tightening this further should happen alongside real browser testing, not blind here.
  app.use((req, res, next) => {
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
    if (req.secure || req.headers['x-forwarded-proto'] === 'https') {
      res.setHeader('Strict-Transport-Security', 'max-age=15552000; includeSubDomains');
    }
    next();
  });

  app.use(
    express.json({
      limit: '15mb',
      verify: (req, _res, buf) => {
        (req as { rawBody?: string }).rawBody = buf.toString('utf8');
      },
    }),
  );

  mountPlatformRoutes(app, __dirname, {
    getConfiguredApiKey,
    readDiskCachedWav,
    generateTtsWavWithResilience,
  });

  // These narration endpoints call paid Gemini TTS models keyed by client-supplied
  // parameters (chapter/scene/locale/speaker); without a limit, a scripted client could
  // mint unlimited unique cache keys and exhaust the configured API budget.
  const narrationLimiter = createRateLimiter({
    windowMs: 10 * 60 * 1000,
    max: 60,
    keyPrefix: 'narration',
    message: 'Too many narration requests from this network. Please try again shortly.',
  });

  app.get('/api/chapters/:chapter/recitation', narrationLimiter, async (req, res) => {
    const rawChapter = Number(req.params.chapter);
    if (!Number.isInteger(rawChapter) || rawChapter < 1 || rawChapter > 18) {
      res.status(400).json({
        error: 'Chapter parameter must be an integer between 1 and 18.',
        code: 'INVALID_CHAPTER',
      });
      return;
    }

    const diskCached = readDiskCachedWav(`chapter-${rawChapter}.wav`);
    if (diskCached) {
      recitationCache.set(rawChapter, diskCached);
      res.setHeader('Content-Type', 'audio/wav');
      res.setHeader('Cache-Control', 'public, max-age=86400');
      res.setHeader('X-Chapter-Verse', getChapterRecitation(rawChapter).verseReference);
      res.status(200).send(diskCached);
      return;
    }

    const apiKey = getConfiguredApiKey();
    if (!apiKey) {
      res.status(503).json({
        error:
          'Sanskrit audio recitation requires GEMINI_API_KEY to be configured in Settings > Secrets.',
        code: 'TTS_UNAVAILABLE',
      });
      return;
    }

    try {
      const wavBuffer = await synthesizeChapterRecitationWav(rawChapter, apiKey);
      res.setHeader('Content-Type', 'audio/wav');
      res.setHeader('Cache-Control', 'public, max-age=86400');
      res.setHeader('X-Chapter-Verse', getChapterRecitation(rawChapter).verseReference);
      res.status(200).send(wavBuffer);
    } catch (err) {
      if (err instanceof TtsQuotaExceededError) {
        res.setHeader('Retry-After', String(err.retryAfterSeconds));
        res.status(429).json({
          error: err.message,
          code: 'TTS_QUOTA_EXCEEDED',
          retryAfterSeconds: err.retryAfterSeconds,
        });
        return;
      }
      const message =
        err instanceof Error ? err.message : 'Unable to generate Sanskrit recitation audio.';
      console.error('[recitation-api] TTS error for chapter', rawChapter, message);
      res.status(502).json({
        error: 'Unable to synthesize Sanskrit recitation audio right now. Please try again.',
        code: 'TTS_FAILED',
      });
    }
  });

  app.get('/api/story/:scene/narration', narrationLimiter, async (req, res) => {
    const rawScene = Number(req.params.scene);
    if (!Number.isInteger(rawScene) || rawScene < 1 || rawScene > STORY_SCENES.length) {
      res.status(400).json({
        error: `Scene parameter must be an integer between 1 and ${STORY_SCENES.length}.`,
        code: 'INVALID_SCENE',
      });
      return;
    }

    const rawLocale = String(req.query.locale ?? 'en').trim().toLowerCase();
    const locale: 'en' | 'hi' | 'te' =
      rawLocale === 'hi' || rawLocale === 'te' ? rawLocale : 'en';
    const rawSpeaker = typeof req.query.speaker === 'string' ? req.query.speaker : 'narrator';
    const voiceCfg = resolveStoryVoiceConfig(locale, rawSpeaker);
    const diskFileName =
      voiceCfg.speakerTag === 'default'
        ? `story-scene-${rawScene}-${locale}.wav`
        : `story-scene-${rawScene}-${locale}-${voiceCfg.speakerTag}.wav`;

    const diskCached = readDiskCachedWav(diskFileName);
    if (diskCached) {
      storyNarrationCache.set(`${rawScene}:${locale}:${voiceCfg.speakerTag}`, diskCached);
      res.setHeader('Content-Type', 'audio/wav');
      res.setHeader('Cache-Control', 'public, max-age=86400');
      res.status(200).send(diskCached);
      return;
    }

    const apiKey = getConfiguredApiKey();
    if (!apiKey) {
      res.status(503).json({
        error:
          'Spoken narration audio requires GEMINI_API_KEY; accessible text narration remains active.',
        code: 'NARRATION_UNAVAILABLE',
      });
      return;
    }

    try {
      const wavBuffer = await synthesizeStoryNarrationWav(rawScene, locale, apiKey, rawSpeaker);
      res.setHeader('Content-Type', 'audio/wav');
      res.setHeader('Cache-Control', 'public, max-age=86400');
      res.status(200).send(wavBuffer);
    } catch (err) {
      if (err instanceof TtsQuotaExceededError) {
        res.setHeader('Retry-After', String(err.retryAfterSeconds));
        res.status(429).json({
          error: err.message,
          code: 'TTS_QUOTA_EXCEEDED',
          retryAfterSeconds: err.retryAfterSeconds,
        });
        return;
      }
      const message =
        err instanceof Error ? err.message : 'Unable to synthesize story narration.';
      console.error('[story-api] Narration TTS error for scene', rawScene, message);
      res.status(502).json({
        error: 'Spoken narration audio is currently unavailable; accessible text mode active.',
        code: 'NARRATION_FAILED',
      });
    }
  });

  app.get('/api/welcome/narration', narrationLimiter, async (req, res) => {
    const rawLocale = String(req.query.locale ?? 'te').trim().toLowerCase();
    const locale: 'en' | 'hi' | 'te' =
      rawLocale === 'en' || rawLocale === 'hi' || rawLocale === 'te' ? rawLocale : 'te';

    const existing = readWelcomeAssetWav(locale);
    if (existing) {
      welcomeNarrationCache.set(locale, existing);
      res.setHeader('Content-Type', 'audio/wav');
      res.setHeader('Cache-Control', 'public, max-age=86400');
      res.status(200).send(existing);
      return;
    }

    const apiKey = getConfiguredApiKey();
    if (!apiKey) {
      res.status(503).json({
        error: 'Welcome voice audio requires GEMINI_API_KEY; accessible captions remain active.',
        code: 'WELCOME_TTS_UNAVAILABLE',
      });
      return;
    }

    try {
      const wavBuffer = await synthesizeWelcomeNarrationWav(locale, apiKey);
      res.setHeader('Content-Type', 'audio/wav');
      res.setHeader('Cache-Control', 'public, max-age=86400');
      res.status(200).send(wavBuffer);
    } catch (err) {
      if (err instanceof TtsQuotaExceededError) {
        res.setHeader('Retry-After', String(err.retryAfterSeconds));
        res.status(429).json({
          error: err.message,
          code: 'TTS_QUOTA_EXCEEDED',
          retryAfterSeconds: err.retryAfterSeconds,
        });
        return;
      }
      const message =
        err instanceof Error ? err.message : 'Unable to synthesize welcome narration.';
      console.error('[welcome-api] Narration TTS error for locale', locale, message);
      res.status(502).json({
        error: 'Welcome narration audio unavailable; accessible subtitles remain active.',
        code: 'WELCOME_TTS_FAILED',
      });
    }
  });

  if (!isProduction) {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distDir = path.resolve(__dirname, 'dist');
    app.use(express.static(distDir));
    app.get('*', (_req, res) => {
      const indexFile = path.join(distDir, 'index.html');
      if (fs.existsSync(indexFile)) {
        res.sendFile(indexFile);
      } else {
        res.status(404).send('Build output not found. Run npm run build first.');
      }
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server listening on http://localhost:${PORT}`);
  });
}

void startServer();
