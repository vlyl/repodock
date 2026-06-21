import type { ReactNode } from 'react';
import { PersonIcon } from '@primer/octicons-react';
import type { GitHubContext } from '@/core/context';
import { buildSegments } from '@/core/context';
import { canonicalKeyFor } from '@/core/context/github-url';
import type { Settings } from '@/core/settings';
import { t } from '@/i18n';
import { IconButton } from '@/ui/components/controls';
import { DockNav } from './DockNav';
import { DockSegments } from './DockSegments';
import { Diagnostics } from './Diagnostics';
import { HistoryPanel } from './HistoryPanel';

export interface DockProps {
  context: GitHubContext | null;
  settings: Settings;
  historyOpen: boolean;
  onToggleHistory: () => void;
  onToggleInvolved: (next: boolean) => void;
}

/**
 * The compact dock, anchored to the bottom-left/right corner. A single bar holds
 * the brand (which toggles the recent list), the live context, and the
 * configurable GitHub section quick-nav. Hiding and settings live in the toolbar
 * popup; the recent list pops up above the bar on demand. When auto-hide is on
 * the bar collapses to a small handle until hovered (CSS-driven).
 */
export function Dock({
  context,
  settings,
  historyOpen,
  onToggleHistory,
  onToggleInvolved,
}: DockProps): ReactNode {
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
            involvedOnly={settings.historyInvolvedOnly}
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

        <IconButton
          icon={<PersonIcon size={16} />}
          label={t('history.involvedOnly')}
          active={settings.historyInvolvedOnly}
          onClick={() => onToggleInvolved(!settings.historyInvolvedOnly)}
        />

        <div className="rd-dock__content">
          {hasContext ? (
            <DockSegments segments={segments} />
          ) : (
            <span className="rd-dock__unavailable" title={t('dock.unavailableHint')}>
              {t('dock.unavailable')}
            </span>
          )}
        </div>

        {context?.repository && settings.navSections.length > 0 && (
          <>
            <span className="rd-dock__divider" aria-hidden="true" />
            <DockNav context={context} sections={settings.navSections} />
          </>
        )}
      </div>
    </div>
  );
}
