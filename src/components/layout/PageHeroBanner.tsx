import React from 'react';
import { ChevronRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useI18n } from '../../i18n';

interface PageHeroBannerProps {
  eyebrow: string;
  title: string;
  lead: string;
  breadcrumbLabel: string;
  metaRight?: React.ReactNode;
}

export const PageHeroBanner: React.FC<PageHeroBannerProps> = ({
  eyebrow,
  title,
  lead,
  breadcrumbLabel,
  metaRight,
}) => {
  const { t } = useI18n();

  return (
    <section className="relative overflow-hidden bg-[#101D32] text-[#FFF6E8] pt-32 sm:pt-36 pb-16 sm:pb-20 border-b border-[#D6A447]/25">
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            'radial-gradient(64% 85% at 76% 24%, rgba(214, 164, 71, 0.14) 0%, rgba(32, 43, 72, 0.42) 48%, rgba(16, 20, 38, 0.96) 100%)',
        }}
      />

      <div className="relative z-10 max-w-[1360px] mx-auto px-5 sm:px-8 lg:px-12">
        <nav aria-label="Breadcrumb" className="mb-6 flex items-center gap-2 text-xs text-[#F4E8D3]/70">
          <Link to="/" className="hover:text-[#F3CD82] transition-colors">
            {t('navigationOverlay.items.homeTitle')}
          </Link>
          <ChevronRight className="w-3.5 h-3.5 text-[#D6A447]/65" aria-hidden="true" />
          <span className="text-[#F3CD82]">{breadcrumbLabel}</span>
        </nav>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-end">
          <div className="lg:col-span-8 space-y-4">
            <div className="flex items-center gap-4">
              <p className="text-[11px] font-medium tracking-[0.22em] uppercase text-[#F3CD82]">
                {eyebrow}
              </p>
              <span
                aria-hidden="true"
                className="h-px flex-1 max-w-[96px] bg-gradient-to-r from-[#D6A447]/60 to-transparent"
              />
            </div>

            <h1 className="font-editorial font-normal text-[clamp(2.25rem,4.4vw,3.85rem)] leading-[1.06] tracking-[-0.02em] text-[#FFF6E8] text-balance">
              {title}
            </h1>

            <p className="text-sm sm:text-base lg:text-[17px] leading-[1.7] text-[#F4E8D3]/82 max-w-[64ch]">
              {lead}
            </p>
          </div>

          {metaRight && <div className="lg:col-span-4 lg:text-right">{metaRight}</div>}
        </div>
      </div>
    </section>
  );
};
