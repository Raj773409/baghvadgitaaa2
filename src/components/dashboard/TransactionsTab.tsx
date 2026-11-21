import React, { useEffect, useRef, useState } from 'react';
import { AlertTriangle, FileText, Loader2, Printer, ReceiptIndianRupee, X } from 'lucide-react';
import { ApiError, portalApi, type PortalPayment, type PortalReceipt } from '../../utils/portalApi';
import { formatDateTime, formatInr, printElement, rupeesInWords, titleCase } from './format';

const STATUS: Record<PortalPayment['status'], { label: string; className: string }> = {
  captured: { label: 'Paid', className: 'border-[#D4A537]/60 bg-[linear-gradient(90deg,rgba(52,211,153,0.16),rgba(212,165,55,0.18))] text-emerald-100' },
  failed: { label: 'Failed', className: 'border-red-400/50 bg-red-500/10 text-red-200' },
  initiated: { label: 'Pending', className: 'border-amber-400/50 bg-amber-400/10 text-amber-200' },
  refunded: { label: 'Refunded', className: 'border-sky-400/50 bg-sky-400/10 text-sky-200' },
};

const ModeChip: React.FC<{ mode: PortalPayment['mode'] }> = ({ mode }) =>
  mode === 'test' ? (
    <span className="px-2 py-0.5 rounded-full border border-amber-300/40 text-[10px] font-semibold uppercase tracking-[0.12em] text-amber-200">
      Test
    </span>
  ) : (
    <span className="px-2 py-0.5 rounded-full border border-emerald-300/40 text-[10px] font-semibold uppercase tracking-[0.12em] text-emerald-200">
      Live
    </span>
  );

const ReceiptModal: React.FC<{ paymentId: string; onClose: () => void }> = ({ paymentId, onClose }) => {
  const [receipt, setReceipt] = useState<PortalReceipt | null>(null);
  const [error, setError] = useState<string | null>(null);
  const paperRef = useRef<HTMLDivElement | null>(null);
  const closeRef = useRef<HTMLButtonElement | null>(null);

  useEffect(() => {
    let cancelled = false;
    portalApi
      .receipt(paymentId)
      .then((r) => !cancelled && setReceipt(r.receipt))
      .catch((err) => !cancelled && setError(err instanceof ApiError ? err.message : 'Could not load the receipt.'));
    return () => {
      cancelled = true;
    };
  }, [paymentId]);

  useEffect(() => {
    closeRef.current?.focus();
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', onKey);
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      window.removeEventListener('keydown', onKey);
      document.body.style.overflow = prevOverflow;
    };
  }, [onClose]);

  const row = (label: string, value: React.ReactNode) => (
    <div className="flex justify-between gap-4 py-2 border-b border-[#D9C9AD]/70 text-sm">
      <dt className="text-[#6B6155]">{label}</dt>
      <dd className="text-right text-[#24201C] font-medium break-all">{value}</dd>
    </div>
  );

  return (
    <div
      className="fixed inset-0 z-[90] flex items-start sm:items-center justify-center p-3 sm:p-6 bg-[#060A12]/80 backdrop-blur-sm overflow-y-auto"
      role="dialog"
      aria-modal="true"
      aria-labelledby="receipt-title"
      onClick={onClose}
    >
      <div className="cinematic-rise relative w-full max-w-xl my-6" onClick={(e) => e.stopPropagation()}>
        <div className="dashboard-no-print flex justify-end gap-2 mb-3">
          {receipt && (
            <button
              type="button"
              onClick={() => printElement(paperRef.current)}
              className="inline-flex items-center gap-1.5 min-h-[38px] px-4 rounded-full royal-gold-surface text-xs font-semibold cursor-pointer"
            >
              <Printer className="w-3.5 h-3.5" aria-hidden="true" /> Print / Save PDF
            </button>
          )}
          <button
            ref={closeRef}
            type="button"
            onClick={onClose}
            aria-label="Close receipt"
            className="grid place-items-center w-[38px] h-[38px] rounded-full border border-[#D4A537]/50 text-[#FFFDF7] hover:text-[#F7D774] cursor-pointer"
          >
            <X className="w-4 h-4" aria-hidden="true" />
          </button>
        </div>

        <div
          ref={paperRef}
          className="relative rounded-2xl bg-[linear-gradient(170deg,#FFFDF7_0%,#F6EBD3_100%)] text-[#24201C] p-6 sm:p-8 shadow-[0_30px_80px_-20px_rgba(0,0,0,0.75),0_0_50px_-16px_rgba(212,165,55,0.6)]"
        >
          <div aria-hidden="true" className="pointer-events-none absolute inset-2 rounded-xl border border-[#D4A537]/45" />
          {!receipt && !error && (
            <div className="py-16 flex flex-col items-center gap-3 text-sm text-[#6B6155]">
              <Loader2 className="w-6 h-6 animate-spin text-[#9C6B1E]" aria-hidden="true" /> Loading receipt…
            </div>
          )}
          {error && (
            <div className="py-12 flex flex-col items-center gap-3 text-sm text-red-800">
              <AlertTriangle className="w-6 h-6" aria-hidden="true" /> {error}
            </div>
          )}
          {receipt && (
            <div className="relative space-y-5">
              <header className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-[10.5px] font-semibold tracking-[0.2em] uppercase text-[#9C6B1E]">Payment Receipt</p>
                  <h2 id="receipt-title" className="font-editorial text-2xl sm:text-3xl leading-tight">
                    Bhagavad Gita Vishwa Mahotsav 2027
                  </h2>
                  <p className="text-xs text-[#6B6155]">{receipt.issuer}</p>
                </div>
                <span className="grid place-items-center w-12 h-12 rounded-full royal-gold-surface shrink-0">
                  <ReceiptIndianRupee className="w-5 h-5" aria-hidden="true" />
                </span>
              </header>

              {receipt.mode === 'test' && (
                <p className="rounded-lg border border-amber-600/40 bg-amber-100/80 px-3 py-2 text-xs font-medium text-amber-900">
                  Test mode — no real money was charged for this transaction.
                </p>
              )}

              <div className="rounded-xl border border-[#D4A537]/50 bg-white/60 p-4 text-center">
                <p className="text-[10.5px] uppercase tracking-[0.18em] text-[#6B6155]">Amount received</p>
                <p className="font-editorial text-4xl font-semibold text-[#6A1624] tabular-nums">{formatInr(receipt.amountInr)}</p>
                <p className="text-xs italic text-[#6B6155]">{rupeesInWords(receipt.amountInr)}</p>
              </div>

              <dl>
                {row('Receipt no.', <span className="font-mono">{receipt.receiptNumber}</span>)}
                {row('Paid on', formatDateTime(receipt.capturedAt ?? receipt.createdAt))}
                {row('Payment method', receipt.methodLabel)}
                {row('Transaction ID', <span className="font-mono text-xs">{receipt.gatewayReference ?? '—'}</span>)}
                {row('Order ID', <span className="font-mono text-xs">{receipt.orderId ?? '—'}</span>)}
                {row('Status', 'Paid')}
              </dl>

              <div>
                <p className="text-[10.5px] font-semibold tracking-[0.18em] uppercase text-[#9C6B1E] mb-1">Billed to</p>
                <dl>
                  {row('Name', receipt.participant.fullName)}
                  {row('Email', receipt.participant.email)}
                  {row('Phone', receipt.participant.phone)}
                  {row('Location', `${receipt.participant.city}, ${titleCase(receipt.participant.country)}`)}
                  {row('Reference', <span className="font-mono">{receipt.participant.referenceCode}</span>)}
                  {row(
                    'Registration',
                    `${titleCase(receipt.participant.registrationType)} · ${receipt.participant.noOfPersons} ${
                      receipt.participant.noOfPersons === 1 ? 'person' : 'people'
                    }`,
                  )}
                </dl>
              </div>

              <p className="text-[11px] text-[#6B6155] text-center pt-2">
                This is a computer-generated receipt and does not require a signature.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export const TransactionsTab: React.FC<{ payments: PortalPayment[] }> = ({ payments }) => {
  const [openReceipt, setOpenReceipt] = useState<string | null>(null);

  if (payments.length === 0) {
    return (
      <div className="cinematic-rise rounded-3xl border border-dashed border-[#D4A537]/40 bg-[#0F1829]/70 p-10 text-center space-y-2">
        <FileText className="w-10 h-10 mx-auto text-[#D4A537]" aria-hidden="true" />
        <h3 className="font-editorial text-2xl text-[#FFFDF7]">No transactions yet</h3>
        <p className="text-sm text-[#E9DCC5]/75">Your payment attempts and receipts will appear here.</p>
      </div>
    );
  }

  const sorted = [...payments].sort((a, b) => (b.capturedAt ?? b.createdAt).localeCompare(a.capturedAt ?? a.createdAt));

  return (
    <>
      {/* Desktop table */}
      <div className="hidden md:block cinematic-rise overflow-hidden rounded-3xl border border-[#D4A537]/35 bg-[#0F1829]/80">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left text-[10.5px] uppercase tracking-[0.16em] text-[#D4A537] border-b border-[#D4A537]/25">
              <th className="px-5 py-3.5 font-semibold">Date</th>
              <th className="px-5 py-3.5 font-semibold">Method</th>
              <th className="px-5 py-3.5 font-semibold">Receipt</th>
              <th className="px-5 py-3.5 font-semibold">Status</th>
              <th className="px-5 py-3.5 font-semibold text-right">Amount</th>
              <th className="px-5 py-3.5" />
            </tr>
          </thead>
          <tbody>
            {sorted.map((p) => (
              <tr key={p.id} className="border-b border-white/5 last:border-0 hover:bg-white/[0.03] transition-colors align-top">
                <td className="px-5 py-4 text-[#E9DCC5]/85 whitespace-nowrap">{formatDateTime(p.capturedAt ?? p.createdAt)}</td>
                <td className="px-5 py-4 text-[#FFFDF7]">
                  <div className="flex items-center gap-2">
                    <span>{p.methodLabel}</span>
                    <ModeChip mode={p.mode} />
                  </div>
                  {p.status === 'failed' && p.failureReason && (
                    <p className="mt-1 text-xs text-red-200/90">{p.failureReason}</p>
                  )}
                </td>
                <td className="px-5 py-4 font-mono text-xs text-[#E9DCC5]/80">{p.receiptNumber ?? '—'}</td>
                <td className="px-5 py-4">
                  <span className={`px-2.5 py-0.5 rounded-full border text-[11px] font-semibold ${STATUS[p.status].className}`}>
                    {STATUS[p.status].label}
                  </span>
                </td>
                <td className="px-5 py-4 text-right font-semibold tabular-nums text-[#F7D774]">{formatInr(p.amountInr)}</td>
                <td className="px-5 py-4 text-right">
                  {p.status === 'captured' && (
                    <button
                      type="button"
                      onClick={() => setOpenReceipt(p.id)}
                      className="inline-flex items-center gap-1.5 min-h-[34px] px-3.5 rounded-full border border-[#D4A537]/50 text-xs font-medium text-[#FFFDF7] hover:border-[#F7D774] hover:text-[#F7D774] transition-colors cursor-pointer whitespace-nowrap"
                    >
                      <FileText className="w-3.5 h-3.5" aria-hidden="true" /> View receipt
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Mobile cards */}
      <div className="md:hidden space-y-3">
        {sorted.map((p, i) => (
          <article
            key={p.id}
            className="cinematic-rise glow-card rounded-2xl border border-[#D4A537]/35 bg-[#0F1829]/85 p-4 space-y-3"
            style={{ animationDelay: `${i * 60}ms` }}
          >
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="font-semibold tabular-nums text-xl text-[#F7D774]">{formatInr(p.amountInr)}</p>
                <p className="text-xs text-[#E9DCC5]/70">{formatDateTime(p.capturedAt ?? p.createdAt)}</p>
              </div>
              <span className={`px-2.5 py-0.5 rounded-full border text-[11px] font-semibold ${STATUS[p.status].className}`}>
                {STATUS[p.status].label}
              </span>
            </div>
            <div className="flex flex-wrap items-center gap-2 text-sm text-[#FFFDF7]">
              <span>{p.methodLabel}</span>
              <ModeChip mode={p.mode} />
            </div>
            {p.receiptNumber && <p className="font-mono text-xs text-[#E9DCC5]/75">{p.receiptNumber}</p>}
            {p.status === 'failed' && p.failureReason && <p className="text-xs text-red-200/90">{p.failureReason}</p>}
            {p.status === 'captured' && (
              <button
                type="button"
                onClick={() => setOpenReceipt(p.id)}
                className="w-full inline-flex items-center justify-center gap-1.5 min-h-[40px] rounded-full royal-gold-surface text-xs font-semibold cursor-pointer"
              >
                <FileText className="w-3.5 h-3.5" aria-hidden="true" /> View receipt
              </button>
            )}
          </article>
        ))}
      </div>

      {openReceipt && <ReceiptModal paymentId={openReceipt} onClose={() => setOpenReceipt(null)} />}
    </>
  );
};
