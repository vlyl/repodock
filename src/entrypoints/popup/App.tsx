import { useState } from 'react';
import type { ReactNode } from 'react';
import {
  ArrowLeftIcon,
  ArrowRightIcon,
  ChevronRightIcon,
  GearIcon,
  HistoryIcon,
} from '@primer/octicons-react';
import { browser } from '#imports';
import { buildSegments, canonicalKeyFor, contextTitle } from '@/core/context';
import type { DockPosition, Density } from '@/core/settings';
import { updateSettings } from '@/core/settings';
import { t } from '@/i18n';
import { Field, IconButton, SegmentedControl, Toggle } from '@/ui/components/controls';
import { DockSegments } from '@/ui/dock/DockSegments';
import { HistoryPanel } from '@/ui/dock/HistoryPanel';
import { useCommandShortcut } from '@/ui/hooks/useCommandShortcut';
import { useCurrentTabContext } from '@/ui/hooks/useCurrentTabContext';
import { useSettings } from '@/ui/hooks/useSettings';
import { useResolvedTheme } from '@/ui/theme/useTheme';

const POSITION_OPTIONS: { value: DockPosition; label: string; icon: ReactNode }[] = [
  { value: 'left', label: t('position.left'), icon: <ArrowLeftIcon size={14} /> },
  { value: 'right', label: t('position.right'), icon: <ArrowRightIcon size={14} /> },
];

const DENSITY_OPTIONS: { value: Density; label: string }[] = [
  { value: 'comfortable', label: t('density.comfortable') },
  { value: 'compact', label: t('density.compact') },
];

export function App(): ReactNode {
  const { settings, ready } = useSettings();
  const { context, loading, isGitHub } = useCurrentTabContext();
  const theme = useResolvedTheme(settings?.theme ?? 'system');
  const shortcut = useCommandShortcut('toggle-dock');
  const [view, setView] = useState<'main' | 'history'>('main');

  if (!ready || !settings) {
    return <div className="rd-root rd-popup" data-rd-theme={theme} />;
  }

  const openOptions = (): void => {
    void browser.runtime.openOptionsPage().then(() => window.close());
  };

  if (view === 'history') {
    return (
      <div
        className="rd-root rd-popup rd-popup--history"
        data-rd-theme={theme}
        data-rd-density={settings.density}
      >
        <div className="rd-popup__history">
          <HistoryPanel
            currentKey={context ? canonicalKeyFor(context.safeUrl) : undefined}
            linkTarget={settings.historyLinkTarget}
            importBrowserHistory={settings.importBrowserHistory}
            involvedOnly={settings.historyInvolvedOnly}
            onToggleInvolved={(next) => void updateSettings({ historyInvolvedOnly: next })}
            onClose={() => setView('main')}
          />
        </div>
      </div>
    );
  }

  return (
    <div className="rd-root rd-popup" data-rd-theme={theme} data-rd-density={settings.density}>
      <header className="rd-popup__header">
        <span className="rd-popup__brand">
          <span className="rd-dock__logo" aria-hidden="true" />
          {t('popup.heading')}
        </span>
        <IconButton
          icon={<GearIcon size={16} />}
          label={t('popup.openOptions')}
          onClick={openOptions}
        />
      </header>

      <section className="rd-popup__context-card" aria-label="Current context">
        {loading ? (
          <p className="rd-popup__muted">…</p>
        ) : context ? (
          <>
            <div className="rd-popup__context-title">{contextTitle(context)}</div>
            <DockSegments segments={buildSegments(context, { showLabels: settings.showLabels })} />
          </>
        ) : isGitHub ? (
          <p className="rd-popup__muted">{t('popup.noContext')}</p>
        ) : (
          <p className="rd-popup__muted">{t('popup.notGitHub')}</p>
        )}
      </section>

      <button type="button" className="rd-popup__recent" onClick={() => setView('history')}>
        <span className="rd-popup__recent-icon" aria-hidden="true">
          <HistoryIcon size={16} />
        </span>
        <span className="rd-popup__recent-label">{t('popup.openHistory')}</span>
        <span className="rd-popup__recent-chevron" aria-hidden="true">
          <ChevronRightIcon size={16} />
        </span>
      </button>

      <section className="rd-popup__controls">
        <Field
          label={t('popup.visible')}
          control={
            <Toggle
              checked={settings.visible}
              onChange={(checked) => void updateSettings({ visible: checked })}
              label={t('popup.visible')}
            />
          }
        />
        <Field
          label={t('popup.position')}
          control={
            <SegmentedControl
              ariaLabel={t('popup.position')}
              value={settings.position}
              options={POSITION_OPTIONS}
              iconsOnly
              onChange={(value) => void updateSettings({ position: value })}
            />
          }
        />
        <Field
          label={t('popup.density')}
          control={
            <SegmentedControl
              ariaLabel={t('popup.density')}
              value={settings.density}
              options={DENSITY_OPTIONS}
              onChange={(value) => void updateSettings({ density: value })}
            />
          }
        />
        <Field
          label={t('popup.recordHistory')}
          control={
            <Toggle
              checked={settings.recordHistory}
              onChange={(checked) => void updateSettings({ recordHistory: checked })}
              label={t('popup.recordHistory')}
            />
          }
        />
        <Field
          label={t('popup.stickyHeader')}
          control={
            <Toggle
              checked={settings.stickyHeader}
              onChange={(checked) => void updateSettings({ stickyHeader: checked })}
              label={t('popup.stickyHeader')}
            />
          }
        />
      </section>

      <p className="rd-popup__shortcut">
        {shortcut ? (
          <>
            <span>{t('popup.shortcutLabel')}</span>
            <kbd className="rd-kbd">{shortcut}</kbd>
          </>
        ) : (
          <span>{t('popup.shortcutUnset')}</span>
        )}
      </p>
    </div>
  );
}
