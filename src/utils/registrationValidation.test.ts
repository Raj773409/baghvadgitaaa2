import test from 'node:test';
import assert from 'node:assert/strict';
import {
  formatInrAmount,
  getRegistrationCountryOptions,
  hasValidationErrors,
  INITIAL_REGISTRATION_VALUES,
  parseDonationAmount,
  validateRegistrationForm,
  validateRegistrationStep,
  type RegistrationFormValues,
} from './registrationValidation';

function buildValidRegistration(): RegistrationFormValues {
  return {
    fullName: 'Arjun Sharma',
    email: 'arjun.sharma@example.org',
    phone: '+91 98765 43210',
    noOfPersons: '2',
    donationAmount: '5100',
    registrationType: 'individual',
    country: 'india',
    city: 'Hyderabad',
    assistance: {
      visa: false,
      accommodation: true,
      localTransport: true,
    },
    events: {
      curtainRaiser: true,
      mahotsav: true,
    },
    consent: true,
  };
}

test('empty initial form produces required validation errors on submit', () => {
  const errors = validateRegistrationForm(INITIAL_REGISTRATION_VALUES);
  assert.equal(hasValidationErrors(errors), true);
  assert.equal(errors.fullName, 'fullNameRequired');
  assert.equal(errors.phone, 'phoneRequired');
  assert.equal(errors.donationAmount, 'donationRequired');
  assert.equal(errors.registrationType, 'registrationTypeRequired');
  assert.equal(errors.country, 'countryRequired');
  assert.equal(errors.city, 'cityRequired');
  assert.equal(errors.events, 'eventRequired');
  assert.equal(errors.consent, 'consentRequired');
  assert.equal(errors.email, undefined);
  assert.equal(errors.noOfPersons, undefined);
});

test('valid registration passes with zero errors even when optional email is blank', () => {
  const valid = buildValidRegistration();
  assert.equal(hasValidationErrors(validateRegistrationForm(valid)), false);

  const withoutEmail: RegistrationFormValues = { ...valid, email: '' };
  assert.equal(hasValidationErrors(validateRegistrationForm(withoutEmail)), false);
});

test('invalid email, phone, and donation formats report specific field errors', () => {
  const invalid: RegistrationFormValues = {
    ...buildValidRegistration(),
    email: 'not-an-email',
    phone: '12345',
    donationAmount: '-200',
  };

  const errors = validateRegistrationForm(invalid);
  assert.equal(errors.email, 'emailInvalid');
  assert.equal(errors.phone, 'phoneInvalid');
  assert.equal(errors.donationAmount, 'donationInvalid');
  assert.equal(errors.fullName, undefined);
  assert.equal(errors.country, undefined);
});

test('requires at least one event selection and governance consent', () => {
  const missingChecks: RegistrationFormValues = {
    ...buildValidRegistration(),
    events: { curtainRaiser: false, mahotsav: false },
    consent: false,
  };

  const errors = validateRegistrationForm(missingChecks);
  assert.equal(errors.events, 'eventRequired');
  assert.equal(errors.consent, 'consentRequired');
});

test('country options include all 18 official countries plus Other', () => {
  const countries = getRegistrationCountryOptions();
  assert.equal(countries.length, 19);
  assert.equal(countries[0].id, 'india');
  assert.equal(countries[countries.length - 1].id, 'other');
});

test('INR currency parser and formatter handle commas and decimals', () => {
  assert.equal(parseDonationAmount('11,000'), 11000);
  assert.equal(parseDonationAmount('0'), 0);
  assert.equal(parseDonationAmount('abc'), null);
  assert.equal(formatInrAmount('11000'), '11,000');
  assert.equal(formatInrAmount('1116'), '1,116');
});

test('validateRegistrationStep scopes checks across Steps 1 to 8 cleanly including group type', () => {
  const draft: RegistrationFormValues = {
    ...INITIAL_REGISTRATION_VALUES,
    registrationType: 'group',
  };

  assert.equal(hasValidationErrors(validateRegistrationStep(1, draft)), false);
  assert.equal(hasValidationErrors(validateRegistrationStep(2, draft)), false);

  const step3Errs = validateRegistrationStep(3, draft);
  assert.equal(step3Errs.fullName, 'fullNameRequired');
  assert.equal(step3Errs.email, 'emailRequired');
  assert.equal(step3Errs.phone, 'phoneRequired');
  assert.equal(step3Errs.country, 'countryRequired');
  assert.equal(step3Errs.city, 'cityRequired');
  assert.equal(step3Errs.donationAmount, undefined);

  const valid = { ...buildValidRegistration(), registrationType: 'group' as const };
  assert.equal(hasValidationErrors(validateRegistrationStep(3, valid)), false);
  assert.equal(hasValidationErrors(validateRegistrationStep(4, valid)), false);
  assert.equal(hasValidationErrors(validateRegistrationStep(6, valid)), false);
  assert.equal(hasValidationErrors(validateRegistrationStep(7, valid)), false);
  assert.equal(hasValidationErrors(validateRegistrationStep(8, valid)), false);
});
