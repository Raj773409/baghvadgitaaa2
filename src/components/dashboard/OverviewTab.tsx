import React from 'react';
import { ArrowRight, CalendarClock, CheckCircle2, CircleAlert, IndianRupee, Ticket, Users } from 'lucide-react';
import { Link } from 'react-router-dom';
import type { PortalDashboard } from '../../utils/portalApi';
import type { DashboardTab } from './tabs';
import { daysUntil, formatEventDate, formatInr } from './format';

const FALLBACK_EVENTS = [
  { name: 'Curtain Raiser — Vishwa Ahvanam', date: '2026-12-20' },
  { name: 'Bhagavad Gita Vishwa Mahotsav 2027', date: '2027-02-27' },
];

export const OverviewTab: React.FC<{ data: PortalDashboard; onNavigate: (tab: DashboardTab) => void }> = ({
  data,
  onNavigate,
}) => {
  const { profile, payments, passes } = data;
  const captured = payments.filter((p) => p.status === 'captured');
  const amountPaid = captured.reduce((sum, p) => sum + p.amountInr, 0);
  const activePasses = passes.filter((p) => p.status === 'active');
  const admits = activePasses.reduce((max, p) => Math.max(max, p.admits), 0);

  const upcoming = (passes.length ? passes.map((p) => ({ name: p.eventName, date: p.eventDate })) : FALLBACK_EVENTS)
    .map((e) => ({ ...e, days: daysUntil(e.date) }))
    .filter((e) => e.days >= 0)
    .sort((a, b) => a.days - b.days)[0];

  const latestFailed = payments.find((p) => p.status === 'failed');
  const hasPending = payments.some((p) => p.status === 'initiated');

  const stats = [
    { icon: IndianRupee, label: 'Amount paid', value: formatInr(amountPaid), hint: captured.length ? `${captured.length} payment${captured.length > 1 ? 's' : ''}` : 'No payment yet' },
    { icon: Ticket, label: 'Active passes', value: String(activePasses.length), hint: passes.length ? `${passes.length} issued` : 'Issued after payment' },
    { icon: Users, label: 'Admits', value: String(admits || profile.noOfPersons), hint: admits ? 'per pass' : 'registered persons' },
    {
      icon: CalendarClock,
      label: upcoming ? 'Days to go' : 'Events',
      value: upcoming ? (upcoming.days === 0 ? 'Today' : String(upcoming.days)) : '—',
      hint: upcoming ? upcoming.name : 'Schedule to be announced',
    },
  ];

  return (
    <div className="space-y-5">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        {stats.map((s, i) => {
          const Icon = s.icon;
          return (
            <div
              key={s.label}
              className="cinematic-rise glow-card relative overflow-hidden rounded-2xl border border-[#D4A537]/30 bg-[#0F1829]/85 p-4 sm:p-5"
              style={{ animationDelay: `${i * 80}ms` }}
            >
              <span aria-hidden="true" className="absolute -right-6 -top-6 w-20 h-20 rounded-full bg-[radial-gradient(circle,rgba(247,215,116,0.18),transparent_70%)]" />
              <Icon className="w-4 h-4 text-[#F7D774]" aria-hidden="true" />
              <p className="mt-3 text-[10.5px] uppercase tracking-[0.16em] text-[#E9DCC5]/60">{s.label}</p>
              <p className="font-editorial text-2xl sm:text-3xl text-[#FFFDF7] tabular-nums leading-tight">{s.value}</p>
              <p className="text-[11px] text-[#E9DCC5]/55 truncate" title={s.hint}>
                {s.hint}
              </p>
            </div>
          );
        })}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Next steps */}
        <section className="cinematic-rise rounded-3xl border border-[#D4A537]/35 bg-[#0F1829]/85 p-5 sm:p-6 space-y-4" style={{ animationDelay: '240ms' }}>
          <h3 className="font-editorial text-xl text-[#FFFDF7]">Next steps</h3>
          {profile.paymentStatus === 'paid' ? (
            <div className="flex gap-3">
              <CheckCircle2 className="w-5 h-5 text-[#F7D774] shrink-0 mt-0.5" aria-hidden="true" />
              <div className="space-y-3">
                <p className="text-sm text-[#E9DCC5]/85 leading-relaxed">
                  You're all set. Keep your QR entry pass{activePasses.length > 1 ? 'es' : ''} handy on your phone or print a copy for the gate.
                </p>
                <button
                  type="button"
                  onClick={() => onNavigate('passes')}
                  className="inline-flex items-center gap-2 min-h-[40px] px-5 rounded-full royal-gold-surface text-xs font-semibold cursor-pointer"
                >
                  View entry passes <ArrowRight className="w-3.5 h-3.5" aria-hidden="true" />
                </button>
              </div>
            </div>
          ) : profile.paymentStatus === 'refunded' ? (
            <div className="flex gap-3">
              <CircleAlert className="w-5 h-5 text-sky-300 shrink-0 mt-0.5" aria-hidden="true" />
              <p className="text-sm text-[#E9DCC5]/85 leading-relaxed">
                Your payment has been refunded and associated passes are inactive. Contact the Secretariat if this is unexpected.
              </p>
            </div>
          ) : (
            <div className="flex gap-3">
              <CircleAlert className="w-5 h-5 text-amber-300 shrink-0 mt-0.5" aria-hidden="true" />
              <div className="space-y-3">
                <p className="text-sm text-[#E9DCC5]/85 leading-relaxed">
                  {latestFailed
                    ? `Your last payment attempt didn't go through${latestFailed.failureReason ? ` — ${latestFailed.failureReason}` : '.'} Your registration ${profile.referenceCode} is saved, so you can try again.`
                    : hasPending
                      ? `A payment for ${profile.referenceCode} was started but not completed. Complete it to receive your entry passes.`
                      : `Your registration ${profile.referenceCode} is saved. Complete payment to receive your entry passes.`}
                </p>
                <Link
                  to="/participate/register"
                  className="inline-flex items-center gap-2 min-h-[40px] px-5 rounded-full royal-gold-surface text-xs font-semibold"
                >
                  Go to registration & payment <ArrowRight className="w-3.5 h-3.5" aria-hidden="true" />
                </Link>
              </div>
            </div>
          )}
        </section>

        {/* Registration snapshot */}
        <section className="cinematic-rise rounded-3xl border border-[#D4A537]/35 bg-[#0F1829]/85 p-5 sm:p-6 space-y-3" style={{ animationDelay: '320ms' }}>
          <h3 className="font-editorial text-xl text-[#FFFDF7]">Your events</h3>
          <ul className="space-y-2.5">
            {(passes.length
              ? passes.map((p) => ({ key: p.id, name: p.eventName, date: p.eventDate, status: p.status }))
              : FALLBACK_EVENTS.filter((_, i) => (i === 0 ? profile.events.curtainRaiser : profile.events.mahotsav)).map((e) => ({
                  key: e.date,
                  name: e.name,
                  date: e.date,
                  status: 'pending' as const,
                }))
            ).map((e) => (
              <li key={e.key} className="flex items-center justify-between gap-3 rounded-xl border border-white/5 bg-black/20 px-3.5 py-3">
                <div className="min-w-0">
                  <p className="text-sm text-[#FFFDF7] truncate">{e.name}</p>
                  <p className="text-xs text-[#E9DCC5]/60">{formatEventDate(e.date)}</p>
                </div>
                <span
                  className={`shrink-0 px-2.5 py-0.5 rounded-full border text-[10.5px] font-semibold uppercase tracking-[0.08em] ${
                    e.status === 'active'
                      ? 'border-emerald-400/50 text-emerald-200'
                      : e.status === 'revoked'
                        ? 'border-red-400/50 text-red-200'
                        : e.status === 'checked-in'
                          ? 'border-sky-400/50 text-sky-200'
                          : 'border-amber-400/50 text-amber-200'
                  }`}
                >
                  {e.status === 'pending' ? 'Awaiting payment' : e.status}
                </span>
              </li>
            ))}
          </ul>
          {!profile.events.curtainRaiser && !profile.events.mahotsav && passes.length === 0 && (
            <p className="text-xs text-[#E9DCC5]/60">No events selected.</p>
          )}
        </section>
      </div>
    </div>
  );
};
