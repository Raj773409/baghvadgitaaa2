import React, { useEffect, useRef, useState } from 'react';
import { ArrowLeft, ArrowRight, LayoutGrid, UserRound } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useI18n } from '../../i18n';
import { LanguageSelector } from '../ui/LanguageSelector';
import { ThemeToggle } from '../ui/ThemeToggle';
import { MoreMenuOverlay } from './MoreMenuOverlay';
import { portalApi, PORTAL_SESSION_EVENT } from '../../utils/portalApi';

interface HeaderProps {
  variant?: 'transparent-hero' | 'solid-dark' | 'registration';
}

type PortalSessionState = { authenticated: false } | { authenticated: true; fullName: string; unread: number };

/** Signed-in participants see their initials + unread badge; others get a sign-in entry point. */
const AccountButton: React.FC<{ light: boolean }> = ({ light }) => {
  const [session, setSession] = useState<PortalSessionState>({ authenticated: false });

  useEffect(() => {
    let cancelled = false;
    const load = () => {
      portalApi
        .session()
        .then((s) => {
          if (!cancelled) setSession(s.authenticated ? { authenticated: true, fullName: s.fullName, unread: s.unread } : s);
        })
        .catch(() => undefined);
    };
    load();
    window.addEventListener(PORTAL_SESSION_EVENT, load);
    window.addEventListener('focus', load);
    return () => {
      cancelled = true;
      window.removeEventListener(PORTAL_SESSION_EVENT, load);
      window.removeEventListener('focus', load);
    };
  }, []);

  const base = `relative inline-flex items-center justify-center gap-2 min-h-[38px] rounded-full border text-xs font-medium whitespace-nowrap shrink-0 transition-all duration-150 ${
    light
      ? 'border-[var(--color-border)] text-[var(--color-ink)] hover:border-[#9C6B1E] bg-[var(--surface-elevated)]/85 dark:bg-[#17233A]/85 dark:text-[#FFFDF7]'
      : 'border-[#D4A537]/50 text-[#FFFDF7] hover:border-[#F7D774] bg-[#17233A]/55'
  }`;

  if (!session.authenticated) {
    return (
      <Link to="/dashboard" className={`${base} w-[38px] sm:w-auto sm:px-3.5`} aria-label="Sign in to your dashboard">
        <UserRound className="w-4 h-4 shrink-0" aria-hidden="true" />
        <span className="hidden lg:inline">Sign in</span>
      </Link>
    );
  }

  const initials = session.fullName
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase())
    .join('');

  return (
    <Link
      to="/dashboard"
      className={`${base} pl-1 pr-1 sm:pr-3.5`}
      aria-label={`My dashboard${session.unread ? `, ${session.unread} unread notifications` : ''}`}
    >
      <span className="grid place-items-center w-[30px] h-[30px] rounded-full royal-gold-surface text-[11px] font-bold">
        {initials || <UserRound className="w-4 h-4" aria-hidden="true" />}
      </span>
      <span className="hidden lg:inline">My Dashboard</span>
      {session.unread > 0 && (
        <span
          className="absolute -top-1 -right-1 min-w-[18px] h-[18px] px-1 rounded-full bg-[#D9561C] text-white text-[10px] font-bold grid place-items-center shadow-[0_0_10px_rgba(217,86,28,0.8)]"
          aria-hidden="true"
        >
          {session.unread > 9 ? '9+' : session.unread}
        </span>
      )}
    </Link>
  );
};

export const Header: React.FC<HeaderProps> = ({ variant = 'transparent-hero' }) => {
  const { t } = useI18n();
  const [scrolled, setScrolled] = useState(false);
  const [moreOpen, setMoreOpen] = useState(false);
  const moreButtonRef = useRef<HTMLButtonElement | null>(null);

  useEffect(() => {
    if (variant !== 'transparent-hero') {
      setScrolled(false);
      return;
    }
    const onScroll = () => {
      setScrolled(window.scrollY > 56);
    };
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, [variant]);

  const isLightHeader = variant === 'transparent-hero' && scrolled;
  const isRegistration = variant === 'registration';

  const headerSurfaceClass = isLightHeader
    ? 'bg-[#FFFDF7]/95 dark:bg-[#17233A]/95 backdrop-blur-md text-[var(--color-ink)] border-b border-[var(--color-border)]'
    : variant === 'transparent-hero'
      ? 'bg-transparent text-white border-b border-transparent'
      : 'bg-[#17233A]/95 backdrop-blur-md text-[#FFFDF7] border-b border-[#D4A537]/28';

  return (
    <>
      <header
        className={`${
          isRegistration ? 'sticky' : 'fixed'
        } top-0 inset-x-0 z-40 transition-colors duration-250 ${headerSurfaceClass}`}
      >
        <div
          className={`max-w-[1400px] mx-auto px-3 sm:px-8 lg:px-12 ${
            isRegistration ? 'h-[62px]' : 'h-[70px] sm:h-[76px]'
          } flex items-center justify-between gap-2 sm:gap-6`}
        >
          {/* Left Zone: Lotus Emblem + Event Identity */}
          <Link
            to="/"
            className="inline-flex items-center gap-2 sm:gap-3 min-w-0 shrink group"
          >
            <svg
              width="40"
              height="28"
              viewBox="0 0 44 32"
              fill="none"
              aria-hidden="true"
              className={`w-7 h-5 sm:w-10 sm:h-7 shrink-0 transition-colors duration-200 ${
                isLightHeader ? 'text-[#9C6B1E] dark:text-[#F7D774]' : 'text-[#F7D774]'
              }`}
            >
              <path
                d="M22 3C19.2 8.8 19.2 15.2 22 21.5C24.8 15.2 24.8 8.8 22 3Z"
                stroke="currentColor"
                strokeWidth="1.35"
                strokeLinejoin="round"
              />
              <path
                d="M22 21.5C16.2 18.2 13 12.6 12.2 6.2C17.2 8.8 20.5 14 22 21.5Z"
                stroke="currentColor"
                strokeWidth="1.3"
                strokeLinejoin="round"
              />
              <path
                d="M22 21.5C27.8 18.2 31 12.6 31.8 6.2C26.8 8.8 23.5 14 22 21.5Z"
                stroke="currentColor"
                strokeWidth="1.3"
                strokeLinejoin="round"
              />
              <path
                d="M22 22.5C14.8 21.6 8.8 17.8 5.2 11.4C11.2 12.4 17 16.2 22 22.5Z"
                stroke="currentColor"
                strokeWidth="1.2"
                strokeLinejoin="round"
              />
              <path
                d="M22 22.5C29.2 21.6 35.2 17.8 38.8 11.4C32.8 12.4 27 16.2 22 22.5Z"
                stroke="currentColor"
                strokeWidth="1.2"
                strokeLinejoin="round"
              />
              <path
                d="M22 23.8C13.8 24.8 7 23.2 2.5 18.2C8.8 18.8 15.4 20.6 22 23.8Z"
                stroke="currentColor"
                strokeWidth="1.1"
                strokeLinejoin="round"
              />
              <path
                d="M22 23.8C30.2 24.8 37 23.2 41.5 18.2C35.2 18.8 28.6 20.6 22 23.8Z"
                stroke="currentColor"
                strokeWidth="1.1"
                strokeLinejoin="round"
              />
              <path
                d="M12.5 27.5C18.5 26 25.5 26 31.5 27.5"
                stroke="currentColor"
                strokeWidth="1.15"
                strokeLinecap="round"
              />
            </svg>
            <span className="flex flex-col text-[8px] sm:text-[11px] font-medium tracking-[0.05em] sm:tracking-[0.12em] leading-[1.15] whitespace-nowrap">
              <span>{t('site.brandLine1')}</span>
              <span>
                {t('site.brandLine2')} <span className="tabular-nums opacity-90">{t('site.brandLine3')}</span>
              </span>
            </span>
          </Link>

          {/* Right Zone: Language Switcher + Theme Toggle + Clean MORE Overlay Button + Single Action */}
          <div className="flex items-center gap-1.5 sm:gap-3.5 shrink-0">
            <div className="sm:hidden">
              <LanguageSelector tone={isLightHeader ? 'light' : 'dark'} compact />
            </div>
            <div className="hidden sm:block">
              <LanguageSelector tone={isLightHeader ? 'light' : 'dark'} />
            </div>

            <ThemeToggle tone={isLightHeader ? 'light' : 'dark'} variant="compact" />

            <button
              ref={moreButtonRef}
              type="button"
              onClick={() => setMoreOpen((prev) => !prev)}
              aria-expanded={moreOpen}
              aria-controls="more-navigation-overlay"
              className={`inline-flex items-center gap-1.5 sm:gap-2 min-h-[38px] px-2.5 sm:px-4 py-1.5 rounded-full border text-[11px] sm:text-xs font-medium tracking-[0.08em] sm:tracking-[0.12em] uppercase whitespace-nowrap shrink-0 transition-colors duration-150 cursor-pointer ${
                isLightHeader
                  ? 'border-[var(--color-border)] text-[var(--color-ink)] hover:border-[#9C6B1E] bg-[var(--surface-elevated)]/85 dark:bg-[#17233A]/85 dark:text-[#FFFDF7]'
                  : 'border-[#D4A537]/50 text-[#FFFDF7] hover:border-[#F7D774] bg-[#17233A]/55'
              }`}
            >
              <LayoutGrid className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
              <span className="hidden min-[380px]:inline">{t('navigationOverlay.moreButton')}</span>
            </button>

            <AccountButton light={isLightHeader} />

            {isRegistration ? (
              <Link
                to="/"
                className="hidden md:inline-flex items-center gap-2 min-h-[38px] px-4 py-1.5 rounded-full border border-[#D4A537]/65 text-[#F7D774] hover:bg-[#D4A537] hover:text-[#171717] text-xs font-medium tracking-[0.04em] whitespace-nowrap shrink-0 transition-colors duration-150"
              >
                <ArrowLeft className="w-3.5 h-3.5" aria-hidden="true" />
                <span>{t('navigationOverlay.backToHome')}</span>
              </Link>
            ) : (
              <Link
                to="/participate/register"
                className="hidden md:inline-flex items-center gap-2 min-h-[38px] px-5 py-1.5 rounded-full royal-gold-surface text-xs font-semibold tracking-[0.02em] whitespace-nowrap shrink-0 hover:brightness-105 transition-all duration-150"
              >
                <span>{t('nav.register')}</span>
                <ArrowRight className="w-3.5 h-3.5" aria-hidden="true" />
              </Link>
            )}
          </div>
        </div>
      </header>

      <MoreMenuOverlay
        isOpen={moreOpen}
        onClose={() => setMoreOpen(false)}
        returnFocusRef={moreButtonRef}
      />
    </>
  );
};
