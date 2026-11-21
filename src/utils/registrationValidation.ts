import { PARTICIPATING_COUNTRIES } from '../content/countryContent';

export type RegistrationTypeId =
  | 'individual'
  | 'family'
  | 'group'
  | 'volunteer'
  | 'scholar'
  | 'youth'
  | 'institutional';

export type RegistrationStepNumber = 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8;

export type AssistanceKey = 'visa' | 'accommodation' | 'localTransport';
export type EventSelectionKey = 'curtainRaiser' | 'mahotsav';

export interface RegistrationFormValues {
  fullName: string;
  email: string;
  phone: string;
  noOfPersons: string;
  donationAmount: string;
  registrationType: RegistrationTypeId | '';
  country: string;
  city: string;
  assistance: Record<AssistanceKey, boolean>;
  events: Record<EventSelectionKey, boolean>;
  consent: boolean;
  preferredLanguage?: string;
  familyOrGroupMembers?: string;
  organisationName?: string;
  organisationRole?: string;
  volunteerSkills?: string;
  parayanaCity?: string;
  assistanceNotes?: string;
}

export type RegistrationErrorKey =
  | 'fullNameRequired'
  | 'fullNameTooShort'
  | 'emailRequired'
  | 'emailInvalid'
  | 'phoneRequired'
  | 'phoneInvalid'
  | 'personsInvalid'
  | 'donationRequired'
  | 'donationInvalid'
  | 'registrationTypeRequired'
  | 'countryRequired'
  | 'cityRequired'
  | 'cityTooShort'
  | 'eventRequired'
  | 'consentRequired';

export interface RegistrationFormErrors {
  fullName?: RegistrationErrorKey;
  email?: RegistrationErrorKey;
  phone?: RegistrationErrorKey;
  noOfPersons?: RegistrationErrorKey;
  donationAmount?: RegistrationErrorKey;
  registrationType?: RegistrationErrorKey;
  country?: RegistrationErrorKey;
  city?: RegistrationErrorKey;
  events?: RegistrationErrorKey;
  consent?: RegistrationErrorKey;
}

export const INITIAL_REGISTRATION_VALUES: RegistrationFormValues = {
  fullName: '',
  email: '',
  phone: '',
  noOfPersons: '1',
  donationAmount: '',
  registrationType: '',
  country: '',
  city: '',
  assistance: {
    visa: false,
    accommodation: false,
    localTransport: false,
  },
  events: {
    curtainRaiser: false,
    mahotsav: false,
  },
  consent: false,
  preferredLanguage: 'en',
  familyOrGroupMembers: '',
  organisationName: '',
  organisationRole: '',
  volunteerSkills: '',
  parayanaCity: '',
  assistanceNotes: '',
};

export const REGISTRATION_TYPE_OPTIONS: ReadonlyArray<{
  value: RegistrationTypeId;
  labelKey: string;
}> = [
  { value: 'individual', labelKey: 'registration.types.individual' },
  { value: 'family', labelKey: 'registration.types.family' },
  { value: 'group', labelKey: 'registration.types.group' },
  { value: 'volunteer', labelKey: 'registration.types.volunteer' },
  { value: 'scholar', labelKey: 'registration.types.scholar' },
  { value: 'youth', labelKey: 'registration.types.youth' },
  { value: 'institutional', labelKey: 'registration.types.institutional' },
];

export const PERSON_COUNT_OPTIONS: ReadonlyArray<string> = [
  '1',
  '2',
  '3',
  '4',
  '5',
  '6',
  '7',
  '8',
  '9',
  '10',
  '15',
  '25',
  '50',
];

export const DONATION_SUGGESTION_AMOUNTS: ReadonlyArray<number> = [
  501,
  1116,
  2500,
  5100,
  11000,
  21000,
  51000,
];

export const ASSISTANCE_OPTIONS: ReadonlyArray<{
  key: AssistanceKey;
  labelKey: string;
}> = [
  { key: 'visa', labelKey: 'registration.assistance.visa' },
  { key: 'accommodation', labelKey: 'registration.assistance.accommodation' },
  { key: 'localTransport', labelKey: 'registration.assistance.localTransport' },
];

export const EVENT_SELECTION_OPTIONS: ReadonlyArray<{
  key: EventSelectionKey;
  labelKey: string;
}> = [
  { key: 'curtainRaiser', labelKey: 'registration.events.curtainRaiser' },
  { key: 'mahotsav', labelKey: 'registration.events.mahotsav' },
];

export const REGISTRATION_STEPS: ReadonlyArray<{
  step: RegistrationStepNumber;
  key: string;
}> = [
  { step: 1, key: 'language' },
  { step: 2, key: 'type' },
  { step: 3, key: 'personal' },
  { step: 4, key: 'eventsDonation' },
  { step: 5, key: 'assistance' },
  { step: 6, key: 'policies' },
  { step: 7, key: 'review' },
  { step: 8, key: 'confirmPayment' },
];

export function getRegistrationCountryOptions(): ReadonlyArray<{
  id: string;
  labelKey: string;
}> {
  return [
    ...PARTICIPATING_COUNTRIES.map((country) => ({
      id: country.id,
      labelKey: country.nameKey,
    })),
    { id: 'other', labelKey: 'registration.countryOther' },
  ];
}

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

export function countPhoneDigits(rawPhone: string): number {
  return rawPhone.replace(/\D/g, '').length;
}

export function parseDonationAmount(rawAmount: string): number | null {
  const cleaned = rawAmount.replace(/,/g, '').trim();
  if (!cleaned) return null;
  if (!/^\d+(\.\d{1,2})?$/.test(cleaned)) return null;
  const parsed = Number(cleaned);
  if (!Number.isFinite(parsed)) return null;
  return parsed;
}

export function validateRegistrationForm(values: RegistrationFormValues): RegistrationFormErrors {
  const errors: RegistrationFormErrors = {};

  const trimmedName = values.fullName.trim();
  if (!trimmedName) {
    errors.fullName = 'fullNameRequired';
  } else if (trimmedName.length < 2) {
    errors.fullName = 'fullNameTooShort';
  }

  const trimmedEmail = values.email.trim();
  if (trimmedEmail && !EMAIL_PATTERN.test(trimmedEmail)) {
    errors.email = 'emailInvalid';
  }

  const trimmedPhone = values.phone.trim();
  if (!trimmedPhone) {
    errors.phone = 'phoneRequired';
  } else {
    const digits = countPhoneDigits(trimmedPhone);
    if (digits < 7 || digits > 15) {
      errors.phone = 'phoneInvalid';
    }
  }

  const persons = Number(values.noOfPersons);
  if (!Number.isInteger(persons) || persons < 1 || persons > 500) {
    errors.noOfPersons = 'personsInvalid';
  }

  const rawDonation = values.donationAmount.trim();
  if (!rawDonation) {
    errors.donationAmount = 'donationRequired';
  } else {
    const parsed = parseDonationAmount(rawDonation);
    if (parsed === null || parsed < 1) {
      errors.donationAmount = 'donationInvalid';
    }
  }

  if (!values.registrationType) {
    errors.registrationType = 'registrationTypeRequired';
  }

  if (!values.country.trim()) {
    errors.country = 'countryRequired';
  }

  const trimmedCity = values.city.trim();
  if (!trimmedCity) {
    errors.city = 'cityRequired';
  } else if (trimmedCity.length < 2) {
    errors.city = 'cityTooShort';
  }

  if (!values.events.curtainRaiser && !values.events.mahotsav) {
    errors.events = 'eventRequired';
  }

  if (!values.consent) {
    errors.consent = 'consentRequired';
  }

  return errors;
}

/**
 * Step-scoped validation for the 8-step guided registration journey.
 * In step 3, email is required so Secretariat dossier persistence & receipts succeed.
 */
export function validateRegistrationStep(
  step: RegistrationStepNumber,
  values: RegistrationFormValues,
): RegistrationFormErrors {
  const full = validateRegistrationForm(values);
  const scoped: RegistrationFormErrors = {};

  if (step === 1) {
    return scoped;
  }

  if (step === 2) {
    if (full.registrationType) scoped.registrationType = full.registrationType;
    return scoped;
  }

  if (step === 3) {
    if (full.fullName) scoped.fullName = full.fullName;
    if (!values.email.trim()) {
      scoped.email = 'emailRequired';
    } else if (full.email) {
      scoped.email = full.email;
    }
    if (full.phone) scoped.phone = full.phone;
    if (full.noOfPersons) scoped.noOfPersons = full.noOfPersons;
    if (full.country) scoped.country = full.country;
    if (full.city) scoped.city = full.city;
    return scoped;
  }

  if (step === 4) {
    if (full.events) scoped.events = full.events;
    if (full.donationAmount) scoped.donationAmount = full.donationAmount;
    return scoped;
  }

  if (step === 5) {
    return scoped;
  }

  if (step === 6) {
    if (full.consent) scoped.consent = full.consent;
    return scoped;
  }

  // Step 7 & 8 require full validation including valid email
  if (!values.email.trim()) {
    full.email = 'emailRequired';
  }
  return full;
}

export function hasValidationErrors(errors: RegistrationFormErrors): boolean {
  return Object.keys(errors).length > 0;
}

export function formatInrAmount(rawAmount: string): string {
  const parsed = parseDonationAmount(rawAmount);
  if (parsed === null) return rawAmount;
  return new Intl.NumberFormat('en-IN', {
    maximumFractionDigits: 2,
  }).format(parsed);
}

const DRAFT_STORAGE_KEY = 'eternal.registration.draft.v1';

export function saveRegistrationDraft(values: RegistrationFormValues): void {
  try {
    if (typeof window !== 'undefined' && window.sessionStorage) {
      window.sessionStorage.setItem(DRAFT_STORAGE_KEY, JSON.stringify(values));
    }
  } catch {
    // Ignore storage quota or sandbox restrictions
  }
}

export function loadRegistrationDraft(): RegistrationFormValues | null {
  try {
    if (typeof window !== 'undefined' && window.sessionStorage) {
      const raw = window.sessionStorage.getItem(DRAFT_STORAGE_KEY);
      if (!raw) return null;
      const parsed = JSON.parse(raw) as Partial<RegistrationFormValues>;
      return {
        ...INITIAL_REGISTRATION_VALUES,
        ...parsed,
        assistance: {
          ...INITIAL_REGISTRATION_VALUES.assistance,
          ...(parsed.assistance ?? {}),
        },
        events: {
          ...INITIAL_REGISTRATION_VALUES.events,
          ...(parsed.events ?? {}),
        },
      };
    }
  } catch {
    return null;
  }
  return null;
}
