import { useEffect, useRef, useState } from 'react';
import type { ReactNode } from 'react';
import { updateSettings } from '@/core/settings';
import { t } from '@/i18n';
import type { ContextController } from '@/lib/context-controller';
import { openOptionsPage } from '@/lib/messaging';
import { useResolvedTheme } from '@/ui/theme/useTheme';
import { useSettings } from '@/ui/hooks/useSettings';
import { useContextController } from '@/ui/hooks/useContextController';
import { Dock } from './Dock';

export interface DockAppProps {
  controller: ContextController;
}

/**
 * Root of the in-page dock. Owns visibility and history-panel state, resolves
 * the theme, and (for the horizontal popover only) closes the recent list on
 * Escape or an outside click. Vertical docks show the list inline as a sidebar.
 */
export function DockApp({ controller }: DockAppProps): ReactNode {
  const { settings, ready } = useSettings();
  const context = useContextController(controller);
  const theme = useResolvedTheme(settings?.theme ?? 'system');

  const [historyOpen, setHistoryOpen] = useState<boolean | null>(null);
  const rootRef = useRef<HTMLDivElement>(null);

  const isVertical = !!settings && (settings.position === 'left' || settings.position === 'right');
  // The recent list defaults to open for vertical (sidebar) docks.
  const effectiveHistoryOpen = historyOpen ?? isVertical;
  const popoverOpen = !!settings && !isVertical && effectiveHistoryOpen;

  // Escape closes the horizontal popover.
  useEffect(() => {
    if (!popoverOpen) return;
    const onKey = (event: KeyboardEvent): void => {
      if (event.key === 'Escape') setHistoryOpen(false);
    };
    window.addEventListener('keydown', onKey, true);
    return () => window.removeEventListener('keydown', onKey, true);
  }, [popoverOpen]);

  // A click outside the dock closes the horizontal popover.
  useEffect(() => {
    if (!popoverOpen) return;
    const onPointerDown = (event: MouseEvent): void => {
      const root = rootRef.current;
      if (root && !event.composedPath().includes(root)) setHistoryOpen(false);
    };
    window.addEventListener('mousedown', onPointerDown, true);
    return () => window.removeEventListener('mousedown', onPointerDown, true);
  }, [popoverOpen]);

  if (!ready || !settings?.visible) return null;

  return (
    <div
      ref={rootRef}
      className="rd-root"
      data-rd-theme={theme}
      data-rd-density={settings.density}
      role="complementary"
      aria-label={t('dock.regionLabel')}
    >
      <Dock
        context={context}
        settings={settings}
        collapsed={settings.collapsed}
        historyOpen={effectiveHistoryOpen}
        onToggleCollapsed={() => void updateSettings({ collapsed: !settings.collapsed })}
        onToggleHistory={() => setHistoryOpen(!effectiveHistoryOpen)}
        onCloseHistory={() => setHistoryOpen(false)}
        onHide={() => void updateSettings({ visible: false })}
        onOpenSettings={() => void openOptionsPage()}
      />
    </div>
  );
}
