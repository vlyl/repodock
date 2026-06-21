export type { HistoryEntry, HistoryState } from './types';
export { emptyHistory, HISTORY_SCHEMA_VERSION } from './types';
export { historyEntrySchema, historyStateSchema } from './schema';
export {
  clearUnpinned,
  entryFromContext,
  groupByRepository,
  isRecordable,
  mergeHistories,
  recordVisit,
  removeEntry,
  searchEntries,
  setPinned,
  sortForDisplay,
  trimUnpinned,
  upsertVisit,
} from './operations';
export type { HistoryGroup } from './operations';
export { browserItemToEntry, queryGitHubBrowserHistory } from './browser-history';
export type { BrowserHistoryItem, BrowserHistoryOptions } from './browser-history';
export {
  clearAllHistory,
  clearUnpinnedHistory,
  getHistory,
  historyStore,
  HISTORY_KEY,
  pinEntry,
  recordContext,
  removeHistoryEntry,
  savePinnedEntry,
  unpinEntry,
  watchHistory,
} from './store';
