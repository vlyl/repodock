import js from '@eslint/js';
import tseslint from 'typescript-eslint';
import reactHooks from 'eslint-plugin-react-hooks';
import prettier from 'eslint-config-prettier';
import globals from 'globals';

export default tseslint.config(
  // Things ESLint should never look at.
  {
    ignores: [
      '.output/**',
      '.wxt/**',
      'node_modules/**',
      'coverage/**',
      'dist/**',
      'playwright-report/**',
      'test-results/**',
      'scripts/**',
    ],
  },

  // Baseline JS recommendations.
  js.configs.recommended,

  // Type-aware linting for all TypeScript sources.
  ...tseslint.configs.recommendedTypeChecked,
  ...tseslint.configs.stylisticTypeChecked,
  {
    files: ['**/*.{ts,tsx}'],
    languageOptions: {
      parserOptions: {
        projectService: true,
        tsconfigRootDir: import.meta.dirname,
      },
      globals: {
        ...globals.browser,
      },
    },
    plugins: {
      'react-hooks': reactHooks,
    },
    rules: {
      // Pairs with `verbatimModuleSyntax`: keep type and value imports separate.
      '@typescript-eslint/consistent-type-imports': [
        'error',
        { prefer: 'type-imports', fixStyle: 'separate-type-imports' },
      ],
      '@typescript-eslint/no-unused-vars': [
        'error',
        { argsIgnorePattern: '^_', varsIgnorePattern: '^_' },
      ],
      // Correctness rules that matter a lot in async extension code.
      '@typescript-eslint/no-floating-promises': 'error',
      '@typescript-eslint/no-misused-promises': 'error',
      // Disabled: browser/DOM API type declarations frequently understate
      // runtime nullability (e.g. `tabs[0]`, `window.matchMedia`), so this rule
      // flags legitimate defensive guards. strictNullChecks covers the real cases.
      '@typescript-eslint/no-unnecessary-condition': 'off',
      '@typescript-eslint/switch-exhaustiveness-check': [
        'error',
        { considerDefaultExhaustiveForUnions: true },
      ],
      // React hooks correctness.
      'react-hooks/rules-of-hooks': 'error',
      'react-hooks/exhaustive-deps': 'warn',
      // General hygiene.
      eqeqeq: ['error', 'always', { null: 'ignore' }],
      'no-console': ['warn', { allow: ['warn', 'error'] }],
      'prefer-const': 'error',
    },
  },

  // Tests may use globals and looser async rules.
  {
    files: ['tests/**/*.{ts,tsx}', '**/*.test.{ts,tsx}', '**/*.spec.{ts,tsx}'],
    languageOptions: {
      globals: {
        ...globals.node,
      },
    },
    rules: {
      '@typescript-eslint/no-non-null-assertion': 'off',
      '@typescript-eslint/no-floating-promises': 'off',
      '@typescript-eslint/no-empty-function': 'off',
      '@typescript-eslint/no-unsafe-assignment': 'off',
      '@typescript-eslint/no-unsafe-member-access': 'off',
      // Playwright's fixture callback is named `use`; the hooks rule misreads it
      // as React's `use` hook. Tests don't author React hooks anyway.
      'react-hooks/rules-of-hooks': 'off',
      'no-console': 'off',
    },
  },

  // Node-context config files.
  {
    files: ['*.config.ts', 'playwright.config.ts', 'vitest.config.ts', 'wxt.config.ts'],
    languageOptions: {
      globals: {
        ...globals.node,
      },
    },
  },

  // Plain JS (e.g. this config file) is not part of the TS program, so disable
  // the type-aware rules for it.
  {
    files: ['**/*.{js,mjs,cjs}'],
    ...tseslint.configs.disableTypeChecked,
    languageOptions: {
      globals: {
        ...globals.node,
      },
    },
  },

  // Turn off rules that conflict with Prettier. Keep last.
  prettier,
);
