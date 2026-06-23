import type { ReactNode } from 'react';
import { ArrowLeftIcon, ArrowRightIcon } from '@primer/octicons-react';
import type { NavSection } from '@/core/context';
import { NAV_SECTIONS } from '@/core/context';
import { clearAllHistory } from '@/core/history';
import { clearViewer } from '@/core/viewer';
import type { Density, DockPosition, LinkTarget, ThemeMode } from '@/core/settings';
import {
  HISTORY_LIMIT_MAX,
  HISTORY_LIMIT_MIN,
  resetSettings,
  updateSettings,
} from '@/core/settings';
import { t } from '@/i18n';
import type { MessageKey } from '@/i18n';
import {
  Field,
  NumberField,
  SegmentedControl,
  SelectField,
  Toggle,
} from '@/ui/components/controls';
import { useCommandShortcut } from '@/ui/hooks/useCommandShortcut';
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

const NAV_SECTION_LABEL: Record<NavSection, MessageKey> = {
  code: 'nav.code',
  issues: 'nav.issues',
  pulls: 'nav.pulls',
  actions: 'nav.actions',
  projects: 'nav.projects',
  wiki: 'nav.wiki',
  discussions: 'nav.discussions',
  security: 'nav.security',
  insights: 'nav.insights',
  releases: 'nav.releases',
  settings: 'nav.settings',
};

const THEME_OPTIONS: { value: ThemeMode; label: string }[] = [
  { value: 'system', label: t('theme.system') },
  { value: 'light', label: t('theme.light') },
  { value: 'dark', label: t('theme.dark') },
];

const LINK_TARGET_OPTIONS: { value: LinkTarget; label: string }[] = [
  { value: 'current', label: t('linkTarget.current') },
  { value: 'new', label: t('linkTarget.new') },
];

function Section({ title, children }: { title: string; children: ReactNode }): ReactNode {
  return (
    <section className="rd-options__section">
      <h2 className="rd-options__section-title">{title}</h2>
      <div className="rd-options__rows">{children}</div>
    </section>
  );
}

export function App(): ReactNode {
  const { settings, ready } = useSettings();
  const theme = useResolvedTheme(settings?.theme ?? 'system');
  const shortcut = useCommandShortcut('toggle-dock');

  if (!ready || !settings) {
    return <div className="rd-root rd-options" data-rd-theme={theme} />;
  }

  const clearHistory = (): void => {
    if (window.confirm(t('options.confirmClearHistory'))) {
      void clearAllHistory();
      void clearViewer();
    }
  };
  const doResetSettings = (): void => {
    if (window.confirm(t('options.confirmResetSettings'))) void resetSettings();
  };

  const shortcutInstructions = import.meta.env.FIREFOX
    ? t('options.shortcutFirefox')
    : t('options.shortcutChrome');

  return (
    <div className="rd-root rd-options" data-rd-theme={theme} data-rd-density="comfortable">
      <div className="rd-options__container">
        <header className="rd-options__header">
          <span className="rd-dock__logo rd-options__logo" aria-hidden="true" />
          <div>
            <h1 className="rd-options__title">{t('options.title')}</h1>
            <p className="rd-options__subtitle">{t('options.subtitle')}</p>
          </div>
        </header>

        <Section title={t('options.section.appearance')}>
          <Field
            label={t('options.position')}
            description={t('options.positionHelp')}
            control={
              <SegmentedControl
                ariaLabel={t('options.position')}
                value={settings.position}
                options={POSITION_OPTIONS}
                onChange={(value) => void updateSettings({ position: value })}
              />
            }
          />
          <Field
            label={t('options.density')}
            description={t('options.densityHelp')}
            control={
              <SegmentedControl
                ariaLabel={t('options.density')}
                value={settings.density}
                options={DENSITY_OPTIONS}
                onChange={(value) => void updateSettings({ density: value })}
              />
            }
          />
          <Field
            label={t('options.theme')}
            description={t('options.themeHelp')}
            control={
              <SelectField
                ariaLabel={t('options.theme')}
                value={settings.theme}
                options={THEME_OPTIONS}
                onChange={(value) => void updateSettings({ theme: value })}
              />
            }
          />
          <Field
            label={t('options.showLabels')}
            description={t('options.showLabelsHelp')}
            control={
              <Toggle
                label={t('options.showLabels')}
                checked={settings.showLabels}
                onChange={(checked) => void updateSettings({ showLabels: checked })}
              />
            }
          />
        </Section>

        <Section title={t('options.section.navigation')}>
          <p className="rd-options__note">{t('options.navigationHelp')}</p>
          {NAV_SECTIONS.map((section) => (
            <Field
              key={section}
              label={t(NAV_SECTION_LABEL[section])}
              control={
                <Toggle
                  label={t(NAV_SECTION_LABEL[section])}
                  checked={settings.navSections.includes(section)}
                  onChange={(checked) =>
                    void updateSettings({
                      navSections: checked
                        ? [...settings.navSections, section]
                        : settings.navSections.filter((value) => value !== section),
                    })
                  }
                />
              }
            />
          ))}
        </Section>

        <Section title={t('options.section.github')}>
          <Field
            label={t('options.stickyHeader')}
            description={t('options.stickyHeaderHelp')}
            control={
              <Toggle
                label={t('options.stickyHeader')}
                checked={settings.stickyHeader}
                onChange={(checked) => void updateSettings({ stickyHeader: checked })}
              />
            }
          />
        </Section>

        <Section title={t('options.section.behavior')}>
          <Field
            label={t('options.autoHide')}
            description={t('options.autoHideHelp')}
            control={
              <Toggle
                label={t('options.autoHide')}
                checked={settings.autoHide}
                onChange={(checked) => void updateSettings({ autoHide: checked })}
              />
            }
          />
          <Field
            label={t('options.historyLinkTarget')}
            control={
              <SelectField
                ariaLabel={t('options.historyLinkTarget')}
                value={settings.historyLinkTarget}
                options={LINK_TARGET_OPTIONS}
                onChange={(value) => void updateSettings({ historyLinkTarget: value })}
              />
            }
          />
        </Section>

        <Section title={t('options.section.history')}>
          <Field
            label={t('options.recordHistory')}
            description={t('options.recordHistoryHelp')}
            control={
              <Toggle
                label={t('options.recordHistory')}
                checked={settings.recordHistory}
                onChange={(checked) => void updateSettings({ recordHistory: checked })}
              />
            }
          />
          <Field
            label={t('options.importBrowserHistory')}
            description={t('options.importBrowserHistoryHelp')}
            control={
              <Toggle
                label={t('options.importBrowserHistory')}
                checked={settings.importBrowserHistory}
                onChange={(checked) => void updateSettings({ importBrowserHistory: checked })}
              />
            }
          />
          <Field
            label={t('options.historyLimit')}
            description={t('options.historyLimitHelp', HISTORY_LIMIT_MIN, HISTORY_LIMIT_MAX)}
            control={
              <NumberField
                ariaLabel={t('options.historyLimit')}
                value={settings.historyLimit}
                min={HISTORY_LIMIT_MIN}
                max={HISTORY_LIMIT_MAX}
                onCommit={(value) => void updateSettings({ historyLimit: value })}
              />
            }
          />
        </Section>

        <Section title={t('options.section.shortcuts')}>
          <Field
            label={t('options.toggleShortcut')}
            description={shortcutInstructions}
            control={
              <code className="rd-options__shortcut">{shortcut ?? t('popup.shortcutUnset')}</code>
            }
          />
        </Section>

        <Section title={t('options.section.advanced')}>
          <Field
            label={t('options.developerDiagnostics')}
            description={t('options.developerDiagnosticsHelp')}
            control={
              <Toggle
                label={t('options.developerDiagnostics')}
                checked={settings.developerDiagnostics}
                onChange={(checked) => void updateSettings({ developerDiagnostics: checked })}
              />
            }
          />
        </Section>

        <Section title={t('options.section.data')}>
          <Field
            label={t('options.clearHistory')}
            description={t('options.clearHistoryHelp')}
            control={
              <button type="button" className="rd-btn rd-btn--danger" onClick={clearHistory}>
                {t('options.clearHistory')}
              </button>
            }
          />
          <Field
            label={t('options.resetSettings')}
            description={t('options.resetSettingsHelp')}
            control={
              <button type="button" className="rd-btn rd-btn--danger" onClick={doResetSettings}>
                {t('options.resetSettings')}
              </button>
            }
          />
        </Section>

        <p className="rd-options__privacy">{t('options.privacyNote')}</p>
      </div>
    </div>
  );
}
