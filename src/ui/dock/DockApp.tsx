import type { ReactNode } from 'react';
import { updateSettings } from '@/core/settings';
import { t } from '@/i18n';
import type { ContextController } from '@/lib/context-controller';
import { useResolvedTheme } from '@/ui/theme/useTheme';
import { useSettings } from '@/ui/hooks/useSettings';
import { useContextController } from '@/ui/hooks/useContextController';
import { Dock } from './Dock';

export interface DockAppProps {
  controller: ContextController;
}

/**
 * Root of the in-page dock. The recent list is shown by default and stays open
 * until the user collapses it; its open state is persisted in settings.
 */
export function DockApp({ controller }: DockAppProps): ReactNode {
  const { settings, ready } = useSettings();
  const context = useContextController(controller);
  const theme = useResolvedTheme(settings?.theme ?? 'system');

  if (!ready || !settings?.visible) return null;

  return (
    <div
      className="rd-root"
      data-rd-theme={theme}
      data-rd-density={settings.density}
      role="complementary"
      aria-label={t('dock.regionLabel')}
    >
      <Dock
        context={context}
        settings={settings}
        historyOpen={settings.recentOpen}
        onToggleHistory={() => void updateSettings({ recentOpen: !settings.recentOpen })}
        onToggleInvolved={(next) => void updateSettings({ historyInvolvedOnly: next })}
      />
    </div>
  );
}
