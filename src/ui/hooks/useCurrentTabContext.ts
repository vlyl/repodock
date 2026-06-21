import { useEffect, useState } from 'react';
import { browser } from '#imports';
import type { GitHubContext } from '@/core/context';
import { resolveContext } from '@/core/context';
import { requestContextFromTab } from '@/lib/messaging';

const GITHUB_URL_RE = /^https?:\/\/(www\.)?github\.com(\/|$)/;

export interface CurrentTabContext {
  context: GitHubContext | null;
  loading: boolean;
  isGitHub: boolean;
}

/**
 * Resolve the active tab's context for the popup. Prefers the content script's
 * DOM-refined context and falls back to URL-only resolution if the content
 * script has not yet loaded.
 */
export function useCurrentTabContext(): CurrentTabContext {
  const [state, setState] = useState<CurrentTabContext>({
    context: null,
    loading: true,
    isGitHub: false,
  });

  useEffect(() => {
    let active = true;
    void (async () => {
      try {
        const tabs = await browser.tabs.query({ active: true, currentWindow: true });
        const tab = tabs[0];
        const url = tab?.url ?? '';
        const isGitHub = GITHUB_URL_RE.test(url);
        let context = tab?.id !== undefined ? await requestContextFromTab(tab.id) : null;
        if (!context && isGitHub && url) context = resolveContext({ url });
        if (active) setState({ context, loading: false, isGitHub });
      } catch {
        if (active) setState({ context: null, loading: false, isGitHub: false });
      }
    })();
    return () => {
      active = false;
    };
  }, []);

  return state;
}
