# 6. Use happy-dom for the Vitest environment

- Status: Accepted
- Date: 2026-06-21

## Context

Unit and component tests need a DOM environment. The default choice, jsdom, at
the current major version replaces the global `Uint8Array` with one from a
different realm. esbuild (used by Vite/Vitest to transform modules) performs a
startup invariant check — `new TextEncoder().encode("") instanceof Uint8Array` —
which then evaluates to `false`, and esbuild aborts with "your JavaScript
environment is broken". Tests in the `node` environment were unaffected, isolating
the cause to jsdom's global mutation.

## Decision

Use **happy-dom** as the Vitest `environment` instead of jsdom. happy-dom does not
clobber `Uint8Array`, so esbuild's invariant holds, and it is fully compatible
with Testing Library, user-event, and axe-core for our component tests.

## Consequences

- The unit/component suite runs reliably and fast.
- happy-dom implements a slightly smaller surface of the DOM than jsdom; layout-
  dependent accessibility rules are disabled at the component level and instead
  covered by the Playwright a11y tests in real Chromium.
- Revisit if a future jsdom release fixes the realm issue and we need its broader
  spec coverage.
