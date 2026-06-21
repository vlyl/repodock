import { describe, expect, it } from 'vitest';
import { isRepoPage, locationLabelFor } from '@/core/context';

describe('page-kind helpers', () => {
  it('identifies repository pages', () => {
    expect(isRepoPage('code-blob')).toBe(true);
    expect(isRepoPage('pull-request')).toBe(true);
    expect(isRepoPage('non-repo')).toBe(false);
    expect(isRepoPage('user-profile')).toBe(false);
  });

  it('maps page kinds to labels', () => {
    expect(locationLabelFor('pull-request')).toBe('Pull Request');
    expect(locationLabelFor('code-tree')).toBe('Code');
    expect(locationLabelFor('unknown')).toBe('GitHub');
  });
});
