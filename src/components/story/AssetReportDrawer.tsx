import React, { useEffect, useRef } from 'react';
import { AlertTriangle, CheckCircle2, Layers, X } from 'lucide-react';
import { useI18n } from '../../i18n';
import { CHARACTER_ASSET_MANIFEST } from '../../three/story/assetManifest';
import type { AssetValidationRecord } from '../../three/story/assetValidation';

interface AssetReportDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  records: AssetValidationRecord[];
}

export const AssetReportDrawer: React.FC<AssetReportDrawerProps> = ({
  isOpen,
  onClose,
  records,
}) => {
  const { t } = useI18n();
  const closeBtnRef = useRef<HTMLButtonElement | null>(null);

  useEffect(() => {
    if (!isOpen) return;
    const timer = window.setTimeout(() => closeBtnRef.current?.focus(), 40);
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        onClose();
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => {
      window.clearTimeout(timer);
      window.removeEventListener('keydown', onKeyDown);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="asset-report-title"
      className="fixed inset-0 z-50 bg-[#070B16]/88 flex justify-end"
      onClick={onClose}
    >
      <div
        className="w-full max-w-xl h-full bg-[#101426] text-[#FFF6E8] border-l border-[#F3CD82]/25 overflow-y-auto p-5 sm:p-8 space-y-6"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-4 pb-4 border-b border-[#F3CD82]/20">
          <div className="space-y-1">
            <p className="text-[11px] font-medium tracking-[0.2em] uppercase text-[#F3CD82]">
              {t('story.assetReportEyebrow')}
            </p>
            <h2 id="asset-report-title" className="font-editorial text-2xl sm:text-3xl text-[#FFF6E8]">
              {t('story.assetReportTitle')}
            </h2>
          </div>

          <button
            ref={closeBtnRef}
            type="button"
            onClick={onClose}
            aria-label={t('story.closeSources')}
            className="inline-flex items-center justify-center w-10 h-10 rounded-full border border-[#F3CD82]/40 bg-[#202B48] text-[#FFF6E8] hover:border-[#F3CD82] cursor-pointer shrink-0"
          >
            <X className="w-4 h-4" aria-hidden="true" />
          </button>
        </div>

        <p className="text-xs leading-relaxed text-[#F5F0E7]/78">
          {t('story.assetReportLead')}
        </p>

        <div className="space-y-4">
          {records.map((rec) => {
            const manifest = CHARACTER_ASSET_MANIFEST[rec.id];
            const isValid = rec.status === 'valid';
            return (
              <article
                key={rec.id}
                data-testid={`asset-validation-${rec.id}`}
                className="bg-[#161D35] border border-[#F3CD82]/22 rounded-lg p-4 space-y-3"
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-xs font-semibold text-[#FFF6E8] flex items-center gap-2 flex-wrap">
                      <Layers className="w-3.5 h-3.5 text-[#F3CD82]" aria-hidden="true" />
                      <span>{rec.name}</span>
                      <span className="px-2 py-0.5 rounded bg-[#202B48] border border-[#F3CD82]/25 text-[9px] uppercase tracking-[0.08em] text-[#F3CD82]">
                        {rec.priority === 'war-pack' ? 'War Pack' : 'Core'}
                      </span>
                    </p>
                    <p className="text-[11px] font-mono text-[#F5F0E7]/60 mt-0.5">
                      {rec.filePath}
                    </p>
                  </div>

                  <span
                    className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-semibold uppercase tracking-[0.08em] ${
                      isValid
                        ? 'bg-[#1D4A35] text-[#A8F0C6] border border-[#3E8E63]'
                        : 'bg-[#4A251D] text-[#FFD0B8] border border-[#9E4E38]'
                    }`}
                  >
                    {isValid ? (
                      <CheckCircle2 className="w-3 h-3" aria-hidden="true" />
                    ) : (
                      <AlertTriangle className="w-3 h-3" aria-hidden="true" />
                    )}
                    <span>{rec.status}</span>
                  </span>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-[11px] text-[#F5F0E7]/82 tabular-nums pt-1 border-t border-[#F3CD82]/14">
                  <div>
                    <span className="text-[#F3CD82]/80 block">Skeleton</span>
                    <span>
                      {rec.hasSkeleton ? `${rec.boneCount} bones` : 'No'}
                    </span>
                  </div>
                  <div>
                    <span className="text-[#F3CD82]/80 block">{t('story.morphTargetsLabel')}</span>
                    <span>{rec.morphTargetNames.length}</span>
                  </div>
                  <div>
                    <span className="text-[#F3CD82]/80 block">Clips</span>
                    <span>{rec.availableClips.length}</span>
                  </div>
                  <div>
                    <span className="text-[#F3CD82]/80 block">Triangles</span>
                    <span>{rec.triangleCount.toLocaleString()}</span>
                  </div>
                </div>

                {rec.missingClips.length > 0 && (
                  <p className="text-[11px] text-[#FFD0B8]">
                    Missing clips: {rec.missingClips.join(', ')}
                  </p>
                )}
                {rec.missingMorphTargets.length > 0 && (
                  <p className="text-[11px] text-[#FFD0B8]">
                    Missing morph targets: {rec.missingMorphTargets.join(', ')}
                  </p>
                )}
                {rec.errorMessage && (
                  <p className="text-[11px] text-[#FFD0B8]">Error: {rec.errorMessage}</p>
                )}

                {manifest && (
                  <p className="text-[11px] text-[#F5F0E7]/60 pt-1 border-t border-[#F3CD82]/10">
                    {manifest.assetMaturity} · {manifest.productionUpgradeNote}
                  </p>
                )}
              </article>
            );
          })}
        </div>
      </div>
    </div>
  );
};
