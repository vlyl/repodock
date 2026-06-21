import type { PageKind } from './types';

/**
 * Default English labels for each {@link PageKind}. These are used for history
 * titles, diagnostics, and as the fallback label; the dock UI localizes display
 * via i18n keyed on {@link PageKind}, but the underlying record stays readable.
 */
export const LOCATION_LABELS: Record<PageKind, string> = {
  'repo-home': 'Code',
  'code-tree': 'Code',
  'code-blob': 'Code',
  commit: 'Commit',
  'commits-list': 'Commits',
  'pull-list': 'Pull Requests',
  'pull-request': 'Pull Request',
  'issue-list': 'Issues',
  issue: 'Issue',
  'discussion-list': 'Discussions',
  discussion: 'Discussion',
  actions: 'Actions',
  'actions-run': 'Workflow Run',
  'release-list': 'Releases',
  release: 'Release',
  'tag-list': 'Tags',
  branches: 'Branches',
  wiki: 'Wiki',
  settings: 'Settings',
  security: 'Security',
  insights: 'Insights',
  projects: 'Projects',
  compare: 'Compare',
  'repo-search': 'Search',
  'repo-other': 'Repository',
  'user-profile': 'Profile',
  'non-repo': 'GitHub',
  unknown: 'GitHub',
};

/** Page kinds that occur within the context of a repository. */
const REPO_PAGE_KINDS = new Set<PageKind>([
  'repo-home',
  'code-tree',
  'code-blob',
  'commit',
  'commits-list',
  'pull-list',
  'pull-request',
  'issue-list',
  'issue',
  'discussion-list',
  'discussion',
  'actions',
  'actions-run',
  'release-list',
  'release',
  'tag-list',
  'branches',
  'wiki',
  'settings',
  'security',
  'insights',
  'projects',
  'compare',
  'repo-search',
  'repo-other',
]);

/** Whether the given page kind sits inside a repository. */
export function isRepoPage(kind: PageKind): boolean {
  return REPO_PAGE_KINDS.has(kind);
}

/** The default English location label for a page kind. */
export function locationLabelFor(kind: PageKind): string {
  return LOCATION_LABELS[kind];
}
