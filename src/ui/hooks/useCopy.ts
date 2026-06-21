import { useCallback, useEffect, useRef, useState } from 'react';

/** Copy text to the clipboard with a transient "copied" flag for UI feedback. */
export function useCopy(resetMs = 1500): {
  copied: boolean;
  copy: (text: string) => Promise<void>;
} {
  const [copied, setCopied] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(
    () => () => {
      if (timer.current !== null) clearTimeout(timer.current);
    },
    [],
  );

  const flash = useCallback(() => {
    setCopied(true);
    if (timer.current !== null) clearTimeout(timer.current);
    timer.current = setTimeout(() => setCopied(false), resetMs);
  }, [resetMs]);

  const copy = useCallback(
    async (text: string) => {
      try {
        await navigator.clipboard.writeText(text);
        flash();
      } catch {
        // Fallback for contexts where the async clipboard API is unavailable.
        const textarea = document.createElement('textarea');
        textarea.value = text;
        textarea.style.position = 'fixed';
        textarea.style.opacity = '0';
        document.body.appendChild(textarea);
        textarea.select();
        try {
          document.execCommand('copy');
          flash();
        } finally {
          document.body.removeChild(textarea);
        }
      }
    },
    [flash],
  );

  return { copied, copy };
}
