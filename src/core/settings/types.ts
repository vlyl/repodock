/** Where the dock is anchored in the viewport. */
export const DOCK_POSITIONS = ['top', 'right', 'bottom', 'left'] as const;
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
  /** Dock anchor position. Default: top. */
  position: DockPosition;
  /** Dock density. */
  density: Density;
  /** Whether the dock is collapsed. Persisted, so a collapse survives reloads. */
  collapsed: boolean;
  /**
   * For vertical (left/right) docks, reserve page space by shifting GitHub's
   * content instead of floating over it. No effect for top/bottom docks.
   */
  reservePageSpace: boolean;
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
  collapsed: false,
  reservePageSpace: true,
  showLabels: true,
  visible: true,
  recordHistory: true,
  importBrowserHistory: true,
  historyLimit: HISTORY_LIMIT_DEFAULT,
  theme: 'system',
  historyLinkTarget: 'current',
  developerDiagnostics: false,
});
