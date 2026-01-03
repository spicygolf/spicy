/**
 * Scoring Engine Types
 *
 * Core types for the functional scoring pipeline.
 * All types are immutable - pipeline stages return new contexts, not mutate.
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
// Scoreboard Output Types
// =============================================================================

/**
 * Junk awarded to a player or team
 */
export interface AwardedJunk {
  /** Option name (e.g., "birdie", "sandie") */
  name: string;
  /** Points value */
  value: number;
  /** Player who earned it (for team attribution) */
  playerId?: string;
}

/**
 * Multiplier applied to scoring
 */
export interface AppliedMultiplier {
  /** Option name (e.g., "double", "press") */
  name: string;
  /** Multiplier value (e.g., 2 for double) */
  value: number;
}

/**
 * Per-hole result for a single player
 */
export interface PlayerHoleResult {
  /** Player ID */
  playerId: string;
  /** Gross score (strokes) */
  gross: number;
  /** Strokes received/given (pops) */
  pops: number;
  /** Net score (gross - pops) */
  net: number;
  /** Rank among players (1 = best) */
  rank: number;
  /** Number of players tied at this rank */
  tieCount: number;
  /** Junk awarded this hole */
  junk: AwardedJunk[];
  /** Multipliers applied this hole */
  multipliers: AppliedMultiplier[];
  /** Points earned this hole */
  points: number;
}

/**
 * Per-hole result for a team
 */
export interface TeamHoleResult {
  /** Team identifier */
  teamId: string;
  /** Team score (best ball, aggregate, etc. depending on game) */
  score: number;
  /** Rank among teams (1 = best) */
  rank: number;
  /** Number of teams tied at this rank */
  tieCount: number;
  /** Junk awarded to team this hole */
  junk: AwardedJunk[];
  /** Multipliers applied this hole */
  multipliers: AppliedMultiplier[];
  /** Points earned this hole */
  points: number;
  /** Player IDs on this team */
  playerIds: string[];
}

/**
 * Results for a single hole
 */
export interface HoleResult {
  /** Hole number (1-indexed) */
  holeNum: string;
  /** Par for this hole */
  par: number;
  /** Results keyed by player ID */
  players: Record<string, PlayerHoleResult>;
  /** Results keyed by team ID */
  teams: Record<string, TeamHoleResult>;
}

/**
 * Cumulative totals for a player across all holes
 */
export interface PlayerCumulative {
  playerId: string;
  /** Total gross strokes */
  grossTotal: number;
  /** Total pops received */
  popsTotal: number;
  /** Total net strokes */
  netTotal: number;
  /** Total points earned */
  pointsTotal: number;
  /** Overall rank */
  rank: number;
  /** Number tied at this rank */
  tieCount: number;
}

/**
 * Cumulative totals for a team across all holes
 */
export interface TeamCumulative {
  teamId: string;
  /** Total team score */
  scoreTotal: number;
  /** Total points earned */
  pointsTotal: number;
  /** Overall rank */
  rank: number;
  /** Number tied at this rank */
  tieCount: number;
}

/**
 * Complete scoreboard for a game
 */
export interface Scoreboard {
  /** Results keyed by hole number ("1"-"18") */
  holes: Record<string, HoleResult>;
  /** Cumulative results */
  cumulative: {
    players: Record<string, PlayerCumulative>;
    teams: Record<string, TeamCumulative>;
  };
}

// =============================================================================
// Scoring Context (Pipeline State)
// =============================================================================

/**
 * Player handicap info extracted from RoundToGame
 */
export interface PlayerHandicapInfo {
  playerId: string;
  roundToGameId: string;
  /** Effective handicap (gameHandicap ?? courseHandicap) */
  effectiveHandicap: number;
  /** Course handicap from RoundToGame */
  courseHandicap: number;
  /** Game handicap override (if any) */
  gameHandicap?: number;
}

/**
 * Hole info extracted from course/tee data
 */
export interface HoleInfo {
  /** Hole number (1-indexed) */
  holeNum: string;
  /** Par for this hole */
  par: number;
  /** Handicap allocation (1=hardest, 18=easiest) */
  handicapAllocation: number;
  /** Yardage */
  yards?: number;
}

/**
 * Immutable context passed through the scoring pipeline.
 *
 * Each pipeline stage receives a context and returns a new context
 * with updated results. The original context is never mutated.
 */
export interface ScoringContext {
  // -------------------------------------------------------------------------
  // Input Data (from Jazz)
  // -------------------------------------------------------------------------

  /** The game being scored */
  readonly game: Game;

  /** Primary game spec (first in game.specs) */
  readonly gameSpec: GameSpec;

  /** Merged options (game.options with defaults from spec) */
  readonly options: MapOfOptions;

  /** Game holes in play order */
  readonly holes: GameHole[];

  /** Player rounds linked to game */
  readonly rounds: RoundToGame[];

  // -------------------------------------------------------------------------
  // Computed Lookups (built once, reused)
  // -------------------------------------------------------------------------

  /** Player handicaps: playerId -> handicap info */
  readonly playerHandicaps: Map<string, PlayerHandicapInfo>;

  /** Hole info: holeNum -> hole data (par, handicap allocation) */
  readonly holeInfo: Map<string, HoleInfo>;

  /** Teams per hole: holeNum -> teams on that hole */
  readonly teamsPerHole: Map<string, Team[]>;

  // -------------------------------------------------------------------------
  // Results (built up through pipeline)
  // -------------------------------------------------------------------------

  /** The scoreboard being constructed */
  readonly scoreboard: Scoreboard;
}

/**
 * Pipeline stage function signature.
 * Each stage receives context and returns updated context (immutable).
 */
export type ScoringStage = (ctx: ScoringContext) => ScoringContext;

// =============================================================================
// Points Table Types
// =============================================================================

/**
 * Entry in a points lookup table
 */
export interface PointsTableEntry {
  /** Rank (1 = first place) */
  rank: number;
  /** Number of players/teams tied at this rank */
  tieCount: number;
  /** Points awarded */
  points: number;
}

/**
 * Points table for a game type
 */
export type PointsTable = PointsTableEntry[];

// =============================================================================
// Game-Specific Types
// =============================================================================

/**
 * Five Points team score breakdown
 */
export interface FivePointsTeamScore {
  /** Best ball (lowest net on team) */
  lowBall: number;
  /** Total of both players' nets */
  total: number;
}

/**
 * Ranking comparison direction
 */
export type RankDirection = "lower" | "higher";
