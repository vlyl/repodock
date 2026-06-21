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

  test('shows the recent list by default and collapses from the logo', async ({ context }) => {
    await serveGitHub(context);
    const page = await context.newPage();
    await page.goto(FILE_URL);

    // Shown by default; the logo handle toggles it (no header/close button).
    await expect(page.locator('.rd-dock__panel')).toBeVisible();
    await page.locator('.rd-dock').hover();
    await page.getByRole('button', { name: 'Recent pages' }).click();
    await expect(page.locator('.rd-dock__panel')).toBeHidden();
  });

  test('shows the GitHub section quick-nav inline in the bar', async ({ context }) => {
    await serveGitHub(context);
    const page = await context.newPage();
    await page.goto(FILE_URL);

    await page.locator('.rd-dock').hover();
    // The section nav shares the single bar (no separate nav pill above it).
    await expect(page.locator('.rd-dock__bar .rd-dock__nav')).toBeVisible();
    const nav = page.locator('.rd-dock__nav');
    await expect(nav.getByRole('link', { name: 'Issues' })).toHaveAttribute(
      'href',
      'https://github.com/facebook/react/issues',
    );
    await expect(nav.getByRole('link', { name: 'Code' })).toBeVisible();
  });
});
