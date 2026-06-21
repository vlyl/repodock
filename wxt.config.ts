import { defineConfig } from 'wxt';

// RepoDock build configuration.
//
// Design choices worth calling out:
// - `srcDir: 'src'` keeps all source under `src/` and maps the `@/*` alias there.
// - `imports: false` disables WXT's magic auto-imports. Every WXT API is imported
//   explicitly from `#imports`, which keeps the codebase greppable and lets strict
//   TypeScript + ESLint reason about every symbol.
// - Permissions are intentionally minimal: `storage` for settings/history and
//   `activeTab` so the popup can read the active tab on user action. We deliberately
//   do NOT request the `history`, `tabs`, or broad host permissions.
export default defineConfig({
  srcDir: 'src',
  modules: ['@wxt-dev/module-react'],
  imports: false,
  // Ship Manifest V3 on every target, including Firefox (which WXT would
  // otherwise build as MV2).
  manifestVersion: 3,
  // RepoDock collects no user data, so the new Firefox data-collection
  // declaration is not applicable; silence the build-time reminder.
  suppressWarnings: {
    firefoxDataCollection: true,
  },
  manifest: {
    name: '__MSG_extName__',
    description: '__MSG_extDescription__',
    default_locale: 'en',
    // `history` lets RepoDock surface your existing github.com browser history
    // in the recent list. It only ever reads github.com entries.
    permissions: ['storage', 'activeTab', 'history'],
    // Toggle dock visibility from anywhere via a user-configurable shortcut.
    commands: {
      'toggle-dock': {
        description: '__MSG_cmdToggleDock__',
        suggested_key: {
          default: 'Alt+Shift+D',
        },
      },
    },
    action: {
      default_title: '__MSG_actionTitle__',
    },
    // Required so Firefox can install a signed/temporary MV3 build.
    browser_specific_settings: {
      gecko: {
        id: 'repodock@repodock.dev',
        strict_min_version: '115.0',
      },
    },
  },
  // Firefox MV3 uses a non-persistent background event page rather than a
  // service worker; WXT maps `defineBackground` onto the right target per browser.
  zip: {
    // Produce a reproducible source archive for Firefox add-on review. The
    // archive contains only what's needed to build; generated artifacts,
    // reports, and test snapshots are excluded.
    sourcesTemplate: '{{name}}-{{version}}-sources.zip',
    includeSources: ['src/**/*', 'public/**/*', '*.{json,ts,js,mjs,md}', '.npmrc'],
    excludeSources: [
      '**/node_modules/**',
      '.output/**',
      '.wxt/**',
      'coverage/**',
      'playwright-report/**',
      'test-results/**',
      'blob-report/**',
      '**/*-snapshots/**',
    ],
  },
});
