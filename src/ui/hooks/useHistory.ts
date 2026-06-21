import { useEffect, useState } from 'react';
import type { HistoryState } from '@/core/history';
import { emptyHistory, getHistory, watchHistory } from '@/core/history';

/** Subscribe to the live history state. */
export function useHistory(): HistoryState {
  const [state, setState] = useState<HistoryState>(emptyHistory);

  useEffect(() => {
    let active = true;
    void getHistory().then((value) => {
      if (active) setState(value);
    });
    const unwatch = watchHistory((value) => setState(value));
    return () => {
      active = false;
      unwatch();
    };
  }, []);

  return state;
}
