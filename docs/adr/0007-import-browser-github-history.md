# 7. Import the browser's github.com history into the recent list

- Status: Accepted (presentation amended by [ADR-8](0008-bottom-corner-dock-with-popup-history.md))
- Date: 2026-06-21
- Amends: [ADR-5](0005-extension-owned-history.md)

## Context

ADR-5 deliberately avoided the `history` permission and recorded only pages seen
while RepoDock was running. In practice this misses everything the user visited
before installing RepoDock or in other sessions, which undercuts the dock's value
as a fast "jump back to a recent GitHub page" navigator. The product owner asked
for the recent list to include the browser's existing github.com history,
grouped and newest-first, shown directly in the dock.

## Decision

- Add the `history` permission and read the browser's history, **filtered to
  github.com**, to populate the recent list. The query is done in the background
  (the `history` API is unavailable to content scripts) and delivered to the dock
  via messaging.
- Browser entries are **read-only and merged** with the owned history,
  deduplicated by canonical key; owned entries win (they carry pins, accurate
  visit counts, and DOM-refined titles). Pinning a browser-only entry persists it
  into the owned store.
- The recent list is **grouped by repository**, newest-first within each group
  and with the most-recently-visited group first.
- Gate the whole feature behind an **`importBrowserHistory` setting** (on by
  default) so users can disable it; while off, no history is read.
- Stay within the original privacy guarantees: github.com entries only, never
  non-github.com history, never deletions, never any network transmission, and
  nothing extra copied into RepoDock's own storage.

## Consequences

- The `history` permission is more scrutinized by stores and shown to users at
  install. We accept this trade-off for the product value, keep its use narrow
  (read github.com only), and make it user-toggleable.
- The privacy policy, store listing, and README are updated to disclose the
  permission and its strictly-limited use.
- Vertical (left/right) docks render the list inline as a sidebar; the default
  position is now `left` to make the navigator the primary surface.
