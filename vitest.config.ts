import { defineConfig } from 'vitest/config';
import { WxtVitest } from 'wxt/testing';

// WxtVitest() wires up the `#imports` virtual module, the in-memory
// `fakeBrowser` (an implementation of the extension APIs), and resets it
// between tests, so unit tests can exercise storage and messaging for real.
export default defineConfig({
  plugins: [WxtVitest()],
  test: {
    // happy-dom is used instead of jsdom: current jsdom replaces the global
    // `Uint8Array` with one from a different realm, which trips esbuild's
    // `new TextEncoder().encode() instanceof Uint8Array` startup invariant.
    environment: 'happy-dom',
    globals: false,
    setupFiles: ['./tests/setup.ts'],
    include: ['tests/unit/**/*.{test,spec}.{ts,tsx}', 'src/**/*.{test,spec}.{ts,tsx}'],
    exclude: ['tests/e2e/**', 'node_modules/**', '.output/**', '.wxt/**'],
    restoreMocks: true,
    clearMocks: true,
    coverage: {
      provider: 'v8',
      reporter: ['text', 'html', 'lcov'],
      reportsDirectory: './coverage',
      include: ['src/**/*.{ts,tsx}'],
      exclude: [
        'src/**/*.{test,spec}.{ts,tsx}',
        'src/**/*.d.ts',
        'src/**/types.ts',
        'src/entrypoints/**',
        'src/ui/**',
        'src/i18n/**',
      ],
      thresholds: {
        statements: 80,
        branches: 80,
        functions: 80,
        lines: 80,
      },
    },
  },
});
