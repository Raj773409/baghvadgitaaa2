import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  isValidThemePreference,
  loadStoredThemePreference,
  nextThemePreference,
  resolveEffectiveTheme,
  saveThemePreference,
  THEME_STORAGE_KEY,
} from './themeManager.ts';

describe('themeManager', () => {
  it('validates allowed theme preferences', () => {
    assert.equal(isValidThemePreference('light'), true);
    assert.equal(isValidThemePreference('dark'), true);
    assert.equal(isValidThemePreference('system'), true);
    assert.equal(isValidThemePreference('sepia'), false);
    assert.equal(isValidThemePreference(null), false);
  });

  it('resolves system preference dynamically', () => {
    assert.equal(resolveEffectiveTheme('light', true), 'light');
    assert.equal(resolveEffectiveTheme('dark', false), 'dark');
    assert.equal(resolveEffectiveTheme('system', true), 'dark');
    assert.equal(resolveEffectiveTheme('system', false), 'light');
  });

  it('cycles light -> dark -> system -> light', () => {
    assert.equal(nextThemePreference('light'), 'dark');
    assert.equal(nextThemePreference('dark'), 'system');
    assert.equal(nextThemePreference('system'), 'light');
  });

  it('loads and saves safely with storage guards', () => {
    const map = new Map<string, string>();
    const mockStorage = {
      getItem: (k: string) => map.get(k) ?? null,
      setItem: (k: string, v: string) => {
        map.set(k, v);
      },
    };
    assert.equal(loadStoredThemePreference(mockStorage), 'light');
    saveThemePreference(mockStorage, 'dark');
    assert.equal(map.get(THEME_STORAGE_KEY), 'dark');
    assert.equal(loadStoredThemePreference(mockStorage), 'dark');
  });
});
