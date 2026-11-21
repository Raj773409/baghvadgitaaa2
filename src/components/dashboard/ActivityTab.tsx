import React from 'react';
import { History } from 'lucide-react';
import type { PortalActivity } from '../../utils/portalApi';
import { formatDateTime } from './format';

const HIGHLIGHT = new Set(['PAYMENT_CAPTURED', 'PARTICIPANT_REGISTER']);
const NEGATIVE = new Set(['PAYMENT_FAILED']);

export const ActivityTab: React.FC<{ activity: PortalActivity[] }> = ({ activity }) => (
  <div className="cinematic-rise rounded-3xl border border-[#D4A537]/35 bg-[#0F1829]/85 p-5 sm:p-7">
    <div className="flex items-center gap-2 mb-6">
      <History className="w-4 h-4 text-[#F7D774]" aria-hidden="true" />
      <h3 className="font-editorial text-xl text-[#FFFDF7]">Account activity</h3>
    </div>
    {activity.length === 0 ? (
      <p className="text-sm text-[#E9DCC5]/70">No activity recorded yet.</p>
    ) : (
      <ol className="relative ml-2 border-l border-transparent">
        <span
          aria-hidden="true"
          className="absolute left-0 top-1 bottom-1 w-px bg-[linear-gradient(180deg,#F7D774_0%,rgba(212,165,55,0.4)_60%,transparent_100%)]"
        />
        {activity.map((a, i) => {
          const dot = NEGATIVE.has(a.action)
            ? 'bg-red-400 shadow-[0_0_10px_rgba(248,113,113,0.7)]'
            : HIGHLIGHT.has(a.action)
              ? 'royal-gold-surface shadow-[0_0_14px_rgba(247,215,116,0.8)]'
              : 'bg-[#9DB5D8]';
          return (
            <li
              key={a.id}
              className="cinematic-rise relative pl-6 pb-6 last:pb-0"
              style={{ animationDelay: `${Math.min(i, 10) * 55}ms` }}
            >
              <span aria-hidden="true" className={`absolute -left-[5px] top-1.5 w-2.5 h-2.5 rounded-full ${dot}`} />
              <p className="text-sm font-medium text-[#FFFDF7]">{a.label}</p>
              <time dateTime={a.at} className="text-xs text-[#E9DCC5]/60">
                {formatDateTime(a.at)}
              </time>
            </li>
          );
        })}
      </ol>
    )}
  </div>
);
