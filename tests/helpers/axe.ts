import axe from 'axe-core';
import { expect } from 'vitest';

/**
 * Assert that an element tree has no axe-core accessibility violations.
 *
 * A few rules that require real layout (which jsdom does not provide) are
 * disabled here; they are covered instead by the Playwright a11y E2E tests that
 * run in real Chromium.
 */
export async function expectNoA11yViolations(element: Element): Promise<void> {
  const results = await axe.run(element, {
    rules: {
      'color-contrast': { enabled: false },
      region: { enabled: false },
    },
  });

  const summary = results.violations
    .map((violation) => `- [${violation.id}] ${violation.help} (${violation.nodes.length} node(s))`)
    .join('\n');

  expect(results.violations, `Accessibility violations found:\n${summary}`).toEqual([]);
}
