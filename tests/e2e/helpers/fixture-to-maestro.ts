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
 *
 * Supports two output modes:
 * - Single file (legacy): All steps in one YAML file
 * - Sub-flows (new): Separate YAML files for login, new_game, add_players, holes, etc.
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
 * Result of flow generation (single file mode)
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
 * Result of sub-flow generation (multi-file mode)
 */
export interface GeneratedSubFlows {
  /** Main orchestration flow */
  main: string;
  /** Login sub-flow */
  login: string;
  /** New game sub-flow */
  newGame: string;
  /** Add players sub-flow */
  addPlayers: string;
  /** Start game sub-flow */
  startGame: string;
  /** Individual hole sub-flows, keyed by hole number (e.g., "01", "02") */
  holes: Record<string, string>;
  /** Leaderboard sub-flow */
  leaderboard: string;
  /** Metadata about the generated flows */
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
 * Generate steps to clean up any existing games.
 * Should be run after login to ensure a clean state.
 */
export function generateCleanupSteps(): MaestroStep[] {
  return [
    { takeScreenshot: "cleanup_before" },
    {
      repeat: {
        times: 10,
        commands: [
          {
            runFlow: {
              when: {
                visible: {
                  id: "game-list-item",
                },
              },
              commands: [
                {
                  tapOn: {
                    id: "game-list-item",
                    index: 0,
                  },
                },
                {
                  waitForAnimationToEnd: {
                    timeout: 5000,
                  },
                },
                { tapOn: "Settings" },
                {
                  waitForAnimationToEnd: {
                    timeout: 3000,
                  },
                },
                {
                  scrollUntilVisible: {
                    element: {
                      text: "Delete Game",
                    },
                    direction: "DOWN",
                    timeout: 5000,
                  },
                },
                { tapOn: "Delete Game" },
                {
                  extendedWaitUntil: {
                    visible: "Delete",
                    timeout: 3000,
                  },
                },
                {
                  tapOn: {
                    text: "Delete",
                    index: 1,
                  },
                },
                {
                  extendedWaitUntil: {
                    visible: "New Game",
                    timeout: 5000,
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
        ],
      },
    },
    { takeScreenshot: "cleanup_after" },
  ];
}

/**
 * Generate steps to add players from a fixture.
 * The logged-in player is added automatically, so we only add guests.
 */
export function generateAddPlayersSteps(fixture: Fixture): MaestroStep[] {
  const steps: MaestroStep[] = [];

  // Logged-in player is added automatically, so start from index 1
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
    // Score matches default (par + pops) - tap the score to confirm it
    steps.push({
      tapOn: {
        id: `player-${playerId}-score`,
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

    const scoreSteps = generateScoreEntrySteps(
      playerId,
      scoreData.gross,
      par,
      pops,
    );
    steps.push(...scoreSteps);

    // Small delay between score entries (only if we actually tapped something)
    if (scoreSteps.length > 0) {
      steps.push({
        waitForAnimationToEnd: {
          timeout: 500,
        },
      });
    }
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
export function generateLeaderboardSteps(fixture: Fixture): MaestroStep[] {
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

  return steps;
}

/**
 * Generate sub-flows from a fixture (multi-file mode)
 */
export function generateSubFlows(fixture: E2EFixture): GeneratedSubFlows {
  const holeNumbers = Object.keys(fixture.holes).sort(
    (a, b) => Number.parseInt(a, 10) - Number.parseInt(b, 10),
  );

  // Generate individual hole flows
  const holes: Record<string, string> = {};
  for (const holeNum of holeNumbers) {
    const holeData = fixture.holes[holeNum];
    if (holeData) {
      const paddedNum = holeNum.padStart(2, "0");
      const steps = generateHoleScoringSteps(fixture, holeNum, holeData);
      const comment = getHoleComment(fixture, holeNum, holeData);
      holes[paddedNum] = stepsToYaml(steps, "golf.spicy", comment);
    }
  }

  // Generate main orchestration flow
  const mainLines: string[] = [
    `# ${fixture.name}`,
    `# Main orchestration flow that runs sub-flows`,
    `#`,
    `# Generated from fixture - do not edit directly`,
    ``,
    `appId: golf.spicy`,
    `---`,
    ``,
    `- takeScreenshot: "test_start"`,
    ``,
    `- launchApp:`,
    `    clearState: true`,
    ``,
    `# Login`,
    `- runFlow: "login.yaml"`,
    ``,
    `# Clean up any existing games`,
    `- runFlow: "../../shared/cleanup.yaml"`,
    ``,
    `# Create new game`,
    `- runFlow: "new_game.yaml"`,
    ``,
    `# Add guest players (logged-in player already added)`,
    `- runFlow: "add_players.yaml"`,
    ``,
    `# Start game`,
    `- runFlow: "start_game.yaml"`,
    ``,
    `# Play all ${holeNumbers.length} holes`,
  ];

  for (const holeNum of holeNumbers) {
    const paddedNum = holeNum.padStart(2, "0");
    mainLines.push(`- runFlow: "holes/hole_${paddedNum}.yaml"`);
  }

  mainLines.push(
    ``,
    `# View final leaderboard`,
    `- runFlow: "leaderboard.yaml"`,
  );

  // Determine metadata
  const hasJunk = Object.values(fixture.holes).some((h) => h.junk);
  const hasMultipliers = Object.values(fixture.holes).some(
    (h) => h.multipliers,
  );

  // Guest players (all except first which is the logged-in user)
  const guestPlayers = fixture.players.slice(1);

  return {
    main: mainLines.join("\n"),
    login: stepsToYaml(
      generateLoginSteps(),
      "golf.spicy",
      `# Sub-flow: Login to test account\n# Expects: App launched with clearState\n# Provides: User logged in, "New Game" visible`,
    ),
    // Note: cleanup uses shared/cleanup.yaml, not generated per-game
    newGame: stepsToYaml(
      generateCreateGameSteps(fixture.spec),
      "golf.spicy",
      `# Sub-flow: Create new ${fixture.spec} game\n# Expects: User logged in, "New Game" visible\n# Provides: Game settings screen visible, "Add Player" visible`,
    ),
    addPlayers: stepsToYaml(
      generateAddPlayersSteps(fixture),
      "golf.spicy",
      `# Sub-flow: Add ${guestPlayers.length} guest players (${guestPlayers.map((p) => p.name).join(", ")})\n# Expects: Game settings screen, logged-in player already added automatically\n# Provides: ${fixture.players.length} players total, ready to start game`,
    ),
    startGame: stepsToYaml(
      generateStartGameSteps(),
      "golf.spicy",
      `# Sub-flow: Start the game\n# Expects: Players added, on game settings screen\n# Provides: Scoring screen visible, "Hole 1" visible`,
    ),
    holes,
    leaderboard: stepsToYaml(
      generateLeaderboardSteps(fixture),
      "golf.spicy",
      `# Sub-flow: Navigate to leaderboard and take screenshot\n# Expects: Game in progress, scoring complete\n# Provides: Final leaderboard screenshot`,
    ),
    meta: {
      holeCount: holeNumbers.length,
      playerCount: fixture.players.length,
      hasJunk,
      hasMultipliers,
    },
  };
}

/**
 * Get a descriptive comment for a hole based on the DSL data
 */
function getHoleComment(
  fixture: Fixture,
  holeNumber: string,
  holeData: FixtureHoleData,
): string {
  const lines: string[] = [`# Hole ${holeNumber}`];

  // Add scores
  const scores = Object.entries(holeData.scores)
    .map(([id, data]) => `${id}=${data?.gross}`)
    .join(", ");
  lines.push(`# Scores: ${scores}`);

  // Add junk if present
  if (holeData.junk) {
    const junkStr = Object.entries(holeData.junk)
      .map(([name, recipients]) => {
        const ids = Array.isArray(recipients) ? recipients : [recipients];
        return ids.map((id) => `${name}:${id}`).join(" ");
      })
      .join(" ");
    lines.push(`# Junk: ${junkStr}`);
  }

  // Add multipliers if present
  if (holeData.multipliers) {
    const multStr = Object.entries(holeData.multipliers)
      .map(([teamId, mults]) => mults.map((m) => `t${teamId}:${m}`).join(" "))
      .join(" ");
    lines.push(`# Multipliers: ${multStr}`);
  }

  return lines.join("\n");
}

/**
 * Generate a complete Maestro flow from a fixture (single file mode - legacy)
 */
export function generateFullFlow(fixture: E2EFixture): GeneratedFlow {
  const steps: MaestroStep[] = [];

  // Add comment header
  steps.push({
    // Maestro doesn't have comments, so we use takeScreenshot as a marker
    takeScreenshot: "test_start",
  });

  // 1. Launch app
  steps.push({ launchApp: { clearState: true } });

  // 2. Login
  steps.push(...generateLoginSteps());

  // 3. Create game
  steps.push(...generateCreateGameSteps(fixture.spec));

  // 4. Add players
  steps.push(...generateAddPlayersSteps(fixture));

  // 5. Start game
  steps.push(...generateStartGameSteps());

  // 6. Score each hole
  const holeNumbers = Object.keys(fixture.holes).sort(
    (a, b) => Number.parseInt(a, 10) - Number.parseInt(b, 10),
  );
  for (const holeNum of holeNumbers) {
    const holeData = fixture.holes[holeNum];
    if (holeData) {
      steps.push(...generateHoleScoringSteps(fixture, holeNum, holeData));
    }
  }

  // 7. Verify final results
  steps.push(...generateLeaderboardSteps(fixture));

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
  headerComment?: string,
): string {
  const lines: string[] = [];

  if (headerComment) {
    lines.push(headerComment);
    lines.push(``);
  } else {
    lines.push(`# Generated E2E test flow`);
    lines.push(`# Do not edit directly - regenerate from fixture`);
    lines.push(``);
  }

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
 * Recursively serialize a value to YAML format
 */
function valueToYaml(
  value: unknown,
  indent: number,
  isArrayItem = false,
): string {
  const prefix = "  ".repeat(indent);
  const itemPrefix = isArrayItem ? "- " : "";

  if (value === true) {
    return `${prefix}${itemPrefix}true`;
  }
  if (value === false) {
    return `${prefix}${itemPrefix}false`;
  }
  if (typeof value === "string") {
    return `${prefix}${itemPrefix}"${value}"`;
  }
  if (typeof value === "number") {
    return `${prefix}${itemPrefix}${value}`;
  }
  if (Array.isArray(value)) {
    const lines: string[] = [];
    for (const item of value) {
      lines.push(valueToYaml(item, indent, true));
    }
    return lines.join("\n");
  }
  if (typeof value === "object" && value !== null) {
    const obj = value as Record<string, unknown>;
    const entries = Object.entries(obj);

    if (entries.length === 0) {
      return `${prefix}${itemPrefix}{}`;
    }

    const lines: string[] = [];
    for (let i = 0; i < entries.length; i++) {
      const [key, val] = entries[i];
      // First key gets the array item prefix if this is an array item
      const keyPrefix = i === 0 && isArrayItem ? `${prefix}- ` : `${prefix}  `;

      if (
        typeof val === "string" ||
        typeof val === "number" ||
        typeof val === "boolean"
      ) {
        const formattedVal = typeof val === "string" ? `"${val}"` : String(val);
        lines.push(`${keyPrefix}${key}: ${formattedVal}`);
      } else if (Array.isArray(val)) {
        lines.push(`${keyPrefix}${key}:`);
        lines.push(valueToYaml(val, indent + 2, false));
      } else if (typeof val === "object" && val !== null) {
        lines.push(`${keyPrefix}${key}:`);
        // Recursively serialize nested object (not as array item)
        const nestedLines = valueToYaml(val, indent + 2, false);
        lines.push(nestedLines);
      }
    }
    return lines.join("\n");
  }
  return `${prefix}${itemPrefix}null`;
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
      // Object value - use recursive serializer
      lines.push(`${prefix}- ${key}:`);
      const nestedYaml = valueToYaml(value, indent + 2, false);
      lines.push(nestedYaml);
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
    console.log("Example: bun fixture-to-maestro.ts five_points/game_0/game");
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
