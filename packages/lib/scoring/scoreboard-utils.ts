/**
 * Scoreboard Utilities
 *
 * Shared helpers for reading team scoring results from the scoreboard.
 * Used by both Scoring and Leaderboard screens.
 */

import type { PlayerQuota, Scoreboard, TeamHoleResult } from "./types";

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

/**
 * Get the quota-relative running score for a player through a given hole.
 *
 * Uses play order (scoreboard.meta.holesPlayed) to determine front/back nine,
 * so shotgun starts work correctly. Sums stableford junk earned on the current
 * nine through the given hole, then subtracts the nine's quota.
 *
 * @param scoreboard - Scored scoreboard from the pipeline
 * @param playerId - Player ID to compute for
 * @param currentHole - Current hole number string (e.g., "5", "14")
 * @param quota - Player's quota (front/back/total)
 * @returns Performance vs quota (e.g., -2 means 2 under quota so far)
 */
export function getQuotaRunningScore(
  scoreboard: Scoreboard | null,
  playerId: string,
  currentHole: string,
  quota: PlayerQuota,
): number {
  if (!scoreboard) return 0;

  const holesPlayed = scoreboard.meta.holesPlayed;
  const currentIndex = holesPlayed.indexOf(currentHole);
  if (currentIndex === -1) return 0;

  // First 9 holes in play order = front nine, rest = back nine
  const isBackNine = currentIndex >= 9;
  const nineQuota = isBackNine ? quota.back : quota.front;
  const nineStartIndex = isBackNine ? 9 : 0;

  // Sum stableford points for this player on holes in the current nine,
  // up to and including the current hole
  let stablefordTotal = 0;

  for (let i = nineStartIndex; i <= currentIndex; i++) {
    const holeNum = holesPlayed[i];
    if (!holeNum) continue;

    const holeResult = scoreboard.holes[holeNum];
    if (!holeResult) continue;

    const playerResult = holeResult.players[playerId];
    if (!playerResult) continue;

    for (const junk of playerResult.junk) {
      if (junk.name.startsWith("stableford_")) {
        stablefordTotal += junk.value;
      }
    }
  }

  return stablefordTotal - nineQuota;
}
