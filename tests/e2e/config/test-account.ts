/**
 * Test account configuration for E2E tests.
 *
 * IMPORTANT: The passphrase should be set via environment variable, not hardcoded.
 * - Local: export TEST_PASSPHRASE="your 24-word passphrase"
 * - CI: Set E2E_TEST_PASSPHRASE secret in GitHub
 *
 * To generate a new 24-word passphrase:
 *   bun -e "import { generateMnemonic } from '@scure/bip39'; import { wordlist } from '@scure/bip39/wordlists/english.js'; console.log(generateMnemonic(wordlist, 256));"
 */

/**
 * Display name for the test user
 */
export const TEST_DISPLAY_NAME = "E2E Test User";

/**
 * Test player data for multi-player scenarios
 */
export const TEST_PLAYERS = {
  alice: {
    name: "Alice",
    handicapIndex: 10.5,
  },
  bob: {
    name: "Bob",
    handicapIndex: 15.2,
  },
  carol: {
    name: "Carol",
    handicapIndex: 8.0,
  },
  dave: {
    name: "Dave",
    handicapIndex: 12.3,
  },
};
