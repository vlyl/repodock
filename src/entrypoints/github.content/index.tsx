import { createShadowRootUi, defineContentScript } from '#imports';
import { createRoot } from 'react-dom/client';
import type { Root } from 'react-dom/client';
import { getSettings, watchSettings } from '@/core/settings';
import { ContextController } from '@/lib/context-controller';
import { setDiagnosticsEnabled } from '@/lib/logger';
import { onContextRequest } from '@/lib/messaging';
import { setStickyHeader } from '@/lib/sticky-header';
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
    let stickyEnabled = false;
    const applySettings = (settings: Awaited<ReturnType<typeof getSettings>>): void => {
      setDiagnosticsEnabled(settings.developerDiagnostics);
      stickyEnabled = settings.stickyHeader;
      setStickyHeader(document, settings.stickyHeader);
    };
    void getSettings().then(applySettings);
    watchSettings(applySettings);

    const controller = new ContextController();
    // Re-measure GitHub's header after client-side navigation: its height differs
    // between repo and non-repo pages and it may be re-rendered.
    controller.subscribe(() => {
      if (stickyEnabled) setStickyHeader(document, true);
    });
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

    ctx.onInvalidated(() => controller.stop());
  },
});
