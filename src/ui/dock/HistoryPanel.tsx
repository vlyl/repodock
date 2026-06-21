import { useMemo, useState } from 'react';
import type { CSSProperties, ReactNode } from 'react';
import { SearchIcon, XIcon } from '@primer/octicons-react';
import type { HistoryEntry } from '@/core/history';
import {
  groupByRepository,
  isInvolvedEntry,
  pinEntry,
  removeHistoryEntry,
  savePinnedEntry,
  searchEntries,
  unpinEntry,
} from '@/core/history';
import type { LinkTarget } from '@/core/settings';
import { t } from '@/i18n';
import { IconButton, Toggle } from '@/ui/components/controls';
import { useGitHubHistory } from '@/ui/hooks/useGitHubHistory';
import { useViewerLogin } from '@/ui/hooks/useViewerLogin';
import { HistoryItem } from './HistoryItem';

export interface HistoryPanelProps {
  currentKey?: string;
  linkTarget: LinkTarget;
  importBrowserHistory?: boolean;
  /** Filter the list to pages the viewer is involved with. */
  involvedOnly?: boolean;
  /** When set, render an in-panel toggle for {@link involvedOnly} (used by the popup). */
  onToggleInvolved?: (next: boolean) => void;
  onClose?: () => void;
  headingId?: string;
}

/** How many entries to reveal per repository group at a time. */
const PAGE_SIZE = 5;

/** Deterministic hue (0–359) for a repository, so each gets a stable tint. */
function repoHue(name: string): number {
  let hash = 0;
  for (let i = 0; i < name.length; i += 1) {
    hash = (hash * 31 + name.charCodeAt(i)) >>> 0;
  }
  return hash % 360;
}

export function HistoryPanel({
  currentKey,
  linkTarget,
  importBrowserHistory = false,
  involvedOnly = false,
  onToggleInvolved,
  onClose,
  headingId,
}: HistoryPanelProps): ReactNode {
  const { entries, ownedKeys } = useGitHubHistory(importBrowserHistory);
  const viewerLogin = useViewerLogin();
  const [query, setQuery] = useState('');
  const [shownByGroup, setShownByGroup] = useState<Record<string, number>>({});
  const now = Date.now();

  const shownFor = (key: string): number => shownByGroup[key] ?? PAGE_SIZE;
  const showMore = (key: string): void =>
    setShownByGroup((current) => ({ ...current, [key]: (current[key] ?? PAGE_SIZE) + PAGE_SIZE }));

  const filtered = useMemo(() => {
    const bySearch = searchEntries(entries, query);
    return involvedOnly
      ? bySearch.filter((entry) => isInvolvedEntry(entry, viewerLogin))
      : bySearch;
  }, [entries, query, involvedOnly, viewerLogin]);
  const pinned = useMemo(
    () => filtered.filter((entry) => entry.pinned).sort((a, b) => b.lastVisited - a.lastVisited),
    [filtered],
  );
  const groups = useMemo(
    () => groupByRepository(filtered.filter((entry) => !entry.pinned)),
    [filtered],
  );

  const hasAny = entries.length > 0;

  const togglePin = (entry: HistoryEntry): void => {
    if (entry.pinned) void unpinEntry(entry.key);
    else if (ownedKeys.has(entry.key)) void pinEntry(entry.key);
    else void savePinnedEntry(entry);
  };
  const remove = (entry: HistoryEntry): void => {
    void removeHistoryEntry(entry.key);
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
        {groups.map((group) => {
          const limit = shownFor(group.key);
          const visible = group.entries.slice(0, limit);
          const remaining = group.entries.length - visible.length;
          return (
            <div
              className="rd-hist__section rd-hist__section--repo"
              key={group.key}
              style={{ '--rd-repo-hue': repoHue(group.label) } as CSSProperties}
            >
              <h3 className="rd-hist__section-title">
                <span className="rd-hist__section-label">{group.label}</span>
                <span className="rd-hist__section-count">{group.entries.length}</span>
              </h3>
              <ul className="rd-hist__list">{visible.map(renderEntry)}</ul>
              {remaining > 0 && (
                <button type="button" className="rd-hist__more" onClick={() => showMore(group.key)}>
                  {t('history.showMore', Math.min(PAGE_SIZE, remaining))}
                </button>
              )}
            </div>
          );
        })}
      </div>

      {onToggleInvolved && (
        <div className="rd-hist__filter">
          <span className="rd-hist__filter-label">{t('history.involvedOnly')}</span>
          <Toggle
            checked={involvedOnly}
            onChange={onToggleInvolved}
            label={t('history.involvedOnly')}
          />
        </div>
      )}
    </div>
  );
}
