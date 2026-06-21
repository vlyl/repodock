import { describe, expect, it } from 'vitest';
import { extractEmbeddedFacts } from '@/core/context/embedded-data';
import { makeDoc } from '../helpers/dom';

describe('extractEmbeddedFacts', () => {
  it('extracts repo, ref and path from a blob payload', () => {
    const doc = makeDoc({
      embedded: {
        repo: { name: 'react', ownerLogin: 'facebook', defaultBranch: 'main' },
        refInfo: { name: 'feature/login', refType: 'branch', currentOid: 'abc' },
        path: 'packages/react/index.js',
        blob: {},
      },
    });
    expect(extractEmbeddedFacts(doc)).toEqual({
      owner: 'facebook',
      name: 'react',
      defaultBranch: 'main',
      ref: { value: 'feature/login', type: 'branch' },
      path: { value: 'packages/react/index.js', kind: 'file' },
    });
  });

  it('reports a directory path for tree payloads', () => {
    const doc = makeDoc({
      embedded: { refInfo: { name: 'main', refType: 'branch' }, path: 'src', tree: {} },
    });
    expect(extractEmbeddedFacts(doc)?.path).toEqual({ value: 'src', kind: 'directory' });
  });

  it('maps a tag refType', () => {
    const doc = makeDoc({ embedded: { refInfo: { name: 'v1.0.0', refType: 'tag' } } });
    expect(extractEmbeddedFacts(doc)?.ref).toEqual({ value: 'v1.0.0', type: 'tag' });
  });

  it('returns undefined for missing or malformed payloads', () => {
    expect(extractEmbeddedFacts(makeDoc())).toBeUndefined();
    expect(extractEmbeddedFacts(makeDoc({ embeddedRaw: 'not json' }))).toBeUndefined();
    expect(extractEmbeddedFacts(makeDoc({ embedded: { unrelated: true } }))).toBeUndefined();
  });
});
