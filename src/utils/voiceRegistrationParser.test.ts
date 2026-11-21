import test from 'node:test';
import assert from 'node:assert/strict';
import { INITIAL_REGISTRATION_VALUES } from './registrationValidation';
import {
  buildStep8SpokenSummary,
  formatEmailForReadback,
  formatPhoneForReadback,
  getVoiceStepPrompt,
  parseRegistrationUtterance,
  sanitizeSensitiveUtterance,
} from './voiceRegistrationParser';

test('parseRegistrationUtterance extracts full name, email, phone, country, city and donation cleanly', () => {
  const res = parseRegistrationUtterance({
    utterance:
      'My name is Lakshmi Narayana, email lakshmi@example.org, phone +91 98480 12345, from Hyderabad, India, donate ₹2500 for Youth',
    step: 3,
    locale: 'en',
    currentValues: INITIAL_REGISTRATION_VALUES,
  });

  assert.equal(res.updates.fullName, 'Lakshmi Narayana');
  assert.equal(res.updates.email, 'lakshmi@example.org');
  assert.equal(res.updates.phone, '+91 98480 12345');
  assert.equal(res.updates.country, 'india');
  assert.equal(res.updates.city, 'Hyderabad');
  assert.equal(res.updates.donationAmount, '2500');
  assert.equal(res.updates.registrationType, 'youth');
  assert.equal(res.needsEmailPhoneConfirmation, true);
  assert.equal(res.sensitiveBlocked, false);
});

test('never accepts sensitive card, CVV, OTP, or UPI PIN data', () => {
  const res = parseRegistrationUtterance({
    utterance: 'My credit card number is 4111 2222 3333 4444 and cvv 123 and otp 9988',
    step: 8,
    locale: 'en',
    currentValues: INITIAL_REGISTRATION_VALUES,
  });

  assert.equal(res.sensitiveBlocked, true);
  assert.deepEqual(res.updates, {});

  const sanitized = sanitizeSensitiveUtterance('card 4111 2222 3333 4444 otp 4321');
  assert.equal(sanitized.hadSensitiveTokens, true);
  assert.ok(!sanitized.cleaned.includes('4111'));
});

test('recognizes Telugu, Hindi, and English navigation commands and readbacks', () => {
  const langRes = parseRegistrationUtterance({
    utterance: 'Please change language to Telugu',
    step: 1,
    locale: 'en',
    currentValues: INITIAL_REGISTRATION_VALUES,
  });
  assert.equal(langRes.intent, 'change-language');
  assert.equal(langRes.targetLocale, 'te');

  const skipRes = parseRegistrationUtterance({
    utterance: 'Skip this step please',
    step: 5,
    locale: 'en',
    currentValues: INITIAL_REGISTRATION_VALUES,
  });
  assert.equal(skipRes.intent, 'skip');

  assert.equal(formatEmailForReadback('sita@rama.org'), 'sita at rama dot org');
  assert.equal(formatPhoneForReadback('+91 98765'), '+ 9 1 9 8 7 6 5');
  assert.ok(getVoiceStepPrompt(8, 'te').includes('MAKE PAYMENT'));
  assert.ok(
    buildStep8SpokenSummary(
      { ...INITIAL_REGISTRATION_VALUES, fullName: 'Rama', city: 'Hyderabad' },
      'te',
    ).includes('మీరు నమోదు చేసిన వివరాలు ఇవి'),
  );
});
