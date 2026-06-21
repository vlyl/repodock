# 8. Bottom-corner dock with a pop-up recent list

- Status: Accepted
- Date: 2026-06-21
- Amends: [ADR-7](0007-import-browser-github-history.md)

## Context

ADR-7 made the recent list a persistent inline sidebar for left/right docks. A
persistent, always-expanded left sidebar forces a choice between two bad options:
**overlapping** GitHub's content (which starts at the left edge) or **pushing**
the page aside (which interacts badly with GitHub's centered layout and looks
unbalanced). Both were tried and rejected in review.

## Decision

Make the dock unobtrusive and the list on-demand:

- Anchor the dock to a **bottom corner** (bottom-left default, bottom-right
  optional). Positions are reduced to **left/right only** — top and bottom are
  removed.
- The dock is a **compact bar**. The recent list is a **popover that opens on
  demand** (via the logo handle or the history icon) and stacks **upward** above
  the bar, closing on Escape or an outside click. It is never shown until
  requested, so it cannot cover content unexpectedly.
- Add an opt-in **`autoHide`** setting (default off — the bar shows expanded):
  when enabled, the idle bar collapses to a small logo handle and expands on
  hover.
- The Shadow Root host must NOT be `position: fixed` — that creates a stacking
  context that traps the dock's high z-index inside the host, letting GitHub's
  positioned elements paint over the dock and swallow clicks. WXT's overlay mode
  already sizes the host to a 0×0 block (no top-of-page strip) without it.
- Remove page-space reservation entirely (no document shifting) and the manual
  collapse setting (superseded by auto-hide).

## Consequences

- The dock no longer overlaps or pushes GitHub's content in its resting state; it
  occupies only a small bottom corner and reveals itself on hover/click.
- The `reservePageSpace` and `collapsed` settings and the page-offset module are
  removed; `position` is now `left | right`.
- Auto-hide relies on CSS `:hover`; the list, hide, and copy controls are
  revealed on hover (E2E tests hover before interacting).
