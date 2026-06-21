# 1. Record architecture decisions

- Status: Accepted
- Date: 2026-06-21

## Context

RepoDock makes a number of non-obvious engineering choices (framework, pinned
build versions, the accuracy model, the privacy posture). Without a record,
future contributors would have to reverse-engineer the _why_ and might
inadvertently undo a deliberate decision.

## Decision

We keep lightweight Architecture Decision Records (ADRs) in `docs/adr/`, one
Markdown file per decision, numbered sequentially. Each ADR captures Status,
Context, Decision, and Consequences. Superseded ADRs are kept for history and
marked as such.

## Consequences

- Significant or surprising changes (a new dependency, an API trade-off, a notable
  deviation from defaults) should be accompanied by an ADR.
- ADRs are short and skimmable; they are not exhaustive design docs.
