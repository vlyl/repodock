import type { ReactNode } from 'react';
import type { ContextSegment } from '@/core/context';

function SegmentView({ segment }: { segment: ContextSegment }): ReactNode {
  const className = `rd-seg rd-seg--${segment.kind}${segment.isFile ? ' rd-seg--file' : ''}`;
  const inner = (
    <>
      {segment.label !== undefined && <span className="rd-seg__label">{segment.label}</span>}
      <span className="rd-seg__text">{segment.text}</span>
    </>
  );
  if (segment.href !== undefined) {
    return (
      <a className={className} href={segment.href} title={segment.title}>
        {inner}
      </a>
    );
  }
  return (
    <span className={className} title={segment.title}>
      {inner}
    </span>
  );
}

function separatorBefore(previous: ContextSegment, current: ContextSegment): string | null {
  if (current.kind === 'crumb' && previous.kind === 'crumb') return '/';
  if (current.kind === 'section') return '›';
  if (current.kind === 'crumb' && previous.kind !== 'crumb') return '·';
  return '|';
}

export interface DockSegmentsProps {
  segments: ContextSegment[];
}

/** Render the ordered context segments as an interactive breadcrumb. */
export function DockSegments({ segments }: DockSegmentsProps): ReactNode {
  return (
    <div className="rd-segments">
      {segments.map((segment, index) => {
        const previous = index > 0 ? segments[index - 1] : undefined;
        const separator = previous ? separatorBefore(previous, segment) : null;
        return (
          <span className="rd-segments__group" key={segment.id}>
            {separator !== null && (
              <span className="rd-segments__sep" aria-hidden="true">
                {separator}
              </span>
            )}
            <SegmentView segment={segment} />
          </span>
        );
      })}
    </div>
  );
}
