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

## Chrome Web Store — "Privacy practices" tab answers

Copy these into the Privacy practices tab. (Manifest permissions: `storage`,
`activeTab`, `history`; host access to `github.com` via the content script.)

**Single purpose**

> RepoDock shows your current GitHub page context — repository, branch/tag,
> location, file path, and line range — in a persistent on-page dock, with
> one-click navigation and a private, local list of recently visited GitHub pages.

**Permission justifications**

- **storage** — Save the user's settings (synced) and their local recent-page
  history (stored locally, never synced).
- **activeTab** — Let the toolbar popup read the active tab's URL/context when the
  user opens the popup, to show a context preview for that tab.
- **history** — Read the user's existing github.com history entries (only) to
  populate the recent-pages list, so pages visited before install or in other
  tabs are available. Never reads non-github.com entries, never modifies or
  deletes history, and is user-toggleable in the options page.
- **Host access (`https://github.com/*`)** — RepoDock runs only on github.com to
  read the page URL and structural markup needed to resolve and display the
  context dock. It accesses no other sites.

**Are you using remote code?** No — all code is bundled in the package.

**Data usage** — Certify all three compliance statements (all true): data is not
sold or transferred to third parties; not used for any purpose unrelated to the
single purpose; not used for creditworthiness or lending.

Data types collected: **none are transmitted off the device.** RepoDock makes no
network requests and stores everything locally, so it does not "collect" data
under Chrome's definition (which is transmission off the device). The `history`
permission reads github.com history locally only; this is explained in the
permission justification above and the privacy policy.

**Privacy policy URL** — `https://github.com/vlyl/repodock/blob/main/docs/privacy.md`

## Screenshots

Store-ready 1280×800 screenshots live in [`docs/images/store/`](images/store):

1. `01-context-and-history.png` — context bar + the grouped, color-tinted recent list.
2. `02-context-bar.png` — the always-visible context bar and section quick-nav.
3. `03-pull-request.png` — pull-request context with the recent list open.

## Firefox (AMO) notes

The build is Manifest V3 with an explicit add-on id
(`repodock@repodock.dev`). A reproducible source ZIP is produced by
`pnpm zip:firefox` for reviewer reproducibility.
