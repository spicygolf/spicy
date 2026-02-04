/**
 * Test Fixture Types
 *
 * Human-readable JSON format for game test scenarios.
 * Mirrors the app's data entry flow for easy fixture creation.
 */

// =============================================================================
// Input Types (what goes into the fixture)
// =============================================================================

/**
 * Course hole information
 */
export interface FixtureHole {
  /** Hole number (1-18) */
  hole: number;
  /** Par for the hole */
  par: number;
  /** Handicap allocation (1 = hardest, 18 = easiest) */
  handicap: number;
  /** Yardage */
  yards: number;
}

/**
 * Course and tee information
 */
export interface FixtureCourse {
  /** Course name */
  name: string;
  /** Tee name (e.g., "Blue", "White") */
  tee: string;
  /** Hole data - only include holes being played */
  holes: FixtureHole[];
  /** Course rating (optional, for handicap calculation) */
  rating?: number;
  /** Slope rating (optional, for handicap calculation) */
  slope?: number;
}

/**
 * Player in the game
 */
export interface FixturePlayer {
  /** Unique player ID (e.g., "p1", "p2") */
  id: string;
  /** Player display name */
  name: string;
  /** GHIN handicap index */
  handicapIndex: number;
  /** Short name for display (optional) */
  short?: string;
  /** Handicap index override for the round (optional, for E2E testing) */
  handicapOverride?: string;
}

/**
 * Team assignments - team ID to player IDs
 */
export interface FixtureTeams {
  [teamId: string]: string[];
}

/**
 * Option overrides from spec defaults
 */
export interface FixtureOptions {
  [optionName: string]: number | string | boolean;
}

/**
 * Score entry for a player on a hole
 */
export interface FixturePlayerScore {
  /** Gross strokes */
  gross: number;
}

/**
 * Junk awards for a hole
 * - String value: single player ID who earned it
 * - Array value: multiple player IDs who earned it
 */
export interface FixtureHoleJunk {
  [junkName: string]: string | string[];
}

/**
 * Multiplier activations for a hole
 * - Key: team ID
 * - Value: array of multiplier names activated by that team
 */
export interface FixtureHoleMultipliers {
  [teamId: string]: string[];
}

/**
 * All data for a single hole
 */
export interface FixtureHoleData {
  /** Player scores keyed by player ID */
  scores: Record<string, FixturePlayerScore>;
  /** Junk awards (optional) */
  junk?: FixtureHoleJunk;
  /** Multiplier activations (optional) */
  multipliers?: FixtureHoleMultipliers;
}

// =============================================================================
// Expected Output Types (what we assert on)
// =============================================================================

/**
 * Expected team result for a hole
 */
export interface ExpectedTeamHoleResult {
  /** Low ball score (best net on team) */
  lowBall?: number;
  /** Total score (sum of nets on team) */
  total?: number;
  /** Points earned */
  points?: number;
  /** Rank among teams */
  rank?: number;
}

/**
 * Expected player result for a hole
 */
export interface ExpectedPlayerHoleResult {
  /** Gross score */
  gross?: number;
  /** Net score */
  net?: number;
  /** Pops received */
  pops?: number;
  /** Junk names earned */
  junk?: string[];
  /** Points earned */
  points?: number;
  /** Rank among players */
  rank?: number;
}

/**
 * Expected results for a single hole
 */
export interface ExpectedHoleResult {
  /** Team results keyed by team ID */
  teams?: Record<string, ExpectedTeamHoleResult>;
  /** Player results keyed by player ID */
  players?: Record<string, ExpectedPlayerHoleResult>;
  /** Combined hole multiplier (product of all team multipliers) */
  holeMultiplier?: number;
}

/**
 * Expected cumulative team result
 */
export interface ExpectedTeamCumulative {
  /** Total points */
  pointsTotal?: number;
  /** Total score */
  scoreTotal?: number;
  /** Final rank */
  rank?: number;
}

/**
 * Expected cumulative player result
 */
export interface ExpectedPlayerCumulative {
  /** Total gross */
  grossTotal?: number;
  /** Total net */
  netTotal?: number;
  /** Total points */
  pointsTotal?: number;
  /** Final rank */
  rank?: number;
}

/**
 * Expected cumulative results
 */
export interface ExpectedCumulative {
  /** Team cumulative results */
  teams?: Record<string, ExpectedTeamCumulative>;
  /** Player cumulative results */
  players?: Record<string, ExpectedPlayerCumulative>;
}

/**
 * All expected results for assertions
 */
export interface ExpectedResults {
  /** Per-hole expected results */
  holes?: Record<string, ExpectedHoleResult>;
  /** Cumulative expected results */
  cumulative?: ExpectedCumulative;
}

// =============================================================================
// Main Fixture Type
// =============================================================================

/**
 * Complete test fixture
 *
 * Human-readable format that mirrors app data entry:
 * 1. Game metadata (name, spec)
 * 2. Course/tee setup
 * 3. Players with handicaps
 * 4. Team assignments
 * 5. Option overrides
 * 6. Per-hole scoring data
 * 7. Expected results for assertions
 */
export interface Fixture {
  /** Fixture name for test output */
  name: string;
  /** Description of what this fixture tests */
  description?: string;
  /** Game spec name (e.g., "five_points") */
  spec: string;
  /** Course and tee information */
  course: FixtureCourse;
  /** Players in the game */
  players: FixturePlayer[];
  /** Team assignments (optional for non-team games) */
  teams?: FixtureTeams;
  /** Option overrides from spec defaults */
  options?: FixtureOptions;
  /** Per-hole scoring data keyed by hole number */
  holes: Record<string, FixtureHoleData>;
  /** Expected results for assertions */
  expected: ExpectedResults;
}
