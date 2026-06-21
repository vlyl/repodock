import type { BrowserContext } from '@playwright/test';
import { expect, githubBlobFixture, test } from './fixtures';

async function serveGitHub(context: BrowserContext): Promise<void> {
  await context.route('https://github.com/**', (route) =>
    route.fulfill({ contentType: 'text/html', body: githubBlobFixture() }),
  );
}

test.describe('content dock', () => {
  test('renders the resolved context on a GitHub page', async ({ context }) => {
    await serveGitHub(context);
    const page = await context.newPage();
    await page.goto('https://github.com/facebook/react/blob/main/packages/react/src/React.js');

    // The Shadow Root host is attached to <html>.
    const dock = page.locator('repodock-dock');
    await expect(dock).toBeAttached();
    // The host must not occupy layout space (otherwise a blank strip appears at
    // the top of the page, even when the dock is hidden).
    const hostHeight = await dock.evaluate((el) => el.getBoundingClientRect().height);
    expect(hostHeight).toBe(0);
    // ...and it must not push page content down.
    const bodyTop = await page.evaluate(() => document.body.getBoundingClientRect().top);
    expect(bodyTop).toBe(0);
    // The repository, ref, and file path all appear in the dock. (The text can
    // also appear in the recent list, so assert containment, not a single node.)
    await expect(dock).toContainText('facebook/react');
    await expect(dock).toContainText('React.js');
    await expect(dock).toContainText('main');
  });

  test('shows the recent list inline by default (left/vertical dock)', async ({ context }) => {
    await serveGitHub(context);
    const page = await context.newPage();
    await page.goto('https://github.com/facebook/react/blob/main/packages/react/src/React.js');

    // The default position is left, so the recent list is shown inline.
    await expect(page.getByRole('heading', { name: 'Recent GitHub pages' })).toBeVisible();
  });

  test('can be hidden via the hide control', async ({ context }) => {
    await serveGitHub(context);
    const page = await context.newPage();
    await page.goto('https://github.com/facebook/react/blob/main/packages/react/src/React.js');

    await expect(page.locator('.rd-dock')).toBeVisible();
    await page.getByLabel('Hide dock').click();
    await expect(page.locator('.rd-dock')).toHaveCount(0);
  });
});
