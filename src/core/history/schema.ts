import { z } from 'zod';

const refTypeSchema = z.enum(['branch', 'tag', 'commit', 'unknown']);
const pathKindSchema = z.enum(['file', 'directory', 'unknown']);
const itemTypeSchema = z.enum([
  'pull',
  'issue',
  'discussion',
  'commit',
  'workflow-run',
  'release',
  'comparison',
  'tag',
  'other',
]);
const pageKindSchema = z.enum([
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
  'user-profile',
  'non-repo',
  'unknown',
]);

export const historyEntrySchema = z.object({
  key: z.string().min(1),
  safeUrl: z.string().min(1),
  nwo: z.string().optional(),
  owner: z.string().optional(),
  repo: z.string().optional(),
  ref: z.string().optional(),
  refType: refTypeSchema.optional(),
  pageKind: pageKindSchema,
  locationLabel: z.string(),
  sectionLabel: z.string().optional(),
  path: z.string().optional(),
  pathKind: pathKindSchema.optional(),
  fileName: z.string().optional(),
  itemType: itemTypeSchema.optional(),
  itemId: z.string().optional(),
  lineStart: z.number().int().positive().optional(),
  lineEnd: z.number().int().positive().optional(),
  title: z.string(),
  firstVisited: z.number().int().nonnegative(),
  lastVisited: z.number().int().nonnegative(),
  visitCount: z.number().int().positive(),
  pinned: z.boolean(),
  involved: z.boolean().optional(),
  parserVersion: z.number().int().nonnegative(),
});

/**
 * History state schema. Invalid individual entries are filtered out (rather than
 * discarding the whole history) so a single corrupt record cannot wipe the rest.
 */
export const historyStateSchema = z
  .object({
    entries: z.preprocess(
      (value) =>
        Array.isArray(value)
          ? (value as unknown[]).filter((entry) => historyEntrySchema.safeParse(entry).success)
          : [],
      z.array(historyEntrySchema),
    ),
  })
  .catch(() => ({ entries: [] }));
