export type { Density, DockPosition, LinkTarget, Settings, ThemeMode } from './types';
export {
  DEFAULT_SETTINGS,
  DENSITIES,
  DOCK_POSITIONS,
  HISTORY_LIMIT_DEFAULT,
  HISTORY_LIMIT_MAX,
  HISTORY_LIMIT_MIN,
  LINK_TARGETS,
  SETTINGS_SCHEMA_VERSION,
  THEME_MODES,
} from './types';
export { settingsSchema } from './schema';
export {
  getSettings,
  resetSettings,
  saveSettings,
  settingsStore,
  SETTINGS_FALLBACK_KEY,
  SETTINGS_KEY,
  updateSettings,
  watchSettings,
} from './store';
