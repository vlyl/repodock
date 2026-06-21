# 3. Pin Vite 7 and @vitejs/plugin-react 4

- Status: Accepted
- Date: 2026-06-21

## Context

At implementation time the latest Vite is 8.x and the latest
`@vitejs/plugin-react` is 6.x — the new rolldown-based line, which pulls
additional rolldown peers and is comparatively bleeding-edge. Left unconstrained,
pnpm resolves Vite 8 + plugin-react 6. Meanwhile WXT 0.20, Vitest 4, and
`@wxt-dev/module-react` all also accept Vite 7 + plugin-react 4, the mature,
widely-deployed combination.

## Decision

Pin the toolchain via `pnpm.overrides`:

```json
"pnpm": { "overrides": { "vite": "^7.3.5", "@vitejs/plugin-react": "^4.7.0" } }
```

This deterministically resolves the whole tree to Vite 7.3.5 + plugin-react 4.7.0
and satisfies every peer range (WXT, Vitest, the WXT React module).

## Consequences

- A single, stable, battle-tested bundler/plugin pair across dev, build, and
  Vitest — no rolldown surprises.
- TypeScript is intentionally on 6.0.x (typescript-eslint 8.61 supports
  `<6.1.0`), and ESLint 10 is supported across the stack.
- Revisit this pin deliberately: re-check the full peer matrix (WXT, Vitest,
  module-react) before moving to Vite 8 / plugin-react 6.
