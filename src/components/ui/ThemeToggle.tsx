import React from 'react';
import { Monitor, Moon, Sun } from 'lucide-react';
import { useTheme } from '../../context/ThemeContext';
import type { ThemePreference } from '../../utils/themeManager';

interface ThemeToggleProps {
  tone?: 'light' | 'dark';
  variant?: 'compact' | 'segmented';
}

const OPTIONS: ReadonlyArray<{
  id: ThemePreference;
  label: string;
  shortLabel: string;
  Icon: typeof Sun;
}> = [
  { id: 'light', label: 'Light Theme', shortLabel: 'Light', Icon: Sun },
  { id: 'dark', label: 'Dark Theme', shortLabel: 'Dark', Icon: Moon },
  { id: 'system', label: 'System Theme', shortLabel: 'Auto', Icon: Monitor },
];

export const ThemeToggle: React.FC<ThemeToggleProps> = ({
  tone = 'dark',
  variant = 'compact',
}) => {
  const { preference, resolvedTheme, setPreference, cyclePreference } = useTheme();

  if (variant === 'compact') {
    const active = OPTIONS.find((opt) => opt.id === preference) ?? OPTIONS[0];
    const ActiveIcon = active.Icon;
    const isLightBar = tone === 'light' && resolvedTheme === 'light';

    return (
      <button
        type="button"
        onClick={cyclePreference}
        data-testid="theme-toggle-compact"
        title={`Theme: ${active.label} (click to switch Light / Dark / System)`}
        aria-label={`Theme: ${active.label}`}
        className={`inline-flex items-center justify-center gap-1.5 min-h-[38px] px-2.5 sm:px-3 py-1.5 rounded-full border text-[11px] font-medium tracking-[0.06em] uppercase whitespace-nowrap shrink-0 transition-colors cursor-pointer ${
          isLightBar
            ? 'border-[#D4A537]/45 text-[#17233A] bg-white/75 hover:border-[#9C6B1E]'
            : 'border-[#D4A537]/45 text-[#F7D774] bg-[#17233A]/55 hover:border-[#F7D774] hover:text-[#FFFDF7]'
        }`}
      >
        <ActiveIcon className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
        <span className="hidden lg:inline">{active.shortLabel}</span>
      </button>
    );
  }

  return (
    <div
      role="group"
      aria-label="Color theme mode"
      className="inline-flex items-center rounded-full border border-[#D4A537]/35 bg-[#17233A]/75 p-0.5"
    >
      {OPTIONS.map(({ id, label, shortLabel, Icon }) => {
        const isSelected = preference === id;
        return (
          <button
            key={id}
            type="button"
            onClick={() => setPreference(id)}
            data-testid={`theme-option-${id}`}
            aria-pressed={isSelected}
            aria-label={label}
            className={`inline-flex items-center gap-1.5 min-h-[34px] px-3 py-1 rounded-full text-[11px] font-medium tracking-[0.06em] uppercase whitespace-nowrap shrink-0 transition-colors cursor-pointer ${
              isSelected
                ? 'bg-[#D4A537] text-[#171717]'
                : 'text-[#FFFDF7]/75 hover:text-[#F7D774]'
            }`}
          >
            <Icon className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
            <span>{shortLabel}</span>
          </button>
        );
      })}
    </div>
  );
};
