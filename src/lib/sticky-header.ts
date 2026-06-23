/**
 * Optionally pins GitHub's own page header (the `AppHeader`, which holds the
 * owner/repo breadcrumb and the repository nav tabs) to the top of the viewport
 * so it stays visible while scrolling. This is the one feature that styles
 * GitHub's page directly, so it is injected as a single page-level <style> gated
 * on a <html> attribute, and is opt-in via settings.
 */
const STYLE_ID = 'repodock-sticky-header';
const ATTR = 'data-rd-sticky-header';

const CSS = `
html[${ATTR}='true'] header.AppHeader {
  position: sticky !important;
  top: 0 !important;
  z-index: 100 !important;
}`;

/** Inject the gated stylesheet once (idempotent). */
export function ensureStickyHeaderStyle(doc: Document): void {
  if (doc.getElementById(STYLE_ID)) return;
  const style = doc.createElement('style');
  style.id = STYLE_ID;
  style.textContent = CSS;
  (doc.head ?? doc.documentElement).appendChild(style);
}

/** Enable or disable the sticky header by toggling the gating attribute. */
export function setStickyHeader(doc: Document, enabled: boolean): void {
  ensureStickyHeaderStyle(doc);
  if (enabled) doc.documentElement.setAttribute(ATTR, 'true');
  else doc.documentElement.removeAttribute(ATTR);
}
