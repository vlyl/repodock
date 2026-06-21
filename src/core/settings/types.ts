import { NAV_SECTIONS } from '../context/nav';
import type { NavSection } from '../context/nav';

/** Which side the dock is anchored to (always at the bottom of that side). */
export const DOCK_POSITIONS = ['left', 'right'] as const;
export type DockPosition = (typeof DOCK_POSITIONS)[number];

/** Visual density of the dock. */
export const DENSITIES = ['compact', 'comfortable'] as const;
export type Density = (typeof DENSITIES)[number];

/** How the dock resolves its color theme. */
export const THEME_MODES = ['system', 'light', 'dark'] as const;
export type ThemeMode = (typeof THEME_MODES)[number];

/** Where history links open. */
export const LINK_TARGETS = ['current', 'new'] as const;
export type LinkTarget = (typeof LINK_TARGETS)[number];

/** Bounds for the configurable history size. */
export const HISTORY_LIMIT_MIN = 10;
export const HISTORY_LIMIT_MAX = 1000;
export const HISTORY_LIMIT_DEFAULT = 100;

/** The current settings schema version. */
export const SETTINGS_SCHEMA_VERSION = 1;

export interface Settings {
  /** Which side the dock sits on (bottom-left or bottom-right). Default: left. */
  position: DockPosition;
  /** Dock density. */
  density: Density;
  /**
   * Auto-hide the dock to a small handle in the corner when idle, expanding on
   * hover, so it stays out of the way of GitHub's content.
   */
  autoHide: boolean;
  /**
   * Whether the recent-pages list is shown. It stays open until explicitly
   * collapsed (persisted), rather than auto-closing.
   */
  recentOpen: boolean;
  /** Which GitHub repository-navigation buttons to show in the dock. */
  navSections: NavSection[];
  /** Whether textual labels (e.g. "branch:") are shown. */
  showLabels: boolean;
  /** Whether the dock is currently visible. */
  visible: boolean;
  /** Whether GitHub page visits are recorded to history. */
  recordHistory: boolean;
  /**
   * Whether to also surface the browser's own github.com history in the recent
   * list. Requires the `history` permission.
   */
  importBrowserHistory: boolean;
  /** Whether the recent list is filtered to pages the viewer is involved with. */
  historyInvolvedOnly: boolean;
  /** Maximum number of unpinned history entries to retain. */
  historyLimit: number;
  /** Theme resolution mode. */
  theme: ThemeMode;
  /** Whether history links open in the current or a new tab. */
  historyLinkTarget: LinkTarget;
  /** Whether developer diagnostics are surfaced in the UI. */
  developerDiagnostics: boolean;
}

export const DEFAULT_SETTINGS: Readonly<Settings> = Object.freeze({
  position: 'left',
  density: 'comfortable',
  autoHide: false,
  recentOpen: true,
  navSections: [...NAV_SECTIONS],
  showLabels: true,
  visible: true,
  recordHistory: true,
  importBrowserHistory: true,
  historyInvolvedOnly: false,
  historyLimit: HISTORY_LIMIT_DEFAULT,
  theme: 'system',
  historyLinkTarget: 'current',
  developerDiagnostics: false,
});
