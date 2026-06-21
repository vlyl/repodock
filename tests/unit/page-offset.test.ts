import { afterEach, describe, expect, it } from 'vitest';
import { applyPageOffset, removePageOffset } from '@/lib/page-offset';

const style = () => document.getElementById('repodock-page-offset');

afterEach(() => removePageOffset());

describe('applyPageOffset', () => {
  it('reserves space on the docked side for a visible vertical dock', () => {
    applyPageOffset({ position: 'left', visible: true, reservePageSpace: true });
    expect(style()?.textContent).toContain('margin-left');

    applyPageOffset({ position: 'right', visible: true, reservePageSpace: true });
    expect(style()?.textContent).toContain('margin-right');
  });

  it('does nothing for top/bottom docks', () => {
    applyPageOffset({ position: 'top', visible: true, reservePageSpace: true });
    expect(style()).toBeNull();
    applyPageOffset({ position: 'bottom', visible: true, reservePageSpace: true });
    expect(style()).toBeNull();
  });

  it('removes the offset when hidden or disabled', () => {
    applyPageOffset({ position: 'left', visible: true, reservePageSpace: true });
    expect(style()).not.toBeNull();

    applyPageOffset({ position: 'left', visible: false, reservePageSpace: true });
    expect(style()).toBeNull();

    applyPageOffset({ position: 'left', visible: true, reservePageSpace: false });
    expect(style()).toBeNull();
  });
});
