import { describe, expect, it } from 'vitest';
import { resolveContext } from '@/core/context';
import type { HistoryEntry, HistoryState } from '@/core/history';
import {
  clearUnpinned,
  entryFromContext,
  groupByRepository,
  isInvolvedEntry,
  mergeHistories,
  recordVisit,
  removeEntry,
  searchEntries,
  setPinned,
  sortForDisplay,
  trimUnpinned,
  upsertVisit,
} from '@/core/history';
import { makeDoc } from '../helpers/dom';

function makeEntry(partial: Partial<HistoryEntry> & { key: string }): HistoryEntry {
  return {
    safeUrl: `https://github.com${partial.key}`,
    pageKind: 'repo-home',
    locationLabel: 'Code',
    title: partial.key,
    firstVisited: 1,
    lastVisited: 1,
    visitCount: 1,
    pinned: false,
    parserVersion: 1,
    ...partial,
  };
}

describe('entryFromContext', () => {
  it('returns null when there is no repository', () => {
    const ctx = resolveContext({ url: 'https://github.com/settings' });
    expect(entryFromContext(ctx, 1)).toBeNull();
  });

  it('builds a deduped entry with a canonical key', () => {
    const ctx = resolveContext({ url: 'https://github.com/o/r/blob/main/a.ts#L3' });
    const entry = entryFromContext(ctx, 123);
    expect(entry?.key).toBe('https://github.com/o/r/blob/main/a.ts');
    expect(entry?.nwo).toBe('o/r');
    expect(entry?.ref).toBe('main');
    expect(entry?.path).toBe('a.ts');
    expect(entry?.lineStart).toBe(3);
    expect(entry?.firstVisited).toBe(123);
    expect(entry?.visitCount).toBe(1);
  });
});

describe('upsertVisit', () => {
  it('inserts a new entry at the front', () => {
    const state: HistoryState = { entries: [makeEntry({ key: '/a' })] };
    const next = upsertVisit(state, makeEntry({ key: '/b' }));
    expect(next.entries.map((e) => e.key)).toEqual(['/b', '/a']);
  });

  it('merges a repeat visit, bumping count and preserving pin + firstVisited', () => {
    const state: HistoryState = {
      entries: [
        makeEntry({ key: '/a', firstVisited: 10, lastVisited: 10, visitCount: 2, pinned: true }),
      ],
    };
    const next = upsertVisit(state, makeEntry({ key: '/a', firstVisited: 50, lastVisited: 50 }));
    const entry = next.entries[0]!;
    expect(entry.visitCount).toBe(3);
    expect(entry.firstVisited).toBe(10);
    expect(entry.lastVisited).toBe(50);
    expect(entry.pinned).toBe(true);
  });
});

describe('trimUnpinned', () => {
  it('keeps all pinned entries and the most recent unpinned within the limit', () => {
    const entries = [
      makeEntry({ key: '/pin', pinned: true, lastVisited: 1 }),
      makeEntry({ key: '/new', lastVisited: 100 }),
      makeEntry({ key: '/mid', lastVisited: 50 }),
      makeEntry({ key: '/old', lastVisited: 10 }),
    ];
    const trimmed = trimUnpinned(entries, 2);
    const keys = trimmed.map((e) => e.key);
    expect(keys).toContain('/pin');
    expect(keys).toContain('/new');
    expect(keys).toContain('/mid');
    expect(keys).not.toContain('/old');
  });
});

describe('recordVisit', () => {
  it('records, dedupes and trims to the limit', () => {
    const ctx = resolveContext({ url: 'https://github.com/o/r/issues/1' });
    let state: HistoryState = { entries: [] };
    state = recordVisit(state, ctx, 1, 100);
    state = recordVisit(state, ctx, 2, 100);
    expect(state.entries).toHaveLength(1);
    expect(state.entries[0]!.visitCount).toBe(2);
  });
});

describe('searchEntries', () => {
  const entries = [
    makeEntry({
      key: '/1',
      title: 'facebook/react index.js',
      nwo: 'facebook/react',
      path: 'index.js',
    }),
    makeEntry({ key: '/2', title: 'vuejs/core main', nwo: 'vuejs/core', ref: 'main' }),
  ];

  it('matches all tokens against the entry fields', () => {
    expect(searchEntries(entries, 'react index').map((e) => e.key)).toEqual(['/1']);
    expect(searchEntries(entries, 'vue')).toHaveLength(1);
    expect(searchEntries(entries, '')).toHaveLength(2);
    expect(searchEntries(entries, 'nonexistent')).toHaveLength(0);
  });
});

describe('sortForDisplay', () => {
  it('orders pinned first, then by recency', () => {
    const entries = [
      makeEntry({ key: '/a', lastVisited: 10 }),
      makeEntry({ key: '/b', lastVisited: 30, pinned: true }),
      makeEntry({ key: '/c', lastVisited: 20 }),
    ];
    expect(sortForDisplay(entries).map((e) => e.key)).toEqual(['/b', '/c', '/a']);
  });
});

describe('mutations', () => {
  const base: HistoryState = {
    entries: [makeEntry({ key: '/a', pinned: true }), makeEntry({ key: '/b' })],
  };

  it('pins, removes and clears unpinned', () => {
    expect(setPinned(base, '/b', true).entries.every((e) => e.pinned)).toBe(true);
    expect(removeEntry(base, '/a').entries.map((e) => e.key)).toEqual(['/b']);
    expect(clearUnpinned(base).entries.map((e) => e.key)).toEqual(['/a']);
  });
});

describe('groupByRepository', () => {
  it('groups by repo, newest within each, most-recent group first', () => {
    const groups = groupByRepository([
      makeEntry({ key: '/a/1', nwo: 'a/x', lastVisited: 10 }),
      makeEntry({ key: '/a/2', nwo: 'a/x', lastVisited: 30 }),
      makeEntry({ key: '/b/1', nwo: 'b/y', lastVisited: 20 }),
      makeEntry({ key: '/none', lastVisited: 5 }),
    ]);
    expect(groups.map((g) => g.label)).toEqual(['a/x', 'b/y', 'Other']);
    expect(groups[0]!.entries.map((e) => e.key)).toEqual(['/a/2', '/a/1']);
  });
});

describe('mergeHistories', () => {
  it('dedupes by key, preferring owned entries', () => {
    const owned = [makeEntry({ key: '/x', title: 'owned', pinned: true })];
    const extra = [
      makeEntry({ key: '/x', title: 'browser' }),
      makeEntry({ key: '/y', title: 'browser-only' }),
    ];
    const merged = mergeHistories(owned, extra);
    expect(merged.map((e) => e.key).sort()).toEqual(['/x', '/y']);
    expect(merged.find((e) => e.key === '/x')!.title).toBe('owned');
  });
});

describe('involvement', () => {
  it('flags entries in the viewer’s own namespace', () => {
    const ctx = resolveContext({
      url: 'https://github.com/octocat/project',
      document: makeDoc({ userLogin: 'octocat', octolyticsNwo: 'octocat/project' }),
    });
    expect(entryFromContext(ctx, 1)?.involved).toBe(true);
  });

  it('flags issues the viewer participates in, even in another owner’s repo', () => {
    const ctx = resolveContext({
      url: 'https://github.com/acme/project/issues/1',
      document: makeDoc({
        userLogin: 'octocat',
        octolyticsNwo: 'acme/project',
        bodyHtml: '<div id="partial-discussion-sidebar"><a href="/octocat"></a></div>',
      }),
    });
    expect(entryFromContext(ctx, 1)?.involved).toBe(true);
  });

  it('leaves unrelated pages unflagged', () => {
    const ctx = resolveContext({
      url: 'https://github.com/acme/project',
      document: makeDoc({ userLogin: 'octocat', octolyticsNwo: 'acme/project' }),
    });
    expect(entryFromContext(ctx, 1)?.involved).toBeUndefined();
  });

  it('isInvolvedEntry combines the live owner match with the stored flag', () => {
    expect(isInvolvedEntry(makeEntry({ key: '/octocat/r', owner: 'octocat' }), 'octocat')).toBe(
      true,
    );
    expect(isInvolvedEntry(makeEntry({ key: '/acme/r', owner: 'acme' }), 'octocat')).toBe(false);
    expect(
      isInvolvedEntry(makeEntry({ key: '/acme/r', owner: 'acme', involved: true }), 'octocat'),
    ).toBe(true);
    expect(isInvolvedEntry(makeEntry({ key: '/octocat/r', owner: 'octocat' }), undefined)).toBe(
      false,
    );
  });

  it('keeps involvement sticky across an anonymous re-visit', () => {
    const before: HistoryState = {
      entries: [makeEntry({ key: '/o/r', owner: 'o', involved: true, lastVisited: 1 })],
    };
    const merged = upsertVisit(before, makeEntry({ key: '/o/r', owner: 'o', lastVisited: 2 }));
    expect(merged.entries[0]?.involved).toBe(true);
  });
});
