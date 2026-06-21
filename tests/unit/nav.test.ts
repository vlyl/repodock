import { describe, expect, it } from 'vitest';
import { activeNavSection, navSectionUrl, resolveContext } from '@/core/context';

describe('navSectionUrl', () => {
  const ctx = resolveContext({ url: 'https://github.com/o/r/issues/5' });

  it('builds section URLs for the current repository', () => {
    expect(navSectionUrl(ctx, 'code')).toBe('https://github.com/o/r');
    expect(navSectionUrl(ctx, 'issues')).toBe('https://github.com/o/r/issues');
    expect(navSectionUrl(ctx, 'pulls')).toBe('https://github.com/o/r/pulls');
    expect(navSectionUrl(ctx, 'insights')).toBe('https://github.com/o/r/pulse');
    expect(navSectionUrl(ctx, 'settings')).toBe('https://github.com/o/r/settings');
  });

  it('returns undefined without a repository', () => {
    const nonRepo = resolveContext({ url: 'https://github.com/settings' });
    expect(navSectionUrl(nonRepo, 'issues')).toBeUndefined();
  });
});

describe('activeNavSection', () => {
  it('maps page kinds to their section', () => {
    expect(activeNavSection('code-blob')).toBe('code');
    expect(activeNavSection('commit')).toBe('code');
    expect(activeNavSection('issue')).toBe('issues');
    expect(activeNavSection('pull-request')).toBe('pulls');
    expect(activeNavSection('actions-run')).toBe('actions');
    expect(activeNavSection('release-list')).toBe('releases');
    expect(activeNavSection('insights')).toBe('insights');
    expect(activeNavSection('non-repo')).toBeUndefined();
  });
});
