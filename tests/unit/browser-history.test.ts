import { describe, expect, it } from 'vitest';
import { browserItemToEntry } from '@/core/history';

describe('browserItemToEntry', () => {
  it('maps a github repository URL to an entry with browser visit data', () => {
    const entry = browserItemToEntry(
      {
        url: 'https://github.com/o/r/blob/main/a.ts',
        title: 'a.ts',
        lastVisitTime: 1000,
        visitCount: 3,
      },
      2000,
    );
    expect(entry?.nwo).toBe('o/r');
    expect(entry?.path).toBe('a.ts');
    expect(entry?.lastVisited).toBe(1000);
    expect(entry?.visitCount).toBe(3);
  });

  it('uses the browser page title for issue/PR pages', () => {
    const entry = browserItemToEntry(
      {
        url: 'https://github.com/o/r/issues/5',
        title: 'Fix the bug · Issue #5 · o/r',
        lastVisitTime: 1,
      },
      2,
    );
    expect(entry?.title).toBe('o/r · Fix the bug');
  });

  it('rejects non-github, non-repo, and empty URLs', () => {
    expect(browserItemToEntry({ url: 'https://example.com/o/r' }, 1)).toBeNull();
    expect(browserItemToEntry({ url: 'https://github.com/settings' }, 1)).toBeNull();
    expect(browserItemToEntry({}, 1)).toBeNull();
  });
});
