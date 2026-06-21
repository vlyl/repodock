import { useEffect, useState } from 'react';
import { browser } from '#imports';

/** Read the user-assigned keyboard shortcut for a manifest command. */
export function useCommandShortcut(commandName: string): string | null {
  const [shortcut, setShortcut] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    void (async () => {
      try {
        const commands = await browser.commands.getAll();
        const command = commands.find((entry) => entry.name === commandName);
        const value = command?.shortcut;
        if (active) setShortcut(value && value.length > 0 ? value : null);
      } catch {
        if (active) setShortcut(null);
      }
    })();
    return () => {
      active = false;
    };
  }, [commandName]);

  return shortcut;
}
