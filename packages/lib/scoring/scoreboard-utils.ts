/**
 * Scoreboard Utilities
 *
 * Shared helpers for reading team scoring results from the scoreboard.
 * Used by both Scoring and Leaderboard screens.
 */

import type { Scoreboard, TeamHoleResult } from "./types";

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

/** Stableford points awarded for par — the baseline for running totals. */
const STABLEFORD_PAR = 2;

/**
 * Get the quota-relative running score for a player through a given hole.
 *
 * Sums stableford junk earned from hole 1 through the current hole, then
 * subtracts the par baseline (2 points per hole with a score). The result
 * is the player's deviation from par — no nine-awareness or quota lookup
 * needed. Nine-specific quota is only used at settlement time.
 *
 * @param scoreboard - Scored scoreboard from the pipeline
 * @param playerId - Player ID to compute for
 * @param currentHole - Current hole number string (e.g., "5", "14")
 * @returns Deviation from par (e.g., +1 after a birdie, -1 after a bogey)
 */
export function getQuotaRunningScore(
  scoreboard: Scoreboard | null,
  playerId: string,
  currentHole: string,
): number {
  if (!scoreboard) return 0;

  const holesPlayed = scoreboard.meta.holesPlayed;
  const currentIndex = holesPlayed.indexOf(currentHole);
  if (currentIndex === -1) return 0;

  let stablefordTotal = 0;
  let holesWithScores = 0;

  for (let i = 0; i <= currentIndex; i++) {
    const holeNum = holesPlayed[i];
    if (!holeNum) continue;

    const holeResult = scoreboard.holes[holeNum];
    if (!holeResult) continue;

    const playerResult = holeResult.players[playerId];
    if (!playerResult || !playerResult.hasScore) continue;

    holesWithScores++;
    for (const junk of playerResult.junk) {
      if (junk.name.startsWith("stableford_")) {
        stablefordTotal += junk.value;
      }
    }
  }

  return stablefordTotal - holesWithScores * STABLEFORD_PAR;
}
