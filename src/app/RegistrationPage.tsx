import React, { useEffect, useRef, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { ensureGsapRegistered, gsap, prefersReducedMotion } from '../animations/gsapSetup';
import { ASSET_MANIFEST } from '../assets/assetManifest';
import { Header } from '../components/layout/Header';
import { InstitutionalNoticeModal, type NoticeKind } from '../components/layout/InstitutionalNoticeModal';
import { DevotionalArtworkPanel } from '../components/registration/DevotionalArtworkPanel';
import { CheckoutExperience } from '../components/payment/CheckoutExperience';
import { RegistrationFormCard } from '../components/registration/RegistrationFormCard';
import { useI18n } from '../i18n';
import type { CoreLocale } from '../utils/i18nHelpers';
import { parseRegistrationTypeParam } from '../utils/navigationAndRoutes';
import {
  INITIAL_REGISTRATION_VALUES,
  loadRegistrationDraft,
  saveRegistrationDraft,
  type RegistrationFormValues,
  type RegistrationStepNumber,
} from '../utils/registrationValidation';

export const RegistrationPage: React.FC = () => {
  const { t, contentLocale } = useI18n();
  const location = useLocation();
  const initialRegistrationType = parseRegistrationTypeParam(location.search);
  const pageRef = useRef<HTMLDivElement | null>(null);
  const bgLayerRef = useRef<HTMLDivElement | null>(null);
  const fullNameInputRef = useRef<HTMLInputElement | null>(null);

  const [bgError, setBgError] = useState(false);
  const [activePolicy, setActivePolicy] = useState<NoticeKind>(null);
  const [handoffValues, setHandoffValues] = useState<RegistrationFormValues | null>(null);

  const [values, setValues] = useState<RegistrationFormValues>(() => {
    const draft = loadRegistrationDraft() ?? INITIAL_REGISTRATION_VALUES;
    return initialRegistrationType
      ? { ...draft, registrationType: initialRegistrationType }
      : draft;
  });
  const [currentStep, setCurrentStep] = useState<RegistrationStepNumber>(() =>
    initialRegistrationType ? 3 : 1,
  );
  const [highestReachedStep, setHighestReachedStep] = useState<RegistrationStepNumber>(() =>
    initialRegistrationType ? 3 : 1,
  );
  const [confirmed, setConfirmed] = useState(false);
  const [voiceLocale, setVoiceLocale] = useState<CoreLocale>(contentLocale);

  const desktopBg = ASSET_MANIFEST.visualStudies.registrationSanctumBg;

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'auto' });
  }, []);

  useEffect(() => {
    if (initialRegistrationType) {
      setValues((prev) =>
        prev.registrationType === initialRegistrationType
          ? prev
          : { ...prev, registrationType: initialRegistrationType },
      );
      setCurrentStep(3);
      setHighestReachedStep((prev) => (prev < 3 ? 3 : prev));
    }
  }, [initialRegistrationType]);

  useEffect(() => {
    saveRegistrationDraft(values);
  }, [values]);

  useEffect(() => {
    const container = pageRef.current;
    if (!container || prefersReducedMotion()) return;
    ensureGsapRegistered();

    const ctx = gsap.context(() => {
      if (bgLayerRef.current) {
        gsap.fromTo(
          bgLayerRef.current,
          { opacity: 0.72, scale: 1.02 },
          { opacity: 1, scale: 1, duration: 0.9, ease: 'power2.out', clearProps: 'transform,opacity' },
        );
      }
      gsap.fromTo(
        '[data-reg-hero-reveal]',
        { y: 12, opacity: 0.25 },
        {
          y: 0,
          opacity: 1,
          duration: 0.65,
          stagger: 0.08,
          ease: 'power3.out',
          clearProps: 'transform,opacity',
        },
      );
      gsap.fromTo(
        '[data-reg-card-reveal]',
        { y: 16, opacity: 0.35 },
        {
          y: 0,
          opacity: 1,
          duration: 0.72,
          delay: 0.1,
          ease: 'power3.out',
          clearProps: 'transform,opacity',
        },
      );
    }, container);

    return () => ctx.revert();
  }, []);

  const handleStepChange = (next: RegistrationStepNumber) => {
    setCurrentStep(next);
    setHighestReachedStep((prev) => (next > prev ? next : prev));
  };

  return (
    <div
      ref={pageRef}
      className="min-h-screen flex flex-col bg-[#101426] text-[#FFF6E8] selection:bg-[#D6A447]/35 selection:text-[#FFF6E8]"
    >
      <Header variant="registration" />

      <main className="relative flex-1 flex flex-col justify-center overflow-x-clip">
        <div
          ref={bgLayerRef}
          aria-hidden="true"
          className="hidden lg:block fixed inset-0 top-[62px] pointer-events-none select-none overflow-hidden z-0"
        >
          {!bgError && (
            <img
              src={desktopBg.src}
              alt={t(desktopBg.altKey)}
              decoding="async"
              fetchPriority="high"
              referrerPolicy="no-referrer"
              onError={() => setBgError(true)}
              className="w-full h-full object-cover object-[28%_center] xl:object-center"
            />
          )}
          <div
            className="absolute inset-0"
            style={{
              background:
                'linear-gradient(180deg, rgba(16, 20, 38, 0.28) 0%, rgba(16, 20, 38, 0.08) 38%, rgba(16, 20, 38, 0.56) 100%)',
            }}
          />
          <div
            className="absolute inset-y-0 right-0 w-[56%]"
            style={{
              background:
                'linear-gradient(90deg, rgba(16, 20, 38, 0) 0%, rgba(32, 43, 72, 0.28) 45%, rgba(16, 20, 38, 0.48) 100%)',
            }}
          />
        </div>

        <section
          aria-label={t('registration.form.heading')}
          className="relative z-10 w-full max-w-[1440px] mx-auto lg:px-10 xl:px-12 pb-8 lg:py-3 flex flex-col lg:flex-row items-stretch lg:items-center gap-4 lg:gap-8"
        >
          <DevotionalArtworkPanel />

          <div className="px-4 sm:px-8 lg:px-0 lg:contents">
            <RegistrationFormCard
              fullNameInputRef={fullNameInputRef}
              values={values}
              currentStep={currentStep}
              highestReachedStep={highestReachedStep}
              confirmed={confirmed}
              voiceLocale={voiceLocale}
              onVoiceLocaleChange={setVoiceLocale}
              onValuesChange={setValues}
              onStepChange={handleStepChange}
              onConfirmChange={setConfirmed}
              onOpenPolicy={(kind) => setActivePolicy(kind)}
              onValidatedSubmit={(validated) => setHandoffValues(validated)}
            />
          </div>
        </section>
      </main>

      <InstitutionalNoticeModal
        activeNotice={activePolicy}
        onClose={() => setActivePolicy(null)}
      />

      <CheckoutExperience
        isOpen={handoffValues !== null}
        values={handoffValues ?? INITIAL_REGISTRATION_VALUES}
        onClose={() => setHandoffValues(null)}
      />
    </div>
  );
};
