import { browser, defineBackground } from '#imports';
import { queryGitHubBrowserHistory } from '@/core/history';
import { getSettings, updateSettings, watchSettings } from '@/core/settings';
import { logger, setDiagnosticsEnabled } from '@/lib/logger';
import { onBrowserHistoryRequest, onOpenOptionsRequest } from '@/lib/messaging';

/**
 * The background script owns cross-cutting concerns: the keyboard command that
 * toggles dock visibility (by flipping the shared `visible` setting, which every
 * content script observes), and keeping the diagnostics log level in sync.
 */
export default defineBackground(() => {
  void getSettings().then((settings) => setDiagnosticsEnabled(settings.developerDiagnostics));
  watchSettings((settings) => setDiagnosticsEnabled(settings.developerDiagnostics));

  onOpenOptionsRequest(() => {
    void browser.runtime.openOptionsPage().catch((error) => {
      logger.error('Failed to open options page', error);
    });
  });

  // Serve the browser's github.com history to content scripts/popup (the
  // `history` API is unavailable to content scripts), honoring the user toggle.
  onBrowserHistoryRequest(async (query) => {
    const settings = await getSettings();
    if (!settings.importBrowserHistory) return [];
    return queryGitHubBrowserHistory(query);
  });

  browser.commands.onCommand.addListener((command) => {
    if (command !== 'toggle-dock') return;
    void (async () => {
      try {
        const settings = await getSettings();
        await updateSettings({ visible: !settings.visible });
      } catch (error) {
        logger.error('Failed to toggle dock visibility', error);
      }
    })();
  });
});
