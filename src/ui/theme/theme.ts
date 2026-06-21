import type { ThemeMode } from '@/core/settings';

export type ResolvedTheme = 'light' | 'dark';

/**
 * Resolve a concrete light/dark theme from the user's preference.
 *
 * For `system`, we honor GitHub's own `data-color-mode` when present (so the
 * dock matches the page), falling back to the OS `prefers-color-scheme`.
 */
export function resolveTheme(
  mode: ThemeMode,
  root: HTMLElement = document.documentElement,
  mediaQuery: MediaQueryList | null = typeof window !== 'undefined' && window.matchMedia
    ? window.matchMedia('(prefers-color-scheme: dark)')
    : null,
): ResolvedTheme {
  if (mode === 'light' || mode === 'dark') return mode;

  const colorMode = root.getAttribute('data-color-mode');
  if (colorMode === 'light') return 'light';
  if (colorMode === 'dark') return 'dark';

  // `auto` or absent: defer to the OS preference.
  return mediaQuery?.matches ? 'dark' : 'light';
}
