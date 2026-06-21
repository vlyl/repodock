import { afterEach, describe, expect, it } from 'vitest';
import { cleanup, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { getSettings } from '@/core/settings';
import { App } from '@/entrypoints/options/App';
import { expectNoA11yViolations } from '../helpers/axe';

afterEach(cleanup);

describe('options page', () => {
  it('renders the settings sections', async () => {
    render(<App />);
    await waitFor(() => expect(screen.getByText('Appearance')).toBeInTheDocument());
    expect(screen.getByText('History')).toBeInTheDocument();
    expect(screen.getByText('Data & privacy')).toBeInTheDocument();
  });

  it('persists a toggled setting to the store', async () => {
    const user = userEvent.setup();
    render(<App />);
    const toggle = await screen.findByRole('switch', { name: 'Show field labels' });
    expect(toggle).toHaveAttribute('aria-checked', 'true');

    await user.click(toggle);
    await waitFor(async () => expect((await getSettings()).showLabels).toBe(false));
  });

  it('has no accessibility violations', async () => {
    const { container } = render(<App />);
    await waitFor(() => expect(screen.getByText('Appearance')).toBeInTheDocument());
    await expectNoA11yViolations(container);
  });
});
