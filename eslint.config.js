import path from 'node:path';

import configBase from '@marcalexiei/eslint-config/base';
import configTS from '@marcalexiei/eslint-config/typescript';
import configVitest from '@marcalexiei/eslint-config/vitest';
import { defineConfig, includeIgnoreFile } from 'eslint/config';
import {
  createTypeScriptImportResolver,
  defaultConditionNames,
} from 'eslint-import-resolver-typescript';
import pluginEslintPlugin from 'eslint-plugin-eslint-plugin';
import pluginEslintNode from 'eslint-plugin-n';

export default defineConfig(
  includeIgnoreFile([path.resolve('.gitignore')]),
  {
    ...configBase,
    rules: {
      ...configBase.rules,
      'no-continue': 'off',
    },
  },
  {
    ...configTS,
    rules: {
      ...configTS.rules,
      '@typescript-eslint/naming-convention': [
        ...configTS.rules['@typescript-eslint/naming-convention'],
        // for rules listeners
        {
          selector: ['objectLiteralProperty', 'objectLiteralMethod'],
          format: ['camelCase', 'PascalCase'],
        },
        // path-like keys in config files (e.g. knip workspaces)
        {
          selector: 'objectLiteralProperty',
          modifiers: ['requiresQuotes'],
          format: null,
        },
      ],
    },
  },
  {
    // The root of `@typescript-eslint/utils` and its `ts-eslint` entry load `eslint` at import time,
    // which is only an optional peer: runtime code goes through the entry points that do not.
    files: ['packages/utils/src/**/*.ts', 'plugins/*/src/**/*.ts'],
    ignores: ['**/*.spec.ts'],
    rules: {
      '@typescript-eslint/no-restricted-imports': [
        'error',
        {
          paths: [
            {
              name: '@typescript-eslint/utils',
              allowTypeImports: true,
              message:
                'Import values from `@typescript-eslint/types`, `@typescript-eslint/scope-manager`, `@typescript-eslint/utils/ast-utils` or `@typescript-eslint/utils/eslint-utils`.',
            },
            {
              name: '@typescript-eslint/utils/ts-eslint',
              allowTypeImports: true,
              message: 'This entry loads `eslint`: import types only.',
            },
            {
              name: 'eslint',
              allowTypeImports: true,
              message: '`eslint` is an optional peer: import types only.',
            },
          ],
        },
      ],
    },
  },
  configVitest,
  {
    ...pluginEslintPlugin.configs.recommended,
    rules: {
      ...pluginEslintPlugin.configs.recommended.rules,
      // handled by typescript-eslint ESLintUtils.`RuleCreator`
      'eslint-plugin/require-meta-default-options': 'off',
    },
  },
  {
    ...pluginEslintNode.configs['flat/recommended-module'],
    rules: {
      ...pluginEslintNode.configs['flat/recommended-module'].rules,
      'n/no-missing-import': 'off', // import plugin already handles this
    },
  },
  {
    languageOptions: {
      parserOptions: {
        project: [
          './tsconfig.eslint.json',
          './plugins/*/tsconfig.eslint.json',
          './packages/*/tsconfig.eslint.json',
        ],
      },
    },
    settings: {
      'import-x/resolver-next': [
        createTypeScriptImportResolver({
          conditionNames: ['@eslint-zod/source', ...defaultConditionNames],
        }),
      ],
    },
    rules: {
      'import-x/no-extraneous-dependencies': [
        'error',
        {
          packageDir: [
            '.',
            './plugins/eslint-plugin-zod',
            './plugins/eslint-plugin-zod-mini',
            './plugins/eslint-plugin-zod-core',
            './packages/tooling',
            './packages/utils',
          ],
        },
      ],
    },
  },
);
