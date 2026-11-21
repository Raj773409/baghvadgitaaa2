import React, { useEffect } from 'react';
import { X, ArrowUpRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useI18n } from '../../i18n';

export type NoticeKind = 'contact' | 'privacy' | 'terms' | 'refund' | null;

interface InstitutionalNoticeModalProps {
  activeNotice: NoticeKind;
  onClose: () => void;
}

export const InstitutionalNoticeModal: React.FC<InstitutionalNoticeModalProps> = ({
  activeNotice,
  onClose,
}) => {
  const { t } = useI18n();

  useEffect(() => {
    if (!activeNotice) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [activeNotice, onClose]);

  if (!activeNotice) return null;

  const titleKey = `modal.${activeNotice}Title`;
  const bodyKey = `modal.${activeNotice}Body`;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[rgba(23,27,25,0.75)]"
      role="dialog"
      aria-modal="true"
      aria-labelledby="institutional-notice-title"
      onClick={onClose}
    >
      <div
        className="w-full max-w-lg bg-[var(--color-canvas)] text-[var(--color-ink)] border border-[var(--color-border)] p-6 sm:p-8 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-4 pb-4 border-b border-[var(--color-border)]">
          <h3
            id="institutional-notice-title"
            className="font-display text-2xl font-normal text-[var(--color-ink)] tracking-tight"
          >
            {t(titleKey)}
          </h3>
          <button
            type="button"
            onClick={onClose}
            aria-label={t('modal.close')}
            className="inline-flex items-center justify-center w-10 h-10 rounded-full border border-[var(--color-border)] text-[var(--color-ink)] hover:border-[var(--color-ink)] cursor-pointer shrink-0"
          >
            <X className="w-4 h-4" aria-hidden="true" />
          </button>
        </div>

        <p className="mt-5 text-sm leading-relaxed text-[var(--color-muted)]">
          {t(bodyKey)}
        </p>

        <div className="mt-6 pt-5 border-t border-[var(--color-border)] flex flex-wrap items-center justify-between gap-4">
          <Link
            to="/contact"
            onClick={onClose}
            className="inline-flex items-center gap-1.5 text-sm font-medium text-[var(--color-bronze)] hover:text-[var(--color-ink)] transition-colors"
          >
            <span>Contact the Secretariat</span>
            <ArrowUpRight className="w-3.5 h-3.5" aria-hidden="true" />
          </Link>

          <button
            type="button"
            onClick={onClose}
            className="min-h-[40px] px-5 py-2 rounded-full bg-[var(--color-ink)] text-white text-xs font-medium tracking-[0.04em] hover:bg-[var(--color-olive)] cursor-pointer"
          >
            {t('modal.close')}
          </button>
        </div>
      </div>
    </div>
  );
};
