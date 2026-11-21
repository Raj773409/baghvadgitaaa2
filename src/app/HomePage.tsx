import React, { Suspense, lazy, useCallback, useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { ensureGsapRegistered, ScrollTrigger } from '../animations/gsapSetup';
import { Header } from '../components/layout/Header';
import { Footer } from '../components/layout/Footer';
import { Hero } from '../components/Hero';
import { SectionProgressIndicator } from '../components/hero/SectionProgressIndicator';
import { EventCountdown } from '../components/sections/EventCountdown';
import { EventIntroduction } from '../components/sections/EventIntroduction';
import { WhyParticipateSection } from '../components/sections/WhyParticipateSection';
import { EternalMessage } from '../components/sections/EternalMessage';
import { GitaBook3DShowcaseSection } from '../components/sections/GitaBook3DShowcaseSection';
import { ChapterExplorer } from '../components/sections/ChapterExplorer';
import { GlobalJourney } from '../components/sections/GlobalJourney';
import { EventTimeline } from '../components/sections/EventTimeline';
import { LeadershipSection } from '../components/sections/LeadershipSection';
import { PartnershipSection } from '../components/sections/PartnershipSection';
import { CulturalGallerySection } from '../components/sections/CulturalGallerySection';
import { MediaSection } from '../components/sections/MediaSection';
import { BePartOfGlobalMovementSection } from '../components/sections/BePartOfGlobalMovementSection';
import { ParticipationSection } from '../components/sections/ParticipationSection';
import {
  REPLAY_WELCOME_EVENT,
  shouldShowWelcomeOnLoad,
  WELCOME_SESSION_SEEN_KEY,
  WELCOME_VISITED_STORAGE_KEY,
} from '../utils/welcomeExperience';
import { mapPublicMediaToArtwork, usePublicCms } from '../hooks/usePublicCms';

const WelcomeExperience = lazy(
  () => import('../components/welcome/WelcomeExperience'),
);

export const HomePage: React.FC = () => {
  const location = useLocation();
  const publicCms = usePublicCms();
  const publishedArtworks = publicCms ? mapPublicMediaToArtwork(publicCms.media) : [];
  const [welcomeOpen, setWelcomeOpen] = useState<boolean>(() => {
    if (typeof window === 'undefined') return false;
    let sessionSeen = false;
    let localVisited = false;
    try {
      sessionSeen = window.sessionStorage.getItem(WELCOME_SESSION_SEEN_KEY) === '1';
      localVisited = window.localStorage.getItem(WELCOME_VISITED_STORAGE_KEY) === '1';
    } catch {
      // Ignore storage access errors
    }
    return shouldShowWelcomeOnLoad({
      sessionSeen,
      localVisited,
      search: window.location.search,
    });
  });

  const handleWelcomeComplete = useCallback(() => {
    try {
      window.sessionStorage.setItem(WELCOME_SESSION_SEEN_KEY, '1');
      window.localStorage.setItem(WELCOME_VISITED_STORAGE_KEY, '1');
    } catch {
      // Ignore storage restrictions
    }
    setWelcomeOpen(false);
  }, []);

  useEffect(() => {
    const onReplay = () => {
      window.scrollTo({ top: 0, behavior: 'auto' });
      setWelcomeOpen(true);
    };
    window.addEventListener(REPLAY_WELCOME_EVENT, onReplay);
    return () => window.removeEventListener(REPLAY_WELCOME_EVENT, onReplay);
  }, []);

  useEffect(() => {
    if (!welcomeOpen) return;
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = prevOverflow;
    };
  }, [welcomeOpen]);

  useEffect(() => {
    if (location.hash) {
      const targetId = location.hash.slice(1);
      const targetEl = document.getElementById(targetId);
      if (targetEl) {
        window.requestAnimationFrame(() => {
          targetEl.scrollIntoView({ behavior: 'smooth', block: 'start' });
        });
      }
    }
  }, [location.hash]);

  useEffect(() => {
    const root = document.documentElement;
    root.classList.add('home-scroll-snap');
    return () => {
      root.classList.remove('home-scroll-snap');
    };
  }, []);

  useEffect(() => {
    ensureGsapRegistered();
    let cancelled = false;

    const refresh = () => {
      if (!cancelled) {
        ScrollTrigger.refresh();
      }
    };

    if (document.fonts?.ready) {
      void document.fonts.ready.then(refresh);
    }

    window.addEventListener('load', refresh, { once: true });
    return () => {
      cancelled = true;
      window.removeEventListener('load', refresh);
    };
  }, []);

  return (
    <div className="min-h-screen flex flex-col bg-[var(--color-canvas)] text-[var(--color-ink)]">
      {welcomeOpen && (
        <Suspense fallback={null}>
          <WelcomeExperience onComplete={handleWelcomeComplete} />
        </Suspense>
      )}

      <Header variant="transparent-hero" />
      <SectionProgressIndicator />

      <main id="main-content" className="flex-1">
        {/* 1. Event-first cinematic hero with Devotional Carousel & CTAs */}
        <Hero suspended={welcomeOpen} />
        {/* 1b. Live Countdown to 20 Dec 2026 Curtain Raiser & 27 Feb 2027 Main Mahotsav */}
        <EventCountdown />
        {/* 2. Event introduction & institutional scale */}
        <EventIntroduction />
        {/* 2b. Why Participate in the Mahotsav (9 reasons + Canonical Shloka Reader) */}
        <WhyParticipateSection />
        {/* 3. The Eternal Message */}
        <EternalMessage />
        {/* 3b. Interactive 3D Bhagavad Gita Collector Edition Showcase */}
        <GitaBook3DShowcaseSection suspended={welcomeOpen} />
        {/* 4. 18 Chapters interactive explorer */}
        <ChapterExplorer />
        {/* 5. Global Journey */}
        <GlobalJourney suspended3D={welcomeOpen} />
        {/* 6. Event timeline */}
        <EventTimeline />
        {/* 7. Leadership and institutional overview */}
        <LeadershipSection />
        {/* 8. Partnerships */}
        <PartnershipSection />
        {/* 8b. Curated Cultural & Spiritual Heritage Visual Library */}
        <CulturalGallerySection extraItems={publishedArtworks} />
        {/* 9. Media preview */}
        <MediaSection />
        {/* 9b. Be Part of the Global Movement (All 10 Pathways + Inline Volunteer Desk) */}
        <BePartOfGlobalMovementSection />
        {/* 10. Participation CTA */}
        <ParticipationSection />
      </main>

      {/* 11. Footer */}
      <Footer />
    </div>
  );
};
