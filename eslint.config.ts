import eslint from '@eslint/js';
import eslintComments from '@eslint-community/eslint-plugin-eslint-comments/configs';
import type { Config } from 'eslint/config';
import { defineConfig } from 'eslint/config';
import prettierConfig from 'eslint-plugin-prettier/recommended';
import simpleImportSort from 'eslint-plugin-simple-import-sort';
import tseslint from 'typescript-eslint';

export const createBaseConfig = ({ tsconfigRootDir }: { tsconfigRootDir: string }): Config[] =>
  defineConfig(
    {
      ignores: [
        'node_modules/',
        'dist/',
        'build/',
        '.turbo/',
        '*.config.ts',
        '*.config.js',
        '*.config.mjs',
        '*.d.ts',
      ],
    },

    eslint.configs.recommended,
    tseslint.configs.strictTypeChecked,

    {
      languageOptions: {
        parserOptions: {
          projectService: true,
          tsconfigRootDir,
        },
      },
    },

    // TypeScript strict rules
    {
      files: ['**/*.ts', '**/*.tsx'],
      rules: {
        '@typescript-eslint/no-explicit-any': 'error',
        '@typescript-eslint/no-floating-promises': 'error',
        '@typescript-eslint/consistent-type-imports': [
          'error',
          {
            prefer: 'type-imports',
            fixStyle: 'separate-type-imports',
          },
        ],
        '@typescript-eslint/no-unused-vars': [
          'error',
          {
            argsIgnorePattern: '^_',
            varsIgnorePattern: '^_',
          },
        ],
        '@typescript-eslint/explicit-function-return-type': [
          'error',
          {
            allowExpressions: true,
            allowTypedFunctionExpressions: true,
            allowHigherOrderFunctions: true,
            allowDirectConstAssertionInArrowFunctions: true,
          },
        ],
        '@typescript-eslint/consistent-type-assertions': ['error', { assertionStyle: 'never' }],
        '@typescript-eslint/no-non-null-assertion': 'warn',
        '@typescript-eslint/prefer-nullish-coalescing': 'error',
        '@typescript-eslint/prefer-optional-chain': 'error',
        '@typescript-eslint/naming-convention': [
          'error',
          { selector: 'default', format: ['camelCase'], leadingUnderscore: 'allow' },
          {
            selector: 'variable',
            format: ['camelCase', 'UPPER_CASE', 'PascalCase'],
            leadingUnderscore: 'allow',
          },
          { selector: 'function', format: ['camelCase', 'PascalCase'] },
          { selector: 'typeLike', format: ['PascalCase'] },
          { selector: 'enumMember', format: ['UPPER_CASE'] },
          { selector: 'property', format: null },
          { selector: 'import', format: null },
        ],
      },
    },

    // Import sorting
    {
      plugins: { 'simple-import-sort': simpleImportSort },
      rules: {
        'simple-import-sort/imports': 'error',
        'simple-import-sort/exports': 'error',
      },
    },

    // General code quality
    {
      rules: {
        'no-await-in-loop': 'warn',
        'no-console': ['warn', { allow: ['warn', 'error'] }],
        'no-debugger': 'error',
        eqeqeq: ['error', 'always'],
        curly: ['error', 'all'],
        'no-var': 'error',
        'prefer-const': 'error',
        'func-style': ['error', 'expression'],
        'prefer-arrow-callback': 'error',
        'no-implicit-coercion': 'error',
        'no-param-reassign': ['error', { props: true }],
      },
    },

    // Require justification on all eslint-disable comments
    eslintComments.recommended,
    {
      rules: {
        '@eslint-community/eslint-comments/require-description': 'error',
      },
    },

    // Prevent source files from importing test files
    {
      files: ['**/*.ts', '**/*.tsx'],
      ignores: ['**/*.test.ts', '**/*.test.tsx', '**/*.spec.ts', '**/*.spec.tsx'],
      rules: {
        'no-restricted-imports': [
          'error',
          {
            patterns: [
              {
                group: ['*.test', '*.spec', '*.test.*', '*.spec.*', '@kevisdev/testing-hono'],
                message: 'Production code must not import from test files.',
              },
            ],
          },
        ],
      },
    },

    // Relax strict rules in test files
    {
      files: ['**/*.test.ts', '**/*.test.tsx', '**/*.spec.ts', '**/*.spec.tsx'],
      rules: {
        '@typescript-eslint/consistent-type-assertions': ['error', { assertionStyle: 'as' }],
      },
    },

    {
      files: ['**/*.ts'],
      rules: {
        'no-await-in-loop': 'error',
        'no-restricted-syntax': [
          'error',
          {
            selector: 'NewExpression[callee.name="Response"]',
            message: 'Use c.json() or c.text() instead of new Response()',
          },
        ],
      },
    },

    // Server import sorting
    {
      rules: {
        'simple-import-sort/imports': [
          'error',
          {
            groups: [
              ['^hono', '^@hono'],
              ['^@trpc', '^drizzle', '^zod'],
              ['^'],
              ['^@kevisdev/'],
              ['^@/'],
              ['^\\.'],
            ],
          },
        ],
      },
    },

    // Prettier (must be last)
    prettierConfig,
  );
