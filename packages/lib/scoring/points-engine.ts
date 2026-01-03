/**
 * Points Engine
 *
 * Calculates points based on rank and game rules.
 * Supports lookup tables for different game types and
 * handles junk/multiplier modifications.
 */

import type { AppliedMultiplier, AwardedJunk, PointsTable } from "./types";

/**
 * Look up points from a points table based on rank and tie count
 *
 * @param rank - Player/team rank (1 = first place)
 * @param tieCount - Number of items tied at this rank
 * @param table - Points lookup table
 * @returns Points awarded, or 0 if no matching entry
 *
 * @example
 * const table = [
 *   { rank: 1, tieCount: 1, points: 5 },
 *   { rank: 1, tieCount: 2, points: 4 },
 *   { rank: 2, tieCount: 1, points: 3 },
 * ];
 * pointsFromTable(1, 1, table); // 5 (outright winner)
 * pointsFromTable(1, 2, table); // 4 (tied for first)
 */
export function pointsFromTable(
  rank: number,
  tieCount: number,
  table: PointsTable,
): number {
  const entry = table.find((e) => e.rank === rank && e.tieCount === tieCount);
  return entry?.points ?? 0;
}

/**
 * Calculate total points with junk and multipliers
 *
 * Formula: (basePoints + sum(junkPoints)) * product(multipliers)
 *
 * @param basePoints - Points from ranking/scoring
 * @param junk - Array of awarded junk (each has a value)
 * @param multipliers - Array of applied multipliers (each has a value)
 * @returns Total points after junk and multipliers
 *
 * @example
 * // Base: 3 points, Birdie junk: +1, Double multiplier: 2x
 * calculatePoints(3, [{ name: 'birdie', value: 1 }], [{ name: 'double', value: 2 }]);
 * // Result: (3 + 1) * 2 = 8
 */
export function calculatePoints(
  basePoints: number,
  junk: AwardedJunk[],
  multipliers: AppliedMultiplier[],
): number {
  const junkPoints = junk.reduce((sum, j) => sum + j.value, 0);
  const multiplier = multipliers.reduce((prod, m) => prod * m.value, 1);
  return (basePoints + junkPoints) * multiplier;
}

/**
 * Split points evenly among tied players/teams
 *
 * When players tie, the total points available for their positions
 * are split evenly. For example, if 2 players tie for 1st in a game
 * where 1st gets 3 points and 2nd gets 2 points, each gets (3+2)/2 = 2.5.
 *
 * @param pointsToSplit - Array of points for tied positions
 * @returns Points per player (evenly split)
 *
 * @example
 * // Two players tie for 1st (1st=3pts, 2nd=2pts)
 * splitPoints([3, 2]); // 2.5 each
 *
 * // Three players tie for 1st (1st=5pts, 2nd=3pts, 3rd=2pts)
 * splitPoints([5, 3, 2]); // 3.33 each
 */
export function splitPoints(pointsToSplit: number[]): number {
  if (pointsToSplit.length === 0) return 0;
  const total = pointsToSplit.reduce((sum, p) => sum + p, 0);
  return total / pointsToSplit.length;
}

/**
 * Calculate points for a position with tie handling
 *
 * This is a convenience function that handles the common case of
 * calculating points when there might be ties.
 *
 * @param rank - The rank (1 = first)
 * @param tieCount - Number of items at this rank
 * @param pointsPerRank - Function that returns points for a given rank
 * @returns Points awarded (split if tied)
 *
 * @example
 * // 1st gets 3 points, 2nd gets 2 points
 * const pointsFn = (r: number) => r === 1 ? 3 : r === 2 ? 2 : 1;
 *
 * // Outright first place
 * calculatePositionPoints(1, 1, pointsFn); // 3
 *
 * // Tied for first (split 1st + 2nd points)
 * calculatePositionPoints(1, 2, pointsFn); // (3 + 2) / 2 = 2.5
 */
export function calculatePositionPoints(
  rank: number,
  tieCount: number,
  pointsPerRank: (rank: number) => number,
): number {
  if (tieCount === 1) {
    return pointsPerRank(rank);
  }

  // Collect points for all tied positions
  const pointsToSplit: number[] = [];
  for (let i = 0; i < tieCount; i++) {
    pointsToSplit.push(pointsPerRank(rank + i));
  }

  return splitPoints(pointsToSplit);
}
