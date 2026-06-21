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
  it('shows the recent list by default and persists collapsing it', async () => {
    const user = userEvent.setup();
    render(<DockApp controller={stubController()} />);

    // Open by default (the search box marks the list; there is no header row).
    await waitFor(() => expect(screen.getByLabelText('Search recent pages')).toBeInTheDocument());

    // The brand handle toggles the list; collapsing it persists to settings.
    const handle = (await screen.findAllByLabelText('Recent pages'))[0]!;
    await user.click(handle);
    await waitFor(() =>
      expect(screen.queryByLabelText('Search recent pages')).not.toBeInTheDocument(),
    );
    await waitFor(async () => expect((await getSettings()).recentOpen).toBe(false));
  });
});
