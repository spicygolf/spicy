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
  let scoredCount = 0;
  const totalPlayers = Object.keys(players).length;

  for (const [playerId, result] of Object.entries(players)) {
    if (!result.hasScore) continue;
    scoredCount++;

    if (result.net < lowestNet) {
      lowestNet = result.net;
      winnerId = playerId;
      tied = false;
    } else if (result.net === lowestNet) {
      tied = true;
    }
  }

  // No winner unless all players have scored
  if (scoredCount < totalPlayers) return null;

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

// =============================================================================
// Per-Bet Match State
// =============================================================================

/** Match state for a single bet from one player's perspective. */
interface BetMatchState {
  /** Bet option name (e.g., "front_match", "press_front_match_1") */
  betName: string;
  /** Display label (e.g., "Front", "P1") */
  betDisp: string;
  /** Dollar amount for the bet */
  amount?: number;
  /** Diff: positive = up, negative = down, 0 = tied */
  diff: number;
  /** Parent bet name for grouping presses under their base bet */
  parentBetName?: string;
  /** Whether this bet is mathematically decided (lead > remaining holes) */
  clinched?: boolean;
  /** Display label for clinch result (e.g., "Won 3&2", "Lost 3&2") */
  clinchLabel?: string;
}

/** Minimal bet info needed for computing match states. */
interface BetInfo {
  name: string;
  disp: string;
  scope: string;
  scoringType: string;
  amount?: number;
  startHoleIndex?: number;
  parentBetName?: string;
}

/**
 * Compute per-bet match state for a player across all match-type bets.
 *
 * Shows running state through a specific hole (not overall totals).
 * For each bet with scoringType "match", counts holes won vs opponent
 * within that bet's scope, up to and including throughHoleIndex.
 *
 * @param scoreboard - Scored scoreboard from the pipeline
 * @param bets - Active bets (base + presses)
 * @param playerId - The player to compute state for
 * @param throughHoleIndex - Only count holes up to this play-order index (inclusive)
 * @returns Array of BetMatchState, one per match-type bet
 */
function computeBetMatchStates(
  scoreboard: Scoreboard,
  bets: BetInfo[],
  playerId: string,
  throughHoleIndex?: number,
): BetMatchState[] {
  const states: BetMatchState[] = [];
  const holesPlayed = scoreboard.meta.holesPlayed;

  // Limit to holes through the current index
  const limitedHoles =
    throughHoleIndex !== undefined
      ? holesPlayed.slice(0, throughHoleIndex + 1)
      : holesPlayed;

  for (const bet of bets) {
    if (bet.scoringType !== "match") continue;

    // Skip bets that haven't started yet at the viewed hole
    if (
      bet.startHoleIndex !== undefined &&
      throughHoleIndex !== undefined &&
      throughHoleIndex < bet.startHoleIndex
    ) {
      continue;
    }

    const scope = bet.scope as MatchScope;
    const scopeHoles = getHolesInScope(limitedHoles, scope, bet.startHoleIndex);

    // Count holes won per player within scope, tracking clinch hole-by-hole.
    // Once clinched, the result freezes — subsequent holes don't change it.
    const fullScopeHoles = getHolesInScope(
      holesPlayed,
      scope,
      bet.startHoleIndex,
    );
    const startIdx = bet.startHoleIndex ?? 0;
    const betHoles = startIdx > 0 ? limitedHoles.slice(startIdx) : limitedHoles;

    // Total holes this bet covers: scope intersected with startHoleIndex.
    // For presses with "same" scope (front9/back9/all18), the bet only covers
    // holes from startHoleIndex onward, not the entire scope.
    let totalInScope = 0;
    const allBetHoles =
      startIdx > 0 ? holesPlayed.slice(startIdx) : holesPlayed;
    for (const h of allBetHoles) {
      if (fullScopeHoles.has(h)) totalInScope++;
    }

    let playerWon = 0;
    let opponentWon = 0;
    let holesScored = 0;
    let clinched = false;
    let clinchDiff = 0;
    let clinchRemaining = 0;

    for (const holeNum of betHoles) {
      if (!scopeHoles.has(holeNum)) continue;
      const holeResult = scoreboard.holes[holeNum];
      if (!holeResult) continue;

      const allScored = Object.values(holeResult.players).every(
        (p) => p.hasScore,
      );
      if (!allScored) continue;
      holesScored++;

      const winnerId = findHoleWinner(holeResult.players);
      if (winnerId === playerId) {
        playerWon++;
      } else if (winnerId) {
        opponentWon++;
      }

      // Check clinch after each scored hole
      if (!clinched) {
        const diff = playerWon - opponentWon;
        const remaining = totalInScope - holesScored;
        if (Math.abs(diff) > remaining) {
          clinched = true;
          clinchDiff = diff;
          clinchRemaining = remaining;
        }
      }
    }

    const diff = clinched ? clinchDiff : playerWon - opponentWon;

    let clinchLabel: string | undefined;
    if (clinched) {
      const absDiff = Math.abs(clinchDiff);
      const winLose = clinchDiff > 0 ? "Won" : "Lost";
      if (clinchRemaining > 0) {
        clinchLabel = `${winLose} ${absDiff}&${clinchRemaining}`;
      } else {
        clinchLabel = absDiff === 0 ? "Halved" : `${winLose} ${absDiff} up`;
      }
    }

    states.push({
      betName: bet.name,
      betDisp: bet.disp,
      amount: bet.amount,
      diff,
      parentBetName: bet.parentBetName,
      clinched: clinched || undefined,
      clinchLabel,
    });
  }

  return states;
}

export type { BetInfo, BetMatchState, MatchMetrics, MatchScope };
export {
  computeBetMatchStates,
  extractMatchMetrics,
  extractMatchMetricsForScope,
  findHoleWinner,
};
