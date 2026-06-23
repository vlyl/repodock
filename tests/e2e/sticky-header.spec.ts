import { expect, test } from './fixtures';

// Mirrors GitHub's real structure: header.GlobalNav nested in short wrappers (a
// <div> inside a <react-partial>) that are only as tall as the header, so
// position:sticky can't span the scroll — the content script must use fixed +
// a body padding offset.
const PAGE = `<!doctype html><html><head><style>
  body { margin: 0; }
  header.GlobalNav { height: 60px; background: #eaeef2; }
  .tall { height: 3000px; }
</style></head><body>
  <react-partial><div>
    <header class="GlobalNav">owner/repo · Code Issues Pull requests</header>
  </div></react-partial>
  <div class="tall">content</div>
</body></html>`;

test("pins GitHub's header only when the setting is on", async ({ context, extensionId }) => {
  await context.route('https://github.com/**', (route) =>
    route.fulfill({ contentType: 'text/html', body: PAGE }),
  );

  const page = await context.newPage();
  await page.goto('https://github.com/facebook/react');
  const header = page.locator('header.GlobalNav');
  await header.waitFor();

  // Off by default: GitHub's header keeps its normal (non-fixed) position.
  expect(await header.evaluate((el) => getComputedStyle(el).position)).not.toBe('fixed');

  // Turn it on from the popup.
  const popup = await context.newPage();
  await popup.goto(`chrome-extension://${extensionId}/popup.html`);
  await popup.getByRole('switch', { name: 'Sticky GitHub header' }).click();
  await popup.close();

  // The content script fixes the header and offsets the page; it stays pinned.
  await expect(async () => {
    expect(await header.evaluate((el) => getComputedStyle(el).position)).toBe('fixed');
  }).toPass({ timeout: 4000 });
  await page.evaluate(() => window.scrollTo(0, 1500));
  expect(await header.evaluate((el) => el.getBoundingClientRect().top)).toBeLessThanOrEqual(1);
  // The body is padded so the fixed header doesn't cover content.
  expect(
    await page.evaluate(() => parseInt(getComputedStyle(document.body).paddingTop, 10) || 0),
  ).toBeGreaterThan(0);
});
