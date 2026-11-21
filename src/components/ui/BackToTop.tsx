import React from 'react';
import { ArrowUp } from 'lucide-react';
import { useI18n } from '../../i18n';

export const BackToTop: React.FC = () => {
  const { t } = useI18n();

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <button
      type="button"
      onClick={scrollToTop}
      className="inline-flex items-center gap-2 min-h-[42px] px-4 py-2 rounded-full text-xs font-medium tracking-[0.06em] uppercase text-white/85 border border-white/20 hover:border-[var(--color-bronze-light)] hover:text-white transition-colors duration-200 whitespace-nowrap shrink-0 cursor-pointer"
    >
      <ArrowUp className="w-3.5 h-3.5" aria-hidden="true" />
      <span>{t('footer.backToTop')}</span>
    </button>
  );
};
