import type { BrowserContext } from '@playwright/test';
import { expect, githubBlobFixture, test } from './fixtures';

const FILE_URL = 'https://github.com/facebook/react/blob/main/packages/react/src/React.js';

async function serveGitHub(context: BrowserContext): Promise<void> {
  await context.route('https://github.com/**', (route) =>
    route.fulfill({ contentType: 'text/html', body: githubBlobFixture() }),
  );
}

test.describe('content dock', () => {
  test('renders the resolved context without affecting page layout', async ({ context }) => {
    await serveGitHub(context);
    const page = await context.newPage();
    await page.goto(FILE_URL);

    // The Shadow Root host is attached to <html> with zero size and does not
    // push page content (no reserved space, no overlap by default).
    const dock = page.locator('repodock-dock');
    await expect(dock).toBeAttached();
    expect(await dock.evaluate((el) => el.getBoundingClientRect().height)).toBe(0);
    expect(await page.evaluate(() => document.body.getBoundingClientRect().top)).toBe(0);

    // Hovering reveals the bar (it auto-hides to a handle when idle).
    await page.locator('.rd-dock').hover();
    await expect(page.locator('.rd-dock__bar')).toContainText('facebook/react');
    await expect(page.locator('.rd-dock__bar')).toContainText('React.js');
  });

  test('opens the recent list on demand', async ({ context }) => {
    await serveGitHub(context);
    const page = await context.newPage();
    await page.goto(FILE_URL);

    // The list is not shown until requested (no overlap by default).
    await expect(page.getByRole('heading', { name: 'Recent GitHub pages' })).toBeHidden();
    // The brand handle is always visible and toggles the popover.
    await page.getByRole('button', { name: 'Recent pages' }).first().click();
    await expect(page.getByRole('heading', { name: 'Recent GitHub pages' })).toBeVisible();
  });

  test('can be hidden via the hide control', async ({ context }) => {
    await serveGitHub(context);
    const page = await context.newPage();
    await page.goto(FILE_URL);

    await expect(page.locator('.rd-dock')).toBeVisible();
    await page.locator('.rd-dock').hover();
    await page.getByLabel('Hide dock').click();
    await expect(page.locator('.rd-dock')).toHaveCount(0);
  });
});
