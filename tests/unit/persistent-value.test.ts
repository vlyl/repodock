import { afterEach, describe, expect, it, vi } from 'vitest';
import { z } from 'zod';
import { storage } from '#imports';
import type { StorageItemKey } from '#imports';
import { PersistentValue } from '@/core/storage/persistent-value';

const schema = z.object({ count: z.number().int(), label: z.string() });
type Value = z.infer<typeof schema>;
const KEY: StorageItemKey = 'local:test.value';

function makeStore(
  overrides: Partial<ConstructorParameters<typeof PersistentValue<Value>>[0]> = {},
) {
  return new PersistentValue<Value>({
    key: KEY,
    version: 2,
    schema,
    defaults: () => ({ count: 0, label: 'default' }),
    ...overrides,
  });
}

afterEach(async () => {
  await storage.removeItem(KEY);
});

describe('PersistentValue', () => {
  it('returns defaults when empty', async () => {
    expect(await makeStore().get()).toEqual({ count: 0, label: 'default' });
  });

  it('round-trips a validated value through a versioned envelope', async () => {
    const store = makeStore();
    await store.set({ count: 3, label: 'hi' });
    expect(await store.get()).toEqual({ count: 3, label: 'hi' });
    expect(await storage.getItem(KEY)).toEqual({ v: 2, data: { count: 3, label: 'hi' } });
  });

  it('refuses to persist an invalid value', async () => {
    await expect(makeStore().set({ count: 1.5, label: 'x' })).rejects.toThrow();
  });

  it('falls back to defaults for corrupt stored data', async () => {
    await storage.setItem(KEY, { v: 2, data: { count: 'nope' } });
    const warn = vi.fn();
    expect(await makeStore({ onWarn: warn }).get()).toEqual({ count: 0, label: 'default' });
    expect(warn).toHaveBeenCalled();
  });

  it('runs migrations when the stored version is older', async () => {
    await storage.setItem(KEY, { v: 1, data: { n: 5 } });
    const store = makeStore({
      migrate: (raw, from) => {
        expect(from).toBe(1);
        const old = raw as { n: number };
        return { count: old.n, label: 'migrated' };
      },
    });
    expect(await store.get()).toEqual({ count: 5, label: 'migrated' });
  });

  it('notifies watchers of validated changes', async () => {
    const store = makeStore();
    const seen: Value[] = [];
    const unwatch = store.watch((value) => seen.push(value));
    await store.set({ count: 7, label: 'w' });
    unwatch();
    expect(seen).toContainEqual({ count: 7, label: 'w' });
  });

  it('emits defaults to watchers when the value is removed', async () => {
    const store = makeStore();
    await store.set({ count: 1, label: 'a' });
    const seen: Value[] = [];
    const unwatch = store.watch((value) => seen.push(value));
    await storage.removeItem(KEY);
    unwatch();
    expect(seen).toContainEqual({ count: 0, label: 'default' });
  });

  it('reads through to the fallback key when the primary is empty', async () => {
    const fallbackKey: StorageItemKey = 'local:test.fallback';
    const store = makeStore({ fallbackKey });
    await storage.setItem(fallbackKey, { v: 2, data: { count: 9, label: 'fb' } });
    expect(await store.get()).toEqual({ count: 9, label: 'fb' });
    await storage.removeItem(fallbackKey);
  });

  it('transforms with update() and resets with clear()', async () => {
    const store = makeStore();
    await store.set({ count: 1, label: 'a' });
    await store.update((current) => ({ ...current, count: current.count + 4 }));
    expect((await store.get()).count).toBe(5);
    await store.clear();
    expect(await store.get()).toEqual({ count: 0, label: 'default' });
  });

  it('treats pre-envelope (legacy) data as version 0 for migration', async () => {
    await storage.setItem(KEY, { n: 8 });
    const store = makeStore({
      migrate: (raw) => ({ count: (raw as { n: number }).n, label: 'legacy' }),
    });
    expect(await store.get()).toEqual({ count: 8, label: 'legacy' });
  });
});
