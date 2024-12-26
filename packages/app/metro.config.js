const {getDefaultConfig, mergeConfig} = require('@react-native/metro-config');
const path = require('path');

const topNodeModules = path.resolve(__dirname, '../../node_modules');
const jazzPackages = path.resolve(__dirname, '../../../../jazz/packages');

/**
 * Metro configuration
 * https://reactnative.dev/docs/metro
 *
 * @type {import('metro-config').MetroConfig}
 */
const config = {
  resolver: {
    nodeModulesPaths: [
      'node_modules',
      topNodeModules,
      jazzPackages,
    ],
    unstable_enablePackageExports: true,
  },
  watchFolders: [
    topNodeModules,
    jazzPackages,
  ],
};

module.exports = mergeConfig(getDefaultConfig(__dirname), config);
