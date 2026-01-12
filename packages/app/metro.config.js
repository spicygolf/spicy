const fs = require("node:fs");
const path = require("node:path");
const { getDefaultConfig, mergeConfig } = require("@react-native/metro-config");

const topNodeModules = path.resolve(__dirname, "../../node_modules");
const spicyPackages = path.resolve(__dirname, "../../packages");
const jazzPackages = path.resolve(__dirname, "../../../jazz/packages");

// Only include jazz packages path if it exists (local development with linked Jazz)
const jazzPackagesExists = fs.existsSync(jazzPackages);

/**
 * Metro configuration
 * https://reactnative.dev/docs/metro
 *
 * @type {import('@react-native/metro-config').MetroConfig}
 */
const config = {
  resolver: {
    nodeModulesPaths: [
      "node_modules",
      topNodeModules,
      spicyPackages,
      ...(jazzPackagesExists ? [jazzPackages] : []),
    ],
    unstable_enablePackageExports: true,
    extensions: [".js", ".ts", ".jsx", ".tsx", ".mjs", ".cjs"],
  },
  watchFolders: [
    topNodeModules,
    spicyPackages,
    ...(jazzPackagesExists ? [jazzPackages] : []),
  ],
};

module.exports = mergeConfig(getDefaultConfig(__dirname), config);
