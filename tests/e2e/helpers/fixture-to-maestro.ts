/**
 * Fixture to Maestro YAML Converter
 *
 * Generates Maestro flow steps from test fixtures.
 * This enables a single fixture file to drive both unit tests and E2E tests.
 */

import type { Fixture } from "../../lib/fixture-types";

interface MaestroStep {
  [key: string]: unknown;
}

/**
 * Generate login steps for the test account.
 * Uses ${TEST_PASSPHRASE} env var which must be set externally.
 */
export function generateLoginSteps(): MaestroStep[] {
  return [
    { launchApp: { clearState: true } },
    { assertVisible: "Spicy Golf" },
    { tapOn: "Log In" },
    { tapOn: { text: "Enter your passphrase" } },
    { inputText: "${TEST_PASSPHRASE}" },
    { tapOn: { text: "Log In", index: 1 } },
    { assertVisible: "New Game" },
  ];
}

/**
 * Generate steps to create a new game with a specific spec
 */
export function generateCreateGameSteps(specName: string): MaestroStep[] {
  return [
    { tapOn: "New Game" },
    { tapOn: "Search" },
    { assertVisible: specName },
    { tapOn: specName },
  ];
}

/**
 * Generate steps to add players from a fixture
 *
 * Note: This uses "Add Me" for the first player (the logged-in test account)
 * and GHIN search for additional players (requires real GHIN data).
 * For fully isolated tests, you may want to mock the GHIN API.
 */
export function generateAddPlayerSteps(
  fixture: Fixture,
  playerIndex: number,
): MaestroStep[] {
  const player = fixture.players[playerIndex];
  if (!player) return [];

  // For the first player, use "Add Me" if available
  if (playerIndex === 0) {
    return [
      { tapOn: "Add Me" },
      // After adding, we may need to select a course
      // This depends on the game state
    ];
  }

  // For other players, use GHIN search
  // Note: This requires the player to exist in GHIN
  return [
    { tapOn: "Add Player" },
    { tapOn: "Search" },
    // Enter last name
    { tapOn: { text: "Last Name" } },
    { inputText: player.name.split(" ").pop() || player.name },
    // Wait for results and tap the player
    // This is fragile - better to use testIDs
  ];
}

/**
 * Generate steps to enter scores for a hole
 */
export function generateScoreEntrySteps(
  fixture: Fixture,
  holeNumber: string,
): MaestroStep[] {
  const holeData = fixture.holes[holeNumber];
  if (!holeData) return [];

  const steps: MaestroStep[] = [];

  // Navigate to the hole if not already there
  // (Maestro can swipe or tap navigation)

  // Enter scores for each player
  for (const [playerId, scoreData] of Object.entries(holeData.scores)) {
    const player = fixture.players.find((p) => p.id === playerId);
    if (!player || !scoreData) continue;

    // Tap on the player's score input
    steps.push({ tapOn: player.name });

    // Enter the gross score
    // The ScoreInput component uses +/- buttons or direct input
    // For simplicity, we'll tap the score area and use the + button
    const targetScore = scoreData.gross;

    // This assumes the score starts at par and we increment/decrement
    // A more robust approach would read the current score first
    steps.push({
      runScript: {
        // Placeholder for score entry logic
        // In practice, you'd tap +/- buttons the right number of times
        comment: `Set ${player.name}'s score to ${targetScore}`,
      },
    });
  }

  return steps;
}

/**
 * Generate steps to verify expected results on the leaderboard
 */
export function generateLeaderboardVerificationSteps(
  fixture: Fixture,
): MaestroStep[] {
  const steps: MaestroStep[] = [];

  // Navigate to leaderboard
  steps.push({ tapOn: "Leaderboard" });

  // Verify team scores if teams exist
  if (fixture.expected.cumulative?.teams) {
    for (const [_teamId, teamData] of Object.entries(
      fixture.expected.cumulative.teams,
    )) {
      if (teamData.pointsTotal !== undefined) {
        // Look for the team's score on the leaderboard
        // The exact format depends on the UI
        steps.push({
          assertVisible: {
            text: `${teamData.pointsTotal}`,
            optional: true,
          },
        });
      }
    }
  }

  return steps;
}

/**
 * Generate a complete Maestro flow from a fixture
 */
export function generateFullFlow(fixture: Fixture): MaestroStep[] {
  const steps: MaestroStep[] = [];

  // Login
  steps.push(...generateLoginSteps());

  // Create game
  steps.push(...generateCreateGameSteps(fixture.spec));

  // Note: Full player setup and scoring automation is complex because:
  // 1. Players need courses/tees selected
  // 2. Score entry UI uses +/- buttons
  // 3. Team assignment may be needed
  //
  // For comprehensive E2E tests, consider:
  // - Adding testIDs to key UI elements
  // - Creating a "test mode" that pre-populates game data
  // - Using Maestro's JavaScript scripting for complex logic

  return steps;
}

/**
 * Convert steps to YAML format
 */
export function stepsToYaml(
  steps: MaestroStep[],
  appId = "golf.spicy",
): string {
  const lines: string[] = [];

  lines.push(`appId: ${appId}`);
  lines.push("---");
  lines.push("");

  for (const step of steps) {
    const yaml = stepToYaml(step, 0);
    lines.push(yaml);
  }

  return lines.join("\n");
}

function stepToYaml(step: MaestroStep, indent: number): string {
  const prefix = "  ".repeat(indent);
  const lines: string[] = [];

  for (const [key, value] of Object.entries(step)) {
    if (typeof value === "string") {
      lines.push(`${prefix}- ${key}: "${value}"`);
    } else if (typeof value === "object" && value !== null) {
      lines.push(`${prefix}- ${key}:`);
      for (const [subKey, subValue] of Object.entries(
        value as Record<string, unknown>,
      )) {
        if (typeof subValue === "string") {
          lines.push(`${prefix}    ${subKey}: "${subValue}"`);
        } else if (typeof subValue === "number") {
          lines.push(`${prefix}    ${subKey}: ${subValue}`);
        } else if (typeof subValue === "boolean") {
          lines.push(`${prefix}    ${subKey}: ${subValue}`);
        }
      }
    }
  }

  return lines.join("\n");
}

/**
 * CLI entry point for generating Maestro flows from fixtures
 */
export async function main() {
  const args = process.argv.slice(2);
  if (args.length < 1) {
    console.log("Usage: bun fixture-to-maestro.ts <fixture-path>");
    console.log("Example: bun fixture-to-maestro.ts five_points/basic_game");
    process.exit(1);
  }

  const fixturePath = args[0];
  const { loadFixture } = await import("../../lib/test-helpers");

  try {
    const fixture = loadFixture(`${fixturePath}.json`);
    const steps = generateFullFlow(fixture);
    const yaml = stepsToYaml(steps);

    console.log(yaml);
  } catch (error) {
    console.error("Error generating Maestro flow:", error);
    process.exit(1);
  }
}

// Run if called directly
if (import.meta.main) {
  main();
}
