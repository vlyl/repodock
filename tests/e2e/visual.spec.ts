import { expect, githubBlobFixture, test } from './fixtures';

// Visual baselines are platform-specific (Playwright suffixes them with the OS).
// Tagged @visual so CI can skip them — only committed-platform baselines compare
// meaningfully. Run locally with `pnpm e2e`.
test.describe('visual @visual', () => {
  test('popup', async ({ context, extensionId }) => {
    const page = await context.newPage();
    await page.setViewportSize({ width: 360, height: 560 });
    await page.goto(`chrome-extension://${extensionId}/popup.html`);
    await page.getByText('Dock position').waitFor();
    await expect(page).toHaveScreenshot('popup.png');
  });

  test('dock', async ({ context }) => {
    await context.route('https://github.com/**', (route) =>
      route.fulfill({ contentType: 'text/html', body: githubBlobFixture() }),
    );
    const page = await context.newPage();
    await page.goto('https://github.com/facebook/react/blob/main/packages/react/src/React.js');
    // Hover to expand the auto-hiding bar, then capture it (the recent list is
    // on-demand and varies with real history, so it's excluded here).
    await page.locator('.rd-dock').hover();
    await expect(page.locator('.rd-dock__bar')).toContainText('facebook/react');
    await expect(page.locator('.rd-dock__bar')).toHaveScreenshot('dock-bar.png');
  });
});
