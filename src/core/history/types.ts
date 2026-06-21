import type { ItemType, PageKind, PathKind, RefType } from '../context/types';

/** The current history schema version, persisted per entry as `parserVersion`. */
export const HISTORY_SCHEMA_VERSION = 1;

/**
 * One recorded GitHub page visit. Only navigation- and display-relevant fields
 * are stored; no page body, comment, issue, or pull-request content is retained.
 */
export interface HistoryEntry {
  /** Dedup key: the sanitized URL without its line anchor. */
  key: string;
  /** Sanitized canonical URL, which may include a line anchor. */
  safeUrl: string;
  nwo?: string;
  owner?: string;
  repo?: string;
  ref?: string;
  refType?: RefType;
  pageKind: PageKind;
  locationLabel: string;
  sectionLabel?: string;
  path?: string;
  pathKind?: PathKind;
  fileName?: string;
  itemType?: ItemType;
  itemId?: string;
  lineStart?: number;
  lineEnd?: number;
  /** Human-readable title for the entry. */
  title: string;
  firstVisited: number;
  lastVisited: number;
  visitCount: number;
  pinned: boolean;
  /**
   * The viewer is involved with this page: they participated in its issue / PR /
   * discussion, or it is in their own namespace. Captured when recorded; absent
   * for entries recorded before this was tracked or imported from the browser.
   */
  involved?: boolean;
  /** The parser/context schema version that produced this entry. */
  parserVersion: number;
}

export interface HistoryState {
  entries: HistoryEntry[];
}

export function emptyHistory(): HistoryState {
  return { entries: [] };
}
