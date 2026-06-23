import { z } from 'zod';
import { NAV_SECTIONS } from '../context/nav';
import {
  DEFAULT_SETTINGS,
  DENSITIES,
  DOCK_POSITIONS,
  HISTORY_LIMIT_MAX,
  HISTORY_LIMIT_MIN,
  LINK_TARGETS,
  THEME_MODES,
} from './types';
import type { Settings } from './types';

/**
 * Settings schema with field-level fallbacks. A single corrupt field falls back
 * to its default rather than discarding the entire settings object, which keeps
 * a user's other preferences intact across upgrades or partial corruption.
 */
export const settingsSchema = z
  .object({
    position: z.enum(DOCK_POSITIONS).catch(DEFAULT_SETTINGS.position),
    density: z.enum(DENSITIES).catch(DEFAULT_SETTINGS.density),
    autoHide: z.boolean().catch(DEFAULT_SETTINGS.autoHide),
    recentOpen: z.boolean().catch(DEFAULT_SETTINGS.recentOpen),
    navSections: z.array(z.enum(NAV_SECTIONS)).catch(() => [...DEFAULT_SETTINGS.navSections]),
    showLabels: z.boolean().catch(DEFAULT_SETTINGS.showLabels),
    stickyHeader: z.boolean().catch(DEFAULT_SETTINGS.stickyHeader),
    visible: z.boolean().catch(DEFAULT_SETTINGS.visible),
    recordHistory: z.boolean().catch(DEFAULT_SETTINGS.recordHistory),
    importBrowserHistory: z.boolean().catch(DEFAULT_SETTINGS.importBrowserHistory),
    historyInvolvedOnly: z.boolean().catch(DEFAULT_SETTINGS.historyInvolvedOnly),
    historyLimit: z
      .number()
      .int()
      .min(HISTORY_LIMIT_MIN)
      .max(HISTORY_LIMIT_MAX)
      .catch(DEFAULT_SETTINGS.historyLimit),
    theme: z.enum(THEME_MODES).catch(DEFAULT_SETTINGS.theme),
    historyLinkTarget: z.enum(LINK_TARGETS).catch(DEFAULT_SETTINGS.historyLinkTarget),
    developerDiagnostics: z.boolean().catch(DEFAULT_SETTINGS.developerDiagnostics),
  })
  .catch(() => ({ ...DEFAULT_SETTINGS }));

// Compile-time guarantee that the schema output matches the Settings interface.
type SchemaOutput = z.infer<typeof settingsSchema>;
type _AssertSettingsMatch = SchemaOutput extends Settings
  ? Settings extends SchemaOutput
    ? true
    : never
  : never;
const _assertSettingsMatch: _AssertSettingsMatch = true;
void _assertSettingsMatch;
