import type { CompareRefs, ContextPath, ContextRef, RepositoryRef, ResolvedValue } from './types';
import { extractEmbeddedFacts } from './embedded-data';
import { parseGitHubUrl } from './github-url';

export interface DomFacts {
  repository?: ResolvedValue<RepositoryRef>;
  ref?: ContextRef;
  path?: ContextPath;
  defaultBranch?: string;
  ogTitle?: string;
  compare?: CompareRefs;
  matched: {
    embeddedData: boolean;
    canonical: boolean;
    octolytics: boolean;
    ogTitle: boolean;
    prRefs: boolean;
  };
}

function metaContent(doc: Document, selector: string): string | undefined {
  const value = doc.querySelector(selector)?.getAttribute('content')?.trim();
  return value && value.length > 0 ? value : undefined;
}

function repositoryFromNwo(nwo: string): RepositoryRef | undefined {
  const slash = nwo.indexOf('/');
  if (slash <= 0 || slash === nwo.length - 1) return undefined;
  const owner = nwo.slice(0, slash);
  const name = nwo.slice(slash + 1);
  if (owner.includes('/') || name.includes('/')) return undefined;
  return { owner, name, nwo: `${owner}/${name}` };
}

function repositoryFromCanonical(doc: Document): RepositoryRef | undefined {
  const href = doc.querySelector('link[rel="canonical"]')?.getAttribute('href');
  if (!href) return undefined;
  try {
    return parseGitHubUrl(new URL(href)).repository;
  } catch {
    return undefined;
  }
}

function compareFromDom(doc: Document): CompareRefs | undefined {
  const base = doc.querySelector('.base-ref')?.textContent?.trim();
  const head = doc.querySelector('.head-ref')?.textContent?.trim();
  if (!base && !head) return undefined;
  const compare: CompareRefs = {};
  if (base) compare.base = base;
  if (head) compare.head = head;
  return compare;
}

/**
 * Resolve facts available only from the rendered DOM. The embedded React payload
 * is preferred for ref/path (high confidence); repository identity is
 * cross-checked against analytics metadata and the canonical link.
 */
export function extractDomFacts(doc: Document): DomFacts {
  const matched: DomFacts['matched'] = {
    embeddedData: false,
    canonical: false,
    octolytics: false,
    ogTitle: false,
    prRefs: false,
  };

  const facts: DomFacts = { matched };
  const embedded = extractEmbeddedFacts(doc);

  if (embedded) {
    matched.embeddedData = true;
    if (embedded.owner && embedded.name) {
      facts.repository = {
        value: {
          owner: embedded.owner,
          name: embedded.name,
          nwo: `${embedded.owner}/${embedded.name}`,
        },
        source: 'semantic-dom',
        confidence: 'high',
      };
    }
    if (embedded.ref) {
      facts.ref = { ...embedded.ref, source: 'semantic-dom', confidence: 'high' };
    }
    if (embedded.path) {
      const segments = embedded.path.value.split('/').filter((s) => s.length > 0);
      const path: ContextPath = {
        value: embedded.path.value,
        segments,
        kind: embedded.path.kind,
        source: 'semantic-dom',
        confidence: 'high',
      };
      if (path.kind === 'file' && segments.length > 0) {
        path.fileName = segments[segments.length - 1];
      }
      facts.path = path;
    }
    if (embedded.defaultBranch) facts.defaultBranch = embedded.defaultBranch;
  }

  // Repository fallback chain when the embedded payload lacked it.
  if (!facts.repository) {
    const nwo = metaContent(doc, 'meta[name="octolytics-dimension-repository_nwo"]');
    const fromMeta = nwo ? repositoryFromNwo(nwo) : undefined;
    if (fromMeta) {
      matched.octolytics = true;
      facts.repository = { value: fromMeta, source: 'metadata', confidence: 'high' };
    } else {
      const fromCanonical = repositoryFromCanonical(doc);
      if (fromCanonical) {
        matched.canonical = true;
        facts.repository = { value: fromCanonical, source: 'canonical-link', confidence: 'medium' };
      }
    }
  }

  const ogTitle = metaContent(doc, 'meta[property="og:title"]');
  if (ogTitle) {
    matched.ogTitle = true;
    facts.ogTitle = ogTitle;
  }

  const compare = compareFromDom(doc);
  if (compare) {
    matched.prRefs = true;
    facts.compare = compare;
  }

  return facts;
}

/** The logged-in GitHub login, from the page meta tags GitHub renders. */
export function viewerLoginFromDom(doc: Document): string | undefined {
  return (
    metaContent(doc, 'meta[name="user-login"]') ??
    metaContent(doc, 'meta[name="octolytics-actor-login"]')
  );
}

/**
 * Containers that hold the issue / PR / discussion's people (author, assignees,
 * reviewers, participants). We scope viewer-participation detection to these so
 * the viewer's own avatar in GitHub's global header never counts as involvement.
 */
const VIEWER_SCOPE_SELECTOR = [
  '#partial-users-participants',
  '#partial-discussion-sidebar',
  '.Layout-sidebar',
  '[data-testid="issue-metadata-fixed"]',
  '[data-testid="sidebar"]',
  '[data-testid="discussion-sidebar"]',
].join(',');

/**
 * Best-effort: does `login` appear as author, assignee, reviewer, or participant
 * of the current issue / pull request / discussion? GitHub's markup differs
 * between its classic and React UIs, so this is a heuristic scoped to the
 * people-bearing sidebar containers and degrades to `false` when it can't tell.
 */
export function viewerIsParticipant(doc: Document, login: string): boolean {
  const norm = login.toLowerCase();
  for (const root of doc.querySelectorAll(VIEWER_SCOPE_SELECTOR)) {
    for (const anchor of root.querySelectorAll('a[href]')) {
      const match = /^\/([^/?#]+)(?:[/?#]|$)/.exec(anchor.getAttribute('href') ?? '');
      const user = match?.[1];
      if (user?.toLowerCase() === norm) return true;
    }
    for (const img of root.querySelectorAll('img[alt]')) {
      const alt = (img.getAttribute('alt') ?? '').replace(/^@/, '').toLowerCase();
      if (alt === norm) return true;
    }
  }
  return false;
}

/**
 * Clean an Open Graph title down to the human-readable item title, dropping the
 * trailing " · Pull Request #N · owner/repo" decoration GitHub appends.
 */
export function cleanItemTitle(ogTitle: string): string {
  const [first] = ogTitle.split(' · ');
  const cleaned = (first ?? ogTitle).trim();
  return cleaned.length > 0 ? cleaned : ogTitle.trim();
}
