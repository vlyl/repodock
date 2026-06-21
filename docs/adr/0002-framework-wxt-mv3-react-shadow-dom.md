# 2. WXT + Manifest V3 + React in a Shadow Root

- Status: Accepted
- Date: 2026-06-21

## Context

RepoDock must run on Chrome, Edge, and Firefox as a Manifest V3 extension, render
a non-trivial UI inside GitHub pages without any CSS bleeding in either
direction, and survive GitHub's Turbo client-side navigation without flashing or
showing stale state.

## Decision

- Use **WXT** as the extension framework. It provides cross-browser MV3 builds,
  a typed `storage`/`browser` API, the `#imports` module, ZIP/source-ZIP tooling,
  and first-class Shadow Root UI helpers.
- Use **React** (via `@wxt-dev/module-react`) for the dock, popup, and options.
- Render the content UI with **`createShadowRootUi`** and `cssInjectionMode:
'ui'`, anchoring the host element to `<html>` with `append: 'first'`.
- Force **Manifest V3 on every target** with `manifestVersion: 3` (WXT defaults
  Firefox to MV2).

## Consequences

- Anchoring to `<html>` (which Turbo does not replace) means the dock mounts once
  and never remounts during navigation; a `ContextController` re-resolves context
  on route changes instead.
- The Shadow Root + a `:host { all: initial }` reset gives complete style
  isolation in both directions; tokens are hand-authored px values so GitHub's
  root font-size cannot rescale the dock.
- We do not integrate with or depend on Refined GitHub.
- WXT auto-imports are disabled (`imports: false`) in favor of explicit imports
  for greppability and strict typing.
