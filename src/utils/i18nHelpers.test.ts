import test from 'node:test';
import assert from 'node:assert/strict';
import en from '../i18n/locales/en.json';
import hi from '../i18n/locales/hi.json';
import te from '../i18n/locales/te.json';
import { INDIC_UI_LOCALES } from '../i18n/locales/indicLocales';
import { WORLD_UI_LOCALES } from '../i18n/locales/worldLocales';
import { getTranslatedChapterContent } from '../i18n/chaptersTranslations';
import {
  collectLeafKeys,
  getTranslationValue,
  isSupportedLocale,
  resolveInitialLocale,
  SUPPORTED_LOCALES,
  toCoreLocale,
  type SupportedLocale,
} from './i18nHelpers';

test('en, hi, and te locales have identical translation key parity', () => {
  const enKeys = collectLeafKeys(en as Record<string, unknown>);
  const hiKeys = collectLeafKeys(hi as Record<string, unknown>);
  const teKeys = collectLeafKeys(te as Record<string, unknown>);

  assert.deepEqual(hiKeys, enKeys, 'Hindi locale keys must match English keys');
  assert.deepEqual(teKeys, enKeys, 'Telugu locale keys must match English keys');
  assert.ok(enKeys.length > 50);
});

test('every translation value across en, hi, te is non-empty', () => {
  const enKeys = collectLeafKeys(en as Record<string, unknown>);
  for (const key of enKeys) {
    assert.ok(getTranslationValue(en as Record<string, unknown>, key)?.trim(), `Missing en: ${key}`);
    assert.ok(getTranslationValue(hi as Record<string, unknown>, key)?.trim(), `Missing hi: ${key}`);
    assert.ok(getTranslationValue(te as Record<string, unknown>, key)?.trim(), `Missing te: ${key}`);
  }
});

test('supports exactly 18 languages and validates all codes cleanly', () => {
  assert.equal(SUPPORTED_LOCALES.length, 18);

  const uniqueCodes = new Set(SUPPORTED_LOCALES.map((item) => item.code));
  assert.equal(uniqueCodes.size, 18);

  for (const item of SUPPORTED_LOCALES) {
    assert.equal(isSupportedLocale(item.code), true, `Expected ${item.code} to be supported`);
    assert.equal(resolveInitialLocale(item.code), item.code);
    assert.ok(item.nativeLabel.trim().length > 0);
    assert.ok(item.englishName.trim().length > 0);
    assert.ok(item.shortLabel.trim().length > 0);
  }

  assert.equal(isSupportedLocale('xx'), false);
  assert.equal(resolveInitialLocale('invalid'), 'en');
  assert.equal(resolveInitialLocale(null), 'en');
  assert.equal(toCoreLocale('hi'), 'hi');
  assert.equal(toCoreLocale('te'), 'te');
  assert.equal(toCoreLocale('fr'), 'en');
  assert.equal(toCoreLocale('ja'), 'en');
});

test('all 18 languages provide non-empty UI strings for key sections', () => {
  const allDictionaries: Record<SupportedLocale, Record<string, unknown>> = {
    en: en as Record<string, unknown>,
    hi: hi as Record<string, unknown>,
    te: te as Record<string, unknown>,
    ...INDIC_UI_LOCALES,
    ...WORLD_UI_LOCALES,
  };

  const requiredKeys = [
    'site.brandShort',
    'nav.languageLabel',
    'hero.headlineAccent',
    'chapters.headlineBanner',
    'chapters.summarySlotTitle',
    'countdown.heading',
    'participation.cta',
  ];

  for (const item of SUPPORTED_LOCALES) {
    const dict = allDictionaries[item.code];
    assert.ok(dict, `Missing UI dictionary for ${item.code}`);
    for (const key of requiredKeys) {
      const value = getTranslationValue(dict, key);
      assert.ok(value && value.trim().length > 0, `Missing ${item.code}:${key}`);
    }
  }
});

test('all 18 chapters have non-empty titles and summaries across all 18 supported languages', () => {
  for (const item of SUPPORTED_LOCALES) {
    const seenEssences = new Set<string>();
    for (let chapter = 1; chapter <= 18; chapter += 1) {
      const entry = getTranslatedChapterContent(chapter, item.code);
      assert.ok(
        entry.title.trim().length > 0,
        `Missing title for chapter ${chapter} in ${item.code}`,
      );
      assert.ok(
        entry.essence.trim().length > 0,
        `Missing essence for chapter ${chapter} in ${item.code}`,
      );
      seenEssences.add(entry.essence);
    }
    assert.equal(
      seenEssences.size,
      18,
      `Expected 18 distinct chapter summaries in ${item.code}`,
    );
  }
});
