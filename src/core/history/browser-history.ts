import { browser } from '#imports';
import { resolveContext } from '../context';
import { cleanItemTitle } from '../context/dom';
import type { HistoryEntry } from './types';
import { entryFromContext } from './operations';

const GITHUB_URL_RE = /^https?:\/\/(www\.)?github\.com\//i;

/** The subset of a browser HistoryItem we read. */
export interface BrowserHistoryItem {
  url?: string;
  title?: string;
  lastVisitTime?: number;
  visitCount?: number;
}

export interface BrowserHistoryOptions {
  maxResults?: number;
  sinceDays?: number;
}

/**
 * Map a single browser history item to a RepoDock entry, or `null` if it is not
 * a recordable github.com repository page. Item titles (issue/PR/discussion) are
 * taken from the browser's page title since URL-only resolution can't see them.
 */
export function browserItemToEntry(item: BrowserHistoryItem, now: number): HistoryEntry | null {
  const url = item.url;
  if (!url || !GITHUB_URL_RE.test(url)) return null;

  const ctx = resolveContext({ url, now });
  const entry = entryFromContext(ctx, item.lastVisitTime ?? now);
  if (!entry) return null;

  const lastVisited = item.lastVisitTime ?? now;
  const result: HistoryEntry = {
    ...entry,
    lastVisited,
    firstVisited: lastVisited,
    visitCount: Math.max(1, Math.floor(item.visitCount ?? 1)),
  };

  // Enrich item pages (which URL-only resolution can't title) with the page title.
  const itemType = ctx.item?.type;
  if (item.title && (itemType === 'pull' || itemType === 'issue' || itemType === 'discussion')) {
    const cleaned = cleanItemTitle(item.title);
    if (cleaned) {
      result.title = ctx.repository ? `${ctx.repository.nwo} · ${cleaned}` : cleaned;
    }
  }

  return result;
}

/**
 * Query the browser's github.com history and map it to RepoDock entries,
 * deduplicated by canonical key. Returns `[]` if the history API is unavailable
 * (e.g. called from a context without the permission). Runs in the background or
 * an extension page, not a content script.
 */
export async function queryGitHubBrowserHistory(
  options: BrowserHistoryOptions = {},
  now: number = Date.now(),
): Promise<HistoryEntry[]> {
  const maxResults = options.maxResults ?? 500;
  const sinceDays = options.sinceDays ?? 90;
  const startTime = now - sinceDays * 24 * 60 * 60 * 1000;

  let items: BrowserHistoryItem[];
  try {
    items = await browser.history.search({ text: 'github.com', startTime, maxResults });
  } catch {
    return [];
  }

  const entries: HistoryEntry[] = [];
  const seen = new Set<string>();
  for (const item of items) {
    const entry = browserItemToEntry(item, now);
    if (!entry || seen.has(entry.key)) continue;
    seen.add(entry.key);
    entries.push(entry);
  }
  return entries;
}
