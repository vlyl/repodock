import type { DockPosition } from '@/core/settings';

const STYLE_ID = 'repodock-page-offset';

/**
 * Space reserved on the docked side: the vertical dock width (kept in sync with
 * dock.css) plus its edge offset and a small gap to the page content.
 */
const RESERVED_CSS = 'calc(min(340px, 40vw) + 16px)';

export interface PageOffsetState {
  position: DockPosition;
  visible: boolean;
  reservePageSpace: boolean;
}

function isVertical(position: DockPosition): boolean {
  return position === 'left' || position === 'right';
}

/**
 * Reserve viewport space for a vertical dock by shifting the document root, so
 * the dock no longer overlaps GitHub's content. Uses a document-level `<style>`
 * (the dock lives in a Shadow Root and cannot reach the page from CSS). A no-op
 * for top/bottom docks or when the user disables it.
 */
export function applyPageOffset(state: PageOffsetState): void {
  const existing = document.getElementById(STYLE_ID);
  const shouldReserve = state.visible && state.reservePageSpace && isVertical(state.position);

  if (!shouldReserve) {
    existing?.remove();
    return;
  }

  const side = state.position === 'right' ? 'right' : 'left';
  const css = `:root { margin-${side}: ${RESERVED_CSS} !important; transition: margin 0.15s ease; }`;

  const style = existing instanceof HTMLStyleElement ? existing : document.createElement('style');
  style.id = STYLE_ID;
  style.textContent = css;
  if (!existing) (document.head ?? document.documentElement).appendChild(style);
}

export function removePageOffset(): void {
  document.getElementById(STYLE_ID)?.remove();
}
