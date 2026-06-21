import { afterEach, describe, expect, it } from 'vitest';
import { cleanup, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
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
  it('toggles the recent-pages popover from the dock handle', async () => {
    const user = userEvent.setup();
    render(<DockApp controller={stubController()} />);

    // The brand handle is always present; it opens the recent list on demand.
    const handle = (await screen.findAllByLabelText('Recent pages'))[0]!;
    expect(screen.queryByRole('heading', { name: 'Recent GitHub pages' })).not.toBeInTheDocument();

    await user.click(handle);
    await waitFor(() =>
      expect(screen.getByRole('heading', { name: 'Recent GitHub pages' })).toBeInTheDocument(),
    );
  });
});
