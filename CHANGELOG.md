# Changelog

All notable changes to RepoDock are documented here. The format is based on
[Keep a Changelog](https://keepachangelog.com/en/1.1.0/), and this project adheres
to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

## [0.1.0] — 2026-06-21

Initial release.

### Added

- Persistent, fixed GitHub context dock rendered in an isolated Shadow Root,
  anchored to `<html>` so it survives GitHub's client-side navigation without
  remounting.
- Accuracy-first context resolution: repository, ref (branch/tag/commit/PR
  head·base), location, repository path, current file, line range, and item
  identity — each with a tracked source and confidence, omitting unknowns and
  guarding against stale DOM during SPA navigation.
- Compact dock anchored to a bottom corner (bottom-left default or bottom-right),
  with an `autoHide` handle that expands on hover so it never pushes or covers
  GitHub's content. Hide and a configurable keyboard shortcut toggle visibility.
  See [ADR-8](docs/adr/0008-bottom-corner-dock-with-popup-history.md).
- Interactive context segments (repository, ref, breadcrumb, item, lines) and a
  "copy context" action.
- Recent-page navigator that pops up on demand: extension-owned, sanitized,
  deduplicated, stabilized recording merged with an optional, read-only import of
  the browser's github.com history (`history` permission, toggleable). The list
  is grouped by repository and sorted newest-first, with search, pinning, and
  per-entry removal. Each repository group is color-tinted, keeps its name pinned
  while scrolling, and reveals five pages at a time on demand. An **Only pages I'm
  involved in** filter (toggled from the dock) narrows the list to your own
  repositories and the issues / PRs / discussions you participate in. See
  [ADR-7](docs/adr/0007-import-browser-github-history.md).
- Configurable repository-section quick-nav buttons (Code, Issues, Pull requests,
  Actions, Projects, Wiki, Discussions, Security, Insights, Releases, Settings)
  in the dock, with the current section highlighted; all shown by default.
- Toolbar popup with quick toggles and a context preview, plus a full options
  page with appearance, behavior, history, shortcuts, advanced, and data
  controls.
- Zod-validated, versioned settings (sync storage) and history (local storage)
  with migrations and per-field resilience.
- GitHub-compatible theming that follows GitHub's light/dark mode.
- Localization-ready string catalog (English initial locale).
- Manifest V3 builds for Chrome, Edge, and Firefox.
- Unit, component (with axe-core), and Playwright extension/E2E/visual/a11y
  tests; GitHub Actions CI and a release workflow.

[Unreleased]: https://github.com/repodock/repodock/compare/v0.1.0...HEAD
[0.1.0]: https://github.com/repodock/repodock/releases/tag/v0.1.0
