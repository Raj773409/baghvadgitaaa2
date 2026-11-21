export type CoreLocale = 'en' | 'hi' | 'te';

export type SupportedLocale =
  | 'en'
  | 'sa'
  | 'hi'
  | 'te'
  | 'ta'
  | 'kn'
  | 'ml'
  | 'mr'
  | 'gu'
  | 'bn'
  | 'es'
  | 'fr'
  | 'de'
  | 'it'
  | 'pt'
  | 'ru'
  | 'zh'
  | 'ja';

export interface LocaleMeta {
  code: SupportedLocale;
  nativeLabel: string;
  headerLabel: string;
  shortLabel: string;
  englishName: string;
  regionTag: 'Indian' | 'Global';
}

export const SUPPORTED_LOCALES: ReadonlyArray<LocaleMeta> = [
  { code: 'en', nativeLabel: 'English', headerLabel: 'English', shortLabel: 'EN', englishName: 'English', regionTag: 'Global' },
  { code: 'sa', nativeLabel: 'संस्कृतम्', headerLabel: 'संस्कृतम्', shortLabel: 'SA', englishName: 'Sanskrit', regionTag: 'Indian' },
  { code: 'hi', nativeLabel: 'हिन्दी', headerLabel: 'हिन्दी', shortLabel: 'HI', englishName: 'Hindi', regionTag: 'Indian' },
  { code: 'te', nativeLabel: 'తెలుగు', headerLabel: 'తెలుగు', shortLabel: 'TE', englishName: 'Telugu', regionTag: 'Indian' },
  { code: 'ta', nativeLabel: 'தமிழ்', headerLabel: 'தமிழ்', shortLabel: 'TA', englishName: 'Tamil', regionTag: 'Indian' },
  { code: 'kn', nativeLabel: 'ಕನ್ನಡ', headerLabel: 'ಕನ್ನಡ', shortLabel: 'KN', englishName: 'Kannada', regionTag: 'Indian' },
  { code: 'ml', nativeLabel: 'മലയാളം', headerLabel: 'മലയാളം', shortLabel: 'ML', englishName: 'Malayalam', regionTag: 'Indian' },
  { code: 'mr', nativeLabel: 'मराठी', headerLabel: 'मराठी', shortLabel: 'MR', englishName: 'Marathi', regionTag: 'Indian' },
  { code: 'gu', nativeLabel: 'ગુજરાતી', headerLabel: 'ગુજરાતી', shortLabel: 'GU', englishName: 'Gujarati', regionTag: 'Indian' },
  { code: 'bn', nativeLabel: 'বাংলা', headerLabel: 'বাংলা', shortLabel: 'BN', englishName: 'Bengali', regionTag: 'Indian' },
  { code: 'es', nativeLabel: 'Español', headerLabel: 'Español', shortLabel: 'ES', englishName: 'Spanish', regionTag: 'Global' },
  { code: 'fr', nativeLabel: 'Français', headerLabel: 'Français', shortLabel: 'FR', englishName: 'French', regionTag: 'Global' },
  { code: 'de', nativeLabel: 'Deutsch', headerLabel: 'Deutsch', shortLabel: 'DE', englishName: 'German', regionTag: 'Global' },
  { code: 'it', nativeLabel: 'Italiano', headerLabel: 'Italiano', shortLabel: 'IT', englishName: 'Italian', regionTag: 'Global' },
  { code: 'pt', nativeLabel: 'Português', headerLabel: 'Português', shortLabel: 'PT', englishName: 'Portuguese', regionTag: 'Global' },
  { code: 'ru', nativeLabel: 'Русский', headerLabel: 'Русский', shortLabel: 'RU', englishName: 'Russian', regionTag: 'Global' },
  { code: 'zh', nativeLabel: '中文', headerLabel: '中文', shortLabel: 'ZH', englishName: 'Chinese', regionTag: 'Global' },
  { code: 'ja', nativeLabel: '日本語', headerLabel: '日本語', shortLabel: 'JA', englishName: 'Japanese', regionTag: 'Global' },
];

const SUPPORTED_LOCALE_SET = new Set<string>(SUPPORTED_LOCALES.map((item) => item.code));

export function isSupportedLocale(value: unknown): value is SupportedLocale {
  return typeof value === 'string' && SUPPORTED_LOCALE_SET.has(value);
}

export function resolveInitialLocale(stored: string | null | undefined): SupportedLocale {
  if (isSupportedLocale(stored)) {
    return stored;
  }
  return 'en';
}

export function getLocaleMeta(code: SupportedLocale): LocaleMeta {
  return SUPPORTED_LOCALES.find((item) => item.code === code) ?? SUPPORTED_LOCALES[0];
}

export function toCoreLocale(locale: SupportedLocale): CoreLocale {
  if (locale === 'hi' || locale === 'te') {
    return locale;
  }
  return 'en';
}

export function pickLocalized<T extends { en: string; hi?: string; te?: string } & Partial<Record<SupportedLocale, string>>>(
  record: T,
  locale: SupportedLocale,
): string {
  const direct = record[locale];
  if (typeof direct === 'string' && direct.trim().length > 0) {
    return direct;
  }
  return record.en;
}

export function getTranslationValue(
  dictionary: Record<string, unknown>,
  keyPath: string,
): string | null {
  const segments = keyPath.split('.');
  let current: unknown = dictionary;
  for (const segment of segments) {
    if (current && typeof current === 'object' && segment in current) {
      current = (current as Record<string, unknown>)[segment];
    } else {
      return null;
    }
  }
  return typeof current === 'string' ? current : null;
}

export function collectLeafKeys(obj: Record<string, unknown>, prefix = ''): string[] {
  const keys: string[] = [];
  for (const [k, v] of Object.entries(obj)) {
    const next = prefix ? `${prefix}.${k}` : k;
    if (v && typeof v === 'object' && !Array.isArray(v)) {
      keys.push(...collectLeafKeys(v as Record<string, unknown>, next));
    } else if (typeof v === 'string') {
      keys.push(next);
    }
  }
  return keys.sort();
}
