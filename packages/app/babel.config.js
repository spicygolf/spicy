module.exports = {
  presets: ['module:@react-native/babel-preset'],
  plugins: [
    ['@babel/plugin-transform-class-static-block'],
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
