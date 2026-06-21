import type {
  CompareRefs,
  ContextItem,
  ContextPath,
  ContextRef,
  LineRange,
  PageKind,
  RefType,
  RepositoryRef,
} from './types';
import { locationLabelFor } from './page-kind';

/**
 * First path segments that are GitHub product pages rather than repository
 * owners. A URL like `/settings/profile` is not `owner=settings`.
 */
const RESERVED_ROOT_SEGMENTS = new Set<string>([
  'about',
  'account',
  'admin',
  'apps',
  'codespaces',
  'collections',
  'contact',
  'customer-stories',
  'dashboard',
  'enterprise',
  'events',
  'explore',
  'features',
  'gist',
  'issues',
  'join',
  'login',
  'logout',
  'marketplace',
  'new',
  'nonprofits',
  'notifications',
  'organizations',
  'orgs',
  'pricing',
  'pulls',
  'pulse',
  'readme',
  'search',
  'security',
  'sessions',
  'settings',
  'site',
  'sponsors',
  'stars',
  'team',
  'topics',
  'trending',
  'users',
  'watching',
]);

/** Query parameters that are safe and meaningful to retain in history URLs. */
export const ALLOWED_QUERY_PARAMS = new Set<string>(['tab']);

/** Matches a GitHub line anchor: `#L20`, `#L20-L35`, with optional columns. */
const LINE_ANCHOR_RE = /^L(\d+)(?:C\d+)?(?:-L(\d+)(?:C\d+)?)?$/;

/** Matches a full or abbreviated commit SHA. */
const SHA_RE = /^[0-9a-f]{7,40}$/i;

/** Verbs after `owner/repo` that introduce a `<ref>/<path>` tail. */
const REF_PATH_VERBS = new Set<string>(['tree', 'blob', 'raw', 'blame', 'edit', 'commits']);

/** Result of parsing a GitHub URL into structural facts. */
export interface UrlFacts {
  origin: string;
  pageKind: PageKind;
  locationLabel: string;
  repository?: RepositoryRef;
  ref?: ContextRef;
  path?: ContextPath;
  item?: ContextItem;
  compare?: CompareRefs;
  lineRange?: LineRange;
  sectionLabel?: string;
  segments: string[];
  warnings: string[];
}

function safeDecode(segment: string): string {
  try {
    return decodeURIComponent(segment);
  } catch {
    return segment;
  }
}

function splitPath(pathname: string): string[] {
  return pathname.split('/').filter((segment) => segment.length > 0);
}

/** Parse a URL hash such as `#L20-L35` into a {@link LineRange}. */
export function parseLineRange(hash: string): LineRange | undefined {
  const raw = hash.startsWith('#') ? hash.slice(1) : hash;
  const match = LINE_ANCHOR_RE.exec(raw);
  if (!match) return undefined;
  const start = Number.parseInt(match[1]!, 10);
  if (!Number.isFinite(start) || start <= 0) return undefined;
  const range: LineRange = { start };
  if (match[2] !== undefined) {
    const end = Number.parseInt(match[2], 10);
    if (Number.isFinite(end) && end >= start) range.end = end;
  }
  return range;
}

function makeRef(value: string, type: RefType, highConfidence: boolean): ContextRef {
  return {
    value,
    type,
    source: 'url',
    confidence: highConfidence ? 'high' : 'medium',
  };
}

function buildPath(decodedSegments: string[], kind: ContextPath['kind']): ContextPath {
  const value = decodedSegments.join('/');
  const path: ContextPath = {
    value,
    segments: decodedSegments,
    kind,
    source: 'url',
    // A single trailing path segment is unambiguous; deeper paths could be
    // skewed by a branch name that itself contains slashes.
    confidence: decodedSegments.length <= 1 ? 'high' : 'medium',
  };
  if (kind === 'file' && decodedSegments.length > 0) {
    path.fileName = decodedSegments[decodedSegments.length - 1];
  }
  return path;
}

/** Split the `<ref>/<path>` tail that follows verbs like `blob` and `tree`. */
function parseRefAndPath(
  tail: string[],
  pathKind: ContextPath['kind'],
): { ref?: ContextRef; path?: ContextPath } {
  if (tail.length === 0) return {};
  const rawRef = tail[0]!;
  const ref = safeDecode(rawRef);
  const refType: RefType = SHA_RE.test(rawRef) ? 'commit' : 'unknown';
  // Ref is unambiguous only when there is no following path to confuse the split.
  const refHighConfidence = tail.length === 1;
  const result: { ref?: ContextRef; path?: ContextPath } = {
    ref: makeRef(ref, refType, refHighConfidence),
  };
  const pathSegments = tail.slice(1).map(safeDecode);
  if (pathSegments.length > 0) {
    result.path = buildPath(pathSegments, pathKind);
  }
  return result;
}

function pullSectionLabel(section: string | undefined): string {
  switch (section) {
    case 'files':
      return 'Files changed';
    case 'commits':
      return 'Commits';
    case 'checks':
      return 'Checks';
    case 'conflicts':
      return 'Conflicts';
    default:
      return 'Conversation';
  }
}

function parseCompareSpec(spec: string): CompareRefs | undefined {
  if (spec.length === 0) return undefined;
  const decoded = safeDecode(spec);
  const tripleDot = decoded.split('...');
  if (tripleDot.length === 2) {
    return { base: tripleDot[0]!, head: tripleDot[1]! };
  }
  const doubleDot = decoded.split('..');
  if (doubleDot.length === 2) {
    return { base: doubleDot[0]!, head: doubleDot[1]! };
  }
  // A single ref means "compare the default branch with this one".
  return { head: decoded };
}

/** Map a recognized repository sub-section verb to a coarse page kind. */
function classifyRepoSection(segments: string[]): {
  pageKind: PageKind;
  ref?: ContextRef;
  path?: ContextPath;
  item?: ContextItem;
  compare?: CompareRefs;
  sectionLabel?: string;
} {
  const verb = segments[2];
  const tail = segments.slice(3);

  if (verb === undefined) {
    return { pageKind: 'repo-home' };
  }

  if (REF_PATH_VERBS.has(verb)) {
    if (verb === 'commits') {
      return { pageKind: 'commits-list', ...parseRefAndPath(tail, 'unknown') };
    }
    const pathKind: ContextPath['kind'] = verb === 'tree' ? 'directory' : 'file';
    const pageKind: PageKind = verb === 'tree' ? 'code-tree' : 'code-blob';
    return { pageKind, ...parseRefAndPath(tail, pathKind) };
  }

  switch (verb) {
    case 'commit': {
      const sha = tail[0];
      const item: ContextItem | undefined = sha
        ? { type: 'commit', id: safeDecode(sha) }
        : undefined;
      const ref = sha ? makeRef(safeDecode(sha), 'commit', true) : undefined;
      return { pageKind: 'commit', item, ref };
    }
    case 'pull':
    case 'pulls': {
      if (verb === 'pulls') return { pageKind: 'pull-list' };
      const number = tail[0];
      if (number && /^\d+$/.test(number)) {
        return {
          pageKind: 'pull-request',
          item: { type: 'pull', id: number },
          sectionLabel: pullSectionLabel(tail[1]),
        };
      }
      return { pageKind: 'pull-list' };
    }
    case 'issues': {
      const number = tail[0];
      if (number && /^\d+$/.test(number)) {
        return { pageKind: 'issue', item: { type: 'issue', id: number } };
      }
      return { pageKind: 'issue-list' };
    }
    case 'discussions': {
      const number = tail[0];
      if (number && /^\d+$/.test(number)) {
        return { pageKind: 'discussion', item: { type: 'discussion', id: number } };
      }
      return { pageKind: 'discussion-list' };
    }
    case 'actions': {
      if (tail[0] === 'runs' && tail[1]) {
        return {
          pageKind: 'actions-run',
          item: { type: 'workflow-run', id: tail[1] },
        };
      }
      return { pageKind: 'actions' };
    }
    case 'releases': {
      if (tail[0] === 'tag' && tail[1]) {
        const tag = safeDecode(tail[1]);
        return {
          pageKind: 'release',
          item: { type: 'release', id: tag },
          ref: makeRef(tag, 'tag', true),
        };
      }
      if (tail[0] === 'latest') {
        return { pageKind: 'release', item: { type: 'release', id: 'latest' } };
      }
      return { pageKind: 'release-list' };
    }
    case 'tags':
      return { pageKind: 'tag-list' };
    case 'branches':
      return { pageKind: 'branches' };
    case 'wiki':
      return { pageKind: 'wiki' };
    case 'settings':
      return { pageKind: 'settings' };
    case 'security':
      return { pageKind: 'security' };
    case 'pulse':
    case 'graphs':
    case 'network':
    case 'community':
      return { pageKind: 'insights' };
    case 'projects':
      return { pageKind: 'projects' };
    case 'compare': {
      const spec = tail.map(safeDecode).join('/');
      const compare = parseCompareSpec(spec);
      const item: ContextItem | undefined = spec ? { type: 'comparison', id: spec } : undefined;
      return { pageKind: 'compare', compare, item };
    }
    case 'find':
    case 'search':
      return { pageKind: 'repo-search' };
    default:
      return { pageKind: 'repo-other' };
  }
}

/**
 * Parse a GitHub URL into structural facts. This is the highest-trust source for
 * everything that is literally encoded in the URL; ambiguous splits are flagged
 * with lower confidence so DOM resolvers can override them.
 */
export function parseGitHubUrl(url: URL): UrlFacts {
  const segments = splitPath(url.pathname);
  const warnings: string[] = [];
  const lineRange = parseLineRange(url.hash);

  // No path: the GitHub dashboard / home.
  if (segments.length === 0) {
    return finalize({ origin: url.origin, pageKind: 'non-repo', segments, warnings, lineRange });
  }

  const first = segments[0]!;
  if (RESERVED_ROOT_SEGMENTS.has(first)) {
    return finalize({ origin: url.origin, pageKind: 'non-repo', segments, warnings, lineRange });
  }

  // `/owner` with nothing else is a user or organization profile.
  if (segments.length === 1) {
    return finalize({
      origin: url.origin,
      pageKind: 'user-profile',
      segments,
      warnings,
      lineRange,
    });
  }

  const owner = first;
  const name = segments[1]!;
  const repository: RepositoryRef = { owner, name, nwo: `${owner}/${name}` };
  const section = classifyRepoSection(segments);

  return finalize({
    origin: url.origin,
    pageKind: section.pageKind,
    repository,
    segments,
    warnings,
    lineRange,
    ref: section.ref,
    path: section.path,
    item: section.item,
    compare: section.compare,
    sectionLabel: section.sectionLabel,
  });
}

function finalize(facts: Omit<UrlFacts, 'locationLabel'>): UrlFacts {
  // Line ranges only make sense on file pages.
  const lineRange = facts.pageKind === 'code-blob' ? facts.lineRange : undefined;
  return {
    ...facts,
    ...(lineRange ? { lineRange } : { lineRange: undefined }),
    locationLabel: locationLabelFor(facts.pageKind),
  };
}

/**
 * Produce a sanitized URL safe to display and persist: only allow-listed query
 * parameters survive, and only line-anchor hashes are retained. This strips
 * OAuth codes, tokens, and any other arbitrary query content.
 */
export function sanitizeGitHubUrl(rawUrl: string): { safeUrl: string; origin: string } | null {
  let url: URL;
  try {
    url = new URL(rawUrl);
  } catch {
    return null;
  }
  if (url.protocol !== 'https:' && url.protocol !== 'http:') return null;

  // Normalize `www.github.com` to the canonical host.
  const host = url.host === 'www.github.com' ? 'github.com' : url.host;
  const origin = `${url.protocol}//${host}`;

  let pathname = url.pathname;
  if (pathname.length > 1 && pathname.endsWith('/')) {
    pathname = pathname.replace(/\/+$/, '');
  }

  const keptParams = new URLSearchParams();
  for (const [key, value] of url.searchParams) {
    if (ALLOWED_QUERY_PARAMS.has(key)) keptParams.append(key, value);
  }
  const search = keptParams.toString();

  const rawHash = url.hash.startsWith('#') ? url.hash.slice(1) : url.hash;
  const hash = LINE_ANCHOR_RE.test(rawHash) ? rawHash : '';

  const safeUrl = `${origin}${pathname}${search ? `?${search}` : ''}${hash ? `#${hash}` : ''}`;
  return { safeUrl, origin };
}

/**
 * A dedup key for "the same canonical context": the sanitized URL without its
 * line anchor, so visiting different line ranges of one file collapses to a
 * single history entry.
 */
export function canonicalKeyFor(safeUrl: string): string {
  const hashIndex = safeUrl.indexOf('#');
  return hashIndex === -1 ? safeUrl : safeUrl.slice(0, hashIndex);
}
