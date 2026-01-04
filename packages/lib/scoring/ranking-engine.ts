/**
 * Ranking Engine
 *
 * Generic ranking algorithm with proper tie handling.
 * Works for any game - no game-specific code.
 *
 * Golf ranking convention:
 * - Lower scores are better (direction: "lower")
 * - Ties share the same rank
 * - Next rank skips (1, 1, 3 not 1, 1, 2)
 */

import type { RankDirection, RankedItem } from "./types";

/**
 * Rank items with proper tie handling.
 *
 * @param items - Array of items to rank
 * @param scoreGetter - Function to extract score from an item
 * @param direction - "lower" (golf: lower is better) or "higher" (points: higher is better)
 * @returns Array of ranked items with rank and tieCount
 *
 * @example
 * // Golf scores: lower is better
 * const scores = [
 *   { id: 'a', score: 4 },
 *   { id: 'b', score: 3 },
 *   { id: 'c', score: 3 },
 *   { id: 'd', score: 5 },
 * ];
 * const ranked = rankWithTies(scores, s => s.score, 'lower');
 * // Result:
 * // [
 * //   { item: { id: 'b', score: 3 }, rank: 1, tieCount: 2 },
 * //   { item: { id: 'c', score: 3 }, rank: 1, tieCount: 2 },
 * //   { item: { id: 'a', score: 4 }, rank: 3, tieCount: 1 },
 * //   { item: { id: 'd', score: 5 }, rank: 4, tieCount: 1 },
 * // ]
 */
export function rankWithTies<T>(
  items: T[],
  scoreGetter: (item: T) => number,
  direction: RankDirection = "lower",
): RankedItem<T>[] {
  if (items.length === 0) {
    return [];
  }

  // Sort by score
  const sorted = [...items].sort((a, b) => {
    const diff = scoreGetter(a) - scoreGetter(b);
    return direction === "lower" ? diff : -diff;
  });

  const results: RankedItem<T>[] = [];
  let currentRank = 1;
  let i = 0;

  while (i < sorted.length) {
    const currentItem = sorted[i];
    if (currentItem === undefined) break;

    const currentScore = scoreGetter(currentItem);

    // Count ties at this score
    let tieCount = 1;
    while (i + tieCount < sorted.length) {
      const nextItem = sorted[i + tieCount];
      if (nextItem === undefined || scoreGetter(nextItem) !== currentScore) {
        break;
      }
      tieCount++;
    }

    // Assign same rank to all tied items
    for (let j = 0; j < tieCount; j++) {
      const tiedItem = sorted[i + j];
      if (tiedItem !== undefined) {
        results.push({
          item: tiedItem,
          rank: currentRank,
          tieCount,
        });
      }
    }

    // Skip ranks for ties (1st, 1st -> next is 3rd)
    currentRank += tieCount;
    i += tieCount;
  }

  return results;
}

/**
 * Check if a rank/tieCount matches a condition.
 * Used by junk options with logic like "{'rankWithTies': [1, 1]}" for outright winner.
 *
 * @param actualRank - The player/team's actual rank
 * @param actualTieCount - The actual number of items tied at this rank
 * @param targetRank - The required rank (e.g., 1 for first place)
 * @param targetTieCount - The required tie count (e.g., 1 for outright, 2 for two-way tie)
 * @returns true if the condition matches
 *
 * @example
 * // Outright winner: rank 1 with no ties
 * matchesRankCondition(1, 1, 1, 1) // true
 * matchesRankCondition(1, 2, 1, 1) // false (two-way tie)
 *
 * // Two-way tie for first
 * matchesRankCondition(1, 2, 1, 2) // true
 *
 * // All three tied
 * matchesRankCondition(1, 3, 1, 3) // true
 */
export function matchesRankCondition(
  actualRank: number,
  actualTieCount: number,
  targetRank: number,
  targetTieCount: number,
): boolean {
  return actualRank === targetRank && actualTieCount === targetTieCount;
}

/**
 * Get the rank of a specific item from ranked results.
 *
 * @param rankedItems - Array of ranked items
 * @param item - The item to find
 * @param idGetter - Function to get unique ID from item
 * @returns The rank info or undefined if not found
 */
export function getRankInfo<T>(
  rankedItems: RankedItem<T>[],
  item: T,
  idGetter: (item: T) => string,
): { rank: number; tieCount: number } | undefined {
  const id = idGetter(item);
  const found = rankedItems.find((r) => idGetter(r.item) === id);
  if (!found) return undefined;
  return { rank: found.rank, tieCount: found.tieCount };
}

/**
 * Create a lookup map from ranked items for O(1) access.
 *
 * @param rankedItems - Array of ranked items
 * @param idGetter - Function to get unique ID from item
 * @returns Map from ID to rank info
 */
export function createRankLookup<T>(
  rankedItems: RankedItem<T>[],
  idGetter: (item: T) => string,
): Map<string, { rank: number; tieCount: number }> {
  const lookup = new Map<string, { rank: number; tieCount: number }>();
  for (const ranked of rankedItems) {
    lookup.set(idGetter(ranked.item), {
      rank: ranked.rank,
      tieCount: ranked.tieCount,
    });
  }
  return lookup;
}
