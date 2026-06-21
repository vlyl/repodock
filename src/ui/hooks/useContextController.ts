import { useEffect, useState } from 'react';
import type { GitHubContext } from '@/core/context/types';
import type { ContextController } from '@/lib/context-controller';

/** Subscribe a component to a {@link ContextController}'s current context. */
export function useContextController(controller: ContextController): GitHubContext | null {
  const [context, setContext] = useState<GitHubContext | null>(() => controller.getContext());

  useEffect(() => controller.subscribe(setContext), [controller]);

  return context;
}
