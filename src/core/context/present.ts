import type { GitHubContext, LineRange, RefType } from './types';

/** A structured, optionally linkable piece of the context for the dock UI. */
export interface ContextSegment {
  id: string;
  kind: 'repo' | 'ref' | 'location' | 'section' | 'crumb' | 'item' | 'lines' | 'compare';
  /** A short prefix label, e.g. `branch`, shown when labels are enabled. */
  label?: string;
  /** The display text. */
  text: string;
  /** A navigation URL, when the segment is interactive. */
  href?: string;
  /** A longer tooltip / accessible description. */
  title?: string;
  /** For crumbs: whether this is the final (file) segment. */
  isFile?: boolean;
}

export interface BuildSegmentsOptions {
  showLabels?: boolean;
}

const REF_LABEL: Record<RefType, string> = {
  branch: 'branch',
  tag: 'tag',
  commit: 'commit',
  unknown: 'ref',
};

function shortSha(value: string): string {
  return /^[0-9a-f]{7,40}$/i.test(value) ? value.slice(0, 7) : value;
}

/** Encode a path or ref for a URL while preserving meaningful slashes. */
function encodeSlashed(value: string): string {
  return value
    .split('/')
    .map((part) => encodeURIComponent(part))
    .join('/');
}

export function formatLineRange(range: LineRange): string {
  return range.end !== undefined ? `L${range.start}-L${range.end}` : `L${range.start}`;
}

function repoUrl(ctx: GitHubContext): string | undefined {
  if (!ctx.repository) return undefined;
  return `${ctx.origin}/${ctx.repository.owner}/${ctx.repository.name}`;
}

function refUrl(ctx: GitHubContext): string | undefined {
  const base = repoUrl(ctx);
  if (!base || !ctx.ref) return base;
  const encoded = encodeSlashed(ctx.ref.value);
  return ctx.ref.type === 'commit' ? `${base}/commit/${encoded}` : `${base}/tree/${encoded}`;
}

/** A navigation URL for the location label (the section root). */
function locationUrl(ctx: GitHubContext): string | undefined {
  const base = repoUrl(ctx);
  if (!base) return undefined;
  switch (ctx.pageKind) {
    case 'pull-request':
    case 'pull-list':
      return `${base}/pulls`;
    case 'issue':
    case 'issue-list':
      return `${base}/issues`;
    case 'discussion':
    case 'discussion-list':
      return `${base}/discussions`;
    case 'release':
    case 'release-list':
      return `${base}/releases`;
    case 'actions':
    case 'actions-run':
      return `${base}/actions`;
    case 'commit':
    case 'commits-list':
      return ctx.ref ? `${base}/commits/${encodeSlashed(ctx.ref.value)}` : `${base}/commits`;
    case 'compare':
      return `${base}/compare`;
    case 'repo-home':
    case 'code-tree':
    case 'code-blob':
      return refUrl(ctx) ?? base;
    default:
      return base;
  }
}

/** Build a crumb URL pointing at a directory (tree) or file (blob) at the ref. */
function crumbUrl(ctx: GitHubContext, uptoSegments: string[], isFile: boolean): string | undefined {
  const base = repoUrl(ctx);
  if (!base || !ctx.ref) return undefined;
  const ref = encodeSlashed(ctx.ref.value);
  const path = encodeSlashed(uptoSegments.join('/'));
  const verb = isFile ? 'blob' : 'tree';
  return `${base}/${verb}/${ref}/${path}`;
}

function itemText(ctx: GitHubContext): string | undefined {
  const item = ctx.item;
  if (!item) return undefined;
  switch (item.type) {
    case 'pull':
    case 'issue':
    case 'discussion':
      return item.title ? `#${item.id} ${item.title}` : `#${item.id}`;
    case 'release':
      return item.title ? `${item.id} ${item.title}` : item.id;
    case 'workflow-run':
      return `Run ${item.id}`;
    case 'commit':
      // The ref segment already shows the SHA for commit pages.
      return undefined;
    case 'comparison':
      return undefined;
    default:
      return item.id;
  }
}

/**
 * Build the ordered, structured segments that compose the dock's context
 * presentation. Each segment is independently interactive where a meaningful
 * navigation target exists.
 */
export function buildSegments(
  ctx: GitHubContext,
  options: BuildSegmentsOptions = {},
): ContextSegment[] {
  const showLabels = options.showLabels ?? true;
  const segments: ContextSegment[] = [];

  if (ctx.repository) {
    segments.push({
      id: 'repo',
      kind: 'repo',
      text: ctx.repository.nwo,
      href: repoUrl(ctx),
      title: ctx.repository.nwo,
    });
  }

  if (ctx.ref) {
    const label = REF_LABEL[ctx.ref.type];
    segments.push({
      id: 'ref',
      kind: 'ref',
      label: showLabels ? label : undefined,
      text: ctx.ref.type === 'commit' ? shortSha(ctx.ref.value) : ctx.ref.value,
      href: refUrl(ctx),
      title: `${label}: ${ctx.ref.value}`,
    });
  }

  if (ctx.compare && (ctx.compare.base || ctx.compare.head)) {
    segments.push({
      id: 'compare',
      kind: 'compare',
      text: `${ctx.compare.head ?? '…'} → ${ctx.compare.base ?? '…'}`,
      href: ctx.safeUrl,
      title: 'Comparison',
    });
  }

  segments.push({
    id: 'location',
    kind: 'location',
    text: ctx.locationLabel,
    href: locationUrl(ctx),
    title: ctx.locationLabel,
  });

  if (ctx.sectionLabel) {
    segments.push({
      id: 'section',
      kind: 'section',
      text: ctx.sectionLabel,
      href: ctx.safeUrl,
      title: ctx.sectionLabel,
    });
  }

  if (ctx.path && ctx.path.segments.length > 0) {
    const total = ctx.path.segments.length;
    ctx.path.segments.forEach((segment, index) => {
      const isLast = index === total - 1;
      const isFile = isLast && ctx.path!.kind === 'file';
      const upto = ctx.path!.segments.slice(0, index + 1);
      segments.push({
        id: `crumb-${index}`,
        kind: 'crumb',
        text: segment,
        href: crumbUrl(ctx, upto, isFile),
        isFile,
        title: upto.join('/'),
      });
    });
  }

  const item = itemText(ctx);
  if (item) {
    segments.push({
      id: 'item',
      kind: 'item',
      text: item,
      href: ctx.safeUrl,
      title: ctx.item?.title ?? item,
    });
  }

  if (ctx.lineRange) {
    segments.push({
      id: 'lines',
      kind: 'lines',
      text: formatLineRange(ctx.lineRange),
      href: ctx.safeUrl,
      title: 'Selected lines',
    });
  }

  return segments;
}

/** A concise human-readable title for history entries and copy actions. */
export function contextTitle(ctx: GitHubContext): string {
  const repo = ctx.repository?.nwo;
  const item = ctx.item;

  if (item && (item.type === 'pull' || item.type === 'issue' || item.type === 'discussion')) {
    const head = item.title ? `${item.title} (#${item.id})` : `${ctx.locationLabel} #${item.id}`;
    return repo ? `${repo} · ${head}` : head;
  }
  if (item?.type === 'commit') {
    const head = item.title ? `${item.title}` : `Commit ${shortSha(item.id)}`;
    return repo ? `${repo} · ${head}` : head;
  }
  if (item?.type === 'release') {
    const head = item.title ? `${item.title}` : `Release ${item.id}`;
    return repo ? `${repo} · ${head}` : head;
  }
  if (ctx.path) {
    return repo ? `${repo} · ${ctx.path.value}` : ctx.path.value;
  }
  if (ctx.ref && (ctx.pageKind === 'code-tree' || ctx.pageKind === 'repo-home')) {
    return repo ? `${repo} · ${ctx.ref.value}` : ctx.ref.value;
  }
  return repo ? `${repo} · ${ctx.locationLabel}` : ctx.locationLabel;
}

/** A one-line, pipe-delimited summary used by the "copy context" action. */
export function contextSummary(ctx: GitHubContext): string {
  const parts: string[] = [];
  if (ctx.repository) parts.push(ctx.repository.nwo);
  if (ctx.ref) {
    const label = REF_LABEL[ctx.ref.type];
    const value = ctx.ref.type === 'commit' ? shortSha(ctx.ref.value) : ctx.ref.value;
    parts.push(`${label}: ${value}`);
  }
  if (ctx.compare && (ctx.compare.base || ctx.compare.head)) {
    parts.push(`${ctx.compare.head ?? '…'} → ${ctx.compare.base ?? '…'}`);
  }
  const location = ctx.sectionLabel
    ? `${ctx.locationLabel} › ${ctx.sectionLabel}`
    : ctx.locationLabel;
  parts.push(location);
  if (ctx.path) parts.push(ctx.path.value);
  if (
    ctx.item &&
    (ctx.item.type === 'pull' || ctx.item.type === 'issue' || ctx.item.type === 'discussion')
  ) {
    parts.push(`#${ctx.item.id}`);
  }
  if (ctx.lineRange) parts.push(formatLineRange(ctx.lineRange));
  return parts.join('  |  ');
}
