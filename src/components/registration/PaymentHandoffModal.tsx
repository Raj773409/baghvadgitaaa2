import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  AlertTriangle,
  ArrowUpRight,
  CheckCircle2,
  Clock,
  Loader2,
  Lock,
  Printer,
  RefreshCw,
  ShieldCheck,
  X,
} from 'lucide-react';
import { OFFICIAL_EVENT_URLS } from '../../content/eventContent';
import { useI18n } from '../../i18n';
import {
  ASSISTANCE_OPTIONS,
  EVENT_SELECTION_OPTIONS,
  formatInrAmount,
  REGISTRATION_TYPE_OPTIONS,
  getRegistrationCountryOptions,
  type RegistrationFormValues,
} from '../../utils/registrationValidation';

interface PaymentHandoffModalProps {
  isOpen: boolean;
  values: RegistrationFormValues;
  onClose: () => void;
}

interface OrderInitResponse {
  configured: boolean;
  mode: 'official-portal-handoff' | 'razorpay-checkout';
  officialPortalUrl?: string;
  orderId?: string;
  keyId?: string;
  amountPaise?: number;
  referenceCode: string;
  amountInr: number;
  currency?: string;
  status: 'awaiting-gateway' | 'paid' | 'refunded';
  message?: string;
}

declare global {
  interface Window {
    Razorpay?: new (options: Record<string, unknown>) => { open: () => void };
  }
}

const RAZORPAY_CHECKOUT_SCRIPT_SRC = 'https://checkout.razorpay.com/v1/checkout.js';

function loadRazorpayCheckoutScript(): Promise<boolean> {
  if (typeof window === 'undefined') return Promise.resolve(false);
  if (window.Razorpay) return Promise.resolve(true);
  return new Promise((resolve) => {
    const existing = document.querySelector(`script[src="${RAZORPAY_CHECKOUT_SCRIPT_SRC}"]`);
    if (existing) {
      existing.addEventListener('load', () => resolve(true));
      existing.addEventListener('error', () => resolve(false));
      return;
    }
    const script = document.createElement('script');
    script.src = RAZORPAY_CHECKOUT_SCRIPT_SRC;
    script.async = true;
    script.onload = () => resolve(true);
    script.onerror = () => resolve(false);
    document.body.appendChild(script);
  });
}

interface PaymentStatusResponse {
  referenceCode: string;
  paymentStatus: 'awaiting-gateway' | 'paid' | 'refunded';
  paymentRecordStatus: 'initiated' | 'captured' | 'refunded' | 'failed';
  amountInr: number;
  receiptAvailable: boolean;
  receiptIssuedAt: string | null;
}

export const PaymentHandoffModal: React.FC<PaymentHandoffModalProps> = ({
  isOpen,
  values,
  onClose,
}) => {
  const { t } = useI18n();
  const [saveState, setSaveState] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle');
  const [referenceCode, setReferenceCode] = useState<string | null>(null);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [orderInfo, setOrderInfo] = useState<OrderInitResponse | null>(null);
  const [liveStatus, setLiveStatus] = useState<PaymentStatusResponse | null>(null);
  const [refreshingStatus, setRefreshingStatus] = useState(false);
  const [checkoutState, setCheckoutState] = useState<'idle' | 'opening' | 'verifying' | 'error'>('idle');
  const [checkoutError, setCheckoutError] = useState<string | null>(null);
  const lastSubmittedSignatureRef = useRef<string>('');

  const fetchPaymentStatus = useCallback(async (refCode: string) => {
    setRefreshingStatus(true);
    try {
      const res = await fetch(`/api/public/payments/${encodeURIComponent(refCode)}/status`);
      if (res.ok) {
        const json = (await res.json()) as PaymentStatusResponse;
        setLiveStatus(json);
      }
    } finally {
      setRefreshingStatus(false);
    }
  }, []);

  const handleOpenRazorpayCheckout = useCallback(async () => {
    if (!orderInfo || orderInfo.mode !== 'razorpay-checkout' || !orderInfo.orderId || !orderInfo.keyId) {
      return;
    }
    setCheckoutError(null);
    setCheckoutState('opening');

    const ready = await loadRazorpayCheckoutScript();
    if (!ready || !window.Razorpay) {
      setCheckoutState('error');
      setCheckoutError('Could not load the secure checkout. Please check your connection and try again.');
      return;
    }

    const rzp = new window.Razorpay({
      key: orderInfo.keyId,
      order_id: orderInfo.orderId,
      amount: orderInfo.amountPaise,
      currency: orderInfo.currency || 'INR',
      name: 'Bhagavad Gita Vishwa Mahotsav 2027',
      description: `Registration ${orderInfo.referenceCode}`,
      prefill: {
        name: values.fullName.trim(),
        email: values.email.trim(),
        contact: values.phone.trim(),
      },
      notes: { referenceCode: orderInfo.referenceCode },
      theme: { color: '#8F6018' },
      handler: (response: {
        razorpay_payment_id: string;
        razorpay_order_id: string;
        razorpay_signature: string;
      }) => {
        setCheckoutState('verifying');
        fetch('/api/public/payments/verify', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            razorpayOrderId: response.razorpay_order_id,
            razorpayPaymentId: response.razorpay_payment_id,
            razorpaySignature: response.razorpay_signature,
          }),
        })
          .then(async (res) => {
            if (!res.ok) {
              const data = (await res.json().catch(() => ({}))) as { error?: string };
              throw new Error(data.error || 'Payment could not be verified.');
            }
            setCheckoutState('idle');
            if (referenceCode) void fetchPaymentStatus(referenceCode);
          })
          .catch((err) => {
            setCheckoutState('error');
            setCheckoutError(
              err instanceof Error
                ? err.message
                : 'Payment succeeded at the gateway but could not be confirmed automatically. Use Refresh Status, or contact the Secretariat with your reference code.',
            );
          });
      },
      modal: {
        ondismiss: () => setCheckoutState('idle'),
      },
    });
    setCheckoutState('idle');
    rzp.open();
  }, [orderInfo, values, referenceCode, fetchPaymentStatus]);

  useEffect(() => {
    if (!isOpen) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [isOpen, onClose]);

  useEffect(() => {
    if (!isOpen) {
      setSaveState('idle');
      setSaveError(null);
      return;
    }

    const sig = `${values.email}|${values.fullName}|${values.registrationType}|${values.noOfPersons}|${values.donationAmount}|${values.city}`;
    if (!values.fullName.trim() || !values.email.trim() || lastSubmittedSignatureRef.current === sig) {
      return;
    }

    lastSubmittedSignatureRef.current = sig;
    setSaveState('saving');
    setSaveError(null);
    setOrderInfo(null);
    setLiveStatus(null);

    fetch('/api/public/registrations', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        fullName: values.fullName.trim(),
        email: values.email.trim(),
        phone: values.phone.trim(),
        noOfPersons: Number(values.noOfPersons) || 1,
        donationAmount: Number(values.donationAmount) || 0,
        registrationType: values.registrationType,
        country: values.country,
        city: values.city.trim(),
        assistance: values.assistance,
        events: values.events,
        preferredLanguage: values.preferredLanguage,
        familyOrGroupMembers: values.familyOrGroupMembers,
        organisationName: values.organisationName,
        organisationRole: values.organisationRole,
        volunteerSkills: values.volunteerSkills,
        parayanaCity: values.parayanaCity,
        assistanceNotes: values.assistanceNotes,
      }),
    })
      .then(async (res) => {
        const data = (await res.json().catch(() => ({}))) as {
          referenceCode?: string;
          error?: string;
        };
        if (!res.ok || !data.referenceCode) {
          throw new Error(data.error || 'Could not record registration with Secretariat.');
        }
        const refCode = data.referenceCode;
        setReferenceCode(refCode);
        setSaveState('saved');

        const [orderRes] = await Promise.all([
          fetch('/api/public/payments/create-order', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              referenceCode: refCode,
              amountInr: Number(values.donationAmount) || 0,
            }),
          }),
          fetchPaymentStatus(refCode),
        ]);
        if (orderRes.ok) {
          setOrderInfo((await orderRes.json()) as OrderInitResponse);
        }
      })
      .catch((err) => {
        setSaveState('error');
        setSaveError(err instanceof Error ? err.message : 'Unable to save registration.');
      });
  }, [isOpen, values, fetchPaymentStatus]);

  useEffect(() => {
    if (!isOpen || !referenceCode) return;
    if (liveStatus?.paymentStatus === 'paid') return;
    const id = window.setInterval(() => {
      void fetchPaymentStatus(referenceCode);
    }, 8000);
    return () => window.clearInterval(id);
  }, [isOpen, referenceCode, liveStatus?.paymentStatus, fetchPaymentStatus]);

  if (!isOpen) return null;

  const regTypeOption = REGISTRATION_TYPE_OPTIONS.find((opt) => opt.value === values.registrationType);
  const countryOption = getRegistrationCountryOptions().find((opt) => opt.id === values.country);
  const selectedEvents = EVENT_SELECTION_OPTIONS.filter((opt) => values.events[opt.key]).map((opt) =>
    t(opt.labelKey),
  );
  const selectedAssistance = ASSISTANCE_OPTIONS.filter((opt) => values.assistance[opt.key]).map(
    (opt) => t(opt.labelKey),
  );

  const isPaid = liveStatus?.paymentStatus === 'paid' && liveStatus.receiptAvailable;
  const isFailed = liveStatus?.paymentRecordStatus === 'failed';

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#101426]/80 backdrop-blur-xs"
      role="dialog"
      aria-modal="true"
      aria-labelledby="payment-handoff-title"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-lg rounded-2xl bg-[#FFF6E8] text-[#24201C] border border-[#D6A447] shadow-[0_24px_60px_rgba(16,20,38,0.55)] p-6 sm:p-7 max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-4 pb-4 border-b border-[#D6A447]/35">
          <div className="space-y-1">
            <div className="inline-flex items-center gap-2 text-[11px] font-semibold tracking-[0.14em] uppercase text-[#8F6018]">
              <ShieldCheck className="w-4 h-4 text-[#D6A447]" aria-hidden="true" />
              <span>{t('registration.form.governanceHeading')}</span>
            </div>
            <h2
              id="payment-handoff-title"
              className="font-editorial text-2xl sm:text-[26px] font-medium text-[#24201C]"
            >
              {t('registration.handoff.title')}
            </h2>
            <p className="text-xs sm:text-sm text-[#5B5248]">
              {t('registration.handoff.subtitle')}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label={t('modal.close')}
            className="inline-flex items-center justify-center w-9 h-9 rounded-full border border-[#D6A447]/50 text-[#24201C] hover:border-[#24201C] cursor-pointer shrink-0"
          >
            <X className="w-4 h-4" aria-hidden="true" />
          </button>
        </div>

        {/* Live Secretariat Persistence + Payment Webhook Status */}
        <div className="mt-4 space-y-2.5">
          {saveState === 'saving' && (
            <div className="flex items-center gap-2 rounded-xl border border-[#D6A447]/40 bg-[#F4E8D3]/70 px-3.5 py-2.5 text-xs text-[#5B5248]">
              <Loader2 className="w-4 h-4 animate-spin text-[#8F6018]" aria-hidden="true" />
              <span>Recording registration dossier with Mahotsav Secretariat…</span>
            </div>
          )}

          {saveState === 'saved' && referenceCode && (
            <div
              data-testid="registration-reference-banner"
              className="flex items-center justify-between gap-3 rounded-xl border border-[#2E6F40]/40 bg-[#2E6F40]/10 px-3.5 py-2.5 text-xs text-[#1B4A28]"
            >
              <span className="inline-flex items-center gap-2 font-medium">
                <CheckCircle2 className="w-4 h-4 text-[#2E6F40] shrink-0" aria-hidden="true" />
                <span>Secretariat Dossier Recorded</span>
              </span>
              <span className="font-mono font-semibold tracking-wider text-[#24201C]">
                {referenceCode}
              </span>
            </div>
          )}

          {liveStatus && (
            <div
              data-testid="payment-live-status-box"
              className={`flex items-center justify-between gap-3 rounded-xl border px-3.5 py-2.5 text-xs ${
                isPaid
                  ? 'border-[#2E6F40]/45 bg-[#2E6F40]/15 text-[#1B4A28]'
                  : isFailed
                    ? 'border-red-500/45 bg-red-500/10 text-red-900'
                    : 'border-[#D4A537]/55 bg-[#F4E8D3]/80 text-[#5C4420]'
              }`}
            >
              <span className="inline-flex items-center gap-2 font-medium">
                {isPaid ? (
                  <CheckCircle2 className="w-4 h-4 text-[#2E6F40]" />
                ) : isFailed ? (
                  <AlertTriangle className="w-4 h-4 text-red-600" />
                ) : (
                  <Clock className="w-4 h-4 text-[#8F6018]" />
                )}
                <span>
                  Payment Status:{' '}
                  <strong className="uppercase">{liveStatus.paymentStatus}</strong>
                </span>
              </span>
              {referenceCode && (
                <button
                  type="button"
                  data-testid="refresh-payment-status-btn"
                  disabled={refreshingStatus}
                  onClick={() => void fetchPaymentStatus(referenceCode)}
                  className="inline-flex items-center gap-1 text-[11px] font-semibold underline cursor-pointer disabled:opacity-60"
                >
                  <RefreshCw className={`w-3 h-3 ${refreshingStatus ? 'animate-spin' : ''}`} />
                  <span>Refresh Status</span>
                </button>
              )}
            </div>
          )}

          {orderInfo && (
            <div
              data-testid="payment-order-status-box"
              className="rounded-xl border border-[#D6A447]/40 bg-white/80 px-3.5 py-2.5 text-xs text-[#4F473E]"
            >
              {orderInfo.configured ? (
                <p>
                  Secure gateway order ready: <strong className="font-mono">{orderInfo.orderId}</strong>
                </p>
              ) : (
                <p>
                  <strong>Official Portal Handoff:</strong>{' '}
                  {orderInfo.message ||
                    'A payment gateway is not configured on this server. Proceed to the official Mahotsav payment portal to complete payment.'}
                </p>
              )}
            </div>
          )}

          {checkoutError && (
            <div className="rounded-xl border border-red-500/45 bg-red-500/10 px-3.5 py-2.5 text-xs text-red-900">
              {checkoutError}
            </div>
          )}

          {saveState === 'error' && saveError && (
            <div className="rounded-xl border border-amber-600/40 bg-amber-100/70 px-3.5 py-2.5 text-xs text-amber-900">
              {saveError}
            </div>
          )}
        </div>

        <dl className="mt-4 divide-y divide-[#D6A447]/25 text-xs sm:text-sm">
          <div className="py-2 flex justify-between gap-4">
            <dt className="text-[#6B6155] font-medium">{t('registration.handoff.participantLabel')}</dt>
            <dd className="text-[#24201C] font-semibold text-right">{values.fullName.trim()}</dd>
          </div>
          {regTypeOption && (
            <div className="py-2 flex justify-between gap-4">
              <dt className="text-[#6B6155] font-medium">{t('registration.handoff.typeLabel')}</dt>
              <dd className="text-[#24201C] text-right">{t(regTypeOption.labelKey)}</dd>
            </div>
          )}
          <div className="py-2 flex justify-between gap-4">
            <dt className="text-[#6B6155] font-medium">{t('registration.handoff.locationLabel')}</dt>
            <dd className="text-[#24201C] text-right">
              {values.city.trim()}, {countryOption ? t(countryOption.labelKey) : values.country}
            </dd>
          </div>
          <div className="py-2 flex justify-between gap-4">
            <dt className="text-[#6B6155] font-medium">{t('registration.handoff.eventsLabel')}</dt>
            <dd className="text-[#24201C] text-right">{selectedEvents.join(', ')}</dd>
          </div>
          <div className="py-2 flex justify-between gap-4">
            <dt className="text-[#6B6155] font-medium">{t('registration.handoff.assistanceLabel')}</dt>
            <dd className="text-[#24201C] text-right">
              {selectedAssistance.length > 0
                ? selectedAssistance.join(', ')
                : t('registration.handoff.assistanceNone')}
            </dd>
          </div>
          <div className="py-2.5 flex justify-between items-baseline gap-4">
            <dt className="text-[#24201C] font-semibold">{t('registration.handoff.amountLabel')}</dt>
            <dd className="font-editorial text-2xl font-semibold text-[#8F6018] tabular-nums">
              ₹ {formatInrAmount(values.donationAmount)}
            </dd>
          </div>
        </dl>

        <div className="mt-3 rounded-xl border border-[#D6A447]/40 bg-[#F4E8D3]/75 p-3 text-xs text-[#4F473E] leading-relaxed flex items-start gap-2.5">
          <Lock className="w-4 h-4 text-[#8F6018] shrink-0 mt-0.5" aria-hidden="true" />
          <span>{t('registration.handoff.notice')}</span>
        </div>

        <div className="mt-5 flex flex-col sm:flex-row items-stretch sm:items-center justify-end gap-3">
          <button
            type="button"
            onClick={onClose}
            className="min-h-[42px] px-5 py-2 rounded-full border border-[#D6A447]/60 text-xs font-semibold text-[#24201C] hover:bg-[#F4E8D3] transition-colors cursor-pointer"
          >
            {t('registration.handoff.editCta')}
          </button>

          {isPaid ? (
            <button
              type="button"
              onClick={() => window.print()}
              className="min-h-[42px] inline-flex items-center justify-center gap-2 px-6 py-2 rounded-full bg-[#2E6F40] text-white text-xs font-semibold uppercase tracking-[0.06em] cursor-pointer"
            >
              <Printer className="w-4 h-4" />
              <span>Print Confirmed Receipt</span>
            </button>
          ) : orderInfo?.mode === 'razorpay-checkout' ? (
            <button
              type="button"
              disabled={checkoutState === 'opening' || checkoutState === 'verifying'}
              onClick={() => void handleOpenRazorpayCheckout()}
              className="min-h-[42px] inline-flex items-center justify-center gap-2 px-6 py-2 rounded-full bg-gradient-to-r from-[#D6A447] via-[#B47D27] to-[#8F6018] text-[#FFF6E8] text-xs font-semibold tracking-[0.06em] uppercase shadow-[0_8px_22px_rgba(143,96,24,0.32)] hover:brightness-105 transition-all disabled:opacity-60 cursor-pointer"
            >
              {checkoutState === 'opening' || checkoutState === 'verifying' ? (
                <Loader2 className="w-4 h-4 animate-spin" aria-hidden="true" />
              ) : (
                <Lock className="w-4 h-4" aria-hidden="true" />
              )}
              <span>
                {checkoutState === 'verifying'
                  ? 'Confirming Payment…'
                  : `Pay ₹${formatInrAmount(values.donationAmount)} Securely`}
              </span>
            </button>
          ) : (
            <a
              href={orderInfo?.officialPortalUrl || OFFICIAL_EVENT_URLS.register}
              target="_blank"
              rel="noopener noreferrer"
              className="min-h-[42px] inline-flex items-center justify-center gap-2 px-6 py-2 rounded-full bg-gradient-to-r from-[#D6A447] via-[#B47D27] to-[#8F6018] text-[#FFF6E8] text-xs font-semibold tracking-[0.06em] uppercase shadow-[0_8px_22px_rgba(143,96,24,0.32)] hover:brightness-105 transition-all"
            >
              <span>{t('registration.handoff.proceedCta')}</span>
              <ArrowUpRight className="w-4 h-4" aria-hidden="true" />
            </a>
          )}
        </div>
      </div>
    </div>
  );
};
