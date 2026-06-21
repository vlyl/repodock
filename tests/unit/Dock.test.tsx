import { afterEach, describe, expect, it, vi } from 'vitest';
import { cleanup, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { resolveContext } from '@/core/context';
import { DEFAULT_SETTINGS } from '@/core/settings';
import { Dock } from '@/ui/dock/Dock';

const context = resolveContext({ url: 'https://github.com/facebook/react' });

function renderDock(overrides: Partial<Parameters<typeof Dock>[0]> = {}) {
  const props = {
    context,
    settings: DEFAULT_SETTINGS,
    historyOpen: false,
    onToggleHistory: vi.fn(),
    onCloseHistory: vi.fn(),
    onToggleInvolved: vi.fn(),
    ...overrides,
  };
  render(<Dock {...props} />);
  return props;
}

afterEach(cleanup);

describe('Dock', () => {
  it('renders the repository segment', () => {
    renderDock();
    expect(screen.getByText('facebook/react')).toBeInTheDocument();
  });

  it('toggles the recent list from the brand handle', async () => {
    const user = userEvent.setup();
    const props = renderDock();
    await user.click(screen.getByLabelText('Recent pages'));
    expect(props.onToggleHistory).toHaveBeenCalled();
  });

  it('renders the section quick-nav inline on a repository page', () => {
    renderDock();
    expect(screen.getByRole('link', { name: 'Issues' })).toHaveAttribute(
      'href',
      'https://github.com/facebook/react/issues',
    );
  });

  it('toggles the involved filter from the bar', async () => {
    const user = userEvent.setup();
    const props = renderDock();
    await user.click(screen.getByLabelText("Only pages I'm involved in"));
    expect(props.onToggleInvolved).toHaveBeenCalledWith(true);
  });

  it('renders the recent list when the history popover is open', () => {
    renderDock({ historyOpen: true });
    // The dock panel has no header row; the search box marks the list.
    expect(screen.getByLabelText('Search recent pages')).toBeInTheDocument();
  });
});
