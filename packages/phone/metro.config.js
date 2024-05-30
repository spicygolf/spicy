const path = require('path');
const {getDefaultConfig, mergeConfig} = require('@react-native/metro-config');

const d = __dirname;
const pnpmRoot = path.resolve(path.join(d, '..', '..'));
const fireproof = path.resolve(path.join(d, '..', '..', '..', '..', 'fireproof'));
const nodeModulesPath = [path.resolve(path.join(d, './node_modules'))];

/**
 * Metro configuration
 * https://reactnative.dev/docs/metro
 *
 * @type {import('metro-config').MetroConfig}
 */
const config = {
  resolver: {
    nodeModulesPath,
    unstable_enablePackageExports: true,
    unstable_enableSymlinks: true,
  },
  watchFolders: [pnpmRoot, fireproof],
};

module.exports = mergeConfig(getDefaultConfig(__dirname), config);
