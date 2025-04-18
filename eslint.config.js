import * as tseslint from '@typescript-eslint/eslint-plugin';
import parser from '@typescript-eslint/parser';
import eslintPluginImport from 'eslint-plugin-import';
import eslintPluginNode from 'eslint-plugin-n';
import eslintPluginPromise from 'eslint-plugin-promise';
import eslintPluginJsdoc from 'eslint-plugin-jsdoc';

export default [
  {
    ignores: ['node_modules', 'dist', 'coverage'],
  },
  {
    files: ['**/*.ts'],
    languageOptions: {
      parser,
      parserOptions: {
        project: ['./tsconfig.json'],
        ecmaVersion: 'latest',
        sourceType: 'module',
      },
    },
    plugins: {
      '@typescript-eslint': tseslint,
      import: eslintPluginImport,
      promise: eslintPluginPromise,
      jsdoc: eslintPluginJsdoc,
      node: eslintPluginNode,
    },
    rules: {
      'no-console': 'warn',
      'no-unused-vars': 'warn',
      'import/order': ['warn', { alphabetize: { order: 'asc' } }],
      '@typescript-eslint/no-floating-promises': 'warn',
    },
  },
];
