/* eslint-env node */

require('@uniswap/eslint-config/load')

module.exports = {
  extends: '@uniswap/eslint-config/react',
  rules: {
    'simple-import-sort/imports': ['off'],
    'import/no-unused-modules': ['off'],
    'import/order': [
      'warn',
      {
        alphabetize: {
          caseInsensitive: true,
          order: 'asc',
        },
        groups: ['builtin', 'external', 'internal', 'parent', 'sibling', 'index'], // default: "builtin", "external", "parent", "sibling", "index"
        pathGroups: [
          {
            group: 'external',
            pattern: 'react*{,/**}',
            position: 'before',
          },
          {
            group: 'external',
            pattern: '@readyio/*{,/**}',
            position: 'after',
          },
          {
            group: 'external',
            pattern: '@uniswap/**',
            position: 'after',
          },
          {
            pattern: '**/*.scss',
            group: 'object',
            position: 'after',
          },
        ],
        pathGroupsExcludedImportTypes: [],
        // 'newlines-between': 'always',
        // warnOnUnassignedImports: true,
      },
    ],
    'unused-imports/no-unused-imports': 'error',
  },
}
