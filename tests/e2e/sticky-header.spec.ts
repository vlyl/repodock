import { expect, test } from './fixtures';

const PAGE = `<!doctype html><html><head><style>
  body { margin: 0; }
  .AppHeader { height: 60px; background: #eaeef2; }
  .tall { height: 3000px; }
</style></head><body>
  <header class="AppHeader">owner/repo · Code Issues Pull requests</header>
  <div class="tall">content</div>
</body></html>`;

test("pins GitHub's header only when the setting is on", async ({ context, extensionId }) => {
  await context.route('https://github.com/**', (route) =>
    route.fulfill({ contentType: 'text/html', body: PAGE }),
  );

  const page = await context.newPage();
  await page.goto('https://github.com/facebook/react');
  const header = page.locator('header.AppHeader');
  await header.waitFor();

  // Off by default: GitHub's header is not made sticky.
  expect(await header.evaluate((el) => getComputedStyle(el).position)).not.toBe('sticky');

  // Turn it on from the popup.
  const popup = await context.newPage();
  await popup.goto(`chrome-extension://${extensionId}/popup.html`);
  await popup.getByRole('switch', { name: 'Sticky GitHub header' }).click();
  await popup.close();

  // The content script applies it; the header pins to the top on scroll.
  await expect(async () => {
    expect(await header.evaluate((el) => getComputedStyle(el).position)).toBe('sticky');
  }).toPass({ timeout: 4000 });
  await page.evaluate(() => window.scrollTo(0, 1500));
  expect(await header.evaluate((el) => el.getBoundingClientRect().top)).toBeLessThanOrEqual(1);
});
