import React, { useEffect } from 'react';
import { ArrowRight, Play, X } from 'lucide-react';
import { AnimatePresence, motion } from 'motion/react';
import { Link } from 'react-router-dom';
import { ASSET_MANIFEST } from '../../assets/assetManifest';
import { OFFICIAL_EVENT_URLS } from '../../content/eventContent';
import { useI18n } from '../../i18n';

interface TrailerModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const TrailerModal: React.FC<TrailerModalProps> = ({ isOpen, onClose }) => {
  const { t } = useI18n();
  const study = ASSET_MANIFEST.visualStudies.heroPavilion;

  useEffect(() => {
    if (!isOpen) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [isOpen, onClose]);

  return (
    <AnimatePresence>
      {isOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6"
          role="dialog"
          aria-modal="true"
          aria-labelledby="trailer-modal-title"
        >
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 bg-[rgba(16,29,50,0.82)] backdrop-blur-sm"
            onClick={onClose}
          />

          <motion.div
            initial={{ opacity: 0, y: 12, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 8, scale: 0.98 }}
            transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
            className="relative z-10 w-full max-w-2xl overflow-hidden bg-[#101D32] text-[#F5F0E7] border border-[rgba(213,172,112,0.3)]"
          >
            <div className="relative aspect-[16/9] overflow-hidden bg-[#0b1526]">
              <img
                src={study.src}
                alt={t(study.altKey)}
                referrerPolicy="no-referrer"
                className="w-full h-full object-cover opacity-85"
              />
              <div
                aria-hidden="true"
                className="absolute inset-0 bg-gradient-to-t from-[#101D32] via-[rgba(16,29,50,0.35)] to-transparent"
              />
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="w-16 h-16 rounded-full border border-[#D5AC70]/70 bg-[rgba(16,29,50,0.72)] flex items-center justify-center text-[#D5AC70]">
                  <Play className="w-6 h-6 fill-current ml-0.5" aria-hidden="true" />
                </div>
              </div>
              <button
                type="button"
                onClick={onClose}
                aria-label={t('modal.close')}
                className="absolute top-4 right-4 inline-flex items-center justify-center w-10 h-10 rounded-full border border-white/25 bg-[rgba(16,29,50,0.65)] text-white hover:border-[#D5AC70] transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" aria-hidden="true" />
              </button>
            </div>

            <div className="p-6 sm:p-8 space-y-5">
              <div className="space-y-2">
                <p className="text-[11px] font-medium tracking-[0.2em] uppercase text-[#D5AC70]">
                  {t('hero.eyebrow')}
                </p>
                <h2
                  id="trailer-modal-title"
                  className="font-editorial text-2xl sm:text-3xl font-normal text-[#F5F0E7]"
                >
                  {t('hero.trailerModalTitle')}
                </h2>
              </div>

              <p className="text-sm sm:text-base text-[#F5F0E7]/82 leading-relaxed">
                {t('hero.trailerModalBody')}
              </p>

              <div className="pt-2 flex flex-wrap items-center justify-between gap-4 border-t border-white/15">
                <p className="text-xs text-[#F5F0E7]/65 tabular-nums">
                  {t('hero.curtainRaiserDate')} · {t('hero.mainMahotsavDate')}
                </p>
                <div className="flex items-center gap-3">
                  <Link
                    to={OFFICIAL_EVENT_URLS.register}
                    onClick={onClose}
                    className="inline-flex items-center gap-2 min-h-[40px] px-5 py-2 rounded-full royal-gold-surface text-xs font-semibold"
                  >
                    <span>{t('nav.register')}</span>
                    <ArrowRight className="w-3.5 h-3.5" aria-hidden="true" />
                  </Link>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};
