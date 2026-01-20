/**
 * Scoring Engine Types
 *
 * Data-driven scoring engine types. All game rules come from GameSpec and Option data,
 * NOT from game-specific code files.
 */

import type {
  Game,
  GameHole,
  GameSpec,
  MapOfOptions,
  RoundToGame,
  Team,
} from "../schema";

// =============================================================================
// Input Types (from Jazz schema)
// =============================================================================

/**
 * Hole information extracted from tee data
 */
export interface HoleInfo {
  /** Hole number as string ("1" - "18") */
  hole: string;
  /** Par for the hole */
  par: number;
  /** Handicap allocation (1 = hardest, 18 = easiest) */
  allocation: number;
  /** Yardage */
  yards: number;
}

/**
 * Player information for scoring
 */
export interface PlayerInfo {
  /** Player ID */
  playerId: string;
  /** Course handicap (may be negative for plus handicaps) */
  courseHandicap: number;
  /** Game handicap override (if set) */
  gameHandicap?: number;
  /** Effective handicap (gameHandicap ?? courseHandicap) */
  effectiveHandicap: number;
  /** Adjusted handicap relative to lowest player (for "low" handicap mode) */
  adjustedHandicap: number;
}

// =============================================================================
// Scoreboard Output Types
// =============================================================================

/**
 * Junk award for a player or team
 */
export interface JunkAward {
  /** Option name (e.g., "birdie", "eagle") */
  name: string;
  /** Points value */
  value: number;
  /** Player who earned it (for team junk attribution) */
  playerId?: string;
}

/**
 * Warning generated during scoring (v0.3 parity)
 */
export interface ScoringWarning {
  /** Type of warning */
  type: "incomplete_junk" | "missing_scores" | "other";
  /** Human-readable message */
  message: string;
}

/**
 * Multiplier applied to a player or team
 */
export interface MultiplierAward {
  /** Option name (e.g., "birdie_bbq", "double") */
  name: string;
  /** Multiplier value (e.g., 2 for double) */
  value: number;
  /** Player who triggered it (if applicable) */
  playerId?: string;
  /** If true, this value replaces the total multiplier instead of stacking */
  override?: boolean;
  /** If true, this is an earned/automatic multiplier (e.g., birdie_bbq) vs user-activated */
  earned?: boolean;
}

/**
 * Result for a single player on a single hole
 */
export interface PlayerHoleResult {
  /** Player ID */
  playerId: string;
  /** Whether a score has been entered for this hole */
  hasScore: boolean;
  /** Gross score */
  gross: number;
  /** Pops (strokes received, can be negative for plus handicaps) */
  pops: number;
  /** Net score (gross - pops) */
  net: number;
  /** Score relative to par (negative = under par) */
  scoreToPar: number;
  /** Net score relative to par */
  netToPar: number;
  /** Rank among players (1 = best, handles ties) */
  rank: number;
  /** Number of players tied at this rank */
  tieCount: number;
  /** Junk awards for this hole */
  junk: JunkAward[];
  /** Multipliers applied for this hole */
  multipliers: MultiplierAward[];
  /** Points earned on this hole */
  points: number;
}

/**
 * Result for a single team on a single hole
 */
export interface TeamHoleResult {
  /** Team identifier */
  teamId: string;
  /** Team score (calculated based on scoring method: best_ball, sum, etc.) */
  score: number;
  /** Low ball score (best individual net score on team) */
  lowBall: number;
  /** Total score (sum of all net scores on team) */
  total: number;
  /** Player IDs on this team */
  playerIds: string[];
  /** Rank among teams */
  rank: number;
  /** Number of teams tied at this rank */
  tieCount: number;
  /** Junk awards for this team */
  junk: JunkAward[];
  /** Multipliers applied for this team */
  multipliers: MultiplierAward[];
  /** Points earned on this hole */
  points: number;

  // v0.3 parity fields
  /** Net points vs opponent (for 2-team games) */
  holeNetTotal?: number;
  /** Running total points through this hole */
  runningTotal?: number;
  /** Running difference from opponent (for 2-team games) */
  runningDiff?: number;
  /** Match play holes up/down or final result like "3 & 2" */
  matchDiff?: number | string;
  /** Whether match is decided (for match play games) */
  matchOver?: boolean;
}

/**
 * Results for a single hole
 */
export interface HoleResult {
  /** Hole number */
  hole: string;
  /** Hole info (par, allocation) */
  holeInfo: HoleInfo;
  /** Player results keyed by player ID */
  players: Record<string, PlayerHoleResult>;
  /** Team results keyed by team ID (empty if no teams) */
  teams: Record<string, TeamHoleResult>;

  // v0.3 parity fields
  /** Total possible points from junk with limits (one_per_group, one_team_per_group) */
  possiblePoints?: number;
  /** Number of players with scores entered on this hole */
  scoresEntered?: number;
  /** Number of junk items marked by users */
  markedJunk?: number;
  /** Number of required junk items (one_per_group scope=player) */
  requiredJunk?: number;
  /** Warnings for incomplete scoring (e.g., "Mark all possible points") */
  warnings?: ScoringWarning[];
  /** Combined multiplier for the entire hole (all team multipliers multiplied together) */
  holeMultiplier?: number;
}

/**
 * Cumulative results for a player across all holes
 */
export interface PlayerCumulative {
  /** Player ID */
  playerId: string;
  /** Total gross score */
  grossTotal: number;
  /** Total net score */
  netTotal: number;
  /** Total pops received */
  popsTotal: number;
  /** Total points earned */
  pointsTotal: number;
  /** Total junk value */
  junkTotal: number;
  /** Holes played count */
  holesPlayed: number;
  /** Cumulative rank */
  rank: number;
  /** Tie count at current rank */
  tieCount: number;
}

/**
 * Cumulative results for a team across all holes
 */
export interface TeamCumulative {
  /** Team identifier */
  teamId: string;
  /** Total team score */
  scoreTotal: number;
  /** Total points earned */
  pointsTotal: number;
  /** Total junk value */
  junkTotal: number;
  /** Cumulative rank */
  rank: number;
  /** Tie count at current rank */
  tieCount: number;

  // v0.3 parity fields
  /** Final match diff for match play (e.g., "3 & 2") */
  matchDiff?: number | string;
  /** Whether match is decided */
  matchOver?: boolean;
}

/**
 * Complete scoreboard for a game
 */
export interface Scoreboard {
  /** Results by hole number */
  holes: Record<string, HoleResult>;
  /** Cumulative totals */
  cumulative: {
    /** Player cumulative results keyed by player ID */
    players: Record<string, PlayerCumulative>;
    /** Team cumulative results keyed by team ID */
    teams: Record<string, TeamCumulative>;
  };
  /** Metadata */
  meta: {
    /** Game ID */
    gameId: string;
    /** Holes played (e.g., ["1", "2", "3"]) */
    holesPlayed: string[];
    /** Whether teams are active */
    hasTeams: boolean;
    /** Total possible points per hole (from spec) */
    pointsPerHole: number;
  };
}

// =============================================================================
// Scoring Context (Pipeline State)
// =============================================================================

/**
 * Immutable context passed through the scoring pipeline.
 * Contains all input data and builds up results through stages.
 */
export interface ScoringContext {
  // -------------------------------------------------------------------------
  // Input Data (from Jazz)
  // -------------------------------------------------------------------------

  /** The game being scored */
  game: Game;

  /** Primary game spec (first in specs list) */
  gameSpec: GameSpec;

  /** Merged options from game and spec (undefined if no options available) */
  options: MapOfOptions | undefined;

  /** Game holes with teams */
  gameHoles: GameHole[];

  /** Rounds (player participation edges) */
  rounds: RoundToGame[];

  // -------------------------------------------------------------------------
  // Computed Lookups (built once, reused)
  // -------------------------------------------------------------------------

  /** Hole info keyed by hole number */
  holeInfoMap: Map<string, HoleInfo>;

  /** Player handicap info keyed by player ID */
  playerHandicaps: Map<string, PlayerHandicapInfo>;

  /** Teams per hole: holeNum -> teams for that hole */
  teamsPerHole: Map<string, Team[]>;

  /** Player ID to team ID mapping per hole: holeNum -> (playerId -> teamId) */
  playerTeamMap: Map<string, Map<string, string>>;

  // -------------------------------------------------------------------------
  // Results (built up through pipeline)
  // -------------------------------------------------------------------------

  /** The scoreboard being constructed */
  scoreboard: Scoreboard;
}

// =============================================================================
// Pipeline Types
// =============================================================================

/**
 * A scoring pipeline stage - pure function that transforms context
 */
export type ScoringStage = (ctx: ScoringContext) => ScoringContext;

/**
 * Configuration for the scoring pipeline
 */
export interface PipelineConfig {
  /** Which holes to score (defaults to all with scores) */
  holes?: string[];
  /** Whether to include junk evaluation */
  includeJunk?: boolean;
  /** Whether to include multiplier evaluation */
  includeMultipliers?: boolean;
}

// =============================================================================
// Ranking Types
// =============================================================================

/**
 * Result of ranking an item
 */
export interface RankedItem<T> {
  /** The original item */
  item: T;
  /** Rank (1 = best) */
  rank: number;
  /** Number of items tied at this rank */
  tieCount: number;
}

/**
 * Direction for ranking comparison
 */
export type RankDirection = "lower" | "higher";

// =============================================================================
// Team Scoring Types
// =============================================================================

/**
 * Team scoring method from junk option calculation field
 */
export type TeamScoringMethod = "best_ball" | "sum" | "worst_ball" | "average";

/**
 * Result of team score calculation
 */
export interface TeamScoreResult {
  /** Calculated team score */
  score: number;
  /** Low ball (best individual score) */
  lowBall: number;
  /** Total (sum of scores) */
  total: number;
  /** Average score */
  average: number;
}

// =============================================================================
// Junk Evaluation Types
// =============================================================================

/**
 * Parsed score_to_par condition
 */
export interface ScoreToParCondition {
  /** Comparison operator */
  operator: "exactly" | "at_most" | "at_least";
  /** Target value */
  value: number;
}

/**
 * Parsed logic condition for rank-based junk
 */
export interface RankLogicCondition {
  /** Type of logic */
  type: "rankWithTies";
  /** Required rank (1 = first) */
  rank: number;
  /** Required tie count */
  tieCount: number;
}

/**
 * Context for evaluating junk/multiplier logic
 */
export interface EvaluationContext {
  /** Player's hole result */
  player: PlayerHoleResult;
  /** Team's hole result (if teams) */
  team?: TeamHoleResult;
  /** Hole info */
  hole: HoleInfo;
  /** Full scoring context */
  ctx: ScoringContext;
  /** Current hole number */
  holeNum: string;
}

// =============================================================================
// Points Engine Types
// =============================================================================

/**
 * Entry in a points lookup table
 */
export interface PointsTableEntry {
  /** Rank (1 = first) */
  rank: number;
  /** Tie count at this rank */
  tieCount: number;
  /** Points awarded */
  points: number;
}

/**
 * Points lookup table for ranking-based points
 */
export type PointsTable = PointsTableEntry[];

/**
 * Junk/multiplier that has been awarded (for points calculation)
 */
export interface AwardedJunk {
  /** Option name */
  name: string;
  /** Points value */
  value: number;
}

/**
 * Multiplier that has been applied
 */
export interface AppliedMultiplier {
  /** Option name */
  name: string;
  /** Multiplier value */
  value: number;
}

// =============================================================================
// Five Points Specific Types (to be removed when fully data-driven)
// =============================================================================

/**
 * Team score breakdown for Five Points
 * @deprecated Use TeamScoreResult instead - this is for backward compatibility
 */
export interface FivePointsTeamScore {
  /** Low ball (best individual net) */
  lowBall: number;
  /** Total (sum of nets) */
  total: number;
}

// =============================================================================
// Player Handicap Info (for pipeline context)
// =============================================================================

/**
 * Player handicap information extracted from RoundToGame
 */
export interface PlayerHandicapInfo {
  /** Player ID */
  playerId: string;
  /** RoundToGame ID (for reference) */
  roundToGameId: string;
  /** Effective handicap (gameHandicap ?? courseHandicap) */
  effectiveHandicap: number;
  /** Course handicap */
  courseHandicap: number;
  /** Game handicap override */
  gameHandicap?: number;
}
