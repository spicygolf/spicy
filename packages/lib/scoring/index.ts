/**
 * Spicy Golf Scoring Engine
 *
 * Data-driven functional pipeline for calculating golf game scores.
 * All game rules come from GameSpec and Option data - NO game-specific code.
 *
 * @example
 * import { score } from '@spicy/lib/scoring';
 * const scoreboard = score(game);
 */

// Junk engine (data-driven junk evaluation)
export {
  evaluateJunkForHole,
  getJunkOptions,
  parseLogicCondition,
  parseScoreToParCondition,
} from "./junk-engine";
export type { LogicContext } from "./logic-engine";
// Logic engine (json-logic evaluation with custom operators)
export { evaluateLogic, isSimpleRankCheck } from "./logic-engine";
// Multiplier engine (data-driven multiplier evaluation)
export {
  calculateTotalMultiplier,
  evaluateAvailability,
  evaluateMultipliersForHole,
  getMultiplierOptions,
} from "./multiplier-engine";
// Option utilities (per-hole option value resolution)
export {
  getJunkOptionsForHole,
  getOptionForHole,
  getOptionValueForHole,
  isOptionOnHole,
} from "./option-utils";
// Main pipeline
export { buildContext, score } from "./pipeline";
// Points engine
export {
  calculatePoints,
  calculatePositionPoints,
  pointsFromTable,
  splitPoints,
} from "./points-engine";
// Ranking engine
export { rankWithTies } from "./ranking-engine";
// Pipeline stages (for testing/debugging)
export {
  assignTeams,
  calculateCumulatives,
  calculateGrossScores,
  calculateNetScores,
  calculatePoints as calculatePointsStage,
  calculatePops,
  calculateTeamScores,
  evaluateJunk,
  evaluateMultipliers,
  initializeScoreboard,
  rankPlayers,
  rankPlayersCumulative,
  rankTeams,
  rankTeamsCumulative,
} from "./stages";
export type { VegasScoreResult } from "./team-scoring";
// Team scoring (generic team calculation methods)
export {
  calculateAggregate,
  calculateAllTeamScores,
  calculateAverage,
  calculateBestBall,
  calculateTeamScore,
  calculateVegasScore,
  calculateWorstBall,
  countTeamJunk,
} from "./team-scoring";

// Core types
export type {
  AppliedMultiplier,
  AwardedJunk,
  EvaluationContext,
  FivePointsTeamScore,
  HoleInfo,
  HoleResult,
  JunkAward,
  MultiplierAward,
  PlayerCumulative,
  PlayerHandicapInfo,
  PlayerHoleResult,
  PlayerInfo,
  PointsTable,
  PointsTableEntry,
  RankDirection,
  RankedItem,
  RankLogicCondition,
  Scoreboard,
  ScoreToParCondition,
  ScoringContext,
  ScoringStage,
  ScoringWarning,
  TeamCumulative,
  TeamHoleResult,
  TeamScoreResult,
  TeamScoringMethod,
} from "./types";
