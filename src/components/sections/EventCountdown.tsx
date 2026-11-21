import React, { useEffect, useState } from 'react';
import { ArrowRight, Calendar } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useI18n } from '../../i18n';
import {
  MAHOTSAV_COUNTDOWN_TARGETS,
  computeCountdown,
  formatCountdownUnit,
  type CountdownBreakdown,
} from '../../utils/countdown';

interface MilestoneCardConfig {
  id: 'curtain-raiser' | 'main-mahotsav';
  numberLabel: string;
  isoTimestamp: string;
  codeKey: string;
  titleKey: string;
  dateKey: string;
  metaKey: string;
}

const COUNTDOWN_CARDS: ReadonlyArray<MilestoneCardConfig> = [
  {
    id: 'curtain-raiser',
    numberLabel: '01',
    isoTimestamp: MAHOTSAV_COUNTDOWN_TARGETS['curtain-raiser'].isoTimestamp,
    codeKey: 'countdown.curtainRaiserCode',
    titleKey: 'countdown.curtainRaiserTitle',
    dateKey: 'countdown.curtainRaiserDate',
    metaKey: 'countdown.curtainRaiserMeta',
  },
  {
    id: 'main-mahotsav',
    numberLabel: '02',
    isoTimestamp: MAHOTSAV_COUNTDOWN_TARGETS['main-mahotsav'].isoTimestamp,
    codeKey: 'countdown.mainMahotsavCode',
    titleKey: 'countdown.mainMahotsavTitle',
    dateKey: 'countdown.mainMahotsavDate',
    metaKey: 'countdown.mainMahotsavMeta',
  },
];

export const useLiveCountdowns = (): Record<'curtain-raiser' | 'main-mahotsav', CountdownBreakdown> => {
  const [nowMs, setNowMs] = useState<number>(() => Date.now());

  useEffect(() => {
    const id = window.setInterval(() => {
      setNowMs(Date.now());
    }, 1000);
    return () => window.clearInterval(id);
  }, []);

  return {
    'curtain-raiser': computeCountdown(
      MAHOTSAV_COUNTDOWN_TARGETS['curtain-raiser'].isoTimestamp,
      nowMs,
    ),
    'main-mahotsav': computeCountdown(
      MAHOTSAV_COUNTDOWN_TARGETS['main-mahotsav'].isoTimestamp,
      nowMs,
    ),
  };
};

interface MilestoneCountdownDigitsProps {
  breakdown: CountdownBreakdown;
  tone?: 'dark' | 'light';
  compact?: boolean;
}

export const MilestoneCountdownDigits: React.FC<MilestoneCountdownDigitsProps> = ({
  breakdown,
  tone = 'dark',
  compact = false,
}) => {
  const { t } = useI18n();

  if (breakdown.isCompleted) {
    return (
      <p
        className={`text-xs font-medium tracking-[0.14em] uppercase ${
          tone === 'dark' ? 'text-[#F3CD82]' : 'text-[#8A693A]'
        }`}
      >
        {t('countdown.reachedLabel')}
      </p>
    );
  }

  const units = [
    { value: formatCountdownUnit(breakdown.days, breakdown.days >= 100 ? 3 : 2), label: t('countdown.days') },
    { value: formatCountdownUnit(breakdown.hours, 2), label: t('countdown.hours') },
    { value: formatCountdownUnit(breakdown.minutes, 2), label: t('countdown.minutes') },
    { value: formatCountdownUnit(breakdown.seconds, 2), label: t('countdown.seconds') },
  ];

  return (
    <div
      className={`grid grid-cols-4 ${
        compact ? 'gap-2 sm:gap-3 pt-1' : 'gap-3 sm:gap-5 pt-2'
      }`}
    >
      {units.map((unit) => (
        <div
          key={unit.label}
          className={`flex flex-col ${
            tone === 'dark'
              ? 'border-l border-[#F3CD82]/25 pl-3 first:border-l-0 first:pl-0'
              : 'border-l border-[#DDD3C4] pl-3 first:border-l-0 first:pl-0'
          }`}
        >
          <span
            className={`font-display font-light leading-none tabular-nums tracking-[-0.025em] ${
              compact
                ? 'text-2xl sm:text-3xl'
                : 'text-3xl sm:text-[2.6rem] lg:text-[2.85rem]'
            } ${tone === 'dark' ? 'text-[#FFF6E8]' : 'text-[#171817]'}`}
          >
            {unit.value}
          </span>
          <span
            className={`mt-1.5 text-[10px] sm:text-[11px] font-medium tracking-[0.14em] uppercase ${
              tone === 'dark' ? 'text-[#F3CD82]/85' : 'text-[#8A693A]'
            }`}
          >
            {unit.label}
          </span>
        </div>
      ))}
    </div>
  );
};

export const EventCountdown: React.FC = () => {
  const { t } = useI18n();
  const countdowns = useLiveCountdowns();

  return (
    <section
      id="countdown"
      aria-labelledby="countdown-heading"
      data-testid="event-countdown-section"
      className="relative bg-[#101426] text-[#FFF6E8] border-t border-[#F3CD82]/20 border-b border-[#F3CD82]/25 py-14 sm:py-18 lg:py-20"
    >
      <div className="max-w-[1360px] mx-auto px-5 sm:px-8 lg:px-12 lg:pr-16 xl:pr-20 space-y-10">
        {/* Top Architectural Header Row */}
        <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-6 pb-8 border-b border-[#F3CD82]/20">
          <div className="space-y-3 max-w-2xl">
            <div className="flex items-center gap-4">
              <span className="text-[11px] font-medium tracking-[0.22em] uppercase text-[#F3CD82]">
                {t('countdown.eyebrow')}
              </span>
              <span
                aria-hidden="true"
                className="h-px flex-1 max-w-[88px] bg-gradient-to-r from-[#F3CD82]/55 to-transparent"
              />
            </div>
            <h2
              id="countdown-heading"
              className="font-editorial text-2xl sm:text-3xl lg:text-4xl font-normal text-[#FFF6E8] leading-[1.12] tracking-[-0.02em]"
            >
              {t('countdown.heading')}
            </h2>
            <p className="text-sm sm:text-[15px] leading-relaxed text-[#F5F0E7]/76 max-w-prose">
              {t('countdown.lead')}
            </p>
          </div>

          <div className="flex flex-col sm:flex-row sm:items-center gap-4 lg:items-end lg:flex-col">
            <p className="text-[11px] tracking-[0.12em] uppercase text-[#F5F0E7]/60">
              {t('countdown.timezoneNote')}
            </p>
            <Link
              to="/participate/register"
              className="group inline-flex items-center gap-2.5 self-start lg:self-end pb-1 border-b border-[#F3CD82]/55 hover:border-[#F3CD82] text-xs font-medium tracking-[0.12em] uppercase text-[#F3CD82] hover:text-[#FFF6E8] whitespace-nowrap transition-colors"
            >
              <span>{t('countdown.registerLink')}</span>
              <ArrowRight
                className="w-3.5 h-3.5 transition-transform group-hover:translate-x-0.5"
                aria-hidden="true"
              />
            </Link>
          </div>
        </div>

        {/* Dual Architectural Countdown Columns */}
        <div className="grid grid-cols-1 lg:grid-cols-2 divide-y lg:divide-y-0 lg:divide-x divide-[#F3CD82]/20">
          {COUNTDOWN_CARDS.map((card, index) => {
            const breakdown = countdowns[card.id];
            return (
              <article
                key={card.id}
                data-testid={`countdown-card-${card.id}`}
                className={`flex flex-col justify-between gap-7 py-8 lg:py-2 ${
                  index === 0 ? 'lg:pr-10 xl:pr-12' : 'lg:pl-10 xl:pl-12'
                }`}
              >
                <div className="space-y-2.5">
                  <div className="flex items-center justify-between gap-4">
                    <span className="text-[11px] font-medium tracking-[0.18em] uppercase text-[#F3CD82] tabular-nums">
                      {t(card.codeKey)}
                    </span>
                    <Calendar
                      className="w-4 h-4 text-[#F3CD82]/75 shrink-0"
                      aria-hidden="true"
                    />
                  </div>

                  <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
                    <h3 className="font-editorial text-2xl sm:text-[1.85rem] font-normal text-[#FFF6E8] leading-snug">
                      {t(card.titleKey)}
                    </h3>
                    <span className="text-xs sm:text-sm font-medium tracking-[0.08em] uppercase text-[#F3CD82] tabular-nums">
                      {t(card.dateKey)}
                    </span>
                  </div>

                  <p className="text-xs sm:text-sm text-[#F5F0E7]/70">
                    {t(card.metaKey)}
                  </p>
                </div>

                <div className="pt-4 border-t border-[#F3CD82]/15">
                  <MilestoneCountdownDigits breakdown={breakdown} tone="dark" />
                </div>
              </article>
            );
          })}
        </div>
      </div>
    </section>
  );
};
