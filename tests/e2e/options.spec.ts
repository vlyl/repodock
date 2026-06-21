import AxeBuilder from '@axe-core/playwright';
import { expect, test } from './fixtures';

test.describe('options page', () => {
  test('renders the settings sections and persists a change', async ({ context, extensionId }) => {
    const page = await context.newPage();
    await page.goto(`chrome-extension://${extensionId}/options.html`);

    await expect(page.getByRole('heading', { name: 'RepoDock settings' })).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Appearance' })).toBeVisible();
    await expect(page.getByRole('heading', { name: 'History', exact: true })).toBeVisible();

    const labelsToggle = page.getByRole('switch', { name: 'Show field labels' });
    await expect(labelsToggle).toHaveAttribute('aria-checked', 'true');
    await labelsToggle.click();
    await expect(labelsToggle).toHaveAttribute('aria-checked', 'false');
  });

  test('has no serious accessibility violations', async ({ context, extensionId }) => {
    const page = await context.newPage();
    await page.goto(`chrome-extension://${extensionId}/options.html`);
    await page.getByText('Appearance').waitFor();

    const results = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa']).analyze();
    expect(results.violations).toEqual([]);
  });
});
