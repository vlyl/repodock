import { useEffect, useMemo, useState } from 'react';
import type { HistoryEntry } from '@/core/history';
import { mergeHistories } from '@/core/history';
import { requestBrowserHistory } from '@/lib/messaging';
import { useHistory } from './useHistory';

export interface GitHubHistory {
  /** Owned history merged with browser-imported entries (deduped). */
  entries: HistoryEntry[];
  /** Keys that exist in the owned store (vs. browser-only imports). */
  ownedKeys: Set<string>;
}

/**
 * Combine the extension's owned history with the browser's github.com history
 * (fetched via the background when `importBrowserHistory` is enabled).
 */
export function useGitHubHistory(importBrowserHistory: boolean): GitHubHistory {
  const { entries: owned } = useHistory();
  const [imported, setImported] = useState<HistoryEntry[]>([]);

  useEffect(() => {
    if (!importBrowserHistory) {
      setImported([]);
      return;
    }
    let active = true;
    void requestBrowserHistory().then((entries) => {
      if (active) setImported(entries);
    });
    return () => {
      active = false;
    };
  }, [importBrowserHistory]);

  return useMemo(
    () => ({
      entries: mergeHistories(owned, imported),
      ownedKeys: new Set(owned.map((entry) => entry.key)),
    }),
    [owned, imported],
  );
}
