import { afterEach, describe, expect, it } from 'vitest';
import { cleanup, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { getSettings } from '@/core/settings';
import type { ContextController } from '@/lib/context-controller';
import { DockApp } from '@/ui/dock/DockApp';

function stubController(): ContextController {
  return {
    getContext: () => null,
    subscribe: (listener: (ctx: null) => void) => {
      listener(null);
      return () => {};
    },
  } as unknown as ContextController;
}

afterEach(cleanup);

describe('DockApp', () => {
  it('persists the collapsed state when the dock is collapsed', async () => {
    const user = userEvent.setup();
    render(<DockApp controller={stubController()} />);

    const collapseButtons = await screen.findAllByRole('button', { name: 'Collapse dock' });
    await user.click(collapseButtons[0]!);

    // The change is written to settings (survives reloads) ...
    await waitFor(async () => expect((await getSettings()).collapsed).toBe(true));
    // ... and reflected in the UI.
    await waitFor(() =>
      expect(screen.getAllByRole('button', { name: 'Expand dock' }).length).toBeGreaterThan(0),
    );
  });
});
