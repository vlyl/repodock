import { useId } from 'react';
import type { ReactNode } from 'react';
import {
  CheckIcon,
  ChevronDownIcon,
  ChevronUpIcon,
  CopyIcon,
  EyeClosedIcon,
  GearIcon,
  HistoryIcon,
} from '@primer/octicons-react';
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
  collapsed: boolean;
  historyOpen: boolean;
  onToggleCollapsed: () => void;
  onToggleHistory: () => void;
  onCloseHistory: () => void;
  onHide: () => void;
  onOpenSettings: () => void;
}

export function Dock({
  context,
  settings,
  collapsed,
  historyOpen,
  onToggleCollapsed,
  onToggleHistory,
  onCloseHistory,
  onHide,
  onOpenSettings,
}: DockProps): ReactNode {
  const { copied, copy } = useCopy();
  const historyHeadingId = useId();

  const segments = context ? buildSegments(context, { showLabels: settings.showLabels }) : [];
  const hasContext = context !== null && segments.length > 0;
  const compactLabel = context?.repository?.nwo ?? context?.locationLabel ?? t('app.name');
  const currentKey = context ? canonicalKeyFor(context.safeUrl) : undefined;
  const showDiagnostics = settings.developerDiagnostics && !collapsed && context !== null;
  // Vertical docks show the recent list inline as a sidebar; horizontal docks
  // show it in a popover so the bar stays compact.
  const isVertical = settings.position === 'left' || settings.position === 'right';
  const showHistory = historyOpen && !collapsed;

  return (
    <div className="rd-dock" data-position={settings.position} data-collapsed={collapsed}>
      <div className="rd-dock__bar">
        <button
          type="button"
          className="rd-dock__brand"
          onClick={onToggleCollapsed}
          aria-expanded={!collapsed}
          aria-label={collapsed ? t('dock.expand') : t('dock.collapse')}
          title={t('app.name')}
        >
          <span className="rd-dock__logo" aria-hidden="true" />
        </button>

        <div className="rd-dock__content">
          {collapsed ? (
            <span className="rd-dock__compact">{compactLabel}</span>
          ) : hasContext ? (
            <DockSegments segments={segments} />
          ) : (
            <span className="rd-dock__unavailable" title={t('dock.unavailableHint')}>
              {t('dock.unavailable')}
            </span>
          )}
        </div>

        <div className="rd-dock__actions">
          {hasContext && !collapsed && (
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
            icon={collapsed ? <ChevronDownIcon size={16} /> : <ChevronUpIcon size={16} />}
            label={collapsed ? t('dock.expand') : t('dock.collapse')}
            onClick={onToggleCollapsed}
          />
          <IconButton
            icon={<GearIcon size={16} />}
            label={t('dock.settings')}
            onClick={onOpenSettings}
          />
          <IconButton icon={<EyeClosedIcon size={16} />} label={t('dock.hide')} onClick={onHide} />
        </div>
      </div>

      {showDiagnostics && context && (
        <div className="rd-dock__diagnostics">
          <Diagnostics context={context} />
        </div>
      )}

      {showHistory && (
        <div className={isVertical ? 'rd-dock__list' : 'rd-dock__panel'}>
          <HistoryPanel
            currentKey={currentKey}
            linkTarget={settings.historyLinkTarget}
            importBrowserHistory={settings.importBrowserHistory}
            onClose={isVertical ? undefined : onCloseHistory}
            headingId={historyHeadingId}
          />
        </div>
      )}
    </div>
  );
}
