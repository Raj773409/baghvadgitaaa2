import React, { Suspense, lazy, useEffect } from 'react';
import { BrowserRouter, Route, Routes, useLocation } from 'react-router-dom';
import { HomePage } from './HomePage';
import { RegistrationPage } from './RegistrationPage';
import { AboutPage } from './pages/AboutPage';
import { GitaPage } from './pages/GitaPage';
import { GlobalJourneyPage } from './pages/GlobalJourneyPage';
import { ProgramPage } from './pages/ProgramPage';
import { ParticipationHubPage } from './pages/ParticipationHubPage';
import { LeadershipPage } from './pages/LeadershipPage';
import { PartnersPage } from './pages/PartnersPage';
import { MediaPage } from './pages/MediaPage';
import { ContactFaqPage } from './pages/ContactFaqPage';
import { PolicyPage } from './pages/PolicyPage';
import { NotFoundPage } from './pages/NotFoundPage';

const StoryPage = lazy(() => import('./pages/StoryPage'));
const AdminPage = lazy(() => import('./pages/AdminPage'));
const AdminLoginPage = lazy(() => import('./pages/AdminLoginPage'));
const AdminAccessDeniedPage = lazy(() => import('./pages/AdminAccessDeniedPage'));

const StoryRouteFallback: React.FC = () => (
  <div
    className="min-h-screen bg-[#0D1120] text-[#FFF6E8] flex flex-col items-center justify-center px-6"
    role="status"
    aria-live="polite"
  >
    <div className="w-9 h-9 rounded-full border border-[#F3CD82]/40 border-t-[#F3CD82] animate-spin mb-4" />
    <p className="font-display text-lg tracking-wide text-[#FFF6E8]/90">
      Loading the Interactive Gita Story…
    </p>
  </div>
);

const AdminRouteFallback: React.FC = () => (
  <div
    className="min-h-screen bg-[#0D1120] text-[#FFFDF7] flex flex-col items-center justify-center px-6"
    role="status"
    aria-live="polite"
  >
    <div className="w-9 h-9 rounded-full border border-[#F7D774]/40 border-t-[#F7D774] animate-spin mb-4" />
    <p className="font-editorial text-lg tracking-wide text-[#F7D774]">
      Loading Secretariat Command Centre…
    </p>
  </div>
);

const ScrollManager: React.FC = () => {
  const { pathname, hash } = useLocation();

  useEffect(() => {
    if (hash) {
      const target = document.getElementById(hash.slice(1));
      if (target) {
        window.requestAnimationFrame(() => {
          target.scrollIntoView({ behavior: 'smooth', block: 'start' });
        });
        return;
      }
    }
    window.scrollTo({ top: 0, behavior: 'auto' });
  }, [pathname, hash]);

  return null;
};

export const AppRoutes: React.FC = () => {
  return (
    <BrowserRouter>
      <ScrollManager />
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/about" element={<AboutPage />} />
        <Route path="/mahotsav" element={<AboutPage />} />
        <Route path="/gita" element={<GitaPage />} />
        <Route
          path="/story"
          element={
            <Suspense fallback={<StoryRouteFallback />}>
              <StoryPage />
            </Suspense>
          }
        />
        <Route path="/global-journey" element={<GlobalJourneyPage />} />
        <Route path="/global-journey/18-countries" element={<GlobalJourneyPage />} />
        <Route path="/program" element={<ProgramPage />} />
        <Route path="/programme" element={<ProgramPage />} />
        <Route path="/participate" element={<ParticipationHubPage />} />
        <Route path="/participate/register" element={<RegistrationPage />} />
        <Route path="/register" element={<RegistrationPage />} />
        <Route path="/leadership" element={<LeadershipPage />} />
        <Route path="/partners" element={<PartnersPage />} />
        <Route path="/media" element={<MediaPage />} />
        <Route path="/media/upcoming" element={<MediaPage />} />
        <Route path="/contact" element={<ContactFaqPage />} />
        <Route path="/connect" element={<ContactFaqPage />} />
        <Route path="/faqs" element={<ContactFaqPage />} />
        <Route path="/privacy-policy" element={<PolicyPage policyId="privacy" />} />
        <Route path="/terms-conditions" element={<PolicyPage policyId="terms" />} />
        <Route path="/terms" element={<PolicyPage policyId="terms" />} />
        <Route path="/cancellation-refund-policy" element={<PolicyPage policyId="refund" />} />
        <Route path="/refund-policy" element={<PolicyPage policyId="refund" />} />
        <Route
          path="/admin/login"
          element={
            <Suspense fallback={<AdminRouteFallback />}>
              <AdminLoginPage />
            </Suspense>
          }
        />
        <Route
          path="/admin/access-denied"
          element={
            <Suspense fallback={<AdminRouteFallback />}>
              <AdminAccessDeniedPage />
            </Suspense>
          }
        />
        <Route
          path="/admin"
          element={
            <Suspense fallback={<AdminRouteFallback />}>
              <AdminPage />
            </Suspense>
          }
        />
        <Route
          path="/admin/*"
          element={
            <Suspense fallback={<AdminRouteFallback />}>
              <AdminPage />
            </Suspense>
          }
        />
        <Route path="*" element={<NotFoundPage />} />
      </Routes>
    </BrowserRouter>
  );
};
