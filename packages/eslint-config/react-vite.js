import pluginReactHooks from 'eslint-plugin-react-hooks';
import pluginReactRefresh from 'eslint-plugin-react-refresh';
import globals from 'globals';
import { config as baseConfig } from './base.js';

/** @type {import("eslint").Linter.Config[]} */
export const reactViteConfig = [
  ...baseConfig,
  {
    languageOptions: {
      globals: globals.browser,
    },
  },
  pluginReactHooks.configs.flat.recommended,
  pluginReactRefresh.configs.vite,
];
