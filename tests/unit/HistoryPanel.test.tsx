import { afterEach, describe, expect, it } from 'vitest';
import { cleanup, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import type { HistoryEntry } from '@/core/history';
import { getHistory, historyStore } from '@/core/history';
import { HistoryPanel } from '@/ui/dock/HistoryPanel';
import { expectNoA11yViolations } from '../helpers/axe';

function entry(partial: Partial<HistoryEntry> & { key: string }): HistoryEntry {
  return {
    safeUrl: `https://github.com${partial.key}`,
    pageKind: 'repo-home',
    locationLabel: 'Code',
    title: partial.key,
    firstVisited: 1,
    lastVisited: 1,
    visitCount: 1,
    pinned: false,
    parserVersion: 1,
    ...partial,
  };
}

async function seed(entries: HistoryEntry[]): Promise<void> {
  await historyStore.set({ entries });
}

afterEach(cleanup);

describe('HistoryPanel', () => {
  it('renders a pinned section and repository groups', async () => {
    await seed([
      entry({
        key: '/facebook/react',
        title: 'React readme',
        nwo: 'facebook/react',
        pinned: true,
        lastVisited: 10,
      }),
      entry({ key: '/vuejs/core', title: 'Vue core file', nwo: 'vuejs/core', lastVisited: 20 }),
    ]);
    render(<HistoryPanel linkTarget="current" />);

    await waitFor(() => expect(screen.getByText('React readme')).toBeInTheDocument());
    expect(screen.getByText('Pinned')).toBeInTheDocument();
    // Unpinned entries are grouped under their repository header.
    expect(screen.getByText('vuejs/core')).toBeInTheDocument();
    expect(screen.getByText('Vue core file')).toBeInTheDocument();
  });

  it('filters by search', async () => {
    await seed([
      entry({ key: '/facebook/react', title: 'facebook react', nwo: 'facebook/react' }),
      entry({ key: '/vuejs/core', title: 'vuejs core', nwo: 'vuejs/core' }),
    ]);
    const user = userEvent.setup();
    render(<HistoryPanel linkTarget="current" />);
    await waitFor(() => expect(screen.getByText('facebook react')).toBeInTheDocument());

    await user.type(screen.getByLabelText('Search recent pages'), 'vue');
    expect(screen.queryByText('facebook react')).not.toBeInTheDocument();
    expect(screen.getByText('vuejs core')).toBeInTheDocument();
  });

  it('pins and removes entries', async () => {
    await seed([entry({ key: '/o/r', title: 'Repo page', nwo: 'o/r' })]);
    const user = userEvent.setup();
    render(<HistoryPanel linkTarget="current" />);
    await waitFor(() => expect(screen.getByText('Repo page')).toBeInTheDocument());

    await user.click(screen.getByLabelText('Pin'));
    await waitFor(() => expect(screen.getByLabelText('Unpin')).toBeInTheDocument());

    await user.click(screen.getByLabelText('Remove from history'));
    await waitFor(async () => expect((await getHistory()).entries).toHaveLength(0));
  });

  it('shows an empty state', async () => {
    await seed([]);
    render(<HistoryPanel linkTarget="current" />);
    await waitFor(() => expect(screen.getByText('No recent pages yet.')).toBeInTheDocument());
  });

  it('has no accessibility violations', async () => {
    await seed([entry({ key: '/o/r', title: 'Repo page', nwo: 'o/r' })]);
    const { container } = render(<HistoryPanel linkTarget="current" headingId="h" />);
    await waitFor(() => expect(screen.getByText('Repo page')).toBeInTheDocument());
    await expectNoA11yViolations(container);
  });

  it('calls onClose from the collapse button', async () => {
    await seed([]);
    const user = userEvent.setup();
    let closed = false;
    render(<HistoryPanel linkTarget="current" onClose={() => (closed = true)} />);
    await user.click(screen.getByLabelText('Collapse recent pages'));
    expect(closed).toBe(true);
  });
});
