import { useEffect, useState } from 'react';
import type { Settings } from '@/core/settings';
import { getSettings, watchSettings } from '@/core/settings';

/** Subscribe to the live settings value. `settings` is `null` until first load. */
export function useSettings(): { settings: Settings | null; ready: boolean } {
  const [settings, setSettings] = useState<Settings | null>(null);

  useEffect(() => {
    let active = true;
    void getSettings().then((value) => {
      if (active) setSettings(value);
    });
    const unwatch = watchSettings((value) => setSettings(value));
    return () => {
      active = false;
      unwatch();
    };
  }, []);

  return { settings, ready: settings !== null };
}
