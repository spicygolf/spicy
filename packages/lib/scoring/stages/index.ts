/**
 * Pipeline Stages
 *
 * Pure functions that transform ScoringContext through the scoring pipeline.
 * Each stage receives context and returns updated context (immutable).
 */

export { calculateGrossScores } from "./gross-scores";
export { initializeScoreboard } from "./initialize";
export { calculateNetScores } from "./net-scores";
export { calculatePops } from "./pops";
export {
  rankPlayers,
  rankPlayersCumulative,
  rankTeams,
  rankTeamsCumulative,
} from "./ranking";
export {
  assignTeams,
  calculateAggregate,
  calculateBestBall,
  calculateFivePointsTeamScore,
} from "./teams";
