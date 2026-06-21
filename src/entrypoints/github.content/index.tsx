import { createShadowRootUi, defineContentScript } from '#imports';
import { createRoot } from 'react-dom/client';
import type { Root } from 'react-dom/client';
import { DEFAULT_SETTINGS, getSettings, watchSettings } from '@/core/settings';
import { ContextController } from '@/lib/context-controller';
import { setDiagnosticsEnabled } from '@/lib/logger';
import { onContextRequest } from '@/lib/messaging';
import { applyPageOffset, removePageOffset } from '@/lib/page-offset';
import { DockApp } from '@/ui/dock/DockApp';
import '@/ui/theme/tokens.css';
import '@/ui/components/controls.css';
import '@/ui/dock/segments.css';
import '@/ui/dock/history.css';
import '@/ui/dock/dock.css';

export default defineContentScript({
  matches: ['https://github.com/*'],
  // Inject styles into the Shadow Root rather than the page, for full isolation.
  cssInjectionMode: 'ui',
  runAt: 'document_end',
  async main(ctx) {
    // Keep diagnostics and the page-offset (reserved sidebar space) in sync with
    // settings, and re-apply the offset after Turbo navigation (which can strip
    // document-level <style> elements from the head).
    let latestSettings = DEFAULT_SETTINGS;
    const onSettings = (settings: typeof DEFAULT_SETTINGS): void => {
      latestSettings = settings;
      setDiagnosticsEnabled(settings.developerDiagnostics);
      applyPageOffset(settings);
    };
    void getSettings().then(onSettings);
    watchSettings(onSettings);

    const reapplyOffset = (): void => applyPageOffset(latestSettings);
    window.addEventListener('wxt:locationchange', reapplyOffset);
    document.addEventListener('turbo:load', reapplyOffset);
    document.addEventListener('turbo:render', reapplyOffset);

    const controller = new ContextController();
    controller.start();
    // Let the popup query the live, DOM-refined context for this tab.
    onContextRequest(() => controller.getContext());

    // Anchor the host to <html> (which Turbo navigation does not replace) so the
    // dock never remounts during client-side navigation.
    const ui = await createShadowRootUi<Root>(ctx, {
      name: 'repodock-dock',
      // 'overlay' makes WXT size the host to 0×0 (it does not affect page
      // layout); 'inline' would leave the host taking up space. The dock itself
      // renders via position: fixed, so it floats over the page.
      position: 'overlay',
      anchor: 'html',
      append: 'first',
      onMount(container) {
        const root = createRoot(container);
        root.render(<DockApp controller={controller} />);
        return root;
      },
      onRemove(root) {
        root?.unmount();
      },
    });
    ui.mount();

    ctx.onInvalidated(() => {
      controller.stop();
      removePageOffset();
      window.removeEventListener('wxt:locationchange', reapplyOffset);
      document.removeEventListener('turbo:load', reapplyOffset);
      document.removeEventListener('turbo:render', reapplyOffset);
    });
  },
});
