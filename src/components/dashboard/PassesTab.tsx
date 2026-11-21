import React, { useEffect, useRef, useState } from 'react';
import QRCode from 'qrcode';
import { CalendarDays, Download, MapPin, Printer, Ticket, Users } from 'lucide-react';
import { Link } from 'react-router-dom';
import type { PortalPass } from '../../utils/portalApi';
import { useToast } from '../ui/Toaster';
import { formatDateTime, formatEventDate, printElement } from './format';

const STATUS_STYLES: Record<PortalPass['status'], { label: string; className: string }> = {
  active: { label: 'Active', className: 'border-emerald-400/50 bg-emerald-400/10 text-emerald-200' },
  'checked-in': { label: 'Checked in', className: 'border-sky-400/50 bg-sky-400/10 text-sky-200' },
  revoked: { label: 'Revoked', className: 'border-red-400/50 bg-red-400/10 text-red-200' },
};

const qrSvgCache = new Map<string, string>();

const useQrSvg = (payload: string): string | null => {
  const [svg, setSvg] = useState<string | null>(() => qrSvgCache.get(payload) ?? null);
  useEffect(() => {
    if (qrSvgCache.has(payload)) {
      setSvg(qrSvgCache.get(payload)!);
      return;
    }
    let cancelled = false;
    QRCode.toString(payload, {
      type: 'svg',
      margin: 1,
      errorCorrectionLevel: 'M',
      color: { dark: '#17233A', light: '#FFFDF7' },
    })
      .then((markup) => {
        qrSvgCache.set(payload, markup);
        if (!cancelled) setSvg(markup);
      })
      .catch(() => {
        if (!cancelled) setSvg(null);
      });
    return () => {
      cancelled = true;
    };
  }, [payload]);
  return svg;
};

const PassCard: React.FC<{ pass: PortalPass; holderName: string; index: number }> = ({ pass, holderName, index }) => {
  const { notify } = useToast();
  const cardRef = useRef<HTMLElement | null>(null);
  const svg = useQrSvg(pass.qrPayload);
  const status = STATUS_STYLES[pass.status];
  const inactive = pass.status === 'revoked';

  const handleDownload = async () => {
    try {
      const dataUrl = await QRCode.toDataURL(pass.qrPayload, {
        margin: 2,
        width: 640,
        errorCorrectionLevel: 'M',
        color: { dark: '#17233A', light: '#FFFDF7' },
      });
      const link = document.createElement('a');
      link.href = dataUrl;
      link.download = `${pass.passCode}.png`;
      document.body.appendChild(link);
      link.click();
      link.remove();
      notify({ tone: 'success', title: 'QR downloaded', body: `${pass.passCode}.png saved to your device.` });
    } catch {
      notify({ tone: 'error', title: 'Download failed', body: 'Could not generate the QR image. Please try again.' });
    }
  };

  return (
    <article
      ref={cardRef}
      className={`pass-ticket cinematic-rise glow-card relative overflow-hidden rounded-3xl border border-[#D4A537]/40 bg-[linear-gradient(150deg,#1B2944_0%,#131D30_55%,#0E1523_100%)] text-[#FFFDF7] ${
        inactive ? 'opacity-70 grayscale-[0.4]' : ''
      }`}
      style={{ animationDelay: `${index * 90}ms` }}
    >
      <div className="absolute inset-x-0 top-0 h-[2px] gold-leaf-line" aria-hidden="true" />
      <div className="grid grid-cols-1 md:grid-cols-[1fr_auto]">
        {/* Stub: event details */}
        <div className="p-5 sm:p-6 space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <span className="inline-flex items-center gap-1.5 text-[10.5px] font-semibold tracking-[0.2em] uppercase text-[#D4A537]">
              <Ticket className="w-3.5 h-3.5" aria-hidden="true" /> Entry Pass · {pass.tier}
            </span>
            <span className={`px-2.5 py-0.5 rounded-full border text-[11px] font-semibold ${status.className}`}>{status.label}</span>
          </div>
          <h3 className="font-editorial text-2xl leading-tight">
            <span className="royal-gold-gradient-text">{pass.eventName}</span>
          </h3>
          <dl className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
            <div className="flex items-start gap-2">
              <CalendarDays className="w-4 h-4 text-[#F7D774] shrink-0 mt-0.5" aria-hidden="true" />
              <div>
                <dt className="text-[10.5px] uppercase tracking-[0.14em] text-[#E9DCC5]/60">Date</dt>
                <dd>{formatEventDate(pass.eventDate)}</dd>
              </div>
            </div>
            <div className="flex items-start gap-2">
              <Users className="w-4 h-4 text-[#F7D774] shrink-0 mt-0.5" aria-hidden="true" />
              <div>
                <dt className="text-[10.5px] uppercase tracking-[0.14em] text-[#E9DCC5]/60">Admits</dt>
                <dd>
                  {pass.admits} {pass.admits === 1 ? 'person' : 'people'}
                </dd>
              </div>
            </div>
            <div className="flex items-start gap-2 sm:col-span-2">
              <MapPin className="w-4 h-4 text-[#F7D774] shrink-0 mt-0.5" aria-hidden="true" />
              <div>
                <dt className="text-[10.5px] uppercase tracking-[0.14em] text-[#E9DCC5]/60">Venue</dt>
                <dd>{pass.venue}</dd>
              </div>
            </div>
          </dl>
          <div className="flex flex-wrap items-end justify-between gap-3 pt-1">
            <div>
              <p className="text-[10.5px] uppercase tracking-[0.14em] text-[#E9DCC5]/60">Pass holder</p>
              <p className="font-medium">{holderName}</p>
            </div>
            <div className="text-right">
              <p className="text-[10.5px] uppercase tracking-[0.14em] text-[#E9DCC5]/60">Pass code</p>
              <p className="font-mono text-sm tracking-[0.08em] text-[#F7D774]">{pass.passCode}</p>
            </div>
          </div>
          <p className="text-[11px] text-[#E9DCC5]/55">Issued {formatDateTime(pass.issuedAt)}</p>
        </div>

        {/* Perforation + QR */}
        <div className="relative md:w-[248px] p-5 sm:p-6 flex flex-col items-center justify-center gap-3 border-t-2 md:border-t-0 md:border-l-2 border-dashed border-[#D4A537]/35 bg-black/15">
          <span aria-hidden="true" className="hidden md:block absolute -left-3 -top-3 w-6 h-6 rounded-full bg-[#0B111C]" />
          <span aria-hidden="true" className="hidden md:block absolute -left-3 -bottom-3 w-6 h-6 rounded-full bg-[#0B111C]" />
          <span aria-hidden="true" className="md:hidden absolute -top-3 -left-3 w-6 h-6 rounded-full bg-[#0B111C]" />
          <span aria-hidden="true" className="md:hidden absolute -top-3 -right-3 w-6 h-6 rounded-full bg-[#0B111C]" />
          <div className="relative w-40 h-40 rounded-xl bg-[#FFFDF7] p-2 shadow-[0_0_30px_-6px_rgba(247,215,116,0.55)]">
            {svg ? (
              <div
                className="w-full h-full [&>svg]:w-full [&>svg]:h-full"
                role="img"
                aria-label={`QR code for pass ${pass.passCode}`}
                // Markup is generated locally by the qrcode library from a server-signed payload.
                dangerouslySetInnerHTML={{ __html: svg }}
              />
            ) : (
              <div className="w-full h-full rounded-lg bg-[#E9DCC5]/50 animate-pulse" aria-label="Generating QR code" />
            )}
            {inactive && (
              <div className="absolute inset-0 grid place-items-center rounded-xl bg-[#0B111C]/70 text-xs font-semibold uppercase tracking-[0.14em] text-red-200">
                Not valid
              </div>
            )}
          </div>
          <p className="text-[10.5px] text-center text-[#E9DCC5]/60 max-w-[200px]">
            Show this QR at the entry gate. Each code is signed and verified on scan.
          </p>
          <div className="dashboard-no-print flex flex-wrap justify-center gap-2">
            <button
              type="button"
              onClick={() => void handleDownload()}
              className="inline-flex items-center gap-1.5 min-h-[36px] px-3.5 rounded-full royal-gold-surface text-xs font-semibold cursor-pointer"
            >
              <Download className="w-3.5 h-3.5" aria-hidden="true" /> Download QR
            </button>
            <button
              type="button"
              onClick={() => printElement(cardRef.current)}
              className="inline-flex items-center gap-1.5 min-h-[36px] px-3.5 rounded-full border border-[#D4A537]/50 text-xs font-medium text-[#FFFDF7] hover:border-[#F7D774] hover:text-[#F7D774] transition-colors cursor-pointer"
            >
              <Printer className="w-3.5 h-3.5" aria-hidden="true" /> Print pass
            </button>
          </div>
        </div>
      </div>
    </article>
  );
};

export const PassesTab: React.FC<{ passes: PortalPass[]; holderName: string; paid: boolean }> = ({
  passes,
  holderName,
  paid,
}) => {
  if (passes.length === 0) {
    return (
      <div className="cinematic-rise rounded-3xl border border-dashed border-[#D4A537]/40 bg-[#0F1829]/70 p-8 sm:p-10 text-center space-y-3">
        <Ticket className="w-10 h-10 mx-auto text-[#D4A537]" aria-hidden="true" />
        <h3 className="font-editorial text-2xl text-[#FFFDF7]">No entry passes yet</h3>
        <p className="text-sm text-[#E9DCC5]/75 max-w-md mx-auto">
          {paid
            ? 'Your passes are being prepared. Refresh in a moment.'
            : 'Entry passes with signed QR codes are issued automatically as soon as your payment is confirmed.'}
        </p>
        {!paid && (
          <Link
            to="/participate/register"
            className="inline-flex items-center gap-2 min-h-[42px] px-6 rounded-full royal-gold-surface text-xs font-semibold uppercase tracking-[0.08em]"
          >
            Go to registration & payment
          </Link>
        )}
      </div>
    );
  }
  return (
    <div className="space-y-5">
      {passes.map((pass, i) => (
        <PassCard key={pass.id} pass={pass} holderName={holderName} index={i} />
      ))}
    </div>
  );
};
