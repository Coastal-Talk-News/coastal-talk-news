import babelParser from '@babel/eslint-parser';
import js from '@eslint/js';
import eslintConfigPrettier from 'eslint-config-prettier';
import turboPlugin from 'eslint-plugin-turbo';
import onlyWarn from 'eslint-plugin-only-warn';

/**
 * Parses with Babel, not typescript-eslint, which does not support the
 * TypeScript 7 this repo is on. Type errors are caught by check-types, not lint.
 *
 * @type {import("eslint").Linter.Config[]}
 * */
export const config = [
  js.configs.recommended,
  eslintConfigPrettier,
  {
    languageOptions: {
      parser: babelParser,
      parserOptions: {
        requireConfigFile: false,
        babelOptions: {
          presets: ['@babel/preset-typescript'],
        },
      },
    },
    plugins: {
      turbo: turboPlugin,
    },
    rules: {
      'turbo/no-undeclared-env-vars': 'warn',
    },
  },
  {
    // only-warn downgrades every rule to a warning; --max-warnings 0 in each
    // lint script is what still makes them fail.
    plugins: {
      onlyWarn,
    },
  },
  {
    ignores: ['dist/**', 'node_modules/**'],
  },
];
