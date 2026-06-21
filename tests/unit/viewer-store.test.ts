import { afterEach, describe, expect, it } from 'vitest';
import { getViewer, rememberViewerLogin, viewerStore } from '@/core/viewer';

afterEach(() => viewerStore.set({}));

describe('viewer store', () => {
  it('defaults to no login', async () => {
    expect((await getViewer()).login).toBeUndefined();
  });

  it('remembers a login and ignores empty updates', async () => {
    await rememberViewerLogin('octocat');
    expect((await getViewer()).login).toBe('octocat');

    await rememberViewerLogin(undefined);
    expect((await getViewer()).login).toBe('octocat');

    await rememberViewerLogin('hubot');
    expect((await getViewer()).login).toBe('hubot');
  });
});
