import type { ReactNode } from 'react';
import { LinkExternalIcon, PinIcon, TrashIcon } from '@primer/octicons-react';
import type { HistoryEntry } from '@/core/history';
import { entryRelativeTitle } from '@/core/history';
import type { LinkTarget } from '@/core/settings';
import { t } from '@/i18n';
import { formatRelativeTime } from '@/lib/time';
import { IconButton } from '@/ui/components/controls';

export interface HistoryItemProps {
  entry: HistoryEntry;
  isCurrent: boolean;
  linkTarget: LinkTarget;
  now: number;
  /** Drop the repo prefix from the title (the entry is shown under a repo header). */
  relativeTitle?: boolean;
  /** Whether the remove (trash) action is available (false for browser-only entries). */
  removable?: boolean;
  onTogglePin: (entry: HistoryEntry) => void;
  onRemove: (entry: HistoryEntry) => void;
}

export function HistoryItem({
  entry,
  isCurrent,
  linkTarget,
  now,
  relativeTitle = false,
  removable = true,
  onTogglePin,
  onRemove,
}: HistoryItemProps): ReactNode {
  const title = relativeTitle ? entryRelativeTitle(entry) : entry.title;
  const visits =
    entry.visitCount === 1 ? t('history.visitsOne', 1) : t('history.visitsMany', entry.visitCount);
  const meta = [entry.locationLabel, formatRelativeTime(entry.lastVisited, now), visits];

  return (
    <li className={`rd-hist-item${isCurrent ? ' is-current' : ''}`}>
      <a
        className="rd-hist-item__link"
        href={entry.safeUrl}
        target={linkTarget === 'new' ? '_blank' : undefined}
        rel={linkTarget === 'new' ? 'noopener noreferrer' : undefined}
        title={entry.safeUrl}
      >
        <span className="rd-hist-item__title">{title}</span>
        <span className="rd-hist-item__meta">
          {isCurrent && <span className="rd-hist-item__badge">{t('history.current')}</span>}
          {meta.join(' · ')}
        </span>
      </a>
      <div className="rd-hist-item__actions">
        <IconButton
          icon={<LinkExternalIcon size={14} />}
          label={t('history.openNewTab')}
          onClick={() => window.open(entry.safeUrl, '_blank', 'noopener,noreferrer')}
        />
        <IconButton
          icon={<PinIcon size={14} />}
          label={entry.pinned ? t('history.unpin') : t('history.pin')}
          active={entry.pinned}
          onClick={() => onTogglePin(entry)}
        />
        {removable && (
          <IconButton
            icon={<TrashIcon size={14} />}
            label={t('history.remove')}
            variant="danger"
            onClick={() => onRemove(entry)}
          />
        )}
      </div>
    </li>
  );
}
