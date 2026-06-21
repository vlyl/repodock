import { useId } from 'react';
import type { ReactNode } from 'react';
import { CheckIcon, CopyIcon, EyeClosedIcon, GearIcon, HistoryIcon } from '@primer/octicons-react';
import type { GitHubContext } from '@/core/context';
import { buildSegments, contextSummary } from '@/core/context';
import { canonicalKeyFor } from '@/core/context/github-url';
import type { Settings } from '@/core/settings';
import { t } from '@/i18n';
import { IconButton } from '@/ui/components/controls';
import { useCopy } from '@/ui/hooks/useCopy';
import { DockSegments } from './DockSegments';
import { Diagnostics } from './Diagnostics';
import { HistoryPanel } from './HistoryPanel';

export interface DockProps {
  context: GitHubContext | null;
  settings: Settings;
  historyOpen: boolean;
  onToggleHistory: () => void;
  onCloseHistory: () => void;
  onHide: () => void;
  onOpenSettings: () => void;
}

/**
 * The compact dock, anchored to the bottom-left/right corner. When auto-hide is
 * on it collapses to a small handle until hovered (CSS-driven). The recent list
 * opens on demand and pops up above the bar, so the dock never covers GitHub's
 * content unless the user opens it.
 */
export function Dock({
  context,
  settings,
  historyOpen,
  onToggleHistory,
  onCloseHistory,
  onHide,
  onOpenSettings,
}: DockProps): ReactNode {
  const { copied, copy } = useCopy();
  const historyHeadingId = useId();

  const segments = context ? buildSegments(context, { showLabels: settings.showLabels }) : [];
  const hasContext = context !== null && segments.length > 0;
  const currentKey = context ? canonicalKeyFor(context.safeUrl) : undefined;
  const showDiagnostics = settings.developerDiagnostics && context !== null;

  return (
    <div
      className="rd-dock"
      data-position={settings.position}
      data-autohide={settings.autoHide}
      data-history-open={historyOpen}
    >
      {showDiagnostics && context && (
        <div className="rd-dock__diagnostics">
          <Diagnostics context={context} />
        </div>
      )}

      {historyOpen && (
        <div className="rd-dock__panel">
          <HistoryPanel
            currentKey={currentKey}
            linkTarget={settings.historyLinkTarget}
            importBrowserHistory={settings.importBrowserHistory}
            onClose={onCloseHistory}
            headingId={historyHeadingId}
          />
        </div>
      )}

      <div className="rd-dock__bar">
        <button
          type="button"
          className="rd-dock__brand"
          onClick={onToggleHistory}
          aria-label={t('dock.history')}
          aria-expanded={historyOpen}
          title={t('app.name')}
        >
          <span className="rd-dock__logo" aria-hidden="true" />
        </button>

        <div className="rd-dock__content">
          {hasContext ? (
            <DockSegments segments={segments} />
          ) : (
            <span className="rd-dock__unavailable" title={t('dock.unavailableHint')}>
              {t('dock.unavailable')}
            </span>
          )}
        </div>

        <div className="rd-dock__actions">
          {hasContext && (
            <IconButton
              icon={copied ? <CheckIcon size={16} /> : <CopyIcon size={16} />}
              label={copied ? t('dock.copied') : t('dock.copyContext')}
              onClick={() => {
                if (context) void copy(contextSummary(context));
              }}
            />
          )}
          <IconButton
            icon={<HistoryIcon size={16} />}
            label={t('dock.history')}
            active={historyOpen}
            onClick={onToggleHistory}
          />
          <IconButton
            icon={<GearIcon size={16} />}
            label={t('dock.settings')}
            onClick={onOpenSettings}
          />
          <IconButton icon={<EyeClosedIcon size={16} />} label={t('dock.hide')} onClick={onHide} />
        </div>
      </div>
    </div>
  );
}
