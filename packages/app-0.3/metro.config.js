const { getDefaultConfig, mergeConfig } = require("@react-native/metro-config");
// const path = require('path')

// const topNodeModules = path.resolve(__dirname, '../../node_modules')

/**
 * Metro configuration
 * https://reactnative.dev/docs/metro
 *
 * @type {import('metro-config').MetroConfig}
 */
const config = {
  // watchFolders: [topNodeModules],
  // resolver: {
  //   nodeModulesPaths: [
  //     'node_modules',
  //     topNodeModules,
  //   ],
  // },
};

module.exports = mergeConfig(getDefaultConfig(__dirname), config);
