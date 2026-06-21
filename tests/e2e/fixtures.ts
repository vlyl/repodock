import { resolve } from 'node:path';
import { test as base, chromium } from '@playwright/test';
import type { BrowserContext } from '@playwright/test';

const EXTENSION_PATH = resolve(process.cwd(), '.output/chrome-mv3');

/**
 * Playwright fixtures that launch a headless Chromium with the built RepoDock
 * extension loaded, and expose the resolved extension id.
 */
export const test = base.extend<{
  context: BrowserContext;
  extensionId: string;
}>({
  // eslint-disable-next-line no-empty-pattern -- Playwright requires a destructuring pattern here.
  context: async ({}, use) => {
    // Extensions require the full Chromium (not the headless shell); the
    // `chromium` channel runs the new headless mode, which supports MV3.
    const context = await chromium.launchPersistentContext('', {
      channel: 'chromium',
      args: [`--disable-extensions-except=${EXTENSION_PATH}`, `--load-extension=${EXTENSION_PATH}`],
    });
    await use(context);
    await context.close();
  },

  extensionId: async ({ context }, use) => {
    let [worker] = context.serviceWorkers();
    worker ??= await context.waitForEvent('serviceworker');
    const extensionId = new URL(worker.url()).host;
    await use(extensionId);
  },
});

export const expect = test.expect;

/**
 * A minimal stand-in for a GitHub file page, including the embedded React data
 * payload RepoDock reads. Served via request interception so E2E tests need no
 * network access.
 */
export function githubBlobFixture(): string {
  const payload = {
    payload: {
      repo: { name: 'react', ownerLogin: 'facebook', defaultBranch: 'main' },
      refInfo: { name: 'main', refType: 'branch', currentOid: 'abc123' },
      path: 'packages/react/src/React.js',
      blob: {},
    },
  };
  return `<!doctype html>
<html lang="en" data-color-mode="light" data-light-theme="light" data-dark-theme="dark">
  <head>
    <meta charset="utf-8" />
    <title>React/React.js at main · facebook/react</title>
    <link rel="canonical" href="https://github.com/facebook/react/blob/main/packages/react/src/React.js" />
    <meta property="og:title" content="react/React.js at main · facebook/react" />
    <meta name="octolytics-dimension-repository_nwo" content="facebook/react" />
    <style>
      body,
      main,
      h1 {
        margin: 0;
      }
    </style>
  </head>
  <body>
    <main><h1>React.js</h1></main>
    <script type="application/json" data-target="react-app.embeddedData">${JSON.stringify(payload)}</script>
  </body>
</html>`;
}
