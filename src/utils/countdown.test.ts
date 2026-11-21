import test from 'node:test';
import assert from 'node:assert/strict';
import {
  MAHOTSAV_COUNTDOWN_TARGETS,
  computeCountdown,
  formatCountdownUnit,
} from './countdown';

test('computeCountdown computes exact days, hours, minutes, and seconds remaining to Curtain Raiser and Main Mahotsav', () => {
  const curtainTargetMs = Date.parse(MAHOTSAV_COUNTDOWN_TARGETS['curtain-raiser'].isoTimestamp);
  const offsetMs =
    35 * 24 * 60 * 60 * 1000 +
    14 * 60 * 60 * 1000 +
    27 * 60 * 1000 +
    42 * 1000;

  const result = computeCountdown(
    MAHOTSAV_COUNTDOWN_TARGETS['curtain-raiser'].isoTimestamp,
    curtainTargetMs - offsetMs,
  );

  assert.equal(result.isCompleted, false);
  assert.equal(result.days, 35);
  assert.equal(result.hours, 14);
  assert.equal(result.minutes, 27);
  assert.equal(result.seconds, 42);

  const mainTargetMs = Date.parse(MAHOTSAV_COUNTDOWN_TARGETS['main-mahotsav'].isoTimestamp);
  const mainResult = computeCountdown(
    MAHOTSAV_COUNTDOWN_TARGETS['main-mahotsav'].isoTimestamp,
    mainTargetMs - (104 * 24 * 60 * 60 * 1000 + 5 * 60 * 1000),
  );
  assert.equal(mainResult.isCompleted, false);
  assert.equal(mainResult.days, 104);
  assert.equal(mainResult.hours, 0);
  assert.equal(mainResult.minutes, 5);
  assert.equal(mainResult.seconds, 0);
});

test('computeCountdown clamps cleanly to zero once target timestamp has passed', () => {
  const targetIso = MAHOTSAV_COUNTDOWN_TARGETS['curtain-raiser'].isoTimestamp;
  const targetMs = Date.parse(targetIso);

  const exact = computeCountdown(targetIso, targetMs);
  assert.equal(exact.isCompleted, true);
  assert.equal(exact.days, 0);
  assert.equal(exact.hours, 0);
  assert.equal(exact.minutes, 0);
  assert.equal(exact.seconds, 0);

  const past = computeCountdown(targetIso, targetMs + 60_000);
  assert.equal(past.isCompleted, true);
  assert.equal(past.totalMs, 0);
});

test('formatCountdownUnit zero-pads numbers deterministically', () => {
  assert.equal(formatCountdownUnit(4), '04');
  assert.equal(formatCountdownUnit(105), '105');
  assert.equal(formatCountdownUnit(-5), '00');
});
