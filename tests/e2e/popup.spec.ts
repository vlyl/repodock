import AxeBuilder from '@axe-core/playwright';
import { expect, test } from './fixtures';

test.describe('popup', () => {
  test('renders the RepoDock controls', async ({ context, extensionId }) => {
    const page = await context.newPage();
    await page.goto(`chrome-extension://${extensionId}/popup.html`);

    await expect(page.getByText('RepoDock')).toBeVisible();
    await expect(page.getByText('Dock position')).toBeVisible();
    await expect(page.getByRole('switch', { name: 'Show dock' })).toBeVisible();
  });

  test('has no serious accessibility violations', async ({ context, extensionId }) => {
    const page = await context.newPage();
    await page.goto(`chrome-extension://${extensionId}/popup.html`);
    await page.getByText('Dock position').waitFor();

    const results = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa']).analyze();
    expect(results.violations).toEqual([]);
  });
});
