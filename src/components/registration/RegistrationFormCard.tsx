import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  AlertCircle,
  ArrowDown,
  ArrowLeft,
  ArrowRight,
  ArrowUpRight,
  Building2,
  Check,
  CheckCircle2,
  ChevronDown,
  CreditCard,
  Edit3,
  Globe,
  HandHeart,
  Languages,
  Layers,
  Lock,
  Mail,
  MapPin,
  Phone,
  ShieldCheck,
  Sparkles,
  User,
  Users,
} from 'lucide-react';
import { usePublicCms } from '../../hooks/usePublicCms';
import { useI18n } from '../../i18n';
import type { CoreLocale } from '../../utils/i18nHelpers';
import type { NoticeKind } from '../layout/InstitutionalNoticeModal';
import {
  ASSISTANCE_OPTIONS,
  DONATION_SUGGESTION_AMOUNTS,
  EVENT_SELECTION_OPTIONS,
  PERSON_COUNT_OPTIONS,
  REGISTRATION_TYPE_OPTIONS,
  formatInrAmount,
  getRegistrationCountryOptions,
  hasValidationErrors,
  validateRegistrationForm,
  validateRegistrationStep,
  type AssistanceKey,
  type EventSelectionKey,
  type RegistrationFormErrors,
  type RegistrationFormValues,
  type RegistrationStepNumber,
  type RegistrationTypeId,
} from '../../utils/registrationValidation';
import { RegistrationStepIndicator } from './RegistrationStepIndicator';
import { VoiceRegistrationAssistant } from './VoiceRegistrationAssistant';

interface RegistrationFormCardProps {
  fullNameInputRef: React.RefObject<HTMLInputElement | null>;
  values: RegistrationFormValues;
  currentStep: RegistrationStepNumber;
  highestReachedStep: RegistrationStepNumber;
  confirmed: boolean;
  voiceLocale: CoreLocale;
  onVoiceLocaleChange: (next: CoreLocale) => void;
  onValuesChange: (updater: (prev: RegistrationFormValues) => RegistrationFormValues) => void;
  onStepChange: (next: RegistrationStepNumber) => void;
  onConfirmChange: (confirmed: boolean) => void;
  onOpenPolicy: (kind: Exclude<NoticeKind, null>) => void;
  onValidatedSubmit: (values: RegistrationFormValues) => void;
}

const CornerFiligree: React.FC<{ flip?: boolean }> = ({ flip = false }) => (
  <svg
    width="110"
    height="110"
    viewBox="0 0 120 120"
    fill="none"
    aria-hidden="true"
    className={`pointer-events-none select-none text-[#D6A447]/22 ${
      flip ? '-scale-x-100' : ''
    }`}
  >
    <path
      d="M8 106C10 66 26 32 68 14C46 38 38 66 36 96C26 98 16 102 8 106Z"
      stroke="currentColor"
      strokeWidth="1.1"
    />
    <path
      d="M18 78C26 52 46 30 82 18C62 34 52 54 48 76"
      stroke="currentColor"
      strokeWidth="0.9"
    />
    <circle cx="28" cy="28" r="3" stroke="currentColor" strokeWidth="0.9" />
  </svg>
);

const PREFERRED_LANGUAGE_OPTIONS: ReadonlyArray<{
  code: string;
  label: string;
  native: string;
  coreLocale?: CoreLocale;
}> = [
  { code: 'en', label: 'English', native: 'English', coreLocale: 'en' },
  { code: 'hi', label: 'Hindi', native: 'हिन्दी', coreLocale: 'hi' },
  { code: 'te', label: 'Telugu', native: 'తెలుగు', coreLocale: 'te' },
  { code: 'sa', label: 'Sanskrit', native: 'संस्कृतम्' },
  { code: 'ta', label: 'Tamil', native: 'தமிழ்' },
  { code: 'kn', label: 'Kannada', native: 'ಕನ್ನಡ' },
  { code: 'ml', label: 'Malayalam', native: 'മലയാളം' },
  { code: 'mr', label: 'Marathi', native: 'मराठी' },
  { code: 'gu', label: 'Gujarati', native: 'ગુજરાતી' },
  { code: 'bn', label: 'Bengali', native: 'বাংলা' },
];

export const RegistrationFormCard: React.FC<RegistrationFormCardProps> = ({
  fullNameInputRef,
  values,
  currentStep,
  highestReachedStep,
  confirmed,
  voiceLocale,
  onVoiceLocaleChange,
  onValuesChange,
  onStepChange,
  onConfirmChange,
  onOpenPolicy,
  onValidatedSubmit,
}) => {
  const { t, setLocale } = useI18n();
  const publicCms = usePublicCms();
  const [errors, setErrors] = useState<RegistrationFormErrors>({});
  const [hasAttemptedStep, setHasAttemptedStep] = useState(false);
  const [presetMenuOpen, setPresetMenuOpen] = useState(false);
  const [pointerDismissed, setPointerDismissed] = useState(false);
  const donationBoxRef = useRef<HTMLDivElement | null>(null);

  const countryOptions = getRegistrationCountryOptions();

  // Dynamic CMS donation tiers override if published in admin CMS `donationConfig`
  const donationAmounts = useMemo(() => {
    const cmsTiers = (publicCms?.cmsItems ?? [])
      .filter((item) => item.section === 'donationConfig' && item.status === 'published')
      .map((item) => {
        const parsed = Number(String(item.title).replace(/[^\d]/g, ''));
        return Number.isFinite(parsed) && parsed > 0 ? parsed : null;
      })
      .filter((n): n is number => n !== null);
    return cmsTiers.length > 0 ? Array.from(new Set(cmsTiers)) : [...DONATION_SUGGESTION_AMOUNTS];
  }, [publicCms]);

  useEffect(() => {
    if (!presetMenuOpen) return;
    const handleOutside = (event: MouseEvent) => {
      if (donationBoxRef.current && !donationBoxRef.current.contains(event.target as Node)) {
        setPresetMenuOpen(false);
      }
    };
    const handleKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setPresetMenuOpen(false);
    };
    window.addEventListener('mousedown', handleOutside);
    window.addEventListener('keydown', handleKey);
    return () => {
      window.removeEventListener('mousedown', handleOutside);
      window.removeEventListener('keydown', handleKey);
    };
  }, [presetMenuOpen]);

  const updateField = (updater: (prev: RegistrationFormValues) => RegistrationFormValues) => {
    onValuesChange((prev) => {
      const next = updater(prev);
      if (hasAttemptedStep) {
        setErrors(validateRegistrationStep(currentStep, next));
      }
      return next;
    });
    if (confirmed) {
      onConfirmChange(false);
    }
  };

  const handleNextStep = () => {
    setHasAttemptedStep(true);
    const stepErrors = validateRegistrationStep(currentStep, values);
    setErrors(stepErrors);
    if (hasValidationErrors(stepErrors)) {
      return;
    }
    setHasAttemptedStep(false);
    setErrors({});
    if (currentStep < 8) {
      onStepChange((currentStep + 1) as RegistrationStepNumber);
    }
  };

  const handlePreviousStep = () => {
    setHasAttemptedStep(false);
    setErrors({});
    if (currentStep > 1) {
      onStepChange((currentStep - 1) as RegistrationStepNumber);
    }
  };

  const handleSkipStep = () => {
    if (currentStep === 5) {
      setHasAttemptedStep(false);
      setErrors({});
      onStepChange(6);
    }
  };

  const handleVoiceCommand = (command: 'next' | 'previous' | 'skip' | 'confirm') => {
    if (command === 'next') {
      handleNextStep();
    } else if (command === 'previous') {
      handlePreviousStep();
    } else if (command === 'skip') {
      handleSkipStep();
    } else if (command === 'confirm') {
      if (currentStep === 7) {
        onStepChange(8);
      } else if (currentStep === 8) {
        const allErrs = validateRegistrationForm(values);
        if (!hasValidationErrors(allErrs)) {
          onConfirmChange(true);
          setPointerDismissed(false);
        }
      }
    }
  };

  const handleConfirmMyDetails = () => {
    setHasAttemptedStep(true);
    const allErrors = validateRegistrationStep(8, values);
    setErrors(allErrors);
    if (hasValidationErrors(allErrors)) {
      return;
    }
    onConfirmChange(true);
    setPointerDismissed(false);
  };

  const handleFinalPaymentClick = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setPointerDismissed(true);
    setHasAttemptedStep(true);
    const allErrors = validateRegistrationStep(8, values);
    setErrors(allErrors);
    if (hasValidationErrors(allErrors)) {
      return;
    }
    onValidatedSubmit(values);
  };

  const inputShellClass = (hasError: boolean) =>
    `relative flex items-center h-[42px] rounded-xl border bg-white/95 transition-all duration-150 ${
      hasError
        ? 'border-[#C7473B] ring-1 ring-[#C7473B]/25'
        : 'border-[#D6C3A5] focus-within:border-[#D6A447] focus-within:ring-2 focus-within:ring-[#F3CD82]/40'
    }`;

  const labelClass =
    'block text-[10px] font-semibold tracking-[0.07em] uppercase text-[#24201C] mb-1';
  const errorTextClass = 'mt-1 text-[11px] font-medium text-[#C7473B] leading-tight';

  const regTypeOption = REGISTRATION_TYPE_OPTIONS.find((o) => o.value === values.registrationType);
  const countryOption = countryOptions.find((c) => c.id === values.country);
  const selectedEvents = EVENT_SELECTION_OPTIONS.filter((e) => values.events[e.key]).map((e) =>
    t(e.labelKey),
  );
  const selectedAssistance = ASSISTANCE_OPTIONS.filter((a) => values.assistance[a.key]).map((a) =>
    t(a.labelKey),
  );

  return (
    <div id="registration-form" data-reg-card-reveal className="relative w-full lg:w-[54%] flex justify-center lg:justify-end">
      <div className="relative w-full max-w-[680px] pt-2.5">
        {/* Top-Center Floating Lotus Crest */}
        <div
          aria-hidden="true"
          className="absolute top-0 left-1/2 -translate-x-1/2 z-20 flex items-center justify-center px-3.5 py-1 rounded-full bg-gradient-to-b from-[#202B48] to-[#101426] border border-[#F3CD82]/85 shadow-[0_6px_18px_rgba(16,20,38,0.45)]"
        >
          <svg width="34" height="20" viewBox="0 0 44 28" fill="none" className="text-[#F3CD82]">
            <path
              d="M22 2C19.5 7.5 19.5 13 22 18.5C24.5 13 24.5 7.5 22 2Z"
              fill="currentColor"
              fillOpacity="0.28"
              stroke="currentColor"
              strokeWidth="1.4"
            />
            <path d="M22 18.5C16.8 15.8 13.8 11 13 5.2C17.5 7.5 20.6 12 22 18.5Z" stroke="currentColor" strokeWidth="1.25" />
            <path d="M22 18.5C27.2 15.8 30.2 11 31 5.2C26.5 7.5 23.4 12 22 18.5Z" stroke="currentColor" strokeWidth="1.25" />
            <path d="M11 23.5C18 22 26 22 33 23.5" stroke="currentColor" strokeWidth="1.15" strokeLinecap="round" />
          </svg>
        </div>

        {/* Ornamental Ivory Parchment Panel */}
        <div
          className="relative overflow-hidden rounded-[24px] border border-[#F3CD82]/90 px-5 sm:px-7 pt-7 pb-6 text-[#24201C] shadow-[0_24px_70px_rgba(10,14,28,0.62),0_0_40px_rgba(243,205,130,0.16)]"
          style={{
            background: 'linear-gradient(180deg, #FFFDF9 0%, #FFF6E8 52%, #F4E8D3 100%)',
          }}
        >
          <div
            aria-hidden="true"
            className="pointer-events-none absolute inset-[7px] rounded-[18px] border border-[#D6A447]/45"
          />
          <div aria-hidden="true" className="pointer-events-none absolute top-1 left-1">
            <CornerFiligree />
          </div>
          <div aria-hidden="true" className="pointer-events-none absolute top-1 right-1">
            <CornerFiligree flip />
          </div>

          <div className="relative z-10">
            <div className="text-center mb-3">
              <h2 className="font-editorial text-[clamp(1.5rem,2.2vw,1.95rem)] font-medium leading-tight tracking-[-0.015em] text-[#24201C]">
                {t('registration.form.heading')}
              </h2>
              <p className="text-xs text-[#5B5248] mt-0.5">
                {t('registration.form.subheading')}
              </p>
            </div>

            {/* Voice Assistant Dock */}
            <VoiceRegistrationAssistant
              currentStep={currentStep}
              locale={voiceLocale}
              values={values}
              onLocaleChange={(next) => {
                onVoiceLocaleChange(next);
                setLocale(next);
                updateField((prev) => ({ ...prev, preferredLanguage: next }));
              }}
              onApplyUpdates={(updates) => {
                updateField((prev) => ({
                  ...prev,
                  ...updates,
                  assistance: updates.assistance
                    ? { ...prev.assistance, ...updates.assistance }
                    : prev.assistance,
                  events: updates.events
                    ? { ...prev.events, ...updates.events }
                    : prev.events,
                }));
              }}
              onStepCommand={handleVoiceCommand}
            />

            {/* 8-Step Horizontal Stepper */}
            <RegistrationStepIndicator
              currentStep={currentStep}
              highestReachedStep={highestReachedStep}
              locale={voiceLocale}
              onSelectStep={(step) => {
                setHasAttemptedStep(false);
                setErrors({});
                onStepChange(step);
              }}
            />

            <form onSubmit={handleFinalPaymentClick} noValidate className="space-y-4">
              {/* STEP 1: PREFERRED LANGUAGE */}
              {currentStep === 1 && (
                <div data-testid="reg-step-panel-1" className="space-y-3">
                  <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.12em] text-[#8F6018]">
                    <Languages className="w-4 h-4" aria-hidden="true" />
                    <span>Select Preferred Communication Language</span>
                  </div>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                    {PREFERRED_LANGUAGE_OPTIONS.map((lang) => {
                      const active = (values.preferredLanguage || 'en') === lang.code;
                      return (
                        <button
                          key={lang.code}
                          type="button"
                          data-testid={`reg-lang-${lang.code}`}
                          onClick={() => {
                            updateField((prev) => ({ ...prev, preferredLanguage: lang.code }));
                            if (lang.coreLocale) {
                              onVoiceLocaleChange(lang.coreLocale);
                              setLocale(lang.coreLocale);
                            }
                          }}
                          className={`p-2.5 rounded-xl border text-left transition-all cursor-pointer ${
                            active
                              ? 'border-[#8F6018] bg-[#17233A] text-[#FFFDF7] shadow-sm'
                              : 'border-[#D6C3A5] bg-white/85 text-[#24201C] hover:border-[#D4A537]'
                          }`}
                        >
                          <p className="text-xs font-semibold">{lang.native}</p>
                          <p
                            className={`text-[10.5px] ${
                              active ? 'text-[#F7D774]' : 'text-[#6B6155]'
                            }`}
                          >
                            {lang.label}
                          </p>
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* STEP 2: PARTICIPATION TYPE */}
              {currentStep === 2 && (
                <div data-testid="reg-step-panel-2" className="space-y-3">
                  <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.12em] text-[#8F6018]">
                    <Layers className="w-4 h-4" aria-hidden="true" />
                    <span>{t('registration.form.registrationTypeLabel')} *</span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                    {REGISTRATION_TYPE_OPTIONS.map((opt) => {
                      const active = values.registrationType === opt.value;
                      return (
                        <button
                          key={opt.value}
                          type="button"
                          data-testid={`reg-type-card-${opt.value}`}
                          onClick={() =>
                            updateField((prev) => ({
                              ...prev,
                              registrationType: opt.value,
                            }))
                          }
                          className={`p-3 rounded-xl border text-left flex items-center justify-between gap-2 transition-all cursor-pointer ${
                            active
                              ? 'border-[#8F6018] bg-[#17233A] text-[#FFFDF7]'
                              : 'border-[#D6C3A5] bg-white/85 text-[#24201C] hover:border-[#D4A537]'
                          }`}
                        >
                          <span className="text-xs font-semibold">{t(opt.labelKey)}</span>
                          {active && <Check className="w-4 h-4 text-[#F7D774] shrink-0" />}
                        </button>
                      );
                    })}
                  </div>

                  <div>
                    <label htmlFor="reg-type" className={labelClass}>
                      {t('registration.form.registrationTypeLabel')}
                    </label>
                    <div className={inputShellClass(Boolean(errors.registrationType))}>
                      <Layers className="w-4 h-4 text-[#8B6B38] ml-3.5 shrink-0" aria-hidden="true" />
                      <select
                        id="reg-type"
                        name="registrationType"
                        aria-invalid={Boolean(errors.registrationType)}
                        value={values.registrationType}
                        onChange={(e) =>
                          updateField((prev) => ({
                            ...prev,
                            registrationType: e.target.value as RegistrationTypeId | '',
                          }))
                        }
                        className="w-full h-full appearance-none bg-transparent pl-3 pr-9 text-sm text-[#24201C] focus:outline-none cursor-pointer"
                      >
                        <option value="">{t('registration.form.registrationTypePlaceholder')}</option>
                        {REGISTRATION_TYPE_OPTIONS.map((opt) => (
                          <option key={opt.value} value={opt.value}>
                            {t(opt.labelKey)}
                          </option>
                        ))}
                      </select>
                      <ChevronDown className="w-4 h-4 text-[#6B6155] absolute right-3 pointer-events-none" />
                    </div>
                    {errors.registrationType && (
                      <p role="alert" className={errorTextClass}>
                        {t(`registration.errors.${errors.registrationType}`)}
                      </p>
                    )}
                  </div>
                </div>
              )}

              {/* STEP 3: PERSONAL, LOCATION & CONDITIONAL DETAILS */}
              {currentStep === 3 && (
                <div data-testid="reg-step-panel-3" className="space-y-3">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label htmlFor="reg-full-name" className={labelClass}>
                        {t('registration.form.fullNameLabel')}{' '}
                        <span className="text-[#C7473B]" aria-hidden="true">*</span>
                      </label>
                      <div className={inputShellClass(Boolean(errors.fullName))}>
                        <User className="w-4 h-4 text-[#8B6B38] ml-3.5 shrink-0" aria-hidden="true" />
                        <input
                          ref={fullNameInputRef}
                          id="reg-full-name"
                          name="fullName"
                          type="text"
                          required
                          aria-invalid={Boolean(errors.fullName)}
                          value={values.fullName}
                          onChange={(e) =>
                            updateField((prev) => ({ ...prev, fullName: e.target.value }))
                          }
                          placeholder={t('registration.form.fullNamePlaceholder')}
                          className="w-full h-full bg-transparent px-3 text-sm text-[#24201C] placeholder:text-[#8C8175] focus:outline-none"
                        />
                      </div>
                      {errors.fullName && (
                        <p role="alert" className={errorTextClass}>
                          {t(`registration.errors.${errors.fullName}`)}
                        </p>
                      )}
                    </div>

                    <div>
                      <label htmlFor="reg-email" className={labelClass}>
                        {t('registration.form.emailLabel')}{' '}
                        <span className="text-[#C7473B]" aria-hidden="true">*</span>
                      </label>
                      <div className={inputShellClass(Boolean(errors.email))}>
                        <Mail className="w-4 h-4 text-[#8B6B38] ml-3.5 shrink-0" aria-hidden="true" />
                        <input
                          id="reg-email"
                          name="email"
                          type="email"
                          required
                          aria-invalid={Boolean(errors.email)}
                          value={values.email}
                          onChange={(e) =>
                            updateField((prev) => ({ ...prev, email: e.target.value }))
                          }
                          placeholder={t('registration.form.emailPlaceholder')}
                          className="w-full h-full bg-transparent px-3 text-sm text-[#24201C] placeholder:text-[#8C8175] focus:outline-none"
                        />
                      </div>
                      {errors.email && (
                        <p role="alert" className={errorTextClass}>
                          {t(`registration.errors.${errors.email}`)}
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label htmlFor="reg-phone" className={labelClass}>
                        {t('registration.form.phoneLabel')}{' '}
                        <span className="text-[#C7473B]" aria-hidden="true">*</span>
                      </label>
                      <div className={inputShellClass(Boolean(errors.phone))}>
                        <Phone className="w-4 h-4 text-[#8B6B38] ml-3.5 shrink-0" aria-hidden="true" />
                        <input
                          id="reg-phone"
                          name="phone"
                          type="tel"
                          required
                          aria-invalid={Boolean(errors.phone)}
                          value={values.phone}
                          onChange={(e) =>
                            updateField((prev) => ({ ...prev, phone: e.target.value }))
                          }
                          placeholder={t('registration.form.phonePlaceholder')}
                          className="w-full h-full bg-transparent px-3 text-sm text-[#24201C] placeholder:text-[#8C8175] tabular-nums focus:outline-none"
                        />
                      </div>
                      {errors.phone && (
                        <p role="alert" className={errorTextClass}>
                          {t(`registration.errors.${errors.phone}`)}
                        </p>
                      )}
                    </div>

                    <div>
                      <label htmlFor="reg-persons" className={labelClass}>
                        {t('registration.form.personsLabel')}
                      </label>
                      <div className={inputShellClass(Boolean(errors.noOfPersons))}>
                        <Users className="w-4 h-4 text-[#8B6B38] ml-3.5 shrink-0" aria-hidden="true" />
                        <select
                          id="reg-persons"
                          name="noOfPersons"
                          value={values.noOfPersons}
                          onChange={(e) =>
                            updateField((prev) => ({ ...prev, noOfPersons: e.target.value }))
                          }
                          className="w-full h-full appearance-none bg-transparent pl-3 pr-9 text-sm text-[#24201C] tabular-nums focus:outline-none cursor-pointer"
                        >
                          {PERSON_COUNT_OPTIONS.map((count) => (
                            <option key={count} value={count}>
                              {count}
                            </option>
                          ))}
                        </select>
                        <ChevronDown className="w-4 h-4 text-[#6B6155] absolute right-3 pointer-events-none" />
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label htmlFor="reg-country" className={labelClass}>
                        {t('registration.form.countryLabel')}{' '}
                        <span className="text-[#C7473B]" aria-hidden="true">*</span>
                      </label>
                      <div className={inputShellClass(Boolean(errors.country))}>
                        <Globe className="w-4 h-4 text-[#8B6B38] ml-3.5 shrink-0" aria-hidden="true" />
                        <select
                          id="reg-country"
                          name="country"
                          required
                          aria-invalid={Boolean(errors.country)}
                          value={values.country}
                          onChange={(e) =>
                            updateField((prev) => ({ ...prev, country: e.target.value }))
                          }
                          className="w-full h-full appearance-none bg-transparent pl-3 pr-9 text-sm text-[#24201C] focus:outline-none cursor-pointer"
                        >
                          <option value="">{t('registration.form.countryPlaceholder')}</option>
                          {countryOptions.map((c) => (
                            <option key={c.id} value={c.id}>
                              {t(c.labelKey)}
                            </option>
                          ))}
                        </select>
                        <ChevronDown className="w-4 h-4 text-[#6B6155] absolute right-3 pointer-events-none" />
                      </div>
                      {errors.country && (
                        <p role="alert" className={errorTextClass}>
                          {t(`registration.errors.${errors.country}`)}
                        </p>
                      )}
                    </div>

                    <div>
                      <label htmlFor="reg-city" className={labelClass}>
                        {t('registration.form.cityLabel')}{' '}
                        <span className="text-[#C7473B]" aria-hidden="true">*</span>
                      </label>
                      <div className={inputShellClass(Boolean(errors.city))}>
                        <MapPin className="w-4 h-4 text-[#8B6B38] ml-3.5 shrink-0" aria-hidden="true" />
                        <input
                          id="reg-city"
                          name="city"
                          type="text"
                          required
                          aria-invalid={Boolean(errors.city)}
                          value={values.city}
                          onChange={(e) =>
                            updateField((prev) => ({ ...prev, city: e.target.value }))
                          }
                          placeholder={t('registration.form.cityPlaceholder')}
                          className="w-full h-full bg-transparent px-3 text-sm text-[#24201C] placeholder:text-[#8C8175] focus:outline-none"
                        />
                      </div>
                      {errors.city && (
                        <p role="alert" className={errorTextClass}>
                          {t(`registration.errors.${errors.city}`)}
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Conditional Track Fields */}
                  {(values.registrationType === 'family' || values.registrationType === 'group') && (
                    <div data-testid="conditional-family-group">
                      <label htmlFor="reg-group-members" className={labelClass}>
                        Family / Group Members Names (Optional)
                      </label>
                      <div className={inputShellClass(false)}>
                        <Users className="w-4 h-4 text-[#8B6B38] ml-3.5 shrink-0" aria-hidden="true" />
                        <input
                          id="reg-group-members"
                          type="text"
                          value={values.familyOrGroupMembers ?? ''}
                          onChange={(e) =>
                            updateField((prev) => ({
                              ...prev,
                              familyOrGroupMembers: e.target.value,
                            }))
                          }
                          placeholder="e.g. Lakshmi Devi, Srihari Rao"
                          className="w-full h-full bg-transparent px-3 text-sm text-[#24201C] placeholder:text-[#8C8175] focus:outline-none"
                        />
                      </div>
                    </div>
                  )}

                  {values.registrationType === 'institutional' && (
                    <div
                      data-testid="conditional-institutional"
                      className="grid grid-cols-1 sm:grid-cols-2 gap-3"
                    >
                      <div>
                        <label htmlFor="reg-org-name" className={labelClass}>
                          Institution / Organisation Name
                        </label>
                        <div className={inputShellClass(false)}>
                          <Building2 className="w-4 h-4 text-[#8B6B38] ml-3.5 shrink-0" />
                          <input
                            id="reg-org-name"
                            type="text"
                            value={values.organisationName ?? ''}
                            onChange={(e) =>
                              updateField((prev) => ({
                                ...prev,
                                organisationName: e.target.value,
                              }))
                            }
                            placeholder="University / Cultural Trust"
                            className="w-full h-full bg-transparent px-3 text-sm text-[#24201C] placeholder:text-[#8C8175] focus:outline-none"
                          />
                        </div>
                      </div>
                      <div>
                        <label htmlFor="reg-org-role" className={labelClass}>
                          Representative Role
                        </label>
                        <div className={inputShellClass(false)}>
                          <User className="w-4 h-4 text-[#8B6B38] ml-3.5 shrink-0" />
                          <input
                            id="reg-org-role"
                            type="text"
                            value={values.organisationRole ?? ''}
                            onChange={(e) =>
                              updateField((prev) => ({
                                ...prev,
                                organisationRole: e.target.value,
                              }))
                            }
                            placeholder="Dean / Chapter Chair"
                            className="w-full h-full bg-transparent px-3 text-sm text-[#24201C] placeholder:text-[#8C8175] focus:outline-none"
                          />
                        </div>
                      </div>
                    </div>
                  )}

                  {values.registrationType === 'volunteer' && (
                    <div data-testid="conditional-volunteer">
                      <label htmlFor="reg-vol-skills" className={labelClass}>
                        Seva Skills / Languages Spoken (Optional)
                      </label>
                      <div className={inputShellClass(false)}>
                        <HandHeart className="w-4 h-4 text-[#8B6B38] ml-3.5 shrink-0" />
                        <input
                          id="reg-vol-skills"
                          type="text"
                          value={values.volunteerSkills ?? ''}
                          onChange={(e) =>
                            updateField((prev) => ({ ...prev, volunteerSkills: e.target.value }))
                          }
                          placeholder="e.g. Hospitality, Telugu-English Translation, Media"
                          className="w-full h-full bg-transparent px-3 text-sm text-[#24201C] placeholder:text-[#8C8175] focus:outline-none"
                        />
                      </div>
                    </div>
                  )}

                  {(values.registrationType === 'scholar' ||
                    values.registrationType === 'individual') && (
                    <div data-testid="conditional-parayana">
                      <label htmlFor="reg-parayana-city" className={labelClass}>
                        Local Parayana Host City (Optional)
                      </label>
                      <div className={inputShellClass(false)}>
                        <MapPin className="w-4 h-4 text-[#8B6B38] ml-3.5 shrink-0" />
                        <input
                          id="reg-parayana-city"
                          type="text"
                          value={values.parayanaCity ?? ''}
                          onChange={(e) =>
                            updateField((prev) => ({ ...prev, parayanaCity: e.target.value }))
                          }
                          placeholder="City if organizing or joining regional Parayana"
                          className="w-full h-full bg-transparent px-3 text-sm text-[#24201C] placeholder:text-[#8C8175] focus:outline-none"
                        />
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* STEP 4: EVENTS & CONTRIBUTION */}
              {currentStep === 4 && (
                <div data-testid="reg-step-panel-4" className="space-y-4">
                  <fieldset>
                    <legend className={labelClass}>
                      {t('registration.form.eventsHeading')}{' '}
                      <span className="text-[#C7473B]" aria-hidden="true">*</span>
                    </legend>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-1">
                      {EVENT_SELECTION_OPTIONS.map((opt) => {
                        const checked = values.events[opt.key];
                        const id = `event-${opt.key}`;
                        return (
                          <label
                            key={opt.key}
                            htmlFor={id}
                            className={`flex items-center gap-2.5 p-3 rounded-xl border text-xs font-medium cursor-pointer transition-colors ${
                              checked
                                ? 'border-[#8F6018] bg-[#FFFDF9] text-[#24201C]'
                                : 'border-[#D6C3A5] bg-white/75 text-[#5B5248]'
                            }`}
                          >
                            <input
                              id={id}
                              type="checkbox"
                              checked={checked}
                              onChange={(e) =>
                                updateField((prev) => ({
                                  ...prev,
                                  events: {
                                    ...prev.events,
                                    [opt.key as EventSelectionKey]: e.target.checked,
                                  },
                                }))
                              }
                              className="w-4 h-4 accent-[#8F6018]"
                            />
                            <span>{t(opt.labelKey)}</span>
                          </label>
                        );
                      })}
                    </div>
                    {errors.events && (
                      <p role="alert" className={errorTextClass}>
                        {t(`registration.errors.${errors.events}`)}
                      </p>
                    )}
                  </fieldset>

                  <div ref={donationBoxRef} className="relative space-y-2">
                    <label htmlFor="reg-donation" className={labelClass}>
                      {t('registration.form.donationLabel')}{' '}
                      <span className="text-[#C7473B]" aria-hidden="true">*</span>
                    </label>
                    <div className={inputShellClass(Boolean(errors.donationAmount))}>
                      <span className="pl-3.5 pr-2.5 text-sm font-semibold text-[#8B6B38] border-r border-[#D6C3A5]/80">
                        ₹
                      </span>
                      <input
                        id="reg-donation"
                        name="donationAmount"
                        type="text"
                        inputMode="numeric"
                        required
                        aria-invalid={Boolean(errors.donationAmount)}
                        value={values.donationAmount}
                        onChange={(e) =>
                          updateField((prev) => ({ ...prev, donationAmount: e.target.value }))
                        }
                        placeholder={t('registration.form.donationPlaceholder')}
                        className="w-full h-full bg-transparent px-3 text-sm text-[#24201C] tabular-nums focus:outline-none"
                      />
                    </div>
                    <div className="flex flex-wrap gap-1.5 pt-0.5">
                      {donationAmounts.map((amount) => {
                        const str = String(amount);
                        const active = values.donationAmount.replace(/,/g, '').trim() === str;
                        return (
                          <button
                            key={amount}
                            type="button"
                            onClick={() =>
                              updateField((prev) => ({ ...prev, donationAmount: str }))
                            }
                            className={`px-2.5 py-1.5 rounded-lg text-xs font-semibold tabular-nums transition-colors cursor-pointer ${
                              active
                                ? 'bg-[#8F6018] text-[#FFF6E8]'
                                : 'bg-[#F4E8D3] text-[#24201C] hover:bg-[#F3CD82]/55'
                            }`}
                          >
                            ₹ {formatInrAmount(str)}
                          </button>
                        );
                      })}
                    </div>
                    {errors.donationAmount && (
                      <p role="alert" className={errorTextClass}>
                        {t(`registration.errors.${errors.donationAmount}`)}
                      </p>
                    )}
                  </div>
                </div>
              )}

              {/* STEP 5: ASSISTANCE & NOTES */}
              {currentStep === 5 && (
                <div data-testid="reg-step-panel-5" className="space-y-3">
                  <fieldset>
                    <legend className={labelClass}>{t('registration.form.assistanceHeading')}</legend>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 pt-1">
                      {ASSISTANCE_OPTIONS.map((opt) => {
                        const checked = values.assistance[opt.key];
                        const id = `assist-${opt.key}`;
                        return (
                          <label
                            key={opt.key}
                            htmlFor={id}
                            className={`flex items-center gap-2 p-2.5 rounded-xl border text-xs cursor-pointer ${
                              checked
                                ? 'border-[#8F6018] bg-[#FFFDF9] font-semibold'
                                : 'border-[#D6C3A5] bg-white/75'
                            }`}
                          >
                            <input
                              id={id}
                              type="checkbox"
                              checked={checked}
                              onChange={(e) =>
                                updateField((prev) => ({
                                  ...prev,
                                  assistance: {
                                    ...prev.assistance,
                                    [opt.key as AssistanceKey]: e.target.checked,
                                  },
                                }))
                              }
                              className="w-4 h-4 accent-[#8F6018]"
                            />
                            <span>{t(opt.labelKey)}</span>
                          </label>
                        );
                      })}
                    </div>
                  </fieldset>

                  <div>
                    <label htmlFor="reg-assist-notes" className={labelClass}>
                      Hospitality / Accessibility Notes (Optional)
                    </label>
                    <textarea
                      id="reg-assist-notes"
                      rows={3}
                      value={values.assistanceNotes ?? ''}
                      onChange={(e) =>
                        updateField((prev) => ({ ...prev, assistanceNotes: e.target.value }))
                      }
                      placeholder="4-day international guest hospitality dates, mobility assistance, or seating notes..."
                      className="w-full p-3 rounded-xl border border-[#D6C3A5] bg-white/95 text-xs text-[#24201C] placeholder:text-[#8C8175] focus:outline-none focus:border-[#D6A447]"
                    />
                  </div>
                </div>
              )}

              {/* STEP 6: GOVERNANCE & POLICIES */}
              {currentStep === 6 && (
                <div data-testid="reg-step-panel-6" className="space-y-3">
                  <div className="rounded-xl border border-[#D6A447]/45 bg-[#F4E8D3]/65 p-4 space-y-3">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div className="inline-flex items-center gap-2 text-[11px] font-semibold tracking-[0.08em] uppercase text-[#5C4420]">
                        <ShieldCheck className="w-4 h-4 text-[#B47D27]" aria-hidden="true" />
                        <span>{t('registration.form.governanceHeading')}</span>
                      </div>
                      <button
                        type="button"
                        onClick={() => onOpenPolicy('refund')}
                        className="inline-flex items-center gap-1 text-xs font-medium text-[#8F6018] underline underline-offset-2 cursor-pointer"
                      >
                        <span>{t('registration.form.readRefundLink')}</span>
                        <ArrowUpRight className="w-3.5 h-3.5" />
                      </button>
                    </div>

                    <p className="text-xs leading-relaxed text-[#4F473E]">
                      Contributions support the Aishwarya Sarvahith Foundation Global Mahotsav Secretariat initiatives. Card/UPI processing happens solely on the authorized gateway after you verify your summary.
                    </p>

                    <label className="flex items-start gap-2.5 text-xs text-[#24201C] cursor-pointer pt-1">
                      <input
                        id="reg-consent"
                        type="checkbox"
                        checked={values.consent}
                        aria-required="true"
                        onChange={(e) =>
                          updateField((prev) => ({ ...prev, consent: e.target.checked }))
                        }
                        className="mt-0.5 w-4 h-4 accent-[#8F6018]"
                      />
                      <span>
                        {t('registration.form.consentPrefix')}{' '}
                        <button
                          type="button"
                          onClick={() => onOpenPolicy('terms')}
                          className="font-semibold text-[#8F6018] underline cursor-pointer"
                        >
                          {t('registration.form.termsLink')}
                        </button>
                        ,{' '}
                        <button
                          type="button"
                          onClick={() => onOpenPolicy('privacy')}
                          className="font-semibold text-[#8F6018] underline cursor-pointer"
                        >
                          {t('registration.form.privacyLink')}
                        </button>{' '}
                        {t('registration.form.consentAnd')}{' '}
                        <button
                          type="button"
                          onClick={() => onOpenPolicy('refund')}
                          className="font-semibold text-[#8F6018] underline cursor-pointer"
                        >
                          {t('registration.form.refundLink')}
                        </button>
                        .
                      </span>
                    </label>

                    {errors.consent && (
                      <div
                        role="alert"
                        className="flex items-start gap-2 rounded-lg border border-[#C7473B]/45 bg-[#C7473B]/10 px-3 py-2 text-xs text-[#C7473B]"
                      >
                        <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                        <span>{t(`registration.errors.${errors.consent}`)}</span>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* STEP 7: FULL STRUCTURED REVIEW WITH SECTION EDIT JUMPS */}
              {currentStep === 7 && (
                <div data-testid="reg-step-panel-7" className="space-y-2.5 text-xs">
                  <div className="rounded-xl border border-[#D6C3A5] bg-white/90 divide-y divide-[#D6C3A5]/60">
                    <div className="p-3 flex items-center justify-between gap-3">
                      <div>
                        <p className="text-[10px] uppercase tracking-wider text-[#8F6018] font-semibold">
                          Language &amp; Category
                        </p>
                        <p className="font-medium text-[#24201C]">
                          {(values.preferredLanguage || 'en').toUpperCase()} ·{' '}
                          {regTypeOption ? t(regTypeOption.labelKey) : values.registrationType}
                        </p>
                      </div>
                      <button
                        type="button"
                        data-testid="review-edit-step-2"
                        onClick={() => onStepChange(2)}
                        className="inline-flex items-center gap-1 text-[11px] font-semibold text-[#8F6018] hover:underline cursor-pointer"
                      >
                        <Edit3 className="w-3 h-3" /> Edit
                      </button>
                    </div>

                    <div className="p-3 flex items-center justify-between gap-3">
                      <div>
                        <p className="text-[10px] uppercase tracking-wider text-[#8F6018] font-semibold">
                          Participant &amp; Location
                        </p>
                        <p className="font-semibold text-[#24201C]">
                          {values.fullName} ({values.noOfPersons}{' '}
                          {Number(values.noOfPersons) === 1 ? 'person' : 'persons'})
                        </p>
                        <p className="text-[#5B5248]">
                          {values.email} · {values.phone} · {values.city},{' '}
                          {countryOption ? t(countryOption.labelKey) : values.country}
                        </p>
                      </div>
                      <button
                        type="button"
                        data-testid="review-edit-step-3"
                        onClick={() => onStepChange(3)}
                        className="inline-flex items-center gap-1 text-[11px] font-semibold text-[#8F6018] hover:underline cursor-pointer"
                      >
                        <Edit3 className="w-3 h-3" /> Edit
                      </button>
                    </div>

                    <div className="p-3 flex items-center justify-between gap-3">
                      <div>
                        <p className="text-[10px] uppercase tracking-wider text-[#8F6018] font-semibold">
                          Events &amp; Contribution
                        </p>
                        <p className="font-medium text-[#24201C]">
                          {selectedEvents.join(', ')} — ₹ {formatInrAmount(values.donationAmount)}
                        </p>
                      </div>
                      <button
                        type="button"
                        data-testid="review-edit-step-4"
                        onClick={() => onStepChange(4)}
                        className="inline-flex items-center gap-1 text-[11px] font-semibold text-[#8F6018] hover:underline cursor-pointer"
                      >
                        <Edit3 className="w-3 h-3" /> Edit
                      </button>
                    </div>

                    <div className="p-3 flex items-center justify-between gap-3">
                      <div>
                        <p className="text-[10px] uppercase tracking-wider text-[#8F6018] font-semibold">
                          Assistance &amp; Notes
                        </p>
                        <p className="text-[#5B5248]">
                          {selectedAssistance.length > 0
                            ? selectedAssistance.join(', ')
                            : 'None requested'}
                          {values.assistanceNotes ? ` — ${values.assistanceNotes}` : ''}
                        </p>
                      </div>
                      <button
                        type="button"
                        data-testid="review-edit-step-5"
                        onClick={() => onStepChange(5)}
                        className="inline-flex items-center gap-1 text-[11px] font-semibold text-[#8F6018] hover:underline cursor-pointer"
                      >
                        <Edit3 className="w-3 h-3" /> Edit
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* STEP 8: CONFIRMATION & MANUAL MAKE PAYMENT CTA */}
              {currentStep === 8 && (
                <div data-testid="reg-step-panel-8" className="space-y-3.5">
                  {!confirmed ? (
                    <div className="rounded-xl border border-[#D6A447]/60 bg-[#F4E8D3]/70 p-4 space-y-3 text-center">
                      <Sparkles className="w-5 h-5 text-[#8F6018] mx-auto" aria-hidden="true" />
                      <h3 className="font-editorial text-xl text-[#24201C]">
                        Ready for Final Verification
                      </h3>
                      <p className="text-xs text-[#5B5248] max-w-md mx-auto">
                        Confirm your registration dossier for{' '}
                        <strong>{values.fullName || 'Participant'}</strong> (₹{' '}
                        {formatInrAmount(values.donationAmount || '0')}) to unlock manual checkout.
                      </p>
                      <button
                        type="button"
                        data-testid="confirm-my-details-btn"
                        onClick={handleConfirmMyDetails}
                        className="min-h-[42px] px-6 py-2 rounded-full bg-[#17233A] text-[#F7D774] text-xs font-semibold uppercase tracking-[0.12em] hover:bg-[#223456] transition-colors cursor-pointer"
                      >
                        Confirm My Details
                      </button>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      <div
                        data-testid="golden-confirmation-banner"
                        className="rounded-xl border-2 border-[#D4A537] bg-gradient-to-r from-[#FFFDF7] via-[#F9ECCF] to-[#FFFDF7] p-3.5 flex items-start gap-3 shadow-sm"
                      >
                        <CheckCircle2 className="w-5 h-5 text-[#2E6F40] shrink-0 mt-0.5" />
                        <div className="text-xs space-y-0.5">
                          <p className="font-semibold uppercase tracking-[0.1em] text-[#8F6018]">
                            Details Confirmed &amp; Validated
                          </p>
                          <p className="text-[#24201C]">
                            {values.fullName} · {values.email} · {selectedEvents.join(' & ')} · ₹{' '}
                            {formatInrAmount(values.donationAmount)}
                          </p>
                        </div>
                      </div>

                      {!pointerDismissed && (
                        <div
                          data-testid="make-payment-pointer"
                          className="flex flex-col items-center text-[#8F6018] animate-bounce pt-1"
                        >
                          <span className="text-[10.5px] font-semibold uppercase tracking-[0.14em]">
                            Click Below to Continue
                          </span>
                          <ArrowDown className="w-4 h-4 mt-0.5" aria-hidden="true" />
                        </div>
                      )}

                      <button
                        type="submit"
                        data-testid="registration-make-payment"
                        className="group relative w-full min-h-[46px] px-6 py-2.5 rounded-full bg-gradient-to-r from-[#D6A447] via-[#B47D27] to-[#8C5B14] text-[#FFF6E8] text-xs sm:text-[13px] font-semibold tracking-[0.1em] uppercase shadow-[0_10px_28px_rgba(143,96,24,0.34)] hover:brightness-105 transition-all flex items-center justify-center gap-2.5 cursor-pointer"
                      >
                        <CreditCard className="w-4 h-4 text-[#FFF6E8]" aria-hidden="true" />
                        <span>{t('registration.form.makePayment')}</span>
                        <ArrowRight className="w-4 h-4 text-[#FFF6E8] group-hover:translate-x-1 transition-transform" />
                      </button>

                      <p className="flex items-center justify-center gap-1.5 text-[10.5px] text-[#5B5248] text-center">
                        <Lock className="w-3 h-3 text-[#8B6B38] shrink-0" aria-hidden="true" />
                        <span>{t('registration.form.receiptNote')}</span>
                      </p>
                    </div>
                  )}
                </div>
              )}

              {/* Bottom Stepper Navigation Controls */}
              <div className="pt-2 border-t border-[#D6A447]/30 flex items-center justify-between gap-3">
                {currentStep > 1 ? (
                  <button
                    type="button"
                    data-testid="reg-prev-btn"
                    onClick={handlePreviousStep}
                    className="inline-flex items-center gap-1.5 min-h-[38px] px-4 rounded-full border border-[#D6A447]/65 text-xs font-semibold text-[#24201C] hover:bg-[#F4E8D3] cursor-pointer"
                  >
                    <ArrowLeft className="w-3.5 h-3.5" aria-hidden="true" />
                    <span>Previous</span>
                  </button>
                ) : (
                  <span />
                )}

                <div className="flex items-center gap-2">
                  {currentStep === 5 && (
                    <button
                      type="button"
                      data-testid="reg-skip-btn"
                      onClick={handleSkipStep}
                      className="min-h-[38px] px-4 rounded-full border border-[#D6C3A5] text-xs font-medium text-[#5B5248] hover:text-[#24201C] cursor-pointer"
                    >
                      Skip
                    </button>
                  )}

                  {currentStep < 8 && (
                    <button
                      type="button"
                      data-testid="reg-next-btn"
                      onClick={handleNextStep}
                      className="inline-flex items-center gap-1.5 min-h-[38px] px-5 rounded-full bg-gradient-to-r from-[#D4A537] to-[#9C6B1E] text-[#FFFDF7] text-xs font-semibold uppercase tracking-[0.08em] hover:brightness-105 cursor-pointer"
                    >
                      <span>{currentStep === 7 ? 'Proceed to Confirm' : 'Continue'}</span>
                      <ArrowRight className="w-3.5 h-3.5" aria-hidden="true" />
                    </button>
                  )}
                </div>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};
