/**
 * Junk Engine
 *
 * Evaluates junk options based on their data configuration.
 * NO game-specific code - all rules come from JunkOption fields:
 *
 * - score_to_par: "exactly -1" (birdie), "at_most -2" (eagle or better)
 * - logic: "{'rankWithTies': [1, 1]}" (outright winner)
 * - calculation: "best_ball", "sum" (for team-scoped junk)
 * - based_on: "gross", "net", "user"
 * - scope: "player", "team"
 */

import type { JunkOption } from "../schema";
import { deepClone } from "../utils/clone";
import { evaluateLogic, isSimpleRankCheck } from "./logic-engine";
import { getOptionValueForHole } from "./option-utils";
import type {
  EvaluationContext,
  HoleResult,
  PlayerHoleResult,
  ScoreToParCondition,
  ScoringContext,
  ScoringWarning,
  TeamHoleResult,
} from "./types";

// =============================================================================
// Public API
// =============================================================================

/**
 * Check if a hole is fully scored: all scores entered and all required junk marked.
 *
 * IMPORTANT: This function relies on `warnings` being populated by `evaluateJunkForHole`,
 * so it must be called after the junk stage has run. Pipeline order: junk → points → cumulative.
 *
 * @param holeResult - The hole result from the scoreboard (may be undefined)
 * @returns true if the hole has no scoring warnings and all players have scores
 */
export function isHoleComplete(
  holeResult: HoleResult | null | undefined,
): boolean {
  if (!holeResult) return false;

  const totalPlayers = Object.keys(holeResult.players).length;
  if (totalPlayers === 0) return false;

  const scoresEntered = holeResult.scoresEntered ?? 0;
  if (scoresEntered < totalPlayers) return false;

  // Check specifically for incompleteness warnings (future informational
  // warning types should not block hole completion)
  if (
    holeResult.warnings?.some(
      (w) => w.type === "incomplete_junk" || w.type === "missing_scores",
    )
  )
    return false;

  return true;
}

/**
 * Evaluate all junk options for a hole and award to players/teams
 *
 * Also calculates v0.3 parity fields:
 * - possiblePoints: total points available from limited junk
 * - scoresEntered: count of players with scores
 * - markedJunk: count of user-marked junk items
 * - requiredJunk: count of required one_per_group junk items
 * - warnings: array of incomplete scoring warnings
 *
 * @param holeResult - Current hole results with scores and rankings
 * @param ctx - Full scoring context with options
 * @returns Updated hole result with junk awards and metadata
 */
export function evaluateJunkForHole(
  holeResult: HoleResult,
  ctx: ScoringContext,
): HoleResult {
  // Deep clone to maintain immutability
  const result = deepClone(holeResult);

  // Get all junk options
  const junkOptions = getJunkOptions(ctx);

  for (const junk of junkOptions) {
    evaluateJunkOption(junk, result, ctx);
  }

  // Calculate v0.3 parity fields
  result.scoresEntered = calculateScoresEntered(result);
  const { possiblePoints, markedJunk, requiredJunk, unmarkedJunkNames } =
    calculatePossiblePointsAndJunkCounts(result, junkOptions);
  result.possiblePoints = possiblePoints;
  result.markedJunk = markedJunk;
  result.requiredJunk = requiredJunk;
  result.warnings = calculateWarnings(result, unmarkedJunkNames);

  return result;
}

/**
 * Get all junk options from the context
 */
export function getJunkOptions(ctx: ScoringContext): JunkOption[] {
  const options = ctx.options;
  if (!options) return [];

  const junkOptions: JunkOption[] = [];

  for (const key of Object.keys(options)) {
    if (key.startsWith("$") || key === "_refs") continue;
    const opt = options[key];
    // Check if it's a junk option (options are plain JSON, no $isLoaded check needed)
    if (opt && opt.type === "junk") {
      junkOptions.push(opt as JunkOption);
    }
  }

  // Sort by seq for consistent evaluation order
  return junkOptions.sort((a, b) => (a.seq ?? 999) - (b.seq ?? 999));
}

// =============================================================================
// Junk Evaluation
// =============================================================================

/**
 * Evaluate a single junk option and award if conditions are met
 */
function evaluateJunkOption(
  junk: JunkOption,
  holeResult: HoleResult,
  ctx: ScoringContext,
): void {
  const scope = junk.scope ?? "player";

  if (scope === "player") {
    evaluatePlayerJunk(junk, holeResult, ctx);
  } else if (scope === "team") {
    evaluateTeamJunk(junk, holeResult, ctx);
  }
}

/**
 * Evaluate player-scoped junk (e.g., birdie, eagle, sandie)
 */
function evaluatePlayerJunk(
  junk: JunkOption,
  holeResult: HoleResult,
  ctx: ScoringContext,
): void {
  for (const [playerId, playerResult] of Object.entries(holeResult.players)) {
    const evalCtx: EvaluationContext = {
      player: playerResult,
      hole: holeResult.holeInfo,
      ctx,
      holeNum: holeResult.hole,
    };

    const shouldAward = shouldAwardJunk(junk, evalCtx);
    if (shouldAward) {
      playerResult.junk.push({
        name: junk.name,
        value: junk.value ?? 0,
        playerId,
      });
    }
  }
}

/**
 * Evaluate team-scoped junk (e.g., low_ball, low_total, outright_winner)
 */
function evaluateTeamJunk(
  junk: JunkOption,
  holeResult: HoleResult,
  ctx: ScoringContext,
): void {
  for (const [_teamId, teamResult] of Object.entries(holeResult.teams)) {
    const evalCtx: EvaluationContext = {
      player: {} as PlayerHoleResult, // Not used for team scope
      team: teamResult,
      hole: holeResult.holeInfo,
      ctx,
      holeNum: holeResult.hole,
    };

    if (shouldAwardTeamJunk(junk, teamResult, holeResult, evalCtx)) {
      teamResult.junk.push({
        name: junk.name,
        value: junk.value ?? 0,
      });
    }
  }
}

/**
 * Check if a player should be awarded this junk
 */
function shouldAwardJunk(
  junk: JunkOption,
  evalCtx: EvaluationContext,
): boolean {
  const basedOn = junk.based_on ?? "gross";

  // User-entered junk (sandie, greenie, prox) - check if user marked it
  if (basedOn === "user") {
    return checkUserJunk(junk.name, evalCtx);
  }

  // Score-to-par based junk (birdie, eagle)
  if (junk.score_to_par) {
    return evaluateScoreToPar(junk.score_to_par, evalCtx, basedOn);
  }

  // Logic-based junk (ranking conditions)
  if (junk.logic) {
    return evaluatePlayerLogic(junk.logic, evalCtx);
  }

  return false;
}

/**
 * Check if a team should be awarded this junk
 */
function shouldAwardTeamJunk(
  junk: JunkOption,
  teamResult: TeamHoleResult,
  holeResult: HoleResult,
  evalCtx: EvaluationContext,
): boolean {
  const calculation = junk.calculation;

  // Logic-based team junk (outright_winner, all_tie, etc.)
  if (calculation === "logic" && junk.logic) {
    return evaluateTeamLogic(
      junk.logic,
      junk,
      teamResult,
      holeResult,
      evalCtx.ctx,
    );
  }

  // Calculation-based team junk (low_ball, low_total)
  // These are typically awarded to the team with the best calculated score
  if (calculation === "best_ball" || calculation === "sum") {
    return evaluateCalculationJunk(junk, teamResult, holeResult, evalCtx.ctx);
  }

  return false;
}

// =============================================================================
// Score-to-Par Evaluation
// =============================================================================

/**
 * Parse a score_to_par condition string
 *
 * @example
 * "exactly -1" -> { operator: "exactly", value: -1 }
 * "at_most -2" -> { operator: "at_most", value: -2 }
 */
export function parseScoreToParCondition(
  condition: string,
): ScoreToParCondition | null {
  const parts = condition.trim().split(/\s+/);
  if (parts.length !== 2) return null;

  const operatorPart = parts[0];
  const valuePart = parts[1];
  if (operatorPart === undefined || valuePart === undefined) return null;

  // Validate operator before type assertion
  const validOperators = ["exactly", "at_most", "at_least"] as const;
  if (!validOperators.includes(operatorPart as (typeof validOperators)[number]))
    return null;

  const operator = operatorPart as ScoreToParCondition["operator"];
  const value = Number.parseInt(valuePart, 10);

  if (Number.isNaN(value)) return null;

  return { operator, value };
}

/**
 * Evaluate a score_to_par condition against player's score
 */
function evaluateScoreToPar(
  condition: string,
  evalCtx: EvaluationContext,
  basedOn: string,
): boolean {
  const parsed = parseScoreToParCondition(condition);
  if (!parsed) return false;

  // Get the score based on gross or net
  const score =
    basedOn === "net" ? evalCtx.player.netToPar : evalCtx.player.scoreToPar;

  // Check if we have a valid score
  if (evalCtx.player.gross === 0) return false;

  switch (parsed.operator) {
    case "exactly":
      return score === parsed.value;
    case "at_most":
      return score <= parsed.value;
    case "at_least":
      return score >= parsed.value;
    default:
      return false;
  }
}

// =============================================================================
// Logic Evaluation
// =============================================================================

/**
 * Parse a simple logic condition string (for backward compatibility)
 * For complex expressions, use evaluateLogic from logic-engine.ts
 *
 * @example
 * "{'rankWithTies': [1, 1]}" -> { rank: 1, tieCount: 1 }
 */
export function parseLogicCondition(
  logic: string,
): { rank: number; tieCount: number } | null {
  return isSimpleRankCheck(logic);
}

/**
 * Evaluate a logic condition for player-scoped junk
 * Uses json-logic for complex expressions, optimized path for simple rankWithTies
 */
function evaluatePlayerLogic(
  logic: string,
  evalCtx: EvaluationContext,
): boolean {
  // Try simple rank check first (optimization)
  const simpleCheck = isSimpleRankCheck(logic);
  if (simpleCheck) {
    return (
      evalCtx.player.rank === simpleCheck.rank &&
      evalCtx.player.tieCount === simpleCheck.tieCount
    );
  }

  // Fall back to full json-logic evaluation
  return evaluateLogic(logic, {
    ctx: evalCtx.ctx,
    holeNum: evalCtx.holeNum,
    option: { name: "player_junk" },
  });
}

/**
 * Evaluate a logic condition for team-scoped junk
 * Uses json-logic for complex expressions like countJunk, team comparisons
 */
function evaluateTeamLogic(
  logic: string,
  junk: JunkOption,
  teamResult: TeamHoleResult,
  holeResult: HoleResult,
  ctx: ScoringContext,
): boolean {
  // Try simple rank check first (optimization)
  const simpleCheck = isSimpleRankCheck(logic);
  if (simpleCheck) {
    return (
      teamResult.rank === simpleCheck.rank &&
      teamResult.tieCount === simpleCheck.tieCount
    );
  }

  // Full json-logic evaluation with team context
  const teams = Object.values(holeResult.teams);
  return evaluateLogic(logic, {
    ctx,
    holeNum: holeResult.hole,
    holeResult,
    team: teamResult,
    teams,
    option: {
      name: junk.name,
      based_on: junk.based_on,
      better: junk.better,
    },
  });
}

// =============================================================================
// Calculation-Based Junk (for team scoring)
// =============================================================================

/**
 * Get sorted player scores for a team (v0.3 parity)
 *
 * For best_ball, returns scores sorted low to high.
 * For sum, returns a single-element array with the sum.
 *
 * @param team - Team result with player IDs
 * @param holeResult - Hole result with all player data
 * @param calculation - "best_ball" or "sum"
 * @param better - "lower" or "higher" (affects sort order)
 * @returns Array of scores for tie-breaking comparison
 */
function getTeamScoreArray(
  team: TeamHoleResult,
  holeResult: HoleResult,
  calculation: string,
  better: string,
): number[] {
  if (calculation === "sum") {
    // For sum, return single value
    return team.total > 0 ? [team.total] : [];
  }

  // For best_ball, get all player net scores and sort
  const scores: number[] = [];
  for (const playerId of team.playerIds) {
    const playerResult = holeResult.players[playerId];
    if (playerResult && playerResult.net > 0) {
      scores.push(playerResult.net);
    }
  }

  // Sort based on "better" direction
  if (better === "lower") {
    scores.sort((a, b) => a - b); // Ascending: best (lowest) first
  } else {
    scores.sort((a, b) => b - a); // Descending: best (highest) first
  }

  return scores;
}

/**
 * Compare two team score arrays for tie-breaking (v0.3 parity)
 *
 * When next_ball_breaks_ties is true, compares 1st ball, then 2nd ball, etc.
 * Returns: -1 if team1 is better, 1 if team2 is better, 0 if tied
 *
 * @param scores1 - First team's sorted scores
 * @param scores2 - Second team's sorted scores
 * @param better - "lower" or "higher"
 * @param maxDepth - How many balls to compare (1 = first ball only)
 * @returns Comparison result: -1, 0, or 1
 */
function compareTeamScores(
  scores1: number[],
  scores2: number[],
  better: string,
  maxDepth: number,
): number {
  const len = Math.min(scores1.length, scores2.length, maxDepth);

  for (let i = 0; i < len; i++) {
    const s1 = scores1[i];
    const s2 = scores2[i];

    if (s1 === undefined || s2 === undefined) {
      return 0; // Invalid scores, treat as tie
    }

    if (s1 === s2) {
      continue; // Tied at this level, check next ball
    }

    if (better === "lower") {
      return s1 < s2 ? -1 : 1;
    }
    return s1 > s2 ? -1 : 1;
  }

  return 0; // All compared scores are equal = tie
}

/**
 * Evaluate calculation-based team junk (low_ball, low_total) (v0.3 parity)
 *
 * These are awarded to the team with the best score for the calculation type.
 * The "limit" field determines how awards are handled (e.g., one_team_per_group).
 *
 * Supports next_ball_breaks_ties option:
 * - When true: if teams tie on 1st ball, compare 2nd ball, then 3rd, etc.
 * - When false (default): only compare 1st ball
 *
 * Matches v0.3 score.js lines 620-680.
 */
function evaluateCalculationJunk(
  junk: JunkOption,
  teamResult: TeamHoleResult,
  holeResult: HoleResult,
  ctx: ScoringContext,
): boolean {
  const calculation = junk.calculation ?? "best_ball";
  const better = junk.better ?? "lower";

  // Check next_ball_breaks_ties option
  const nextBallBreaksTies =
    getOptionValueForHole("next_ball_breaks_ties", holeResult.hole, ctx) ===
    true;

  // Build score arrays for all teams
  const teamScoreArrays: Array<{
    teamId: string;
    scores: number[];
  }> = [];

  for (const [teamId, team] of Object.entries(holeResult.teams)) {
    // Skip teams with no valid scores
    if (team.playerIds.length === 0) continue;

    const scores = getTeamScoreArray(team, holeResult, calculation, better);
    if (scores.length > 0) {
      teamScoreArrays.push({ teamId, scores });
    }
  }

  if (teamScoreArrays.length === 0) return false;

  // Determine max depth for tie-breaking
  const maxDepth = nextBallBreaksTies
    ? Math.max(...teamScoreArrays.map((t) => t.scores.length))
    : 1;

  // Find the best team(s) using progressive tie-breaking
  const firstTeam = teamScoreArrays[0];
  if (firstTeam === undefined) return false;

  let bestTeams: Array<{ teamId: string; scores: number[] }> = [firstTeam];

  for (let i = 1; i < teamScoreArrays.length; i++) {
    const current = teamScoreArrays[i];
    if (current === undefined) continue;

    const bestTeam = bestTeams[0];
    if (bestTeam === undefined) continue;

    const comparison = compareTeamScores(
      current.scores,
      bestTeam.scores,
      better,
      maxDepth,
    );

    if (comparison < 0) {
      // Current team is better
      bestTeams = [current];
    } else if (comparison === 0) {
      // Tie - add to best teams
      bestTeams.push(current);
    }
    // comparison > 0 means current is worse, do nothing
  }

  // Check if this team is among the best
  const isWinner = bestTeams.some(
    (t): t is { teamId: string; scores: number[] } =>
      t !== undefined && t.teamId === teamResult.teamId,
  );
  if (!isWinner) return false;

  // For one_team_per_group limit: if there's a tie, NO team gets the junk
  // This matches v0.3 behavior: countOfBest <= lenOfScores check (score.js line 680)
  const limit = junk.limit ?? "";
  if (limit === "one_team_per_group" && bestTeams.length > 1) {
    return false;
  }

  return true;
}

// =============================================================================
// User-Entered Junk
// =============================================================================

/**
 * Check if user has marked this junk for the player on this hole
 *
 * User-entered junk (sandie, greenie, prox) is stored in two possible locations:
 * 1. Team options: gameHole.teams[].options[] as TeamOption with optionName and playerId
 * 2. Round scores: round.scores[holeNum][junkName] (legacy format)
 */
function checkUserJunk(junkName: string, evalCtx: EvaluationContext): boolean {
  const playerId = evalCtx.player.playerId;
  const holeNum = evalCtx.holeNum;

  // First check team options (primary location for imported data)
  const gameHole = evalCtx.ctx.gameHoles.find((h) => h.hole === holeNum);
  if (gameHole?.teams?.$isLoaded) {
    for (const team of gameHole.teams) {
      if (!team?.$isLoaded || !team.options?.$isLoaded) continue;

      for (const opt of team.options) {
        if (!opt?.$isLoaded) continue;
        // Check if this option matches the junk name and player
        if (opt.optionName === junkName && opt.playerId === playerId) {
          return true;
        }
      }
    }
  }

  // Fall back to round scores (legacy format)
  const round = evalCtx.ctx.rounds.find((rtg) => {
    const r = rtg.round;
    return r?.$isLoaded && r.playerId === playerId;
  })?.round;

  if (!round?.$isLoaded || !round.scores?.$isLoaded) return false;

  const holeScores = round.scores[holeNum];
  if (!holeScores?.$isLoaded) return false;

  // Check if junk is marked (value of "1" or "true")
  const junkValue = holeScores[junkName];
  return junkValue === "1" || junkValue === "true";
}

// =============================================================================
// v0.3 Parity: Possible Points, Scores Entered, Warnings
// =============================================================================

/**
 * Count the number of players with scores entered on this hole (v0.3 parity)
 *
 * @param holeResult - The hole result with player data
 * @returns Number of players with gross > 0
 */
function calculateScoresEntered(holeResult: HoleResult): number {
  return Object.values(holeResult.players).filter((p) => p.gross > 0).length;
}

/**
 * Calculate possible points and junk counts for a hole (v0.3 parity)
 *
 * Possible points come from:
 * 1. Limited junk (one_per_group, one_team_per_group) - these are possible on every hole
 * 2. Player junk that was actually awarded (no limit) - already counted in awards
 *
 * This matches v0.3 score.js lines 67-79 and 88-94.
 *
 * @param holeResult - The hole result with awarded junk
 * @param junkOptions - All junk options for evaluation
 * @returns Object with possiblePoints, markedJunk count, requiredJunk count, and unmarked junk names
 */
function calculatePossiblePointsAndJunkCounts(
  holeResult: HoleResult,
  junkOptions: JunkOption[],
): {
  possiblePoints: number;
  markedJunk: number;
  requiredJunk: number;
  unmarkedJunkNames: string[];
} {
  let possiblePoints = 0;
  let markedJunk = 0;
  let requiredJunk = 0;
  const unmarkedJunkNames: string[] = [];

  for (const junk of junkOptions) {
    const limit = junk.limit ?? "";
    const scope = junk.scope ?? "player";
    const value = junk.value ?? 0;

    // Limited junk contributes to possible points
    if (limit === "one_team_per_group" || limit === "one_per_group") {
      possiblePoints += value;
    }

    // Count required and marked junk for player-scoped one_per_group
    if (scope === "player" && limit === "one_per_group") {
      requiredJunk++;

      // Check if any player has this junk marked
      let isMarked = false;
      for (const player of Object.values(holeResult.players)) {
        if (player.junk.some((j) => j.name === junk.name)) {
          isMarked = true;
          markedJunk++;
          break;
        }
      }

      // Track unmarked required junk by display name
      if (!isMarked) {
        unmarkedJunkNames.push(junk.disp ?? junk.name);
      }
    }
  }

  // Also add player junk that was actually awarded (no limit) to possiblePoints
  // These don't have a limit, so they add to possible based on what was achieved
  for (const player of Object.values(holeResult.players)) {
    for (const award of player.junk) {
      const junkOpt = junkOptions.find((j) => j.name === award.name);
      if (junkOpt && !junkOpt.limit) {
        possiblePoints += award.value;
      }
    }
  }

  // Also add team junk that was awarded (no limit)
  for (const team of Object.values(holeResult.teams)) {
    for (const award of team.junk) {
      const junkOpt = junkOptions.find((j) => j.name === award.name);
      if (junkOpt && !junkOpt.limit) {
        possiblePoints += award.value;
      }
    }
  }

  return { possiblePoints, markedJunk, requiredJunk, unmarkedJunkNames };
}

/**
 * Generate warnings for incomplete scoring.
 *
 * Warns when:
 * 1. There's any activity on the hole (scores entered or junk awarded) but
 *    not all scores are entered yet → "missing_scores"
 * 2. All scores are entered but required junk (scope=player, limit=one_per_group)
 *    isn't fully marked → "incomplete_junk"
 *
 * @param holeResult - The hole result with scores and awarded junk data
 * @param unmarkedJunkNames - Display names of unmarked required junk items
 * @returns Array of warnings
 */
function calculateWarnings(
  holeResult: HoleResult,
  unmarkedJunkNames: string[],
): ScoringWarning[] {
  const warnings: ScoringWarning[] = [];

  const totalPlayers = Object.keys(holeResult.players).length;
  const scoresEntered = holeResult.scoresEntered ?? 0;

  // Check if there's any activity: scores entered OR any junk awarded to players/teams
  // Junk awards include user-marked junk (prox) which gets awarded by checkUserJunk
  const hasAnyJunk =
    Object.values(holeResult.players).some((p) => p.junk.length > 0) ||
    Object.values(holeResult.teams).some((t) => t.junk.length > 0);
  const hasActivity = scoresEntered > 0 || hasAnyJunk;

  // Build a combined warning message with all missing items
  const missingScores = scoresEntered < totalPlayers;
  const missingJunk = unmarkedJunkNames.length > 0;

  if (hasActivity && (missingScores || missingJunk)) {
    const parts: string[] = [];
    if (missingScores) {
      const remaining = totalPlayers - scoresEntered;
      parts.push(`${remaining} score${remaining > 1 ? "s" : ""}`);
    }
    if (missingJunk) {
      parts.push(unmarkedJunkNames.join(", "));
    }
    warnings.push({
      type: missingScores ? "missing_scores" : "incomplete_junk",
      message: `${parts.join(", ")} missing`,
    });
  }

  return warnings;
}
