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
    "squeeze sight slam draft melody left online arrow include toddler rate rookie certain remember pond duck dream immune there release laptop collect surface attend",

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
