import { describe, expect, it } from 'vitest';
import { resolveContext } from '@/core/context';
import { makeDoc } from '../helpers/dom';

const NOW = 1_700_000_000_000;

describe('resolveContext — URL only', () => {
  it('resolves structure from the URL without a document', () => {
    const ctx = resolveContext({
      url: 'https://github.com/facebook/react/blob/main/index.js#L5',
      now: NOW,
    });
    expect(ctx.repository?.nwo).toBe('facebook/react');
    expect(ctx.pageKind).toBe('code-blob');
    expect(ctx.ref?.value).toBe('main');
    expect(ctx.path?.value).toBe('index.js');
    expect(ctx.lineRange).toEqual({ start: 5 });
    expect(ctx.safeUrl).toBe('https://github.com/facebook/react/blob/main/index.js#L5');
    expect(ctx.resolvedAt).toBe(NOW);
  });

  it('returns a minimal context for an unparseable URL', () => {
    const ctx = resolveContext({ url: 'not a url', now: NOW });
    expect(ctx.pageKind).toBe('unknown');
    expect(ctx.repository).toBeUndefined();
  });
});

describe('resolveContext — DOM refinement', () => {
  it('lets the embedded payload correct a slash-containing branch split', () => {
    const ctx = resolveContext({
      url: 'https://github.com/o/r/tree/feature/login/src/app',
      document: makeDoc({
        embedded: {
          repo: { name: 'r', ownerLogin: 'o' },
          refInfo: { name: 'feature/login', refType: 'branch' },
          path: 'src/app',
          tree: {},
        },
      }),
      now: NOW,
    });
    expect(ctx.ref).toMatchObject({ value: 'feature/login', type: 'branch', confidence: 'high' });
    expect(ctx.path?.value).toBe('src/app');
    expect(ctx.path?.kind).toBe('directory');
  });

  it('attaches an item title from the Open Graph title', () => {
    const ctx = resolveContext({
      url: 'https://github.com/o/r/pull/184',
      document: makeDoc({
        embedded: { repo: { name: 'r', ownerLogin: 'o' } },
        ogTitle: 'Add login flow · Pull Request #184 · o/r',
      }),
      now: NOW,
    });
    expect(ctx.item).toMatchObject({ type: 'pull', id: '184', title: 'Add login flow' });
  });

  it('falls back to octolytics metadata for the repository', () => {
    const ctx = resolveContext({
      url: 'https://github.com/o/r/actions',
      document: makeDoc({ octolyticsNwo: 'o/r' }),
      now: NOW,
    });
    expect(ctx.repository?.nwo).toBe('o/r');
  });
});

describe('resolveContext — staleness guard', () => {
  it('ignores DOM facts whose repository disagrees with the URL', () => {
    const ctx = resolveContext({
      url: 'https://github.com/correct/repo/tree/main',
      document: makeDoc({
        embedded: {
          repo: { name: 'repo', ownerLogin: 'stale' },
          refInfo: { name: 'other-branch', refType: 'branch' },
        },
      }),
      now: NOW,
    });
    // The URL says correct/repo; the DOM still references the previous page.
    expect(ctx.repository?.nwo).toBe('correct/repo');
    expect(ctx.ref?.value).toBe('main');
    expect(ctx.diagnostics?.warnings.some((w) => w.includes('mid-navigation'))).toBe(true);
  });

  it('does not adopt a stale DOM repository on a non-repo page', () => {
    // Navigating to /settings while the previous repo page's DOM lingers.
    const ctx = resolveContext({
      url: 'https://github.com/settings/profile',
      document: makeDoc({
        embedded: {
          repo: { name: 'react', ownerLogin: 'facebook' },
          refInfo: { name: 'main', refType: 'branch' },
        },
      }),
      now: NOW,
    });
    expect(ctx.pageKind).toBe('non-repo');
    expect(ctx.repository).toBeUndefined();
    expect(ctx.ref).toBeUndefined();
    expect(ctx.diagnostics?.warnings.some((w) => w.includes('mid-navigation'))).toBe(true);
  });
});

describe('resolveContext — viewer', () => {
  it('captures the logged-in login without inferring participation', () => {
    const ctx = resolveContext({
      url: 'https://github.com/facebook/react',
      document: makeDoc({ userLogin: 'octocat' }),
      now: NOW,
    });
    expect(ctx.viewer?.login).toBe('octocat');
    expect(ctx.viewer?.participant).toBeUndefined();
  });

  it('marks participation when the viewer appears in an issue sidebar', () => {
    const ctx = resolveContext({
      url: 'https://github.com/facebook/react/issues/5',
      document: makeDoc({
        userLogin: 'octocat',
        octolyticsNwo: 'facebook/react',
        bodyHtml:
          '<div id="partial-discussion-sidebar"><a href="/octocat"><img alt="@octocat"></a></div>',
      }),
      now: NOW,
    });
    expect(ctx.viewer).toEqual({ login: 'octocat', participant: true });
  });

  it('does not infer participation on non-issue pages', () => {
    const ctx = resolveContext({
      url: 'https://github.com/facebook/react',
      document: makeDoc({
        userLogin: 'octocat',
        bodyHtml: '<div id="partial-discussion-sidebar"><a href="/octocat"></a></div>',
      }),
      now: NOW,
    });
    expect(ctx.viewer?.participant).toBeUndefined();
  });
});
