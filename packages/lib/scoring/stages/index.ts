/**
 * Pipeline Stages
 *
 * Pure functions that transform ScoringContext through the scoring pipeline.
 * Each stage receives context and returns updated context (immutable).
 */

export { calculateCumulatives } from "./cumulative";
export { calculateGrossScores } from "./gross-scores";
export { initializeScoreboard } from "./initialize";
export { evaluateJunk } from "./junk";
export { evaluateMultipliers } from "./multipliers";
export { calculateNetScores } from "./net-scores";
export { calculatePoints } from "./points";
export { calculatePops } from "./pops";
export {
  rankPlayers,
  rankPlayersCumulative,
  rankTeams,
  rankTeamsCumulative,
} from "./ranking";
export { calculateTeamScores } from "./team-scores";
export { assignTeams } from "./teams";
