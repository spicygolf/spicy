module.exports = {
  presets: ['module:@react-native/babel-preset'],
  plugins: [
    ['@babel/plugin-transform-class-static-block'],
    ['@babel/plugin-transform-export-namespace-from'],
    ['module:react-native-dotenv'],
    ['react-native-unistyles/plugin', {
      root: 'src',
    }],
    [
      'module-resolver',
      {
        alias: {
          '@': './src',
        },
      },
    ],
  ],
};
