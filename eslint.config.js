import js from '@eslint/js';
import prettier from 'eslint-config-prettier';
import reactHooks from 'eslint-plugin-react-hooks';
import reactRefresh from 'eslint-plugin-react-refresh';
import { defineConfig, globalIgnores } from 'eslint/config';
import globals from 'globals';
import tseslint from 'typescript-eslint';

/**
 * Fronteiras da arquitetura (app → features → shared):
 *  - uma feature só é acessada pelo index.ts dela (@/features/<nome>), nunca por arquivos internos;
 *  - features e shared não importam de app;
 *  - shared não importa de features.
 * Dentro da própria feature, use imports relativos.
 */
const deepFeatureImport = {
  group: ['@/features/*/*'],
  message: 'Importe a feature pelo index.ts (@/features/<nome>). Arquivos internos são privados.',
};
const noApp = {
  group: ['@/app', '@/app/*'],
  message: 'features/ e shared/ não podem depender de app/.',
};
const noFeatures = {
  group: ['@/features', '@/features/*'],
  message: 'shared/ não pode depender de features/.',
};

export default defineConfig([
  globalIgnores(['dist', 'coverage', 'public/mockServiceWorker.js']),
  {
    files: ['**/*.{ts,tsx}'],
    extends: [
      js.configs.recommended,
      tseslint.configs.recommended,
      reactHooks.configs.flat.recommended,
      reactRefresh.configs.vite,
    ],
    languageOptions: {
      ecmaVersion: 2022,
      globals: globals.browser,
    },
    rules: {
      '@typescript-eslint/consistent-type-imports': 'error',
      'no-restricted-imports': ['error', { patterns: [deepFeatureImport] }],
    },
  },
  {
    files: ['src/features/**/*.{ts,tsx}'],
    rules: {
      'no-restricted-imports': ['error', { patterns: [deepFeatureImport, noApp] }],
    },
  },
  {
    files: ['src/shared/**/*.{ts,tsx}'],
    rules: {
      'no-restricted-imports': ['error', { patterns: [deepFeatureImport, noApp, noFeatures] }],
    },
  },
  {
    files: ['**/*.config.{js,ts}'],
    languageOptions: { globals: globals.node },
  },
  prettier,
]);
