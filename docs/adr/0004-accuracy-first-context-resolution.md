# 4. Accuracy-first context resolution

- Status: Accepted
- Date: 2026-06-21

## Context

The product's core promise is that the context shown is _correct_. Two failure
modes are unacceptable: (1) **guessing** a value (e.g. assuming the default
branch), and (2) showing **stale** context from the previous page during GitHub's
client-side navigation. GitHub URLs are also genuinely ambiguous: in
`/tree/<ref>/<path>`, a branch name may contain slashes, so the ref/path split
cannot be derived from the URL alone.

## Decision

- Model every resolved value as carrying a **`source`** (`url`, `semantic-dom`,
  `metadata`, `canonical-link`, …) and a **`confidence`** (`high`/`medium`/`low`).
- Treat the **URL as the authoritative, highest-trust source** for structure.
  Mark ambiguous splits (ref preceding a path) as lower confidence.
- Refine ref/path and item titles from the **DOM** — primarily GitHub's embedded
  React JSON payload (Zod-validated) — and prefer the DOM only when it is at least
  as confident.
- Apply a **staleness guard**: ignore all DOM facts when the DOM's repository
  disagrees with the URL's (a strong signal the page hasn't finished navigating).
- **Omit** any value that cannot be determined with acceptable confidence. Never
  display a branch merely because it is probably the default.

## Consequences

- The resolver is a pure function of `{ url, document? }`, making it exhaustively
  unit-testable and usable from the popup (URL-only) and content script
  (URL + DOM) alike.
- Reliance on GitHub's internal embedded payload is isolated behind a validated
  parser and is strictly a _refinement_; everything degrades gracefully to
  URL-only resolution if GitHub changes that markup.
- Developer diagnostics expose source/confidence/resolver provenance for
  debugging without surfacing it in the normal UI.
