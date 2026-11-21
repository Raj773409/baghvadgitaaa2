import crypto from 'node:crypto';
import type { Express, Request, Response } from 'express';
import {
  describePaymentMethod,
  isKnownProvider,
  isPaymentMethodFamily,
  type PaymentMethodFamily,
} from '../src/utils/paymentMethods.ts';
import { sanitizeSensitiveUtterance } from '../src/utils/voiceRegistrationParser.ts';
import { createRateLimiter } from './rateLimit.ts';
import {
  persistNotification,
  persistParticipant,
  persistPass,
  persistPayment,
} from './db/portalSync.ts';
import type {
  EntryPassRecord,
  ParticipantNotificationRecord,
  ParticipantRecord,
  PaymentRecord,
  PlatformStore,
} from './store.ts';

// ---------------------------------------------------------------------------
// Event catalogue used on entry passes
// ---------------------------------------------------------------------------

const PASS_EVENTS: Record<EntryPassRecord['eventKey'], { name: string; date: string; venue: string; prefix: string }> = {
  curtainRaiser: {
    name: 'Bhagavadgita Vishwa Ahvanam — Curtain Raiser',
    date: '2026-12-20',
    venue: 'Online Global Convocation (Vishwa Ahvanam)',
    prefix: 'CR',
  },
  mahotsav: {
    name: 'Bhagavad Gita Vishwa Mahotsav 2027',
    date: '2027-02-27',
    venue: 'Hyderabad, Telangana, India',
    prefix: 'MH',
  },
};

// ---------------------------------------------------------------------------
// Gateway mode
// ---------------------------------------------------------------------------

export function isSandboxGatewayEnabled(razorpayConfigured: boolean): boolean {
  if (razorpayConfigured) return false;
  return (process.env.PAYMENT_SANDBOX ?? '').trim().toLowerCase() !== 'disabled';
}

/** Razorpay key ids are prefixed rzp_live_ / rzp_test_. */
export function razorpayModeFromKeyId(keyId: string | undefined): 'live' | 'test' {
  return keyId?.startsWith('rzp_live_') ? 'live' : 'test';
}

// ---------------------------------------------------------------------------
// Participant session (separate cookie + derived secret from admin sessions)
// ---------------------------------------------------------------------------

const PORTAL_COOKIE = 'bgvm_portal_session';
const PORTAL_SESSION_TTL_MS = 1000 * 60 * 60 * 24 * 30;

interface PortalSessionPayload {
  pid: string;
  exp: number;
}

function derivePortalSecret(sessionSecret: string): string {
  return crypto.createHmac('sha256', sessionSecret).update('participant-portal-v1').digest('hex');
}

function signPortalToken(pid: string, secret: string): string {
  const payload: PortalSessionPayload = { pid, exp: Date.now() + PORTAL_SESSION_TTL_MS };
  const encoded = Buffer.from(JSON.stringify(payload), 'utf8').toString('base64url');
  const sig = crypto.createHmac('sha256', secret).update(encoded).digest('base64url');
  return `${encoded}.${sig}`;
}

function verifyPortalToken(token: string | undefined, secret: string): PortalSessionPayload | null {
  if (!token) return null;
  const dot = token.indexOf('.');
  if (dot <= 0) return null;
  const encoded = token.slice(0, dot);
  const sig = token.slice(dot + 1);
  const expected = crypto.createHmac('sha256', secret).update(encoded).digest('base64url');
  const a = Buffer.from(sig);
  const b = Buffer.from(expected);
  if (a.length !== b.length || !crypto.timingSafeEqual(a, b)) return null;
  try {
    const parsed = JSON.parse(Buffer.from(encoded, 'base64url').toString('utf8')) as PortalSessionPayload;
    if (!parsed.pid || !parsed.exp || Date.now() > parsed.exp) return null;
    return parsed;
  } catch {
    return null;
  }
}

function readCookie(req: Request, name: string): string | undefined {
  const header = req.headers.cookie;
  if (!header) return undefined;
  for (const part of header.split(';')) {
    const eq = part.indexOf('=');
    if (eq <= 0) continue;
    if (part.slice(0, eq).trim() === name) {
      try {
        return decodeURIComponent(part.slice(eq + 1).trim());
      } catch {
        return part.slice(eq + 1).trim();
      }
    }
  }
  return undefined;
}

function isHttps(req: Request): boolean {
  if (req.secure) return true;
  return String(req.headers['x-forwarded-proto'] ?? '').split(',')[0].trim().toLowerCase() === 'https';
}

function portalCookie(req: Request, value: string, maxAgeSeconds: number): string {
  const secure = isHttps(req) ? '; Secure' : '';
  return `${PORTAL_COOKIE}=${encodeURIComponent(value)}; HttpOnly; Path=/; SameSite=Lax; Max-Age=${maxAgeSeconds}${secure}`;
}

// ---------------------------------------------------------------------------
// Domain helpers (exported so the payment routes in routes.ts share one code path)
// ---------------------------------------------------------------------------

export function pushParticipantNotification(
  store: PlatformStore,
  participantId: string,
  entry: Pick<ParticipantNotificationRecord, 'kind' | 'tone' | 'title' | 'body'>,
): ParticipantNotificationRecord {
  const note: ParticipantNotificationRecord = {
    id: `ntf-${crypto.randomUUID().slice(0, 12)}`,
    participantId,
    read: false,
    createdAt: new Date().toISOString(),
    ...entry,
  };
  const db = store.getSnapshot();
  db.participantNotifications.unshift(note);
  if (db.participantNotifications.length > 20000) db.participantNotifications.length = 20000;
  persistNotification(note);
  return note;
}

function nextReceiptNumber(store: PlatformStore): string {
  const year = new Date().getFullYear();
  const issued = store.getSnapshot().payments.filter((p) => p.receiptNumber).length;
  return `BGVM-RCPT-${year}-${String(issued + 1).padStart(6, '0')}`;
}

function signPassPayload(passCode: string, participantId: string, secret: string): string {
  const sig = crypto.createHmac('sha256', secret).update(`${passCode}|${participantId}`).digest('hex').slice(0, 16);
  return `BGVM1.${passCode}.${sig}`;
}

export interface CaptureDetails {
  source: 'razorpay-verify' | 'razorpay-webhook' | 'sandbox';
  gatewayReference?: string;
  methodFamily?: PaymentMethodFamily | null;
  methodProvider?: string | null;
  methodLabel?: string | null;
}

/**
 * Single, idempotent capture path for every gateway. Marks the payment captured, issues a
 * receipt number and per-event entry passes, and notifies the participant. Safe to call
 * twice for the same payment (client verify + webhook both arriving).
 */
export function finalizeCapturedPayment(
  store: PlatformStore,
  payment: PaymentRecord,
  details: CaptureDetails,
  sessionSecret: string,
): { participant: ParticipantRecord | undefined; passes: EntryPassRecord[]; alreadyCaptured: boolean } {
  const db = store.getSnapshot();
  const participant = db.participants.find((p) => p.id === payment.participantId);
  const existingPasses = db.entryPasses.filter((p) => p.paymentId === payment.id);
  const alreadyCaptured = payment.status === 'captured' && existingPasses.length > 0;

  if (details.gatewayReference) payment.gatewayReference = details.gatewayReference;
  if (details.methodFamily) payment.methodFamily = details.methodFamily;
  if (details.methodProvider) payment.methodProvider = details.methodProvider;
  if (details.methodLabel) payment.methodLabel = details.methodLabel;

  if (alreadyCaptured) {
    persistPayment(payment);
    store.save();
    return { participant, passes: existingPasses, alreadyCaptured: true };
  }

  payment.status = 'captured';
  payment.capturedAt = new Date().toISOString();
  payment.failureReason = null;
  payment.receiptNumber = payment.receiptNumber || nextReceiptNumber(store);

  const passes: EntryPassRecord[] = [];
  if (participant) {
    participant.paymentStatus = 'paid';
    participant.verificationStatus = participant.verificationStatus === 'flagged' ? 'flagged' : 'verified';

    const eventKeys = (Object.keys(PASS_EVENTS) as Array<EntryPassRecord['eventKey']>).filter(
      (k) => participant.events[k],
    );
    const keys = eventKeys.length > 0 ? eventKeys : (['mahotsav'] as const);
    const passSecret = derivePortalSecret(sessionSecret);
    const tier = participant.registrationType.charAt(0).toUpperCase() + participant.registrationType.slice(1);

    for (const key of keys) {
      const event = PASS_EVENTS[key];
      const passCode = `BGVM-${event.prefix}-${crypto.randomBytes(2).toString('hex').toUpperCase()}-${crypto
        .randomBytes(2)
        .toString('hex')
        .toUpperCase()}`;
      const pass: EntryPassRecord = {
        id: `pas-${crypto.randomUUID().slice(0, 12)}`,
        participantId: participant.id,
        paymentId: payment.id,
        passCode,
        eventKey: key,
        eventName: event.name,
        eventDate: event.date,
        venue: event.venue,
        admits: participant.noOfPersons,
        tier,
        qrPayload: signPassPayload(passCode, participant.id, passSecret),
        status: 'active',
        issuedAt: new Date().toISOString(),
        checkedInAt: null,
      };
      db.entryPasses.unshift(pass);
      passes.push(pass);
      persistPass(pass);
    }

    persistParticipant(participant);
    const amount = `₹${payment.amountInr.toLocaleString('en-IN')}`;
    const method = payment.methodLabel || describePaymentMethod(payment.methodFamily, payment.methodProvider);
    pushParticipantNotification(store, participant.id, {
      kind: 'payment',
      tone: 'success',
      title: 'Payment successful',
      body: `${amount} received via ${method}. Receipt ${payment.receiptNumber}.${payment.mode === 'test' ? ' (Test mode — no real money was charged.)' : ''}`,
    });
    pushParticipantNotification(store, participant.id, {
      kind: 'pass',
      tone: 'success',
      title: passes.length > 1 ? `${passes.length} entry passes issued` : 'Entry pass issued',
      body: `Your QR pass${passes.length > 1 ? 'es are' : ' is'} ready under Entry Passes. Admits ${participant.noOfPersons}.`,
    });
  }

  persistPayment(payment);
  store.appendAudit({
    actorEmail: participant?.email || 'public-checkout',
    actorRole: 'PUBLIC_SYSTEM',
    action: 'PAYMENT_CAPTURED',
    module: 'payments',
    targetId: payment.id,
    summary: `Payment ${payment.gatewayReference} captured via ${details.source} (${payment.mode ?? 'test'}); receipt ${payment.receiptNumber}; ${passes.length} pass(es) issued.`,
  });
  return { participant, passes, alreadyCaptured: false };
}

export function markPaymentFailed(
  store: PlatformStore,
  payment: PaymentRecord,
  reason: string,
  details: Omit<CaptureDetails, 'source' | 'gatewayReference'> = {},
): void {
  if (payment.status === 'captured') return; // never downgrade a settled payment
  payment.status = 'failed';
  payment.failureReason = reason.slice(0, 250);
  if (details.methodFamily) payment.methodFamily = details.methodFamily;
  if (details.methodProvider) payment.methodProvider = details.methodProvider;
  if (details.methodLabel) payment.methodLabel = details.methodLabel;
  persistPayment(payment);

  const participant = store.getSnapshot().participants.find((p) => p.id === payment.participantId);
  if (participant) {
    pushParticipantNotification(store, participant.id, {
      kind: 'payment',
      tone: 'error',
      title: 'Payment not completed',
      body: `${reason} You can retry any time from your dashboard — your registration ${participant.referenceCode} is saved.`,
    });
  }
  store.appendAudit({
    actorEmail: participant?.email || 'public-checkout',
    actorRole: 'PUBLIC_SYSTEM',
    action: 'PAYMENT_FAILED',
    module: 'payments',
    targetId: payment.id,
    summary: `Payment for ${participant?.referenceCode ?? payment.participantId} failed: ${reason}`,
  });
}

/** Sets the participant session cookie; returned so callers can include it in JSON too. */
export function issueParticipantSession(req: Request, res: Response, participantId: string, sessionSecret: string): void {
  const token = signPortalToken(participantId, derivePortalSecret(sessionSecret));
  res.append('Set-Cookie', portalCookie(req, token, Math.floor(PORTAL_SESSION_TTL_MS / 1000)));
}

export function parseMethodSelection(body: Record<string, unknown>): {
  methodFamily: PaymentMethodFamily | null;
  methodProvider: string | null;
  methodLabel: string | null;
} {
  const family = isPaymentMethodFamily(body.methodFamily) ? body.methodFamily : null;
  const provider =
    family && typeof body.methodProvider === 'string' && isKnownProvider(family, body.methodProvider)
      ? body.methodProvider
      : null;
  // Masked label is display-only; strip anything that looks like a full PAN just in case.
  const rawLabel = typeof body.methodLabel === 'string' ? body.methodLabel.trim().slice(0, 100) : '';
  const label = rawLabel && !/\d{9,}/.test(rawLabel.replace(/\s/g, '')) ? rawLabel : null;
  return { methodFamily: family, methodProvider: provider, methodLabel: label };
}

// ---------------------------------------------------------------------------
// Dashboard serialisation
// ---------------------------------------------------------------------------

const ACTIVITY_LABELS: Record<string, string> = {
  PARTICIPANT_REGISTER: 'Registration submitted',
  PAYMENT_ORDER_CREATED: 'Checkout started',
  PAYMENT_CAPTURED: 'Payment captured',
  PAYMENT_VERIFIED_CLIENT: 'Payment verified',
  PAYMENT_FAILED: 'Payment attempt failed',
  WEBHOOK_PAYMENT_UPDATE: 'Gateway confirmation received',
  PORTAL_LOGIN: 'Signed in to dashboard',
  PORTAL_PROFILE_UPDATE: 'Profile updated',
};

function serializePayment(p: PaymentRecord) {
  return {
    id: p.id,
    amountInr: p.amountInr,
    currency: p.currency,
    status: p.status,
    gateway: p.gateway,
    mode: p.mode ?? 'test',
    methodFamily: p.methodFamily ?? null,
    methodLabel: p.methodLabel || describePaymentMethod(p.methodFamily, p.methodProvider),
    gatewayReference: p.status === 'captured' ? p.gatewayReference : null,
    orderId: p.gatewayOrderId,
    receiptNumber: p.receiptNumber ?? null,
    createdAt: p.createdAt,
    capturedAt: p.capturedAt ?? null,
    failureReason: p.failureReason ?? null,
  };
}

function buildDashboard(store: PlatformStore, participant: ParticipantRecord) {
  const db = store.getSnapshot();
  const payments = db.payments.filter((p) => p.participantId === participant.id);
  const paymentIds = new Set(payments.map((p) => p.id));
  const targets = new Set([participant.id, participant.referenceCode, ...paymentIds]);
  const activity = db.auditLogs
    .filter((log) => targets.has(log.targetId) && ACTIVITY_LABELS[log.action])
    .slice(0, 60)
    .map((log) => ({ id: log.id, at: log.timestamp, label: ACTIVITY_LABELS[log.action], action: log.action }));

  return {
    profile: {
      id: participant.id,
      referenceCode: participant.referenceCode,
      fullName: participant.fullName,
      email: participant.email,
      phone: participant.phone,
      country: participant.country,
      city: participant.city,
      registrationType: participant.registrationType,
      noOfPersons: participant.noOfPersons,
      amountInr: participant.donationAmountInr,
      events: participant.events,
      assistance: participant.assistance,
      preferredLanguage: participant.preferredLanguage ?? '',
      organisationName: participant.organisationName ?? '',
      organisationRole: participant.organisationRole ?? '',
      familyOrGroupMembers: participant.familyOrGroupMembers ?? '',
      parayanaCity: participant.parayanaCity ?? '',
      paymentStatus: participant.paymentStatus,
      verificationStatus: participant.verificationStatus,
      createdAt: participant.createdAt,
    },
    payments: payments.map(serializePayment),
    passes: db.entryPasses
      .filter((p) => p.participantId === participant.id)
      .map(({ paymentId: _paymentId, ...pass }) => pass),
    notifications: db.participantNotifications.filter((n) => n.participantId === participant.id).slice(0, 100),
    activity,
  };
}

// ---------------------------------------------------------------------------
// Routes
// ---------------------------------------------------------------------------

export function mountPortalRoutes(
  app: Express,
  ctx: { store: PlatformStore; sessionSecret: string; isRazorpayConfigured: () => boolean },
): void {
  const { store, sessionSecret } = ctx;
  const portalSecret = derivePortalSecret(sessionSecret);

  const loginLimiter = createRateLimiter({
    windowMs: 15 * 60 * 1000,
    max: 15,
    keyPrefix: 'portal-login',
    message: 'Too many sign-in attempts. Please wait a few minutes and try again.',
  });
  const portalWriteLimiter = createRateLimiter({ windowMs: 10 * 60 * 1000, max: 60, keyPrefix: 'portal-write' });
  const sandboxLimiter = createRateLimiter({ windowMs: 10 * 60 * 1000, max: 30, keyPrefix: 'payment-sandbox' });
  const passVerifyLimiter = createRateLimiter({ windowMs: 10 * 60 * 1000, max: 120, keyPrefix: 'pass-verify' });

  const currentParticipant = (req: Request): ParticipantRecord | null => {
    const session = verifyPortalToken(readCookie(req, PORTAL_COOKIE), portalSecret);
    if (!session) return null;
    return store.getSnapshot().participants.find((p) => p.id === session.pid) ?? null;
  };

  const requireParticipant = (req: Request, res: Response): ParticipantRecord | null => {
    const participant = currentParticipant(req);
    if (!participant) {
      res.status(401).json({ error: 'Please sign in to view your dashboard.', code: 'PORTAL_UNAUTHENTICATED' });
      return null;
    }
    return participant;
  };

  // --- Sign in with email + registration reference (both are needed; neither alone works)
  app.post('/api/portal/login', loginLimiter, (req, res) => {
    const b = (req.body ?? {}) as Record<string, unknown>;
    const email = typeof b.email === 'string' ? b.email.trim().toLowerCase() : '';
    const referenceCode = typeof b.referenceCode === 'string' ? b.referenceCode.trim().toUpperCase() : '';
    if (!email || !referenceCode) {
      res.status(400).json({ error: 'Enter your email and registration reference code.', code: 'INVALID_LOGIN' });
      return;
    }
    const participant = store
      .getSnapshot()
      .participants.find((p) => p.referenceCode.toUpperCase() === referenceCode && p.email.toLowerCase() === email);
    if (!participant) {
      res.status(401).json({
        error: 'We could not find a registration with that email and reference code.',
        code: 'LOGIN_NOT_FOUND',
      });
      return;
    }
    issueParticipantSession(req, res, participant.id, sessionSecret);
    store.appendAudit({
      actorEmail: participant.email,
      actorRole: 'PUBLIC_SYSTEM',
      action: 'PORTAL_LOGIN',
      module: 'registrations',
      targetId: participant.id,
      summary: `Participant ${participant.referenceCode} signed in to the dashboard.`,
    });
    res.json({ ok: true, referenceCode: participant.referenceCode });
  });

  app.post('/api/portal/logout', (req, res) => {
    res.append('Set-Cookie', portalCookie(req, '', 0));
    res.json({ ok: true });
  });

  app.get('/api/portal/session', (req, res) => {
    const participant = currentParticipant(req);
    res.json(
      participant
        ? {
            authenticated: true,
            fullName: participant.fullName,
            referenceCode: participant.referenceCode,
            unread: store
              .getSnapshot()
              .participantNotifications.filter((n) => n.participantId === participant.id && !n.read).length,
          }
        : { authenticated: false },
    );
  });

  app.get('/api/portal/me', (req, res) => {
    const participant = requireParticipant(req, res);
    if (!participant) return;
    res.json({
      ...buildDashboard(store, participant),
      gateway: {
        mode: ctx.isRazorpayConfigured() ? 'razorpay' : isSandboxGatewayEnabled(false) ? 'sandbox' : 'unavailable',
      },
    });
  });

  app.patch('/api/portal/profile', portalWriteLimiter, (req, res) => {
    const participant = requireParticipant(req, res);
    if (!participant) return;
    const b = (req.body ?? {}) as Record<string, unknown>;
    const clean = (val: unknown, max: number): string | undefined => {
      if (typeof val !== 'string') return undefined;
      return sanitizeSensitiveUtterance(val).cleaned.trim().slice(0, max);
    };

    const phone = clean(b.phone, 40);
    if (phone !== undefined) {
      if (!/^\+?[\d\s\-()]{7,20}$/.test(phone)) {
        res.status(400).json({ error: 'Enter a valid phone number.', code: 'INVALID_PHONE' });
        return;
      }
      participant.phone = phone;
    }
    const city = clean(b.city, 120);
    if (city !== undefined) {
      if (city.length < 2) {
        res.status(400).json({ error: 'City is required.', code: 'INVALID_CITY' });
        return;
      }
      participant.city = city;
    }
    const country = clean(b.country, 120);
    if (country) participant.country = country;
    const optional: Array<[keyof ParticipantRecord, number]> = [
      ['preferredLanguage', 20],
      ['organisationName', 140],
      ['organisationRole', 120],
      ['familyOrGroupMembers', 320],
      ['parayanaCity', 100],
    ];
    for (const [key, max] of optional) {
      const v = clean(b[key], max);
      if (v !== undefined) (participant as unknown as Record<string, unknown>)[key] = v || undefined;
    }

    persistParticipant(participant);
    pushParticipantNotification(store, participant.id, {
      kind: 'profile',
      tone: 'info',
      title: 'Profile updated',
      body: 'Your contact details were saved.',
    });
    store.appendAudit({
      actorEmail: participant.email,
      actorRole: 'PUBLIC_SYSTEM',
      action: 'PORTAL_PROFILE_UPDATE',
      module: 'registrations',
      targetId: participant.id,
      summary: `Participant ${participant.referenceCode} updated their profile.`,
    });
    res.json({ ok: true, ...buildDashboard(store, participant) });
  });

  app.post('/api/portal/notifications/read', portalWriteLimiter, (req, res) => {
    const participant = requireParticipant(req, res);
    if (!participant) return;
    const ids = Array.isArray((req.body as { ids?: unknown })?.ids)
      ? new Set(((req.body as { ids: unknown[] }).ids).filter((x): x is string => typeof x === 'string'))
      : null;
    let changed = 0;
    for (const n of store.getSnapshot().participantNotifications) {
      if (n.participantId !== participant.id || n.read) continue;
      if (ids && !ids.has(n.id)) continue;
      n.read = true;
      persistNotification(n);
      changed++;
    }
    if (changed) store.save();
    res.json({ ok: true, changed });
  });

  app.get('/api/portal/payments/:paymentId/receipt', (req, res) => {
    const participant = requireParticipant(req, res);
    if (!participant) return;
    const payment = store
      .getSnapshot()
      .payments.find((p) => p.id === req.params.paymentId && p.participantId === participant.id);
    if (!payment || payment.status !== 'captured') {
      res.status(404).json({ error: 'Receipt not available for this transaction.', code: 'RECEIPT_NOT_FOUND' });
      return;
    }
    res.json({
      receipt: {
        ...serializePayment(payment),
        participant: {
          fullName: participant.fullName,
          email: participant.email,
          phone: participant.phone,
          city: participant.city,
          country: participant.country,
          referenceCode: participant.referenceCode,
          registrationType: participant.registrationType,
          noOfPersons: participant.noOfPersons,
        },
        issuer: 'Bhagavad Gita Vishwa Mahotsav 2027 — Registration Secretariat',
      },
    });
  });

  // --- Built-in test gateway (only when no live gateway keys are configured)
  app.post('/api/public/payments/sandbox/complete', sandboxLimiter, (req, res) => {
    if (!isSandboxGatewayEnabled(ctx.isRazorpayConfigured())) {
      res.status(403).json({ error: 'Test payments are disabled on this server.', code: 'SANDBOX_DISABLED' });
      return;
    }
    const b = (req.body ?? {}) as Record<string, unknown>;
    const orderId = typeof b.orderId === 'string' ? b.orderId.trim() : '';
    const outcome = b.outcome === 'failure' ? 'failure' : 'success';
    const db = store.getSnapshot();
    const payment = db.payments.find((p) => p.gatewayOrderId === orderId && p.gateway === 'sandbox');
    if (!payment) {
      res.status(404).json({ error: 'Checkout session not found or expired. Please restart payment.', code: 'ORDER_NOT_FOUND' });
      return;
    }
    const method = parseMethodSelection(b);
    if (!method.methodFamily) {
      res.status(400).json({ error: 'Choose a payment method.', code: 'INVALID_METHOD' });
      return;
    }
    payment.attempts = (payment.attempts ?? 0) + 1;

    if (outcome === 'failure') {
      const reason =
        method.methodFamily === 'card'
          ? 'Your bank declined the card.'
          : method.methodFamily === 'upi'
            ? 'The UPI request was declined or timed out.'
            : 'The payment was cancelled at the bank.';
      markPaymentFailed(store, payment, reason, method);
      res.status(402).json({ ok: false, error: reason, code: 'PAYMENT_DECLINED', referenceCode: db.participants.find((p) => p.id === payment.participantId)?.referenceCode });
      return;
    }

    const { participant, passes } = finalizeCapturedPayment(
      store,
      payment,
      { source: 'sandbox', gatewayReference: `pay_sbx_${crypto.randomBytes(7).toString('hex')}`, ...method },
      sessionSecret,
    );
    if (participant) issueParticipantSession(req, res, participant.id, sessionSecret);
    res.json({
      ok: true,
      status: 'paid',
      referenceCode: participant?.referenceCode,
      receiptNumber: payment.receiptNumber,
      passesIssued: passes.length,
      mode: 'test',
    });
  });

  // --- Gate verification of a scanned QR pass (returns only what a steward needs)
  app.post('/api/public/passes/verify', passVerifyLimiter, (req, res) => {
    const payload = typeof (req.body as { payload?: unknown })?.payload === 'string' ? (req.body as { payload: string }).payload.trim() : '';
    const match = payload.match(/^BGVM1\.(BGVM-[A-Z]{2}-[0-9A-F]{4}-[0-9A-F]{4})\.([0-9a-f]{16})$/);
    if (!match) {
      res.status(400).json({ valid: false, reason: 'Not a Mahotsav pass QR.' });
      return;
    }
    const pass = store.getSnapshot().entryPasses.find((p) => p.passCode === match[1]);
    if (!pass || signPassPayload(pass.passCode, pass.participantId, portalSecret) !== payload) {
      res.json({ valid: false, reason: 'Pass signature not recognised.' });
      return;
    }
    const holder = store.getSnapshot().participants.find((p) => p.id === pass.participantId);
    res.json({
      valid: pass.status === 'active',
      status: pass.status,
      passCode: pass.passCode,
      eventName: pass.eventName,
      eventDate: pass.eventDate,
      admits: pass.admits,
      holderFirstName: holder?.fullName.split(' ')[0] ?? 'Participant',
    });
  });
}
