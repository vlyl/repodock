# Privacy Policy

**RepoDock does not collect, transmit, or sell any data.** Everything it stores
stays in your browser.

## What RepoDock stores

### Settings (synced if your browser syncs extensions)

Your preferences only: dock side, density, theme, visibility, auto-hide, whether
to record history, whether to include browser history, the history limit, link
target, and the diagnostics toggle. No personal data.

### Recent-page history (local only, never synced)

For each GitHub page you visit while RepoDock is enabled, it records **sanitized
navigation metadata** so you can find the page again:

- A sanitized canonical URL (see below)
- Repository identity (`owner/name`)
- Ref and ref type, when known
- Page type and path
- Item identity (PR / issue / discussion number, run id, release tag, commit SHA)
- A human-readable title derived from the page
- First/last visit timestamps and a visit count
- Pinned state

You control this entirely: disable recording, set the limit, search, pin, remove
individual entries, clear unpinned, or clear everything — from the popup or the
options page.

### Browser history (read on demand, not stored, optional)

When **Include browser history** is enabled (it is by default), RepoDock also
reads your browser's **github.com** history entries to populate the recent list,
so pages you visited before installing RepoDock — or in other tabs — are
available for quick navigation. This data is:

- Read **only for github.com** URLs, locally, through the browser's history API
- Used only to display the list; it is **not** copied into RepoDock's own
  storage and is **never** transmitted anywhere
- Disabled instantly by turning off **Include browser history** in the options
  page (no github.com history is read while it is off)

## What RepoDock never stores

- Page body text, file contents, or copied code
- Issue, pull-request, discussion, or comment content
- OAuth authorization codes, access tokens, or session values
- Any arbitrary URL query parameters

### URL sanitization

Before a URL is displayed or stored, RepoDock:

- Removes **all** query parameters except an explicit allow-list (`tab`)
- Keeps only GitHub **line-anchor** hashes (e.g. `#L20`, `#L20-L35`) and drops
  all other fragments
- Normalizes the host and trailing slashes

This guarantees that sensitive values carried in query strings or fragments
(such as `?code=…&state=…` from OAuth flows) are never persisted.

## Permissions

RepoDock requests the minimum permissions it needs:

| Permission  | Why                                                                |
| ----------- | ------------------------------------------------------------------ |
| `storage`   | Save your settings and local history.                              |
| `activeTab` | Let the popup read the active tab's context when you open it.      |
| `history`   | Read your existing github.com history to populate the recent list. |

RepoDock **does not** request the `tabs`, `cookies`, `webRequest`, or broad host
permissions. It runs only on `https://github.com/*`, and its use of the
`history` permission is limited to **reading github.com entries** for the recent
list — it never deletes history or reads non-github.com entries.

## Data sharing

None. RepoDock makes no network requests of its own and includes no analytics,
telemetry, or third-party services.

## Contact

Questions about privacy can be raised as an issue in the project repository.
