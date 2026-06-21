import { browser } from '#imports';
import type { GitHubContext } from '../core/context/types';
import type { HistoryEntry } from '../core/history/types';

/** Options for a browser-history request. */
export interface BrowserHistoryQuery {
  sinceDays?: number;
  maxResults?: number;
}

/** Messages sent to a tab's content script. */
export interface RepoDockRequest {
  type: 'repodock:get-context';
}

/** Messages sent to the background script. */
export interface BackgroundRequest {
  type: 'repodock:open-options';
}

/** Responses from a tab's content script. */
export interface RepoDockResponse {
  type: 'repodock:context';
  context: GitHubContext | null;
}

function isResponse(value: unknown): value is RepoDockResponse {
  return (
    typeof value === 'object' &&
    value !== null &&
    (value as { type?: unknown }).type === 'repodock:context'
  );
}

function isRequest(value: unknown): value is RepoDockRequest {
  return (
    typeof value === 'object' &&
    value !== null &&
    (value as { type?: unknown }).type === 'repodock:get-context'
  );
}

/**
 * Ask the content script in a tab for its current resolved context. Returns
 * `null` when the tab has no RepoDock content script (e.g. a non-GitHub page).
 */
export async function requestContextFromTab(tabId: number): Promise<GitHubContext | null> {
  try {
    const response: unknown = await browser.tabs.sendMessage(tabId, {
      type: 'repodock:get-context',
    } satisfies RepoDockRequest);
    return isResponse(response) ? response.context : null;
  } catch {
    // No receiving content script in the tab.
    return null;
  }
}

/**
 * Register a content-script handler that replies to context requests. Returns an
 * unregister function.
 */
export function onContextRequest(getContext: () => GitHubContext | null): () => void {
  const handler = (
    message: unknown,
    _sender: unknown,
    sendResponse: (response: RepoDockResponse) => void,
  ): boolean | undefined => {
    if (!isRequest(message)) return undefined;
    sendResponse({ type: 'repodock:context', context: getContext() });
    return true;
  };
  browser.runtime.onMessage.addListener(handler);
  return () => browser.runtime.onMessage.removeListener(handler);
}

/** Ask the background script to open the options page. */
export async function openOptionsPage(): Promise<void> {
  await browser.runtime.sendMessage({ type: 'repodock:open-options' } satisfies BackgroundRequest);
}

/** Register a background handler that opens the options page on request. */
export function onOpenOptionsRequest(open: () => void): void {
  browser.runtime.onMessage.addListener((message: unknown) => {
    if (
      typeof message === 'object' &&
      message !== null &&
      (message as { type?: unknown }).type === 'repodock:open-options'
    ) {
      open();
    }
    return undefined;
  });
}

function isBrowserHistoryRequest(value: unknown): value is BrowserHistoryQuery & { type: string } {
  return (
    typeof value === 'object' &&
    value !== null &&
    (value as { type?: unknown }).type === 'repodock:get-browser-history'
  );
}

/**
 * Ask the background script for the browser's github.com history (the `history`
 * API is unavailable in content scripts). Returns `[]` on any failure.
 */
export async function requestBrowserHistory(
  query: BrowserHistoryQuery = {},
): Promise<HistoryEntry[]> {
  try {
    const response: unknown = await browser.runtime.sendMessage({
      type: 'repodock:get-browser-history',
      ...query,
    });
    if (
      typeof response === 'object' &&
      response !== null &&
      Array.isArray((response as { entries?: unknown }).entries)
    ) {
      return (response as { entries: HistoryEntry[] }).entries;
    }
    return [];
  } catch {
    return [];
  }
}

/** Register the background handler that serves browser-history requests. */
export function onBrowserHistoryRequest(
  handler: (query: BrowserHistoryQuery) => Promise<HistoryEntry[]>,
): void {
  browser.runtime.onMessage.addListener(
    (
      message: unknown,
      _sender: unknown,
      sendResponse: (response: { entries: HistoryEntry[] }) => void,
    ) => {
      if (!isBrowserHistoryRequest(message)) return undefined;
      handler({ sinceDays: message.sinceDays, maxResults: message.maxResults })
        .then((entries) => sendResponse({ entries }))
        .catch(() => sendResponse({ entries: [] }));
      return true; // keep the channel open for the async response
    },
  );
}
