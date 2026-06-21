import { describe, expect, it } from 'vitest';
import { canonicalKeyFor, resolveContext } from '@/core/context';
import { DEFAULT_SETTINGS, getSettings, resetSettings, updateSettings } from '@/core/settings';
import {
  clearUnpinnedHistory,
  getHistory,
  pinEntry,
  recordContext,
  removeHistoryEntry,
} from '@/core/history';

describe('settings store', () => {
  it('returns defaults, persists updates, and resets', async () => {
    expect(await getSettings()).toEqual(DEFAULT_SETTINGS);
    await updateSettings({ position: 'bottom', visible: false });
    expect(await getSettings()).toMatchObject({ position: 'bottom', visible: false });
    await resetSettings();
    expect(await getSettings()).toEqual(DEFAULT_SETTINGS);
  });
});

describe('history store', () => {
  const ctx = resolveContext({ url: 'https://github.com/o/r/pull/9' });

  it('records and dedupes when enabled', async () => {
    await recordContext(ctx, 1);
    await recordContext(ctx, 2);
    const history = await getHistory();
    expect(history.entries).toHaveLength(1);
    expect(history.entries[0]!.visitCount).toBe(2);
  });

  it('skips recording when recordHistory is off', async () => {
    await updateSettings({ recordHistory: false });
    await recordContext(ctx, 1);
    expect((await getHistory()).entries).toHaveLength(0);
  });

  it('pins, clears unpinned (keeping pins), and removes', async () => {
    await recordContext(ctx, 1);
    const key = canonicalKeyFor(ctx.safeUrl);
    await pinEntry(key);
    expect((await getHistory()).entries[0]!.pinned).toBe(true);
    await clearUnpinnedHistory();
    expect((await getHistory()).entries).toHaveLength(1);
    await removeHistoryEntry(key);
    expect((await getHistory()).entries).toHaveLength(0);
  });
});
