import React from 'react';
import { Check } from 'lucide-react';
import type { CoreLocale } from '../../utils/i18nHelpers';
import {
  REGISTRATION_STEPS,
  type RegistrationStepNumber,
} from '../../utils/registrationValidation';

interface RegistrationStepIndicatorProps {
  currentStep: RegistrationStepNumber;
  highestReachedStep: RegistrationStepNumber;
  locale: CoreLocale;
  onSelectStep: (step: RegistrationStepNumber) => void;
}

const STEP_LABELS: Record<RegistrationStepNumber, Record<CoreLocale, string>> = {
  1: { en: 'Language', hi: 'भाषा', te: 'భాష' },
  2: { en: 'Category', hi: 'श्रेणी', te: 'విభాగం' },
  3: { en: 'Details', hi: 'विवरण', te: 'వివరాలు' },
  4: { en: 'Events', hi: 'आयोजन', te: 'కార్యక్రమాలు' },
  5: { en: 'Assistance', hi: 'सहायता', te: 'సహాయం' },
  6: { en: 'Policies', hi: 'नीतियाँ', te: 'నిబంధనలు' },
  7: { en: 'Review', hi: 'समीक्षा', te: 'సమీక్ష' },
  8: { en: 'Confirm', hi: 'पुष्टि', te: 'నిర్ధారణ' },
};

export const RegistrationStepIndicator: React.FC<RegistrationStepIndicatorProps> = ({
  currentStep,
  highestReachedStep,
  locale,
  onSelectStep,
}) => {
  return (
    <nav
      aria-label="Registration steps"
      data-testid="registration-step-indicator"
      className="mb-3.5"
    >
      <div className="flex items-center justify-between text-[10.5px] font-semibold uppercase tracking-[0.12em] text-[#8F6018] mb-2">
        <span>
          {locale === 'hi'
            ? `चरण ${currentStep} / 8`
            : locale === 'te'
              ? `దశ ${currentStep} / 8`
              : `Step ${currentStep} of 8`}
        </span>
        <span className="text-[#5B5248] font-medium normal-case tracking-normal">
          {STEP_LABELS[currentStep][locale]}
        </span>
      </div>

      <ol className="grid grid-cols-8 gap-1">
        {REGISTRATION_STEPS.map(({ step }) => {
          const isActive = step === currentStep;
          const isCompleted = step < currentStep;
          const isReachable = step <= highestReachedStep;
          const label = STEP_LABELS[step][locale];

          return (
            <li key={step} className="min-w-0">
              <button
                type="button"
                disabled={!isReachable}
                data-testid={`reg-step-tab-${step}`}
                aria-current={isActive ? 'step' : undefined}
                aria-label={`Step ${step}: ${label}`}
                onClick={() => isReachable && onSelectStep(step)}
                className={`w-full flex flex-col items-center gap-1 py-1 px-0.5 rounded-lg transition-all ${
                  isReachable ? 'cursor-pointer' : 'cursor-not-allowed opacity-55'
                }`}
              >
                <span
                  className={`w-full h-1.5 rounded-full transition-colors ${
                    isActive
                      ? 'bg-gradient-to-r from-[#C9A04E] to-[#8F6018]'
                      : isCompleted
                        ? 'bg-[#2E6F40]'
                        : 'bg-[#D6C3A5]/70'
                  }`}
                />
                <span className="hidden sm:inline-flex items-center gap-0.5 text-[9.5px] font-semibold tracking-tight truncate max-w-full">
                  {isCompleted ? (
                    <Check className="w-2.5 h-2.5 text-[#2E6F40] shrink-0" aria-hidden="true" />
                  ) : null}
                  <span
                    className={
                      isActive
                        ? 'text-[#8F6018]'
                        : isCompleted
                          ? 'text-[#1B4A28]'
                          : 'text-[#6B6155]'
                    }
                  >
                    {label}
                  </span>
                </span>
              </button>
            </li>
          );
        })}
      </ol>
    </nav>
  );
};
