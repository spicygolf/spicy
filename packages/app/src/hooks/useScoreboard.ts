import { useMemo, useRef } from "react";
import type { Game } from "spicylib/schema";
import type { Scoreboard, ScoringContext } from "spicylib/scoring";
import { scoreWithContext } from "spicylib/scoring";

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
  // IMPORTANT: Must return null if ANY round data isn't loaded yet
  for (const rtg of game.rounds) {
    if (!rtg?.$isLoaded) return null; // Not ready - rtg not loaded
    const round = rtg.round;
    if (!round?.$isLoaded) return null; // Not ready - round not loaded

    const playerId = round.playerId;
    const handicapIndex = rtg.handicapIndex ?? round.handicapIndex ?? 0;
    const courseHandicap = rtg.courseHandicap ?? 0;
    const gameHandicap = rtg.gameHandicap;

    parts.push(
      `p:${playerId}:hi${handicapIndex}:ch${courseHandicap}:gh${gameHandicap ?? ""}`,
    );

    // Add all scores for this player
    if (!round.scores?.$isLoaded) return null; // Not ready - scores not loaded
    for (const key of Object.keys(round.scores)) {
      if (key.startsWith("$") || key === "_refs") continue;
      const holeScores = round.scores[key];
      if (!holeScores?.$isLoaded) return null; // Not ready - hole scores not loaded
      const gross = holeScores.gross ?? "";
      parts.push(`s:${playerId}:${key}:${gross}`);
    }
  }

  // 4. Team options per hole (junk, multipliers)
  // IMPORTANT: Must return null if ANY hole/team/options data isn't loaded yet,
  // otherwise we compute scoreboard with incomplete data (missing multipliers)
  for (const hole of game.holes) {
    if (!hole?.$isLoaded) return null; // Not ready - hole not loaded
    const holeNum = hole.hole;

    // Check if teams list exists and is loaded
    if (!hole.teams?.$isLoaded) return null; // Not ready - teams not loaded

    for (const team of hole.teams) {
      if (!team?.$isLoaded) return null; // Not ready - team not loaded
      const teamId = team.team ?? "";

      // Check if options list exists and is loaded
      if (!team.options?.$isLoaded) return null; // Not ready - options not loaded

      for (const opt of team.options) {
        if (!opt?.$isLoaded) return null; // Not ready - option not loaded
        // Include option name, value, playerId (for player junk), and firstHole (for multipliers)
        parts.push(
          `to:${holeNum}:${teamId}:${opt.optionName}:${opt.value ?? ""}:${opt.playerId ?? ""}:${opt.firstHole ?? ""}`,
        );
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
 * IMPORTANT: We use useRef caching ON TOP of useMemo because:
 * - useMemo depends on [fingerprint, game]
 * - game reference changes on every Jazz progressive load update
 * - fingerprint stays stable when actual scoring data hasn't changed
 * - Without ref caching, scoreWithContext() runs on every game reference change
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
  const lastFingerprint = useRef<string | null>(null);
  const cachedResult = useRef<ScoreboardResult | null>(null);

  // Create fingerprint from scoring-relevant data
  const fingerprint = createScoringFingerprint(game);

  return useMemo(() => {
    // If fingerprint is null, game isn't ready
    if (fingerprint === null) {
      return null;
    }

    // If fingerprint hasn't changed, return cached result
    // This prevents recomputation when game reference changes but data hasn't
    if (fingerprint === lastFingerprint.current && cachedResult.current) {
      return cachedResult.current;
    }

    // At this point fingerprint !== null guarantees game is loaded
    if (!game?.$isLoaded) {
      return null;
    }

    try {
      const result = scoreWithContext(game);

      // Update cache
      lastFingerprint.current = fingerprint;
      cachedResult.current = result;

      return result;
    } catch (error) {
      console.warn("[useScoreboard] Scoring engine error:", error);
      return null;
    }
  }, [fingerprint, game]);
}
