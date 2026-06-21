import { describe, expect, it } from 'vitest';
import { cleanItemTitle, extractDomFacts } from '@/core/context/dom';
import { makeDoc } from '../helpers/dom';

describe('extractDomFacts', () => {
  it('prefers embedded facts for repo, ref, path and default branch', () => {
    const facts = extractDomFacts(
      makeDoc({
        embedded: {
          repo: { name: 'r', ownerLogin: 'o', defaultBranch: 'main' },
          refInfo: { name: 'main', refType: 'branch' },
          path: 'a/b.ts',
          blob: {},
        },
      }),
    );
    expect(facts.repository).toMatchObject({ value: { nwo: 'o/r' }, source: 'semantic-dom' });
    expect(facts.ref).toMatchObject({ value: 'main', type: 'branch', confidence: 'high' });
    expect(facts.path).toMatchObject({ value: 'a/b.ts', kind: 'file', fileName: 'b.ts' });
    expect(facts.defaultBranch).toBe('main');
    expect(facts.matched.embeddedData).toBe(true);
  });

  it('falls back to octolytics metadata, then the canonical link', () => {
    const meta = extractDomFacts(makeDoc({ octolyticsNwo: 'o/r' }));
    expect(meta.repository).toMatchObject({ value: { nwo: 'o/r' }, source: 'metadata' });

    const canonical = extractDomFacts(makeDoc({ canonicalHref: 'https://github.com/o/r/pull/1' }));
    expect(canonical.repository).toMatchObject({ value: { nwo: 'o/r' }, source: 'canonical-link' });
  });

  it('ignores a malformed octolytics value', () => {
    expect(extractDomFacts(makeDoc({ octolyticsNwo: 'noslash' })).repository).toBeUndefined();
  });

  it('captures the og title and DOM compare refs', () => {
    const facts = extractDomFacts(makeDoc({ ogTitle: 'Title', baseRef: 'main', headRef: 'dev' }));
    expect(facts.ogTitle).toBe('Title');
    expect(facts.compare).toEqual({ base: 'main', head: 'dev' });
    expect(facts.matched.prRefs).toBe(true);
  });
});

describe('cleanItemTitle', () => {
  it('strips trailing GitHub decoration and keeps plain titles', () => {
    expect(cleanItemTitle('Add login · Pull Request #1 · o/r')).toBe('Add login');
    expect(cleanItemTitle('Plain title')).toBe('Plain title');
  });
});
