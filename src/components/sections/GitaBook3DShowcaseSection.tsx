import React, { Suspense, lazy, useRef } from 'react';
import { ArrowRight, BookOpen, Sparkles } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useI18n } from '../../i18n';
import { useNearViewport } from '../../hooks/useNearViewport';

const LazyInteractiveGitaBook3D = lazy(() =>
  import('../scripture/InteractiveGitaBook3D').then((m) => ({
    default: m.InteractiveGitaBook3D,
  })),
);

interface GitaBook3DShowcaseSectionProps {
  suspended?: boolean;
}

const BookShowcasePlaceholder: React.FC = () => (
  <div className="h-[460px] rounded-2xl border border-[#C9A04E]/35 bg-[#17233A] text-[#F0D38B] flex flex-col items-center justify-center gap-3">
    <div className="w-8 h-8 rounded-full border-2 border-[#C9A04E]/40 border-t-[#F0D38B] animate-spin" />
    <p className="text-xs tracking-[0.16em] uppercase">
      Preparing 3D Sacred Gita Collector Edition…
    </p>
  </div>
);

export const GitaBook3DShowcaseSection: React.FC<GitaBook3DShowcaseSectionProps> = ({
  suspended = false,
}) => {
  const { t } = useI18n();
  const sectionRef = useRef<HTMLElement | null>(null);
  const { hasEnteredViewport, isVisible } = useNearViewport(
    sectionRef,
    '550px 0px',
    suspended,
  );
  const shouldMount3D = !suspended && hasEnteredViewport;

  return (
    <section
      ref={sectionRef}
      id="gita-3d-book"
      aria-labelledby="gita-3d-book-heading"
      className="py-16 sm:py-24 bg-[var(--surface-elevated)] text-[var(--color-ink)] border-t border-[var(--color-border)]"
    >
      <div className="max-w-[1360px] mx-auto px-5 sm:px-8 lg:px-12 space-y-8">
        <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-6 pb-6 border-b border-[var(--color-border)]">
          <div className="space-y-3 max-w-2xl">
            <div className="flex items-center gap-2 text-[11px] font-semibold tracking-[0.2em] uppercase text-[var(--color-bronze)]">
              <Sparkles className="w-3.5 h-3.5" aria-hidden="true" />
              <span>Interactive 3D Sacred Collector Edition</span>
            </div>
            <h2
              id="gita-3d-book-heading"
              className="font-editorial text-3xl sm:text-4xl font-normal text-[var(--color-ink)]"
            >
              Experience the Living 3D Bhagavad Gita
            </h2>
            <p className="text-sm sm:text-base text-[var(--color-muted)] leading-relaxed">
              Turn sculpted parchment folios, inspect the Royal Gold lotus binding from 360 degrees, switch effortlessly between Sanskrit, Telugu, Hindi, and English, and listen with the Indian Voice Assistant.
            </p>
          </div>

          <Link
            to="/gita"
            className="inline-flex items-center gap-2.5 min-h-[44px] px-6 py-2.5 rounded-full royal-gold-surface text-xs font-semibold tracking-[0.06em] uppercase hover:brightness-105 transition-all shrink-0 self-start lg:self-auto"
          >
            <BookOpen className="w-4 h-4" aria-hidden="true" />
            <span>{t('chapters.allChaptersLink')} & Voice Reader</span>
            <ArrowRight className="w-4 h-4" aria-hidden="true" />
          </Link>
        </div>

        {shouldMount3D ? (
          <Suspense fallback={<BookShowcasePlaceholder />}>
            <LazyInteractiveGitaBook3D initialChapter={2} paused={!isVisible} />
          </Suspense>
        ) : (
          <BookShowcasePlaceholder />
        )}
      </div>
    </section>
  );
};
