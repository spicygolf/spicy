module.exports = {
  presets: ['module:@react-native/babel-preset'],
  plugins: [
    ['module-resolver', {
      alias: {
        app: './src/app',
        common: './src/common',
        features: './src/features',
        hooks: './src/hooks',
      },
    }],
  ],
};
