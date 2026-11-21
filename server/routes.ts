import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import type { Express, NextFunction, Request, Response } from 'express';
import express from 'express';
import { GoogleGenAI, Type } from '@google/genai';
import Razorpay from 'razorpay';
import { TtsQuotaExceededError } from '../src/utils/ttsResilience.ts';
import type { CoreLocale } from '../src/utils/i18nHelpers.ts';
import type {
  RegistrationFormValues,
  RegistrationStepNumber,
  RegistrationTypeId,
} from '../src/utils/registrationValidation.ts';
import {
  buildVoiceCacheKey,
  normalizeVoiceLang,
  VOICE_PERSONAS,
  type VoiceGender,
} from '../src/utils/voiceAssistant.ts';
import {
  parseRegistrationUtterance,
  sanitizeSensitiveUtterance,
} from '../src/utils/voiceRegistrationParser.ts';
import {
  ALL_ADMIN_ROLES,
  getPermittedModules,
  hashPassword,
  hasModulePermission,
  signSessionToken,
  verifyPassword,
  verifyRazorpayPaymentSignature,
  verifySessionToken,
  verifyWebhookSignature,
  type AdminModuleId,
  type AdminRole,
} from './rbac.ts';
import {
  PlatformStore,
  ensureCanonicalSeedData,
  serializeRecordsToCsv,
  serializeRecordsToExcelXml,
  type CmsManagedItem,
  type ManagedMediaRecord,
  type ParticipantRecord,
  type PaymentRecord,
  type VolunteerRecord,
} from './store.ts';
import { inspectAllStoryGlbs } from './glbInspector.ts';
import { createRateLimiter } from './rateLimit.ts';
import {
  buildAdminNotifications,
  computeMediaUsageLocations,
  filterRecordsByDateRange,
  replaceMediaReferences,
  type CarouselConfigRecord,
  type CarouselSlideConfig,
  type MediaAssetRecord,
  type PageSnapshotPayload,
  type PublishStatus,
  type ScriptureVerseRecord,
  type StructuredCollectionItem,
  type StructuredCollectionKind,
} from '../src/utils/cmsSync.ts';

export interface TtsServerHelpers {
  getConfiguredApiKey: () => string | null;
  readDiskCachedWav: (fileName: string) => Buffer | null;
  generateTtsWavWithResilience: (params: {
    text: string;
    style: string;
    voiceName?: string;
    apiKey: string;
    diskFileName: string;
    contextLabel: string;
  }) => Promise<Buffer>;
}

interface AuthenticatedRequest extends Request {
  adminUser?: {
    id: string;
    name: string;
    email: string;
    role: AdminRole;
    mustChangePassword: boolean;
  };
  rawBody?: string;
}

// Endpoints an admin whose account is locked pending a mandatory password change may still
// reach, so they can learn about the lock, change their password, or sign out.
const PASSWORD_CHANGE_EXEMPT_PATHS = new Set([
  '/api/admin/session',
  '/api/admin/logout',
  '/api/admin/change-password',
]);

const SESSION_COOKIE_NAME = 'eternal_admin_session';

function parseCookies(cookieHeader: string | undefined): Record<string, string> {
  const out: Record<string, string> = {};
  if (!cookieHeader) return out;
  for (const part of cookieHeader.split(';')) {
    const eq = part.indexOf('=');
    if (eq <= 0) continue;
    const key = part.slice(0, eq).trim();
    const val = part.slice(eq + 1).trim();
    try {
      out[key] = decodeURIComponent(val);
    } catch {
      out[key] = val;
    }
  }
  return out;
}

function isHttpsRequest(req: Request): boolean {
  if (req.secure) return true;
  const forwardedProto = String(req.headers['x-forwarded-proto'] ?? '')
    .split(',')[0]
    .trim()
    .toLowerCase();
  return forwardedProto === 'https';
}

function buildSessionCookie(value: string, req: Request, maxAgeSeconds: number): string {
  const https = isHttpsRequest(req);
  const sameSitePart = https ? 'SameSite=None; Secure; Partitioned' : 'SameSite=Lax';
  return `${SESSION_COOKIE_NAME}=${encodeURIComponent(value)}; HttpOnly; Path=/; ${sameSitePart}; Max-Age=${maxAgeSeconds}`;
}

function extractSessionTokens(req: Request): string[] {
  const tokens: string[] = [];
  const authHeader = req.headers.authorization;
  if (typeof authHeader === 'string') {
    const match = authHeader.match(/^Bearer\s+(.+)$/i);
    if (match?.[1]) {
      const trimmed = match[1].trim();
      if (trimmed) tokens.push(trimmed);
    }
  }
  const cookies = parseCookies(req.headers.cookie);
  if (cookies[SESSION_COOKIE_NAME] && !tokens.includes(cookies[SESSION_COOKIE_NAME])) {
    tokens.push(cookies[SESSION_COOKIE_NAME]);
  }
  return tokens;
}

function hashTokenDigest(token: string): string {
  return crypto.createHash('sha256').update(token).digest('hex');
}

function getOrCreateSessionSecret(dataDir: string): string {
  const envSecret = process.env.ADMIN_SESSION_SECRET?.trim();
  if (envSecret && envSecret.length >= 16) return envSecret;
  const secretPath = path.join(dataDir, '.session-secret');
  try {
    if (fs.existsSync(secretPath)) {
      const existing = fs.readFileSync(secretPath, 'utf8').trim();
      if (existing.length >= 32) return existing;
    }
  } catch {
    // Regenerate below
  }
  const generated = crypto.randomBytes(32).toString('hex');
  try {
    fs.writeFileSync(secretPath, generated, { mode: 0o600 });
  } catch {
    // Fallback to in-memory secret
  }
  return generated;
}

function getRazorpayKeys(): { keyId: string; keySecret: string } | null {
  const keyId = process.env.RAZORPAY_KEY_ID?.trim();
  const keySecret = process.env.RAZORPAY_KEY_SECRET?.trim();
  if (!keyId || !keySecret) return null;
  return { keyId, keySecret };
}

function getRazorpayClient(): Razorpay | null {
  const keys = getRazorpayKeys();
  if (!keys) return null;
  return new Razorpay({ key_id: keys.keyId, key_secret: keys.keySecret });
}

function getPaymentGatewayStatus() {
  const razorpay = Boolean(getRazorpayKeys());
  const razorpayWebhook = Boolean(process.env.RAZORPAY_WEBHOOK_SECRET?.trim());
  const stripe = Boolean(process.env.STRIPE_WEBHOOK_SECRET?.trim());
  const customHmac = Boolean(process.env.PAYMENT_WEBHOOK_SECRET?.trim());
  return {
    configured: razorpay || stripe || customHmac,
    providers: {
      razorpay,
      razorpayWebhook,
      stripe,
      customHmac,
    },
  };
}

export function mountPlatformRoutes(
  app: Express,
  rootDir: string,
  tts: TtsServerHelpers,
): void {
  const dataDir = path.resolve(rootDir, '.data');
  const uploadsDir = path.join(dataDir, 'uploads');
  fs.mkdirSync(uploadsDir, { recursive: true });

  const store = new PlatformStore(dataDir);
  const sessionSecret = getOrCreateSessionSecret(dataDir);

  app.use('/uploads', express.static(uploadsDir, { maxAge: '7d' }));

  // Public, unauthenticated, cost-bearing, or data-mutating endpoints had no throttle at all
  // before this fix, leaving the Gemini TTS quota open to a cost-based DoS and the public
  // registration/volunteer forms open to unlimited fake-record flooding.
  const voiceSynthesizeLimiter = createRateLimiter({
    windowMs: 10 * 60 * 1000,
    max: 30,
    keyPrefix: 'voice-synthesize',
  });
  const voiceParseLimiter = createRateLimiter({
    windowMs: 10 * 60 * 1000,
    max: 30,
    keyPrefix: 'voice-parse',
  });
  const publicRegistrationLimiter = createRateLimiter({
    windowMs: 60 * 60 * 1000,
    max: 20,
    keyPrefix: 'public-registration',
    message: 'Too many registration submissions from this network. Please try again later.',
  });
  const publicVolunteerLimiter = createRateLimiter({
    windowMs: 60 * 60 * 1000,
    max: 20,
    keyPrefix: 'public-volunteer',
    message: 'Too many volunteer submissions from this network. Please try again later.',
  });
  // Simple in-memory login rate limiter (max 12 failures / 10 minutes per IP)
  const loginAttempts = new Map<string, { count: number; resetAt: number }>();
  // Server-side revocation store for invalidated session tokens on logout
  const revokedTokens = new Map<string, number>();

  // ---------------------------------------------------------------------------
  // 1. INDIAN VOICE ASSISTANT NEURAL TTS ROUTE
  // ---------------------------------------------------------------------------
  app.post('/api/voice/synthesize', voiceSynthesizeLimiter, async (req, res) => {
    const body = (req.body ?? {}) as {
      trackId?: unknown;
      language?: unknown;
      gender?: unknown;
      text?: unknown;
    };

    const trackId =
      typeof body.trackId === 'string' && body.trackId.trim()
        ? body.trackId.trim().slice(0, 80)
        : 'voice-track';
    const lang = normalizeVoiceLang(typeof body.language === 'string' ? body.language : 'en');
    const gender: VoiceGender = body.gender === 'male' ? 'male' : 'female';
    const text = typeof body.text === 'string' ? body.text.trim() : '';

    if (!text || text.length > 3500) {
      res.status(400).json({
        error: 'Voice narration text must be between 1 and 3500 characters.',
        code: 'INVALID_VOICE_TEXT',
      });
      return;
    }

    const diskFileName = buildVoiceCacheKey({ trackId, lang, gender });
    const cached = tts.readDiskCachedWav(diskFileName);
    if (cached) {
      res.setHeader('Content-Type', 'audio/wav');
      res.setHeader('Cache-Control', 'public, max-age=86400');
      res.status(200).send(cached);
      return;
    }

    const apiKey = tts.getConfiguredApiKey();
    if (!apiKey) {
      res.status(503).json({
        error: 'Voice audio synthesis requires GEMINI_API_KEY configured on the server.',
        code: 'TTS_UNAVAILABLE',
      });
      return;
    }

    const persona = VOICE_PERSONAS[gender];
    try {
      const wavBuffer = await tts.generateTtsWavWithResilience({
        text,
        style: persona.stylePromptByLang[lang],
        voiceName: persona.geminiVoiceName,
        apiKey,
        diskFileName,
        contextLabel: 'voice-assistant-api',
      });
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
      const message = err instanceof Error ? err.message : 'Unable to synthesize voice audio.';
      console.error('[voice-assistant-api]', message);
      res.status(502).json({
        error: 'Voice synthesis failed temporarily. Readable captions remain active.',
        code: 'VOICE_TTS_FAILED',
      });
    }
  });

  app.post('/api/voice/parse-registration', voiceParseLimiter, async (req, res) => {
    const b = (req.body ?? {}) as {
      utterance?: unknown;
      step?: unknown;
      locale?: unknown;
      currentValues?: unknown;
    };

    const rawUtterance = typeof b.utterance === 'string' ? b.utterance.trim().slice(0, 1500) : '';
    if (!rawUtterance) {
      res.status(400).json({
        error: 'Utterance text is required.',
        code: 'EMPTY_UTTERANCE',
      });
      return;
    }

    const stepNum = Number(b.step);
    const step: RegistrationStepNumber =
      stepNum >= 1 && stepNum <= 8 ? (Math.trunc(stepNum) as RegistrationStepNumber) : 3;
    const locale: CoreLocale =
      b.locale === 'hi' || b.locale === 'te' ? b.locale : 'en';

    const rawValues = (b.currentValues ?? {}) as Partial<RegistrationFormValues>;
    const currentValues: RegistrationFormValues = {
      fullName: typeof rawValues.fullName === 'string' ? rawValues.fullName : '',
      email: typeof rawValues.email === 'string' ? rawValues.email : '',
      phone: typeof rawValues.phone === 'string' ? rawValues.phone : '',
      noOfPersons: typeof rawValues.noOfPersons === 'string' ? rawValues.noOfPersons : '1',
      donationAmount: typeof rawValues.donationAmount === 'string' ? rawValues.donationAmount : '',
      registrationType:
        typeof rawValues.registrationType === 'string' ? rawValues.registrationType : 'individual',
      country: typeof rawValues.country === 'string' ? rawValues.country : 'india',
      city: typeof rawValues.city === 'string' ? rawValues.city : '',
      assistance: {
        visa: Boolean(rawValues.assistance?.visa),
        accommodation: Boolean(rawValues.assistance?.accommodation),
        localTransport: Boolean(rawValues.assistance?.localTransport),
      },
      events: {
        curtainRaiser: rawValues.events?.curtainRaiser !== false,
        mahotsav: rawValues.events?.mahotsav !== false,
      },
      consent: Boolean(rawValues.consent),
      preferredLanguage:
        typeof rawValues.preferredLanguage === 'string' ? rawValues.preferredLanguage : locale,
      familyOrGroupMembers:
        typeof rawValues.familyOrGroupMembers === 'string' ? rawValues.familyOrGroupMembers : '',
      organisationName:
        typeof rawValues.organisationName === 'string' ? rawValues.organisationName : '',
      organisationRole:
        typeof rawValues.organisationRole === 'string' ? rawValues.organisationRole : '',
      volunteerSkills:
        typeof rawValues.volunteerSkills === 'string' ? rawValues.volunteerSkills : '',
      parayanaCity: typeof rawValues.parayanaCity === 'string' ? rawValues.parayanaCity : '',
      assistanceNotes:
        typeof rawValues.assistanceNotes === 'string' ? rawValues.assistanceNotes : '',
    };

    // Security check BEFORE any AI or heuristic processing
    const sanitized = sanitizeSensitiveUtterance(rawUtterance);
    if (sanitized.hadSensitiveTokens) {
      const refused = parseRegistrationUtterance({
        utterance: rawUtterance,
        step,
        locale,
        currentValues,
      });
      res.json(refused);
      return;
    }

    const baseResult = parseRegistrationUtterance({
      utterance: sanitized.cleaned,
      step,
      locale,
      currentValues,
    });

    const apiKey = tts.getConfiguredApiKey();
    const hasUpdates = Object.keys(baseResult.updates).length > 0;
    if (
      apiKey &&
      !hasUpdates &&
      baseResult.intent === 'provide-data' &&
      sanitized.cleaned.length >= 3
    ) {
      try {
        const ai = new GoogleGenAI({ apiKey });
        const prompt = [
          `Extract safe registration form fields from this participant utterance for step ${step} (locale: ${locale}).`,
          'NEVER extract card numbers, CVV, OTP, or UPI PINs.',
          'Allowed registrationType: individual, family, group, youth, volunteer, scholar, institutional.',
          `Utterance: "${sanitized.cleaned.replace(/"/g, "'")}"`,
        ].join('\n');

        const aiPromise = ai.models.generateContent({
          model: 'gemini-flash-latest',
          contents: prompt,
          config: {
            responseMimeType: 'application/json',
            responseSchema: {
              type: Type.OBJECT,
              properties: {
                fullName: { type: Type.STRING },
                email: { type: Type.STRING },
                phone: { type: Type.STRING },
                city: { type: Type.STRING },
                country: { type: Type.STRING },
                registrationType: { type: Type.STRING },
                noOfPersons: { type: Type.STRING },
                donationAmount: { type: Type.STRING },
                organisationName: { type: Type.STRING },
                parayanaCity: { type: Type.STRING },
              },
            },
          },
        });

        const timeoutPromise = new Promise<null>((resolve) =>
          setTimeout(() => resolve(null), 3500),
        );

        const aiResp = await Promise.race([aiPromise, timeoutPromise]);
        if (aiResp && typeof aiResp.text === 'string' && aiResp.text.trim()) {
          const parsedAi = JSON.parse(aiResp.text) as Record<string, unknown>;
          const safeUpdates: Partial<RegistrationFormValues> = { ...baseResult.updates };
          const summary = [...baseResult.extractedSummary];

          if (typeof parsedAi.fullName === 'string' && parsedAi.fullName.trim().length >= 2) {
            safeUpdates.fullName = parsedAi.fullName.trim().slice(0, 80);
            summary.push(`Name: ${safeUpdates.fullName}`);
          }
          if (typeof parsedAi.email === 'string' && parsedAi.email.includes('@')) {
            safeUpdates.email = parsedAi.email.trim().toLowerCase().slice(0, 100);
            summary.push(`Email: ${safeUpdates.email}`);
          }
          if (typeof parsedAi.phone === 'string' && parsedAi.phone.replace(/\D/g, '').length >= 7) {
            safeUpdates.phone = parsedAi.phone.trim().slice(0, 24);
            summary.push(`Phone: ${safeUpdates.phone}`);
          }
          if (typeof parsedAi.city === 'string' && parsedAi.city.trim().length >= 2) {
            safeUpdates.city = parsedAi.city.trim().slice(0, 60);
            summary.push(`City: ${safeUpdates.city}`);
          }
          if (typeof parsedAi.country === 'string' && parsedAi.country.trim().length >= 2) {
            safeUpdates.country = parsedAi.country.trim().slice(0, 40);
            summary.push(`Country: ${safeUpdates.country}`);
          }
          if (typeof parsedAi.organisationName === 'string' && parsedAi.organisationName.trim()) {
            safeUpdates.organisationName = parsedAi.organisationName.trim().slice(0, 100);
            summary.push(`Organisation: ${safeUpdates.organisationName}`);
          }
          if (typeof parsedAi.parayanaCity === 'string' && parsedAi.parayanaCity.trim()) {
            safeUpdates.parayanaCity = parsedAi.parayanaCity.trim().slice(0, 60);
            summary.push(`Parayana City: ${safeUpdates.parayanaCity}`);
          }
          const validTypes: readonly RegistrationTypeId[] = [
            'individual',
            'family',
            'group',
            'youth',
            'volunteer',
            'scholar',
            'institutional',
          ];
          const isValidRegistrationType = (val: string): val is RegistrationTypeId =>
            (validTypes as readonly string[]).includes(val);
          if (typeof parsedAi.registrationType === 'string') {
            const candidateType = parsedAi.registrationType.trim();
            if (isValidRegistrationType(candidateType)) {
              safeUpdates.registrationType = candidateType;
              summary.push(`Type: ${safeUpdates.registrationType}`);
            }
          }
          if (typeof parsedAi.donationAmount === 'string' && /^\d{1,7}$/.test(parsedAi.donationAmount.trim())) {
            safeUpdates.donationAmount = parsedAi.donationAmount.trim();
            summary.push(`Contribution: ₹${safeUpdates.donationAmount}`);
          }

          if (summary.length > 0) {
            res.json({
              ...baseResult,
              updates: safeUpdates,
              extractedSummary: summary,
              needsEmailPhoneConfirmation: Boolean(safeUpdates.email || safeUpdates.phone),
              assistantReply:
                locale === 'te'
                  ? `నమోదు చేసుకున్నాము: ${summary.join(', ')}.`
                  : locale === 'hi'
                    ? `दर्ज किया गया: ${summary.join(', ')}।`
                    : `Recorded: ${summary.join(', ')}.`,
            });
            return;
          }
        }
      } catch {
        // Non-fatal fallback to deterministic parser
      }
    }

    res.json(baseResult);
  });

  // ---------------------------------------------------------------------------
  // 2. PUBLIC CMS, REGISTRATION, VOLUNTEER & WEBHOOK ROUTES
  // ---------------------------------------------------------------------------
  app.get('/api/public/cms', (_req, res) => {
    const db = store.getSnapshot();
    const publishedPages = db.pages
      .filter((p) => p.status === 'published')
      .map((p) => ({
        id: p.id,
        slug: p.slug,
        route: p.route,
        name: p.name,
        category: p.category,
        status: p.status,
        cmsConnected: p.cmsConnected,
        syncStatus: p.syncStatus,
        publishedVersion: p.publishedVersion,
        updatedAt: p.updatedAt,
        publishedAt: p.publishedAt,
      }));

    const publishedCarousels = db.carousels
      .filter((c) => c.status === 'published')
      .map((c) => ({
        id: c.id,
        name: c.name,
        placement: c.placement,
        autoAdvanceMs: c.autoAdvanceMs,
        transitionStyle: c.transitionStyle,
        status: c.status,
        publishedSlides: c.publishedSlides.filter((s) => s.enabled),
        draftSlides: [],
        hasUnpublishedDraft: false,
        updatedAt: c.updatedAt,
      }));

    res.json({
      settings: {
        registrationOpen: db.settings.registrationOpen,
        maintenanceBanner: db.settings.maintenanceBanner,
        defaultVoiceGender: db.settings.defaultVoiceGender,
      },
      media: db.media.filter((m) => m.published),
      cmsItems: db.cmsItems.filter((c) => c.status === 'published'),
      pages: publishedPages,
      carousels: publishedCarousels,
      mediaAssets: db.mediaAssets.filter((m) => m.published),
      scriptureChapters: db.scriptureChapters.filter((ch) => ch.status === 'published'),
      scriptureVerses: db.scriptureVerses.filter((v) => v.status === 'published'),
      storyScenes: db.storyScenes.filter((s) => s.status === 'published'),
      collections: db.collections.filter((item) => item.status === 'published'),
    });
  });

  app.post('/api/public/registrations', publicRegistrationLimiter, (req, res) => {
    const db = store.getSnapshot();
    if (!db.settings.registrationOpen) {
      res.status(403).json({
        error: 'Registrations are currently paused by the Mahotsav Secretariat.',
        code: 'REGISTRATION_CLOSED',
      });
      return;
    }

    const b = (req.body ?? {}) as Record<string, unknown>;
    const fullName = typeof b.fullName === 'string' ? b.fullName.trim() : '';
    const email = typeof b.email === 'string' ? b.email.trim().toLowerCase() : '';
    const phone = typeof b.phone === 'string' ? b.phone.trim() : '';
    const country = typeof b.country === 'string' ? b.country.trim() : '';
    const city = typeof b.city === 'string' ? b.city.trim() : '';
    const registrationType =
      typeof b.registrationType === 'string' ? b.registrationType.trim() : 'visitor';
    const noOfPersons = Math.max(1, Math.min(500, Number(b.noOfPersons) || 1));
    const donationAmountInr = Math.max(0, Number(b.donationAmount) || 0);

    if (fullName.length < 2 || !email.includes('@') || !phone || !country || !city) {
      res.status(400).json({
        error: 'Complete participant name, email, phone, country, and city are required.',
        code: 'INVALID_REGISTRATION',
      });
      return;
    }

    const rawAssist = (b.assistance ?? {}) as Record<string, unknown>;
    const rawEvents = (b.events ?? {}) as Record<string, unknown>;
    const cleanOptText = (val: unknown, maxLen = 160): string | undefined => {
      if (typeof val !== 'string') return undefined;
      const cleaned = sanitizeSensitiveUtterance(val).cleaned.trim();
      return cleaned ? cleaned.slice(0, maxLen) : undefined;
    };

    const referenceCode = `BVGM-${crypto.randomBytes(3).toString('hex').toUpperCase()}`;
    const now = new Date().toISOString();
    const participant: ParticipantRecord = {
      id: `prt-${crypto.randomUUID().slice(0, 8)}`,
      fullName,
      email,
      phone,
      noOfPersons,
      donationAmountInr,
      registrationType,
      country,
      city,
      assistance: {
        visa: Boolean(rawAssist.visa),
        accommodation: Boolean(rawAssist.accommodation),
        localTransport: Boolean(rawAssist.localTransport),
      },
      events: {
        curtainRaiser: Boolean(rawEvents.curtainRaiser),
        mahotsav: Boolean(rawEvents.mahotsav),
      },
      preferredLanguage: cleanOptText(b.preferredLanguage, 20),
      familyOrGroupMembers: cleanOptText(b.familyOrGroupMembers, 320),
      organisationName: cleanOptText(b.organisationName, 140),
      organisationRole: cleanOptText(b.organisationRole, 120),
      volunteerSkills: cleanOptText(b.volunteerSkills, 240),
      parayanaCity: cleanOptText(b.parayanaCity, 100),
      assistanceNotes: cleanOptText(b.assistanceNotes, 400),
      verificationStatus: 'pending',
      paymentStatus: 'awaiting-gateway',
      referenceCode,
      createdAt: now,
    };

    const payment: PaymentRecord = {
      id: `pay-${crypto.randomUUID().slice(0, 8)}`,
      participantId: participant.id,
      participantName: participant.fullName,
      amountInr: donationAmountInr,
      currency: 'INR',
      gateway: 'external-handoff',
      gatewayReference: referenceCode,
      gatewayOrderId: null,
      status: 'initiated',
      createdAt: now,
    };

    db.participants.unshift(participant);
    db.payments.unshift(payment);
    store.appendAudit({
      actorEmail: email,
      actorRole: 'PUBLIC_SYSTEM',
      action: 'PARTICIPANT_REGISTER',
      module: 'registrations',
      targetId: participant.id,
      summary: `Recorded delegate ${fullName} (${registrationType}, ${country}) with ref ${referenceCode}.`,
    });

    res.status(201).json({
      ok: true,
      participantId: participant.id,
      paymentId: payment.id,
      referenceCode,
    });
  });

  app.post('/api/public/volunteers', publicVolunteerLimiter, (req, res) => {
    const db = store.getSnapshot();
    const b = (req.body ?? {}) as Record<string, unknown>;
    const fullName = typeof b.fullName === 'string' ? b.fullName.trim() : '';
    const email = typeof b.email === 'string' ? b.email.trim().toLowerCase() : '';
    const phone = typeof b.phone === 'string' ? b.phone.trim() : '';
    const country = typeof b.country === 'string' ? b.country.trim() : '';
    const city = typeof b.city === 'string' ? b.city.trim() : '';
    const dept = String(b.department ?? 'hospitality');
    const validDepts = ['hospitality', 'translation', 'media', 'logistics', 'stage'] as const;
    const department = validDepts.includes(dept as (typeof validDepts)[number])
      ? (dept as VolunteerRecord['department'])
      : 'hospitality';

    if (fullName.length < 2 || !email.includes('@') || !phone || !country) {
      res.status(400).json({
        error: 'Name, email, phone, and country are required for volunteer seva registration.',
        code: 'INVALID_VOLUNTEER',
      });
      return;
    }

    const volunteer: VolunteerRecord = {
      id: `vol-${crypto.randomUUID().slice(0, 8)}`,
      fullName,
      email,
      phone,
      country,
      city: city || 'Hyderabad',
      department,
      volunteerBadgeId: `SEVA-${crypto.randomBytes(2).toString('hex').toUpperCase()}`,
      approvalStatus: db.settings.requireVolunteerApproval ? 'pending' : 'approved',
      attendanceCount: 0,
      createdAt: new Date().toISOString(),
    };

    db.volunteers.unshift(volunteer);
    store.appendAudit({
      actorEmail: email,
      actorRole: 'PUBLIC_SYSTEM',
      action: 'VOLUNTEER_APPLY',
      module: 'volunteers',
      targetId: volunteer.id,
      summary: `Volunteer application submitted for ${fullName} (${department}).`,
    });

    res.status(201).json({ ok: true, volunteer });
  });

  app.get('/api/payments/gateway-status', (_req, res) => {
    res.json(getPaymentGatewayStatus());
  });

  app.get('/api/public/payments/:referenceCode/status', (req, res) => {
    const ref = String(req.params.referenceCode ?? '').trim().toUpperCase();
    if (!ref) {
      res.status(400).json({ error: 'Reference code is required.', code: 'MISSING_REFERENCE' });
      return;
    }
    const db = store.getSnapshot();
    const participant = db.participants.find(
      (p) => p.referenceCode.toUpperCase() === ref,
    );
    const payment = db.payments.find(
      (p) =>
        p.gatewayReference.toUpperCase() === ref ||
        (participant && p.participantId === participant.id),
    );
    if (!participant && !payment) {
      res.status(404).json({
        error: 'Registration reference not found.',
        code: 'REFERENCE_NOT_FOUND',
      });
      return;
    }
    const paymentStatus = participant?.paymentStatus ?? 'awaiting-gateway';
    const paymentRecordStatus = payment?.status ?? 'initiated';
    const receiptAvailable = paymentStatus === 'paid' && paymentRecordStatus === 'captured';
    res.json({
      referenceCode: participant?.referenceCode ?? payment?.gatewayReference ?? ref,
      participantFirstName:
        (participant?.fullName ?? payment?.participantName ?? 'Participant').split(' ')[0],
      registrationType: participant?.registrationType ?? 'individual',
      paymentStatus,
      paymentRecordStatus,
      gateway: payment?.gateway ?? 'external-handoff',
      amountInr: participant?.donationAmountInr ?? payment?.amountInr ?? 0,
      events: participant?.events ?? { curtainRaiser: true, mahotsav: true },
      gatewayStatus: getPaymentGatewayStatus(),
      receiptAvailable,
      receiptIssuedAt: receiptAvailable ? payment?.createdAt ?? participant?.createdAt ?? null : null,
      createdAt: participant?.createdAt ?? payment?.createdAt ?? new Date().toISOString(),
    });
  });

  const paymentOrderLimiter = createRateLimiter({
    windowMs: 10 * 60 * 1000,
    max: 20,
    keyPrefix: 'payment-create-order',
  });

  app.post('/api/public/payments/create-order', paymentOrderLimiter, async (req, res) => {
    const b = (req.body ?? {}) as { referenceCode?: unknown; amountInr?: unknown };
    const referenceCode =
      typeof b.referenceCode === 'string' ? b.referenceCode.trim().toUpperCase() : '';
    if (!referenceCode) {
      res.status(400).json({
        error: 'Registration referenceCode is required to initiate checkout.',
        code: 'MISSING_REFERENCE',
      });
      return;
    }

    const db = store.getSnapshot();
    const participant = db.participants.find(
      (p) => p.referenceCode.toUpperCase() === referenceCode,
    );
    const payment = db.payments.find(
      (p) =>
        p.gatewayReference.toUpperCase() === referenceCode ||
        (participant && p.participantId === participant.id),
    );

    const amountInr = Math.max(
      0,
      participant?.donationAmountInr ?? payment?.amountInr ?? (Number(b.amountInr) || 0),
    );

    if (amountInr <= 0) {
      res.status(400).json({
        error: 'This registration has no payable amount.',
        code: 'NO_PAYABLE_AMOUNT',
      });
      return;
    }

    const razorpayClient = getRazorpayClient();
    const razorpayKeys = getRazorpayKeys();

    if (!razorpayClient || !razorpayKeys) {
      res.json({
        configured: false,
        mode: 'official-portal-handoff',
        officialPortalUrl: 'https://bhagavadgitavishwamahotsav.com/participate/register',
        referenceCode: participant?.referenceCode ?? referenceCode,
        amountInr,
        status: participant?.paymentStatus ?? 'awaiting-gateway',
        message:
          'A payment gateway is not configured on this server. Complete checkout securely via the official Bhagavad Gita Vishwa Mahotsav payment portal.',
      });
      return;
    }

    try {
      // Amounts at Razorpay's API are integer paise, not rupees.
      const order = await razorpayClient.orders.create({
        amount: Math.round(amountInr * 100),
        currency: 'INR',
        receipt: referenceCode,
        notes: { referenceCode },
      });

      if (payment) {
        payment.gateway = 'razorpay';
        payment.gatewayOrderId = order.id;
      }

      store.appendAudit({
        actorEmail: participant?.email || 'public-checkout',
        actorRole: 'PUBLIC_SYSTEM',
        action: 'PAYMENT_ORDER_CREATED',
        module: 'payments',
        targetId: payment?.id || referenceCode,
        summary: `Created Razorpay order ${order.id} for ${referenceCode} (₹${amountInr}).`,
      });

      res.status(201).json({
        configured: true,
        mode: 'razorpay-checkout',
        orderId: order.id,
        keyId: razorpayKeys.keyId,
        referenceCode: participant?.referenceCode ?? referenceCode,
        amountInr,
        amountPaise: order.amount,
        currency: 'INR',
        status: participant?.paymentStatus ?? 'awaiting-gateway',
      });
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unable to create payment order.';
      console.error('[payments-api] Razorpay order creation failed:', message);
      res.status(502).json({
        error: 'Unable to initiate payment with the gateway right now. Please try again shortly.',
        code: 'GATEWAY_ORDER_FAILED',
      });
    }
  });

  app.post('/api/public/payments/verify', paymentOrderLimiter, (req, res) => {
    const razorpayKeys = getRazorpayKeys();
    if (!razorpayKeys) {
      res.status(503).json({ error: 'Payment gateway is not configured.', code: 'GATEWAY_UNCONFIGURED' });
      return;
    }

    const b = (req.body ?? {}) as {
      razorpayOrderId?: unknown;
      razorpayPaymentId?: unknown;
      razorpaySignature?: unknown;
    };
    const orderId = typeof b.razorpayOrderId === 'string' ? b.razorpayOrderId.trim() : '';
    const paymentId = typeof b.razorpayPaymentId === 'string' ? b.razorpayPaymentId.trim() : '';
    const signature = typeof b.razorpaySignature === 'string' ? b.razorpaySignature.trim() : '';

    if (!orderId || !paymentId || !signature) {
      res.status(400).json({ error: 'Missing Razorpay checkout fields.', code: 'INVALID_PAYLOAD' });
      return;
    }

    const isValid = verifyRazorpayPaymentSignature(
      orderId,
      paymentId,
      signature,
      razorpayKeys.keySecret,
    );
    if (!isValid) {
      res.status(401).json({ error: 'Payment signature could not be verified.', code: 'INVALID_SIGNATURE' });
      return;
    }

    const db = store.getSnapshot();
    const payment = db.payments.find((p) => p.gatewayOrderId === orderId);
    if (!payment) {
      res.status(404).json({ error: 'No matching payment order found.', code: 'ORDER_NOT_FOUND' });
      return;
    }

    // Cryptographically confirmed by the signature check above — this is a real gateway
    // confirmation, not "the browser returned to a success URL."
    payment.status = 'captured';
    payment.gatewayReference = paymentId;
    const participant = db.participants.find((p) => p.id === payment.participantId);
    if (participant) participant.paymentStatus = 'paid';

    store.appendAudit({
      actorEmail: participant?.email || 'public-checkout',
      actorRole: 'PUBLIC_SYSTEM',
      action: 'PAYMENT_VERIFIED_CLIENT',
      module: 'payments',
      targetId: payment.id,
      summary: `Razorpay payment ${paymentId} verified for order ${orderId}.`,
    });

    res.json({ ok: true, referenceCode: participant?.referenceCode, status: 'paid' });
  });

  app.post('/api/payments/webhook', (req: AuthenticatedRequest, res) => {
    const razorpaySecret = process.env.RAZORPAY_WEBHOOK_SECRET?.trim();
    const genericSecret =
      process.env.PAYMENT_WEBHOOK_SECRET?.trim() || process.env.STRIPE_WEBHOOK_SECRET?.trim();
    const secret = razorpaySecret || genericSecret;

    if (!secret) {
      res.status(503).json({
        error:
          'Payment gateway webhook verification is unconfigured. Configure RAZORPAY_WEBHOOK_SECRET, PAYMENT_WEBHOOK_SECRET, or STRIPE_WEBHOOK_SECRET.',
        code: 'GATEWAY_UNCONFIGURED',
      });
      return;
    }

    // A header name is only trusted when the secret that would have produced it is the one
    // actually configured, avoiding cross-gateway signature confusion if more than one
    // secret is ever set at once.
    const razorpaySig = req.headers['x-razorpay-signature'] as string | undefined;
    const stripeSig = req.headers['stripe-signature'] as string | undefined;
    const genericSig = req.headers['x-webhook-signature'] as string | undefined;
    const { sig, gateway } = razorpaySecret && razorpaySig
      ? { sig: razorpaySig, gateway: 'razorpay' as const }
      : genericSecret && (stripeSig || genericSig)
        ? { sig: stripeSig || genericSig, gateway: 'custom' as const }
        : { sig: undefined, gateway: 'custom' as const };

    const rawBody = req.rawBody ?? JSON.stringify(req.body ?? {});
    if (!verifyWebhookSignature(rawBody, sig, secret)) {
      res.status(401).json({ error: 'Invalid webhook HMAC signature.', code: 'INVALID_SIGNATURE' });
      return;
    }

    // Idempotency: gateways retry undelivered/slow webhooks with an identical body. Replaying
    // the same event must not double-apply a refund or re-flip an already-settled status.
    const bodyHash = crypto.createHash('sha256').update(rawBody).digest('hex');
    if (store.hasProcessedWebhookEvent(bodyHash)) {
      res.json({ ok: true, deduplicated: true });
      return;
    }

    const db = store.getSnapshot();
    let payment: PaymentRecord | undefined;
    let nextStatus: PaymentRecord['status'] = 'captured';
    let gatewayReference = '';

    if (gateway === 'razorpay') {
      // Real Razorpay webhook payload shape: { event, payload: { payment: { entity } } }.
      const body = (req.body ?? {}) as {
        event?: string;
        payload?: {
          payment?: { entity?: { id?: string; order_id?: string; notes?: { referenceCode?: string } } };
          refund?: { entity?: { id?: string; payment_id?: string } };
        };
      };
      const paymentEntity = body.payload?.payment?.entity;
      const refundEntity = body.payload?.refund?.entity;
      const orderId = paymentEntity?.order_id;
      const referenceCode = paymentEntity?.notes?.referenceCode;
      const refundPaymentId = refundEntity?.payment_id;

      payment = db.payments.find(
        (p) =>
          (orderId && p.gatewayOrderId === orderId) ||
          (referenceCode && p.gatewayReference.toUpperCase() === referenceCode.toUpperCase()) ||
          (refundPaymentId && p.gatewayReference === refundPaymentId),
      );
      gatewayReference = paymentEntity?.id || refundEntity?.id || payment?.gatewayReference || '';
      nextStatus =
        body.event === 'payment.captured'
          ? 'captured'
          : body.event === 'payment.failed'
            ? 'failed'
            : body.event === 'refund.processed' || body.event === 'refund.created'
              ? 'refunded'
              : 'captured';
    } else {
      // Generic/custom HMAC gateway shape used before a real provider was wired up.
      const body = (req.body ?? {}) as {
        referenceCode?: string;
        status?: 'captured' | 'failed' | 'refunded';
        gateway?: 'razorpay' | 'stripe';
      };
      payment = db.payments.find(
        (p) => p.gatewayReference === body.referenceCode || p.id === body.referenceCode,
      );
      gatewayReference = payment?.gatewayReference || '';
      nextStatus = body.status ?? 'captured';
    }

    store.recordWebhookEvent({ bodyHash, gateway: gateway === 'razorpay' ? 'razorpay' : 'custom' });

    if (!payment) {
      // Still 200 (not 404): the signature was valid, so this is a legitimate event for an
      // order we don't recognise (e.g. a stale retry) rather than an attacker probing us.
      res.json({ ok: true, matched: false });
      return;
    }

    payment.status = nextStatus;
    if (gatewayReference) payment.gatewayReference = gatewayReference;

    const participant = db.participants.find((p) => p.id === payment!.participantId);
    if (participant) {
      participant.paymentStatus =
        payment.status === 'captured'
          ? 'paid'
          : payment.status === 'refunded'
            ? 'refunded'
            : 'awaiting-gateway';
    }

    store.appendAudit({
      actorEmail: 'gateway-webhook',
      actorRole: 'PUBLIC_SYSTEM',
      action: 'WEBHOOK_PAYMENT_UPDATE',
      module: 'payments',
      targetId: payment.id,
      summary: `Webhook updated ${payment.gatewayReference} to ${payment.status}.`,
    });

    res.json({ ok: true, matched: true, payment });
  });

  // ---------------------------------------------------------------------------
  // 3. ADMIN AUTHENTICATION & SESSION HANDLERS
  // ---------------------------------------------------------------------------
  const pruneRevokedTokens = () => {
    const now = Date.now();
    for (const [digest, exp] of revokedTokens.entries()) {
      if (now > exp) revokedTokens.delete(digest);
    }
  };

  const authenticateAdmin = (req: AuthenticatedRequest): boolean => {
    const tokens = extractSessionTokens(req);
    if (tokens.length === 0) return false;
    pruneRevokedTokens();
    const db = store.getSnapshot();
    for (const token of tokens) {
      if (revokedTokens.has(hashTokenDigest(token))) continue;
      const parsed = verifySessionToken(token, sessionSecret);
      if (!parsed) continue;
      const user = db.users.find((u) => u.id === parsed.userId && u.active);
      if (!user || !ALL_ADMIN_ROLES.includes(user.role)) continue;
      if (user.mustChangePassword && !PASSWORD_CHANGE_EXEMPT_PATHS.has(req.path)) continue;
      req.adminUser = {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        mustChangePassword: user.mustChangePassword,
      };
      return true;
    }
    return false;
  };

  const isLockedPendingPasswordChange = (req: AuthenticatedRequest): boolean => {
    const db = store.getSnapshot();
    return extractSessionTokens(req).some((token) => {
      const parsed = verifySessionToken(token, sessionSecret);
      const user = parsed && db.users.find((u) => u.id === parsed.userId && u.active);
      return Boolean(user?.mustChangePassword);
    });
  };

  const requireModule =
    (moduleId: AdminModuleId, action: 'read' | 'write') =>
    (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
      if (!authenticateAdmin(req) || !req.adminUser) {
        if (isLockedPendingPasswordChange(req)) {
          res.status(403).json({
            error: 'A password change is required before continuing.',
            code: 'PASSWORD_CHANGE_REQUIRED',
          });
          return;
        }
        res.status(401).json({ error: 'Authentication required.', code: 'UNAUTHENTICATED' });
        return;
      }
      if (!hasModulePermission(req.adminUser.role, moduleId, action)) {
        res.status(403).json({
          error: `Role ${req.adminUser.role} lacks ${action} access to ${moduleId}.`,
          code: 'FORBIDDEN',
        });
        return;
      }
      next();
    };

  app.get('/api/admin/session', (req: AuthenticatedRequest, res) => {
    if (!authenticateAdmin(req) || !req.adminUser) {
      res.json({ authenticated: false });
      return;
    }
    const permissions = getPermittedModules(req.adminUser.role);
    res.json({
      authenticated: true,
      user: req.adminUser,
      permissions,
    });
  });

  app.post('/api/admin/login', (req, res) => {
    const body = (req.body ?? {}) as { email?: unknown; password?: unknown };
    const email = typeof body.email === 'string' ? body.email.trim().toLowerCase() : '';
    const password = typeof body.password === 'string' ? body.password : '';
    const trimmedPassword = password.trim();

    const ip = req.ip || 'local';
    const rateKey = `${ip}:${email || 'unknown'}`;
    const now = Date.now();
    const bucket = loginAttempts.get(rateKey);
    if (bucket && now < bucket.resetAt && bucket.count >= 12) {
      res.status(429).json({
        error: 'Too many authentication attempts. Please wait before retrying.',
        code: 'RATE_LIMITED',
      });
      return;
    }

    const db = store.getSnapshot();
    const user = db.users.find((u) => u.email.toLowerCase() === email && u.active);
    const passwordValid = Boolean(
      user &&
        (verifyPassword(password, user.passwordHash) ||
          (trimmedPassword.length > 0 &&
            trimmedPassword !== password &&
            verifyPassword(trimmedPassword, user.passwordHash))),
    );
    if (!user || !passwordValid) {
      const nextBucket =
        bucket && now < bucket.resetAt
          ? { count: bucket.count + 1, resetAt: bucket.resetAt }
          : { count: 1, resetAt: now + 10 * 60 * 1000 };
      loginAttempts.set(rateKey, nextBucket);
      res.status(401).json({ error: 'Invalid secretariat credentials.', code: 'INVALID_LOGIN' });
      return;
    }

    loginAttempts.delete(rateKey);
    user.lastLoginAt = new Date().toISOString();
    store.appendAudit({
      actorEmail: user.email,
      actorRole: user.role,
      action: 'ADMIN_LOGIN',
      module: 'users',
      targetId: user.id,
      summary: `Admin session opened by ${user.name} (${user.role}).`,
    });

    const token = signSessionToken(
      { userId: user.id, email: user.email, role: user.role },
      sessionSecret,
    );
    res.setHeader('Set-Cookie', buildSessionCookie(token, req, 43200));
    res.json({
      authenticated: true,
      sessionToken: token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        mustChangePassword: user.mustChangePassword,
      },
      permissions: getPermittedModules(user.role),
    });
  });

  app.post('/api/admin/logout', (req: AuthenticatedRequest, res) => {
    const tokens = extractSessionTokens(req);
    if (authenticateAdmin(req) && req.adminUser) {
      store.appendAudit({
        actorEmail: req.adminUser.email,
        actorRole: req.adminUser.role,
        action: 'ADMIN_LOGOUT',
        module: 'users',
        targetId: req.adminUser.id,
        summary: `Signed out of Command Centre.`,
      });
    }
    for (const rawToken of tokens) {
      const verified = verifySessionToken(rawToken, sessionSecret);
      revokedTokens.set(
        hashTokenDigest(rawToken),
        verified?.exp ?? Date.now() + 1000 * 60 * 60 * 12,
      );
    }
    res.setHeader('Set-Cookie', buildSessionCookie('', req, 0));
    res.json({ ok: true });
  });

  app.post('/api/admin/change-password', (req: AuthenticatedRequest, res) => {
    if (!authenticateAdmin(req) || !req.adminUser) {
      res.status(401).json({ error: 'Authentication required.', code: 'UNAUTHENTICATED' });
      return;
    }
    const db = store.getSnapshot();
    const target = db.users.find((u) => u.id === req.adminUser!.id);
    if (!target) {
      res.status(404).json({ error: 'Account not found.' });
      return;
    }
    const b = (req.body ?? {}) as { currentPassword?: unknown; newPassword?: unknown };
    const currentPassword = typeof b.currentPassword === 'string' ? b.currentPassword : '';
    const newPassword = typeof b.newPassword === 'string' ? b.newPassword : '';

    if (!verifyPassword(currentPassword, target.passwordHash)) {
      res.status(401).json({ error: 'Current password is incorrect.', code: 'INVALID_LOGIN' });
      return;
    }
    if (newPassword.length < 12) {
      res
        .status(400)
        .json({ error: 'New password must be at least 12 characters.', code: 'WEAK_PASSWORD' });
      return;
    }
    if (newPassword === currentPassword) {
      res.status(400).json({
        error: 'New password must be different from the current password.',
        code: 'PASSWORD_REUSED',
      });
      return;
    }

    target.passwordHash = hashPassword(newPassword);
    target.mustChangePassword = false;
    target.passwordUpdatedAt = new Date().toISOString();
    store.appendAudit({
      actorEmail: target.email,
      actorRole: target.role,
      action: 'CHANGE_OWN_PASSWORD',
      module: 'users',
      targetId: target.id,
      summary: `${target.name} updated their own password.`,
    });
    res.json({ ok: true });
  });

  // ---------------------------------------------------------------------------
  // 4. ADMIN DASHBOARD OVERVIEW & ANALYTICS
  // ---------------------------------------------------------------------------
  app.get('/api/admin/dashboard', requireModule('overview', 'read'), (req, res) => {
    const db = store.getSnapshot();
    const rawRange = String(req.query.range ?? 'all');
    const range: 'all' | '7d' | '30d' =
      rawRange === '7d' || rawRange === '30d' ? rawRange : 'all';

    const participants = filterRecordsByDateRange(db.participants, range);
    const payments = filterRecordsByDateRange(db.payments, range);
    const volunteers = filterRecordsByDateRange(db.volunteers, range);
    const memberships = filterRecordsByDateRange(db.memberships, range);

    const totalRegistrations = participants.length;
    const totalHeadcount = participants.reduce((acc, p) => acc + p.noOfPersons, 0);
    const verifiedParticipants = participants.filter(
      (p) => p.verificationStatus === 'verified',
    ).length;
    const flaggedParticipants = participants.filter(
      (p) => p.verificationStatus === 'flagged',
    ).length;
    const pendingParticipants = participants.filter(
      (p) => p.verificationStatus === 'pending',
    ).length;

    const totalDeclaredInr = payments
      .filter((p) => p.status !== 'refunded')
      .reduce((acc, p) => acc + p.amountInr, 0);
    const capturedRevenueInr = payments
      .filter((p) => p.status === 'captured')
      .reduce((acc, p) => acc + p.amountInr, 0);

    const countryCounts = new Map<string, number>();
    for (const p of participants) {
      countryCounts.set(p.country, (countryCounts.get(p.country) ?? 0) + 1);
    }

    const typeCounts = new Map<string, number>();
    for (const p of participants) {
      typeCounts.set(p.registrationType, (typeCounts.get(p.registrationType) ?? 0) + 1);
    }

    const unpublishedDraftPages = db.pages.filter((p) => p.hasUnpublishedDraft).length;
    const unpublishedDraftCarousels = db.carousels.filter((c) => c.hasUnpublishedDraft).length;
    const gatewayStatus = getPaymentGatewayStatus();

    const notifications = buildAdminNotifications({
      pendingParticipants: db.participants.filter((p) => p.verificationStatus === 'pending').length,
      flaggedParticipants: db.participants.filter((p) => p.verificationStatus === 'flagged').length,
      pendingVolunteers: db.volunteers.filter((v) => v.approvalStatus === 'pending').length,
      unpublishedDraftPages,
      unpublishedDraftCarousels,
      gatewayConfigured: gatewayStatus.configured,
    });

    res.json({
      range,
      metrics: {
        totalRegistrations,
        totalHeadcount,
        verifiedParticipants,
        flaggedParticipants,
        pendingParticipants,
        totalDeclaredInr,
        capturedRevenueInr,
        totalVolunteers: volunteers.length,
        approvedVolunteers: volunteers.filter((v) => v.approvalStatus === 'approved').length,
        pendingVolunteers: volunteers.filter((v) => v.approvalStatus === 'pending').length,
        totalMembers: memberships.length,
        publishedMedia: db.mediaAssets.filter((m) => m.published).length + db.media.filter((m) => m.published).length,
        totalMedia: db.mediaAssets.length + db.media.length,
        publishedCmsItems:
          db.pages.filter((p) => p.status === 'published').length +
          db.collections.filter((c) => c.status === 'published').length,
        totalCmsItems: db.pages.length + db.collections.length,
        adminUsersCount: db.users.length,
        totalPages: db.pages.length,
        publishedPages: db.pages.filter((p) => p.status === 'published').length,
        unpublishedDraftPages,
        totalCarousels: db.carousels.length,
        totalChapters: db.scriptureChapters.length,
        totalVerses: db.scriptureVerses.length,
        totalStoryScenes: db.storyScenes.length,
      },
      notifications,
      countryBreakdown: Array.from(countryCounts.entries())
        .map(([country, count]) => ({ country, count }))
        .sort((a, b) => b.count - a.count),
      typeBreakdown: Array.from(typeCounts.entries())
        .map(([type, count]) => ({ type, count }))
        .sort((a, b) => b.count - a.count),
      recentAudit: db.auditLogs.slice(0, 12),
      recentRevisions: db.revisions.slice(0, 8),
      gatewayStatus,
    });
  });

  // ---------------------------------------------------------------------------
  // 5. PARTICIPANTS, REGISTRATIONS & CSV / EXCEL EXPORT
  // ---------------------------------------------------------------------------
  app.get('/api/admin/participants', requireModule('participants', 'read'), (req, res) => {
    const db = store.getSnapshot();
    const q = String(req.query.q ?? '').trim().toLowerCase();
    const type = String(req.query.type ?? '').trim();
    const country = String(req.query.country ?? '').trim();
    const status = String(req.query.status ?? '').trim();

    const filtered = db.participants.filter((p) => {
      if (type && type !== 'all' && p.registrationType !== type) return false;
      if (country && country !== 'all' && p.country !== country) return false;
      if (status && status !== 'all' && p.verificationStatus !== status) return false;
      if (q) {
        const hay = `${p.fullName} ${p.email} ${p.phone} ${p.city} ${p.country} ${p.referenceCode}`.toLowerCase();
        if (!hay.includes(q)) return false;
      }
      return true;
    });

    res.json({ participants: filtered });
  });

  app.get(
    '/api/admin/participants/export',
    requireModule('participants', 'read'),
    (req: AuthenticatedRequest, res) => {
      const db = store.getSnapshot();
      const format = String(req.query.format ?? 'csv').toLowerCase();
      const headers = [
        'Reference Code',
        'Full Name',
        'Email',
        'Phone',
        'Track',
        'Persons',
        'Country',
        'City',
        'Declared Contribution (INR)',
        'Verification Status',
        'Payment Status',
        'Registered At',
      ];
      const rows = db.participants.map((p) => [
        p.referenceCode,
        p.fullName,
        p.email,
        p.phone,
        p.registrationType,
        p.noOfPersons,
        p.country,
        p.city,
        p.donationAmountInr,
        p.verificationStatus,
        p.paymentStatus,
        p.createdAt,
      ]);

      store.appendAudit({
        actorEmail: req.adminUser!.email,
        actorRole: req.adminUser!.role,
        action: `EXPORT_PARTICIPANTS_${format.toUpperCase()}`,
        module: 'participants',
        targetId: 'bulk',
        summary: `Exported ${rows.length} participant records in ${format.toUpperCase()} format.`,
      });

      if (format === 'xls' || format === 'excel') {
        const xml = serializeRecordsToExcelXml('Participants 2027', headers, rows);
        res.setHeader('Content-Type', 'application/vnd.ms-excel; charset=utf-8');
        res.setHeader(
          'Content-Disposition',
          'attachment; filename="mahotsav-2027-participants.xls"',
        );
        res.status(200).send(xml);
        return;
      }

      const csv = serializeRecordsToCsv(headers, rows);
      res.setHeader('Content-Type', 'text/csv; charset=utf-8');
      res.setHeader(
        'Content-Disposition',
        'attachment; filename="mahotsav-2027-participants.csv"',
      );
      res.status(200).send(csv);
    },
  );

  app.patch(
    '/api/admin/participants/:id',
    requireModule('participants', 'write'),
    (req: AuthenticatedRequest, res) => {
      const db = store.getSnapshot();
      const target = db.participants.find((p) => p.id === req.params.id);
      if (!target) {
        res.status(404).json({ error: 'Participant not found.' });
        return;
      }
      const b = (req.body ?? {}) as Partial<ParticipantRecord>;
      if (
        b.verificationStatus === 'pending' ||
        b.verificationStatus === 'verified' ||
        b.verificationStatus === 'flagged'
      ) {
        target.verificationStatus = b.verificationStatus;
      }
      if (
        b.paymentStatus === 'awaiting-gateway' ||
        b.paymentStatus === 'paid' ||
        b.paymentStatus === 'refunded'
      ) {
        target.paymentStatus = b.paymentStatus;
      }
      store.appendAudit({
        actorEmail: req.adminUser!.email,
        actorRole: req.adminUser!.role,
        action: 'UPDATE_PARTICIPANT',
        module: 'participants',
        targetId: target.id,
        summary: `Updated ${target.fullName}: verification=${target.verificationStatus}, payment=${target.paymentStatus}.`,
      });
      res.json({ participant: target });
    },
  );

  app.delete(
    '/api/admin/participants/:id',
    requireModule('participants', 'write'),
    (req: AuthenticatedRequest, res) => {
      const db = store.getSnapshot();
      const idx = db.participants.findIndex((p) => p.id === req.params.id);
      if (idx === -1) {
        res.status(404).json({ error: 'Participant not found.' });
        return;
      }
      const [removed] = db.participants.splice(idx, 1);
      store.appendAudit({
        actorEmail: req.adminUser!.email,
        actorRole: req.adminUser!.role,
        action: 'DELETE_PARTICIPANT',
        module: 'participants',
        targetId: removed.id,
        summary: `Removed registration ${removed.referenceCode} (${removed.fullName}).`,
      });
      res.json({ ok: true });
    },
  );

  // ---------------------------------------------------------------------------
  // 6. PAYMENTS & REFUNDS
  // ---------------------------------------------------------------------------
  app.get('/api/admin/payments', requireModule('payments', 'read'), (_req, res) => {
    const db = store.getSnapshot();
    res.json({
      payments: db.payments,
      refunds: db.refunds,
      gatewayStatus: getPaymentGatewayStatus(),
    });
  });

  app.post(
    '/api/admin/payments/refund',
    requireModule('payments', 'write'),
    async (req: AuthenticatedRequest, res) => {
      const db = store.getSnapshot();
      const b = (req.body ?? {}) as { paymentId?: string; reason?: string };
      const payment = db.payments.find((p) => p.id === b.paymentId);
      if (!payment) {
        res.status(404).json({ error: 'Payment record not found.' });
        return;
      }
      if (payment.status !== 'captured') {
        res.status(400).json({
          error: `Only captured payments can be refunded (current status: ${payment.status}).`,
          code: 'NOT_REFUNDABLE',
        });
        return;
      }

      // Issue a real refund at the gateway for Razorpay-captured payments; for the
      // external-handoff path there is no gateway to call, so this stays bookkeeping-only.
      if (payment.gateway === 'razorpay') {
        const razorpayClient = getRazorpayClient();
        if (!razorpayClient) {
          res.status(503).json({
            error: 'Razorpay is not configured; cannot issue a live refund for this payment.',
            code: 'GATEWAY_UNCONFIGURED',
          });
          return;
        }
        try {
          await razorpayClient.payments.refund(payment.gatewayReference, {
            amount: Math.round(payment.amountInr * 100),
          });
        } catch (err) {
          const message = err instanceof Error ? err.message : 'Gateway refund failed.';
          console.error('[payments-api] Razorpay refund failed:', message);
          res.status(502).json({
            error: 'The gateway rejected this refund. No local status was changed.',
            code: 'GATEWAY_REFUND_FAILED',
          });
          return;
        }
      }

      payment.status = 'refunded';
      const participant = db.participants.find((p) => p.id === payment.participantId);
      if (participant) participant.paymentStatus = 'refunded';

      const refund = {
        id: `ref-${crypto.randomUUID().slice(0, 8)}`,
        paymentId: payment.id,
        amountInr: payment.amountInr,
        reason: (b.reason || 'Requested via Secretariat').trim(),
        approvedBy: req.adminUser!.email,
        status: 'processed' as const,
        createdAt: new Date().toISOString(),
      };
      db.refunds.unshift(refund);
      store.appendAudit({
        actorEmail: req.adminUser!.email,
        actorRole: req.adminUser!.role,
        action: 'ISSUE_REFUND',
        module: 'payments',
        targetId: payment.id,
        summary: `Processed refund for ${payment.gatewayReference} (${payment.amountInr} INR).`,
      });
      res.status(201).json({ refund, payment });
    },
  );

  // ---------------------------------------------------------------------------
  // 7. VOLUNTEER & MEMBERSHIP MANAGEMENT
  // ---------------------------------------------------------------------------
  app.get('/api/admin/volunteers', requireModule('volunteers', 'read'), (_req, res) => {
    res.json({ volunteers: store.getSnapshot().volunteers });
  });

  app.post(
    '/api/admin/volunteers',
    requireModule('volunteers', 'write'),
    (req: AuthenticatedRequest, res) => {
      const db = store.getSnapshot();
      const b = (req.body ?? {}) as Record<string, unknown>;
      const fullName = String(b.fullName ?? '').trim();
      const email = String(b.email ?? '').trim().toLowerCase();
      if (!fullName || !email) {
        res.status(400).json({ error: 'Volunteer name and email are required.' });
        return;
      }
      const vol: VolunteerRecord = {
        id: `vol-${crypto.randomUUID().slice(0, 8)}`,
        fullName,
        email,
        phone: String(b.phone ?? '').trim(),
        country: String(b.country ?? 'India').trim(),
        city: String(b.city ?? 'Hyderabad').trim(),
        department: (b.department as VolunteerRecord['department']) || 'hospitality',
        volunteerBadgeId: `SEVA-${crypto.randomBytes(2).toString('hex').toUpperCase()}`,
        approvalStatus: 'approved',
        attendanceCount: 0,
        createdAt: new Date().toISOString(),
      };
      db.volunteers.unshift(vol);
      store.appendAudit({
        actorEmail: req.adminUser!.email,
        actorRole: req.adminUser!.role,
        action: 'CREATE_VOLUNTEER',
        module: 'volunteers',
        targetId: vol.id,
        summary: `Added volunteer ${vol.fullName} (${vol.volunteerBadgeId}).`,
      });
      res.status(201).json({ volunteer: vol });
    },
  );

  app.patch(
    '/api/admin/volunteers/:id',
    requireModule('volunteers', 'write'),
    (req: AuthenticatedRequest, res) => {
      const db = store.getSnapshot();
      const vol = db.volunteers.find((v) => v.id === req.params.id);
      if (!vol) {
        res.status(404).json({ error: 'Volunteer not found.' });
        return;
      }
      const b = (req.body ?? {}) as Partial<VolunteerRecord> & { incrementAttendance?: boolean };
      if (
        b.approvalStatus === 'pending' ||
        b.approvalStatus === 'approved' ||
        b.approvalStatus === 'declined'
      ) {
        vol.approvalStatus = b.approvalStatus;
      }
      if (b.department) vol.department = b.department;
      if (b.incrementAttendance) vol.attendanceCount += 1;

      store.appendAudit({
        actorEmail: req.adminUser!.email,
        actorRole: req.adminUser!.role,
        action: 'UPDATE_VOLUNTEER',
        module: 'volunteers',
        targetId: vol.id,
        summary: `Updated volunteer ${vol.fullName}: status=${vol.approvalStatus}, attendance=${vol.attendanceCount}.`,
      });
      res.json({ volunteer: vol });
    },
  );

  app.get('/api/admin/memberships', requireModule('membership', 'read'), (_req, res) => {
    res.json({ memberships: store.getSnapshot().memberships });
  });

  app.post(
    '/api/admin/memberships',
    requireModule('membership', 'write'),
    (req: AuthenticatedRequest, res) => {
      const db = store.getSnapshot();
      const b = (req.body ?? {}) as Record<string, unknown>;
      const memberName = String(b.memberName ?? '').trim();
      const email = String(b.email ?? '').trim().toLowerCase();
      if (!memberName || !email) {
        res.status(400).json({ error: 'Member name and email are required.' });
        return;
      }
      const member = {
        id: `mem-${crypto.randomUUID().slice(0, 8)}`,
        memberName,
        email,
        tier: (b.tier as 'patron' | 'lifetime' | 'institutional' | 'youth-fellow') || 'patron',
        country: String(b.country ?? 'India').trim(),
        status: 'active' as const,
        createdAt: new Date().toISOString(),
      };
      db.memberships.unshift(member);
      store.appendAudit({
        actorEmail: req.adminUser!.email,
        actorRole: req.adminUser!.role,
        action: 'CREATE_MEMBERSHIP',
        module: 'membership',
        targetId: member.id,
        summary: `Registered ${member.tier} member ${member.memberName}.`,
      });
      res.status(201).json({ membership: member });
    },
  );

  app.patch(
    '/api/admin/memberships/:id',
    requireModule('membership', 'write'),
    (req: AuthenticatedRequest, res) => {
      const db = store.getSnapshot();
      const member = db.memberships.find((m) => m.id === req.params.id);
      if (!member) {
        res.status(404).json({ error: 'Membership not found.' });
        return;
      }
      const b = (req.body ?? {}) as Record<string, unknown>;
      if (b.memberName) member.memberName = String(b.memberName).trim();
      if (b.country) member.country = String(b.country).trim();
      if (b.tier === 'patron' || b.tier === 'lifetime' || b.tier === 'institutional' || b.tier === 'youth-fellow') {
        member.tier = b.tier;
      }
      if (b.status === 'active' || b.status === 'pending') {
        member.status = b.status;
      }

      store.appendAudit({
        actorEmail: req.adminUser!.email,
        actorRole: req.adminUser!.role,
        action: 'UPDATE_MEMBERSHIP',
        module: 'membership',
        targetId: member.id,
        summary: `Updated membership ${member.memberName}: tier=${member.tier}, status=${member.status}.`,
      });
      res.json({ membership: member });
    },
  );

  app.delete(
    '/api/admin/memberships/:id',
    requireModule('membership', 'write'),
    (req: AuthenticatedRequest, res) => {
      const db = store.getSnapshot();
      const index = db.memberships.findIndex((m) => m.id === req.params.id);
      if (index === -1) {
        res.status(404).json({ error: 'Membership not found.' });
        return;
      }
      const [removed] = db.memberships.splice(index, 1);
      store.appendAudit({
        actorEmail: req.adminUser!.email,
        actorRole: req.adminUser!.role,
        action: 'DELETE_MEMBERSHIP',
        module: 'membership',
        targetId: removed.id,
        summary: `Removed membership for ${removed.memberName}.`,
      });
      res.json({ ok: true });
    },
  );

  // ---------------------------------------------------------------------------
  // 8. GALLERY IMAGE UPLOAD, VIDEO MANAGEMENT & METADATA
  // ---------------------------------------------------------------------------
  app.get('/api/admin/media', (req: AuthenticatedRequest, res) => {
    if (!authenticateAdmin(req) || !req.adminUser) {
      res.status(401).json({ error: 'Authentication required.', code: 'UNAUTHENTICATED' });
      return;
    }
    const canGallery = hasModulePermission(req.adminUser.role, 'gallery', 'read');
    const canVideo = hasModulePermission(req.adminUser.role, 'video', 'read');
    if (!canGallery && !canVideo) {
      res.status(403).json({
        error: `Role ${req.adminUser.role} lacks read access to gallery or video media.`,
        code: 'FORBIDDEN',
      });
      return;
    }
    const media = store.getSnapshot().media.filter((item) =>
      item.kind === 'video' ? canVideo : canGallery,
    );
    res.json({ media });
  });

  app.post('/api/admin/media', (req: AuthenticatedRequest, res) => {
    if (!authenticateAdmin(req) || !req.adminUser) {
      res.status(401).json({ error: 'Authentication required.', code: 'UNAUTHENTICATED' });
      return;
    }
    const db = store.getSnapshot();
    const b = (req.body ?? {}) as Record<string, unknown>;
    const kind: ManagedMediaRecord['kind'] = b.kind === 'video' ? 'video' : 'image';
    const targetMod: AdminModuleId = kind === 'video' ? 'video' : 'gallery';
    if (!hasModulePermission(req.adminUser.role, targetMod, 'write')) {
      res.status(403).json({
        error: `Role ${req.adminUser.role} lacks write access to ${targetMod}.`,
        code: 'FORBIDDEN',
      });
      return;
    }

    const title = String(b.title ?? '').trim();
    if (!title) {
      res.status(400).json({ error: 'Media title is required.' });
      return;
    }

    let resolvedUrl = typeof b.url === 'string' ? b.url.trim() : '';
    const imageBase64 = typeof b.imageBase64 === 'string' ? b.imageBase64.trim() : '';
    if (imageBase64) {
      const match = /^data:image\/(png|jpeg|jpg|webp);base64,([A-Za-z0-9+/=]+)$/i.exec(
        imageBase64,
      );
      if (!match) {
        res.status(400).json({
          error: 'Uploaded image must be PNG, JPEG, or WebP format.',
          code: 'INVALID_IMAGE',
        });
        return;
      }
      const ext = match[1].toLowerCase() === 'jpeg' ? 'jpg' : match[1].toLowerCase();
      const buf = Buffer.from(match[2], 'base64');
      if (buf.length > 8 * 1024 * 1024) {
        res.status(413).json({ error: 'Uploaded image exceeds 8 MB limit.' });
        return;
      }
      const fileName = `plate-${crypto.randomUUID().slice(0, 10)}.${ext}`;
      fs.writeFileSync(path.join(uploadsDir, fileName), buf);
      resolvedUrl = `/uploads/${fileName}`;
    }

    if (!resolvedUrl) {
      res.status(400).json({ error: 'Provide either an uploaded file or valid media URL.' });
      return;
    }

    const item: ManagedMediaRecord = {
      id: `med-${crypto.randomUUID().slice(0, 8)}`,
      kind,
      category:
        (b.category as ManagedMediaRecord['category']) || 'festival',
      title,
      description: String(b.description ?? '').trim(),
      language: String(b.language ?? 'English · Multilingual').trim(),
      copyright: String(
        b.copyright ?? '© Aishwarya Sarvahith Foundation — Mahotsav Archive',
      ).trim(),
      source: String(b.source ?? 'Mahotsav Secretariat Media Desk').trim(),
      altText: String(b.altText ?? title).trim(),
      url: resolvedUrl,
      focalPoint: String(b.focalPoint ?? '50% 45%').trim(),
      published: b.published !== false,
      createdAt: new Date().toISOString(),
    };

    db.media.unshift(item);
    store.appendAudit({
      actorEmail: req.adminUser.email,
      actorRole: req.adminUser.role,
      action: 'PUBLISH_MEDIA',
      module: targetMod,
      targetId: item.id,
      summary: `Saved ${item.kind} plate "${item.title}" (${item.published ? 'published' : 'draft'}).`,
    });
    res.status(201).json({ mediaItem: item });
  });

  app.patch('/api/admin/media/:id', (req: AuthenticatedRequest, res) => {
    if (!authenticateAdmin(req) || !req.adminUser) {
      res.status(401).json({ error: 'Authentication required.', code: 'UNAUTHENTICATED' });
      return;
    }
    const db = store.getSnapshot();
    const item = db.media.find((m) => m.id === req.params.id);
    if (!item) {
      res.status(404).json({ error: 'Media item not found.' });
      return;
    }
    const targetMod: AdminModuleId = item.kind === 'video' ? 'video' : 'gallery';
    if (!hasModulePermission(req.adminUser.role, targetMod, 'write')) {
      res.status(403).json({
        error: `Role ${req.adminUser.role} lacks write access to ${targetMod}.`,
        code: 'FORBIDDEN',
      });
      return;
    }
    const b = (req.body ?? {}) as Partial<ManagedMediaRecord>;
    if (typeof b.title === 'string' && b.title.trim()) item.title = b.title.trim();
    if (typeof b.description === 'string') item.description = b.description.trim();
    if (typeof b.focalPoint === 'string') item.focalPoint = b.focalPoint.trim();
    if (typeof b.published === 'boolean') item.published = b.published;

    store.appendAudit({
      actorEmail: req.adminUser.email,
      actorRole: req.adminUser.role,
      action: 'UPDATE_MEDIA',
      module: targetMod,
      targetId: item.id,
      summary: `Updated media "${item.title}" (published=${item.published}).`,
    });
    res.json({ mediaItem: item });
  });

  app.delete('/api/admin/media/:id', (req: AuthenticatedRequest, res) => {
    if (!authenticateAdmin(req) || !req.adminUser) {
      res.status(401).json({ error: 'Authentication required.', code: 'UNAUTHENTICATED' });
      return;
    }
    const db = store.getSnapshot();
    const idx = db.media.findIndex((m) => m.id === req.params.id);
    if (idx === -1) {
      res.status(404).json({ error: 'Media item not found.' });
      return;
    }
    const targetMod: AdminModuleId = db.media[idx].kind === 'video' ? 'video' : 'gallery';
    if (!hasModulePermission(req.adminUser.role, targetMod, 'write')) {
      res.status(403).json({
        error: `Role ${req.adminUser.role} lacks write access to ${targetMod}.`,
        code: 'FORBIDDEN',
      });
      return;
    }
    const [removed] = db.media.splice(idx, 1);
    store.appendAudit({
      actorEmail: req.adminUser.email,
      actorRole: req.adminUser.role,
      action: 'DELETE_MEDIA',
      module: targetMod,
      targetId: removed.id,
      summary: `Deleted media "${removed.title}".`,
    });
    res.json({ ok: true });
  });

  // ---------------------------------------------------------------------------
  // 9. UNIFIED CMS CRUD (Events, Schedule, Chapters, Scripture, Voice, Story, Leadership, Partners, News, FAQs, Pages)
  // ---------------------------------------------------------------------------
  app.get('/api/admin/cms', (req: AuthenticatedRequest, res) => {
    if (!authenticateAdmin(req) || !req.adminUser) {
      res.status(401).json({ error: 'Authentication required.', code: 'UNAUTHENTICATED' });
      return;
    }
    const db = store.getSnapshot();
    const section = String(req.query.section ?? '').trim();
    if (section) {
      if (!hasModulePermission(req.adminUser.role, section as AdminModuleId, 'read')) {
        res.status(403).json({
          error: `Role ${req.adminUser.role} lacks read access to ${section}.`,
          code: 'FORBIDDEN',
        });
        return;
      }
      res.json({ cmsItems: db.cmsItems.filter((c) => c.section === section) });
      return;
    }
    const items = db.cmsItems.filter((c) =>
      hasModulePermission(req.adminUser!.role, c.section, 'read'),
    );
    res.json({ cmsItems: items });
  });

  app.post('/api/admin/cms', (req: AuthenticatedRequest, res) => {
    if (!authenticateAdmin(req) || !req.adminUser) {
      res.status(401).json({ error: 'Authentication required.' });
      return;
    }
    const b = (req.body ?? {}) as Partial<CmsManagedItem>;
    const section = (b.section ?? 'news') as CmsManagedItem['section'];
    if (!hasModulePermission(req.adminUser.role, section, 'write')) {
      res.status(403).json({ error: `Role ${req.adminUser.role} cannot edit ${section}.` });
      return;
    }
    const title = String(b.title ?? '').trim();
    if (!title) {
      res.status(400).json({ error: 'CMS item title is required.' });
      return;
    }
    const item: CmsManagedItem = {
      id: `cms-${crypto.randomUUID().slice(0, 8)}`,
      section,
      title,
      subtitle: String(b.subtitle ?? '').trim(),
      body: String(b.body ?? '').trim(),
      language:
        b.language === 'hi' || b.language === 'te' || b.language === 'sa' ? b.language : 'en',
      status:
        b.status === 'draft' || b.status === 'pending-review' ? b.status : 'published',
      meta: b.meta && typeof b.meta === 'object' ? b.meta : {},
      updatedAt: new Date().toISOString(),
    };
    const db = store.getSnapshot();
    db.cmsItems.unshift(item);
    store.appendAudit({
      actorEmail: req.adminUser.email,
      actorRole: req.adminUser.role,
      action: 'CREATE_CMS_ITEM',
      module: section,
      targetId: item.id,
      summary: `Created [${section}] "${item.title}" (${item.status}).`,
    });
    res.status(201).json({ cmsItem: item });
  });

  app.patch('/api/admin/cms/:id', (req: AuthenticatedRequest, res) => {
    if (!authenticateAdmin(req) || !req.adminUser) {
      res.status(401).json({ error: 'Authentication required.' });
      return;
    }
    const db = store.getSnapshot();
    const item = db.cmsItems.find((c) => c.id === req.params.id);
    if (!item) {
      res.status(404).json({ error: 'CMS record not found.' });
      return;
    }
    if (!hasModulePermission(req.adminUser.role, item.section, 'write')) {
      res.status(403).json({ error: `Role ${req.adminUser.role} cannot edit ${item.section}.` });
      return;
    }
    const b = (req.body ?? {}) as Partial<CmsManagedItem>;
    if (typeof b.title === 'string' && b.title.trim()) item.title = b.title.trim();
    if (typeof b.subtitle === 'string') item.subtitle = b.subtitle.trim();
    if (typeof b.body === 'string') item.body = b.body.trim();
    if (
      b.status === 'published' ||
      b.status === 'draft' ||
      b.status === 'pending-review'
    ) {
      item.status = b.status;
    }
    item.updatedAt = new Date().toISOString();
    store.appendAudit({
      actorEmail: req.adminUser.email,
      actorRole: req.adminUser.role,
      action: 'UPDATE_CMS_ITEM',
      module: item.section,
      targetId: item.id,
      summary: `Updated [${item.section}] "${item.title}" (${item.status}).`,
    });
    res.json({ cmsItem: item });
  });

  app.delete('/api/admin/cms/:id', (req: AuthenticatedRequest, res) => {
    if (!authenticateAdmin(req) || !req.adminUser) {
      res.status(401).json({ error: 'Authentication required.' });
      return;
    }
    const db = store.getSnapshot();
    const idx = db.cmsItems.findIndex((c) => c.id === req.params.id);
    if (idx === -1) {
      res.status(404).json({ error: 'CMS record not found.' });
      return;
    }
    const target = db.cmsItems[idx];
    if (!hasModulePermission(req.adminUser.role, target.section, 'write')) {
      res.status(403).json({ error: `Role ${req.adminUser.role} cannot delete ${target.section}.` });
      return;
    }
    db.cmsItems.splice(idx, 1);
    store.appendAudit({
      actorEmail: req.adminUser.email,
      actorRole: req.adminUser.role,
      action: 'DELETE_CMS_ITEM',
      module: target.section,
      targetId: target.id,
      summary: `Deleted [${target.section}] "${target.title}".`,
    });
    res.json({ ok: true });
  });

  // ---------------------------------------------------------------------------
  // 9B. WEBSITE INVENTORY, PAGE BUILDER, REVISIONS, CAROUSELS & MEDIA ASSETS
  // ---------------------------------------------------------------------------
  app.get('/api/admin/pages', requireModule('websiteInventory', 'read'), (_req, res) => {
    const db = store.getSnapshot();
    res.json({ pages: db.pages });
  });

  app.get('/api/admin/public-preview', requireModule('pageBuilder', 'read'), (req, res) => {
    const db = store.getSnapshot();
    const slug = String(req.query.slug ?? '').trim().toLowerCase();
    const page = db.pages.find(
      (p) => p.slug.toLowerCase() === slug || p.route.toLowerCase() === slug || p.id.toLowerCase() === slug,
    );
    if (!page) {
      res.status(404).json({ error: 'Requested page not found.' });
      return;
    }
    res.json({
      page,
      carousels: db.carousels,
      mediaAssets: db.mediaAssets,
    });
  });

  app.put(
    '/api/admin/pages/:id',
    requireModule('pageBuilder', 'write'),
    (req: AuthenticatedRequest, res) => {
      const db = store.getSnapshot();
      const page = db.pages.find((p) => p.id === req.params.id || p.slug === req.params.id);
      if (!page) {
        res.status(404).json({ error: 'Page record not found.' });
        return;
      }
      const b = (req.body ?? {}) as {
        mode?: 'draft' | 'publish';
        snapshot?: PageSnapshotPayload;
        status?: PublishStatus;
      };
      if (!b.snapshot || typeof b.snapshot !== 'object') {
        res.status(400).json({ error: 'Page snapshot payload is required.' });
        return;
      }

      const mode = b.mode === 'publish' ? 'publish' : 'draft';
      const now = new Date().toISOString();
      const cleanSnapshot = JSON.parse(JSON.stringify(b.snapshot)) as PageSnapshotPayload;

      // Save prior published snapshot before overwriting on publish so rollback is exact
      if (mode === 'publish') {
        store.appendRevision({
          entityType: 'page',
          entityId: page.id,
          entityTitle: page.name,
          action: 'publish',
          actorEmail: req.adminUser!.email,
          summary: `Published "${page.name}" (${page.route}) with ${cleanSnapshot.blocks.length} section blocks.`,
          snapshotJson: JSON.stringify(page.publishedVersion),
        });
        page.draftVersion = cleanSnapshot;
        page.publishedVersion = JSON.parse(JSON.stringify(cleanSnapshot)) as PageSnapshotPayload;
        page.status = 'published';
        page.hasUnpublishedDraft = false;
        page.publishedAt = now;
      } else {
        page.draftVersion = cleanSnapshot;
        if (b.status === 'pending-review') {
          page.status = 'pending-review';
        }
        page.hasUnpublishedDraft = true;
        store.appendRevision({
          entityType: 'page',
          entityId: page.id,
          entityTitle: page.name,
          action: 'save-draft',
          actorEmail: req.adminUser!.email,
          summary: `Staged draft for "${page.name}" (${page.route}).`,
          snapshotJson: JSON.stringify(cleanSnapshot),
        });
      }

      page.syncStatus = 'cms-synced';
      page.updatedAt = now;
      page.updatedBy = req.adminUser!.name;
      store.save();

      store.appendAudit({
        actorEmail: req.adminUser!.email,
        actorRole: req.adminUser!.role,
        action: mode === 'publish' ? 'PUBLISH_PAGE' : 'SAVE_PAGE_DRAFT',
        module: 'pageBuilder',
        targetId: page.id,
        summary: `${mode === 'publish' ? 'Published' : 'Saved draft on'} page "${page.name}" (${page.route}).`,
      });

      res.json({ page });
    },
  );

  app.post(
    '/api/admin/pages/sync-all',
    requireModule('websiteInventory', 'write'),
    (req: AuthenticatedRequest, res) => {
      const backup = store.createBackup();
      const db = store.getSnapshot();
      const added = ensureCanonicalSeedData(db);
      for (const page of db.pages) {
        page.cmsConnected = true;
        page.syncStatus = 'cms-synced';
      }
      store.appendRevision({
        entityType: 'page',
        entityId: 'site-wide-sync',
        entityTitle: 'All 28 Public Routes & Catalogs',
        action: 'sync-backup',
        actorEmail: req.adminUser!.email,
        summary: `Synchronized canonical site inventory (+${added.addedPages} pages, +${added.addedAssets} assets) with pre-sync backup ${backup.fileName}.`,
        snapshotJson: JSON.stringify({ added, backup: backup.fileName }),
      });
      store.appendAudit({
        actorEmail: req.adminUser!.email,
        actorRole: req.adminUser!.role,
        action: 'SYNC_AND_BACKUP_WEBSITE',
        module: 'websiteInventory',
        targetId: backup.fileName,
        summary: `Created pre-sync backup ${backup.fileName} and synced ${db.pages.length} canonical routes.`,
      });

      res.json({
        ok: true,
        backup,
        added,
        totalPages: db.pages.length,
      });
    },
  );

  app.get('/api/admin/revisions', requireModule('pageBuilder', 'read'), (req, res) => {
    const db = store.getSnapshot();
    const entityId = String(req.query.entityId ?? '').trim();
    const revisions = entityId
      ? db.revisions.filter((r) => r.entityId === entityId)
      : db.revisions;
    res.json({ revisions });
  });

  app.post(
    '/api/admin/revisions/:id/restore',
    requireModule('pageBuilder', 'write'),
    (req: AuthenticatedRequest, res) => {
      const db = store.getSnapshot();
      const rev = db.revisions.find((r) => r.id === req.params.id);
      if (!rev) {
        res.status(404).json({ error: 'Revision record not found.' });
        return;
      }

      const now = new Date().toISOString();
      if (rev.entityType === 'page') {
        const page = db.pages.find((p) => p.id === rev.entityId);
        if (!page) {
          res.status(404).json({ error: 'Target page no longer exists.' });
          return;
        }
        const restored = JSON.parse(rev.snapshotJson) as PageSnapshotPayload;
        page.publishedVersion = JSON.parse(JSON.stringify(restored)) as PageSnapshotPayload;
        page.draftVersion = JSON.parse(JSON.stringify(restored)) as PageSnapshotPayload;
        page.status = 'published';
        page.hasUnpublishedDraft = false;
        page.updatedAt = now;
        page.publishedAt = now;
        page.updatedBy = req.adminUser!.name;

        store.appendRevision({
          entityType: 'page',
          entityId: page.id,
          entityTitle: page.name,
          action: 'restore',
          actorEmail: req.adminUser!.email,
          summary: `Restored "${page.name}" from revision ${rev.id}.`,
          snapshotJson: rev.snapshotJson,
        });
        store.appendAudit({
          actorEmail: req.adminUser!.email,
          actorRole: req.adminUser!.role,
          action: 'RESTORE_PAGE_REVISION',
          module: 'pageBuilder',
          targetId: page.id,
          summary: `Restored page "${page.name}" from revision ${rev.id}.`,
        });
        res.json({ ok: true, page });
        return;
      }

      if (rev.entityType === 'carousel') {
        const carousel = db.carousels.find((c) => c.id === rev.entityId);
        if (!carousel) {
          res.status(404).json({ error: 'Target carousel no longer exists.' });
          return;
        }
        const slides = JSON.parse(rev.snapshotJson) as CarouselSlideConfig[];
        carousel.publishedSlides = JSON.parse(JSON.stringify(slides)) as CarouselSlideConfig[];
        carousel.draftSlides = JSON.parse(JSON.stringify(slides)) as CarouselSlideConfig[];
        carousel.status = 'published';
        carousel.hasUnpublishedDraft = false;
        carousel.updatedAt = now;

        store.appendAudit({
          actorEmail: req.adminUser!.email,
          actorRole: req.adminUser!.role,
          action: 'RESTORE_CAROUSEL_REVISION',
          module: 'carousels',
          targetId: carousel.id,
          summary: `Restored carousel "${carousel.name}" from revision ${rev.id}.`,
        });
        res.json({ ok: true, carousel });
        return;
      }

      res.status(400).json({ error: 'Revision type cannot be automatically restored.' });
    },
  );

  // Carousels
  app.get('/api/admin/carousels', requireModule('carousels', 'read'), (_req, res) => {
    res.json({ carousels: store.getSnapshot().carousels });
  });

  app.put(
    '/api/admin/carousels/:id',
    requireModule('carousels', 'write'),
    (req: AuthenticatedRequest, res) => {
      const db = store.getSnapshot();
      const carousel = db.carousels.find((c) => c.id === req.params.id);
      if (!carousel) {
        res.status(404).json({ error: 'Carousel configuration not found.' });
        return;
      }
      const b = (req.body ?? {}) as {
        mode?: 'draft' | 'publish';
        slides?: CarouselSlideConfig[];
        autoAdvanceMs?: number;
        transitionStyle?: CarouselConfigRecord['transitionStyle'];
      };
      if (!Array.isArray(b.slides)) {
        res.status(400).json({ error: 'Slides array is required.' });
        return;
      }

      const mode = b.mode === 'publish' ? 'publish' : 'draft';
      const normalizedSlides = b.slides.map((s, idx) => ({
        ...s,
        order: idx + 1,
      }));
      const now = new Date().toISOString();

      if (typeof b.autoAdvanceMs === 'number' && Number.isFinite(b.autoAdvanceMs)) {
        carousel.autoAdvanceMs = Math.max(1500, Math.min(20000, Math.round(b.autoAdvanceMs)));
      }
      if (
        b.transitionStyle === 'slide-rtl' ||
        b.transitionStyle === 'crossfade' ||
        b.transitionStyle === 'cinematic-pan'
      ) {
        carousel.transitionStyle = b.transitionStyle;
      }

      if (mode === 'publish') {
        store.appendRevision({
          entityType: 'carousel',
          entityId: carousel.id,
          entityTitle: carousel.name,
          action: 'publish',
          actorEmail: req.adminUser!.email,
          summary: `Published carousel "${carousel.name}" (${normalizedSlides.filter((s) => s.enabled).length} active slides).`,
          snapshotJson: JSON.stringify(carousel.publishedSlides),
        });
        carousel.draftSlides = normalizedSlides;
        carousel.publishedSlides = JSON.parse(
          JSON.stringify(normalizedSlides),
        ) as CarouselSlideConfig[];
        carousel.status = 'published';
        carousel.hasUnpublishedDraft = false;
      } else {
        carousel.draftSlides = normalizedSlides;
        carousel.hasUnpublishedDraft = true;
      }

      carousel.updatedAt = now;
      store.save();

      store.appendAudit({
        actorEmail: req.adminUser!.email,
        actorRole: req.adminUser!.role,
        action: mode === 'publish' ? 'PUBLISH_CAROUSEL' : 'SAVE_CAROUSEL_DRAFT',
        module: 'carousels',
        targetId: carousel.id,
        summary: `${mode === 'publish' ? 'Published' : 'Staged draft for'} carousel "${carousel.name}".`,
      });

      res.json({ carousel });
    },
  );

  // Enhanced Media Assets Library
  app.get('/api/admin/media-assets', (req: AuthenticatedRequest, res) => {
    if (!authenticateAdmin(req) || !req.adminUser) {
      res.status(401).json({ error: 'Authentication required.', code: 'UNAUTHENTICATED' });
      return;
    }
    const canGallery = hasModulePermission(req.adminUser.role, 'gallery', 'read');
    const canVideo = hasModulePermission(req.adminUser.role, 'video', 'read');
    if (!canGallery && !canVideo) {
      res.status(403).json({
        error: `Role ${req.adminUser.role} lacks read access to media library.`,
        code: 'FORBIDDEN',
      });
      return;
    }
    const db = store.getSnapshot();
    const assets = db.mediaAssets
      .filter((a) => (a.kind === 'video' ? canVideo : canGallery))
      .map((a) => ({
        ...a,
        usageLocations: computeMediaUsageLocations(a, db.pages, db.carousels),
      }));
    res.json({ assets });
  });

  app.post('/api/admin/media-assets', (req: AuthenticatedRequest, res) => {
    if (!authenticateAdmin(req) || !req.adminUser) {
      res.status(401).json({ error: 'Authentication required.', code: 'UNAUTHENTICATED' });
      return;
    }
    const db = store.getSnapshot();
    const b = (req.body ?? {}) as Record<string, unknown>;
    const kind: MediaAssetRecord['kind'] = b.kind === 'video' ? 'video' : 'image';
    const targetMod: AdminModuleId = kind === 'video' ? 'video' : 'gallery';
    if (!hasModulePermission(req.adminUser.role, targetMod, 'write')) {
      res.status(403).json({ error: `Role ${req.adminUser.role} lacks write access to ${targetMod}.` });
      return;
    }

    const title = String(b.title ?? '').trim();
    if (!title) {
      res.status(400).json({ error: 'Asset title is required.' });
      return;
    }

    let resolvedUrl = typeof b.url === 'string' ? b.url.trim() : '';
    const imageBase64 = typeof b.imageBase64 === 'string' ? b.imageBase64.trim() : '';
    if (imageBase64) {
      const match = /^data:image\/(png|jpeg|jpg|webp);base64,([A-Za-z0-9+/=]+)$/i.exec(imageBase64);
      if (!match) {
        res.status(400).json({ error: 'Uploaded image must be PNG, JPEG, or WebP format.' });
        return;
      }
      const ext = match[1].toLowerCase() === 'jpeg' ? 'jpg' : match[1].toLowerCase();
      const buf = Buffer.from(match[2], 'base64');
      if (buf.length > 8 * 1024 * 1024) {
        res.status(413).json({ error: 'Uploaded image exceeds 8 MB limit.' });
        return;
      }
      const fileName = `asset-${crypto.randomUUID().slice(0, 10)}.${ext}`;
      fs.writeFileSync(path.join(uploadsDir, fileName), buf);
      resolvedUrl = `/uploads/${fileName}`;
    }

    if (!resolvedUrl) {
      res.status(400).json({ error: 'Provide either an uploaded file or valid media URL.' });
      return;
    }

    const now = new Date().toISOString();
    const asset: MediaAssetRecord = {
      id: `ast-${crypto.randomUUID().slice(0, 8)}`,
      kind,
      category: (b.category as MediaAssetRecord['category']) || 'festival',
      title,
      description: String(b.description ?? '').trim(),
      altText: String(b.altText ?? title).trim(),
      caption: String(b.caption ?? title).trim(),
      copyright: String(b.copyright ?? '© Aishwarya Sarvahith Foundation').trim(),
      source: String(b.source ?? 'Mahotsav Secretariat Media Desk').trim(),
      language: String(b.language ?? 'English · Multilingual').trim(),
      tags: Array.isArray(b.tags)
        ? b.tags.map((t) => String(t).trim()).filter(Boolean)
        : typeof b.tags === 'string'
          ? b.tags.split(',').map((t) => t.trim()).filter(Boolean)
          : [],
      url: resolvedUrl,
      focalPoint: String(b.focalPoint ?? '50% 45%').trim(),
      featured: Boolean(b.featured),
      published: b.published !== false,
      usageLocations: [],
      createdAt: now,
      updatedAt: now,
    };

    db.mediaAssets.unshift(asset);
    store.appendAudit({
      actorEmail: req.adminUser.email,
      actorRole: req.adminUser.role,
      action: 'CREATE_MEDIA_ASSET',
      module: targetMod,
      targetId: asset.id,
      summary: `Uploaded ${asset.kind} asset "${asset.title}".`,
    });

    res.status(201).json({ asset });
  });

  app.patch('/api/admin/media-assets/:id', (req: AuthenticatedRequest, res) => {
    if (!authenticateAdmin(req) || !req.adminUser) {
      res.status(401).json({ error: 'Authentication required.' });
      return;
    }
    const db = store.getSnapshot();
    const asset = db.mediaAssets.find((a) => a.id === req.params.id);
    if (!asset) {
      res.status(404).json({ error: 'Media asset not found.' });
      return;
    }
    const targetMod: AdminModuleId = asset.kind === 'video' ? 'video' : 'gallery';
    if (!hasModulePermission(req.adminUser.role, targetMod, 'write')) {
      res.status(403).json({ error: `Role ${req.adminUser.role} lacks write access to ${targetMod}.` });
      return;
    }

    const b = (req.body ?? {}) as Partial<MediaAssetRecord>;
    if (typeof b.title === 'string' && b.title.trim()) asset.title = b.title.trim();
    if (typeof b.description === 'string') asset.description = b.description.trim();
    if (typeof b.altText === 'string') asset.altText = b.altText.trim();
    if (typeof b.caption === 'string') asset.caption = b.caption.trim();
    if (typeof b.copyright === 'string') asset.copyright = b.copyright.trim();
    if (typeof b.focalPoint === 'string') asset.focalPoint = b.focalPoint.trim();
    if (typeof b.featured === 'boolean') asset.featured = b.featured;
    if (typeof b.published === 'boolean') asset.published = b.published;
    if (Array.isArray(b.tags)) asset.tags = b.tags.map((t) => String(t).trim()).filter(Boolean);
    asset.updatedAt = new Date().toISOString();
    asset.usageLocations = computeMediaUsageLocations(asset, db.pages, db.carousels);

    store.appendAudit({
      actorEmail: req.adminUser.email,
      actorRole: req.adminUser.role,
      action: 'UPDATE_MEDIA_ASSET',
      module: targetMod,
      targetId: asset.id,
      summary: `Updated media asset "${asset.title}" metadata.`,
    });

    res.json({ asset });
  });

  app.post('/api/admin/media-assets/:id/replace', (req: AuthenticatedRequest, res) => {
    if (!authenticateAdmin(req) || !req.adminUser) {
      res.status(401).json({ error: 'Authentication required.' });
      return;
    }
    const db = store.getSnapshot();
    const asset = db.mediaAssets.find((a) => a.id === req.params.id);
    if (!asset) {
      res.status(404).json({ error: 'Media asset not found.' });
      return;
    }
    const targetMod: AdminModuleId = asset.kind === 'video' ? 'video' : 'gallery';
    if (!hasModulePermission(req.adminUser.role, targetMod, 'write')) {
      res.status(403).json({ error: `Role ${req.adminUser.role} lacks write access to ${targetMod}.` });
      return;
    }

    const b = (req.body ?? {}) as { imageBase64?: string; url?: string; altText?: string };
    let newUrl = typeof b.url === 'string' ? b.url.trim() : '';
    if (typeof b.imageBase64 === 'string' && b.imageBase64.trim()) {
      const match = /^data:image\/(png|jpeg|jpg|webp);base64,([A-Za-z0-9+/=]+)$/i.exec(
        b.imageBase64.trim(),
      );
      if (!match) {
        res.status(400).json({ error: 'Replacement image must be PNG, JPEG, or WebP.' });
        return;
      }
      const ext = match[1].toLowerCase() === 'jpeg' ? 'jpg' : match[1].toLowerCase();
      const buf = Buffer.from(match[2], 'base64');
      if (buf.length > 8 * 1024 * 1024) {
        res.status(413).json({ error: 'Replacement image exceeds 8 MB limit.' });
        return;
      }
      const fileName = `asset-rep-${crypto.randomUUID().slice(0, 10)}.${ext}`;
      fs.writeFileSync(path.join(uploadsDir, fileName), buf);
      newUrl = `/uploads/${fileName}`;
    }

    if (!newUrl) {
      res.status(400).json({ error: 'Replacement file or URL is required.' });
      return;
    }

    const oldUrl = asset.url;
    asset.url = newUrl;
    if (typeof b.altText === 'string' && b.altText.trim()) {
      asset.altText = b.altText.trim();
    }
    asset.updatedAt = new Date().toISOString();

    const propagation = replaceMediaReferences({
      assetId: asset.id,
      assetKey: asset.assetKey,
      oldUrl,
      newUrl,
      newAltText: asset.altText,
      pages: db.pages,
      carousels: db.carousels,
    });

    asset.usageLocations = computeMediaUsageLocations(asset, db.pages, db.carousels);

    store.appendAudit({
      actorEmail: req.adminUser.email,
      actorRole: req.adminUser.role,
      action: 'REPLACE_MEDIA_ASSET',
      module: targetMod,
      targetId: asset.id,
      summary: `Replaced asset "${asset.title}" across ${propagation.updatedPagesCount} page(s) and ${propagation.updatedSlidesCount} carousel slide(s).`,
    });

    res.json({ asset, propagation });
  });

  app.delete('/api/admin/media-assets/:id', (req: AuthenticatedRequest, res) => {
    if (!authenticateAdmin(req) || !req.adminUser) {
      res.status(401).json({ error: 'Authentication required.' });
      return;
    }
    const db = store.getSnapshot();
    const idx = db.mediaAssets.findIndex((a) => a.id === req.params.id);
    if (idx === -1) {
      res.status(404).json({ error: 'Media asset not found.' });
      return;
    }
    const target = db.mediaAssets[idx];
    const targetMod: AdminModuleId = target.kind === 'video' ? 'video' : 'gallery';
    if (!hasModulePermission(req.adminUser.role, targetMod, 'write')) {
      res.status(403).json({ error: `Role ${req.adminUser.role} lacks write access to ${targetMod}.` });
      return;
    }
    db.mediaAssets.splice(idx, 1);
    store.appendAudit({
      actorEmail: req.adminUser.email,
      actorRole: req.adminUser.role,
      action: 'DELETE_MEDIA_ASSET',
      module: targetMod,
      targetId: target.id,
      summary: `Removed media asset "${target.title}".`,
    });
    res.json({ ok: true });
  });

  // Bhagavad Gita Chapters & Verses Studio
  app.get('/api/admin/scripture', requireModule('scripture', 'read'), (_req, res) => {
    const db = store.getSnapshot();
    res.json({
      chapters: db.scriptureChapters,
      verses: db.scriptureVerses,
    });
  });

  app.put(
    '/api/admin/scripture/chapters/:num',
    requireModule('scripture', 'write'),
    (req: AuthenticatedRequest, res) => {
      const db = store.getSnapshot();
      const chNum = Number(req.params.num);
      const chapter = db.scriptureChapters.find((c) => c.chapterNumber === chNum);
      if (!chapter) {
        res.status(404).json({ error: 'Chapter not found.' });
        return;
      }
      const b = (req.body ?? {}) as Partial<typeof chapter>;
      if (typeof b.titleEn === 'string' && b.titleEn.trim()) chapter.titleEn = b.titleEn.trim();
      if (typeof b.titleSanskrit === 'string' && b.titleSanskrit.trim()) chapter.titleSanskrit = b.titleSanskrit.trim();
      if (typeof b.titleHi === 'string') chapter.titleHi = b.titleHi.trim();
      if (typeof b.titleTe === 'string') chapter.titleTe = b.titleTe.trim();
      if (typeof b.summaryEn === 'string') chapter.summaryEn = b.summaryEn.trim();
      if (typeof b.summaryHi === 'string') chapter.summaryHi = b.summaryHi.trim();
      if (typeof b.summaryTe === 'string') chapter.summaryTe = b.summaryTe.trim();
      if (typeof b.keyTeaching === 'string') chapter.keyTeaching = b.keyTeaching.trim();
      if (typeof b.audioUrl === 'string') chapter.audioUrl = b.audioUrl.trim() || undefined;
      if (b.status === 'draft' || b.status === 'pending-review' || b.status === 'published') {
        chapter.status = b.status;
      }
      chapter.updatedAt = new Date().toISOString();

      store.appendAudit({
        actorEmail: req.adminUser!.email,
        actorRole: req.adminUser!.role,
        action: 'UPDATE_GITA_CHAPTER',
        module: 'scripture',
        targetId: `chapter-${chNum}`,
        summary: `Updated Gita Chapter ${chNum} (${chapter.status}).`,
      });
      res.json({ chapter });
    },
  );

  app.post(
    '/api/admin/scripture/verses',
    requireModule('scripture', 'write'),
    (req: AuthenticatedRequest, res) => {
      const db = store.getSnapshot();
      const b = (req.body ?? {}) as Partial<ScriptureVerseRecord>;
      const chapterNumber = Math.max(1, Math.min(18, Number(b.chapterNumber) || 1));
      const verseNumber = Math.max(1, Number(b.verseNumber) || 1);
      const verse: ScriptureVerseRecord = {
        id: `bg-${chapterNumber}-${verseNumber}-${crypto.randomUUID().slice(0, 4)}`,
        chapterNumber,
        verseNumber,
        sanskritDevanagari: String(b.sanskritDevanagari ?? '').trim(),
        transliteration: String(b.transliteration ?? '').trim(),
        translationEn: String(b.translationEn ?? '').trim(),
        translationHi: String(b.translationHi ?? '').trim(),
        translationTe: String(b.translationTe ?? '').trim(),
        commentaryNote: String(b.commentaryNote ?? '').trim(),
        audioUrl: typeof b.audioUrl === 'string' && b.audioUrl.trim() ? b.audioUrl.trim() : undefined,
        status: b.status === 'draft' || b.status === 'pending-review' ? b.status : 'published',
        updatedAt: new Date().toISOString(),
      };
      if (!verse.sanskritDevanagari || !verse.translationEn) {
        res.status(400).json({ error: 'Sanskrit shloka text and English translation are required.' });
        return;
      }
      db.scriptureVerses.push(verse);
      store.appendAudit({
        actorEmail: req.adminUser!.email,
        actorRole: req.adminUser!.role,
        action: 'ADD_GITA_VERSE',
        module: 'scripture',
        targetId: verse.id,
        summary: `Added BG ${verse.chapterNumber}.${verse.verseNumber} (${verse.status}).`,
      });
      res.status(201).json({ verse });
    },
  );

  app.patch(
    '/api/admin/scripture/verses/:id',
    requireModule('scripture', 'write'),
    (req: AuthenticatedRequest, res) => {
      const db = store.getSnapshot();
      const verse = db.scriptureVerses.find((v) => v.id === req.params.id);
      if (!verse) {
        res.status(404).json({ error: 'Verse not found.' });
        return;
      }
      const b = (req.body ?? {}) as Partial<ScriptureVerseRecord>;
      if (typeof b.sanskritDevanagari === 'string') verse.sanskritDevanagari = b.sanskritDevanagari.trim();
      if (typeof b.transliteration === 'string') verse.transliteration = b.transliteration.trim();
      if (typeof b.translationEn === 'string') verse.translationEn = b.translationEn.trim();
      if (typeof b.translationHi === 'string') verse.translationHi = b.translationHi.trim();
      if (typeof b.translationTe === 'string') verse.translationTe = b.translationTe.trim();
      if (typeof b.commentaryNote === 'string') verse.commentaryNote = b.commentaryNote.trim();
      if (typeof b.audioUrl === 'string') verse.audioUrl = b.audioUrl.trim() || undefined;
      if (b.status === 'draft' || b.status === 'pending-review' || b.status === 'published') {
        verse.status = b.status;
      }
      verse.updatedAt = new Date().toISOString();

      store.appendAudit({
        actorEmail: req.adminUser!.email,
        actorRole: req.adminUser!.role,
        action: 'UPDATE_GITA_VERSE',
        module: 'scripture',
        targetId: verse.id,
        summary: `Updated BG ${verse.chapterNumber}.${verse.verseNumber} (${verse.status}).`,
      });
      res.json({ verse });
    },
  );

  app.delete(
    '/api/admin/scripture/verses/:id',
    requireModule('scripture', 'write'),
    (req: AuthenticatedRequest, res) => {
      const db = store.getSnapshot();
      const idx = db.scriptureVerses.findIndex((v) => v.id === req.params.id);
      if (idx === -1) {
        res.status(404).json({ error: 'Verse not found.' });
        return;
      }
      const [removed] = db.scriptureVerses.splice(idx, 1);
      store.appendAudit({
        actorEmail: req.adminUser!.email,
        actorRole: req.adminUser!.role,
        action: 'DELETE_GITA_VERSE',
        module: 'scripture',
        targetId: removed.id,
        summary: `Removed verse BG ${removed.chapterNumber}.${removed.verseNumber}.`,
      });
      res.json({ ok: true });
    },
  );

  // Story Scenes & 3D GLB Inspector
  app.get('/api/admin/story/scenes', requireModule('story', 'read'), (_req, res) => {
    res.json({ scenes: store.getSnapshot().storyScenes });
  });

  app.put(
    '/api/admin/story/scenes/:id',
    requireModule('story', 'write'),
    (req: AuthenticatedRequest, res) => {
      const db = store.getSnapshot();
      const scene = db.storyScenes.find((s) => s.id === req.params.id);
      if (!scene) {
        res.status(404).json({ error: 'Story scene not found.' });
        return;
      }
      const b = (req.body ?? {}) as Partial<typeof scene>;
      if (b.title) scene.title = b.title;
      if (typeof b.chapterTag === 'string') scene.chapterTag = b.chapterTag.trim();
      if (b.dialogue) scene.dialogue = b.dialogue;
      if (b.narration) scene.narration = b.narration;
      if (typeof b.primaryImageUrl === 'string' && b.primaryImageUrl.trim()) {
        scene.primaryImageUrl = b.primaryImageUrl.trim();
      }
      if (typeof b.audioUrl === 'string') scene.audioUrl = b.audioUrl.trim() || undefined;
      if (b.status === 'draft' || b.status === 'pending-review' || b.status === 'published') {
        scene.status = b.status;
      }
      scene.updatedAt = new Date().toISOString();

      store.appendAudit({
        actorEmail: req.adminUser!.email,
        actorRole: req.adminUser!.role,
        action: 'UPDATE_STORY_SCENE',
        module: 'story',
        targetId: scene.id,
        summary: `Updated Story Scene ${scene.sceneNumber} (${scene.status}).`,
      });
      res.json({ scene });
    },
  );

  app.get('/api/admin/story/inspect-glbs', requireModule('story', 'read'), (_req, res) => {
    const models = inspectAllStoryGlbs(rootDir);
    res.json({ models });
  });

  // Structured Collections CRUD (events, schedule, participation, leadership, partners, announcements, faqs)
  const mapCollectionModule = (kind: string): AdminModuleId | null => {
    switch (kind) {
      case 'events':
        return 'events';
      case 'schedule':
        return 'schedule';
      case 'participation':
        return 'participationCategories';
      case 'leadership':
        return 'leadership';
      case 'partners':
        return 'partners';
      case 'announcements':
        return 'news';
      case 'faqs':
        return 'faqs';
      default:
        return null;
    }
  };

  app.get('/api/admin/collections/:kind', (req: AuthenticatedRequest, res) => {
    if (!authenticateAdmin(req) || !req.adminUser) {
      res.status(401).json({ error: 'Authentication required.' });
      return;
    }
    const mod = mapCollectionModule(req.params.kind);
    if (!mod) {
      res.status(404).json({ error: 'Unknown collection type.' });
      return;
    }
    if (!hasModulePermission(req.adminUser.role, mod, 'read')) {
      res.status(403).json({ error: `Role ${req.adminUser.role} lacks read access to ${mod}.` });
      return;
    }
    const db = store.getSnapshot();
    const items = db.collections
      .filter((c) => c.kind === req.params.kind)
      .sort((a, b) => a.order - b.order);
    res.json({ items });
  });

  app.post('/api/admin/collections/:kind', (req: AuthenticatedRequest, res) => {
    if (!authenticateAdmin(req) || !req.adminUser) {
      res.status(401).json({ error: 'Authentication required.' });
      return;
    }
    const kind = req.params.kind as StructuredCollectionKind;
    const mod = mapCollectionModule(kind);
    if (!mod) {
      res.status(404).json({ error: 'Unknown collection type.' });
      return;
    }
    if (!hasModulePermission(req.adminUser.role, mod, 'write')) {
      res.status(403).json({ error: `Role ${req.adminUser.role} lacks write access to ${mod}.` });
      return;
    }

    const b = (req.body ?? {}) as Partial<StructuredCollectionItem>;
    const title = String(b.title ?? '').trim();
    if (!title) {
      res.status(400).json({ error: 'Title is required.' });
      return;
    }

    const db = store.getSnapshot();
    const siblingCount = db.collections.filter((c) => c.kind === kind).length;
    const item: StructuredCollectionItem = {
      id: `${kind.slice(0, 3)}-${crypto.randomUUID().slice(0, 8)}`,
      kind,
      title,
      subtitle: String(b.subtitle ?? '').trim(),
      description: String(b.description ?? '').trim(),
      dateLabel: b.dateLabel ? String(b.dateLabel).trim() : undefined,
      locationLabel: b.locationLabel ? String(b.locationLabel).trim() : undefined,
      badgeLabel: b.badgeLabel ? String(b.badgeLabel).trim() : undefined,
      href: b.href ? String(b.href).trim() : undefined,
      imageUrl: b.imageUrl ? String(b.imageUrl).trim() : undefined,
      language:
        b.language === 'hi' || b.language === 'te' || b.language === 'sa' ? b.language : 'en',
      order: typeof b.order === 'number' ? b.order : siblingCount + 1,
      featured: Boolean(b.featured),
      status:
        b.status === 'draft' || b.status === 'pending-review' ? b.status : 'published',
      meta: b.meta && typeof b.meta === 'object' ? b.meta : {},
      updatedAt: new Date().toISOString(),
    };
    db.collections.push(item);
    store.appendAudit({
      actorEmail: req.adminUser.email,
      actorRole: req.adminUser.role,
      action: 'CREATE_COLLECTION_ITEM',
      module: mod,
      targetId: item.id,
      summary: `Created [${kind}] "${item.title}" (${item.status}).`,
    });
    res.status(201).json({ item });
  });

  app.patch('/api/admin/collections/:kind/:id', (req: AuthenticatedRequest, res) => {
    if (!authenticateAdmin(req) || !req.adminUser) {
      res.status(401).json({ error: 'Authentication required.' });
      return;
    }
    const kind = req.params.kind as StructuredCollectionKind;
    const mod = mapCollectionModule(kind);
    if (!mod) {
      res.status(404).json({ error: 'Unknown collection type.' });
      return;
    }
    if (!hasModulePermission(req.adminUser.role, mod, 'write')) {
      res.status(403).json({ error: `Role ${req.adminUser.role} lacks write access to ${mod}.` });
      return;
    }
    const db = store.getSnapshot();
    const item = db.collections.find((c) => c.id === req.params.id && c.kind === kind);
    if (!item) {
      res.status(404).json({ error: 'Collection record not found.' });
      return;
    }

    const b = (req.body ?? {}) as Partial<StructuredCollectionItem>;
    if (typeof b.title === 'string' && b.title.trim()) item.title = b.title.trim();
    if (typeof b.subtitle === 'string') item.subtitle = b.subtitle.trim();
    if (typeof b.description === 'string') item.description = b.description.trim();
    if (typeof b.dateLabel === 'string') item.dateLabel = b.dateLabel.trim() || undefined;
    if (typeof b.locationLabel === 'string') item.locationLabel = b.locationLabel.trim() || undefined;
    if (typeof b.badgeLabel === 'string') item.badgeLabel = b.badgeLabel.trim() || undefined;
    if (typeof b.href === 'string') item.href = b.href.trim() || undefined;
    if (typeof b.featured === 'boolean') item.featured = b.featured;
    if (typeof b.order === 'number') item.order = b.order;
    if (
      b.status === 'draft' ||
      b.status === 'pending-review' ||
      b.status === 'published'
    ) {
      item.status = b.status;
    }
    item.updatedAt = new Date().toISOString();

    store.appendAudit({
      actorEmail: req.adminUser.email,
      actorRole: req.adminUser.role,
      action: 'UPDATE_COLLECTION_ITEM',
      module: mod,
      targetId: item.id,
      summary: `Updated [${kind}] "${item.title}" (${item.status}).`,
    });
    res.json({ item });
  });

  app.delete('/api/admin/collections/:kind/:id', (req: AuthenticatedRequest, res) => {
    if (!authenticateAdmin(req) || !req.adminUser) {
      res.status(401).json({ error: 'Authentication required.' });
      return;
    }
    const kind = req.params.kind as StructuredCollectionKind;
    const mod = mapCollectionModule(kind);
    if (!mod) {
      res.status(404).json({ error: 'Unknown collection type.' });
      return;
    }
    if (!hasModulePermission(req.adminUser.role, mod, 'write')) {
      res.status(403).json({ error: `Role ${req.adminUser.role} lacks write access to ${mod}.` });
      return;
    }
    const db = store.getSnapshot();
    const idx = db.collections.findIndex((c) => c.id === req.params.id && c.kind === kind);
    if (idx === -1) {
      res.status(404).json({ error: 'Collection record not found.' });
      return;
    }
    const [removed] = db.collections.splice(idx, 1);
    store.appendAudit({
      actorEmail: req.adminUser.email,
      actorRole: req.adminUser.role,
      action: 'DELETE_COLLECTION_ITEM',
      module: mod,
      targetId: removed.id,
      summary: `Deleted [${kind}] "${removed.title}".`,
    });
    res.json({ ok: true });
  });

  // ---------------------------------------------------------------------------
  // 10. RBAC USER MANAGEMENT, AUDIT LOGS & SYSTEM SETTINGS / BACKUPS
  // ---------------------------------------------------------------------------
  app.get('/api/admin/users', requireModule('users', 'read'), (_req, res) => {
    const db = store.getSnapshot();
    res.json({
      users: db.users.map(({ passwordHash: _ph, ...safe }) => safe),
      availableRoles: ALL_ADMIN_ROLES,
    });
  });

  app.post(
    '/api/admin/users',
    requireModule('users', 'write'),
    (req: AuthenticatedRequest, res) => {
      const db = store.getSnapshot();
      const b = (req.body ?? {}) as {
        name?: string;
        email?: string;
        password?: string;
        role?: AdminRole;
      };
      const name = String(b.name ?? '').trim();
      const email = String(b.email ?? '').trim().toLowerCase();
      const password = String(b.password ?? '');
      const role = ALL_ADMIN_ROLES.includes(b.role as AdminRole)
        ? (b.role as AdminRole)
        : 'CONTENT_EDITOR';

      if (name.length < 2 || !email.includes('@') || password.length < 8) {
        res.status(400).json({
          error: 'Valid name, email, and password (minimum 8 characters) are required.',
        });
        return;
      }
      if (db.users.some((u) => u.email.toLowerCase() === email)) {
        res.status(409).json({ error: 'An administrator with this email already exists.' });
        return;
      }

      const newUser = {
        id: `usr-${crypto.randomUUID().slice(0, 8)}`,
        name,
        email,
        role,
        passwordHash: hashPassword(password),
        active: true,
        // The creating administrator explicitly chose this password, unlike the generated
        // bootstrap credential, so no forced rotation is required for a freshly created account.
        mustChangePassword: false,
        passwordUpdatedAt: new Date().toISOString(),
        createdAt: new Date().toISOString(),
        lastLoginAt: null,
      };
      db.users.push(newUser);
      store.appendAudit({
        actorEmail: req.adminUser!.email,
        actorRole: req.adminUser!.role,
        action: 'CREATE_ADMIN_USER',
        module: 'users',
        targetId: newUser.id,
        summary: `Provisioned ${newUser.email} with role ${newUser.role}.`,
      });
      const { passwordHash: _ph, ...safe } = newUser;
      res.status(201).json({ user: safe });
    },
  );

  app.patch(
    '/api/admin/users/:id',
    requireModule('users', 'write'),
    (req: AuthenticatedRequest, res) => {
      const db = store.getSnapshot();
      const target = db.users.find((u) => u.id === req.params.id);
      if (!target) {
        res.status(404).json({ error: 'User not found.' });
        return;
      }
      const b = (req.body ?? {}) as { role?: AdminRole; active?: boolean; password?: string };
      if (b.role && ALL_ADMIN_ROLES.includes(b.role)) target.role = b.role;
      if (typeof b.active === 'boolean') target.active = b.active;

      let passwordRotated = false;
      if (typeof b.password === 'string' && b.password.length > 0) {
        if (b.password.length < 8) {
          res.status(400).json({ error: 'New password must be at least 8 characters.' });
          return;
        }
        target.passwordHash = hashPassword(b.password);
        // Force the affected account to set its own permanent password on next login.
        target.mustChangePassword = true;
        target.passwordUpdatedAt = new Date().toISOString();
        passwordRotated = true;
      }

      store.appendAudit({
        actorEmail: req.adminUser!.email,
        actorRole: req.adminUser!.role,
        action: 'UPDATE_ADMIN_USER',
        module: 'users',
        targetId: target.id,
        summary: `Updated ${target.email}: role=${target.role}, active=${target.active}${
          passwordRotated ? ', password reset by administrator' : ''
        }.`,
      });
      const { passwordHash: _ph, ...safe } = target;
      res.json({ user: safe });
    },
  );

  app.get('/api/admin/audit', requireModule('audit', 'read'), (_req, res) => {
    res.json({ auditLogs: store.getSnapshot().auditLogs });
  });

  app.get('/api/admin/settings', requireModule('settings', 'read'), (_req, res) => {
    const db = store.getSnapshot();
    res.json({
      settings: db.settings,
      backups: store.listBackups(),
      gatewayStatus: getPaymentGatewayStatus(),
    });
  });

  app.patch(
    '/api/admin/settings',
    requireModule('settings', 'write'),
    (req: AuthenticatedRequest, res) => {
      const db = store.getSnapshot();
      const b = (req.body ?? {}) as Partial<typeof db.settings>;
      if (typeof b.registrationOpen === 'boolean') {
        db.settings.registrationOpen = b.registrationOpen;
      }
      if (typeof b.requireVolunteerApproval === 'boolean') {
        db.settings.requireVolunteerApproval = b.requireVolunteerApproval;
      }
      if (typeof b.maintenanceBanner === 'string') {
        db.settings.maintenanceBanner = b.maintenanceBanner.trim();
      }
      if (b.defaultVoiceGender === 'female' || b.defaultVoiceGender === 'male') {
        db.settings.defaultVoiceGender = b.defaultVoiceGender;
      }
      store.appendAudit({
        actorEmail: req.adminUser!.email,
        actorRole: req.adminUser!.role,
        action: 'UPDATE_SETTINGS',
        module: 'settings',
        targetId: 'system',
        summary: `Updated global settings (registrationOpen=${db.settings.registrationOpen}).`,
      });
      res.json({ settings: db.settings });
    },
  );

  app.post(
    '/api/admin/backups',
    requireModule('settings', 'write'),
    (req: AuthenticatedRequest, res) => {
      const backup = store.createBackup();
      store.appendAudit({
        actorEmail: req.adminUser!.email,
        actorRole: req.adminUser!.role,
        action: 'CREATE_BACKUP',
        module: 'settings',
        targetId: backup.fileName,
        summary: `Created plain JSON snapshot ${backup.fileName} (${backup.sizeBytes} bytes). Not encrypted at rest.`,
      });
      res.status(201).json({ backup, backups: store.listBackups() });
    },
  );

  app.post(
    '/api/admin/backups/restore',
    requireModule('settings', 'write'),
    (req: AuthenticatedRequest, res) => {
      const fileName = String((req.body ?? {}).fileName ?? '').trim();
      if (!fileName || !store.restoreBackup(fileName)) {
        res.status(404).json({ error: 'Selected backup snapshot could not be restored.' });
        return;
      }
      store.appendAudit({
        actorEmail: req.adminUser!.email,
        actorRole: req.adminUser!.role,
        action: 'RESTORE_BACKUP',
        module: 'settings',
        targetId: fileName,
        summary: `Restored platform snapshot from ${fileName}.`,
      });
      res.json({ ok: true });
    },
  );
}
