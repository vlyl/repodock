import { useEffect, useState } from 'react';
import type { ThemeMode } from '@/core/settings';
import type { ResolvedTheme } from './theme';
import { resolveTheme } from './theme';

/**
 * Resolve and reactively track the concrete theme. Recomputes when the user's
 * preference changes, when the OS color-scheme flips, and when GitHub mutates
 * its `data-color-mode` attributes.
 */
export function useResolvedTheme(mode: ThemeMode): ResolvedTheme {
  const [theme, setTheme] = useState<ResolvedTheme>(() => resolveTheme(mode));

  useEffect(() => {
    const update = (): void => setTheme(resolveTheme(mode));
    update();

    const media = window.matchMedia('(prefers-color-scheme: dark)');
    media.addEventListener('change', update);

    const observer = new MutationObserver(update);
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ['data-color-mode', 'data-light-theme', 'data-dark-theme'],
    });

    return () => {
      media.removeEventListener('change', update);
      observer.disconnect();
    };
  }, [mode]);

  return theme;
}
