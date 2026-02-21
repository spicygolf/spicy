import { useMemo, useRef } from "react";
import type { Game } from "spicylib/schema";
import type { Scoreboard, ScoringContext } from "spicylib/scoring";
import { scoreWithContext } from "spicylib/scoring";
import { isCoMapDataKey } from "spicylib/utils";
import { perfTime, usePerfRenderCount } from "@/utils/perfTrace";

/**
 * Fast, simple hash function (cyrb53)
 * Produces a 53-bit hash as a number for fast comparison.
 * Much faster than comparing large concatenated strings.
 *
 * @see https://github.com/bryc/code/blob/master/jshash/experimental/cyrb53.js
 */
function cyrb53(str: string, seed = 0): number {
  let h1 = 0xdeadbeef ^ seed;
  let h2 = 0x41c6ce57 ^ seed;
  for (let i = 0; i < str.length; i++) {
    const ch = str.charCodeAt(i);
    h1 = Math.imul(h1 ^ ch, 2654435761);
    h2 = Math.imul(h2 ^ ch, 1597334677);
  }
  h1 = Math.imul(h1 ^ (h1 >>> 16), 2246822507);
  h1 ^= Math.imul(h2 ^ (h2 >>> 13), 3266489909);
  h2 = Math.imul(h2 ^ (h2 >>> 16), 2246822507);
  h2 ^= Math.imul(h1 ^ (h1 >>> 13), 3266489909);
  return 4294967296 * (2097151 & h2) + (h1 >>> 0);
}

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
 * Returns a numeric hash for fast comparison, or null if the game isn't ready.
 * Using cyrb53 hash to handle large games (60+ players × 18 holes = 1000+ parts).
 */
function createScoringFingerprint(game: Game | null): number | null {
  if (!game?.$isLoaded) return null;

  // Need either game.spec (working copy) or game.specRef (catalog spec) for options
  // game.spec is preferred, but specRef works as fallback
  const spec = game.spec?.$isLoaded
    ? game.spec
    : game.specRef?.$isLoaded
      ? game.specRef
      : null;
  if (!spec) return null;

  if (!game.holes?.$isLoaded || game.holes.length === 0) return null;
  if (!game.rounds?.$isLoaded || game.rounds.length === 0) return null;

  const parts: string[] = [];

  // 1. Game ID (base identity)
  parts.push(`game:${game.$jazz.id}`);

  // 2. Hole count
  parts.push(`holes:${game.holes.length}`);

  // 3. All scores from all rounds (this is the primary data that changes)
  // For rounds/scores, we require the container to be loaded but individual
  // score entries can be skipped if not loaded (they'll update the fingerprint when they do)
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

    // Tee holes must be loaded for pops calculation (need par and handicap allocation)
    const tee = round.tee;
    if (!tee?.$isLoaded || !tee.holes?.$isLoaded) return null; // Not ready - tee/holes not loaded
    // Each tee hole must be loaded for par/handicap data
    for (const teeHole of tee.holes) {
      if (!teeHole?.$isLoaded) return null; // Not ready - individual tee hole not loaded
    }

    // Add all scores for this player - scores CoRecord must be loaded
    if (!round.scores?.$isLoaded) return null; // Not ready - scores map not loaded
    for (const key of Object.keys(round.scores)) {
      if (key.startsWith("$") || key === "_refs") continue;
      const holeScores = round.scores[key];
      // Individual score entries: skip if not loaded (will update fingerprint when they load)
      if (!holeScores?.$isLoaded) continue;
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

      // team.options is co.optional - use $jazz.has() to check if field exists
      // If not set, skip (valid - no options for this team)
      // If set but not loaded, block (need to wait for data)
      if (!team.$jazz.has("options")) {
        // No options set - valid, continue
      } else if (!team.options?.$isLoaded) {
        return null; // Options exist but not loaded yet
      } else {
        for (const opt of team.options) {
          if (!opt?.$isLoaded) return null; // Not ready - option not loaded
          // Include option name, value, playerId (for player junk), and firstHole (for multipliers)
          parts.push(
            `to:${holeNum}:${teamId}:${opt.optionName}:${opt.value ?? ""}:${opt.playerId ?? ""}:${opt.firstHole ?? ""}`,
          );
        }
      }

      // team.rounds must be loaded to extract playerIds for team scoring
      if (!team.rounds?.$isLoaded) return null;
      for (const rtt of team.rounds) {
        if (!rtt?.$isLoaded) return null;
        const rtg = rtt.roundToGame;
        if (!rtg?.$isLoaded) return null;
        const round = rtg.round;
        if (!round?.$isLoaded) return null;
        // Include player assignment in fingerprint
        parts.push(`tr:${holeNum}:${teamId}:${round.playerId ?? ""}`);
      }
    }

    // 4b. Per-hole game option overrides (GameHole.options)
    if (!hole.$jazz.has("options")) {
      // No overrides for this hole - valid, continue
    } else if (!hole.options?.$isLoaded) {
      return null; // Options exist but not loaded yet
    } else {
      for (const key of Object.keys(hole.options)) {
        if (!isCoMapDataKey(key)) continue;
        if (!hole.options.$jazz.has(key)) continue;
        const opt = hole.options[key];
        if (opt) {
          if (opt.type === "game") {
            parts.push(`ho:${holeNum}:${key}:${opt.value ?? opt.defaultValue}`);
          } else if (opt.type === "junk" || opt.type === "multiplier") {
            parts.push(`ho:${holeNum}:${key}:${opt.value}`);
          }
        }
      }
    }
  }

  // 5. Game spec options (includes any user modifications)
  // Options are plain JSON objects, no $isLoaded check needed
  for (const key of Object.keys(spec)) {
    if (key.startsWith("$") || key === "_refs") continue;
    const opt = spec[key];
    if (opt && opt.type === "game" && opt.value !== undefined) {
      parts.push(`go:${key}:${opt.value}`);
    }
  }

  // Hash the parts for fast numeric comparison instead of large string comparison
  return cyrb53(parts.join("|"));
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
  usePerfRenderCount("useScoreboard");
  const lastFingerprint = useRef<number | null>(null);
  const cachedResult = useRef<ScoreboardResult | null>(null);
  const nullCount = useRef(0);

  // Create fingerprint from scoring-relevant data
  const { result: fingerprint, ms: fpMs } = perfTime(
    "useScoreboard.fingerprint",
    () => createScoringFingerprint(game),
  );

  return useMemo(() => {
    // If fingerprint is null, game isn't ready
    if (fingerprint === null) {
      nullCount.current += 1;
      if (__DEV__ && nullCount.current % 10 === 0) {
        console.log(
          `[PERF] useScoreboard fingerprint null (${nullCount.current} times)`,
        );
      }
      return null;
    }

    // If fingerprint hasn't changed, return cached result
    // This prevents recomputation when game reference changes but data hasn't
    if (fingerprint === lastFingerprint.current && cachedResult.current) {
      if (__DEV__) {
        console.log(
          "[PERF] useScoreboard: fingerprint stable, returning cache",
        );
      }
      return cachedResult.current;
    }

    // At this point fingerprint !== null guarantees game is loaded
    if (!game?.$isLoaded) {
      return null;
    }

    try {
      const { result, ms } = perfTime("useScoreboard.scoreWithContext", () =>
        scoreWithContext(game),
      );

      if (__DEV__) {
        console.log(
          `[PERF] useScoreboard: SCORED in ${ms.toFixed(1)}ms (fp: ${fpMs.toFixed(1)}ms, fingerprint: ${fingerprint})`,
        );
      }

      // Update cache
      lastFingerprint.current = fingerprint;
      cachedResult.current = result;

      return result;
    } catch (error) {
      console.warn("[useScoreboard] Scoring engine error:", error);
      return null;
    }
  }, [fingerprint, game, fpMs]);
}
