import React from 'react';
import { ArrowRight, ArrowUpRight, Mail, MapPin, Phone, RotateCcw } from 'lucide-react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { SITEMAP_EXPANSION_LINKS } from '../../content/navigationContent';
import { OFFICIAL_EVENT_URLS, OFFICIAL_SECRETARIAT_CONTACT } from '../../content/eventContent';
import { useI18n } from '../../i18n';
import { dispatchReplayWelcome } from '../../utils/welcomeExperience';
import { BackToTop } from '../ui/BackToTop';

export const Footer: React.FC = () => {
  const { t } = useI18n();
  const location = useLocation();
  const navigate = useNavigate();

  const handleReplayWelcome = () => {
    if (location.pathname === '/') {
      dispatchReplayWelcome();
    } else {
      navigate('/?welcome=1');
    }
  };

  return (
    <footer className="bg-[var(--color-charcoal)] text-white border-t border-[var(--border-hairline-dark)]">
      <div className="max-w-[1360px] mx-auto px-5 sm:px-8 lg:px-12 py-16 lg:py-20">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-12 gap-10 pb-14 border-b border-[var(--border-hairline-dark)]">
          {/* Official Institutional Monogram & Summary */}
          <div className="lg:col-span-4 space-y-5">
            <p className="text-xs font-medium tracking-[0.14em] uppercase text-[var(--color-bronze-light)]">
              {t('site.tagline')}
            </p>
            <h2 className="font-display text-2xl sm:text-3xl font-light text-white tracking-[-0.02em] text-balance">
              {t('footer.identityHeading')}
            </h2>
            <p className="text-sm leading-relaxed text-[var(--color-text-dark-muted)] max-w-md">
              {t('footer.identitySummary')}
            </p>
            <p className="text-xs tracking-[0.04em] text-white/65 pt-1">
              {t('site.announcement')}
            </p>
            <div className="pt-2 flex flex-wrap gap-3 text-xs text-white/75">
              <a
                href={OFFICIAL_EVENT_URLS.instagram}
                target="_blank"
                rel="noopener noreferrer"
                className="hover:text-[var(--color-bronze-light)] transition-colors"
              >
                Instagram
              </a>
              <span aria-hidden="true" className="text-white/30">·</span>
              <a
                href={OFFICIAL_EVENT_URLS.facebook}
                target="_blank"
                rel="noopener noreferrer"
                className="hover:text-[var(--color-bronze-light)] transition-colors"
              >
                Facebook
              </a>
              <span aria-hidden="true" className="text-white/30">·</span>
              <a
                href={OFFICIAL_EVENT_URLS.twitter}
                target="_blank"
                rel="noopener noreferrer"
                className="hover:text-[var(--color-bronze-light)] transition-colors"
              >
                X
              </a>
              <span aria-hidden="true" className="text-white/30">·</span>
              <a
                href={OFFICIAL_EVENT_URLS.youtube}
                target="_blank"
                rel="noopener noreferrer"
                className="hover:text-[var(--color-bronze-light)] transition-colors"
              >
                YouTube
              </a>
            </div>
          </div>

          {/* Complete Multi-Page Navigation Index */}
          <div className="lg:col-span-3 space-y-4">
            <h3 className="text-xs font-medium tracking-[0.14em] uppercase text-[var(--color-bronze-light)]">
              {t('footer.navigationHeading')}
            </h3>
            <ul className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-1 gap-y-2.5 gap-x-6 text-sm">
              {SITEMAP_EXPANSION_LINKS.map((link) => (
                <li key={link.id}>
                  <Link
                    to={link.href}
                    className="text-white/78 hover:text-white transition-colors"
                  >
                    {t(link.labelKey)}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Secretariat & Legal Routes */}
          <div className="lg:col-span-5 grid grid-cols-1 sm:grid-cols-2 gap-8">
            <div className="space-y-4">
              <h3 className="text-xs font-medium tracking-[0.14em] uppercase text-[var(--color-bronze-light)]">
                {t('footer.officialPortalHeading')}
              </h3>
              <ul className="space-y-2.5 text-sm">
                <li>
                  <Link
                    to="/participate/register"
                    className="inline-flex items-center gap-1.5 text-[var(--color-champagne)] hover:text-white transition-colors font-medium"
                  >
                    <span>{t('footer.officialRegister')}</span>
                    <ArrowRight className="w-3.5 h-3.5" aria-hidden="true" />
                  </Link>
                </li>
                <li>
                  <a
                    href={OFFICIAL_EVENT_URLS.home}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 text-white/80 hover:text-[var(--color-bronze-light)] transition-colors"
                  >
                    <span>{t('footer.officialWebsite')}</span>
                    <ArrowUpRight className="w-3.5 h-3.5" aria-hidden="true" />
                  </a>
                </li>
                <li className="pt-2 flex items-start gap-2 text-xs text-white/68 leading-relaxed">
                  <MapPin className="w-3.5 h-3.5 text-[var(--color-bronze-light)] shrink-0 mt-0.5" aria-hidden="true" />
                  <span>{OFFICIAL_SECRETARIAT_CONTACT.address}</span>
                </li>
                <li className="flex items-start gap-2 text-xs text-white/75">
                  <Phone className="w-3.5 h-3.5 text-[var(--color-bronze-light)] shrink-0 mt-0.5" aria-hidden="true" />
                  <div className="flex flex-col gap-1 tabular-nums">
                    {OFFICIAL_SECRETARIAT_CONTACT.phones.map((p) => (
                      <a key={p.number} href={p.telHref} className="hover:text-white">
                        {p.number}
                      </a>
                    ))}
                  </div>
                </li>
                <li className="flex items-start gap-2 text-xs text-white/75">
                  <Mail className="w-3.5 h-3.5 text-[var(--color-bronze-light)] shrink-0 mt-0.5" aria-hidden="true" />
                  <div className="flex flex-col gap-1">
                    {OFFICIAL_SECRETARIAT_CONTACT.emails.map((em) => (
                      <a key={em.address} href={em.mailtoHref} className="hover:text-white break-all">
                        {em.address}
                      </a>
                    ))}
                  </div>
                </li>
              </ul>
            </div>

            <div className="space-y-4">
              <h3 className="text-xs font-medium tracking-[0.14em] uppercase text-[var(--color-bronze-light)]">
                {t('footer.legalHeading')}
              </h3>
              <ul className="space-y-2.5 text-sm">
                <li>
                  <Link
                    to="/privacy-policy"
                    className="text-white/75 hover:text-white transition-colors"
                  >
                    {t('footer.privacyPolicy')}
                  </Link>
                </li>
                <li>
                  <Link
                    to="/terms-conditions"
                    className="text-white/75 hover:text-white transition-colors"
                  >
                    {t('footer.termsConditions')}
                  </Link>
                </li>
                <li>
                  <Link
                    to="/cancellation-refund-policy"
                    className="text-white/75 hover:text-white transition-colors"
                  >
                    {t('footer.refundPolicy')}
                  </Link>
                </li>
                <li>
                  <Link
                    to="/faqs"
                    className="text-white/75 hover:text-white transition-colors"
                  >
                    {t('sitemap.faqs')}
                  </Link>
                </li>
              </ul>
            </div>
          </div>
        </div>

        <div className="pt-8 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <p className="text-xs text-white/60 leading-relaxed max-w-2xl">
            {t('footer.copyright')}
          </p>
          <div className="flex flex-wrap items-center gap-4">
            <Link
              to="/admin"
              className="text-xs font-medium tracking-[0.06em] uppercase text-[#C9A04E] hover:text-[#F0D38B] transition-colors"
            >
              Admin Portal
            </Link>
            <button
              type="button"
              onClick={handleReplayWelcome}
              data-testid="footer-replay-welcome"
              className="inline-flex items-center gap-1.5 text-xs font-medium tracking-[0.06em] uppercase text-[var(--color-champagne)] hover:text-white transition-colors cursor-pointer"
            >
              <RotateCcw className="w-3.5 h-3.5" aria-hidden="true" />
              <span>{t('welcome.replayWelcome')}</span>
            </button>
            <BackToTop />
          </div>
        </div>
      </div>
    </footer>
  );
};
