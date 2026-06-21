import { afterEach, describe, expect, it } from 'vitest';
import { cleanup, render, screen } from '@testing-library/react';
import { resolveContext } from '@/core/context';
import { DockNav } from '@/ui/dock/DockNav';

const ctx = resolveContext({ url: 'https://github.com/facebook/react/issues/5' });

afterEach(cleanup);

describe('DockNav', () => {
  it('renders only enabled sections, in canonical order, with hrefs', () => {
    render(<DockNav context={ctx} sections={['issues', 'code', 'actions']} />);
    const links = screen.getAllByRole('link');
    expect(links.map((link) => link.getAttribute('aria-label'))).toEqual([
      'Code',
      'Issues',
      'Actions',
    ]);
    expect(screen.getByRole('link', { name: 'Issues' })).toHaveAttribute(
      'href',
      'https://github.com/facebook/react/issues',
    );
  });

  it('marks the current section active', () => {
    render(<DockNav context={ctx} sections={['code', 'issues']} />);
    expect(screen.getByRole('link', { name: 'Issues' })).toHaveAttribute('aria-current', 'page');
    expect(screen.getByRole('link', { name: 'Code' })).not.toHaveAttribute('aria-current');
  });

  it('renders nothing when no sections are enabled', () => {
    const { container } = render(<DockNav context={ctx} sections={[]} />);
    expect(container.firstChild).toBeNull();
  });
});
