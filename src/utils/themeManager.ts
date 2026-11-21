export type ThemePreference = 'light' | 'dark' | 'system';
export type ResolvedTheme = 'light' | 'dark';

export const THEME_STORAGE_KEY = 'eternal.royalGold.theme.v1';

export function isValidThemePreference(value: unknown): value is ThemePreference {
  return value === 'light' || value === 'dark' || value === 'system';
}

export function resolveEffectiveTheme(
  preference: ThemePreference,
  systemPrefersDark: boolean,
): ResolvedTheme {
  if (preference === 'dark') return 'dark';
  if (preference === 'light') return 'light';
  return systemPrefersDark ? 'dark' : 'light';
}

export function nextThemePreference(current: ThemePreference): ThemePreference {
  if (current === 'light') return 'dark';
  if (current === 'dark') return 'system';
  return 'light';
}

export function loadStoredThemePreference(
  storage: Pick<Storage, 'getItem'> | null | undefined,
): ThemePreference {
  try {
    if (!storage) return 'light';
    const raw = storage.getItem(THEME_STORAGE_KEY);
    return isValidThemePreference(raw) ? raw : 'light';
  } catch {
    return 'light';
  }
}

export function saveThemePreference(
  storage: Pick<Storage, 'setItem'> | null | undefined,
  preference: ThemePreference,
): void {
  try {
    if (storage && isValidThemePreference(preference)) {
      storage.setItem(THEME_STORAGE_KEY, preference);
    }
  } catch {
    // Ignore storage quota / sandbox restrictions
  }
}
