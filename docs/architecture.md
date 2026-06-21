# Architecture

RepoDock is a WXT + React + TypeScript Manifest V3 extension. This document
describes how the pieces fit together; the rationale for the larger decisions
lives in the [ADRs](adr/).

## Layers

```
URL + DOM ──▶ core/context (resolve) ──▶ GitHubContext ──▶ ui/dock (render)
                                            │
                                            ├──▶ core/history (record)
                                            └──▶ lib/messaging (popup query)
```

### `core/` — pure domain logic

No DOM globals are required to construct or test this layer; the resolver accepts
a `Document` as a parameter rather than reaching for the global one.

- **`context/`**
  - `types.ts` — the typed domain model (`GitHubContext`, `ResolvedValue`,
    `PageKind`, …). Every resolved value carries a `source` and a `confidence`.
  - `github-url.ts` — parses a GitHub URL into structural facts and sanitizes
    URLs for display/storage (allow-listed query params, line-anchor hashes
    only).
  - `embedded-data.ts` — reads GitHub's embedded React JSON payload (validated
    with Zod) to disambiguate ref vs. path.
  - `dom.ts` — repository confirmation from analytics metadata / canonical link,
    item titles from Open Graph, PR base·head from the DOM.
  - `resolve.ts` — merges URL and DOM facts by confidence, with a **staleness
    guard** (DOM is ignored when its repository disagrees with the URL).
  - `present.ts` — turns a context into a human title, a one-line summary, and
    structured, linkable segments for the dock.
- **`history/`** — `operations.ts` is pure (record, dedupe, trim, search, pin);
  `store.ts` persists state and honors the user's record/limit settings.
- **`settings/`** — typed settings with a Zod schema that falls back per-field.
- **`storage/`** — `PersistentValue`, a versioned, Zod-validated wrapper over
  WXT's cross-browser `storage` with sync→local fallback and migrations.

### `lib/` — runtime glue

- `context-controller.ts` — watches GitHub's client-side navigation (Turbo
  events, `popstate`, a URL poll), re-resolves a few times after each change to
  absorb GitHub's async DOM, emits to subscribers, and records a visit only once
  the context has **stabilized**.
- `messaging.ts` — typed messages between the popup and the content script, and
  the "open options" request to the background.
- `logger.ts` — diagnostics-gated logging.

### `ui/` — React

- `theme/` — GitHub-compatible CSS custom properties (hand-authored Primer
  values) and a hook that tracks light/dark.
- `components/` — accessible shared controls (icon button, switch, segmented
  control, select, number field, field row).
- `dock/` — the dock bar, breadcrumb segments, history panel, and diagnostics.
- `hooks/` — store/controller subscriptions, clipboard, current-tab context.

### `entrypoints/` — WXT

- `github.content/` — a content script that mounts the dock into a **Shadow
  Root** anchored to `<html>` (which Turbo navigation does not replace, so the
  dock never remounts). Styles are injected into the Shadow Root for full
  isolation in both directions.
- `background.ts` — the keyboard command (toggles the shared `visible` setting,
  observed by every content script) and the "open options" handler.
- `popup/`, `options/` — React pages reusing the same core and UI.

## Context accuracy

The resolver's contract is **accuracy over completeness**:

1. The URL is the highest-trust source for structure (owner/repo, page kind,
   item ids, line ranges, compare specs).
2. Ambiguous parts (a `tree/<ref>/<path>` split where the branch may contain
   slashes) are marked lower-confidence so the DOM can override them.
3. The embedded React payload provides exact ref/path with high confidence.
4. The DOM is trusted only when its repository matches the URL's, preventing a
   not-yet-updated SPA DOM from leaking stale context.

A value that cannot be determined is omitted — RepoDock never displays a branch
merely because it is likely the default.

## Persistence & privacy

- **Settings** live in `sync` storage (local fallback) so they follow the user.
- **History** lives in `local` storage only and is never synced.
- URLs are sanitized before storage: arbitrary query params are stripped (only
  `tab` is allow-listed), only `#L…` line anchors are kept, and OAuth codes /
  tokens / session values can never be persisted.

## Testing strategy

- **Unit / component** (Vitest + Testing Library + axe-core, happy-dom) cover the
  core resolver, history, settings, storage, the navigation controller, and the
  React components, with coverage thresholds enforced on `core/` and `lib/`.
- **E2E / visual / a11y** (Playwright, real Chromium with the built extension
  loaded) verify the dock injects and resolves context on an intercepted GitHub
  page, the popup and options pages work, and axe finds no WCAG A/AA violations.
