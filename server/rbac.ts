import crypto from 'node:crypto';

export type AdminRole =
  | 'SUPER_ADMIN'
  | 'EVENT_ADMIN'
  | 'REGISTRATION_MANAGER'
  | 'FINANCE_MANAGER'
  | 'VOLUNTEER_MANAGER'
  | 'CONTENT_EDITOR'
  | 'MEDIA_MANAGER'
  | 'AUDITOR';

export const ALL_ADMIN_ROLES: ReadonlyArray<AdminRole> = [
  'SUPER_ADMIN',
  'EVENT_ADMIN',
  'REGISTRATION_MANAGER',
  'FINANCE_MANAGER',
  'VOLUNTEER_MANAGER',
  'CONTENT_EDITOR',
  'MEDIA_MANAGER',
  'AUDITOR',
];

export type AdminModuleId =
  | 'overview'
  | 'participants'
  | 'registrations'
  | 'payments'
  | 'volunteers'
  | 'membership'
  | 'gallery'
  | 'video'
  | 'hero'
  | 'krishnaFeature'
  | 'participationCategories'
  | 'donationConfig'
  | 'voiceScripts'
  | 'translations'
  | 'events'
  | 'schedule'
  | 'chapters'
  | 'scripture'
  | 'voice'
  | 'story'
  | 'leadership'
  | 'partners'
  | 'news'
  | 'faqs'
  | 'pages'
  | 'websiteInventory'
  | 'pageBuilder'
  | 'carousels'
  | 'users'
  | 'analytics'
  | 'audit'
  | 'settings';

export type AccessAction = 'read' | 'write';

const ROLE_READ_MODULES: Record<AdminRole, ReadonlyArray<AdminModuleId> | '*'> = {
  SUPER_ADMIN: '*',
  EVENT_ADMIN: [
    'overview',
    'participants',
    'registrations',
    'volunteers',
    'hero',
    'krishnaFeature',
    'participationCategories',
    'donationConfig',
    'events',
    'schedule',
    'leadership',
    'partners',
    'news',
    'faqs',
    'pages',
    'websiteInventory',
    'pageBuilder',
    'carousels',
    'analytics',
  ],
  REGISTRATION_MANAGER: ['overview', 'participants', 'registrations', 'membership', 'analytics'],
  FINANCE_MANAGER: ['overview', 'participants', 'registrations', 'payments', 'donationConfig', 'analytics', 'audit'],
  VOLUNTEER_MANAGER: ['overview', 'volunteers', 'events', 'schedule'],
  CONTENT_EDITOR: [
    'overview',
    'hero',
    'krishnaFeature',
    'participationCategories',
    'voiceScripts',
    'translations',
    'chapters',
    'scripture',
    'voice',
    'story',
    'events',
    'schedule',
    'leadership',
    'partners',
    'news',
    'faqs',
    'pages',
    'websiteInventory',
    'pageBuilder',
    'carousels',
  ],
  MEDIA_MANAGER: [
    'overview',
    'gallery',
    'video',
    'voice',
    'story',
    'news',
    'websiteInventory',
    'pageBuilder',
    'carousels',
  ],
  AUDITOR: [
    'overview',
    'participants',
    'registrations',
    'payments',
    'volunteers',
    'membership',
    'websiteInventory',
    'analytics',
    'audit',
  ],
};

const ROLE_WRITE_MODULES: Record<AdminRole, ReadonlyArray<AdminModuleId> | '*'> = {
  SUPER_ADMIN: '*',
  EVENT_ADMIN: [
    'hero',
    'krishnaFeature',
    'participationCategories',
    'donationConfig',
    'events',
    'schedule',
    'leadership',
    'partners',
    'news',
    'faqs',
    'pages',
    'websiteInventory',
    'pageBuilder',
    'carousels',
    'participants',
  ],
  REGISTRATION_MANAGER: ['participants', 'registrations', 'membership'],
  FINANCE_MANAGER: ['payments', 'registrations', 'donationConfig'],
  VOLUNTEER_MANAGER: ['volunteers'],
  CONTENT_EDITOR: [
    'hero',
    'krishnaFeature',
    'participationCategories',
    'voiceScripts',
    'translations',
    'chapters',
    'scripture',
    'voice',
    'story',
    'events',
    'schedule',
    'news',
    'faqs',
    'pages',
    'websiteInventory',
    'pageBuilder',
    'carousels',
  ],
  MEDIA_MANAGER: ['gallery', 'video', 'voice', 'story', 'carousels'],
  AUDITOR: [],
};

export function hasModulePermission(
  role: AdminRole,
  moduleId: AdminModuleId,
  action: AccessAction,
): boolean {
  const table = action === 'read' ? ROLE_READ_MODULES : ROLE_WRITE_MODULES;
  const grant = table[role];
  if (grant === '*') return true;
  return grant.includes(moduleId);
}

export function getPermittedModules(role: AdminRole): {
  read: AdminModuleId[];
  write: AdminModuleId[];
} {
  const allModules: AdminModuleId[] = [
    'overview',
    'participants',
    'registrations',
    'payments',
    'volunteers',
    'membership',
    'gallery',
    'video',
    'hero',
    'krishnaFeature',
    'participationCategories',
    'donationConfig',
    'voiceScripts',
    'translations',
    'events',
    'schedule',
    'chapters',
    'scripture',
    'voice',
    'story',
    'leadership',
    'partners',
    'news',
    'faqs',
    'pages',
    'websiteInventory',
    'pageBuilder',
    'carousels',
    'users',
    'analytics',
    'audit',
    'settings',
  ];

  return {
    read: allModules.filter((m) => hasModulePermission(role, m, 'read')),
    write: allModules.filter((m) => hasModulePermission(role, m, 'write')),
  };
}

export function hashPassword(password: string, existingSalt?: string): string {
  const salt = existingSalt ?? crypto.randomBytes(16).toString('hex');
  const derived = crypto.scryptSync(password, salt, 64).toString('hex');
  return `${salt}:${derived}`;
}

export function verifyPassword(password: string, storedHash: string): boolean {
  const parts = storedHash.split(':');
  if (parts.length !== 2) return false;
  const [salt, expectedHex] = parts;
  if (!salt || !expectedHex) return false;
  const computed = crypto.scryptSync(password, salt, 64);
  const expected = Buffer.from(expectedHex, 'hex');
  if (computed.length !== expected.length) return false;
  return crypto.timingSafeEqual(computed, expected);
}

export interface SignedSessionPayload {
  userId: string;
  email: string;
  role: AdminRole;
  exp: number;
}

export function signSessionToken(
  payload: Omit<SignedSessionPayload, 'exp'>,
  secret: string,
  ttlMs = 1000 * 60 * 60 * 12,
): string {
  const body: SignedSessionPayload = {
    ...payload,
    exp: Date.now() + ttlMs,
  };
  const encoded = Buffer.from(JSON.stringify(body), 'utf8').toString('base64url');
  const sig = crypto.createHmac('sha256', secret).update(encoded).digest('base64url');
  return `${encoded}.${sig}`;
}

export function verifySessionToken(
  token: string | null | undefined,
  secret: string,
): SignedSessionPayload | null {
  if (!token || typeof token !== 'string') return null;
  const dotIdx = token.indexOf('.');
  if (dotIdx <= 0) return null;
  const encoded = token.slice(0, dotIdx);
  const sig = token.slice(dotIdx + 1);
  if (!encoded || !sig) return null;

  const expectedSig = crypto
    .createHmac('sha256', secret)
    .update(encoded)
    .digest('base64url');

  const sigBuf = Buffer.from(sig);
  const expBuf = Buffer.from(expectedSig);
  if (sigBuf.length !== expBuf.length || !crypto.timingSafeEqual(sigBuf, expBuf)) {
    return null;
  }

  try {
    const parsed = JSON.parse(
      Buffer.from(encoded, 'base64url').toString('utf8'),
    ) as SignedSessionPayload;
    if (!parsed.exp || Date.now() > parsed.exp) return null;
    if (!ALL_ADMIN_ROLES.includes(parsed.role)) return null;
    return parsed;
  } catch {
    return null;
  }
}

export function verifyWebhookSignature(
  rawBody: string,
  signatureHeader: string | undefined,
  secret: string,
): boolean {
  if (!signatureHeader || !secret) return false;
  const expectedHex = crypto.createHmac('sha256', secret).update(rawBody).digest('hex');
  const supplied = signatureHeader.trim().replace(/^sha256=/i, '');
  const a = Buffer.from(expectedHex, 'utf8');
  const b = Buffer.from(supplied, 'utf8');
  return a.length === b.length && crypto.timingSafeEqual(a, b);
}

/**
 * Razorpay's order-based Checkout signature: HMAC-SHA256 of `order_id|payment_id` keyed
 * with the account's key_secret (NOT the webhook secret). This is a genuine cryptographic
 * confirmation that the payment succeeded, generated server-side by Razorpay and returned
 * to the browser only after a successful charge — it is not "trusting the browser."
 * See https://razorpay.com/docs/payments/payment-gateway/web-integration/standard/build-integration/#payment-success-handler
 */
export function verifyRazorpayPaymentSignature(
  orderId: string,
  paymentId: string,
  signature: string | undefined,
  keySecret: string,
): boolean {
  if (!signature || !keySecret || !orderId || !paymentId) return false;
  const expectedHex = crypto
    .createHmac('sha256', keySecret)
    .update(`${orderId}|${paymentId}`)
    .digest('hex');
  const a = Buffer.from(expectedHex, 'utf8');
  const b = Buffer.from(signature.trim(), 'utf8');
  return a.length === b.length && crypto.timingSafeEqual(a, b);
}
