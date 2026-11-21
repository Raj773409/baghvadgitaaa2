import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  AlertTriangle,
  ArrowLeft,
  CreditCard,
  Landmark,
  LayoutDashboard,
  Loader2,
  Lock,
  RefreshCw,
  Search,
  ShieldCheck,
  Smartphone,
  Sparkles,
  Wallet,
  X,
} from 'lucide-react';
import { useI18n } from '../../i18n';
import { useToast } from '../ui/Toaster';
import {
  ApiError,
  announcePortalSessionChange,
  checkoutApi,
  type CreateOrderResponse,
  type MethodSelection,
  type PaymentSuccessResponse,
} from '../../utils/portalApi';
import {
  CARD_BRAND_LABELS,
  NETBANKING_BANKS,
  PAYMENT_METHOD_FAMILIES,
  UPI_APPS,
  WALLETS,
  detectCardBrand,
  digitsOnly,
  formatCardNumber,
  isValidCardExpiry,
  isValidCvv,
  isValidUpiId,
  maskCardLabel,
  maskUpiId,
  passesLuhn,
  type PaymentMethodFamily,
  type PaymentProvider,
} from '../../utils/paymentMethods';
import {
  EVENT_SELECTION_OPTIONS,
  REGISTRATION_TYPE_OPTIONS,
  formatInrAmount,
  type RegistrationFormValues,
} from '../../utils/registrationValidation';

interface CheckoutExperienceProps {
  isOpen: boolean;
  values: RegistrationFormValues;
  onClose: () => void;
}

type Phase = 'saving' | 'save-error' | 'select' | 'bank' | 'processing' | 'failed' | 'success';
type GatewayKind = 'razorpay' | 'sandbox' | 'unknown';

interface SuccessInfo {
  receiptNumber: string | null;
  passesIssued: number | null;
  mode: 'live' | 'test';
  alreadyPaid?: boolean;
}

declare global {
  interface Window {
    Razorpay?: new (options: Record<string, unknown>) => { open: () => void };
  }
}

const RAZORPAY_CHECKOUT_SCRIPT_SRC = 'https://checkout.razorpay.com/v1/checkout.js';
const SANDBOX_DECLINE_CARD = '4000000000000002';
const PROCESSING_STEPS = [
  'Contacting your bank…',
  'Authorising payment…',
  'Securing transaction…',
  'Issuing your entry passes…',
];

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

const wait = (ms: number) => new Promise((r) => window.setTimeout(r, ms));

const FAMILY_ICONS: Record<PaymentMethodFamily, React.ElementType> = {
  upi: Smartphone,
  card: CreditCard,
  netbanking: Landmark,
  wallet: Wallet,
};

const inputClass =
  'w-full min-h-[44px] rounded-xl bg-[#0B111C]/70 border border-[#D4A537]/30 px-3.5 text-sm text-[#FFFDF7] placeholder:text-[#E9DCC5]/40 focus:outline-none focus:border-[#F7D774] focus:shadow-[0_0_0_3px_rgba(247,215,116,0.15)] transition-colors';

const ProviderTile: React.FC<{
  provider: PaymentProvider;
  selected: boolean;
  onSelect: () => void;
}> = ({ provider, selected, onSelect }) => (
  <button
    type="button"
    onClick={onSelect}
    aria-pressed={selected}
    className={`glow-card flex flex-col items-center gap-2 rounded-xl border px-2 py-3 text-center cursor-pointer ${
      selected
        ? 'border-[#F7D774] bg-[#D4A537]/15 shadow-[0_0_28px_-10px_rgba(247,215,116,0.8)]'
        : 'border-[#D4A537]/20 bg-white/[0.03]'
    }`}
  >
    <span
      className="grid place-items-center w-10 h-10 rounded-full text-xs font-bold text-white"
      style={{
        background: `radial-gradient(circle at 30% 30%, ${provider.accent}, ${provider.accent}AA 60%, #0B111C 140%)`,
        boxShadow: selected ? `0 0 18px -2px ${provider.accent}` : 'none',
      }}
      aria-hidden="true"
    >
      {provider.mark}
    </span>
    <span className="text-[11px] leading-tight text-[#FFFDF7]/90">{provider.label}</span>
  </button>
);

export const CheckoutExperience: React.FC<CheckoutExperienceProps> = ({ isOpen, values, onClose }) => {
  const { t } = useI18n();
  const { notify } = useToast();
  const navigate = useNavigate();
  const dialogRef = useRef<HTMLDivElement | null>(null);

  // Registration persistence (deduped per identical submission, survives close/reopen)
  const lastSignatureRef = useRef('');
  const [referenceCode, setReferenceCode] = useState<string | null>(null);
  const [phase, setPhase] = useState<Phase>('saving');
  const [saveError, setSaveError] = useState<string | null>(null);
  const [gateway, setGateway] = useState<GatewayKind>('unknown');

  // Method selection
  const [family, setFamily] = useState<PaymentMethodFamily>('upi');
  const [upiApp, setUpiApp] = useState<string | null>(null);
  const [upiId, setUpiId] = useState('');
  const [cardNumber, setCardNumber] = useState('');
  const [cardName, setCardName] = useState('');
  const [cardExpiry, setCardExpiry] = useState('');
  const [cardCvv, setCardCvv] = useState('');
  const [bankId, setBankId] = useState<string | null>(null);
  const [bankQuery, setBankQuery] = useState('');
  const [walletId, setWalletId] = useState<string | null>(null);

  // Flow
  const [pendingOrder, setPendingOrder] = useState<CreateOrderResponse | null>(null);
  const [processingStep, setProcessingStep] = useState(0);
  const [failureReason, setFailureReason] = useState<string | null>(null);
  const [success, setSuccess] = useState<SuccessInfo | null>(null);
  const [countdown, setCountdown] = useState<number | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const testMode = gateway !== 'razorpay';
  const amount = Number(values.donationAmount) || 0;

  const saveRegistration = useCallback(async () => {
    setPhase('saving');
    setSaveError(null);
    try {
      const res = await checkoutApi.register({
        fullName: values.fullName.trim(),
        email: values.email.trim(),
        phone: values.phone.trim(),
        noOfPersons: Number(values.noOfPersons) || 1,
        donationAmount: amount,
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
      });
      setReferenceCode(res.referenceCode);
      setPhase('select');
      notify({
        tone: 'info',
        title: 'Registration saved',
        body: `Reference ${res.referenceCode}. Choose how you'd like to pay.`,
      });
    } catch (err) {
      lastSignatureRef.current = '';
      setSaveError(err instanceof Error ? err.message : 'Unable to save registration.');
      setPhase('save-error');
    }
  }, [values, amount, notify]);

  // Open: register once per identical values, detect gateway mode
  useEffect(() => {
    if (!isOpen) return;
    const sig = `${values.email}|${values.fullName}|${values.registrationType}|${values.noOfPersons}|${values.donationAmount}|${values.city}`;
    if (lastSignatureRef.current !== sig) {
      lastSignatureRef.current = sig;
      setReferenceCode(null);
      setSuccess(null);
      setFailureReason(null);
      void saveRegistration();
    } else if (phase !== 'success') {
      setPhase(referenceCode ? 'select' : 'saving');
    }
    fetch('/api/payments/gateway-status')
      .then((r) => r.json())
      .then((s: { providers?: { razorpay?: boolean } }) => setGateway(s.providers?.razorpay ? 'razorpay' : 'sandbox'))
      .catch(() => setGateway('sandbox'));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, values]);

  const busy = phase === 'processing' || submitting;

  // Esc to close, scroll lock, focus
  useEffect(() => {
    if (!isOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && !busy) onClose();
    };
    window.addEventListener('keydown', onKey);
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    dialogRef.current?.focus();
    return () => {
      window.removeEventListener('keydown', onKey);
      document.body.style.overflow = prevOverflow;
    };
  }, [isOpen, busy, onClose]);

  // Processing step ticker
  useEffect(() => {
    if (phase !== 'processing') return;
    setProcessingStep(0);
    const id = window.setInterval(() => setProcessingStep((s) => Math.min(s + 1, PROCESSING_STEPS.length - 1)), 650);
    return () => window.clearInterval(id);
  }, [phase]);

  // Success auto-redirect
  useEffect(() => {
    if (countdown === null) return;
    if (countdown <= 0) {
      navigate('/dashboard');
      return;
    }
    const id = window.setTimeout(() => setCountdown((c) => (c === null ? null : c - 1)), 1000);
    return () => window.clearTimeout(id);
  }, [countdown, navigate]);

  // ---------------------------------------------------------------------------
  // Selection validity
  // ---------------------------------------------------------------------------
  const cardBrand = detectCardBrand(cardNumber);
  const cardDigits = digitsOnly(cardNumber);
  const selection: { valid: boolean; method: MethodSelection | null; outcome: 'success' | 'failure'; hint?: string } =
    useMemo(() => {
      if (family === 'upi') {
        if (!upiApp) return { valid: false, method: null, outcome: 'success' };
        if (upiApp === 'upi-id') {
          const ok = isValidUpiId(upiId);
          return {
            valid: ok,
            method: ok
              ? { methodFamily: 'upi', methodProvider: 'upi-id', methodLabel: `UPI · ${maskUpiId(upiId)}` }
              : null,
            outcome: upiId.trim().toLowerCase().startsWith('failure@') ? 'failure' : 'success',
          };
        }
        const app = UPI_APPS.find((a) => a.id === upiApp);
        return {
          valid: true,
          method: { methodFamily: 'upi', methodProvider: upiApp, methodLabel: `UPI · ${app?.label ?? 'UPI'}` },
          outcome: 'success',
        };
      }
      if (family === 'card') {
        if (gateway === 'razorpay') {
          // Live: card details are entered only inside Razorpay's secure checkout.
          return { valid: true, method: { methodFamily: 'card' }, outcome: 'success' };
        }
        const ok =
          passesLuhn(cardDigits) &&
          cardName.trim().length >= 2 &&
          isValidCardExpiry(cardExpiry) &&
          isValidCvv(cardCvv, cardBrand);
        return {
          valid: ok,
          method: ok ? { methodFamily: 'card', methodProvider: cardBrand, methodLabel: maskCardLabel(cardDigits) } : null,
          outcome: cardDigits === SANDBOX_DECLINE_CARD ? 'failure' : 'success',
        };
      }
      if (family === 'netbanking') {
        const bank = NETBANKING_BANKS.find((b) => b.id === bankId);
        return {
          valid: Boolean(bank),
          method: bank ? { methodFamily: 'netbanking', methodProvider: bank.id, methodLabel: `Net Banking · ${bank.label}` } : null,
          outcome: 'success',
        };
      }
      const wallet = WALLETS.find((w) => w.id === walletId);
      return {
        valid: Boolean(wallet),
        method: wallet ? { methodFamily: 'wallet', methodProvider: wallet.id, methodLabel: `Wallet · ${wallet.label}` } : null,
        outcome: 'success',
      };
    }, [family, upiApp, upiId, gateway, cardDigits, cardName, cardExpiry, cardCvv, cardBrand, bankId, walletId]);

  // ---------------------------------------------------------------------------
  // Payment flow
  // ---------------------------------------------------------------------------
  const handleSuccess = useCallback(
    (res: PaymentSuccessResponse | SuccessInfo) => {
      const info: SuccessInfo =
        'ok' in res
          ? { receiptNumber: res.receiptNumber, passesIssued: res.passesIssued, mode: res.mode }
          : res;
      setSuccess(info);
      setPhase('success');
      setCountdown(6);
      announcePortalSessionChange();
      notify({
        tone: 'success',
        title: info.alreadyPaid ? 'Already paid' : 'Payment successful',
        body: info.alreadyPaid
          ? 'This registration is already confirmed. Opening your dashboard.'
          : `Receipt ${info.receiptNumber ?? ''} · ${info.passesIssued ?? 0} entry pass${info.passesIssued === 1 ? '' : 'es'} issued.`,
        duration: 7000,
      });
    },
    [notify],
  );

  const handleFlowError = useCallback(
    (err: unknown) => {
      if (err instanceof ApiError) {
        if (err.code === 'ALREADY_PAID') {
          handleSuccess({ receiptNumber: null, passesIssued: null, mode: testMode ? 'test' : 'live', alreadyPaid: true });
          return;
        }
        if (err.status === 402 || err.code === 'PAYMENT_DECLINED') {
          setFailureReason(err.message);
          setPhase('failed');
          notify({ tone: 'error', title: 'Payment declined', body: err.message });
          return;
        }
      }
      setPhase('select');
      notify({
        tone: 'error',
        title: 'Could not complete payment',
        body: err instanceof Error ? err.message : 'Please try again.',
      });
    },
    [handleSuccess, notify, testMode],
  );

  const runSandbox = useCallback(
    async (order: CreateOrderResponse, method: MethodSelection, outcome: 'success' | 'failure') => {
      setPhase('processing');
      try {
        const [res] = await Promise.all([checkoutApi.completeSandbox(order.orderId, method, outcome), wait(1900)]);
        handleSuccess(res);
      } catch (err) {
        await wait(200);
        handleFlowError(err);
      }
    },
    [handleSuccess, handleFlowError],
  );

  const openRazorpay = useCallback(
    async (order: Extract<CreateOrderResponse, { mode: 'razorpay-checkout' }>, method: MethodSelection) => {
      const ready = await loadRazorpayCheckoutScript();
      if (!ready || !window.Razorpay) {
        notify({ tone: 'error', title: 'Secure checkout unavailable', body: 'Could not load the payment window. Check your connection and retry.' });
        setPhase('select');
        return;
      }
      const instrument: Record<string, unknown> = { method: method.methodFamily };
      if (method.methodFamily === 'netbanking' && method.methodProvider) instrument.banks = [method.methodProvider];
      if (method.methodFamily === 'wallet' && method.methodProvider) instrument.wallets = [method.methodProvider];
      const familyLabel = PAYMENT_METHOD_FAMILIES.find((f) => f.id === method.methodFamily)?.label ?? 'Pay';

      const rzp = new window.Razorpay({
        key: order.keyId,
        order_id: order.orderId,
        amount: order.amountPaise,
        currency: order.currency || 'INR',
        name: 'Bhagavad Gita Vishwa Mahotsav 2027',
        description: `Registration ${order.referenceCode}`,
        prefill: {
          name: values.fullName.trim(),
          email: values.email.trim(),
          contact: values.phone.trim(),
          method: method.methodFamily,
          ...(method.methodProvider === 'upi-id' && upiId ? { vpa: upiId.trim() } : {}),
        },
        notes: { referenceCode: order.referenceCode },
        theme: { color: '#D4A537' },
        config: {
          display: {
            blocks: { chosen: { name: `Pay via ${familyLabel}`, instruments: [instrument] } },
            sequence: ['block.chosen'],
            preferences: { show_default_blocks: false },
          },
        },
        handler: (response: { razorpay_payment_id: string; razorpay_order_id: string; razorpay_signature: string }) => {
          setPhase('processing');
          checkoutApi.verifyRazorpay(response).then(handleSuccess).catch(handleFlowError);
        },
        modal: {
          ondismiss: () => {
            setPhase('select');
            notify({ tone: 'info', title: 'Payment window closed', body: 'No money was taken. Pick a method to try again.' });
          },
        },
      });
      rzp.open();
    },
    [values, upiId, handleSuccess, handleFlowError, notify],
  );

  const handlePay = useCallback(async () => {
    if (!referenceCode || !selection.valid || !selection.method || submitting) return;
    setSubmitting(true);
    setFailureReason(null);
    try {
      const order = await checkoutApi.createOrder(referenceCode, selection.method);
      if (order.mode === 'razorpay-checkout') {
        setGateway('razorpay');
        await openRazorpay(order, selection.method);
        return;
      }
      if (selection.method.methodFamily === 'netbanking' || selection.method.methodFamily === 'wallet') {
        setPendingOrder(order);
        setPhase('bank');
        return;
      }
      await runSandbox(order, selection.method, selection.outcome);
    } catch (err) {
      handleFlowError(err);
    } finally {
      setSubmitting(false);
    }
  }, [referenceCode, selection, submitting, openRazorpay, runSandbox, handleFlowError]);

  const confetti = useMemo(
    () =>
      Array.from({ length: 42 }, (_, i) => ({
        left: `${(i * 37) % 100}%`,
        color: ['#F7D774', '#D4A537', '#FFF1B8', '#E8762B', '#B8862A'][i % 5],
        drift: `${((i * 53) % 160) - 80}px`,
        spin: `${360 + ((i * 97) % 540)}deg`,
        fall: `${2.2 + ((i * 13) % 14) / 10}s`,
        delay: `${((i * 7) % 10) / 20}s`,
        size: 6 + (i % 4) * 2,
      })),
    [],
  );

  if (!isOpen) return null;

  const regTypeOption = REGISTRATION_TYPE_OPTIONS.find((o) => o.value === values.registrationType);
  const selectedEvents = EVENT_SELECTION_OPTIONS.filter((o) => values.events[o.key]).map((o) => t(o.labelKey));
  const filteredBanks = NETBANKING_BANKS.filter((b) => b.label.toLowerCase().includes(bankQuery.trim().toLowerCase()));

  // ---------------------------------------------------------------------------
  // Render pieces
  // ---------------------------------------------------------------------------
  const summary = (
    <aside className="relative lg:w-[42%] shrink-0 p-5 sm:p-6 bg-gradient-to-b from-[#17233A] to-[#0E1523] border-b lg:border-b-0 lg:border-r border-[#D4A537]/25 overflow-hidden">
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -top-24 -left-20 w-72 h-72 rounded-full bg-[radial-gradient(circle,rgba(247,215,116,0.18),transparent_65%)] blur-2xl"
      />
      {testMode && gateway !== 'unknown' && (
        <div className="absolute top-4 -right-10 rotate-45 bg-[#E8762B] text-[#171717] text-[10px] font-bold tracking-[0.18em] uppercase px-10 py-1 shadow-lg">
          Test mode
        </div>
      )}
      <div className="relative space-y-5">
        <div className="space-y-1">
          <p className="inline-flex items-center gap-2 text-[10px] font-semibold tracking-[0.2em] uppercase text-[#D4A537]">
            <ShieldCheck className="w-3.5 h-3.5" aria-hidden="true" /> Secure checkout
          </p>
          <h2 id="checkout-title" className="font-editorial text-2xl sm:text-[28px] leading-tight">
            <span className="royal-gold-gradient-text">Complete your registration</span>
          </h2>
        </div>

        <dl className="space-y-2.5 text-sm">
          {[
            ['Participant', values.fullName.trim()],
            ['Category', regTypeOption ? t(regTypeOption.labelKey) : values.registrationType],
            ['Events', selectedEvents.join(' · ') || '—'],
            ['Persons', String(Number(values.noOfPersons) || 1)],
          ].map(([k, v]) => (
            <div key={k} className="flex justify-between gap-4">
              <dt className="text-[#E9DCC5]/60">{k}</dt>
              <dd className="text-right text-[#FFFDF7]">{v}</dd>
            </div>
          ))}
          {referenceCode && (
            <div className="flex justify-between gap-4">
              <dt className="text-[#E9DCC5]/60">Reference</dt>
              <dd className="font-mono font-semibold tracking-wider text-[#F7D774]">{referenceCode}</dd>
            </div>
          )}
        </dl>

        <div className="relative rounded-2xl border border-[#D4A537]/40 bg-[#0B111C]/60 p-4 overflow-hidden">
          <span aria-hidden="true" className="absolute inset-y-0 -left-1/2 w-1/3 bg-gradient-to-r from-transparent via-white/10 to-transparent shimmer-sweep" />
          <p className="text-[11px] uppercase tracking-[0.16em] text-[#E9DCC5]/60">Amount payable</p>
          <p className="font-editorial text-4xl font-semibold tabular-nums">
            <span className="royal-gold-gradient-text">₹ {formatInrAmount(values.donationAmount)}</span>
          </p>
        </div>

        <p className="flex items-start gap-2 text-[11px] text-[#E9DCC5]/65 leading-relaxed">
          <Lock className="w-3.5 h-3.5 shrink-0 mt-0.5 text-[#D4A537]" aria-hidden="true" />
          {testMode
            ? 'Test mode: payments are simulated end-to-end. No real money is charged.'
            : 'Payments are processed by Razorpay over an encrypted connection. We never see or store your card or UPI PIN.'}
        </p>
      </div>
    </aside>
  );

  const methodPanel = (
    <div className="space-y-4">
      <div role="group" aria-label="Payment method" className="grid grid-cols-2 sm:grid-cols-4 gap-2">
        {PAYMENT_METHOD_FAMILIES.map((f) => {
          const Icon = FAMILY_ICONS[f.id];
          const active = family === f.id;
          return (
            <button
              key={f.id}
              type="button"
              aria-pressed={active}
              onClick={() => setFamily(f.id)}
              className={`flex flex-col items-center gap-1 rounded-xl px-2 py-2.5 text-xs font-semibold cursor-pointer transition-colors ${
                active ? 'royal-gold-surface' : 'border border-[#D4A537]/25 text-[#FFFDF7]/80 hover:text-[#F7D774] hover:border-[#D4A537]/60'
              }`}
            >
              <Icon className="w-4 h-4" aria-hidden="true" />
              {f.label}
            </button>
          );
        })}
      </div>
      <p className="text-[11px] text-[#E9DCC5]/55">{PAYMENT_METHOD_FAMILIES.find((f) => f.id === family)?.hint}</p>

      {family === 'upi' && (
        <div key="upi" className="space-y-3 cinematic-rise">
          <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
            {UPI_APPS.map((app) => (
              <ProviderTile key={app.id} provider={app} selected={upiApp === app.id} onSelect={() => setUpiApp(app.id)} />
            ))}
          </div>
          {upiApp === 'upi-id' && (
            <div className="space-y-1.5">
              <label htmlFor="checkout-upi-id" className="text-xs text-[#E9DCC5]/80">
                UPI ID
              </label>
              <input
                id="checkout-upi-id"
                className={inputClass}
                placeholder="yourname@okhdfc"
                autoComplete="off"
                value={upiId}
                onChange={(e) => setUpiId(e.target.value.trim())}
                aria-invalid={upiId.length > 0 && !isValidUpiId(upiId)}
              />
              {upiId.length > 0 && !isValidUpiId(upiId) && (
                <p className="text-[11px] text-red-300">Enter a valid UPI ID like name@bank.</p>
              )}
            </div>
          )}
          {testMode && (
            <p className="text-[11px] text-[#F7D774]/80">
              Test hint: use <code className="font-mono">success@test</code> or <code className="font-mono">failure@test</code> as a UPI ID to try both outcomes.
            </p>
          )}
        </div>
      )}

      {family === 'card' && (
        <div key="card" className="space-y-3 cinematic-rise">
          {gateway === 'razorpay' ? (
            <p className="rounded-xl border border-[#D4A537]/30 bg-white/[0.03] p-3.5 text-xs text-[#E9DCC5]/85">
              You'll enter your card details in Razorpay's secure window. Visa, Mastercard, RuPay and Amex are accepted.
            </p>
          ) : (
            <>
              <div className="space-y-1.5">
                <label htmlFor="checkout-card-number" className="text-xs text-[#E9DCC5]/80">
                  Card number
                </label>
                <div className="relative">
                  <input
                    id="checkout-card-number"
                    className={`${inputClass} pr-24 font-mono tracking-wider`}
                    inputMode="numeric"
                    autoComplete="cc-number"
                    placeholder="1234 5678 9012 3456"
                    value={cardNumber}
                    onChange={(e) => setCardNumber(formatCardNumber(e.target.value))}
                    aria-invalid={cardDigits.length >= 12 && !passesLuhn(cardDigits)}
                  />
                  <span className="absolute right-2 top-1/2 -translate-y-1/2 px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wide bg-[#D4A537]/20 text-[#F7D774]">
                    {CARD_BRAND_LABELS[cardBrand]}
                  </span>
                </div>
                {cardDigits.length >= 12 && !passesLuhn(cardDigits) && (
                  <p className="text-[11px] text-red-300">This card number doesn't look right.</p>
                )}
              </div>
              <div className="space-y-1.5">
                <label htmlFor="checkout-card-name" className="text-xs text-[#E9DCC5]/80">
                  Name on card
                </label>
                <input
                  id="checkout-card-name"
                  className={inputClass}
                  autoComplete="cc-name"
                  value={cardName}
                  onChange={(e) => setCardName(e.target.value)}
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <label htmlFor="checkout-card-expiry" className="text-xs text-[#E9DCC5]/80">
                    Expiry (MM/YY)
                  </label>
                  <input
                    id="checkout-card-expiry"
                    className={`${inputClass} font-mono`}
                    inputMode="numeric"
                    autoComplete="cc-exp"
                    placeholder="MM/YY"
                    value={cardExpiry}
                    onChange={(e) => {
                      const d = digitsOnly(e.target.value).slice(0, 4);
                      setCardExpiry(d.length > 2 ? `${d.slice(0, 2)}/${d.slice(2)}` : d);
                    }}
                    aria-invalid={cardExpiry.length === 5 && !isValidCardExpiry(cardExpiry)}
                  />
                </div>
                <div className="space-y-1.5">
                  <label htmlFor="checkout-card-cvv" className="text-xs text-[#E9DCC5]/80">
                    CVV
                  </label>
                  <input
                    id="checkout-card-cvv"
                    type="password"
                    className={`${inputClass} font-mono`}
                    inputMode="numeric"
                    autoComplete="cc-csc"
                    placeholder={cardBrand === 'amex' ? '••••' : '•••'}
                    value={cardCvv}
                    onChange={(e) => setCardCvv(digitsOnly(e.target.value).slice(0, cardBrand === 'amex' ? 4 : 3))}
                  />
                </div>
              </div>
              <p className="text-[11px] text-[#E9DCC5]/60 flex items-center gap-1.5">
                <Lock className="w-3 h-3" aria-hidden="true" /> Card details stay in your browser — only the last 4 digits are recorded.
              </p>
              <p className="text-[11px] text-[#F7D774]/80">
                Test hint: <code className="font-mono">4111 1111 1111 1111</code> succeeds, <code className="font-mono">4000 0000 0000 0002</code> is declined. Any future expiry and CVV.
              </p>
            </>
          )}
        </div>
      )}

      {family === 'netbanking' && (
        <div key="nb" className="space-y-3 cinematic-rise">
          <div className="relative">
            <label htmlFor="checkout-bank-search" className="sr-only">
              Search banks
            </label>
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#E9DCC5]/50" aria-hidden="true" />
            <input
              id="checkout-bank-search"
              className={`${inputClass} pl-9`}
              placeholder="Search your bank"
              value={bankQuery}
              onChange={(e) => setBankQuery(e.target.value)}
            />
          </div>
          <ul className="max-h-56 overflow-y-auto space-y-1.5 pr-1" role="listbox" aria-label="Banks">
            {filteredBanks.map((bank) => {
              const active = bankId === bank.id;
              return (
                <li key={bank.id}>
                  <button
                    type="button"
                    role="option"
                    aria-selected={active}
                    onClick={() => setBankId(bank.id)}
                    className={`glow-card w-full flex items-center gap-3 rounded-xl border px-3 py-2.5 text-left text-sm cursor-pointer ${
                      active ? 'border-[#F7D774] bg-[#D4A537]/15' : 'border-[#D4A537]/20 bg-white/[0.03]'
                    }`}
                  >
                    <span
                      className="grid place-items-center w-8 h-8 rounded-lg text-[10px] font-bold text-white shrink-0"
                      style={{ background: bank.accent }}
                      aria-hidden="true"
                    >
                      {bank.mark}
                    </span>
                    {bank.label}
                  </button>
                </li>
              );
            })}
            {filteredBanks.length === 0 && <li className="text-xs text-[#E9DCC5]/60 px-1">No bank matches “{bankQuery}”.</li>}
          </ul>
        </div>
      )}

      {family === 'wallet' && (
        <div key="wallet" className="grid grid-cols-3 gap-2 cinematic-rise">
          {WALLETS.map((w) => (
            <ProviderTile key={w.id} provider={w} selected={walletId === w.id} onSelect={() => setWalletId(w.id)} />
          ))}
        </div>
      )}

      <button
        type="button"
        onClick={() => void handlePay()}
        disabled={!selection.valid || !referenceCode || submitting}
        className="w-full min-h-[50px] inline-flex items-center justify-center gap-2.5 rounded-full royal-gold-surface text-sm font-semibold tracking-[0.04em] cursor-pointer disabled:opacity-45 disabled:cursor-not-allowed"
      >
        {submitting ? <Loader2 className="w-4 h-4 animate-spin" aria-hidden="true" /> : <Lock className="w-4 h-4" aria-hidden="true" />}
        Pay ₹{formatInrAmount(values.donationAmount)} {testMode ? '(Test)' : 'Securely'}
      </button>
    </div>
  );

  const bankStep = pendingOrder && selection.method && (
    <div className="space-y-5 text-center cinematic-rise">
      <div className="mx-auto w-14 h-14 rounded-2xl grid place-items-center bg-[#D4A537]/15 border border-[#D4A537]/40">
        {family === 'wallet' ? <Wallet className="w-6 h-6 text-[#F7D774]" /> : <Landmark className="w-6 h-6 text-[#F7D774]" />}
      </div>
      <div className="space-y-1">
        <p className="text-[10px] uppercase tracking-[0.2em] text-[#E8762B] font-semibold">Simulated bank page · Test mode</p>
        <h3 className="font-editorial text-2xl">{selection.method.methodLabel}</h3>
        <p className="text-sm text-[#E9DCC5]/75">
          Authorise a payment of <strong className="text-[#F7D774]">₹{formatInrAmount(values.donationAmount)}</strong> to Bhagavad Gita Vishwa Mahotsav 2027.
        </p>
      </div>
      <div className="flex flex-col sm:flex-row gap-3 justify-center">
        <button
          type="button"
          onClick={() => void runSandbox(pendingOrder, selection.method!, 'failure')}
          className="min-h-[44px] px-6 rounded-full border border-red-400/50 text-sm text-red-200 hover:bg-red-500/10 cursor-pointer"
        >
          Decline
        </button>
        <button
          type="button"
          onClick={() => void runSandbox(pendingOrder, selection.method!, 'success')}
          className="min-h-[44px] px-8 rounded-full royal-gold-surface text-sm font-semibold cursor-pointer"
        >
          Approve payment
        </button>
      </div>
      <button type="button" onClick={() => setPhase('select')} className="text-xs text-[#E9DCC5]/70 hover:text-[#F7D774] inline-flex items-center gap-1 cursor-pointer">
        <ArrowLeft className="w-3.5 h-3.5" /> Choose a different method
      </button>
    </div>
  );

  const processing = (
    <div className="py-10 flex flex-col items-center text-center gap-6" role="status" aria-live="polite">
      <div className="relative w-28 h-28 grid place-items-center">
        <span className="absolute inset-0 rounded-full border-2 border-[#F7D774]/60 gold-pulse-ring" />
        <span className="absolute inset-0 rounded-full border-2 border-[#D4A537]/50 gold-pulse-ring" style={{ animationDelay: '0.6s' }} />
        <span className="absolute inset-3 rounded-full border border-dashed border-[#F7D774]/40 slow-spin" />
        <span className="w-16 h-16 rounded-full royal-gold-surface grid place-items-center">
          <Lock className="w-6 h-6" aria-hidden="true" />
        </span>
      </div>
      <div className="space-y-1">
        <p className="font-editorial text-2xl">
          <span className="royal-gold-gradient-text">Processing payment</span>
        </p>
        <p key={processingStep} className="text-sm text-[#E9DCC5]/80 cinematic-rise">
          {PROCESSING_STEPS[processingStep]}
        </p>
      </div>
      <p className="text-[11px] text-[#E9DCC5]/50">Please don't close this window.</p>
    </div>
  );

  const failed = (
    <div className="py-6 flex flex-col items-center text-center gap-5 cinematic-rise">
      <div className="w-20 h-20 rounded-full grid place-items-center bg-red-500/10 border border-red-400/50 shadow-[0_0_40px_-8px_rgba(248,113,113,0.7)]">
        <AlertTriangle className="w-9 h-9 text-red-300" aria-hidden="true" />
      </div>
      <div className="space-y-1.5">
        <h3 className="font-editorial text-2xl">Payment not completed</h3>
        <p className="text-sm text-[#E9DCC5]/80 max-w-sm">{failureReason ?? 'The payment could not be completed.'}</p>
        <p className="text-xs text-[#E9DCC5]/60">No money was taken. Your registration {referenceCode} is saved.</p>
      </div>
      <div className="flex flex-col sm:flex-row gap-3">
        <button
          type="button"
          onClick={() => setPhase('select')}
          className="min-h-[44px] px-6 rounded-full border border-[#D4A537]/50 text-sm text-[#FFFDF7] hover:border-[#F7D774] cursor-pointer"
        >
          Try another method
        </button>
        <button
          type="button"
          onClick={() => void handlePay()}
          disabled={!selection.valid}
          className="min-h-[44px] px-7 rounded-full royal-gold-surface text-sm font-semibold inline-flex items-center gap-2 cursor-pointer disabled:opacity-50"
        >
          <RefreshCw className="w-4 h-4" aria-hidden="true" /> Retry
        </button>
      </div>
    </div>
  );

  const successView = success && (
    <div className="relative py-6 flex flex-col items-center text-center gap-5">
      <div aria-hidden="true" className="pointer-events-none absolute inset-x-0 -top-6 h-0 overflow-visible">
        {confetti.map((c, i) => (
          <span
            key={i}
            className="confetti-piece absolute top-0 rounded-[2px]"
            style={
              {
                left: c.left,
                width: c.size,
                height: c.size * 1.6,
                background: c.color,
                animationDelay: c.delay,
                '--drift': c.drift,
                '--spin': c.spin,
                '--fall': c.fall,
              } as React.CSSProperties
            }
          />
        ))}
      </div>
      <div className="relative w-24 h-24 grid place-items-center">
        <span className="absolute inset-0 rounded-full border-2 border-[#F7D774]/60 gold-pulse-ring" />
        <span className="w-20 h-20 rounded-full royal-gold-surface grid place-items-center shadow-[0_0_50px_-6px_rgba(247,215,116,0.9)]">
          <svg viewBox="0 0 24 24" className="w-10 h-10" fill="none" stroke="#171717" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <path className="check-draw" d="M5 12.5l4.5 4.5L19 7.5" />
          </svg>
        </span>
      </div>
      <div className="space-y-1.5 cinematic-rise">
        <p className="inline-flex items-center gap-1.5 text-[10px] uppercase tracking-[0.2em] text-[#D4A537] font-semibold">
          <Sparkles className="w-3.5 h-3.5" aria-hidden="true" /> {success.alreadyPaid ? 'Already confirmed' : 'Payment successful'}
        </p>
        <h3 className="font-editorial text-3xl">
          <span className="royal-gold-gradient-text">Welcome to the Mahotsav</span>
        </h3>
        <p className="text-sm text-[#E9DCC5]/80">
          {success.alreadyPaid
            ? 'This registration is already paid. Your passes and receipt are in your dashboard.'
            : `Receipt ${success.receiptNumber ?? '—'} · ${success.passesIssued ?? 0} entry pass${success.passesIssued === 1 ? '' : 'es'} issued`}
        </p>
        {success.mode === 'test' && (
          <p className="text-xs text-[#E8762B] font-medium">Test mode — no money was charged.</p>
        )}
      </div>
      <button
        type="button"
        onClick={() => navigate('/dashboard')}
        className="min-h-[50px] px-8 rounded-full royal-gold-surface text-sm font-semibold inline-flex items-center gap-2 cursor-pointer"
      >
        <LayoutDashboard className="w-4 h-4" aria-hidden="true" /> Open My Dashboard
      </button>
      {countdown !== null && countdown > 0 && (
        <p className="text-xs text-[#E9DCC5]/65" aria-live="polite">
          Opening your dashboard in {countdown}s ·{' '}
          <button type="button" onClick={() => setCountdown(null)} className="underline hover:text-[#F7D774] cursor-pointer">
            Stay here
          </button>
        </p>
      )}
    </div>
  );

  let body: React.ReactNode;
  if (phase === 'saving') {
    body = (
      <div className="py-16 flex flex-col items-center gap-3 text-sm text-[#E9DCC5]/80" role="status">
        <Loader2 className="w-6 h-6 animate-spin text-[#F7D774]" aria-hidden="true" />
        Saving your registration securely…
      </div>
    );
  } else if (phase === 'save-error') {
    body = (
      <div className="py-10 flex flex-col items-center text-center gap-4">
        <AlertTriangle className="w-8 h-8 text-amber-300" aria-hidden="true" />
        <p className="text-sm text-[#E9DCC5]/85 max-w-sm">{saveError}</p>
        <button type="button" onClick={() => void saveRegistration()} className="min-h-[44px] px-6 rounded-full royal-gold-surface text-sm font-semibold cursor-pointer">
          Try again
        </button>
      </div>
    );
  } else if (phase === 'bank') body = bankStep;
  else if (phase === 'processing') body = processing;
  else if (phase === 'failed') body = failed;
  else if (phase === 'success') body = successView;
  else body = methodPanel;

  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center sm:p-4 bg-[#05080F]/80 backdrop-blur-sm"
      onClick={() => !busy && onClose()}
    >
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="checkout-title"
        tabIndex={-1}
        onClick={(e) => e.stopPropagation()}
        className="cinematic-rise relative w-full sm:max-w-3xl h-[100dvh] sm:h-auto sm:max-h-[92vh] overflow-y-auto sm:rounded-3xl bg-[#0F1829] text-[#FFFDF7] border border-[#D4A537]/45 shadow-[0_40px_100px_-20px_rgba(0,0,0,0.8),0_0_80px_-30px_rgba(212,165,55,0.6)] focus:outline-none"
      >
        <div className="absolute inset-x-0 top-0 h-[2px] gold-leaf-line z-10" aria-hidden="true" />
        <button
          type="button"
          onClick={onClose}
          disabled={busy}
          aria-label={t('modal.close')}
          className="absolute top-3 right-3 z-20 w-9 h-9 grid place-items-center rounded-full border border-[#D4A537]/40 bg-[#0F1829]/80 text-[#FFFDF7] hover:border-[#F7D774] hover:text-[#F7D774] cursor-pointer disabled:opacity-40"
        >
          <X className="w-4 h-4" aria-hidden="true" />
        </button>
        <div className="flex flex-col lg:flex-row min-h-full">
          {summary}
          <section className="flex-1 p-5 sm:p-6 lg:pt-12" aria-label="Payment">
            {body}
          </section>
        </div>
      </div>
    </div>
  );
};
