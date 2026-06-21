/**
 * Typed domain model for a resolved GitHub page context.
 *
 * The guiding principle is accuracy over completeness: every value carries the
 * source it was derived from and a confidence level, and any value that cannot
 * be determined is simply omitted rather than guessed.
 */

/** The schema version of {@link GitHubContext}. Bump on breaking shape changes. */
export const CONTEXT_SCHEMA_VERSION = 1;

/** Where a particular value was resolved from, ordered loosely by trust. */
export type ContextSource =
  | 'url'
  | 'canonical-link'
  | 'metadata'
  | 'semantic-dom'
  | 'breadcrumb'
  | 'page-heading'
  | 'fallback';

/** How much we trust a resolved value. */
export type Confidence = 'high' | 'medium' | 'low';

/** A value paired with provenance. */
export interface ResolvedValue<T> {
  value: T;
  source: ContextSource;
  confidence: Confidence;
}

/**
 * The recognized kind of GitHub page. `repo-*` kinds are inside a repository;
 * `non-repo` and `unknown` are everything else.
 */
export type PageKind =
  | 'repo-home'
  | 'code-tree'
  | 'code-blob'
  | 'commit'
  | 'commits-list'
  | 'pull-list'
  | 'pull-request'
  | 'issue-list'
  | 'issue'
  | 'discussion-list'
  | 'discussion'
  | 'actions'
  | 'actions-run'
  | 'release-list'
  | 'release'
  | 'tag-list'
  | 'branches'
  | 'wiki'
  | 'settings'
  | 'security'
  | 'insights'
  | 'projects'
  | 'compare'
  | 'repo-search'
  | 'repo-other'
  | 'user-profile'
  | 'non-repo'
  | 'unknown';

/** A repository identity. `nwo` is the conventional "name with owner" form. */
export interface RepositoryRef {
  owner: string;
  name: string;
  /** `owner/name`. */
  nwo: string;
}

/** The kind of git ref a value represents. */
export type RefType = 'branch' | 'tag' | 'commit' | 'unknown';

export interface ContextRef {
  value: string;
  type: RefType;
  source: ContextSource;
  confidence: Confidence;
}

export type PathKind = 'file' | 'directory' | 'unknown';

export interface ContextPath {
  /** Repository-relative path, without a leading slash. */
  value: string;
  /** `value` split on `/`, with empty segments removed. */
  segments: string[];
  kind: PathKind;
  /** The final path segment when {@link kind} is `file`. */
  fileName?: string;
  source: ContextSource;
  confidence: Confidence;
}

/** A 1-based, inclusive line range encoded in a URL hash such as `#L20-L35`. */
export interface LineRange {
  start: number;
  end?: number;
}

/** The kind of first-class item a page is about. */
export type ItemType =
  | 'pull'
  | 'issue'
  | 'discussion'
  | 'commit'
  | 'workflow-run'
  | 'release'
  | 'comparison'
  | 'tag'
  | 'other';

export interface ContextItem {
  type: ItemType;
  /** A stable identifier: PR/issue/discussion number, run id, tag, or SHA. */
  id: string;
  title?: string;
  titleSource?: ContextSource;
}

/** Base/head refs for compare and pull-request pages, e.g. `feature → main`. */
export interface CompareRefs {
  base?: string;
  head?: string;
}

/** Diagnostic detail surfaced only when developer diagnostics is enabled. */
export interface ContextDiagnostics {
  /** The raw `location.href` the context was resolved from. */
  rawUrl: string;
  /** The URL pathname, for quick inspection. */
  pathname: string;
  /** Which resolvers contributed and whether they matched. */
  resolvers: { name: string; matched: boolean; note?: string }[];
  /** Non-fatal issues encountered while resolving. */
  warnings: string[];
}

/**
 * A fully resolved context for a single GitHub page.
 *
 * Optional fields are absent (not `undefined`-valued placeholders) whenever the
 * corresponding value could not be determined with acceptable confidence.
 */
export interface GitHubContext {
  schemaVersion: number;
  /** The page origin, e.g. `https://github.com`. */
  origin: string;
  /** A sanitized, allow-listed URL safe to display and persist. */
  safeUrl: string;
  pageKind: PageKind;
  /** A short human-readable label for {@link pageKind}, e.g. "Pull Request". */
  locationLabel: string;
  /** A secondary label for a sub-tab, e.g. "Files changed" or "Commits". */
  sectionLabel?: string;
  repository?: RepositoryRef;
  ref?: ContextRef;
  path?: ContextPath;
  lineRange?: LineRange;
  item?: ContextItem;
  compare?: CompareRefs;
  /** The logged-in viewer and their relationship to this page, from the DOM. */
  viewer?: ViewerInfo;
  /** Epoch milliseconds at which this context was resolved. */
  resolvedAt: number;
  diagnostics?: ContextDiagnostics;
}

/** Who is viewing the page, and whether they are involved with its item. */
export interface ViewerInfo {
  /** The logged-in GitHub login, from the page's `user-login` meta tag. */
  login?: string;
  /**
   * The viewer authored, was assigned to, commented on, or reviews the current
   * issue, pull request, or discussion. Best-effort, detected from the DOM.
   */
  participant?: boolean;
}

/** Input to the resolver. `document` is omitted when resolving from a URL only. */
export interface ResolveInput {
  url: string;
  document?: Document;
  /** Epoch milliseconds; injectable for deterministic tests. */
  now?: number;
}
