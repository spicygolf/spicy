import { isMockingEnabled, listAvailableMocks } from "./mock";

/**
 * Utility functions for working with the GHIN mock system
 */

/**
 * Enable mocking by setting the environment variable
 */
export function enableMocking(): void {
  process.env.GHIN_USE_MOCKS = "true";
  console.log("✅ GHIN mocking enabled");
}

/**
 * Disable mocking by unsetting the environment variable
 */
export function disableMocking(): void {
  delete process.env.GHIN_USE_MOCKS;
  console.log("❌ GHIN mocking disabled");
}

/**
 * Check current mocking status and list available mock files
 */
export function mockStatus(): void {
  const enabled = isMockingEnabled();
  const mocks = listAvailableMocks();

  console.log(`🔍 GHIN Mock Status: ${enabled ? "ENABLED" : "DISABLED"}`);
  console.log(`📁 Available mock files (${mocks.length}):`);

  if (mocks.length === 0) {
    console.log("   No mock files found");
  } else {
    mocks.forEach((file) => {
      console.log(`   - ${file}`);
    });
  }

  if (!enabled) {
    console.log(
      "\n💡 To enable mocking, set GHIN_USE_MOCKS=true or call enableMocking()",
    );
  }
}

/**
 * Generate mock file name suggestions based on common patterns
 */
export function suggestMockFiles(): void {
  console.log("📝 Mock File Naming Patterns:");
  console.log("");
  console.log("Player Search:");
  console.log("  - golfers_search.json (default/fallback)");
  console.log("  - golfers_search_last_name-Smith.json (specific last name)");
  console.log("  - golfers_search_golfer_id-1234567.json (specific GHIN ID)");
  console.log("");
  console.log("Course Search:");
  console.log("  - courses_search.json (default/fallback)");
  console.log("  - courses_search_name-Pebble.json (specific course name)");
  console.log("  - courses_search_state-CA.json (specific state)");
  console.log("");
  console.log("Get Course:");
  console.log("  - courses_12345.json (specific course ID)");
  console.log("");
  console.log("Get Tee:");
  console.log("  - tees_101.json (specific tee ID)");
  console.log("");
  console.log("Countries & States:");
  console.log("  - countries_and_states.json");
  console.log("");
  console.log(
    "💡 Parameters are sorted alphabetically and joined with underscores",
  );
  console.log("💡 Special characters are removed from parameter values");
}
