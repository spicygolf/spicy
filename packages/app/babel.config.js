module.exports = {
  presets: ['module:@react-native/babel-preset'],
  plugins: [
    ['@babel/plugin-transform-class-static-block'],
    ['react-native-unistyles/plugin'],
    ['module-resolver', {
      alias: {
        app: './src/app',
        components: './src/components',
        hooks: './src/hooks',
        navigators: './src/navigators',
        providers: './src/providers',
        schema: './src/schema',
        screens: './src/screens',
        utils: './src/utils',
      },
    }],
  ],
};
