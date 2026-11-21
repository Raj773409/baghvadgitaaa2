import React, { useEffect, useRef, useState } from 'react';
import {
  ArrowRight,
  Award,
  BookOpen,
  Building2,
  Calendar,
  Compass,
  Flame,
  Globe2,
  Home,
  Image as ImageIcon,
  Mail,
  RotateCcw,
  ShieldCheck,
  Users,
  X,
} from 'lucide-react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { AnimatePresence, motion, useReducedMotion } from 'motion/react';
import { ASSET_MANIFEST } from '../../assets/assetManifest';
import { CANONICAL_GITA_VERSES } from '../../content/scriptureContent';
import { OFFICIAL_SECRETARIAT_CONTACT } from '../../content/eventContent';
import { MORE_MENU_ITEMS, type MoreMenuIconId } from '../../content/navigationContent';
import { useI18n } from '../../i18n';
import { LanguageSelector } from '../ui/LanguageSelector';
import { ThemeToggle } from '../ui/ThemeToggle';
import { ARCHITECTURAL_EASE } from '../../animations/motionPresets';
import { normalizePlatformRoute } from '../../utils/navigationAndRoutes';
import { dispatchReplayWelcome } from '../../utils/welcomeExperience';

interface MoreMenuOverlayProps {
  isOpen: boolean;
  onClose: () => void;
  returnFocusRef: React.RefObject<HTMLButtonElement | null>;
}

function renderMenuIcon(icon: MoreMenuIconId) {
  const cls = 'w-4 h-4 shrink-0';
  switch (icon) {
    case 'home':
      return <Home className={cls} aria-hidden="true" />;
    case 'compass':
      return <Compass className={cls} aria-hidden="true" />;
    case 'book-open':
      return <BookOpen className={cls} aria-hidden="true" />;
    case 'globe':
      return <Globe2 className={cls} aria-hidden="true" />;
    case 'flame':
      return <Flame className={cls} aria-hidden="true" />;
    case 'calendar':
      return <Calendar className={cls} aria-hidden="true" />;
    case 'users':
      return <Users className={cls} aria-hidden="true" />;
    case 'image':
      return <ImageIcon className={cls} aria-hidden="true" />;
    case 'award':
      return <Award className={cls} aria-hidden="true" />;
    case 'building':
      return <Building2 className={cls} aria-hidden="true" />;
    case 'mail':
      return <Mail className={cls} aria-hidden="true" />;
    case 'shield':
      return <ShieldCheck className={cls} aria-hidden="true" />;
  }
}

export const MoreMenuOverlay: React.FC<MoreMenuOverlayProps> = ({
  isOpen,
  onClose,
  returnFocusRef,
}) => {
  const { contentLocale: locale, t } = useI18n();
  const location = useLocation();
  const navigate = useNavigate();
  const currentPath = normalizePlatformRoute(location.pathname);
  const closeBtnRef = useRef<HTMLButtonElement | null>(null);
  const panelRef = useRef<HTMLDivElement | null>(null);
  const reduceMotion = useReducedMotion();
  const [heroImgError, setHeroImgError] = useState(false);

  const featuredVerse =
    CANONICAL_GITA_VERSES.find((v) => v.id === 'bg-4-7') ?? CANONICAL_GITA_VERSES[0];
  const devotionalImage = ASSET_MANIFEST.visualStudies.registrationSanctumBg;

  const verseTranslation =
    locale === 'hi'
      ? featuredVerse.meaningHi
      : locale === 'te'
        ? featuredVerse.meaningTe
        : featuredVerse.translationEn;

  useEffect(() => {
    if (!isOpen) return;
    document.body.style.overflow = 'hidden';

    const focusTimer = window.setTimeout(() => {
      closeBtnRef.current?.focus();
    }, 50);

    const handleCloseWithFocus = () => {
      onClose();
      window.requestAnimationFrame(() => returnFocusRef.current?.focus());
    };

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        event.preventDefault();
        handleCloseWithFocus();
        return;
      }

      if (event.key === 'Tab' && panelRef.current) {
        const focusables = Array.from(
          panelRef.current.querySelectorAll<HTMLElement>(
            'a[href], button:not([disabled]), [tabindex]:not([tabindex="-1"])',
          ),
        ).filter((el) => el.offsetParent !== null);

        if (focusables.length > 0) {
          const first = focusables[0];
          const last = focusables[focusables.length - 1];
          if (event.shiftKey && document.activeElement === first) {
            event.preventDefault();
            last.focus();
          } else if (!event.shiftKey && document.activeElement === last) {
            event.preventDefault();
            first.focus();
          }
        }
      }

      if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
        const links = panelRef.current?.querySelectorAll<HTMLAnchorElement>('a[data-more-link]');
        if (!links || links.length === 0) return;
        const arr = Array.from(links);
        const idx = arr.indexOf(document.activeElement as HTMLAnchorElement);
        event.preventDefault();
        if (idx === -1) {
          arr[0]?.focus();
        } else {
          const next =
            event.key === 'ArrowDown'
              ? (idx + 1) % arr.length
              : (idx - 1 + arr.length) % arr.length;
          arr[next]?.focus();
        }
      }
    };

    window.addEventListener('keydown', onKeyDown);
    return () => {
      window.clearTimeout(focusTimer);
      window.removeEventListener('keydown', onKeyDown);
      document.body.style.overflow = '';
    };
  }, [isOpen, onClose, returnFocusRef]);

  const discoverItems = MORE_MENU_ITEMS.filter((item) => item.section === 'discover');
  const experienceItems = MORE_MENU_ITEMS.filter((item) => item.section === 'experience');
  const organizationItems = MORE_MENU_ITEMS.filter((item) => item.section === 'organization');

  const groups = [
    { id: 'discover', label: t('navigationOverlay.groupDiscover'), items: discoverItems },
    { id: 'experience', label: t('navigationOverlay.groupExperience'), items: experienceItems },
    { id: 'organization', label: t('navigationOverlay.groupOrganization'), items: organizationItems },
  ];

  const handleCloseButton = () => {
    onClose();
    window.requestAnimationFrame(() => returnFocusRef.current?.focus());
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          id="more-navigation-overlay"
          role="dialog"
          aria-modal="true"
          aria-labelledby="more-overlay-heading"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: reduceMotion ? 0 : 0.22 }}
          className="fixed inset-0 z-50 bg-[rgba(16,20,38,0.95)] backdrop-blur-md overflow-y-auto"
          onClick={onClose}
        >
          <motion.div
            ref={panelRef}
            initial={reduceMotion ? false : { opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            exit={reduceMotion ? { opacity: 0 } : { opacity: 0, y: 10 }}
            transition={{ duration: reduceMotion ? 0 : 0.3, ease: ARCHITECTURAL_EASE }}
            onClick={(e) => e.stopPropagation()}
            className="min-h-full lg:min-h-0 max-w-[1380px] mx-auto px-5 sm:px-8 lg:px-10 py-5 lg:py-7 text-[#FFF6E8] flex flex-col justify-between"
          >
            {/* Top Header Row inside Mega Menu */}
            <div className="flex items-center justify-between gap-3 pb-4 border-b border-[#F3CD82]/20">
              <div className="flex items-center gap-2.5 sm:gap-3 min-w-0">
                <svg
                  width="32"
                  height="22"
                  viewBox="0 0 44 32"
                  fill="none"
                  aria-hidden="true"
                  className="text-[#F3CD82] shrink-0"
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
                    d="M12.5 27.5C18.5 26 25.5 26 31.5 27.5"
                    stroke="currentColor"
                    strokeWidth="1.15"
                    strokeLinecap="round"
                  />
                </svg>
                <div className="min-w-0">
                  <p className="hidden sm:block text-[10px] font-medium tracking-[0.2em] uppercase text-[#F3CD82]">
                    {t('navigationOverlay.eyebrow')}
                  </p>
                  <h2
                    id="more-overlay-heading"
                    className="font-editorial text-sm sm:text-2xl font-normal text-[#FFF6E8] leading-tight"
                  >
                    <span className="sm:hidden block text-[10px] font-sans font-medium tracking-[0.12em] uppercase leading-[1.25]">
                      {t('site.brandLine1')}
                      <br />
                      {t('site.brandLine2')} {t('site.brandLine3')}
                    </span>
                    <span className="hidden sm:inline">{t('navigationOverlay.heading')}</span>
                  </h2>
                </div>
              </div>

              <div className="flex items-center gap-2 sm:gap-3 shrink-0">
                <div className="hidden md:block">
                  <ThemeToggle variant="segmented" />
                </div>
                <div className="sm:hidden">
                  <LanguageSelector tone="dark" compact />
                </div>
                <div className="hidden sm:block">
                  <LanguageSelector tone="dark" />
                </div>
                <button
                  ref={closeBtnRef}
                  type="button"
                  onClick={handleCloseButton}
                  aria-label={t('navigationOverlay.closeOverlay')}
                  className="inline-flex items-center justify-center w-11 h-11 rounded-full border border-[#F3CD82]/50 bg-[#202B48]/70 text-[#FFF6E8] hover:border-[#F3CD82] hover:bg-[#202B48] transition-colors cursor-pointer"
                >
                  <X className="w-5 h-5" aria-hidden="true" />
                </button>
              </div>
            </div>

            {/* Mobile Primary Register CTA + Compact Featured Strip (Mobile < lg) */}
            <div className="lg:hidden mt-5 space-y-4">
              <Link
                to="/participate/register"
                data-more-link
                onClick={onClose}
                className="w-full inline-flex items-center justify-center gap-2.5 min-h-[48px] px-6 py-3 rounded-full bg-[#F3CD82] text-[#101426] hover:bg-[#FFF6E8] text-xs font-semibold tracking-[0.12em] uppercase transition-colors"
              >
                <span>{t('navigationOverlay.featuredCta')}</span>
                <ArrowRight className="w-4 h-4" aria-hidden="true" />
              </Link>

              <div className="flex items-center gap-4 p-3.5 rounded-lg bg-[#202B48]/75 border border-[#F3CD82]/20">
                <div className="w-20 h-16 rounded overflow-hidden shrink-0 bg-[#101426]">
                  {!heroImgError ? (
                    <img
                      src={devotionalImage.src}
                      alt={t(devotionalImage.altKey)}
                      referrerPolicy="no-referrer"
                      onError={() => setHeroImgError(true)}
                      className="w-full h-full object-cover object-top"
                    />
                  ) : (
                    <div className="w-full h-full bg-gradient-to-br from-[#202B48] to-[#101426]" />
                  )}
                </div>
                <div className="min-w-0 space-y-1">
                  <p className="text-[10px] font-semibold tracking-[0.16em] uppercase text-[#F3CD82]">
                    {t('navigationOverlay.featuredHeading')}
                  </p>
                  <p className="text-xs leading-relaxed text-[#FFF6E8]/85 line-clamp-2">
                    {t('navigationOverlay.featuredIntro')}
                  </p>
                </div>
              </div>
            </div>

            {/* Balanced Two-Part Desktop Mega Menu Composition */}
            <div className="mt-6 grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-9 items-stretch">
              {/* LEFT SIDE — FEATURED CONTENT (~33% on desktop) */}
              <motion.aside
                initial={reduceMotion ? false : { opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{
                  duration: reduceMotion ? 0 : 0.34,
                  delay: reduceMotion ? 0 : 0.05,
                  ease: ARCHITECTURAL_EASE,
                }}
                className="hidden lg:flex lg:col-span-4 flex-col justify-between bg-[#202B48]/72 border border-[#F3CD82]/22 rounded-xl p-5 xl:p-6 space-y-4"
              >
                <div className="space-y-3.5">
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-[11px] font-semibold tracking-[0.18em] uppercase text-[#F3CD82]">
                      {t('navigationOverlay.featuredHeading')}
                    </span>
                    <span className="text-[11px] tracking-[0.12em] uppercase text-[#FFF6E8]/55">
                      2027
                    </span>
                  </div>

                  {/* Devotional Krishna & Arjuna Artwork */}
                  <div className="relative overflow-hidden rounded-lg aspect-[16/9] bg-[#101426] border border-[#F3CD82]/25">
                    {!heroImgError ? (
                      <img
                        src={devotionalImage.src}
                        alt={t(devotionalImage.altKey)}
                        referrerPolicy="no-referrer"
                        onError={() => setHeroImgError(true)}
                        className="w-full h-full object-cover object-top"
                      />
                    ) : (
                      <div className="w-full h-full bg-gradient-to-br from-[#202B48] to-[#101426]" />
                    )}
                    <div
                      aria-hidden="true"
                      className="absolute inset-0 bg-gradient-to-t from-[#101426]/85 via-transparent to-transparent"
                    />
                  </div>

                  <p className="text-xs xl:text-[13px] leading-relaxed text-[#FFF6E8]/82">
                    {t('navigationOverlay.featuredIntro')}
                  </p>

                  {/* Verified Bhagavad Gita Verse Block */}
                  <div className="pt-3 border-t border-[#F3CD82]/20 space-y-1.5">
                    <p
                      lang="sa"
                      className="text-xs xl:text-[13px] leading-relaxed text-[#F3CD82] font-medium whitespace-pre-line"
                    >
                      {featuredVerse.sanskritDevanagari}
                    </p>
                    <p className="font-editorial italic text-sm leading-snug text-[#FFF6E8]/90">
                      “{verseTranslation}”
                    </p>
                    <p className="text-[10px] font-medium tracking-[0.16em] uppercase text-[#F3CD82]/85">
                      — {featuredVerse.reference}
                    </p>
                  </div>
                </div>

                <Link
                  to="/participate/register"
                  data-more-link
                  onClick={onClose}
                  className="w-full inline-flex items-center justify-center gap-2.5 min-h-[46px] px-5 py-3 rounded-full bg-[#F3CD82] text-[#101426] hover:bg-[#FFF6E8] text-xs font-semibold tracking-[0.1em] uppercase transition-colors"
                >
                  <span>{t('navigationOverlay.featuredCta')}</span>
                  <ArrowRight className="w-4 h-4" aria-hidden="true" />
                </Link>
              </motion.aside>

              {/* RIGHT SIDE — THREE CLEAN NAVIGATION GROUPS (~67% on desktop) */}
              <div className="lg:col-span-8 grid grid-cols-1 md:grid-cols-3 gap-7 lg:gap-8 content-start">
                {groups.map((group, groupIndex) => (
                  <motion.nav
                    key={group.id}
                    aria-label={group.label}
                    initial={reduceMotion ? false : { opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{
                      duration: reduceMotion ? 0 : 0.32,
                      delay: reduceMotion ? 0 : 0.08 + groupIndex * 0.055,
                      ease: ARCHITECTURAL_EASE,
                    }}
                    className="space-y-3"
                  >
                    <h3 className="text-[11px] font-semibold tracking-[0.2em] uppercase text-[#F3CD82] pb-2.5 border-b border-[#F3CD82]/22">
                      {group.label}
                    </h3>

                    <ul className="divide-y divide-[#F3CD82]/10">
                      {group.items.map((item) => {
                        const active = currentPath === item.to;
                        return (
                          <li key={item.id}>
                            <Link
                              to={item.to}
                              data-more-link
                              onClick={onClose}
                              aria-current={active ? 'page' : undefined}
                              className={`group flex items-start justify-between gap-3 py-3 lg:py-2.5 px-2.5 -mx-2.5 rounded-lg min-h-[48px] transition-colors duration-150 focus-visible:outline-2 focus-visible:outline-[#F3CD82] ${
                                active
                                  ? 'bg-[#202B48] text-[#F3CD82]'
                                  : 'text-[#FFF6E8] hover:bg-[#202B48]/55'
                              }`}
                            >
                              <div className="flex items-start gap-3 min-w-0">
                                <span
                                  className={`mt-1 transition-colors ${
                                    active
                                      ? 'text-[#F3CD82]'
                                      : 'text-[#F3CD82]/75 group-hover:text-[#F3CD82]'
                                  }`}
                                >
                                  {renderMenuIcon(item.icon)}
                                </span>
                                <div className="min-w-0">
                                  <span className="block font-editorial text-[19px] leading-snug text-current group-hover:text-[#F3CD82] transition-colors">
                                    {t(item.titleKey)}
                                  </span>
                                  <span className="block text-xs text-[#FFF6E8]/68 mt-0.5 leading-snug">
                                    {t(item.subtitleKey)}
                                  </span>
                                </div>
                              </div>
                              <ArrowRight
                                className={`w-3.5 h-3.5 mt-1.5 shrink-0 transition-all duration-150 ${
                                  active
                                    ? 'text-[#F3CD82] opacity-100 translate-x-0.5'
                                    : 'text-[#F3CD82]/60 opacity-0 group-hover:opacity-100 group-focus-visible:opacity-100 group-hover:translate-x-0.5'
                                }`}
                                aria-hidden="true"
                              />
                            </Link>
                          </li>
                        );
                      })}
                    </ul>
                  </motion.nav>
                ))}
              </div>
            </div>

            {/* Quiet Institutional Footer Strip inside Mega Menu */}
            <div className="mt-6 pt-4 border-t border-[#F3CD82]/18 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs text-[#FFF6E8]/68">
              <div>
                <span className="uppercase tracking-[0.14em] text-[#F3CD82] mr-2">
                  {t('navigationOverlay.secretariatLabel')}:
                </span>
                <span>{t('navigationOverlay.secretariatEntities')}</span>
                <span className="hidden md:inline text-white/30 mx-2">·</span>
                <span className="block md:inline mt-1 md:mt-0 tabular-nums">
                  {OFFICIAL_SECRETARIAT_CONTACT.phones[0].number}
                </span>
              </div>

              <div className="flex flex-wrap items-center gap-4">
                <button
                  type="button"
                  onClick={() => {
                    onClose();
                    if (currentPath === '/') {
                      dispatchReplayWelcome();
                    } else {
                      navigate('/?welcome=1');
                    }
                  }}
                  data-testid="menu-replay-welcome"
                  className="inline-flex items-center gap-1.5 text-[#F3CD82] hover:text-white transition-colors cursor-pointer"
                >
                  <RotateCcw className="w-3.5 h-3.5" aria-hidden="true" />
                  <span>{t('welcome.replayWelcome')}</span>
                </button>
                <span aria-hidden="true" className="text-white/25">
                  /
                </span>
                <Link
                  to="/privacy-policy"
                  onClick={onClose}
                  className="hover:text-[#F3CD82] transition-colors"
                >
                  {t('footer.privacyPolicy')}
                </Link>
                <span aria-hidden="true" className="text-white/25">
                  /
                </span>
                <Link
                  to="/terms-conditions"
                  onClick={onClose}
                  className="hover:text-[#F3CD82] transition-colors"
                >
                  {t('footer.termsConditions')}
                </Link>
                <span aria-hidden="true" className="text-white/25">
                  /
                </span>
                <Link
                  to="/admin"
                  onClick={onClose}
                  className="text-[#D4A537] hover:text-[#F7D774] transition-colors font-medium"
                >
                  Admin Command Centre
                </Link>
                <span aria-hidden="true" className="text-white/25">
                  /
                </span>
                <Link
                  to="/faqs"
                  onClick={onClose}
                  className="hover:text-[#F3CD82] transition-colors"
                >
                  {t('sitemap.faqs')}
                </Link>
                <span className="hidden lg:inline text-[#FFF6E8]/45 ml-2">
                  {t('navigationOverlay.escapeHint')}
                </span>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
