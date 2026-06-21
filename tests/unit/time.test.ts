import { describe, expect, it } from 'vitest';
import { formatRelativeTime } from '@/lib/time';

const NOW = 1_700_000_000_000;
const ago = (ms: number) => formatRelativeTime(NOW - ms, NOW);
const SECOND = 1000;
const MINUTE = 60 * SECOND;
const HOUR = 60 * MINUTE;
const DAY = 24 * HOUR;

describe('formatRelativeTime', () => {
  it('formats each magnitude', () => {
    expect(ago(10 * SECOND)).toBe('just now');
    expect(ago(5 * MINUTE)).toBe('5m ago');
    expect(ago(3 * HOUR)).toBe('3h ago');
    expect(ago(2 * DAY)).toBe('2d ago');
    expect(ago(2 * 7 * DAY)).toBe('2w ago');
    expect(ago(60 * DAY)).toBe('2mo ago');
    expect(ago(400 * DAY)).toBe('1y ago');
  });

  it('clamps future timestamps to "just now"', () => {
    expect(formatRelativeTime(NOW + 5 * SECOND, NOW)).toBe('just now');
  });
});
