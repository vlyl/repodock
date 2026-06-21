import { describe, expect, it } from 'vitest';
import { resolveContext } from '@/core/context';
import { buildSegments, contextSummary, contextTitle } from '@/core/context/present';
import { makeDoc } from '../helpers/dom';

const repoDoc = (extra: Record<string, unknown> = {}, ogTitle?: string) =>
  makeDoc({ embedded: { repo: { name: 'r', ownerLogin: 'o' }, ...extra }, ogTitle });

describe('buildSegments — item kinds', () => {
  it('renders an item segment with the title for issues', () => {
    const ctx = resolveContext({
      url: 'https://github.com/o/r/issues/5',
      document: repoDoc({}, 'Broken build · Issue #5 · o/r'),
    });
    const item = buildSegments(ctx).find((s) => s.kind === 'item');
    expect(item?.text).toBe('#5 Broken build');
  });

  it('labels workflow runs', () => {
    const ctx = resolveContext({ url: 'https://github.com/o/r/actions/runs/42' });
    expect(buildSegments(ctx).find((s) => s.kind === 'item')?.text).toBe('Run 42');
  });

  it('omits an item segment for commits (the ref shows the SHA)', () => {
    const ctx = resolveContext({ url: 'https://github.com/o/r/commit/abcdef1234' });
    expect(buildSegments(ctx).some((s) => s.kind === 'item')).toBe(false);
    expect(buildSegments(ctx).find((s) => s.kind === 'ref')?.text).toBe('abcdef1');
  });

  it('renders a compare segment and a section segment', () => {
    // Display is head → base (source → target), e.g. `dev → main`.
    const compare = resolveContext({ url: 'https://github.com/o/r/compare/main...dev' });
    expect(buildSegments(compare).find((s) => s.kind === 'compare')?.text).toBe('dev → main');

    const prFiles = resolveContext({ url: 'https://github.com/o/r/pull/1/files' });
    expect(buildSegments(prFiles).find((s) => s.kind === 'section')?.text).toBe('Files changed');
  });

  it('shows a pull request as head → base from the DOM', () => {
    const ctx = resolveContext({
      url: 'https://github.com/o/r/pull/184',
      document: repoDoc({}, undefined),
    });
    // The fixture has no PR refs; add them via a DOM with base/head.
    const withRefs = resolveContext({
      url: 'https://github.com/o/r/pull/184',
      document: makeDoc({
        embedded: { repo: { name: 'r', ownerLogin: 'o' } },
        baseRef: 'main',
        headRef: 'feature/login',
      }),
    });
    expect(buildSegments(ctx).find((s) => s.kind === 'compare')).toBeUndefined();
    expect(buildSegments(withRefs).find((s) => s.kind === 'compare')?.text).toBe(
      'feature/login → main',
    );
  });
});

describe('location URLs', () => {
  it.each([
    ['https://github.com/o/r/pulls', 'https://github.com/o/r/pulls'],
    ['https://github.com/o/r/issues', 'https://github.com/o/r/issues'],
    ['https://github.com/o/r/discussions', 'https://github.com/o/r/discussions'],
    ['https://github.com/o/r/releases', 'https://github.com/o/r/releases'],
    ['https://github.com/o/r/actions', 'https://github.com/o/r/actions'],
    ['https://github.com/o/r/commits/main', 'https://github.com/o/r/commits/main'],
    ['https://github.com/o/r/compare/a...b', 'https://github.com/o/r/compare'],
    ['https://github.com/o/r/settings', 'https://github.com/o/r'],
  ])('points the location segment of %s at %s', (url, expectedHref) => {
    const ctx = resolveContext({ url });
    expect(buildSegments(ctx).find((s) => s.kind === 'location')?.href).toBe(expectedHref);
  });
});

describe('contextTitle — all branches', () => {
  it('uses item titles or sensible fallbacks', () => {
    const commit = resolveContext({
      url: 'https://github.com/o/r/commit/abcdef1234',
      document: repoDoc({}, 'Fix the bug · o/r@abcdef'),
    });
    expect(contextTitle(commit)).toBe('o/r · Fix the bug');

    const commitNoTitle = resolveContext({ url: 'https://github.com/o/r/commit/abcdef1234' });
    expect(contextTitle(commitNoTitle)).toBe('o/r · Commit abcdef1');

    const issueNoTitle = resolveContext({ url: 'https://github.com/o/r/issues/9' });
    expect(contextTitle(issueNoTitle)).toBe('o/r · Issue #9');

    const release = resolveContext({ url: 'https://github.com/o/r/releases/tag/v2.0' });
    expect(contextTitle(release)).toBe('o/r · Release v2.0');

    const tree = resolveContext({ url: 'https://github.com/o/r/tree/main' });
    expect(contextTitle(tree)).toBe('o/r · main');

    const home = resolveContext({ url: 'https://github.com/o/r' });
    expect(contextTitle(home)).toBe('o/r · Code');

    const profile = resolveContext({ url: 'https://github.com/octocat' });
    expect(contextTitle(profile)).toBe('Profile');
  });
});

describe('contextSummary — branches', () => {
  it('includes compare refs and section, and degrades without a repo', () => {
    const compare = resolveContext({ url: 'https://github.com/o/r/compare/main...dev' });
    expect(contextSummary(compare)).toContain('dev → main');

    const profile = resolveContext({ url: 'https://github.com/octocat' });
    expect(contextSummary(profile)).toBe('Profile');
  });
});
