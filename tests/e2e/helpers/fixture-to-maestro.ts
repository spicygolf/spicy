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
import { calculatePops } from "../../../packages/lib/utils/scores";

interface MaestroStep {
  [key: string]: unknown;
}

// =============================================================================
// Timeout Constants (in milliseconds)
// =============================================================================

/** Wait for app launch and initial load */
const TIMEOUT_APP_LAUNCH = 10000;
/** Wait for login/authentication to complete */
const TIMEOUT_LOGIN = 15000;
/** Wait for API data to load (specs, courses, etc.) */
const TIMEOUT_API_LOAD = 10000;
/** Wait for navigation/screen transitions */
const TIMEOUT_NAVIGATION = 3000;
/** Wait for standard animations (modals, dropdowns) */
const TIMEOUT_ANIMATION = 500;
/** Wait for quick UI updates (button taps, toggles) */
const TIMEOUT_UI_UPDATE = 300;
/** Wait for hole navigation swipe */
const TIMEOUT_HOLE_SWIPE = 1000;

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
  /** Select course and tee sub-flow (manual entry) */
  selectCourseTee: string;
  /** Adjust handicaps sub-flow (optional, only if players have handicap overrides) */
  adjustHandicaps: string | null;
  /** Assign teams sub-flow (optional, only if fixture has team assignments) */
  assignTeams: string | null;
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
    hasHandicapOverrides: boolean;
    hasTeamAssignments: boolean;
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
        timeout: TIMEOUT_APP_LAUNCH,
      },
    },
    {
      extendedWaitUntil: {
        visible: "Spicy Golf",
        timeout: TIMEOUT_APP_LAUNCH,
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
        timeout: TIMEOUT_LOGIN,
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
        timeout: TIMEOUT_NAVIGATION,
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
        timeout: TIMEOUT_NAVIGATION,
      },
    },
    // Wait for specs to load from API
    {
      extendedWaitUntil: {
        visible: {
          id: spec.testId,
        },
        timeout: TIMEOUT_API_LOAD,
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
        timeout: TIMEOUT_API_LOAD,
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
                    timeout: TIMEOUT_NAVIGATION,
                  },
                },
                { tapOn: "Settings" },
                {
                  waitForAnimationToEnd: {
                    timeout: TIMEOUT_NAVIGATION,
                  },
                },
                {
                  scrollUntilVisible: {
                    element: {
                      text: "Delete Game",
                    },
                    direction: "DOWN",
                    timeout: TIMEOUT_NAVIGATION,
                  },
                },
                { tapOn: "Delete Game" },
                {
                  extendedWaitUntil: {
                    visible: "Delete",
                    timeout: TIMEOUT_NAVIGATION,
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
                    timeout: TIMEOUT_NAVIGATION,
                  },
                },
                {
                  waitForAnimationToEnd: {
                    timeout: TIMEOUT_HOLE_SWIPE,
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
 * Uses the Manual tab with testIDs for reliable E2E testing.
 */
export function generateAddPlayersSteps(fixture: Fixture): MaestroStep[] {
  const steps: MaestroStep[] = [];

  // Logged-in player is added automatically, so start from index 1
  // For additional players, use the Manual tab
  for (let i = 1; i < fixture.players.length; i++) {
    const player = fixture.players[i];
    steps.push(
      { tapOn: "Add Player" },
      {
        waitForAnimationToEnd: {
          timeout: TIMEOUT_HOLE_SWIPE,
        },
      },
      // Tap "Manual" tab
      { tapOn: "Manual" },
      {
        waitForAnimationToEnd: {
          timeout: TIMEOUT_ANIMATION,
        },
      },
      // Enter player name
      {
        tapOn: {
          id: "manual-player-name-input",
        },
      },
      { inputText: player.name },
      // Enter short name (same as name)
      {
        tapOn: {
          id: "manual-player-short-input",
        },
      },
      { inputText: player.name },
      // Enter handicap (negative values display with + prefix)
      {
        tapOn: {
          id: "manual-player-handicap-input",
        },
      },
      {
        inputText:
          player.handicapIndex < 0
            ? `+${Math.abs(player.handicapIndex)}`
            : String(player.handicapIndex),
      },
      { hideKeyboard: true },
      // Submit the player
      {
        tapOn: {
          id: "manual-player-submit-button",
        },
      },
      {
        waitForAnimationToEnd: {
          timeout: TIMEOUT_HOLE_SWIPE,
        },
      },
      // Navigate back to game settings screen
      {
        tapOn: {
          id: "nav-back-button",
        },
      },
      {
        waitForAnimationToEnd: {
          timeout: TIMEOUT_ANIMATION,
        },
      },
    );
  }

  return steps;
}

/**
 * Generate steps to select/create course and tee for the first player.
 * This handles round selection (if player has existing rounds) and manual course entry.
 * The course/tee selection propagates to all players in the game.
 */
export function generateSelectCourseTeeSteps(fixture: Fixture): MaestroStep[] {
  if (fixture.players.length === 0) {
    throw new Error("Fixture must have at least one player");
  }

  const steps: MaestroStep[] = [];

  // The logged-in player (first player) may show "Select Round" if they have existing rounds
  // or "Select Course/Tee" if a round was auto-created. We handle both cases.
  const firstPlayerSlug = fixture.players[0].name
    .toLowerCase()
    .replace(/\s+/g, "-");

  steps.push(
    // First, try to tap "Select Round" (if player has existing rounds for today)
    // If not visible, fall through to "Select Course/Tee"
    {
      runFlow: {
        when: {
          visible: {
            id: `select-round-${firstPlayerSlug}`,
          },
        },
        commands: [
          {
            tapOn: {
              id: `select-round-${firstPlayerSlug}`,
            },
          },
          {
            waitForAnimationToEnd: {
              timeout: TIMEOUT_NAVIGATION,
            },
          },
          // Create a new round for this game
          {
            tapOn: {
              id: "create-new-round-button",
            },
          },
          {
            waitForAnimationToEnd: {
              timeout: TIMEOUT_NAVIGATION,
            },
          },
        ],
      },
    },
    // Now tap "Select Course/Tee" (should be visible after round is created/selected)
    {
      tapOn: {
        id: `select-course-tee-${firstPlayerSlug}`,
      },
    },
    {
      waitForAnimationToEnd: {
        timeout: TIMEOUT_HOLE_SWIPE,
      },
    },
    // Tap "Manual" tab for course entry
    { tapOn: "Manual" },
    {
      waitForAnimationToEnd: {
        timeout: TIMEOUT_ANIMATION,
      },
    },
    // Enter course name from fixture
    {
      tapOn: {
        id: "manual-course-name-input",
      },
    },
    { inputText: fixture.course.name },
    // Enter tee name from fixture
    {
      tapOn: {
        id: "manual-course-tee-input",
      },
    },
    { inputText: fixture.course.tee },
    // Enter course rating if provided
    {
      tapOn: {
        id: "manual-course-rating-input",
      },
    },
    { inputText: fixture.course.rating?.toString() || "" },
    // Enter slope rating if provided
    {
      tapOn: {
        id: "manual-course-slope-input",
      },
    },
    { inputText: fixture.course.slope?.toString() || "" },
    // Dismiss keyboard by tapping header before tapping Next button
    { tapOn: "Course Name" },
    {
      waitForAnimationToEnd: {
        timeout: TIMEOUT_ANIMATION,
      },
    },
    // Tap Next to go to hole setup
    {
      tapOn: {
        id: "manual-course-next-button",
      },
    },
    {
      waitForAnimationToEnd: {
        timeout: TIMEOUT_HOLE_SWIPE,
      },
    },
  );

  // On ManualCourseHoles screen - set par, handicap, and yards for each hole from fixture
  // Par defaults to 4, Handicap and Yards start empty
  // All fields are now TextInputs (no more Picker dropdowns)
  //
  // Strategy: Edit holes 1-8, then 10-17 (skipping 9 and 18 which are at the bottom
  // of their sections and covered by keyboard), then scroll down for 9 and 18

  // Helper to generate steps for a single hole
  const generateHoleEntrySteps = (holeNum: number): MaestroStep[] => {
    const holeData = fixture.course.holes.find((h) => h.hole === holeNum);
    if (!holeData) return [];

    const holeSteps: MaestroStep[] = [];

    // Enter par
    holeSteps.push(
      {
        tapOn: {
          id: `hole-${holeNum}-par`,
        },
      },
      { inputText: holeData.par.toString() },
    );

    // Enter handicap
    holeSteps.push(
      {
        tapOn: {
          id: `hole-${holeNum}-handicap`,
        },
      },
      { inputText: holeData.handicap.toString() },
    );

    // Enter yards (optional - only if present in DSL)
    if (holeData.yards) {
      holeSteps.push(
        {
          tapOn: {
            id: `hole-${holeNum}-yards`,
          },
        },
        { inputText: holeData.yards.toString() },
      );
    }

    return holeSteps;
  };

  // Enter all 18 holes in order
  for (let i = 1; i <= 18; i++) {
    steps.push(...generateHoleEntrySteps(i));
  }

  // Dismiss keyboard by tapping section header
  steps.push({ tapOn: "Front 9" });

  // Save the course
  steps.push(
    {
      tapOn: {
        id: "manual-course-save-button",
      },
    },
    {
      waitForAnimationToEnd: {
        timeout: TIMEOUT_NAVIGATION,
      },
    },
  );

  return steps;
}

/**
 * Calculate course handicap from handicap index and slope
 */
function calculateCourseHandicap(handicapIndex: number, slope: number): number {
  return Math.round((handicapIndex * slope) / 113);
}

/**
 * Calculate "shots off" for each player (how many strokes they give/get relative to lowest handicap)
 */
function calculateShotsOff(
  players: FixturePlayer[],
  slope: number,
): Map<string, number> {
  // Calculate course handicap for each player
  const playerHandicaps = players.map((p) => ({
    id: p.id,
    courseHandicap: calculateCourseHandicap(p.handicapIndex, slope),
  }));

  // Find the lowest course handicap
  const lowestHandicap = Math.min(
    ...playerHandicaps.map((p) => p.courseHandicap),
  );

  // Calculate shots off for each player
  const shotsOff = new Map<string, number>();
  for (const p of playerHandicaps) {
    shotsOff.set(p.id, p.courseHandicap - lowestHandicap);
  }

  return shotsOff;
}

/**
 * Generate steps to adjust handicap index for players with overrides.
 * This navigates to the HandicapAdjustment screen for each player and enters the override value.
 * Also generates assertions to verify the "shots off" column values.
 */
export function generateAdjustHandicapsSteps(fixture: Fixture): MaestroStep[] {
  const steps: MaestroStep[] = [];

  // Find players with handicap overrides
  const playersWithOverrides = fixture.players.filter(
    (p) => p.handicapOverride !== undefined,
  );

  if (playersWithOverrides.length === 0) {
    return steps;
  }

  for (const player of playersWithOverrides) {
    const playerSlug = player.name.toLowerCase().replace(/\s+/g, "-");

    // Wait for the handicap display to be visible (needs roundToGame to be loaded)
    steps.push({
      extendedWaitUntil: {
        visible: {
          id: `handicap-adjustment-${playerSlug}`,
        },
        timeout: TIMEOUT_NAVIGATION,
      },
    });

    // Tap on the player's handicap display to open HandicapAdjustment
    steps.push(
      {
        tapOn: {
          id: `handicap-adjustment-${playerSlug}`,
        },
      },
      {
        waitForAnimationToEnd: {
          timeout: TIMEOUT_HOLE_SWIPE,
        },
      },
    );

    // Clear and enter the handicap index override
    // Use longPress + Select All for reliable text clearing on iOS
    // Note: handicapOverride is guaranteed defined after filter() above
    steps.push(
      {
        longPressOn: {
          id: "handicap-index-input",
        },
      },
      { tapOn: "Select All" },
      { inputText: player.handicapOverride! },
    );

    // Navigate back to game settings (back button dismisses keyboard and saves)
    steps.push(
      {
        tapOn: {
          id: "nav-back-button",
        },
      },
      {
        waitForAnimationToEnd: {
          timeout: TIMEOUT_ANIMATION,
        },
      },
    );
  }

  // Add assertions for the "shots off" column
  // This verifies handicap calculations are working correctly
  if (fixture.course.slope) {
    const shotsOff = calculateShotsOff(fixture.players, fixture.course.slope);

    // Add assertions for each player's shots off value
    for (const player of fixture.players) {
      const playerSlug = player.name.toLowerCase().replace(/\s+/g, "-");
      const shots = shotsOff.get(player.id);

      if (shots !== undefined) {
        steps.push({
          assertVisible: {
            id: `handicap-adjustment-${playerSlug}-shots`,
            text: String(shots),
          },
        });
      }
    }
  }

  return steps;
}

/**
 * Create a URL-safe slug from a player name for use in testIDs
 */
function slugify(name: string): string {
  return name.toLowerCase().replace(/\s+/g, "-");
}

/**
 * Generate steps to assign players to teams.
 * Navigates to Teams tab and taps on each player to cycle them to their target team.
 *
 * Players start in "Unassigned" (team 0). Tapping a player cycles them:
 * - From Unassigned (0) -> Team 1
 * - From Team 1 -> Team 2
 * - From Team 2 -> Unassigned (0) (for 2 teams)
 *
 * So to get a player to Team N, tap them N times from Unassigned.
 */
export function generateAssignTeamsSteps(fixture: Fixture): MaestroStep[] {
  const steps: MaestroStep[] = [];

  // If no teams defined in fixture, return empty steps
  if (!fixture.teams || Object.keys(fixture.teams).length === 0) {
    return steps;
  }

  // Navigate to Teams tab
  steps.push(
    {
      tapOn: {
        text: "Teams",
      },
    },
    {
      waitForAnimationToEnd: {
        timeout: TIMEOUT_NAVIGATION,
      },
    },
  );

  // Wait for Teams tab content to load
  steps.push({
    extendedWaitUntil: {
      visible: "Team Assignments",
      timeout: TIMEOUT_API_LOAD,
    },
  });

  // Build a map of player ID to target team number
  const playerIdToTeam = new Map<string, number>();
  for (const [teamId, playerIds] of Object.entries(fixture.teams)) {
    const teamNumber = Number.parseInt(teamId, 10);
    for (const playerId of playerIds) {
      playerIdToTeam.set(playerId, teamNumber);
    }
  }

  // For each player, tap them the right number of times to reach their team
  // Order: process by team to minimize tap count (Team 1 first, then Team 2, etc.)
  const teamNumbers = Object.keys(fixture.teams)
    .map((t) => Number.parseInt(t, 10))
    .sort((a, b) => a - b);

  for (const teamNumber of teamNumbers) {
    const playerIds = fixture.teams[String(teamNumber)] || [];

    for (const playerId of playerIds) {
      // Find the player info from fixture
      const player = fixture.players.find((p) => p.id === playerId);
      if (!player) continue;

      const playerSlug = slugify(player.name);
      const playerTestId = `team-player-${playerSlug}`;

      // Tap the player `teamNumber` times to cycle them from Unassigned to target team
      // Unassigned (0) -> Team 1 (1 tap) -> Team 2 (2 taps) -> etc.
      for (let i = 0; i < teamNumber; i++) {
        steps.push(
          {
            tapOn: {
              id: playerTestId,
            },
          },
          {
            waitForAnimationToEnd: {
              timeout: TIMEOUT_UI_UPDATE,
            },
          },
        );
      }
    }
  }

  // Take screenshot after team assignments
  steps.push({
    takeScreenshot: "team_assignments_complete",
  });

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
        timeout: TIMEOUT_NAVIGATION,
      },
    },
    // Wait for scoring view to load
    {
      extendedWaitUntil: {
        visible: "Hole 1",
        timeout: TIMEOUT_API_LOAD,
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
              timeout: TIMEOUT_HOLE_SWIPE,
            },
          },
        ],
      },
    },
    {
      extendedWaitUntil: {
        visible: `Hole ${holeNumber}`,
        timeout: TIMEOUT_NAVIGATION,
      },
    },
  ];
}

/**
 * Generate steps to enter a score for a player.
 * Uses the +/- buttons to increment/decrement from the default (par + pops).
 * Adds waits between consecutive taps to ensure UI settles.
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
    // Increment diff times, with waits between consecutive taps
    for (let i = 0; i < diff; i++) {
      if (i > 0) {
        // Add wait between consecutive taps to let UI settle
        steps.push({
          waitForAnimationToEnd: {
            timeout: TIMEOUT_UI_UPDATE,
          },
        });
      }
      steps.push({
        tapOn: {
          id: `player-${playerId}-increment`,
        },
      });
    }
  } else {
    // Decrement |diff| times, with waits between consecutive taps
    for (let i = 0; i < Math.abs(diff); i++) {
      if (i > 0) {
        // Add wait between consecutive taps to let UI settle
        steps.push({
          waitForAnimationToEnd: {
            timeout: TIMEOUT_UI_UPDATE,
          },
        });
      }
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
 *
 * @param fixture - The test fixture
 * @param holeNumber - The hole number as string
 * @param holeData - The hole's score/junk/multiplier data
 * @param shotsOffMap - Pre-calculated shots off for each player (for pops calculation)
 */
export function generateHoleScoringSteps(
  fixture: Fixture,
  holeNumber: string,
  holeData: FixtureHoleData,
  shotsOffMap?: Map<string, number>,
): MaestroStep[] {
  const steps: MaestroStep[] = [];
  const holeNum = Number.parseInt(holeNumber, 10);

  // Navigate to this hole
  steps.push(...generateNavigateToHoleSteps(holeNum));

  // Get hole info from course
  const courseHole = fixture.course.holes.find((h) => h.hole === holeNum);
  const par = courseHole?.par ?? 4;
  const holeHandicap = courseHole?.handicap ?? holeNum;

  // Enter scores for each player
  for (const [playerId, scoreData] of Object.entries(holeData.scores)) {
    const player = fixture.players.find((p) => p.id === playerId);
    if (!player || !scoreData) continue;

    // Calculate pops using shots off (adjusted handicap relative to lowest)
    // This assumes handicap_index_from = "low" (default)
    const shotsOff = shotsOffMap?.get(playerId) ?? 0;
    const pops = calculatePops(shotsOff, holeHandicap);

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
          timeout: TIMEOUT_ANIMATION,
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
            timeout: TIMEOUT_UI_UPDATE,
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
            timeout: TIMEOUT_UI_UPDATE,
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
export function generateLeaderboardSteps(_fixture: Fixture): MaestroStep[] {
  const steps: MaestroStep[] = [];

  // Navigate to leaderboard
  steps.push(
    { tapOn: "Leaderboard" },
    {
      waitForAnimationToEnd: {
        timeout: TIMEOUT_NAVIGATION,
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

  // Pre-calculate shots off for pops calculation
  // This assumes handicap_index_from = "low" (default for Five Points)
  const shotsOffMap = fixture.course.slope
    ? calculateShotsOff(fixture.players, fixture.course.slope)
    : new Map<string, number>();

  // Generate individual hole flows
  const holes: Record<string, string> = {};
  for (const holeNum of holeNumbers) {
    const holeData = fixture.holes[holeNum];
    if (holeData) {
      const paddedNum = holeNum.padStart(2, "0");
      const steps = generateHoleScoringSteps(
        fixture,
        holeNum,
        holeData,
        shotsOffMap,
      );
      const comment = getHoleComment(fixture, holeNum, holeData, shotsOffMap);
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
    `# Allow Maestro to see elements inside dropdown modals on iOS`,
    `platform:`,
    `  ios:`,
    `    snapshotKeyHonorModalViews: false`,
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
    `- runFlow: "../../shared/cleanup_deep.yaml"`,
    ``,
    `# Create new game`,
    `- runFlow: "new_game.yaml"`,
    ``,
    `# Add guest players (logged-in player already added)`,
    `- runFlow: "add_players.yaml"`,
    ``,
    `# Select course and tee (manual entry)`,
    `- runFlow: "select_course_tee.yaml"`,
  ];

  // Check if any players have handicap overrides
  const playersWithOverrides = fixture.players.filter(
    (p) => p.handicapOverride !== undefined,
  );
  const hasHandicapOverrides = playersWithOverrides.length > 0;

  if (hasHandicapOverrides) {
    mainLines.push(
      ``,
      `# Adjust handicap indexes`,
      `- runFlow: "adjust_handicaps.yaml"`,
    );
  }

  // Check if fixture has team assignments
  const hasTeamAssignments =
    fixture.teams && Object.keys(fixture.teams).length > 0;

  if (hasTeamAssignments) {
    mainLines.push(
      ``,
      `# Assign players to teams`,
      `- runFlow: "assign_teams.yaml"`,
    );
  }

  mainLines.push(
    ``,
    `# Start game`,
    `- runFlow: "start_game.yaml"`,
    ``,
    `# Play all ${holeNumbers.length} holes`,
  );

  for (const holeNum of holeNumbers) {
    const paddedNum = holeNum.padStart(2, "0");
    mainLines.push(`- runFlow: "holes/hole_${paddedNum}.yaml"`);
  }

  mainLines.push(
    ``,
    `# View final leaderboard`,
    `- runFlow: "leaderboard.yaml"`,
    ``,
    `# Clean up test data`,
    `- runFlow: "../../shared/cleanup_deep.yaml"`,
  );

  // Determine metadata
  const hasJunk = Object.values(fixture.holes).some((h) => h.junk);
  const hasMultipliers = Object.values(fixture.holes).some(
    (h) => h.multipliers,
  );

  // Guest players (all except first which is the logged-in user)
  const guestPlayers = fixture.players.slice(1);

  // Generate adjust handicaps sub-flow if needed
  const adjustHandicapsSteps = generateAdjustHandicapsSteps(fixture);
  const adjustHandicapsYaml =
    adjustHandicapsSteps.length > 0
      ? stepsToYaml(
          adjustHandicapsSteps,
          "golf.spicy",
          `# Sub-flow: Adjust handicap indexes for players with overrides\n# Expects: Game settings screen with course/tee selected\n# Provides: Handicap indexes adjusted, ready to assign teams or start game`,
        )
      : null;

  // Generate assign teams sub-flow if needed
  const assignTeamsSteps = generateAssignTeamsSteps(fixture);
  const teamNames = fixture.teams
    ? Object.entries(fixture.teams)
        .map(([teamId, playerIds]) => {
          const names = playerIds
            .map((pid) => fixture.players.find((p) => p.id === pid)?.name)
            .filter(Boolean)
            .join(", ");
          return `Team ${teamId}: ${names}`;
        })
        .join("; ")
    : "";
  const assignTeamsYaml =
    assignTeamsSteps.length > 0
      ? stepsToYaml(
          assignTeamsSteps,
          "golf.spicy",
          `# Sub-flow: Assign players to teams\n# Expects: Game settings screen (Players tab)\n# Provides: ${teamNames}`,
        )
      : null;

  return {
    main: mainLines.join("\n"),
    login: stepsToYaml(
      generateLoginSteps(),
      "golf.spicy",
      `# Sub-flow: Login to test account\n# Expects: App launched with clearState\n# Provides: User logged in, "New Game" visible`,
    ),
    // Note: cleanup uses shared/cleanup_deep.yaml, not generated per-game
    newGame: stepsToYaml(
      generateCreateGameSteps(fixture.spec),
      "golf.spicy",
      `# Sub-flow: Create new ${fixture.spec} game\n# Expects: User logged in, "New Game" visible\n# Provides: Game settings screen visible, "Add Player" visible`,
    ),
    addPlayers: stepsToYaml(
      generateAddPlayersSteps(fixture),
      "golf.spicy",
      `# Sub-flow: Add ${guestPlayers.length} guest players (${guestPlayers.map((p) => p.name).join(", ")})\n# Expects: Game settings screen, logged-in player already added automatically\n# Provides: ${fixture.players.length} players total, ready for course/tee selection`,
    ),
    selectCourseTee: stepsToYaml(
      generateSelectCourseTeeSteps(fixture),
      "golf.spicy",
      `# Sub-flow: Select course and tee for ${fixture.players[0].name} (manual entry)\n# Expects: Game settings screen with players added\n# Provides: Course and tee configured, ready for handicap adjustment or team assignment`,
    ),
    adjustHandicaps: adjustHandicapsYaml,
    assignTeams: assignTeamsYaml,
    startGame: stepsToYaml(
      generateStartGameSteps(),
      "golf.spicy",
      `# Sub-flow: Start the game\n# Expects: Players added, teams assigned (if applicable), on game settings screen\n# Provides: Scoring screen visible, "Hole 1" visible`,
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
      hasHandicapOverrides,
      hasTeamAssignments: hasTeamAssignments ?? false,
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
  shotsOffMap?: Map<string, number>,
): string {
  const holeNum = Number.parseInt(holeNumber, 10);
  const courseHole = fixture.course.holes.find((h) => h.hole === holeNum);
  const par = courseHole?.par ?? 4;
  const holeHandicap = courseHole?.handicap ?? holeNum;

  const lines: string[] = [
    `# Hole ${holeNumber} (Par ${par}, Hdcp ${holeHandicap})`,
  ];

  // Add scores with pops info
  const scoresWithPops = Object.entries(holeData.scores)
    .map(([id, data]) => {
      const shotsOff = shotsOffMap?.get(id) ?? 0;
      const pops = calculatePops(shotsOff, holeHandicap);
      const popsStr = pops > 0 ? `+${pops}` : pops < 0 ? `${pops}` : "";
      return `${id}=${data?.gross}${popsStr ? `(${popsStr})` : ""}`;
    })
    .join(", ");
  lines.push(`# Scores: ${scoresWithPops}`);

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
  // Allow Maestro to see elements inside dropdown modals on iOS
  // (react-native-element-dropdown uses accessibilityViewIsModal which hides sibling views)
  lines.push(`platform:`);
  lines.push(`  ios:`);
  lines.push(`    snapshotKeyHonorModalViews: false`);
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
 * Uses 2-space indentation to match manual YAML style
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
        // Use indent + 1 for proper 2-space indentation
        lines.push(valueToYaml(val, indent + 1, false));
      } else if (typeof val === "object" && val !== null) {
        lines.push(`${keyPrefix}${key}:`);
        // Use indent + 1 for proper 2-space indentation
        const nestedLines = valueToYaml(val, indent + 1, false);
        lines.push(nestedLines);
      }
    }
    return lines.join("\n");
  }
  return `${prefix}${itemPrefix}null`;
}

/**
 * Convert a single step to YAML format
 * Uses 2-space indentation to match manual YAML style
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
      // Use indent + 1 for proper 2-space indentation
      const nestedYaml = valueToYaml(value, indent + 1, false);
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
