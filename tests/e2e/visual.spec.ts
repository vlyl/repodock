import { expect, githubBlobFixture, test } from './fixtures';

// Visual baselines are created on first run (updateSnapshots: 'missing' in the
// Playwright config) and compared thereafter with a small pixel tolerance.
test.describe('visual', () => {
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
    await page.locator('.rd-dock__bar').waitFor();
    // Capture the context bar only; the recent list below it varies with the
    // browser's actual history and would make the snapshot non-deterministic.
    await expect(page.locator('.rd-dock__bar')).toHaveScreenshot('dock-bar.png');
  });
});
