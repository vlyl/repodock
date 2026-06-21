# Store listing copy

Reusable copy for the Chrome Web Store, Microsoft Edge Add-ons, and Firefox
Add-ons (AMO). All copy is in English.

## Name

RepoDock — GitHub context dock

## Short description (≤ 132 chars)

A persistent dock that keeps your current GitHub repository, branch, location,
and file path visible while you browse.

## Detailed description

RepoDock pins an accurate, glanceable summary of your GitHub context to the edge
of the screen, so you always know where you are — even after scrolling or
GitHub's client-side navigation.

It shows your repository, ref (branch, tag, commit, or PR head·base), location
(Code, Pull Request, Issue, Discussion, Commit, Actions, Release, Wiki, Settings,
Security, Insights, and more), the repository path, the current file, and the
selected line range. Every segment is clickable to jump straight back to that
part of your context, and a copy button gives you a clean context string.

Accuracy comes first. RepoDock resolves each value with a known source and
confidence, never guesses a branch, and never shows stale context from the page
you just left. If something can't be determined, it's simply left out.

Features:
• A compact dock pinned to the bottom-left or bottom-right corner that never
pushes or covers GitHub's content, and can optionally auto-hide to a small handle.
• A recent-pages list that pops up on demand, grouped by repository and sorted
newest-first, drawn from both the pages you visit and your existing github.com
browser history, with search, pinning, and quick navigation.
• A configurable keyboard shortcut to toggle the dock.
• Follows GitHub's light/dark theme, or force one.
• Compact and comfortable density.

Privacy:
RepoDock stores everything locally and makes no network requests. It never
records page content, comments, issue or pull-request text, copied code, OAuth
codes, tokens, or session data. It reads your github.com browser history (only)
locally to populate the recent list — you can turn this off — and never reads
non-github.com history or deletes anything. Recent-page history is never synced;
only your settings sync.

RepoDock is open source and is not affiliated with GitHub.

## Category

Developer Tools

## Permission justifications

- **storage** — to save your settings and your local recent-page history.
- **activeTab** — so the toolbar popup can read the active tab's context when you
  open it.
- **history** — to read your existing github.com history (only) and surface it in
  the recent list. RepoDock never reads non-github.com entries and never deletes
  history. This can be turned off in the options page.
- **Host access (github.com)** — RepoDock runs only on github.com to read the
  page URL and structural markup needed to display your context.

## Privacy / data collection

No data is collected, transmitted, or sold. See the bundled privacy policy.

## Firefox (AMO) notes

The build is Manifest V3 with an explicit add-on id
(`repodock@repodock.dev`). A reproducible source ZIP is produced by
`pnpm zip:firefox` for reviewer reproducibility.
