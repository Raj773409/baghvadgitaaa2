import React, { useEffect, useState } from 'react';
import { HERO_PROGRESS_SECTIONS } from '../../content/navigationContent';
import { useI18n } from '../../i18n';
import { prefersReducedMotion } from '../../animations/gsapSetup';

export const SectionProgressIndicator: React.FC = () => {
  const { t } = useI18n();
  const [activeIndex, setActiveIndex] = useState(0);

  useEffect(() => {
    const updateActiveFromScroll = () => {
      const markerY = window.scrollY + window.innerHeight * 0.42;
      let current = 0;
      for (let i = 0; i < HERO_PROGRESS_SECTIONS.length; i++) {
        const el = document.getElementById(HERO_PROGRESS_SECTIONS[i].id);
        if (!el) continue;
        if (el.offsetTop <= markerY) {
          current = i;
        }
      }
      setActiveIndex(current);
    };

    updateActiveFromScroll();
    window.addEventListener('scroll', updateActiveFromScroll, { passive: true });
    window.addEventListener('resize', updateActiveFromScroll, { passive: true });

    return () => {
      window.removeEventListener('scroll', updateActiveFromScroll);
      window.removeEventListener('resize', updateActiveFromScroll);
    };
  }, []);

  const handleJump = (
    event: React.MouseEvent<HTMLAnchorElement>,
    sectionId: string,
    index: number,
  ) => {
    const targetEl = document.getElementById(sectionId);
    if (!targetEl) return;
    event.preventDefault();
    setActiveIndex(index);
    targetEl.scrollIntoView({
      behavior: prefersReducedMotion() ? 'auto' : 'smooth',
      block: 'start',
    });
    if (window.location.hash !== `#${sectionId}`) {
      window.history.replaceState(null, '', `#${sectionId}`);
    }
  };

  const currentTone = HERO_PROGRESS_SECTIONS[activeIndex]?.tone ?? 'dark';
  const isLightSection = currentTone === 'light';
  const totalSections = HERO_PROGRESS_SECTIONS.length;
  const progressPct =
    totalSections > 1 ? Math.round((activeIndex / (totalSections - 1)) * 100) : 0;

  const shellSurface = isLightSection
    ? 'bg-[#FAF7F2]/88 border-[#101426]/12 shadow-[0_8px_24px_rgba(16,20,38,0.08)]'
    : 'bg-[#101426]/70 border-[#F3CD82]/22 shadow-[0_8px_24px_rgba(0,0,0,0.28)]';
  const counterColor = isLightSection ? 'text-[#101426]/85' : 'text-[#FFF6E8]/90';
  const trackBg = isLightSection ? 'bg-[#101426]/12' : 'bg-white/15';
  const trackFill = isLightSection ? 'bg-[#101426]/55' : 'bg-[#F3CD82]/75';

  return (
    <aside
      aria-label={t('hero.eyebrow')}
      className="hidden lg:flex fixed right-3 xl:right-5 2xl:right-7 top-1/2 -translate-y-1/2 z-30 flex-col items-center pointer-events-auto select-none"
    >
      <nav
        aria-label={t('hero.railNavLabel')}
        className={`flex flex-col items-center gap-2.5 px-2 py-3 rounded-full border backdrop-blur-md transition-colors duration-200 ${shellSurface}`}
      >
        <span
          className={`text-[10px] font-medium tracking-[0.12em] tabular-nums transition-colors duration-200 ${counterColor}`}
        >
          {String(activeIndex + 1).padStart(2, '0')}
          <span className="opacity-55">/{String(totalSections).padStart(2, '0')}</span>
        </span>

        <div className="relative flex flex-col items-center gap-1.5 py-0.5">
          {/* Background vertical track & active progress line */}
          <span
            aria-hidden="true"
            className={`absolute top-2.5 bottom-2.5 w-px transition-colors duration-200 ${trackBg}`}
          >
            <span
              className={`block w-full transition-all duration-300 ${trackFill}`}
              style={{ height: `${progressPct}%` }}
            />
          </span>

          {HERO_PROGRESS_SECTIONS.map((section, idx) => {
            const active = idx === activeIndex;
            const label = t(section.labelKey);
            const paddedIdx = String(idx + 1).padStart(2, '0');

            return (
              <a
                key={section.id}
                href={`#${section.id}`}
                onClick={(e) => handleJump(e, section.id, idx)}
                aria-label={`${paddedIdx} — ${label}`}
                aria-current={active ? 'location' : undefined}
                className="relative z-10 flex items-center justify-center w-6 h-6 group cursor-pointer focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-[#F3CD82] rounded-full"
              >
                {/* Discreet Floating Tooltip Label on Hover or Keyboard Focus */}
                <span
                  aria-hidden="true"
                  className={`pointer-events-none absolute right-8 top-1/2 -translate-y-1/2 px-2.5 py-1 rounded-full text-[11px] font-medium tracking-[0.04em] whitespace-nowrap border opacity-0 translate-x-1.5 group-hover:opacity-100 group-hover:translate-x-0 group-focus-visible:opacity-100 group-focus-visible:translate-x-0 transition-all duration-150 motion-reduce:transition-none shadow-lg ${
                    isLightSection
                      ? 'bg-[#101426] text-[#FFF6E8] border-[#F3CD82]/35'
                      : 'bg-[#101426]/95 text-[#FFF6E8] border-[#F3CD82]/40'
                  }`}
                >
                  <span className="text-[#F3CD82] tabular-nums mr-1.5">{paddedIdx}</span>
                  {label}
                </span>

                <span
                  className={`block rounded-full transition-all duration-200 ${
                    active
                      ? isLightSection
                        ? 'w-2.5 h-2.5 bg-[#101426] ring-4 ring-[#101426]/15'
                        : 'w-2.5 h-2.5 bg-[#F3CD82] ring-4 ring-[#F3CD82]/25 shadow-[0_0_10px_rgba(243,205,130,0.5)]'
                      : isLightSection
                        ? 'w-1.5 h-1.5 bg-[#101426]/35 group-hover:bg-[#101426] group-hover:scale-125'
                        : 'w-1.5 h-1.5 bg-[#FFF6E8]/55 group-hover:bg-[#F3CD82] group-hover:scale-125'
                  }`}
                />
              </a>
            );
          })}
        </div>
      </nav>
    </aside>
  );
};
