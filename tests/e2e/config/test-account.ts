/**
 * Test account configuration for E2E tests.
 *
 * This account is used exclusively for automated testing in the dev Jazz environment.
 * Do NOT use this passphrase for any real accounts.
 */
export const TEST_ACCOUNT = {
  /**
   * BIP39-compatible passphrase for the test account.
   * This creates a deterministic account that can be reused across test runs.
   */
  passphrase:
    "test spicy golf maestro e2e account zebra quantum lunar frost crystal dawn",

  /**
   * Display name for the test user
   */
  displayName: "E2E Test User",
};

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
