import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { GitHubContext } from '@/core/context';
import { resolveContext } from '@/core/context';
import { ContextController } from '@/lib/context-controller';

describe('ContextController', () => {
  beforeEach(() => vi.useFakeTimers());
  afterEach(() => vi.useRealTimers());

  it('emits once per distinct context and records after stabilization', () => {
    const record = vi.fn(async (_ctx: GitHubContext) => {});
    const controller = new ContextController({
      resolve: (url) => resolveContext({ url }),
      record,
      getHref: () => 'https://github.com/o/r/pull/1',
      getDocument: () => document,
      recordDelayMs: 100,
    });
    const listener = vi.fn();
    controller.subscribe(listener); // called immediately with null
    controller.start();

    vi.advanceTimersByTime(1000);

    const emitted = listener.mock.calls
      .map((call) => call[0] as GitHubContext | null)
      .filter((value): value is GitHubContext => value !== null);

    // The three re-resolve passes share one signature, so only one emit.
    expect(emitted).toHaveLength(1);
    expect(emitted[0]!.safeUrl).toBe('https://github.com/o/r/pull/1');

    expect(record).toHaveBeenCalledTimes(1);
    expect(record.mock.calls[0]![0].item?.id).toBe('1');

    controller.stop();
  });

  it('re-resolves when the URL changes via the poll', () => {
    let href = 'https://github.com/o/r';
    const controller = new ContextController({
      resolve: (url) => resolveContext({ url }),
      record: vi.fn(async () => {}),
      getHref: () => href,
      getDocument: () => document,
      recordDelayMs: 10,
    });
    const listener = vi.fn();
    controller.subscribe(listener);
    controller.start();
    vi.advanceTimersByTime(50);

    href = 'https://github.com/o/r/issues/2';
    vi.advanceTimersByTime(500); // poll (400ms) detects the change, then re-resolves

    const urls = listener.mock.calls
      .map((call) => (call[0] as GitHubContext | null)?.safeUrl)
      .filter(Boolean);
    expect(urls).toContain('https://github.com/o/r/issues/2');

    controller.stop();
  });
});
