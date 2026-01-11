import { useMemo, useRef } from "react";
import type { Game } from "spicylib/schema";
import type { Scoreboard, ScoringContext } from "spicylib/scoring";
import { scoreWithContext } from "spicylib/scoring";

// Track hook invocations for performance debugging
let hookInvocationCount = 0;

/**
 * Result from the useScoreboard hook
 */
export interface ScoreboardResult {
  /** The calculated scoreboard with all hole results */
  scoreboard: Scoreboard;
  /** The full scoring context (needed for availability checks) */
  context: ScoringContext;
}

/**
 * Create a fingerprint of the scoring-relevant data in a game.
 * This fingerprint changes only when data that affects scoring changes,
 * not when the Jazz object reference changes due to progressive loading.
 *
 * Returns null if the game isn't ready for scoring yet.
 */
function createScoringFingerprint(game: Game | null): string | null {
  if (!game?.$isLoaded) return null;
  if (!game.specs?.$isLoaded || game.specs.length === 0) return null;

  const spec = game.specs[0];
  if (!spec?.$isLoaded || !spec.options?.$isLoaded) return null;
  if (!game.holes?.$isLoaded || game.holes.length === 0) return null;
  if (!game.rounds?.$isLoaded || game.rounds.length === 0) return null;

  const parts: string[] = [];

  // 1. Game ID (base identity)
  parts.push(`game:${game.$jazz.id}`);

  // 2. Hole count
  parts.push(`holes:${game.holes.length}`);

  // 3. All scores from all rounds (this is the primary data that changes)
  for (const rtg of game.rounds) {
    if (!rtg?.$isLoaded) continue;
    const round = rtg.round;
    if (!round?.$isLoaded) continue;

    const playerId = round.playerId;
    const handicapIndex = rtg.handicapIndex ?? round.handicapIndex ?? 0;
    const courseHandicap = rtg.courseHandicap ?? 0;
    const gameHandicap = rtg.gameHandicap;

    parts.push(
      `p:${playerId}:hi${handicapIndex}:ch${courseHandicap}:gh${gameHandicap ?? ""}`,
    );

    // Add all scores for this player
    if (round.scores?.$isLoaded) {
      for (const key of Object.keys(round.scores)) {
        if (key.startsWith("$") || key === "_refs") continue;
        const holeScores = round.scores[key];
        if (holeScores?.$isLoaded) {
          const gross = holeScores.gross ?? "";
          parts.push(`s:${playerId}:${key}:${gross}`);
        }
      }
    }
  }

  // 4. Team options per hole (junk, multipliers)
  for (const hole of game.holes) {
    if (!hole?.$isLoaded) continue;
    const holeNum = hole.hole;

    if (hole.teams?.$isLoaded) {
      for (const team of hole.teams) {
        if (!team?.$isLoaded) continue;
        const teamId = team.team ?? "";

        if (team.options?.$isLoaded) {
          for (const opt of team.options) {
            if (!opt?.$isLoaded) continue;
            // Include option name, value, playerId (for player junk), and firstHole (for multipliers)
            parts.push(
              `to:${holeNum}:${teamId}:${opt.optionName}:${opt.value ?? ""}:${opt.playerId ?? ""}:${opt.firstHole ?? ""}`,
            );
          }
        }
      }
    }
  }

  // 5. Game-level option overrides (if any)
  if (game.options?.$isLoaded) {
    for (const key of Object.keys(game.options)) {
      if (key.startsWith("$") || key === "_refs") continue;
      const opt = game.options[key];
      if (opt?.$isLoaded && opt.value !== undefined) {
        parts.push(`go:${key}:${opt.value}`);
      }
    }
  }

  return parts.join("|");
}

/**
 * Hook to calculate the scoreboard for a game using the scoring engine.
 *
 * The scoring engine calculates:
 * - Player junk (birdie, eagle) based on score_to_par conditions
 * - Team junk (low_ball, low_team) based on calculation rules
 * - Points, rankings, and cumulative totals
 *
 * The scoreboard is memoized based on a fingerprint of scoring-relevant data,
 * not the game object reference. This prevents unnecessary recomputations
 * during Jazz's progressive loading.
 *
 * @param game - The fully loaded game object
 * @returns The calculated scoreboard and context, or null if scoring fails
 *
 * @example
 * const result = useScoreboard(game);
 * if (result) {
 *   const holeResult = result.scoreboard.holes["1"];
 *   const playerJunk = holeResult.players[playerId].junk;
 *   const teamJunk = holeResult.teams[teamId].junk;
 * }
 */
export function useScoreboard(game: Game | null): ScoreboardResult | null {
  const memoRunCount = useRef(0);
  const lastFingerprint = useRef<string | null>(null);
  const cachedResult = useRef<ScoreboardResult | null>(null);

  // Create fingerprint from scoring-relevant data
  const fingerprint = createScoringFingerprint(game);

  return useMemo(() => {
    hookInvocationCount++;
    memoRunCount.current++;

    // If fingerprint is null, game isn't ready
    if (fingerprint === null) {
      console.log(
        `[useScoreboard] #${hookInvocationCount} - Game not ready for scoring`,
      );
      return null;
    }

    // If fingerprint hasn't changed, return cached result
    if (fingerprint === lastFingerprint.current && cachedResult.current) {
      console.log(
        `[useScoreboard] #${hookInvocationCount} - Fingerprint unchanged, using cache`,
      );
      return cachedResult.current;
    }

    console.log(
      `[useScoreboard] #${hookInvocationCount} - Fingerprint changed, recomputing scoreboard`,
    );

    try {
      const startTime = performance.now();
      const { scoreboard, context } = scoreWithContext(game!);
      const elapsed = performance.now() - startTime;

      console.log(
        `[useScoreboard] #${hookInvocationCount} - Scoring completed in ${elapsed.toFixed(1)}ms`,
      );

      // Update cache
      lastFingerprint.current = fingerprint;
      cachedResult.current = { scoreboard, context };

      return cachedResult.current;
    } catch (error) {
      console.warn("[useScoreboard] Scoring engine error:", error);
      return null;
    }
  }, [fingerprint, game]);
}
