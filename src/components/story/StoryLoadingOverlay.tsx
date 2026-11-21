import React from 'react';
import { Loader2 } from 'lucide-react';
import { useI18n } from '../../i18n';
import type { StoryModelLoadProgress } from '../../three/story/modelLoader';

interface StoryLoadingOverlayProps {
  progress: StoryModelLoadProgress;
  visible: boolean;
}

export const StoryLoadingOverlay: React.FC<StoryLoadingOverlayProps> = ({
  progress,
  visible,
}) => {
  const { t } = useI18n();
  if (!visible) return null;

  const pct = Math.min(100, Math.max(0, Math.round(progress.ratio * 100)));

  return (
    <div
      data-testid="story-loading-overlay"
      role="status"
      aria-live="polite"
      className="fixed inset-0 z-50 bg-[#0B0F1F] text-[#FFF6E8] flex flex-col items-center justify-center px-6"
    >
      <div className="max-w-md w-full space-y-6 text-center">
        <div className="space-y-2">
          <p className="text-[11px] font-medium tracking-[0.26em] uppercase text-[#F3CD82]">
            {t('story.eyebrow')}
          </p>
          <h2 className="font-editorial text-3xl sm:text-4xl font-normal text-[#FFF6E8]">
            {t('story.loadingWorldTitle')}
          </h2>
          <p className="text-xs sm:text-sm text-[#F5F0E7]/72">
            {t('story.loadingWorldSubtitle')}
          </p>
        </div>

        <div className="space-y-2.5">
          <div className="h-1.5 w-full rounded-full bg-[#202B48] overflow-hidden">
            <div
              className="h-full bg-[#F3CD82] transition-[width] duration-200"
              style={{ width: `${pct}%` }}
            />
          </div>
          <div className="flex items-center justify-between text-[11px] text-[#F5F0E7]/75 tabular-nums">
            <span className="inline-flex items-center gap-1.5">
              <Loader2 className="w-3.5 h-3.5 animate-spin text-[#F3CD82]" aria-hidden="true" />
              <span>
                {progress.activeItemLabel} ({progress.loadedAssets}/{progress.totalAssets})
              </span>
            </span>
            <span>{pct}%</span>
          </div>
        </div>
      </div>
    </div>
  );
};
