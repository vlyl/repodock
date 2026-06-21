import { useEffect, useState } from 'react';
import { getViewer, watchViewer } from '@/core/viewer';

/** Subscribe to the remembered logged-in GitHub login, or `undefined`. */
export function useViewerLogin(): string | undefined {
  const [login, setLogin] = useState<string>();

  useEffect(() => {
    let active = true;
    void getViewer().then((state) => {
      if (active) setLogin(state.login);
    });
    const unwatch = watchViewer((state) => setLogin(state.login));
    return () => {
      active = false;
      unwatch();
    };
  }, []);

  return login;
}
