/**
 * Spicy Golf Scoring Engine
 *
 * Functional pipeline for calculating golf game scores.
 *
 * @example
 * import { score } from '@spicy/lib/scoring';
 * const scoreboard = score(game);
 */

// Points engine
export {
  calculatePoints,
  calculatePositionPoints,
  pointsFromTable,
  splitPoints,
} from "./points-engine";

// Ranking engine
export {
  getAtRank,
  getWinners,
  hasTieAtRank,
  type RankedItem,
  rankWithTies,
} from "./ranking-engine";

// Core types
export type {
  AppliedMultiplier,
  AwardedJunk,
  FivePointsTeamScore,
  HoleInfo,
  HoleResult,
  PlayerCumulative,
  PlayerHandicapInfo,
  PlayerHoleResult,
  PointsTable,
  PointsTableEntry,
  RankDirection,
  Scoreboard,
  ScoringContext,
  ScoringStage,
  TeamCumulative,
  TeamHoleResult,
} from "./types";

// Pipeline stages (will be added as implemented)
// export { initializeScoreboard } from "./stages/initialize";
// export { calculateGrossScores } from "./stages/gross-scores";
// export { calculatePops } from "./stages/pops";
// export { calculateNetScores } from "./stages/net-scores";
// export { assignTeams } from "./stages/teams";
// export { rankPlayers, rankTeams } from "./stages/ranking";

// Games (will be added as implemented)
// export { fivePoints } from "./games/five-points";

// Main pipeline (will be added as implemented)
// export { score } from "./pipeline";
