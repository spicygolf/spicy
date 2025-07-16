/** @type {import('eslint').Linter.Config} */
module.exports = {
  ignorePatterns: ['metro.config.js', '.eslintrc.js'],
  root: true,
  plugins: [
    'import',
    'prettier',
    '@hesamse/recommended',
    'react',
    '@react-native',
  ],
  extends: ['@react-native', 'plugin:prettier/recommended'],
  rules: {
    'no-alert': 'off',
    'react/no-unstable-nested-components': ['error', { allowAsProps: true }],
    '@typescript-eslint/no-shadow': 'error',
    'import/order': [
      'error',
      {
        'newlines-between': 'never',
        alphabetize: { order: 'asc', caseInsensitive: true },
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
          {
            group: ['react-native'],
            importNames: ['TextInput', 'Text'],
            message: 'Please use "@/ui" instead of "react-native"',
          },
        ],
      },
    ],
    '@hesamse/recommended/no-tsx-without-jsx': 'error',
    'react-native/no-unused-styles': 'error',
    'import/no-default-export': 'error',
    '@typescript-eslint/no-explicit-any': 'error',
    '@typescript-eslint/consistent-type-imports': 'error',
  },
  overrides: [],
};
