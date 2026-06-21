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
    collapsed: false,
    historyOpen: false,
    onToggleCollapsed: vi.fn(),
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
    await user.click(screen.getByLabelText('Recent pages'));
    expect(props.onToggleHistory).toHaveBeenCalledOnce();
  });

  it('shows a compact label when collapsed', () => {
    renderDock({ collapsed: true });
    // The full breadcrumb copy action is hidden while collapsed.
    expect(screen.queryByLabelText('Copy context')).not.toBeInTheDocument();
    expect(screen.getByText('facebook/react')).toBeInTheDocument();
  });
});
