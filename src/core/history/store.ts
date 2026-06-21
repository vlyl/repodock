import type { StorageItemKey } from '#imports';
import type { GitHubContext } from '../context/types';
import { getSettings } from '../settings/store';
import { PersistentValue } from '../storage/persistent-value';
import { historyStateSchema } from './schema';
import { clearUnpinned, recordVisit, removeEntry, setPinned } from './operations';
import { emptyHistory, HISTORY_SCHEMA_VERSION } from './types';
import type { HistoryEntry, HistoryState } from './types';

/** History is local-only and never synced between browsers. */
export const HISTORY_KEY: StorageItemKey = 'local:repodock.history';

export const historyStore = new PersistentValue<HistoryState>({
  key: HISTORY_KEY,
  version: HISTORY_SCHEMA_VERSION,
  schema: historyStateSchema,
  defaults: emptyHistory,
});

export function getHistory(): Promise<HistoryState> {
  return historyStore.get();
}

/**
 * Record a visit, honoring the user's `recordHistory` toggle and `historyLimit`.
 * A no-op (returning current state) when recording is disabled.
 */
export async function recordContext(
  ctx: GitHubContext,
  now: number = Date.now(),
): Promise<HistoryState> {
  const settings = await getSettings();
  if (!settings.recordHistory) return historyStore.get();
  return historyStore.update((state) => recordVisit(state, ctx, now, settings.historyLimit));
}

export function pinEntry(key: string): Promise<HistoryState> {
  return historyStore.update((state) => setPinned(state, key, true));
}

/** Pin an entry, persisting it to the owned store first if it isn't there yet
 *  (e.g. a browser-imported entry the user chose to pin). */
export function savePinnedEntry(entry: HistoryEntry): Promise<HistoryState> {
  return historyStore.update((state) => {
    if (state.entries.some((existing) => existing.key === entry.key)) {
      return setPinned(state, entry.key, true);
    }
    return { entries: [{ ...entry, pinned: true }, ...state.entries] };
  });
}

export function unpinEntry(key: string): Promise<HistoryState> {
  return historyStore.update((state) => setPinned(state, key, false));
}

export function removeHistoryEntry(key: string): Promise<HistoryState> {
  return historyStore.update((state) => removeEntry(state, key));
}

export function clearUnpinnedHistory(): Promise<HistoryState> {
  return historyStore.update((state) => clearUnpinned(state));
}

export function clearAllHistory(): Promise<HistoryState> {
  return historyStore.set(emptyHistory());
}

export function watchHistory(callback: (state: HistoryState) => void): () => void {
  return historyStore.watch(callback);
}
