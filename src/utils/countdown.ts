export interface CountdownBreakdown {
  targetTimestampMs: number;
  totalMs: number;
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
  isCompleted: boolean;
}

export interface CountdownTargetSpec {
  id: 'curtain-raiser' | 'main-mahotsav';
  isoTimestamp: string;
  isoDate: string;
}

/**
 * Official event anchors in India Standard Time (IST / UTC+05:30),
 * aligned with Hyderabad secretariat dates.
 */
export const MAHOTSAV_COUNTDOWN_TARGETS: Record<
  'curtain-raiser' | 'main-mahotsav',
  CountdownTargetSpec
> = {
  'curtain-raiser': {
    id: 'curtain-raiser',
    isoTimestamp: '2026-12-20T00:00:00+05:30',
    isoDate: '2026-12-20',
  },
  'main-mahotsav': {
    id: 'main-mahotsav',
    isoTimestamp: '2027-02-27T00:00:00+05:30',
    isoDate: '2027-02-27',
  },
} as const;

const MS_PER_SECOND = 1000;
const MS_PER_MINUTE = 60 * MS_PER_SECOND;
const MS_PER_HOUR = 60 * MS_PER_MINUTE;
const MS_PER_DAY = 24 * MS_PER_HOUR;

export function computeCountdown(
  targetIsoTimestamp: string,
  nowMs: number = Date.now(),
): CountdownBreakdown {
  const parsedTarget = Date.parse(targetIsoTimestamp);
  const safeNow = Number.isFinite(nowMs) ? nowMs : Date.now();

  if (!Number.isFinite(parsedTarget)) {
    return {
      targetTimestampMs: 0,
      totalMs: 0,
      days: 0,
      hours: 0,
      minutes: 0,
      seconds: 0,
      isCompleted: true,
    };
  }

  const diff = parsedTarget - safeNow;
  if (diff <= 0) {
    return {
      targetTimestampMs: parsedTarget,
      totalMs: 0,
      days: 0,
      hours: 0,
      minutes: 0,
      seconds: 0,
      isCompleted: true,
    };
  }

  const days = Math.floor(diff / MS_PER_DAY);
  const hours = Math.floor((diff % MS_PER_DAY) / MS_PER_HOUR);
  const minutes = Math.floor((diff % MS_PER_HOUR) / MS_PER_MINUTE);
  const seconds = Math.floor((diff % MS_PER_MINUTE) / MS_PER_SECOND);

  return {
    targetTimestampMs: parsedTarget,
    totalMs: diff,
    days,
    hours,
    minutes,
    seconds,
    isCompleted: false,
  };
}

export function formatCountdownUnit(value: number, padLength = 2): string {
  const safe = Number.isFinite(value) ? Math.max(0, Math.floor(value)) : 0;
  return String(safe).padStart(padLength, '0');
}
