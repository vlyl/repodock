import { beforeEach } from 'vitest';
import { fakeBrowser } from 'wxt/testing';
import '@testing-library/jest-dom/vitest';

// Reset the in-memory extension APIs (storage, messaging, listeners) before
// every test so suites are fully isolated.
beforeEach(() => {
  fakeBrowser.reset();
});
