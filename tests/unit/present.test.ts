import { describe, expect, it } from 'vitest';
import { resolveContext } from '@/core/context';
import { buildSegments, contextSummary, contextTitle } from '@/core/context/present';
import { makeDoc } from '../helpers/dom';

// A realistic file page: the DOM confirms `main` is a branch, which the URL
// alone cannot know.
const blobCtx = () =>
  resolveContext({
    url: 'https://github.com/facebook/react/blob/main/packages/react/index.js#L10-L20',
    document: makeDoc({
      embedded: {
        repo: { name: 'react', ownerLogin: 'facebook', defaultBranch: 'main' },
        refInfo: { name: 'main', refType: 'branch' },
        path: 'packages/react/index.js',
        blob: {},
      },
    }),
  });

describe('buildSegments', () => {
  it('produces interactive repo, ref, breadcrumb and line segments', () => {
    const segments = buildSegments(blobCtx());
    const byKind = (kind: string) => segments.filter((s) => s.kind === kind);

    expect(byKind('repo')[0]).toMatchObject({
      text: 'facebook/react',
      href: 'https://github.com/facebook/react',
    });
    expect(byKind('ref')[0]).toMatchObject({
      text: 'main',
      href: 'https://github.com/facebook/react/tree/main',
    });

    const crumbs = byKind('crumb');
    expect(crumbs.map((c) => c.text)).toEqual(['packages', 'react', 'index.js']);
    const file = crumbs[crumbs.length - 1]!;
    expect(file.isFile).toBe(true);
    expect(file.href).toBe('https://github.com/facebook/react/blob/main/packages/react/index.js');

    expect(byKind('lines')[0]?.text).toBe('L10-L20');
  });

  it('hides labels when requested', () => {
    const withLabels = buildSegments(blobCtx(), { showLabels: true });
    const withoutLabels = buildSegments(blobCtx(), { showLabels: false });
    expect(withLabels.find((s) => s.kind === 'ref')?.label).toBe('branch');
    expect(withoutLabels.find((s) => s.kind === 'ref')?.label).toBeUndefined();
  });

  it('encodes slashes in refs as path separators, not %2F', () => {
    const ctx = resolveContext({
      url: 'https://github.com/o/r/tree/feature/x',
      document: makeDoc({
        embedded: {
          repo: { name: 'r', ownerLogin: 'o' },
          refInfo: { name: 'feature/x', refType: 'branch' },
        },
      }),
    });
    const ref = buildSegments(ctx).find((s) => s.kind === 'ref');
    expect(ref?.href).toBe('https://github.com/o/r/tree/feature/x');
  });
});

describe('contextTitle', () => {
  it('uses the path for file pages', () => {
    expect(contextTitle(blobCtx())).toBe('facebook/react · packages/react/index.js');
  });

  it('uses the item title for pull requests', () => {
    const ctx = resolveContext({
      url: 'https://github.com/o/r/pull/184',
      document: makeDoc({
        embedded: { repo: { name: 'r', ownerLogin: 'o' } },
        ogTitle: 'Add login flow · Pull Request #184 · o/r',
      }),
    });
    expect(contextTitle(ctx)).toBe('o/r · Add login flow (#184)');
  });
});

describe('contextSummary', () => {
  it('joins the salient parts with pipes', () => {
    const summary = contextSummary(blobCtx());
    expect(summary).toContain('facebook/react');
    expect(summary).toContain('branch: main');
    expect(summary).toContain('Code');
    expect(summary).toContain('packages/react/index.js');
    expect(summary).toContain('L10-L20');
  });
});
