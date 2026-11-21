import React from 'react';
import { AlertTriangle, Bell, CheckCheck, CheckCircle2, Info, XCircle } from 'lucide-react';
import type { PortalNotification } from '../../utils/portalApi';
import { formatDateTime, relativeTime } from './format';

const TONE: Record<PortalNotification['tone'], { icon: React.ElementType; color: string; ring: string }> = {
  success: { icon: CheckCircle2, color: 'text-[#F7D774]', ring: 'bg-[#D4A537]/15 border-[#D4A537]/40' },
  info: { icon: Info, color: 'text-[#9DB5D8]', ring: 'bg-[#9DB5D8]/10 border-[#9DB5D8]/35' },
  warning: { icon: AlertTriangle, color: 'text-amber-300', ring: 'bg-amber-400/10 border-amber-400/35' },
  error: { icon: XCircle, color: 'text-red-300', ring: 'bg-red-500/10 border-red-400/35' },
};

export const NotificationsTab: React.FC<{
  notifications: PortalNotification[];
  onMarkAllRead: () => void;
  marking: boolean;
}> = ({ notifications, onMarkAllRead, marking }) => {
  const unread = notifications.filter((n) => !n.read).length;

  return (
    <div className="cinematic-rise rounded-3xl border border-[#D4A537]/35 bg-[#0F1829]/85 overflow-hidden">
      <div className="flex flex-wrap items-center justify-between gap-3 px-5 sm:px-6 py-4 border-b border-[#D4A537]/20">
        <div className="flex items-center gap-2">
          <Bell className="w-4 h-4 text-[#F7D774]" aria-hidden="true" />
          <h3 className="font-editorial text-xl text-[#FFFDF7]">Notifications</h3>
          {unread > 0 && (
            <span className="px-2 py-0.5 rounded-full royal-gold-surface text-[10.5px] font-bold">{unread} new</span>
          )}
        </div>
        <button
          type="button"
          onClick={onMarkAllRead}
          disabled={unread === 0 || marking}
          className="inline-flex items-center gap-1.5 min-h-[34px] px-3.5 rounded-full border border-[#D4A537]/45 text-xs font-medium text-[#FFFDF7] hover:border-[#F7D774] hover:text-[#F7D774] disabled:opacity-40 cursor-pointer disabled:cursor-not-allowed transition-colors"
        >
          <CheckCheck className="w-3.5 h-3.5" aria-hidden="true" /> Mark all read
        </button>
      </div>

      {notifications.length === 0 ? (
        <p className="px-6 py-12 text-center text-sm text-[#E9DCC5]/70">You're all caught up. Updates about payments and passes will appear here.</p>
      ) : (
        <ul className="divide-y divide-white/5">
          {notifications.map((n, i) => {
            const tone = TONE[n.tone];
            const Icon = tone.icon;
            return (
              <li
                key={n.id}
                className={`cinematic-rise relative flex gap-3.5 px-5 sm:px-6 py-4 transition-colors ${n.read ? '' : 'bg-[#D4A537]/[0.06]'}`}
                style={{ animationDelay: `${Math.min(i, 8) * 50}ms` }}
              >
                <span className={`grid place-items-center w-9 h-9 rounded-full border shrink-0 ${tone.ring}`}>
                  <Icon className={`w-4 h-4 ${tone.color}`} aria-hidden="true" />
                </span>
                <div className="min-w-0 flex-1 space-y-0.5">
                  <div className="flex flex-wrap items-baseline justify-between gap-x-3">
                    <p className={`text-sm ${n.read ? 'text-[#FFFDF7]/85' : 'font-semibold text-[#FFFDF7]'}`}>{n.title}</p>
                    <time dateTime={n.createdAt} title={formatDateTime(n.createdAt)} className="text-[11px] text-[#E9DCC5]/55">
                      {relativeTime(n.createdAt)}
                    </time>
                  </div>
                  <p className="text-xs text-[#E9DCC5]/75 leading-relaxed">{n.body}</p>
                </div>
                {!n.read && (
                  <span
                    aria-label="Unread"
                    className="absolute left-2 top-1/2 -translate-y-1/2 w-1.5 h-1.5 rounded-full bg-[#F7D774] shadow-[0_0_10px_2px_rgba(247,215,116,0.7)]"
                  />
                )}
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
};
