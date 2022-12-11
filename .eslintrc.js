module.exports = {
  root: true,
  extends: '@react-native-community',
  parser: '@babel/eslint-parser',
  parserOptions: {
    requireConfigFile: false,
  },
  plugins: ['@babel', 'react-hooks'],
  rules: {
    'react-hooks/exhaustive-deps': 'warn',
  },
};
