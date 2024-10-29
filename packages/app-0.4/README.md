# Spicy Golf Mobile App

## Development

### Run

    pnpm install
    pnpm pods
    pnpm start

### Notes

* Added the following dependencies for auto-linking.  They are required by `@fireproof/react-native`
   * `react-native-fast-encoder`
   * `react-native-quick-crypto`
   * `react-native-mmkv`
* Installed polyfills for `@fireproof/react-native` in `index.js`