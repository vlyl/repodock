import type {
  CompareRefs,
  Confidence,
  ContextDiagnostics,
  ContextItem,
  ContextPath,
  ContextRef,
  GitHubContext,
  ItemType,
  PageKind,
  RepositoryRef,
  ResolveInput,
  ViewerInfo,
} from './types';
import { CONTEXT_SCHEMA_VERSION } from './types';
import { parseGitHubUrl, sanitizeGitHubUrl } from './github-url';
import { cleanItemTitle, extractDomFacts, viewerIsParticipant, viewerLoginFromDom } from './dom';
import type { DomFacts } from './dom';

const CONFIDENCE_RANK: Record<Confidence, number> = { high: 3, medium: 2, low: 1 };

/** Page kinds on which "the viewer participates" is meaningful. */
const PARTICIPATING_KINDS = new Set<PageKind>(['issue', 'pull-request', 'discussion']);

/**
 * Resolve the logged-in viewer and whether they participate in the page's item.
 * The login meta is reliable on any page; participation is only inferred when
 * the DOM is trusted (matches the URL) and the page is an issue / PR / discussion.
 */
function resolveViewer(
  doc: Document,
  pageKind: PageKind,
  domTrusted: boolean,
): ViewerInfo | undefined {
  const login = viewerLoginFromDom(doc);
  if (login === undefined) return undefined;
  const viewer: ViewerInfo = { login };
  if (domTrusted && PARTICIPATING_KINDS.has(pageKind) && viewerIsParticipant(doc, login)) {
    viewer.participant = true;
  }
  return viewer;
}

/** Item kinds for which an Open Graph title is a meaningful display title. */
const TITLED_ITEM_TYPES = new Set<ItemType>(['pull', 'issue', 'discussion', 'release', 'commit']);

function sameRepo(a: RepositoryRef, b: RepositoryRef): boolean {
  return (
    a.owner.toLowerCase() === b.owner.toLowerCase() && a.name.toLowerCase() === b.name.toLowerCase()
  );
}

/** Choose the DOM value when it is at least as confident as the URL value. */
function preferDom<T extends { confidence: Confidence }>(
  fromUrl: T | undefined,
  fromDom: T | undefined,
): T | undefined {
  if (!fromDom) return fromUrl;
  if (!fromUrl) return fromDom;
  return CONFIDENCE_RANK[fromDom.confidence] >= CONFIDENCE_RANK[fromUrl.confidence]
    ? fromDom
    : fromUrl;
}

function minimalContext(rawUrl: string, now: number): GitHubContext {
  return {
    schemaVersion: CONTEXT_SCHEMA_VERSION,
    origin: 'https://github.com',
    safeUrl: 'https://github.com/',
    pageKind: 'unknown',
    locationLabel: 'GitHub',
    resolvedAt: now,
    diagnostics: {
      rawUrl,
      pathname: '',
      resolvers: [{ name: 'url', matched: false, note: 'Unparseable URL' }],
      warnings: ['Could not parse the page URL.'],
    },
  };
}

/**
 * Resolve a {@link GitHubContext} for a page. The URL is the authoritative,
 * highest-trust source for structure; the DOM refines ambiguous ref/path splits
 * and supplies item titles. The DOM is only trusted when its repository identity
 * agrees with the URL, which guards against a not-yet-updated SPA DOM bleeding
 * stale context across client-side navigation.
 */
export function resolveContext(input: ResolveInput): GitHubContext {
  const now = input.now ?? Date.now();

  let url: URL;
  try {
    url = new URL(input.url);
  } catch {
    return minimalContext(input.url, now);
  }

  const urlFacts = parseGitHubUrl(url);
  const sanitized = sanitizeGitHubUrl(input.url);
  const dom: DomFacts | undefined = input.document ? extractDomFacts(input.document) : undefined;

  const warnings: string[] = [...urlFacts.warnings];

  // Decide whether DOM facts are consistent with the URL we are resolving for.
  // The DOM only earns trust when its repository agrees with the URL's. If the
  // DOM claims a repository the URL does not have (a non-repo page such as
  // /settings or /notifications) or a *different* one, the DOM is stale from the
  // page we just left — discard all of it so it cannot leak into the context or
  // history.
  let domUsable = dom !== undefined;
  if (
    dom?.repository &&
    (!urlFacts.repository || !sameRepo(dom.repository.value, urlFacts.repository))
  ) {
    domUsable = false;
    warnings.push(
      'Ignored DOM context: its repository did not match the current URL (likely mid-navigation).',
    );
  }
  const usableDom = domUsable ? dom : undefined;

  // Repository identity comes solely from the URL; the DOM only ever confirms it.
  const repository: RepositoryRef | undefined = urlFacts.repository;

  // Ref and path: prefer the DOM when it is at least as confident (it resolves
  // slash-containing branch names that the URL cannot split reliably).
  const ref: ContextRef | undefined = preferDom(urlFacts.ref, usableDom?.ref);
  const path: ContextPath | undefined = preferDom(urlFacts.path, usableDom?.path);

  // Item: identity comes from the URL; a human title comes from the DOM.
  let item: ContextItem | undefined = urlFacts.item;
  if (item && usableDom?.ogTitle && TITLED_ITEM_TYPES.has(item.type)) {
    item = { ...item, title: cleanItemTitle(usableDom.ogTitle), titleSource: 'metadata' };
  }

  // Compare/PR refs: the URL spec for compare pages, the DOM for pull requests.
  const compare: CompareRefs | undefined = urlFacts.compare ?? usableDom?.compare;

  const context: GitHubContext = {
    schemaVersion: CONTEXT_SCHEMA_VERSION,
    origin: sanitized?.origin ?? url.origin,
    safeUrl: sanitized?.safeUrl ?? url.href,
    pageKind: urlFacts.pageKind,
    locationLabel: urlFacts.locationLabel,
    resolvedAt: now,
  };
  if (urlFacts.sectionLabel) context.sectionLabel = urlFacts.sectionLabel;
  if (repository) context.repository = repository;
  if (ref) context.ref = ref;
  if (path) context.path = path;
  if (urlFacts.lineRange) context.lineRange = urlFacts.lineRange;
  if (item) context.item = item;
  if (compare && (compare.base || compare.head)) context.compare = compare;

  if (input.document) {
    const viewer = resolveViewer(input.document, urlFacts.pageKind, usableDom !== undefined);
    if (viewer) context.viewer = viewer;
  }

  context.diagnostics = buildDiagnostics(input.url, url, usableDom, dom, warnings);

  return context;
}

function buildDiagnostics(
  rawUrl: string,
  url: URL,
  usableDom: DomFacts | undefined,
  rawDom: DomFacts | undefined,
  warnings: string[],
): ContextDiagnostics {
  const resolvers: ContextDiagnostics['resolvers'] = [{ name: 'url', matched: true }];
  if (rawDom) {
    const m = rawDom.matched;
    resolvers.push({
      name: 'dom:embedded-data',
      matched: m.embeddedData,
      note: usableDom ? undefined : 'present but discarded as stale',
    });
    resolvers.push({ name: 'dom:metadata', matched: m.octolytics || m.ogTitle });
    resolvers.push({ name: 'dom:canonical', matched: m.canonical });
  } else {
    resolvers.push({ name: 'dom', matched: false, note: 'no document provided' });
  }
  return { rawUrl, pathname: url.pathname, resolvers, warnings };
}
