import React, { useEffect, useId, useRef, useState } from 'react';
import { Check, ChevronDown, Globe } from 'lucide-react';
import { useI18n } from '../../i18n';
import type { SupportedLocale } from '../../utils/i18nHelpers';

interface LanguageSelectorProps {
  tone?: 'light' | 'dark';
  compact?: boolean;
}

export const LanguageSelector: React.FC<LanguageSelectorProps> = ({
  tone = 'light',
  compact = false,
}) => {
  const { locale, currentLocaleMeta, supportedLocales, setLocale, t } = useI18n();
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const triggerRef = useRef<HTMLButtonElement | null>(null);
  const optionRefs = useRef<Array<HTMLButtonElement | null>>([]);
  const listboxId = useId();

  useEffect(() => {
    if (!open) return;

    const handleOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setOpen(false);
      }
    };

    const handleKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        event.preventDefault();
        setOpen(false);
        triggerRef.current?.focus();
      }
    };

    document.addEventListener('mousedown', handleOutside);
    window.addEventListener('keydown', handleKey);
    return () => {
      document.removeEventListener('mousedown', handleOutside);
      window.removeEventListener('keydown', handleKey);
    };
  }, [open]);

  const handleSelect = (code: SupportedLocale) => {
    setLocale(code);
    setOpen(false);
    triggerRef.current?.focus();
  };

  const handleOptionKeyDown = (
    event: React.KeyboardEvent<HTMLButtonElement>,
    index: number,
  ) => {
    const count = supportedLocales.length;
    if (event.key === 'ArrowDown') {
      event.preventDefault();
      optionRefs.current[(index + 1) % count]?.focus();
    } else if (event.key === 'ArrowUp') {
      event.preventDefault();
      optionRefs.current[(index - 1 + count) % count]?.focus();
    } else if (event.key === 'Home') {
      event.preventDefault();
      optionRefs.current[0]?.focus();
    } else if (event.key === 'End') {
      event.preventDefault();
      optionRefs.current[count - 1]?.focus();
    }
  };

  const triggerStyles =
    tone === 'dark'
      ? 'border-[#D6A447]/45 bg-[#101426]/55 text-[#FFF6E8] hover:border-[#F3CD82] hover:bg-[#101426]/80'
      : 'border-[var(--color-border)] bg-[var(--surface-elevated)]/85 text-[var(--color-ink)] hover:border-[var(--color-bronze)] hover:bg-[var(--surface-elevated)]';

  const accentBadgeStyle =
    tone === 'dark' ? 'text-[#F3CD82]' : 'text-[var(--color-bronze)]';

  return (
    <div ref={containerRef} className="relative inline-block text-left">
      <button
        ref={triggerRef}
        type="button"
        data-testid="global-language-trigger"
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-controls={listboxId}
        aria-label={`${t('nav.languageLabel')} (${currentLocaleMeta.englishName})`}
        onClick={() => setOpen((prev) => !prev)}
        className={`inline-flex items-center gap-2 min-h-[38px] ${
          compact ? 'px-2.5 py-1.5' : 'px-3.5 py-1.5'
        } rounded-full border text-xs font-medium whitespace-nowrap shrink-0 transition-colors duration-150 cursor-pointer focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#F3CD82] ${triggerStyles}`}
      >
        <Globe className={`w-3.5 h-3.5 shrink-0 ${accentBadgeStyle}`} aria-hidden="true" />
        <span lang={currentLocaleMeta.code} className="leading-none">
          {compact ? currentLocaleMeta.shortLabel : currentLocaleMeta.nativeLabel}
        </span>
        {!compact && (
          <span
            aria-hidden="true"
            className={`text-[10px] font-semibold tracking-[0.08em] uppercase opacity-75 ${accentBadgeStyle}`}
          >
            {currentLocaleMeta.shortLabel}
          </span>
        )}
        <ChevronDown
          className={`w-3.5 h-3.5 shrink-0 transition-transform duration-150 ${
            open ? 'rotate-180' : ''
          }`}
          aria-hidden="true"
        />
      </button>

      {open && (
        <div
          id={listboxId}
          role="listbox"
          aria-label={t('nav.languageLabel')}
          data-testid="global-language-menu"
          className="absolute right-0 mt-2 z-50 w-[280px] sm:w-[390px] rounded-xl border border-[#F3CD82]/35 bg-[#101426]/98 backdrop-blur-md text-[#FFF6E8] shadow-[0_22px_54px_rgba(6,8,18,0.68)] overflow-hidden"
        >
          <div className="px-4 py-2.5 border-b border-[#F3CD82]/20 flex items-center justify-between gap-2 bg-[#161C34]/90">
            <span className="text-[10px] font-semibold tracking-[0.16em] uppercase text-[#F3CD82]">
              {t('nav.languageLabel')}
            </span>
            <span className="text-[10px] font-medium tracking-[0.1em] uppercase text-[#FFF6E8]/65 tabular-nums">
              {supportedLocales.length}
            </span>
          </div>

          <div className="p-2 grid grid-cols-1 sm:grid-cols-2 gap-1 max-h-[68vh] overflow-y-auto">
            {supportedLocales.map((item, idx) => {
              const active = locale === item.code;
              return (
                <button
                  key={item.code}
                  ref={(el) => {
                    optionRefs.current[idx] = el;
                  }}
                  type="button"
                  role="option"
                  aria-selected={active}
                  lang={item.code}
                  data-locale-option={item.code}
                  onClick={() => handleSelect(item.code)}
                  onKeyDown={(e) => handleOptionKeyDown(e, idx)}
                  className={`w-full text-left px-3 py-2 rounded-lg flex items-center justify-between gap-2 transition-colors cursor-pointer focus-visible:outline-2 focus-visible:outline-[#F3CD82] ${
                    active
                      ? 'bg-[#202B48] text-[#F3CD82] border border-[#F3CD82]/55'
                      : 'text-[#FFF6E8]/90 hover:bg-[#202B48]/70 border border-transparent'
                  }`}
                >
                  <div className="min-w-0">
                    <span className="block text-[13px] font-medium leading-tight truncate">
                      {item.nativeLabel}
                    </span>
                    <span className="block text-[10px] text-[#FFF6E8]/60 tracking-[0.04em] truncate mt-0.5">
                      {item.shortLabel} · {item.englishName}
                    </span>
                  </div>
                  {active && (
                    <Check
                      className="w-3.5 h-3.5 shrink-0 text-[#F3CD82]"
                      aria-hidden="true"
                    />
                  )}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};
