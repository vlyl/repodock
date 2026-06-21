import { defineConfig, devices } from '@playwright/test';

const isCI = !!process.env.CI;

// E2E and visual tests run against a real Chromium with the built extension
// loaded (see tests/e2e/fixtures.ts). The extension must be built first; the
// `e2e` package script runs `wxt build -b chrome` beforehand.
export default defineConfig({
  testDir: './tests/e2e',
  // Extension tests share one persistent browser context, so keep them serial.
  fullyParallel: false,
  workers: 1,
  forbidOnly: isCI,
  retries: isCI ? 1 : 0,
  reporter: isCI
    ? [['github'], ['html', { open: 'never' }]]
    : [['list'], ['html', { open: 'never' }]],
  timeout: 30_000,
  // Create baselines that don't exist yet instead of failing; compare the rest.
  updateSnapshots: 'missing',
  expect: {
    toHaveScreenshot: {
      maxDiffPixelRatio: 0.02,
      animations: 'disabled',
    },
  },
  use: {
    ...devices['Desktop Chrome'],
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    video: isCI ? 'on-first-retry' : 'off',
  },
});
