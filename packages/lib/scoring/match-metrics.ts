/**
 * Match Metrics
 *
 * Extracts match play "holes won" from a scored scoreboard.
 * Bridges the scoring pipeline output to the settlement engine input
 * for match-type bets (Nassau, Match Play, Closeout).
 *
 * Supports two modes:
 * - Individual (no teams): compares PlayerHoleResult.net per hole
 * - Team (2-team): reads existing TeamHoleResult match data from cumulative stage
 */

import type { Scoreboard } from "./types";

// =============================================================================
// Types
// =============================================================================

/** Match play holes won, split by nine. */
interface MatchMetrics {
  /** Holes won on physical front nine (holes 1-9) */
  front: number;
  /** Holes won on physical back nine (holes 10-18) */
  back: number;
  /** Total holes won */
  total: number;
}

/** Scope for dynamic press bets. */
type MatchScope =
  | "front9"
  | "back9"
  | "all18"
  | "rest_of_nine"
  | "rest_of_round";

// =============================================================================
// Internal Helpers
// =============================================================================

/**
 * Determine the winner of a single hole by comparing net scores.
 *
 * @param players - Player results for the hole
 * @returns The player ID of the sole lowest-net player, or null if tied/halved
 */
function findHoleWinner(
  players: Record<string, { hasScore: boolean; net: number }>,
): string | null {
  let lowestNet = Infinity;
  let winnerId: string | null = null;
  let tied = false;

  for (const [playerId, result] of Object.entries(players)) {
    if (!result.hasScore) continue;

    if (result.net < lowestNet) {
      lowestNet = result.net;
      winnerId = playerId;
      tied = false;
    } else if (result.net === lowestNet) {
      tied = true;
    }
  }

  return tied ? null : winnerId;
}

/**
 * Get the set of hole numbers that fall within a scope.
 *
 * @param holesPlayed - Ordered hole numbers from scoreboard.meta.holesPlayed
 * @param scope - The bet scope
 * @param startHoleIndex - Starting index for dynamic scopes
 * @returns Set of hole number strings in the scope
 */
function getHolesInScope(
  holesPlayed: string[],
  scope: MatchScope,
  startHoleIndex?: number,
): Set<string> {
  switch (scope) {
    case "front9":
      return new Set(holesPlayed.slice(0, 9));
    case "back9":
      return new Set(holesPlayed.slice(9, 18));
    case "all18":
      return new Set(holesPlayed);
    case "rest_of_nine": {
      const start = startHoleIndex ?? 0;
      // End of current nine: index 8 or 17
      const nineEnd = start < 9 ? 9 : 18;
      return new Set(holesPlayed.slice(start, nineEnd));
    }
    case "rest_of_round": {
      const start = startHoleIndex ?? 0;
      return new Set(holesPlayed.slice(start));
    }
  }
}

// =============================================================================
// Public API
// =============================================================================

/**
 * Extract match play "holes won" metrics from a scoreboard for individual games.
 *
 * For each hole, the player with the sole lowest net score wins (+1).
 * Tied holes are halved (no points awarded). Results are aligned to
 * physical course sides (holes 1-9 = front, 10-18 = back) regardless
 * of play order, matching the pattern in calculateQuotaPerformances.
 *
 * @param scoreboard - Scored scoreboard from the pipeline
 * @returns Map of playerId → MatchMetrics (holes won per nine)
 */
function extractMatchMetrics(
  scoreboard: Scoreboard,
): Map<string, MatchMetrics> {
  const metrics = new Map<string, MatchMetrics>();
  const holesPlayed = scoreboard.meta.holesPlayed;
  const frontHoles = new Set(holesPlayed.slice(0, 9));

  // Align play-order nines to physical course sides for shotgun starts.
  const firstHole = holesPlayed[0];
  const startsOnBack =
    firstHole !== undefined && Number.parseInt(firstHole, 10) >= 10;

  // Ensure all players have entries
  for (const holeNum of holesPlayed) {
    const holeResult = scoreboard.holes[holeNum];
    if (!holeResult) continue;
    for (const playerId of Object.keys(holeResult.players)) {
      if (!metrics.has(playerId)) {
        metrics.set(playerId, { front: 0, back: 0, total: 0 });
      }
    }
  }

  // Count holes won per play-order nine
  const playFront = new Map<string, number>();
  const playBack = new Map<string, number>();

  for (const holeNum of holesPlayed) {
    const holeResult = scoreboard.holes[holeNum];
    if (!holeResult) continue;

    const winnerId = findHoleWinner(holeResult.players);
    if (!winnerId) continue;

    const isFront = frontHoles.has(holeNum);
    const map = isFront ? playFront : playBack;
    map.set(winnerId, (map.get(winnerId) ?? 0) + 1);
  }

  // Write aligned metrics
  for (const [playerId, m] of metrics) {
    const pf = playFront.get(playerId) ?? 0;
    const pb = playBack.get(playerId) ?? 0;

    m.front = startsOnBack ? pb : pf;
    m.back = startsOnBack ? pf : pb;
    m.total = pf + pb;
  }

  return metrics;
}

/**
 * Extract match play "holes won" for a specific scope.
 *
 * Used for dynamic press bet scopes (rest_of_nine, rest_of_round)
 * where the standard front/back/total split doesn't apply.
 *
 * @param scoreboard - Scored scoreboard from the pipeline
 * @param scope - Bet scope defining which holes to include
 * @param startHoleIndex - Starting play-order index for dynamic scopes
 * @returns Map of playerId → number of holes won in the scope
 */
function extractMatchMetricsForScope(
  scoreboard: Scoreboard,
  scope: MatchScope,
  startHoleIndex?: number,
): Map<string, number> {
  const counts = new Map<string, number>();
  const holesPlayed = scoreboard.meta.holesPlayed;
  const scopeHoles = getHolesInScope(holesPlayed, scope, startHoleIndex);

  // Ensure all players have entries
  for (const holeNum of holesPlayed) {
    const holeResult = scoreboard.holes[holeNum];
    if (!holeResult) continue;
    for (const playerId of Object.keys(holeResult.players)) {
      if (!counts.has(playerId)) {
        counts.set(playerId, 0);
      }
    }
  }

  for (const holeNum of holesPlayed) {
    if (!scopeHoles.has(holeNum)) continue;
    const holeResult = scoreboard.holes[holeNum];
    if (!holeResult) continue;

    const winnerId = findHoleWinner(holeResult.players);
    if (!winnerId) continue;

    counts.set(winnerId, (counts.get(winnerId) ?? 0) + 1);
  }

  return counts;
}

export type { MatchMetrics, MatchScope };
export { extractMatchMetrics, extractMatchMetricsForScope, findHoleWinner };
