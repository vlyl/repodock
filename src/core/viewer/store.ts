import { z } from 'zod';
import type { StorageItemKey } from '#imports';
import { PersistentValue } from '../storage/persistent-value';

/** The logged-in GitHub user, remembered locally to power the "mine" filter. */
export interface ViewerState {
  login?: string;
}

const viewerSchema = z.object({ login: z.string().optional() }).catch(() => ({}));

/** Local-only: never synced, and holds only the current account's login. */
export const VIEWER_KEY: StorageItemKey = 'local:repodock.viewer';

export const viewerStore = new PersistentValue<ViewerState>({
  key: VIEWER_KEY,
  version: 1,
  schema: viewerSchema,
  defaults: () => ({}),
});

export function getViewer(): Promise<ViewerState> {
  return viewerStore.get();
}

/** Remember the viewer's login, writing only when it actually changes. */
export async function rememberViewerLogin(login: string | undefined): Promise<void> {
  if (!login) return;
  const current = await viewerStore.get();
  if (current.login === login) return;
  await viewerStore.set({ login });
}

/** Forget the remembered login (e.g. when the user clears local data). */
export async function clearViewer(): Promise<void> {
  await viewerStore.set({});
}

export function watchViewer(callback: (state: ViewerState) => void): () => void {
  return viewerStore.watch(callback);
}
