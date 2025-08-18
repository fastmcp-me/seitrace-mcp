// ESLint v9+ flat config
// See: https://eslint.org/docs/latest/use/configure/migration-guide
import js from '@eslint/js';
import tsParser from '@typescript-eslint/parser';
import tsPlugin from '@typescript-eslint/eslint-plugin';
import prettier from 'eslint-config-prettier';
import globals from 'globals';

export default [
  {
    ignores: ['build/**', 'tests/**', 'coverage/**', 'node_modules/**', '**/*.d.ts'],
    languageOptions: {
      ecmaVersion: 'latest',
      sourceType: 'module',
      globals: {
        ...globals.node,
      },
    },
  },
  js.configs.recommended,
  {
    files: ['**/*.ts', '**/*.tsx'],
    languageOptions: {
      parser: tsParser,
      parserOptions: {
        sourceType: 'module',
        ecmaVersion: 'latest',
      },
      globals: {
        ...globals.node,
      },
    },
    plugins: {
      '@typescript-eslint': tsPlugin,
    },
    rules: {
      // Disable core rule in TS files; use the TS-aware version instead
      'no-unused-vars': 'off',
      'no-console': [
        'error',
        {
          allow: ['error', 'warn'],
        },
      ],
      '@typescript-eslint/explicit-function-return-type': 'off',
      '@typescript-eslint/no-explicit-any': 'off',
      '@typescript-eslint/no-unused-vars': [
        'error',
        {
          // Allow intentionally unused args via leading underscore
          argsIgnorePattern: '^_',
          caughtErrorsIgnorePattern: '^_',
          ignoreRestSiblings: true,
          // Do not lint unused interfaces/types (PascalCase by convention)
          varsIgnorePattern: '^[A-Z]',
        },
      ],
    },
  },
  // Keep Prettier last to disable formatting rules that conflict with Prettier
  prettier,
];
