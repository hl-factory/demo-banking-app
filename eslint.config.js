import js from '@eslint/js';
import tseslint from 'typescript-eslint';
import globals from 'globals';

/**
 * Flat ESLint config for the demo banking app.
 *
 * Lints the TypeScript + React (JSX) source with the typescript-eslint
 * recommended ruleset on top of @eslint/js recommended. tsc already enforces
 * strict unused-locals/params, so the redundant eslint rule is relaxed to keep
 * the gate clean without double-reporting. Vitest globals (describe/it/expect)
 * are declared for test files.
 */
export default tseslint.config(
  {
    ignores: ['node_modules/**', 'dist/**', 'build/**', 'coverage/**'],
  },
  js.configs.recommended,
  ...tseslint.configs.recommended,
  {
    languageOptions: {
      ecmaVersion: 2022,
      sourceType: 'module',
      globals: {
        ...globals.browser,
        ...globals.node,
      },
    },
    rules: {
      // tsc enforces unused locals/params strictly; avoid duplicate noise.
      '@typescript-eslint/no-unused-vars': 'off',
      // Demo app: developer console logging is acceptable.
      'no-console': 'off',
    },
  },
  {
    files: ['**/*.test.{ts,tsx}', 'src/test/**/*.ts'],
    languageOptions: {
      globals: {
        ...globals.browser,
        describe: 'readonly',
        it: 'readonly',
        test: 'readonly',
        expect: 'readonly',
        beforeEach: 'readonly',
        afterEach: 'readonly',
        beforeAll: 'readonly',
        afterAll: 'readonly',
        vi: 'readonly',
      },
    },
  },
);
