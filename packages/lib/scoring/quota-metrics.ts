/**
 * Quota Metrics
 *
 * Extracts stableford totals and skin counts from a scored scoreboard.
 * Bridges the scoring pipeline output to the settlement engine input
 * for quota-type games (Big Game / Chicago).
 */

import type { PlayerQuota, Scoreboard } from "./types";

// =============================================================================
// Types
// =============================================================================

export interface StablefordTotals {
  /** Front nine stableford points (play order indices 0-8) */
  front: number;
  /** Back nine stableford points (play order indices 9-17) */
  back: number;
  /** Total 18-hole stableford points */
  total: number;
}

export interface QuotaPerformance {
  /** Player ID */
  playerId: string;
  /** Stableford points earned */
  stableford: StablefordTotals;
  /** Quota target */
  quota: { front: number; back: number; total: number };
  /** Performance = stableford - quota */
  performance: { front: number; back: number; total: number };
}

// =============================================================================
// Public API
// =============================================================================

/**
 * Extract stableford point totals from a scoreboard, split by nine.
 *
 * Sums all junk awards whose name starts with "stableford_" for each player.
 * Uses hole play order (scoreboard.meta.holesPlayed) to determine front vs back:
 * the first 9 holes in play order are front, the last 9 are back.
 *
 * @param scoreboard - Scored scoreboard from the pipeline
 * @returns Map of playerId → StablefordTotals
 */
export function extractStablefordTotals(
  scoreboard: Scoreboard,
): Map<string, StablefordTotals> {
  const totals = new Map<string, StablefordTotals>();
  const holesPlayed = scoreboard.meta.holesPlayed;

  // First 9 holes in play order = front, rest = back.
  // For 9-hole rounds, all holes are "front" (back totals stay 0).
  const frontHoles = new Set(holesPlayed.slice(0, 9));

  for (const holeNum of holesPlayed) {
    const holeResult = scoreboard.holes[holeNum];
    if (!holeResult) continue;

    const isFront = frontHoles.has(holeNum);

    for (const [playerId, playerResult] of Object.entries(holeResult.players)) {
      let playerTotals = totals.get(playerId);
      if (!playerTotals) {
        playerTotals = { front: 0, back: 0, total: 0 };
        totals.set(playerId, playerTotals);
      }

      for (const junk of playerResult.junk) {
        if (junk.name.startsWith("stableford_")) {
          playerTotals.total += junk.value;
          if (isFront) {
            playerTotals.front += junk.value;
          } else {
            playerTotals.back += junk.value;
          }
        }
      }
    }
  }

  return totals;
}

/**
 * Extract skin win counts from a scoreboard.
 *
 * Counts junk awards whose name ends with "_skin" for each player.
 * Matches gross_skin, gross_eagle_skin, net_skin, etc.
 *
 * @param scoreboard - Scored scoreboard from the pipeline
 * @returns Map of playerId → number of skins won
 */
export function extractSkinCounts(scoreboard: Scoreboard): Map<string, number> {
  const counts = new Map<string, number>();

  for (const holeNum of scoreboard.meta.holesPlayed) {
    const holeResult = scoreboard.holes[holeNum];
    if (!holeResult) continue;

    for (const [playerId, playerResult] of Object.entries(holeResult.players)) {
      for (const junk of playerResult.junk) {
        if (junk.name.endsWith("_skin")) {
          counts.set(playerId, (counts.get(playerId) ?? 0) + 1);
        }
      }
    }
  }

  return counts;
}

/**
 * Calculate full quota performance for all players.
 *
 * Combines stableford totals with player quotas to produce
 * per-player performance (stableford - quota) for front/back/total.
 *
 * @param scoreboard - Scored scoreboard from the pipeline
 * @param playerQuotas - Player quotas from the pipeline context
 * @returns Array of QuotaPerformance objects
 */
export function calculateQuotaPerformances(
  scoreboard: Scoreboard,
  playerQuotas: Map<string, PlayerQuota>,
): QuotaPerformance[] {
  const stablefordTotals = extractStablefordTotals(scoreboard);
  const performances: QuotaPerformance[] = [];

  for (const [playerId, quota] of playerQuotas) {
    const stableford = stablefordTotals.get(playerId) ?? {
      front: 0,
      back: 0,
      total: 0,
    };

    performances.push({
      playerId,
      stableford,
      quota: { front: quota.front, back: quota.back, total: quota.total },
      performance: {
        front: stableford.front - quota.front,
        back: stableford.back - quota.back,
        total: stableford.total - quota.total,
      },
    });
  }

  return performances;
}
