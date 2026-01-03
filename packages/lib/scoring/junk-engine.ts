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
import type {
  EvaluationContext,
  HoleResult,
  PlayerHoleResult,
  RankLogicCondition,
  ScoreToParCondition,
  ScoringContext,
  TeamHoleResult,
} from "./types";

// =============================================================================
// Public API
// =============================================================================

/**
 * Evaluate all junk options for a hole and award to players/teams
 *
 * @param holeResult - Current hole results with scores and rankings
 * @param ctx - Full scoring context with options
 * @returns Updated hole result with junk awards
 */
export function evaluateJunkForHole(
  holeResult: HoleResult,
  ctx: ScoringContext,
): HoleResult {
  // Deep clone to maintain immutability
  const result = structuredClone(holeResult);

  // Get all junk options
  const junkOptions = getJunkOptions(ctx);

  for (const junk of junkOptions) {
    evaluateJunkOption(junk, result, ctx);
  }

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
    // Check if loaded and is a junk option
    if (opt?.$isLoaded && opt.type === "junk") {
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

    if (shouldAwardJunk(junk, evalCtx)) {
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
    return evaluateLogic(junk.logic, evalCtx);
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
  _evalCtx: EvaluationContext,
): boolean {
  const calculation = junk.calculation;

  // Logic-based team junk (outright_winner, all_tie, etc.)
  if (calculation === "logic" && junk.logic) {
    return evaluateTeamLogic(junk.logic, teamResult, holeResult);
  }

  // Calculation-based team junk (low_ball, low_total)
  // These are typically awarded to the team with the best calculated score
  if (calculation === "best_ball" || calculation === "sum") {
    return evaluateCalculationJunk(junk, teamResult, holeResult);
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

  const operator = parts[0] as ScoreToParCondition["operator"];
  const value = Number.parseInt(parts[1], 10);

  if (!["exactly", "at_most", "at_least"].includes(operator)) return null;
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
 * Parse a logic condition string
 *
 * @example
 * "{'rankWithTies': [1, 1]}" -> { type: "rankWithTies", rank: 1, tieCount: 1 }
 */
export function parseLogicCondition(logic: string): RankLogicCondition | null {
  try {
    // Convert single quotes to double quotes for JSON parsing
    const jsonStr = logic.replace(/'/g, '"');
    const parsed = JSON.parse(jsonStr);

    if (parsed.rankWithTies && Array.isArray(parsed.rankWithTies)) {
      const [rank, tieCount] = parsed.rankWithTies;
      return {
        type: "rankWithTies",
        rank: Number(rank),
        tieCount: Number(tieCount),
      };
    }

    return null;
  } catch {
    return null;
  }
}

/**
 * Evaluate a logic condition for player-scoped junk
 */
function evaluateLogic(logic: string, evalCtx: EvaluationContext): boolean {
  const condition = parseLogicCondition(logic);
  if (!condition) return false;

  if (condition.type === "rankWithTies") {
    return (
      evalCtx.player.rank === condition.rank &&
      evalCtx.player.tieCount === condition.tieCount
    );
  }

  return false;
}

/**
 * Evaluate a logic condition for team-scoped junk
 */
function evaluateTeamLogic(
  logic: string,
  teamResult: TeamHoleResult,
  _holeResult: HoleResult,
): boolean {
  const condition = parseLogicCondition(logic);
  if (!condition) return false;

  if (condition.type === "rankWithTies") {
    return (
      teamResult.rank === condition.rank &&
      teamResult.tieCount === condition.tieCount
    );
  }

  return false;
}

// =============================================================================
// Calculation-Based Junk (for team scoring)
// =============================================================================

/**
 * Evaluate calculation-based team junk (low_ball, low_total)
 *
 * These are awarded to the team with the best score for the calculation type.
 * The "limit" field determines how awards are handled (e.g., one_team_per_group).
 */
function evaluateCalculationJunk(
  junk: JunkOption,
  teamResult: TeamHoleResult,
  holeResult: HoleResult,
): boolean {
  const calculation = junk.calculation;
  const better = junk.better ?? "lower";
  const limit = junk.limit;

  // Get all team scores for this calculation
  const teamScores: Array<{ teamId: string; score: number }> = [];

  for (const [teamId, team] of Object.entries(holeResult.teams)) {
    // Skip teams with no valid scores
    if (team.playerIds.length === 0) continue;

    let score: number;
    if (calculation === "best_ball") {
      score = team.lowBall;
    } else if (calculation === "sum") {
      score = team.total;
    } else {
      continue;
    }

    if (score > 0) {
      teamScores.push({ teamId, score });
    }
  }

  if (teamScores.length === 0) return false;

  // Find the best score
  const sortedScores = [...teamScores].sort((a, b) =>
    better === "lower" ? a.score - b.score : b.score - a.score,
  );

  const bestScore = sortedScores[0].score;

  // Check if this team has the best score
  const teamScore =
    calculation === "best_ball" ? teamResult.lowBall : teamResult.total;

  if (teamScore !== bestScore) return false;

  // Check limit - if one_team_per_group, only award if outright winner
  if (limit === "one_team_per_group") {
    const _tiedTeams = teamScores.filter((t) => t.score === bestScore);
    // Still award but split value will be handled by points calculation
    return true;
  }

  return true;
}

// =============================================================================
// User-Entered Junk
// =============================================================================

/**
 * Check if user has marked this junk for the player on this hole
 *
 * User-entered junk (sandie, greenie, prox) is stored in the round scores
 * as a key matching the junk name.
 */
function checkUserJunk(junkName: string, evalCtx: EvaluationContext): boolean {
  // User junk would be stored in round.scores[holeNum][junkName]
  // For now, we check if the player has a junk value in their result
  // This will be populated by the scores loading stage

  // Find the round for this player
  const round = evalCtx.ctx.rounds.find((rtg) => {
    const r = rtg.round;
    return r?.$isLoaded && r.playerId === evalCtx.player.playerId;
  })?.round;

  if (!round?.$isLoaded || !round.scores?.$isLoaded) return false;

  const holeScores = round.scores[evalCtx.holeNum];
  if (!holeScores?.$isLoaded) return false;

  // Check if junk is marked (value of "1" or "true")
  const junkValue = holeScores[junkName];
  return junkValue === "1" || junkValue === "true";
}
