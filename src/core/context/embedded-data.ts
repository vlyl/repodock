import { z } from 'zod';
import type { PathKind, RefType } from './types';

/**
 * Modern (React) GitHub pages embed a JSON payload describing the current ref
 * and path. It is the single most reliable in-page source for disambiguating a
 * ref from a path when a branch name contains slashes. The shape is internal to
 * GitHub and may change, so we validate a minimal slice with Zod and degrade
 * gracefully when it is absent or differently shaped.
 */
const embeddedSchema = z.object({
  payload: z.object({
    repo: z
      .object({
        name: z.string().optional(),
        ownerLogin: z.string().optional(),
        defaultBranch: z.string().optional(),
      })
      .optional(),
    refInfo: z
      .object({
        name: z.string().optional(),
        refType: z.string().optional(),
        currentOid: z.string().optional(),
      })
      .optional(),
    path: z.string().optional(),
    tree: z.unknown().optional(),
    blob: z.unknown().optional(),
  }),
});

const SHA_RE = /^[0-9a-f]{7,40}$/i;

export interface EmbeddedRef {
  value: string;
  type: RefType;
}

export interface EmbeddedPath {
  value: string;
  kind: PathKind;
}

export interface EmbeddedFacts {
  owner?: string;
  name?: string;
  defaultBranch?: string;
  ref?: EmbeddedRef;
  path?: EmbeddedPath;
}

function mapRefType(raw: string | undefined, value: string): RefType {
  switch (raw) {
    case 'branch':
      return 'branch';
    case 'tag':
      return 'tag';
    case 'commit':
      return 'commit';
    default:
      return SHA_RE.test(value) ? 'commit' : 'unknown';
  }
}

/**
 * Extract repository, ref, and path facts from GitHub's embedded React payload.
 * Returns `undefined` when no parseable payload with useful fields is present.
 */
export function extractEmbeddedFacts(doc: Document): EmbeddedFacts | undefined {
  const scripts = doc.querySelectorAll<HTMLScriptElement>(
    'script[type="application/json"][data-target="react-app.embeddedData"]',
  );

  for (const script of scripts) {
    const text = script.textContent;
    if (!text) continue;

    let json: unknown;
    try {
      json = JSON.parse(text);
    } catch {
      continue;
    }

    const parsed = embeddedSchema.safeParse(json);
    if (!parsed.success) continue;

    const { payload } = parsed.data;
    // Treat empty strings as "not useful", so a logical OR (not ??) is intended.
    const hasUseful = Boolean(payload.refInfo?.name) || Boolean(payload.repo?.name);
    if (!hasUseful) continue;

    const facts: EmbeddedFacts = {};
    if (payload.repo?.ownerLogin) facts.owner = payload.repo.ownerLogin;
    if (payload.repo?.name) facts.name = payload.repo.name;
    if (payload.repo?.defaultBranch) facts.defaultBranch = payload.repo.defaultBranch;

    const refName = payload.refInfo?.name;
    if (refName) {
      facts.ref = { value: refName, type: mapRefType(payload.refInfo?.refType, refName) };
    }

    if (typeof payload.path === 'string' && payload.path.length > 0) {
      const kind: PathKind =
        payload.blob !== undefined ? 'file' : payload.tree !== undefined ? 'directory' : 'unknown';
      facts.path = { value: payload.path.replace(/^\/+/, ''), kind };
    }

    return facts;
  }

  return undefined;
}
