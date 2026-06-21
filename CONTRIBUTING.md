# Contributing to RepoDock

Thanks for your interest in improving RepoDock!

## Prerequisites

- Node.js ≥ 22.12 (see [`.node-version`](.node-version))
- pnpm via Corepack: `corepack enable`

## Setup

```bash
pnpm install        # also runs `wxt prepare` to generate types
pnpm dev            # Chrome dev build with HMR
```

## Quality gates

Before opening a pull request, make sure the full gate passes:

```bash
pnpm check          # typecheck + lint + format check + unit/component tests
pnpm e2e            # build + Playwright E2E/visual/a11y (needs `pnpm e2e:install` once)
```

Individual commands:

| Command              | What it does                          |
| -------------------- | ------------------------------------- |
| `pnpm typecheck`     | `wxt prepare` + strict `tsc --noEmit` |
| `pnpm lint`          | ESLint (type-aware) — must be clean   |
| `pnpm format`        | Prettier write                        |
| `pnpm test:coverage` | Vitest + coverage thresholds          |

## Conventions

- **TypeScript strict** everywhere, plus `noUncheckedIndexedAccess` and
  `verbatimModuleSyntax`. Prefer `import type` for type-only imports (ESLint will
  fix this for you).
- **No new runtime dependencies** without discussion — keep the bundle lean.
- **Keep `core/` pure.** Domain logic must not depend on DOM globals; pass a
  `Document` in. This is what keeps it fully unit-testable.
- **Accuracy first.** Never display a value RepoDock isn't sure about. New
  resolution logic must record a `source` and `confidence` and omit unknowns.
- **Privacy first.** Never persist page content or anything sensitive. New stored
  fields must go through URL sanitization and be justified.
- **Accessibility.** New UI must be keyboard-operable and pass the axe checks in
  the component and E2E tests.
- **Localization-ready.** User-facing strings go through `src/i18n` — no hardcoded
  copy in components.

## Tests

- Put pure-logic and component tests under `tests/unit/` (Vitest, happy-dom).
- Put extension/browser tests under `tests/e2e/` (Playwright).
- Add or update tests with every behavior change; coverage thresholds are
  enforced for `src/core` and `src/lib`.

## Architecture decisions

Significant or non-obvious choices are recorded as ADRs in
[`docs/adr/`](docs/adr/). Add a new one when you make a decision future
contributors would otherwise have to reverse-engineer (a new dependency, an API
trade-off, a notable deviation).

## Commit / PR

- Keep PRs focused and described in English.
- Reference the issue you're addressing.
- CI runs the same gates as above on Chrome/Edge/Firefox builds.

## Releasing & publishing

1. Bump the version in `package.json`, update `CHANGELOG.md`, and tag `vX.Y.Z`.
   The **Release** workflow then builds, packages, and attaches the store ZIPs
   (Chrome/Edge) and the Firefox add-on + source ZIP to a draft GitHub release.
2. To publish to the stores, configure the secrets listed in
   [`.env.submit.example`](.env.submit.example) (run `pnpm submit:init` locally
   for a guided setup), then either:
   - run `pnpm zip:all && pnpm submit` locally with `.env.submit` populated, or
   - trigger the **Publish to stores** workflow from the Actions tab (it does a
     dry run by default; uncheck it to submit for real).

Publishing is intentionally manual and opt-in — RepoDock never auto-submits.
