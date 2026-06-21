import { describe, expect, it, vi } from 'vitest';
import { browser } from '#imports';
import { resolveContext } from '@/core/context';
import {
  onContextRequest,
  onOpenOptionsRequest,
  openOptionsPage,
  requestContextFromTab,
} from '@/lib/messaging';

const ctx = resolveContext({ url: 'https://github.com/o/r' });

describe('requestContextFromTab', () => {
  it('returns the context from a valid response', async () => {
    vi.spyOn(browser.tabs, 'sendMessage').mockResolvedValue({
      type: 'repodock:context',
      context: ctx,
    } as never);
    expect(await requestContextFromTab(1)).toBe(ctx);
  });

  it('returns null for malformed responses or send errors', async () => {
    vi.spyOn(browser.tabs, 'sendMessage').mockResolvedValueOnce({ nonsense: true } as never);
    expect(await requestContextFromTab(1)).toBeNull();

    vi.spyOn(browser.tabs, 'sendMessage').mockRejectedValueOnce(new Error('no receiver'));
    expect(await requestContextFromTab(1)).toBeNull();
  });
});

describe('onContextRequest', () => {
  it('replies to context requests and ignores others', () => {
    let handler: ((m: unknown, s: unknown, r: (response: unknown) => void) => unknown) | undefined;
    vi.spyOn(browser.runtime.onMessage, 'addListener').mockImplementation((fn) => {
      handler = fn as typeof handler;
    });
    onContextRequest(() => ctx);

    const respond = vi.fn();
    const handled = handler!({ type: 'repodock:get-context' }, {}, respond);
    expect(handled).toBe(true);
    expect(respond).toHaveBeenCalledWith({ type: 'repodock:context', context: ctx });

    respond.mockClear();
    expect(handler!({ type: 'other' }, {}, respond)).toBeUndefined();
    expect(respond).not.toHaveBeenCalled();
  });
});

describe('options-page messaging', () => {
  it('sends an open-options request', async () => {
    const send = vi.spyOn(browser.runtime, 'sendMessage').mockResolvedValue(undefined);
    await openOptionsPage();
    expect(send).toHaveBeenCalledWith({ type: 'repodock:open-options' });
  });

  it('invokes the handler only for open-options messages', () => {
    let handler: ((m: unknown) => unknown) | undefined;
    vi.spyOn(browser.runtime.onMessage, 'addListener').mockImplementation((fn) => {
      handler = fn as typeof handler;
    });
    const open = vi.fn();
    onOpenOptionsRequest(open);

    handler!({ type: 'repodock:open-options' });
    expect(open).toHaveBeenCalledTimes(1);
    handler!({ type: 'nope' });
    expect(open).toHaveBeenCalledTimes(1);
  });
});
