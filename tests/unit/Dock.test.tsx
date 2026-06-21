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
    onHide: vi.fn(),
    onOpenSettings: vi.fn(),
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

  it('copies the context summary', async () => {
    const user = userEvent.setup();
    renderDock();
    await user.click(screen.getByLabelText('Copy context'));
    // user-event provides an in-memory clipboard we can read back.
    expect(await navigator.clipboard.readText()).toContain('facebook/react');
  });

  it('invokes hide and history toggles', async () => {
    const user = userEvent.setup();
    const props = renderDock();
    await user.click(screen.getByLabelText('Hide dock'));
    expect(props.onHide).toHaveBeenCalledOnce();
    // Both the toolbar icon and the brand handle toggle the recent list.
    await user.click(screen.getAllByLabelText('Recent pages')[0]!);
    expect(props.onToggleHistory).toHaveBeenCalled();
  });

  it('renders the recent list when the history popover is open', () => {
    renderDock({ historyOpen: true });
    expect(screen.getByRole('heading', { name: 'Recent GitHub pages' })).toBeInTheDocument();
  });
});
