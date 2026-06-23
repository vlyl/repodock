import { afterEach, describe, expect, it } from 'vitest';
import { ensureStickyHeaderStyle, setStickyHeader } from '@/lib/sticky-header';

afterEach(() => {
  document.getElementById('repodock-sticky-header')?.remove();
  document.documentElement.removeAttribute('data-rd-sticky-header');
});

describe('sticky header', () => {
  it('injects the gated stylesheet once', () => {
    ensureStickyHeaderStyle(document);
    ensureStickyHeaderStyle(document);
    const styles = document.querySelectorAll('#repodock-sticky-header');
    expect(styles).toHaveLength(1);
    expect(styles[0]!.textContent).toContain('header.AppHeader');
    expect(styles[0]!.textContent).toContain('position: sticky');
  });

  it('toggles the gating attribute on the html element', () => {
    setStickyHeader(document, true);
    expect(document.documentElement.getAttribute('data-rd-sticky-header')).toBe('true');

    setStickyHeader(document, false);
    expect(document.documentElement.hasAttribute('data-rd-sticky-header')).toBe(false);
    // The stylesheet stays installed across toggles.
    expect(document.getElementById('repodock-sticky-header')).not.toBeNull();
  });
});
