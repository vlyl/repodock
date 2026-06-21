# 5. Extension-owned history without the `history` permission

- Status: Amended by [ADR-7](0007-import-browser-github-history.md)
- Date: 2026-06-21

> **Amendment:** RepoDock now _also_ reads the browser's github.com history (with
> the `history` permission) to populate the recent list, per a product decision
> recorded in ADR-7. The extension-owned history described here remains the
> source of recorded visits, pins, and titles; the browser history is an optional,
> read-only overlay. The "no `history` permission" stance below is superseded.

## Context

RepoDock offers a "recent GitHub pages" list. The browser `history` permission
would expose the user's entire browsing history — far more than needed, a privacy
liability, and a likely store-review flag. The feature only needs the GitHub
pages observed while the extension is running.

## Decision

- Maintain an **extension-owned** history: the content-script `ContextController`
  records the pages it resolves, into `local` extension storage. No `history` (or
  `tabs`) permission is requested.
- Store only sanitized navigation metadata (see ADR-4 and the privacy policy);
  never page content, tokens, or session values.
- Record a visit only after the context **stabilizes** (a debounce keyed on the
  canonical URL), so transient routes and DOM mutations don't create duplicates.
- Keep history **local-only and never synced**; only settings sync.
- Pinned entries are never trimmed; the unpinned limit is user-configurable within
  a safe bound.

## Consequences

- The permission surface stays minimal (`storage`, `activeTab`), which is good for
  user trust and store review.
- History reflects only what was seen while RepoDock was active — an acceptable
  and expected trade-off for the privacy gain.
