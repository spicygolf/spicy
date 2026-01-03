/**
 * Ranking Engine
 *
 * Handles ranking with proper tie handling for golf scoring.
 * In golf, lower scores are better, and ties skip subsequent ranks.
 *
 * Example: scores [3, 3, 4, 5] produce ranks [1, 1, 3, 4]
 * (Two players tie for 1st, next player is 3rd, not 2nd)
 */

import type { RankDirection } from "./types";

/**
 * Result of ranking an item
 */
export interface RankedItem<T> {
  /** The original item */
  item: T;
  /** Rank (1 = best) */
  rank: number;
  /** Number of items tied at this rank */
  tieCount: number;
}

/**
 * Ranking Engine for golf scoring
 *
 * Provides static methods for ranking items with proper tie handling.
 * Ties are assigned the same rank, and subsequent ranks are skipped.
 */
export class RankingEngine {
  /**
   * Rank items with tie handling
   *
   * @param items - Items to rank
   * @param scoreGetter - Function to extract score from item
   * @param better - Direction: "lower" for golf (par/strokes), "higher" for points
   * @returns Array of ranked items sorted by rank (best first)
   *
   * @example
   * // Golf scores (lower is better)
   * const scores = [
   *   { id: 'alice', score: 4 },
   *   { id: 'bob', score: 3 },
   *   { id: 'carol', score: 3 },
   *   { id: 'dave', score: 5 },
   * ];
   * const ranked = RankingEngine.rankWithTies(scores, s => s.score, 'lower');
   * // Result: bob=1st, carol=1st (tie), alice=3rd, dave=4th
   */
  static rankWithTies<T>(
    items: T[],
    scoreGetter: (item: T) => number,
    better: RankDirection = "lower",
  ): RankedItem<T>[] {
    if (items.length === 0) {
      return [];
    }

    // Sort by score (best first)
    const sorted = [...items].sort((a, b) => {
      const diff = scoreGetter(a) - scoreGetter(b);
      return better === "lower" ? diff : -diff;
    });

    const results: RankedItem<T>[] = [];
    let currentRank = 1;
    let i = 0;

    while (i < sorted.length) {
      const currentScore = scoreGetter(sorted[i]);

      // Count items tied at this score
      let tieCount = 1;
      while (
        i + tieCount < sorted.length &&
        scoreGetter(sorted[i + tieCount]) === currentScore
      ) {
        tieCount++;
      }

      // Assign same rank to all tied items
      for (let j = 0; j < tieCount; j++) {
        results.push({
          item: sorted[i + j],
          rank: currentRank,
          tieCount,
        });
      }

      // Skip ranks for ties (1st, 1st -> next is 3rd)
      currentRank += tieCount;
      i += tieCount;
    }

    return results;
  }

  /**
   * Check if there's a tie at a specific rank
   *
   * @param rankedItems - Result from rankWithTies
   * @param rank - Rank to check (1-indexed)
   * @returns true if multiple items share this rank
   */
  static hasTieAtRank<T>(rankedItems: RankedItem<T>[], rank: number): boolean {
    const atRank = rankedItems.filter((r) => r.rank === rank);
    return atRank.length > 1;
  }

  /**
   * Get items at a specific rank
   *
   * @param rankedItems - Result from rankWithTies
   * @param rank - Rank to get (1-indexed)
   * @returns Items at that rank (may be multiple if tied)
   */
  static getAtRank<T>(rankedItems: RankedItem<T>[], rank: number): T[] {
    return rankedItems.filter((r) => r.rank === rank).map((r) => r.item);
  }

  /**
   * Get the winner (items at rank 1)
   *
   * @param rankedItems - Result from rankWithTies
   * @returns Array of winners (may be multiple if tied for first)
   */
  static getWinners<T>(rankedItems: RankedItem<T>[]): T[] {
    return RankingEngine.getAtRank(rankedItems, 1);
  }
}
