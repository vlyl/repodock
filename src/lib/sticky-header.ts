/**
 * Optionally pins GitHub's own page header — the global bar with the owner/repo
 * breadcrumb plus the repository nav tabs (Code / Issues / Pull requests …), all
 * of which live in GitHub's `header.GlobalNav` — to the top of the viewport so it
 * stays visible while scrolling.
 *
 * `position: sticky` does NOT work here: GitHub nests the header inside short
 * wrapper elements (a <div> and a <react-partial>, ~the header's own height), so
 * a sticky header only "sticks" within that short box and scrolls away with it.
 * We therefore use `position: fixed` and offset the page with a body padding
 * equal to the header's measured height (kept in a CSS variable, updated by a
 * ResizeObserver so it tracks GitHub's responsive / per-page header heights).
 *
 * This is the one feature that styles GitHub's page directly, so it is a single
 * opt-in, gated page-level stylesheet plus that one measured variable.
 */
const STYLE_ID = 'repodock-sticky-header';
const ATTR = 'data-rd-sticky-header';
const HEIGHT_VAR = '--rd-sticky-header-height';

// Current GitHub uses `header.GlobalNav`; older builds used `.AppHeader`, and the
// hashed CSS-module class contains "appHeader" — cover all three.
const HEADER_SELECTOR =
  'header.GlobalNav, header.AppHeader, header[class*="appHeader"], header[class*="AppHeader"]';

const CSS = `
html[${ATTR}='true'] :is(${HEADER_SELECTOR}) {
  position: fixed !important;
  top: 0 !important;
  left: 0 !important;
  right: 0 !important;
  z-index: 100 !important;
}
html[${ATTR}='true'] body {
  padding-top: var(${HEIGHT_VAR}, 0px) !important;
}`;

let observer: ResizeObserver | undefined;
let observed: Element | undefined;

function findHeader(doc: Document): HTMLElement | null {
  return doc.querySelector<HTMLElement>(HEADER_SELECTOR);
}

/** Record the header's height so the body padding offsets the fixed header. */
function measure(doc: Document, header: Element): void {
  const height = Math.round(header.getBoundingClientRect().height);
  doc.documentElement.style.setProperty(HEIGHT_VAR, `${height}px`);
}

/** Inject the gated stylesheet once (idempotent). */
export function ensureStickyHeaderStyle(doc: Document): void {
  if (doc.getElementById(STYLE_ID)) return;
  const style = doc.createElement('style');
  style.id = STYLE_ID;
  style.textContent = CSS;
  (doc.head ?? doc.documentElement).appendChild(style);
}

/**
 * Enable or disable the sticky header. When enabling, (re)measures the current
 * header and observes it for size changes; call again after navigation to pick
 * up a replaced or resized header.
 */
export function setStickyHeader(doc: Document, enabled: boolean): void {
  ensureStickyHeaderStyle(doc);

  if (!enabled) {
    doc.documentElement.removeAttribute(ATTR);
    observer?.disconnect();
    observer = undefined;
    observed = undefined;
    return;
  }

  doc.documentElement.setAttribute(ATTR, 'true');
  const header = findHeader(doc);
  if (!header) return;

  measure(doc, header);
  if (observed === header) return;
  observer?.disconnect();
  if (typeof ResizeObserver !== 'undefined') {
    observer = new ResizeObserver(() => measure(doc, header));
    observer.observe(header);
    observed = header;
  }
}
