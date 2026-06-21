import type { StorageItemKey } from '#imports';
import { PersistentValue } from '../storage/persistent-value';
import { settingsSchema } from './schema';
import { DEFAULT_SETTINGS, SETTINGS_SCHEMA_VERSION } from './types';
import type { Settings } from './types';

/** Settings live in sync storage so they follow the user across browsers. */
export const SETTINGS_KEY: StorageItemKey = 'sync:repodock.settings';
/** A local mirror used when sync storage is unavailable. */
export const SETTINGS_FALLBACK_KEY: StorageItemKey = 'local:repodock.settings';

export const settingsStore = new PersistentValue<Settings>({
  key: SETTINGS_KEY,
  fallbackKey: SETTINGS_FALLBACK_KEY,
  version: SETTINGS_SCHEMA_VERSION,
  schema: settingsSchema,
  defaults: () => ({ ...DEFAULT_SETTINGS }),
});

export function getSettings(): Promise<Settings> {
  return settingsStore.get();
}

export function saveSettings(settings: Settings): Promise<Settings> {
  return settingsStore.set(settings);
}

export function updateSettings(patch: Partial<Settings>): Promise<Settings> {
  return settingsStore.update((current) => ({ ...current, ...patch }));
}

export function watchSettings(callback: (settings: Settings) => void): () => void {
  return settingsStore.watch(callback);
}

export function resetSettings(): Promise<Settings> {
  return settingsStore.set({ ...DEFAULT_SETTINGS });
}
