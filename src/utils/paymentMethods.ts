/**
 * Shared payment-method catalogue and validators (used by the checkout UI and the server).
 *
 * Security note: full card numbers and CVVs are validated in the browser only and are never
 * sent to our server. The server only ever receives the method family, the chosen provider,
 * and a masked display label (e.g. "Visa •••• 4242").
 */

export type PaymentMethodFamily = 'upi' | 'card' | 'netbanking' | 'wallet';

export interface PaymentProvider {
  id: string;
  label: string;
  /** Short brand mark rendered in the tile (keeps us free of third-party logo assets). */
  mark: string;
  /** Brand-ish accent colour for the tile glow. */
  accent: string;
}

export const PAYMENT_METHOD_FAMILIES: ReadonlyArray<{
  id: PaymentMethodFamily;
  label: string;
  hint: string;
}> = [
  { id: 'upi', label: 'UPI', hint: 'GPay, PhonePe, Paytm, FamPay & more' },
  { id: 'card', label: 'Cards', hint: 'Visa, Mastercard, RuPay, Amex' },
  { id: 'netbanking', label: 'Net Banking', hint: 'All major Indian banks' },
  { id: 'wallet', label: 'Wallets', hint: 'Paytm, Amazon Pay, MobiKwik' },
];

export const UPI_APPS: ReadonlyArray<PaymentProvider> = [
  { id: 'gpay', label: 'Google Pay', mark: 'G', accent: '#4285F4' },
  { id: 'phonepe', label: 'PhonePe', mark: 'Pe', accent: '#6739B7' },
  { id: 'paytm', label: 'Paytm UPI', mark: 'P', accent: '#00BAF2' },
  { id: 'fampay', label: 'FamPay', mark: 'F', accent: '#FFAD00' },
  { id: 'bhim', label: 'BHIM', mark: 'B', accent: '#F47920' },
  { id: 'cred', label: 'CRED UPI', mark: 'C', accent: '#9AA5B1' },
  { id: 'amazonpay', label: 'Amazon Pay UPI', mark: 'a', accent: '#FF9900' },
  { id: 'upi-id', label: 'Any UPI ID', mark: '@', accent: '#D4A537' },
];

export const NETBANKING_BANKS: ReadonlyArray<PaymentProvider> = [
  { id: 'SBIN', label: 'State Bank of India', mark: 'SBI', accent: '#1A4DB3' },
  { id: 'HDFC', label: 'HDFC Bank', mark: 'HD', accent: '#004C8F' },
  { id: 'ICIC', label: 'ICICI Bank', mark: 'IC', accent: '#B02A30' },
  { id: 'UTIB', label: 'Axis Bank', mark: 'AX', accent: '#97144D' },
  { id: 'KKBK', label: 'Kotak Mahindra Bank', mark: 'KO', accent: '#ED1C24' },
  { id: 'PUNB', label: 'Punjab National Bank', mark: 'PN', accent: '#A6192E' },
  { id: 'BARB', label: 'Bank of Baroda', mark: 'BB', accent: '#F15A22' },
  { id: 'YESB', label: 'Yes Bank', mark: 'YS', accent: '#0060AA' },
  { id: 'CNRB', label: 'Canara Bank', mark: 'CA', accent: '#0072BC' },
  { id: 'UBIN', label: 'Union Bank of India', mark: 'UB', accent: '#E31E24' },
];

export const WALLETS: ReadonlyArray<PaymentProvider> = [
  { id: 'paytm', label: 'Paytm Wallet', mark: 'P', accent: '#00BAF2' },
  { id: 'amazonpay', label: 'Amazon Pay', mark: 'a', accent: '#FF9900' },
  { id: 'mobikwik', label: 'MobiKwik', mark: 'M', accent: '#2B6FE8' },
  { id: 'freecharge', label: 'Freecharge', mark: 'f', accent: '#F26722' },
  { id: 'airtelmoney', label: 'Airtel Payments', mark: 'Ai', accent: '#E40000' },
  { id: 'jiomoney', label: 'JioMoney', mark: 'J', accent: '#0F3CC9' },
];

export type CardBrand = 'visa' | 'mastercard' | 'rupay' | 'amex' | 'unknown';

export const CARD_BRAND_LABELS: Record<CardBrand, string> = {
  visa: 'Visa',
  mastercard: 'Mastercard',
  rupay: 'RuPay',
  amex: 'American Express',
  unknown: 'Card',
};

export function providersForFamily(family: PaymentMethodFamily): ReadonlyArray<PaymentProvider> {
  switch (family) {
    case 'upi':
      return UPI_APPS;
    case 'netbanking':
      return NETBANKING_BANKS;
    case 'wallet':
      return WALLETS;
    default:
      return [];
  }
}

export function isPaymentMethodFamily(value: unknown): value is PaymentMethodFamily {
  return value === 'upi' || value === 'card' || value === 'netbanking' || value === 'wallet';
}

export function isKnownProvider(family: PaymentMethodFamily, providerId: string): boolean {
  if (family === 'card') return ['visa', 'mastercard', 'rupay', 'amex', 'unknown'].includes(providerId);
  return providersForFamily(family).some((p) => p.id === providerId);
}

/** handle@psp — 2-256 chars handle, 2-64 letter PSP suffix. */
export function isValidUpiId(value: string): boolean {
  return /^[a-zA-Z0-9.\-_]{2,256}@[a-zA-Z]{2,64}$/.test(value.trim());
}

export function digitsOnly(value: string): string {
  return value.replace(/\D/g, '');
}

export function detectCardBrand(cardNumber: string): CardBrand {
  const n = digitsOnly(cardNumber);
  if (/^4/.test(n)) return 'visa';
  if (/^3[47]/.test(n)) return 'amex';
  // RuPay BINs (60, 65, 81, 82, 508, 353, 356) checked before Mastercard's 2-series overlap.
  if (/^(508|60|65|81|82|353|356)/.test(n)) return 'rupay';
  if (/^(5[1-5]|2(2[2-9]|[3-6]\d|7[01]|720))/.test(n)) return 'mastercard';
  return 'unknown';
}

export function passesLuhn(cardNumber: string): boolean {
  const n = digitsOnly(cardNumber);
  if (n.length < 12 || n.length > 19) return false;
  let sum = 0;
  let double = false;
  for (let i = n.length - 1; i >= 0; i--) {
    let d = Number(n[i]);
    if (double) {
      d *= 2;
      if (d > 9) d -= 9;
    }
    sum += d;
    double = !double;
  }
  return sum % 10 === 0;
}

/** Groups digits for display: Amex 4-6-5, others 4-4-4-4(-3). */
export function formatCardNumber(value: string): string {
  const n = digitsOnly(value).slice(0, 19);
  if (detectCardBrand(n) === 'amex') {
    return [n.slice(0, 4), n.slice(4, 10), n.slice(10, 15)].filter(Boolean).join(' ');
  }
  return n.replace(/(\d{4})(?=\d)/g, '$1 ');
}

/** Accepts "MM/YY"; must be a real month not in the past. */
export function isValidCardExpiry(value: string, now = new Date()): boolean {
  const match = value.trim().match(/^(\d{2})\s*\/\s*(\d{2})$/);
  if (!match) return false;
  const month = Number(match[1]);
  const year = 2000 + Number(match[2]);
  if (month < 1 || month > 12) return false;
  const endOfMonth = new Date(year, month, 0, 23, 59, 59);
  return endOfMonth >= now;
}

export function isValidCvv(value: string, brand: CardBrand): boolean {
  const n = digitsOnly(value);
  return brand === 'amex' ? n.length === 4 : n.length === 3;
}

export function maskCardLabel(cardNumber: string): string {
  const n = digitsOnly(cardNumber);
  return `${CARD_BRAND_LABELS[detectCardBrand(n)]} •••• ${n.slice(-4)}`;
}

/** Masks a UPI handle for receipts: "ananya.sharma@okhdfc" → "an•••••ma@okhdfc". */
export function maskUpiId(upiId: string): string {
  const [handle = '', psp = ''] = upiId.trim().split('@');
  if (handle.length <= 4) return `${handle[0] ?? ''}•••@${psp}`;
  return `${handle.slice(0, 2)}•••••${handle.slice(-2)}@${psp}`;
}

/** Human label for a stored method, e.g. ("upi","gpay") → "UPI · Google Pay". */
export function describePaymentMethod(family: string | null | undefined, providerId: string | null | undefined): string {
  if (!family || !isPaymentMethodFamily(family)) return 'Online payment';
  const familyLabel = PAYMENT_METHOD_FAMILIES.find((f) => f.id === family)?.label ?? family;
  if (family === 'card') {
    return `${familyLabel} · ${CARD_BRAND_LABELS[(providerId as CardBrand) ?? 'unknown'] ?? 'Card'}`;
  }
  const provider = providersForFamily(family).find((p) => p.id === providerId);
  return provider ? `${familyLabel} · ${provider.label}` : familyLabel;
}
