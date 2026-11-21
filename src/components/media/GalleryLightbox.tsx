import React, { useEffect } from 'react';
import { ChevronLeft, ChevronRight, X } from 'lucide-react';
import { useI18n } from '../../i18n';
import type { MediaRecord } from '../../content/eventContent';

interface GalleryLightboxProps {
  items: ReadonlyArray<MediaRecord>;
  activeIndex: number | null;
  onClose: () => void;
  onSelectIndex: (idx: number) => void;
}

export const GalleryLightbox: React.FC<GalleryLightboxProps> = ({
  items,
  activeIndex,
  onClose,
  onSelectIndex,
}) => {
  const { t } = useI18n();

  useEffect(() => {
    if (activeIndex === null) return;
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
      if (e.key === 'ArrowRight') {
        onSelectIndex((activeIndex + 1) % items.length);
      }
      if (e.key === 'ArrowLeft') {
        onSelectIndex((activeIndex - 1 + items.length) % items.length);
      }
    };

    window.addEventListener('keydown', onKeyDown);
    return () => {
      window.removeEventListener('keydown', onKeyDown);
      document.body.style.overflow = prevOverflow;
    };
  }, [activeIndex, items.length, onClose, onSelectIndex]);

  if (activeIndex === null || !items[activeIndex]) return null;
  const activeItem = items[activeIndex];

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={t(activeItem.titleKey)}
      onClick={onClose}
      className="fixed inset-0 z-50 bg-[rgba(10,14,26,0.92)] backdrop-blur-md flex items-center justify-center p-4 sm:p-8"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-5xl bg-[#101426] border border-[#D6A447]/35 text-[#FFF6E8] rounded-xl overflow-hidden shadow-2xl"
      >
        <div className="px-5 py-4 border-b border-[#D6A447]/20 flex items-center justify-between gap-4">
          <div className="min-w-0">
            <p className="text-[11px] tracking-[0.14em] uppercase text-[#F3CD82]">
              {t(activeItem.dateLabelKey)} · {String(activeIndex + 1).padStart(2, '0')} /{' '}
              {String(items.length).padStart(2, '0')}
            </p>
            <h3 className="font-editorial text-xl sm:text-2xl truncate">
              {t(activeItem.titleKey)}
            </h3>
          </div>

          <button
            type="button"
            onClick={onClose}
            aria-label={t('modal.close')}
            className="inline-flex items-center justify-center w-10 h-10 rounded-full border border-[#D6A447]/40 text-[#FFF6E8] hover:border-[#F3CD82] cursor-pointer shrink-0"
          >
            <X className="w-4 h-4" aria-hidden="true" />
          </button>
        </div>

        <div className="relative bg-[#0B0E1B] aspect-[16/9] max-h-[68vh] w-full flex items-center justify-center overflow-hidden">
          {activeItem.imageSrc && (
            <img
              src={activeItem.imageSrc}
              alt={t(activeItem.titleKey)}
              referrerPolicy="no-referrer"
              className="w-full h-full object-contain"
            />
          )}

          {items.length > 1 && (
            <>
              <button
                type="button"
                aria-label={t('chapters.prevChapter')}
                onClick={() => onSelectIndex((activeIndex - 1 + items.length) % items.length)}
                className="absolute left-3 top-1/2 -translate-y-1/2 inline-flex items-center justify-center w-10 h-10 rounded-full bg-[#101426]/80 border border-[#D6A447]/45 text-[#FFF6E8] hover:border-[#F3CD82] cursor-pointer"
              >
                <ChevronLeft className="w-5 h-5" aria-hidden="true" />
              </button>
              <button
                type="button"
                aria-label={t('chapters.nextChapter')}
                onClick={() => onSelectIndex((activeIndex + 1) % items.length)}
                className="absolute right-3 top-1/2 -translate-y-1/2 inline-flex items-center justify-center w-10 h-10 rounded-full bg-[#101426]/80 border border-[#D6A447]/45 text-[#FFF6E8] hover:border-[#F3CD82] cursor-pointer"
              >
                <ChevronRight className="w-5 h-5" aria-hidden="true" />
              </button>
            </>
          )}
        </div>

        <div className="px-5 py-4 text-sm text-[#F4E8D3]/80">
          {t(activeItem.captionKey)}
        </div>
      </div>
    </div>
  );
};
