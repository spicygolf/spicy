/** @type {import('eslint').Linter.Config} */
module.exports = {
  root: true,
  plugins: [
    'import',
    'prettier',
    '@hesamse/recommended',
    'react',
    'react-native',
  ],
  extends: [
    '@react-native',
    'plugin:prettier/recommended',
  ],
  rules: {
    'no-alert': 'off',
    'react/no-unstable-nested-components': ['error', {allowAsProps: true}],
    '@typescript-eslint/no-shadow': 'error',
    'import/order': [
      'error',
      {
        'newlines-between': 'never',
        alphabetize: {order: 'asc', caseInsensitive: true},
        pathGroups: [
          {
            pattern: 'react',
            group: 'external',
            position: 'before',
          },
          {
            pattern: 'react-native',
            group: 'external',
            position: 'before',
          },
          {
            pattern: '@/**',
            group: 'parent',
            position: 'before',
          },
        ],
        pathGroupsExcludedImportTypes: ['builtin'],
      },
    ],
    'no-restricted-imports': [
      'error',
      {
        patterns: [
          {
            group: ['../../*'],
            message:
              '\nImports from more than one level up are not allowed. \nTry importing using the @/* alias.',
          },
          {
            group: [
              'app/*',
              'components/*',
              'hooks/*',
              'navigators/*',
              'providers/*',
              'schema/*',
              'screens/*',
              'ui/*',
              'utils/*',
            ],
            message: 'Please use "@/*" alias instead.',
          },
        ],
      },
    ],
    '@hesamse/recommended/no-tsx-without-jsx': 'error',
    'react-native/no-unused-styles': 'error',
  },
  overrides: [],
};
