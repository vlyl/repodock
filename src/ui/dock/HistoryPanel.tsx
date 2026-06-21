import { useMemo, useState } from 'react';
import type { ReactNode } from 'react';
import { SearchIcon, XIcon } from '@primer/octicons-react';
import type { HistoryEntry } from '@/core/history';
import {
  clearAllHistory,
  clearUnpinnedHistory,
  groupByRepository,
  pinEntry,
  removeHistoryEntry,
  savePinnedEntry,
  searchEntries,
  unpinEntry,
} from '@/core/history';
import type { LinkTarget } from '@/core/settings';
import { t } from '@/i18n';
import { IconButton } from '@/ui/components/controls';
import { useGitHubHistory } from '@/ui/hooks/useGitHubHistory';
import { HistoryItem } from './HistoryItem';

export interface HistoryPanelProps {
  currentKey?: string;
  linkTarget: LinkTarget;
  importBrowserHistory?: boolean;
  onClose?: () => void;
  headingId?: string;
}

export function HistoryPanel({
  currentKey,
  linkTarget,
  importBrowserHistory = false,
  onClose,
  headingId,
}: HistoryPanelProps): ReactNode {
  const { entries, ownedKeys } = useGitHubHistory(importBrowserHistory);
  const [query, setQuery] = useState('');
  const now = Date.now();

  const filtered = useMemo(() => searchEntries(entries, query), [entries, query]);
  const pinned = useMemo(
    () => filtered.filter((entry) => entry.pinned).sort((a, b) => b.lastVisited - a.lastVisited),
    [filtered],
  );
  const groups = useMemo(
    () => groupByRepository(filtered.filter((entry) => !entry.pinned)),
    [filtered],
  );

  const hasAny = entries.length > 0;
  const hasUnpinned = entries.some((entry) => !entry.pinned && ownedKeys.has(entry.key));

  const togglePin = (entry: HistoryEntry): void => {
    if (entry.pinned) void unpinEntry(entry.key);
    else if (ownedKeys.has(entry.key)) void pinEntry(entry.key);
    else void savePinnedEntry(entry);
  };
  const remove = (entry: HistoryEntry): void => {
    void removeHistoryEntry(entry.key);
  };
  const clearUnpinned = (): void => void clearUnpinnedHistory();
  const clearAll = (): void => {
    if (window.confirm(t('history.confirmClearAll'))) void clearAllHistory();
  };

  const renderEntry = (entry: HistoryEntry): ReactNode => (
    <HistoryItem
      key={entry.key}
      entry={entry}
      isCurrent={entry.key === currentKey}
      linkTarget={linkTarget}
      now={now}
      removable={ownedKeys.has(entry.key)}
      onTogglePin={togglePin}
      onRemove={remove}
    />
  );

  return (
    <div className="rd-hist" role="group" aria-labelledby={headingId}>
      <div className="rd-hist__header">
        <h2 className="rd-hist__title" id={headingId}>
          {t('history.title')}
        </h2>
        {onClose && (
          <IconButton icon={<XIcon size={16} />} label={t('history.collapse')} onClick={onClose} />
        )}
      </div>

      <div className="rd-hist__search">
        <SearchIcon size={14} className="rd-hist__search-icon" />
        <input
          type="search"
          className="rd-hist__search-input"
          placeholder={t('history.searchPlaceholder')}
          aria-label={t('history.searchLabel')}
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          onKeyDown={(event) => {
            // Shield GitHub's global keyboard shortcuts from text typed here;
            // Escape clears the search rather than collapsing the panel.
            if (event.key === 'Escape') setQuery('');
            event.stopPropagation();
          }}
        />
      </div>

      {!hasAny && (
        <div className="rd-hist__empty">
          <p className="rd-hist__empty-title">{t('history.empty')}</p>
          <p className="rd-hist__empty-hint">{t('history.emptyHint')}</p>
        </div>
      )}
      {hasAny && filtered.length === 0 && (
        <div className="rd-hist__empty">
          <p className="rd-hist__empty-title">{t('history.emptyFiltered')}</p>
        </div>
      )}

      <div className="rd-hist__scroll">
        {pinned.length > 0 && (
          <div className="rd-hist__section">
            <h3 className="rd-hist__section-title">{t('history.pinnedSection')}</h3>
            <ul className="rd-hist__list">{pinned.map(renderEntry)}</ul>
          </div>
        )}
        {groups.map((group) => (
          <div className="rd-hist__section" key={group.key}>
            <h3 className="rd-hist__section-title">
              {group.label}
              <span className="rd-hist__section-count">{group.entries.length}</span>
            </h3>
            <ul className="rd-hist__list">{group.entries.map(renderEntry)}</ul>
          </div>
        ))}
      </div>

      {hasAny && (
        <div className="rd-hist__footer">
          <button
            type="button"
            className="rd-text-btn"
            onClick={clearUnpinned}
            disabled={!hasUnpinned}
          >
            {t('history.clearUnpinned')}
          </button>
          <button type="button" className="rd-text-btn rd-text-btn--danger" onClick={clearAll}>
            {t('history.clearAll')}
          </button>
        </div>
      )}
    </div>
  );
}
