import { GITA_CHAPTER_CATALOG } from '../content/scriptureContent';
import type { SupportedLocale } from '../utils/i18nHelpers';
import {
  CHAPTER_INDIC_TRANSLATIONS,
  type ChapterTranslationEntry,
  type ExtraIndicLocale,
} from './chaptersIndicTranslations';
import {
  CHAPTER_WORLD_TRANSLATIONS,
  type ExtraWorldLocale,
} from './chaptersWorldTranslations';

export type { ChapterTranslationEntry };

export function getTranslatedChapterContent(
  chapterNumber: number,
  locale: SupportedLocale,
): ChapterTranslationEntry {
  const base =
    GITA_CHAPTER_CATALOG.find((ch) => ch.chapterNumber === chapterNumber) ??
    GITA_CHAPTER_CATALOG[0];

  if (locale === 'en' || locale === 'hi' || locale === 'te') {
    return {
      title: base.title[locale],
      essence: base.essence[locale],
    };
  }

  if (locale in CHAPTER_INDIC_TRANSLATIONS) {
    const entry = CHAPTER_INDIC_TRANSLATIONS[locale as ExtraIndicLocale]?.[chapterNumber];
    if (entry) return entry;
  }

  if (locale in CHAPTER_WORLD_TRANSLATIONS) {
    const entry = CHAPTER_WORLD_TRANSLATIONS[locale as ExtraWorldLocale]?.[chapterNumber];
    if (entry) return entry;
  }

  return {
    title: base.title.en,
    essence: base.essence.en,
  };
}
