import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import en from './locales/en.json';
import hi from './locales/hi.json';
import te from './locales/te.json';
import { INDIC_UI_LOCALES } from './locales/indicLocales';
import { WORLD_UI_LOCALES } from './locales/worldLocales';
import {
  getTranslatedChapterContent,
  type ChapterTranslationEntry,
} from './chaptersTranslations';
import {
  getLocaleMeta,
  getTranslationValue,
  pickLocalized,
  resolveInitialLocale,
  SUPPORTED_LOCALES,
  toCoreLocale,
  type CoreLocale,
  type LocaleMeta,
  type SupportedLocale,
} from '../utils/i18nHelpers';
import type { LocalizedText } from '../types/cms';

const STORAGE_KEY = 'mahotsav_2027_locale';

export const UI_DICTIONARIES: Record<SupportedLocale, Record<string, unknown>> = {
  en: en as Record<string, unknown>,
  hi: hi as Record<string, unknown>,
  te: te as Record<string, unknown>,
  ...INDIC_UI_LOCALES,
  ...WORLD_UI_LOCALES,
};

interface I18nContextValue {
  locale: SupportedLocale;
  contentLocale: CoreLocale;
  currentLocaleMeta: LocaleMeta;
  supportedLocales: ReadonlyArray<LocaleMeta>;
  setLocale: (next: SupportedLocale) => void;
  t: (keyPath: string) => string;
  getChapterContent: (chapterNumber: number) => ChapterTranslationEntry;
  localizeText: (record: LocalizedText) => string;
}

const I18nContext = createContext<I18nContextValue | null>(null);

export const I18nProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [locale, setLocaleState] = useState<SupportedLocale>(() => {
    try {
      const saved = typeof window !== 'undefined' ? window.localStorage.getItem(STORAGE_KEY) : null;
      return resolveInitialLocale(saved);
    } catch {
      return 'en';
    }
  });

  useEffect(() => {
    document.documentElement.lang = locale;
    try {
      window.localStorage.setItem(STORAGE_KEY, locale);
    } catch {
      // Ignore storage failures in restricted contexts
    }
  }, [locale]);

  const setLocale = useCallback((next: SupportedLocale) => {
    setLocaleState(next);
  }, []);

  const t = useCallback(
    (keyPath: string) => {
      const activeDict = UI_DICTIONARIES[locale];
      if (activeDict) {
        const primary = getTranslationValue(activeDict, keyPath);
        if (primary !== null) return primary;
      }
      const fallback = getTranslationValue(UI_DICTIONARIES.en, keyPath);
      return fallback ?? keyPath;
    },
    [locale],
  );

  const getChapterContent = useCallback(
    (chapterNumber: number) => getTranslatedChapterContent(chapterNumber, locale),
    [locale],
  );

  const localizeText = useCallback(
    (record: LocalizedText) => pickLocalized(record, locale),
    [locale],
  );

  const contentLocale = useMemo(() => toCoreLocale(locale), [locale]);
  const currentLocaleMeta = useMemo(() => getLocaleMeta(locale), [locale]);

  const value = useMemo(
    () => ({
      locale,
      contentLocale,
      currentLocaleMeta,
      supportedLocales: SUPPORTED_LOCALES,
      setLocale,
      t,
      getChapterContent,
      localizeText,
    }),
    [locale, contentLocale, currentLocaleMeta, setLocale, t, getChapterContent, localizeText],
  );

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
};

export function useI18n(): I18nContextValue {
  const ctx = useContext(I18nContext);
  if (!ctx) {
    throw new Error('useI18n must be used within an I18nProvider');
  }
  return ctx;
}
