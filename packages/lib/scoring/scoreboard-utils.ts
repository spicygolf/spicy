/**
 * Scoreboard Utilities
 *
 * Shared helpers for reading team scoring results from the scoreboard.
 * Used by both Scoring and Leaderboard screens.
 */

import type { TeamHoleResult } from "./types";

/**
 * Get the effective hole points for a team.
 * For 2-team games, returns holeNetTotal (net vs opponent).
 * For individual/multi-team games, returns absolute points.
 *
 * @param team - Team hole result from the scoreboard
 * @returns Effective points for display
 */
export function getTeamHolePoints(
  team: TeamHoleResult | null | undefined,
): number {
  if (!team) return 0;
  return team.holeNetTotal ?? team.points;
}

/**
 * Get the effective running score for a team.
 * For 2-team games, returns runningDiff (differential vs opponent).
 * For individual/multi-team games, returns runningTotal (cumulative points).
 *
 * @param team - Team hole result from the scoreboard
 * @returns Effective running score for display
 */
export function getTeamRunningScore(
  team: TeamHoleResult | null | undefined,
): number {
  if (!team) return 0;
  return team.runningDiff ?? team.runningTotal ?? 0;
}
