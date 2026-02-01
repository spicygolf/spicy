/**
 * Fixture to Maestro YAML Converter
 *
 * Generates Maestro flow steps from test fixtures.
 * This enables a single fixture file to drive both unit tests and E2E tests.
 *
 * The converter generates flows that:
 * 1. Login to the test account
 * 2. Create a game with the specified spec
 * 3. Add players (simplified - uses "Add Me" + guests)
 * 4. Navigate through holes and enter scores
 * 5. Toggle junk and multipliers as specified
 * 6. Verify expected results
 */

import type {
  Fixture,
  FixtureHoleData,
  FixturePlayer,
} from "../../lib/fixture-types";

interface MaestroStep {
  [key: string]: unknown;
}

/**
 * E2E-specific metadata that can be added to fixtures
 */
export interface E2EMetadata {
  /** Test priority for filtering */
  priority?: "smoke" | "core" | "edge";
  /** Tags for categorization */
  tags?: string[];
  /** Platforms to skip */
  skipPlatforms?: ("ios" | "android")[];
  /** Estimated run time in seconds */
  estimatedTime?: number;
}

/**
 * Extended fixture type with E2E metadata
 */
export interface E2EFixture extends Fixture {
  e2e?: E2EMetadata;
}

/**
 * Result of flow generation
 */
export interface GeneratedFlow {
  /** Main flow YAML content */
  yaml: string;
  /** Metadata about the generated flow */
  meta: {
    holeCount: number;
    playerCount: number;
    hasJunk: boolean;
    hasMultipliers: boolean;
  };
}

/**
 * Generate login steps for the test account.
 * Uses ${TEST_PASSPHRASE} env var which must be set externally.
 */
export function generateLoginSteps(): MaestroStep[] {
  return [
    { launchApp: { clearState: true } },
    {
      waitForAnimationToEnd: {
        timeout: 10000,
      },
    },
    {
      extendedWaitUntil: {
        visible: "Spicy Golf",
        timeout: 10000,
      },
    },
    {
      tapOn: {
        id: "login-button",
      },
    },
    {
      tapOn: {
        text: "(?i)Enter your passphrase",
      },
    },
    { inputText: "${TEST_PASSPHRASE}" },
    { hideKeyboard: true },
    {
      tapOn: {
        id: "login-submit-button",
      },
    },
    {
      extendedWaitUntil: {
        visible: "New Game",
        timeout: 15000,
      },
    },
  ];
}

/**
 * Generate steps to create a new game with a specific spec
 */
export function generateCreateGameSteps(specName: string): MaestroStep[] {
  // Map spec names to their display names and testIDs
  const specMap: Record<string, { displayName: string; testId: string }> = {
    five_points: { displayName: "Five Points", testId: "spec-five-points" },
    nassau: { displayName: "Nassau", testId: "spec-nassau" },
    stroke_play: { displayName: "Stroke Play", testId: "spec-stroke-play" },
  };

  const spec = specMap[specName] ?? {
    displayName: specName,
    testId: `spec-${specName}`,
  };

  return [
    { tapOn: "New Game" },
    {
      waitForAnimationToEnd: {
        timeout: 3000,
      },
    },
    // Switch to Search tab to find spec
    {
      tapOn: {
        text: "Search",
      },
    },
    {
      waitForAnimationToEnd: {
        timeout: 3000,
      },
    },
    // Wait for specs to load from API
    {
      extendedWaitUntil: {
        visible: {
          id: spec.testId,
        },
        timeout: 10000,
      },
    },
    {
      tapOn: {
        id: spec.testId,
      },
    },
    // Wait for game settings screen
    {
      extendedWaitUntil: {
        visible: "Add Player",
        timeout: 10000,
      },
    },
  ];
}

/**
 * Generate steps to add players from a fixture.
 * Uses "Add Me" for the test account and "Add Guest" for others.
 */
export function generateAddPlayersSteps(fixture: Fixture): MaestroStep[] {
  const steps: MaestroStep[] = [];

  // Add the first player using "Add Me"
  steps.push(
    { tapOn: "Add Me" },
    {
      waitForAnimationToEnd: {
        timeout: 3000,
      },
    },
  );

  // For additional players, use "Add Guest" with their names
  for (let i = 1; i < fixture.players.length; i++) {
    const player = fixture.players[i];
    steps.push(
      { tapOn: "Add Player" },
      {
        waitForAnimationToEnd: {
          timeout: 2000,
        },
      },
      // Tap "Add Guest" option
      { tapOn: "Add Guest" },
      {
        waitForAnimationToEnd: {
          timeout: 2000,
        },
      },
      // Enter player name
      {
        tapOn: {
          text: "(?i)name",
        },
      },
      { inputText: player.name },
      { hideKeyboard: true },
      // Enter handicap if provided
      ...(player.handicapIndex > 0
        ? [
            {
              tapOn: {
                text: "(?i)handicap",
              },
            },
            { inputText: String(player.handicapIndex) },
            { hideKeyboard: true },
          ]
        : []),
      // Confirm/save the guest
      { tapOn: "Done" },
      {
        waitForAnimationToEnd: {
          timeout: 2000,
        },
      },
    );
  }

  return steps;
}

/**
 * Generate steps to start the game (navigate from settings to scoring)
 */
export function generateStartGameSteps(): MaestroStep[] {
  return [
    { tapOn: "Start Game" },
    {
      waitForAnimationToEnd: {
        timeout: 5000,
      },
    },
    // Wait for scoring view to load
    {
      extendedWaitUntil: {
        visible: "Hole 1",
        timeout: 10000,
      },
    },
  ];
}

/**
 * Generate steps to navigate to a specific hole
 */
export function generateNavigateToHoleSteps(holeNumber: number): MaestroStep[] {
  return [
    // Swipe left to go to next hole (or implement hole picker)
    // For now, we assume sequential navigation
    {
      runFlow: {
        when: {
          notVisible: {
            text: `Hole ${holeNumber}`,
          },
        },
        commands: [
          {
            swipe: {
              direction: "LEFT",
              duration: 300,
            },
          },
          {
            waitForAnimationToEnd: {
              timeout: 1000,
            },
          },
        ],
      },
    },
    {
      extendedWaitUntil: {
        visible: `Hole ${holeNumber}`,
        timeout: 5000,
      },
    },
  ];
}

/**
 * Generate steps to enter a score for a player.
 * Uses the +/- buttons to increment/decrement from the default (par + pops).
 *
 * @param playerId - The Jazz ID of the player
 * @param targetGross - The target gross score
 * @param par - The par for the hole
 * @param pops - The number of pops (handicap strokes) the player receives
 */
export function generateScoreEntrySteps(
  playerId: string,
  targetGross: number,
  par: number,
  pops: number,
): MaestroStep[] {
  const steps: MaestroStep[] = [];

  // The default starting score is par + pops (net par as gross)
  const defaultGross = par + pops;
  const diff = targetGross - defaultGross;

  if (diff === 0) {
    // Just tap the score to activate it at the default
    steps.push({
      tapOn: {
        id: `player-${playerId}-increment`,
      },
    });
  } else if (diff > 0) {
    // Increment diff times
    for (let i = 0; i < diff; i++) {
      steps.push({
        tapOn: {
          id: `player-${playerId}-increment`,
        },
      });
    }
  } else {
    // Decrement |diff| times
    for (let i = 0; i < Math.abs(diff); i++) {
      steps.push({
        tapOn: {
          id: `player-${playerId}-decrement`,
        },
      });
    }
  }

  return steps;
}

/**
 * Generate steps to toggle a junk option for a player
 */
export function generateJunkToggleSteps(
  junkName: string,
  playerId: string,
): MaestroStep[] {
  return [
    {
      tapOn: {
        id: `junk-${junkName}-${playerId}`,
      },
    },
  ];
}

/**
 * Generate steps to toggle a multiplier for a team
 */
export function generateMultiplierToggleSteps(
  multiplierName: string,
  teamId: string,
): MaestroStep[] {
  return [
    {
      tapOn: {
        id: `multiplier-${multiplierName}-${teamId}`,
      },
    },
  ];
}

/**
 * Generate steps to verify team points on the current hole
 */
export function generatePointsVerificationSteps(
  teamId: string,
  expectedPoints: number,
): MaestroStep[] {
  return [
    {
      assertVisible: {
        id: `team-${teamId}-points`,
        text: expectedPoints >= 0 ? `+${expectedPoints}` : `${expectedPoints}`,
      },
    },
  ];
}

/**
 * Generate all steps for scoring a single hole
 */
export function generateHoleScoringSteps(
  fixture: Fixture,
  holeNumber: string,
  holeData: FixtureHoleData,
): MaestroStep[] {
  const steps: MaestroStep[] = [];
  const holeNum = Number.parseInt(holeNumber, 10);

  // Navigate to this hole
  steps.push(...generateNavigateToHoleSteps(holeNum));

  // Get hole info from course
  const courseHole = fixture.course.holes.find((h) => h.hole === holeNum);
  const par = courseHole?.par ?? 4;

  // Enter scores for each player
  for (const [playerId, scoreData] of Object.entries(holeData.scores)) {
    const player = fixture.players.find((p) => p.id === playerId);
    if (!player || !scoreData) continue;

    // Calculate pops (simplified - assumes no pops for E2E tests)
    // In real tests, this would need course handicap calculation
    const pops = 0;

    steps.push(
      ...generateScoreEntrySteps(playerId, scoreData.gross, par, pops),
    );

    // Small delay between score entries
    steps.push({
      waitForAnimationToEnd: {
        timeout: 500,
      },
    });
  }

  // Toggle junk awards
  if (holeData.junk) {
    for (const [junkName, recipients] of Object.entries(holeData.junk)) {
      const playerIds = Array.isArray(recipients) ? recipients : [recipients];
      for (const playerId of playerIds) {
        steps.push(...generateJunkToggleSteps(junkName, playerId));
        steps.push({
          waitForAnimationToEnd: {
            timeout: 300,
          },
        });
      }
    }
  }

  // Activate multipliers
  if (holeData.multipliers) {
    for (const [teamId, multipliers] of Object.entries(holeData.multipliers)) {
      for (const multiplierName of multipliers) {
        steps.push(...generateMultiplierToggleSteps(multiplierName, teamId));
        steps.push({
          waitForAnimationToEnd: {
            timeout: 300,
          },
        });
      }
    }
  }

  // Take screenshot for debugging
  steps.push({
    takeScreenshot: `hole_${holeNumber}_complete`,
  });

  return steps;
}

/**
 * Generate steps to verify final results
 */
export function generateVerificationSteps(fixture: Fixture): MaestroStep[] {
  const steps: MaestroStep[] = [];

  // Navigate to leaderboard
  steps.push(
    { tapOn: "Leaderboard" },
    {
      waitForAnimationToEnd: {
        timeout: 3000,
      },
    },
  );

  // Take screenshot of final leaderboard
  steps.push({
    takeScreenshot: "final_leaderboard",
  });

  // Verify cumulative team scores if expected
  if (fixture.expected.cumulative?.teams) {
    for (const [teamId, teamData] of Object.entries(
      fixture.expected.cumulative.teams,
    )) {
      if (teamData.pointsTotal !== undefined) {
        steps.push({
          assertVisible: {
            text: String(teamData.pointsTotal),
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
export function generateFullFlow(fixture: E2EFixture): GeneratedFlow {
  const steps: MaestroStep[] = [];

  // Add comment header
  steps.push({
    // Maestro doesn't have comments, so we use takeScreenshot as a marker
    takeScreenshot: "test_start",
  });

  // 1. Login
  steps.push(...generateLoginSteps());

  // 2. Create game
  steps.push(...generateCreateGameSteps(fixture.spec));

  // 3. Add players
  steps.push(...generateAddPlayersSteps(fixture));

  // 4. Start game
  steps.push(...generateStartGameSteps());

  // 5. Score each hole
  const holeNumbers = Object.keys(fixture.holes).sort(
    (a, b) => Number.parseInt(a, 10) - Number.parseInt(b, 10),
  );
  for (const holeNum of holeNumbers) {
    const holeData = fixture.holes[holeNum];
    if (holeData) {
      steps.push(...generateHoleScoringSteps(fixture, holeNum, holeData));
    }
  }

  // 6. Verify final results
  steps.push(...generateVerificationSteps(fixture));

  // Determine metadata
  const hasJunk = Object.values(fixture.holes).some((h) => h.junk);
  const hasMultipliers = Object.values(fixture.holes).some(
    (h) => h.multipliers,
  );

  return {
    yaml: stepsToYaml(steps),
    meta: {
      holeCount: holeNumbers.length,
      playerCount: fixture.players.length,
      hasJunk,
      hasMultipliers,
    },
  };
}

/**
 * Convert steps to YAML format
 */
export function stepsToYaml(
  steps: MaestroStep[],
  appId = "golf.spicy",
): string {
  const lines: string[] = [];

  lines.push(`# Generated E2E test flow`);
  lines.push(`# Do not edit directly - regenerate from fixture`);
  lines.push(``);
  lines.push(`appId: ${appId}`);
  lines.push(`---`);
  lines.push(``);

  for (const step of steps) {
    const yaml = stepToYaml(step, 0);
    lines.push(yaml);
    lines.push(``);
  }

  return lines.join("\n");
}

/**
 * Convert a single step to YAML format
 */
function stepToYaml(step: MaestroStep, indent: number): string {
  const prefix = "  ".repeat(indent);
  const lines: string[] = [];

  for (const [key, value] of Object.entries(step)) {
    if (value === true) {
      // Boolean true - use short form
      lines.push(`${prefix}- ${key}`);
    } else if (typeof value === "string") {
      // Simple string value
      lines.push(`${prefix}- ${key}: "${value}"`);
    } else if (typeof value === "number") {
      lines.push(`${prefix}- ${key}: ${value}`);
    } else if (typeof value === "object" && value !== null) {
      // Object value - expand properties
      const obj = value as Record<string, unknown>;
      const entries = Object.entries(obj);

      if (entries.length === 0) {
        lines.push(`${prefix}- ${key}: {}`);
      } else {
        lines.push(`${prefix}- ${key}:`);
        for (const [subKey, subValue] of entries) {
          if (typeof subValue === "string") {
            lines.push(`${prefix}    ${subKey}: "${subValue}"`);
          } else if (typeof subValue === "number") {
            lines.push(`${prefix}    ${subKey}: ${subValue}`);
          } else if (typeof subValue === "boolean") {
            lines.push(`${prefix}    ${subKey}: ${subValue}`);
          } else if (Array.isArray(subValue)) {
            // Handle arrays (like commands in runFlow)
            lines.push(`${prefix}    ${subKey}:`);
            for (const item of subValue) {
              if (typeof item === "object" && item !== null) {
                const nestedYaml = stepToYaml(item as MaestroStep, indent + 3);
                lines.push(nestedYaml);
              }
            }
          } else if (typeof subValue === "object" && subValue !== null) {
            // Nested object
            lines.push(`${prefix}    ${subKey}:`);
            for (const [nestedKey, nestedValue] of Object.entries(
              subValue as Record<string, unknown>,
            )) {
              if (typeof nestedValue === "string") {
                lines.push(`${prefix}      ${nestedKey}: "${nestedValue}"`);
              } else if (typeof nestedValue === "number") {
                lines.push(`${prefix}      ${nestedKey}: ${nestedValue}`);
              } else if (typeof nestedValue === "boolean") {
                lines.push(`${prefix}      ${nestedKey}: ${nestedValue}`);
              }
            }
          }
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
    console.log(
      "Example: bun fixture-to-maestro.ts five_points/smoke/basic_game",
    );
    process.exit(1);
  }

  const fixturePath = args[0];
  const { loadFixture } = await import("../../lib/test-helpers");

  try {
    const fixture = loadFixture(`${fixturePath}.json`) as E2EFixture;
    const { yaml, meta } = generateFullFlow(fixture);

    console.log(yaml);
    console.error(
      `\nGenerated flow with ${meta.holeCount} holes, ${meta.playerCount} players`,
    );
    console.error(
      `Has junk: ${meta.hasJunk}, Has multipliers: ${meta.hasMultipliers}`,
    );
  } catch (error) {
    console.error("Error generating Maestro flow:", error);
    process.exit(1);
  }
}

// Run if called directly
if (import.meta.main) {
  main();
}
