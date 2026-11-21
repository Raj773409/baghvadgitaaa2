/**
 * Typed client for the participant portal + checkout API (server/portal.ts, server/routes.ts).
 * All calls are same-origin and send the HttpOnly participant session cookie automatically.
 */
import type { PaymentMethodFamily } from './paymentMethods';

export class ApiError extends Error {
  constructor(
    message: string,
    public status: number,
    public code?: string,
    public data?: Record<string, unknown>,
  ) {
    super(message);
  }
}

async function request<T>(url: string, init?: RequestInit): Promise<T> {
  let res: Response;
  try {
    res = await fetch(url, {
      credentials: 'same-origin',
      ...init,
      headers: { 'Content-Type': 'application/json', ...(init?.headers ?? {}) },
    });
  } catch {
    throw new ApiError('Network error — please check your connection and try again.', 0, 'NETWORK');
  }
  const data = (await res.json().catch(() => ({}))) as Record<string, unknown>;
  if (!res.ok) {
    throw new ApiError(
      typeof data.error === 'string' ? data.error : `Request failed (${res.status}).`,
      res.status,
      typeof data.code === 'string' ? data.code : undefined,
      data,
    );
  }
  return data as T;
}

// ---------------------------------------------------------------------------
// Checkout
// ---------------------------------------------------------------------------

export interface MethodSelection {
  methodFamily: PaymentMethodFamily;
  methodProvider?: string | null;
  /** Masked display label only, e.g. "Visa •••• 4242" / "UPI · an•••••ya@okhdfc". */
  methodLabel?: string | null;
}

export interface RegistrationPayload {
  fullName: string;
  email: string;
  phone: string;
  noOfPersons: number;
  donationAmount: number;
  registrationType: string;
  country: string;
  city: string;
  assistance: { visa: boolean; accommodation: boolean; localTransport: boolean };
  events: { curtainRaiser: boolean; mahotsav: boolean };
  preferredLanguage?: string;
  familyOrGroupMembers?: string;
  organisationName?: string;
  organisationRole?: string;
  volunteerSkills?: string;
  parayanaCity?: string;
  assistanceNotes?: string;
}

export type CreateOrderResponse =
  | {
      mode: 'sandbox-checkout';
      orderId: string;
      referenceCode: string;
      amountInr: number;
      testMode: true;
    }
  | {
      mode: 'razorpay-checkout';
      orderId: string;
      keyId: string;
      amountPaise: number;
      currency: string;
      referenceCode: string;
      amountInr: number;
      testMode: boolean;
    };

export interface PaymentSuccessResponse {
  ok: true;
  status: 'paid';
  referenceCode: string;
  receiptNumber: string;
  passesIssued: number;
  mode: 'live' | 'test';
}

export const checkoutApi = {
  register: (payload: RegistrationPayload) =>
    request<{ ok: true; participantId: string; paymentId: string; referenceCode: string }>(
      '/api/public/registrations',
      { method: 'POST', body: JSON.stringify(payload) },
    ),

  createOrder: (referenceCode: string, method?: MethodSelection) =>
    request<CreateOrderResponse>('/api/public/payments/create-order', {
      method: 'POST',
      body: JSON.stringify({ referenceCode, ...method }),
    }),

  /** Built-in test gateway. outcome 'failure' simulates a decline (UPI failure@test, card 4000 0000 0000 0002). */
  completeSandbox: (orderId: string, method: MethodSelection, outcome: 'success' | 'failure') =>
    request<PaymentSuccessResponse>('/api/public/payments/sandbox/complete', {
      method: 'POST',
      body: JSON.stringify({ orderId, outcome, ...method }),
    }),

  verifyRazorpay: (r: { razorpay_order_id: string; razorpay_payment_id: string; razorpay_signature: string }) =>
    request<PaymentSuccessResponse>('/api/public/payments/verify', {
      method: 'POST',
      body: JSON.stringify({
        razorpayOrderId: r.razorpay_order_id,
        razorpayPaymentId: r.razorpay_payment_id,
        razorpaySignature: r.razorpay_signature,
      }),
    }),
};

// ---------------------------------------------------------------------------
// Portal (dashboard)
// ---------------------------------------------------------------------------

export interface PortalProfile {
  id: string;
  referenceCode: string;
  fullName: string;
  email: string;
  phone: string;
  country: string;
  city: string;
  registrationType: string;
  noOfPersons: number;
  amountInr: number;
  events: { curtainRaiser: boolean; mahotsav: boolean };
  assistance: { visa: boolean; accommodation: boolean; localTransport: boolean };
  preferredLanguage: string;
  organisationName: string;
  organisationRole: string;
  familyOrGroupMembers: string;
  parayanaCity: string;
  paymentStatus: 'awaiting-gateway' | 'paid' | 'refunded';
  verificationStatus: 'pending' | 'verified' | 'flagged';
  createdAt: string;
}

export interface PortalPayment {
  id: string;
  amountInr: number;
  currency: 'INR';
  status: 'initiated' | 'captured' | 'refunded' | 'failed';
  gateway: string;
  mode: 'live' | 'test';
  methodFamily: PaymentMethodFamily | null;
  methodLabel: string;
  gatewayReference: string | null;
  orderId: string | null;
  receiptNumber: string | null;
  createdAt: string;
  capturedAt: string | null;
  failureReason: string | null;
}

export interface PortalPass {
  id: string;
  participantId: string;
  passCode: string;
  eventKey: 'curtainRaiser' | 'mahotsav';
  eventName: string;
  eventDate: string;
  venue: string;
  admits: number;
  tier: string;
  qrPayload: string;
  status: 'active' | 'checked-in' | 'revoked';
  issuedAt: string;
  checkedInAt: string | null;
}

export interface PortalNotification {
  id: string;
  kind: 'registration' | 'payment' | 'pass' | 'profile' | 'system';
  tone: 'success' | 'info' | 'warning' | 'error';
  title: string;
  body: string;
  read: boolean;
  createdAt: string;
}

export interface PortalActivity {
  id: string;
  at: string;
  label: string;
  action: string;
}

export interface PortalDashboard {
  profile: PortalProfile;
  payments: PortalPayment[];
  passes: PortalPass[];
  notifications: PortalNotification[];
  activity: PortalActivity[];
  gateway?: { mode: 'razorpay' | 'sandbox' | 'unavailable' };
}

export interface PortalReceipt extends PortalPayment {
  participant: {
    fullName: string;
    email: string;
    phone: string;
    city: string;
    country: string;
    referenceCode: string;
    registrationType: string;
    noOfPersons: number;
  };
  issuer: string;
}

export type ProfileUpdate = Partial<
  Pick<
    PortalProfile,
    | 'phone'
    | 'city'
    | 'country'
    | 'preferredLanguage'
    | 'organisationName'
    | 'organisationRole'
    | 'familyOrGroupMembers'
    | 'parayanaCity'
  >
>;

export const portalApi = {
  session: () =>
    request<{ authenticated: false } | { authenticated: true; fullName: string; referenceCode: string; unread: number }>(
      '/api/portal/session',
    ),
  login: (email: string, referenceCode: string) =>
    request<{ ok: true; referenceCode: string }>('/api/portal/login', {
      method: 'POST',
      body: JSON.stringify({ email, referenceCode }),
    }),
  logout: () => request<{ ok: true }>('/api/portal/logout', { method: 'POST' }),
  me: () => request<PortalDashboard>('/api/portal/me'),
  updateProfile: (update: ProfileUpdate) =>
    request<PortalDashboard & { ok: true }>('/api/portal/profile', {
      method: 'PATCH',
      body: JSON.stringify(update),
    }),
  markNotificationsRead: (ids?: string[]) =>
    request<{ ok: true; changed: number }>('/api/portal/notifications/read', {
      method: 'POST',
      body: JSON.stringify(ids ? { ids } : {}),
    }),
  receipt: (paymentId: string) =>
    request<{ receipt: PortalReceipt }>(`/api/portal/payments/${encodeURIComponent(paymentId)}/receipt`),
};

/** Fired after sign-in/out or payment so the header badge can refresh. */
export const PORTAL_SESSION_EVENT = 'bgvm:portal-session-changed';
export function announcePortalSessionChange(): void {
  if (typeof window !== 'undefined') window.dispatchEvent(new Event(PORTAL_SESSION_EVENT));
}
