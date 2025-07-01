const path = require('path');
const { getDefaultConfig, mergeConfig } = require('@react-native/metro-config');

const topNodeModules = path.resolve(__dirname, '../../node_modules');
// const jazzPackages = path.resolve(__dirname, '../../../../jazz/packages');
const yalcNodeModules = path.resolve(__dirname, '.yalc');

/**
 * Metro configuration
 * https://reactnative.dev/docs/metro
 *
 * @type {import('@react-native/metro-config').MetroConfig}
 */
const config = {
  resolver: {
    nodeModulesPaths: [
      'node_modules',
      topNodeModules,
      // jazzPackages,
      yalcNodeModules,
    ],
    unstable_enablePackageExports: true,
    extensions: ['.js', '.ts', '.jsx', '.tsx', '.mjs', '.cjs'],
  },
  watchFolders: [
    topNodeModules,
    // jazzPackages,
    yalcNodeModules,
  ],
};

module.exports = mergeConfig(getDefaultConfig(__dirname), config);
