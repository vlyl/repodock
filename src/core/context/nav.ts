import type { GitHubContext, PageKind } from './types';

/**
 * GitHub repository navigation sections, in the canonical order GitHub shows
 * them. Used both for the dock's quick-nav buttons and the user's choice of
 * which to display.
 */
export const NAV_SECTIONS = [
  'code',
  'issues',
  'pulls',
  'actions',
  'projects',
  'wiki',
  'discussions',
  'security',
  'insights',
  'releases',
  'settings',
] as const;

export type NavSection = (typeof NAV_SECTIONS)[number];

/** Path suffix for each section under `owner/repo` (empty = repo root). */
const SECTION_PATH: Record<NavSection, string> = {
  code: '',
  issues: 'issues',
  pulls: 'pulls',
  actions: 'actions',
  projects: 'projects',
  wiki: 'wiki',
  discussions: 'discussions',
  security: 'security',
  insights: 'pulse',
  releases: 'releases',
  settings: 'settings',
};

/** The URL of a repository section for the given context, or `undefined`. */
export function navSectionUrl(ctx: GitHubContext, section: NavSection): string | undefined {
  if (!ctx.repository) return undefined;
  const base = `${ctx.origin}/${ctx.repository.owner}/${ctx.repository.name}`;
  const path = SECTION_PATH[section];
  return path ? `${base}/${path}` : base;
}

const PAGEKIND_SECTION: Partial<Record<PageKind, NavSection>> = {
  'repo-home': 'code',
  'code-tree': 'code',
  'code-blob': 'code',
  commit: 'code',
  'commits-list': 'code',
  branches: 'code',
  'tag-list': 'code',
  compare: 'code',
  'repo-search': 'code',
  issue: 'issues',
  'issue-list': 'issues',
  'pull-request': 'pulls',
  'pull-list': 'pulls',
  actions: 'actions',
  'actions-run': 'actions',
  projects: 'projects',
  wiki: 'wiki',
  discussion: 'discussions',
  'discussion-list': 'discussions',
  security: 'security',
  insights: 'insights',
  release: 'releases',
  'release-list': 'releases',
  settings: 'settings',
};

/** The nav section the current page belongs to (for highlighting), if any. */
export function activeNavSection(pageKind: PageKind): NavSection | undefined {
  return PAGEKIND_SECTION[pageKind];
}
