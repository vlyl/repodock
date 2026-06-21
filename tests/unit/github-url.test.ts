import { describe, expect, it } from 'vitest';
import {
  canonicalKeyFor,
  parseGitHubUrl,
  parseLineRange,
  sanitizeGitHubUrl,
} from '@/core/context/github-url';

const parse = (url: string) => parseGitHubUrl(new URL(url));

describe('parseGitHubUrl — page classification', () => {
  it('classifies the dashboard / home as non-repo', () => {
    expect(parse('https://github.com/').pageKind).toBe('non-repo');
  });

  it('classifies a bare owner as a profile', () => {
    const facts = parse('https://github.com/sindresorhus');
    expect(facts.pageKind).toBe('user-profile');
    expect(facts.repository).toBeUndefined();
  });

  it('treats reserved roots as non-repo, not owners', () => {
    expect(parse('https://github.com/settings/profile').pageKind).toBe('non-repo');
    expect(parse('https://github.com/orgs/nodejs/people').pageKind).toBe('non-repo');
    expect(parse('https://github.com/marketplace').pageKind).toBe('non-repo');
  });

  it('classifies a repository home', () => {
    const facts = parse('https://github.com/facebook/react');
    expect(facts.pageKind).toBe('repo-home');
    expect(facts.repository).toEqual({ owner: 'facebook', name: 'react', nwo: 'facebook/react' });
  });
});

describe('parseGitHubUrl — code pages', () => {
  it('parses a tree (directory) with ref and path', () => {
    const facts = parse('https://github.com/facebook/react/tree/main/packages/react');
    expect(facts.pageKind).toBe('code-tree');
    expect(facts.ref?.value).toBe('main');
    expect(facts.ref?.type).toBe('unknown');
    expect(facts.path?.value).toBe('packages/react');
    expect(facts.path?.kind).toBe('directory');
  });

  it('parses a blob (file) with a line range', () => {
    const facts = parse(
      'https://github.com/facebook/react/blob/main/packages/react/index.js#L10-L20',
    );
    expect(facts.pageKind).toBe('code-blob');
    expect(facts.path?.kind).toBe('file');
    expect(facts.path?.fileName).toBe('index.js');
    expect(facts.lineRange).toEqual({ start: 10, end: 20 });
  });

  it('detects a commit SHA ref by shape', () => {
    const facts = parse('https://github.com/o/r/blob/a1b2c3d4/src/x.ts');
    expect(facts.ref?.type).toBe('commit');
  });

  it('marks an unambiguous ref (no path) as high confidence', () => {
    const facts = parse('https://github.com/o/r/tree/main');
    expect(facts.ref?.confidence).toBe('high');
  });

  it('marks a ref preceding a path as only medium confidence', () => {
    const facts = parse('https://github.com/o/r/tree/feature/foo/src');
    // The URL cannot know the branch is `feature/foo`; it guesses `feature`.
    expect(facts.ref?.value).toBe('feature');
    expect(facts.ref?.confidence).toBe('medium');
  });
});

describe('parseGitHubUrl — items', () => {
  it('parses a pull request and its sub-tab', () => {
    expect(parse('https://github.com/o/r/pull/184').item).toEqual({ type: 'pull', id: '184' });
    expect(parse('https://github.com/o/r/pull/184').sectionLabel).toBe('Conversation');
    expect(parse('https://github.com/o/r/pull/184/files').sectionLabel).toBe('Files changed');
  });

  it('distinguishes issue from issue list', () => {
    expect(parse('https://github.com/o/r/issues/42').pageKind).toBe('issue');
    expect(parse('https://github.com/o/r/issues').pageKind).toBe('issue-list');
    expect(parse('https://github.com/o/r/issues/new').pageKind).toBe('issue-list');
  });

  it('parses commits, workflow runs and releases', () => {
    expect(parse('https://github.com/o/r/commit/abcdef1').item).toEqual({
      type: 'commit',
      id: 'abcdef1',
    });
    expect(parse('https://github.com/o/r/actions/runs/999').item).toEqual({
      type: 'workflow-run',
      id: '999',
    });
    const release = parse('https://github.com/o/r/releases/tag/v1.2.0');
    expect(release.item).toEqual({ type: 'release', id: 'v1.2.0' });
    expect(release.ref).toMatchObject({ value: 'v1.2.0', type: 'tag' });
  });

  it('parses a comparison', () => {
    const facts = parse('https://github.com/o/r/compare/main...feature/login');
    expect(facts.pageKind).toBe('compare');
    expect(facts.compare).toEqual({ base: 'main', head: 'feature/login' });
  });

  it('treats a single-ref compare as head-only', () => {
    expect(parse('https://github.com/o/r/compare/feature').compare).toEqual({ head: 'feature' });
  });
});

describe('parseGitHubUrl — sections', () => {
  it.each([
    ['https://github.com/o/r/actions', 'actions'],
    ['https://github.com/o/r/releases', 'release-list'],
    ['https://github.com/o/r/tags', 'tag-list'],
    ['https://github.com/o/r/branches', 'branches'],
    ['https://github.com/o/r/wiki', 'wiki'],
    ['https://github.com/o/r/settings', 'settings'],
    ['https://github.com/o/r/security', 'security'],
    ['https://github.com/o/r/pulse', 'insights'],
    ['https://github.com/o/r/discussions', 'discussion-list'],
    ['https://github.com/o/r/labels', 'repo-other'],
  ])('classifies %s as %s', (url, expected) => {
    expect(parse(url).pageKind).toBe(expected);
  });
});

describe('parseLineRange', () => {
  it('parses single and ranged anchors', () => {
    expect(parseLineRange('#L10')).toEqual({ start: 10 });
    expect(parseLineRange('#L10-L20')).toEqual({ start: 10, end: 20 });
    expect(parseLineRange('#L10C5-L20C8')).toEqual({ start: 10, end: 20 });
  });

  it('ignores invalid or descending ranges', () => {
    expect(parseLineRange('#L20-L10')).toEqual({ start: 20 });
    expect(parseLineRange('#section')).toBeUndefined();
    expect(parseLineRange('#')).toBeUndefined();
  });
});

describe('sanitizeGitHubUrl', () => {
  it('strips arbitrary params but keeps the tab allow-list and line anchors', () => {
    const result = sanitizeGitHubUrl('https://github.com/o/r/blob/main/x?token=abc&tab=readme#L5');
    expect(result?.safeUrl).toBe('https://github.com/o/r/blob/main/x?tab=readme#L5');
  });

  it('strips OAuth codes and session tokens', () => {
    const result = sanitizeGitHubUrl(
      'https://github.com/login/oauth/authorize?code=secret&state=xyz',
    );
    expect(result?.safeUrl).toBe('https://github.com/login/oauth/authorize');
  });

  it('drops non-line-anchor hashes', () => {
    const result = sanitizeGitHubUrl('https://github.com/o/r/issues/1#issuecomment-5');
    expect(result?.safeUrl).toBe('https://github.com/o/r/issues/1');
  });

  it('normalizes www and trailing slashes', () => {
    expect(sanitizeGitHubUrl('https://www.github.com/o/r/')?.safeUrl).toBe(
      'https://github.com/o/r',
    );
  });

  it('rejects non-http(s) protocols', () => {
    expect(sanitizeGitHubUrl('javascript:alert(1)')).toBeNull();
  });
});

describe('canonicalKeyFor', () => {
  it('drops the line anchor so line ranges of one file dedupe', () => {
    expect(canonicalKeyFor('https://github.com/o/r/blob/main/x#L5')).toBe(
      'https://github.com/o/r/blob/main/x',
    );
  });
});
