/**
 * Logic Engine
 *
 * Evaluates json-logic expressions with custom operators for golf scoring.
 * Ported from app-0.3/src/common/utils/ScoringWrapper.js
 *
 * Used by:
 * - Junk options: `logic` and `availability` fields
 * - Multiplier options: `availability` field
 */

import jsonLogic from "json-logic-js";
import { getFrontNinePreDoubleTotal } from "./option-utils";
import type { HoleResult, ScoringContext, TeamHoleResult } from "./types";

// =============================================================================
// Types
// =============================================================================

/**
 * Context passed to logic evaluation
 */
export interface LogicContext {
  /** Current scoring context */
  ctx: ScoringContext;
  /** Current hole number */
  holeNum: string;
  /** Current hole result (if available) */
  holeResult?: HoleResult;
  /** The team being evaluated (for team-scoped options) */
  team?: TeamHoleResult;
  /** All teams on this hole */
  teams?: TeamHoleResult[];
  /** The junk/multiplier option being evaluated */
  option?: {
    name: string;
    based_on?: string;
    better?: string;
    [key: string]: unknown;
  };
  /** Possible points for BBQ multipliers */
  possiblePoints?: number;
}

// =============================================================================
// Custom Operators
// =============================================================================

/**
 * Get a team by reference ('this' or 'other')
 */
function getTeam(
  teamRef: string,
  logicCtx: LogicContext,
): TeamHoleResult | null {
  if (!logicCtx.team || !logicCtx.teams) return null;

  if (teamRef === "this") {
    return logicCtx.team;
  }

  if (teamRef === "other") {
    // Find the other team (assumes 2 teams)
    const otherTeam = logicCtx.teams.find(
      (t) => t.teamId !== logicCtx.team?.teamId,
    );
    return otherTeam ?? null;
  }

  return null;
}

/**
 * Count junk awards on a team (including player-scoped junk like birdie/eagle)
 *
 * For team-scoped junk (low_ball, low_total), counts from team.junk
 * For player-scoped junk (birdie, eagle), counts from each player on the team
 *
 * @param teamRef - The team to count junk for
 * @param junkName - The junk option name to count
 * @param holeResult - The hole result containing player data
 */
function countJunk(
  teamRef: TeamHoleResult | null,
  junkName: string,
  holeResult?: HoleResult,
): number {
  if (!teamRef) return 0;

  // Count junk on team (team-scoped junk like low_ball)
  const teamJunkCount = teamRef.junk.filter((j) => j.name === junkName).length;

  // Count junk on individual players of the team (player-scoped junk like birdie, eagle)
  let playerJunkCount = 0;
  if (holeResult) {
    for (const playerId of teamRef.playerIds) {
      const playerResult = holeResult.players[playerId];
      if (playerResult) {
        playerJunkCount += playerResult.junk.filter(
          (j) => j.name === junkName,
        ).length;
      }
    }
  }

  return teamJunkCount + playerJunkCount;
}

/**
 * Check if team is down the most (losing by the most points)
 *
 * Uses the runningTotal from the HOLE passed to it (typically getPrevHole).
 * If no hole is passed (e.g., hole 1 has no previous hole), returns true for all teams.
 *
 * @param holeResult - The hole to check rankings from (usually previous hole)
 * @param team - The team to check
 * @param logicCtx - Logic context
 * @param betterPoints - "higher" or "lower" points is better
 */
function isTeamDownTheMost(
  holeResult: HoleResult | null,
  team: TeamHoleResult | null,
  _logicCtx: LogicContext,
  betterPoints: string,
): boolean {
  // If no hole (e.g., hole 1 has no previous), all teams can press
  if (!holeResult) return true;
  if (!team) return true;

  const teams = Object.values(holeResult.teams);
  if (teams.length < 2) return true;

  // Get team scores using runningTotal from that hole
  const teamScores = teams.map((t) => ({
    teamId: t.teamId,
    runningTotal: t.runningTotal ?? 0,
  }));

  // Sort by runningTotal
  // If higher points is better (default), "down the most" = lowest runningTotal
  // If lower points is better, "down the most" = highest runningTotal
  const sorted = [...teamScores].sort((a, b) => {
    const diff = a.runningTotal - b.runningTotal;
    return betterPoints === "lower" ? -diff : diff;
  });

  // Check if all teams are tied (all have same runningTotal)
  const firstTotal = sorted[0]?.runningTotal ?? 0;
  const allTied = sorted.every((t) => t.runningTotal === firstTotal);

  if (allTied) return true; // All teams can press when tied

  // First team in sorted order is "down the most"
  return sorted[0]?.teamId === team.teamId;
}

/**
 * Check if team is second to last
 *
 * Uses the runningTotal from the HOLE passed to it (typically getPrevHole).
 * If no hole is passed, returns false (can't be second to last with no data).
 *
 * @param holeResult - The hole to check rankings from (usually previous hole)
 * @param team - The team to check
 * @param logicCtx - Logic context
 * @param betterPoints - "higher" or "lower" points is better
 */
function isTeamSecondToLast(
  holeResult: HoleResult | null,
  team: TeamHoleResult | null,
  _logicCtx: LogicContext,
  betterPoints: string,
): boolean {
  if (!holeResult) return false;
  if (!team) return false;

  const teams = Object.values(holeResult.teams);
  if (teams.length < 2) return false;

  // Get team scores using runningTotal from that hole
  const teamScores = teams.map((t) => ({
    teamId: t.teamId,
    runningTotal: t.runningTotal ?? 0,
  }));

  // Sort by runningTotal
  const sorted = [...teamScores].sort((a, b) => {
    const diff = a.runningTotal - b.runningTotal;
    return betterPoints === "lower" ? -diff : diff;
  });

  // Second team in sorted order is "second to last"
  return sorted[1]?.teamId === team.teamId;
}

/**
 * Check rank with ties condition
 */
function checkRankWithTies(
  targetRank: number,
  targetTieCount: number,
  logicCtx: LogicContext,
): boolean {
  if (!logicCtx.team) return false;

  return (
    logicCtx.team.rank === targetRank &&
    logicCtx.team.tieCount === targetTieCount
  );
}

/**
 * Check if other team used a specific multiplier on this hole
 */
function didOtherTeamMultiplyWith(
  _currHoleResult: HoleResult | null,
  team: TeamHoleResult | null,
  multiplierName: string,
  logicCtx: LogicContext,
): boolean {
  if (!team || !logicCtx.holeResult) return false;

  // Find other team
  const otherTeam = logicCtx.teams?.find((t) => t.teamId !== team.teamId);
  if (!otherTeam) return false;

  // Check if other team has this multiplier
  return otherTeam.multipliers.some((m) => m.name === multiplierName);
}

/**
 * Get previous hole result
 */
function getPrevHole(logicCtx: LogicContext): HoleResult | null {
  const currentHoleNum = Number.parseInt(logicCtx.holeNum, 10);
  if (currentHoleNum <= 1) return null;

  const prevHoleNum = (currentHoleNum - 1).toString();
  return logicCtx.ctx.scoreboard?.holes[prevHoleNum] ?? null;
}

/**
 * Get current hole result
 */
function getCurrHole(logicCtx: LogicContext): HoleResult | null {
  return logicCtx.holeResult ?? null;
}

/**
 * Count players on a team
 */
function playersOnTeam(teamRef: string, logicCtx: LogicContext): number {
  const team = getTeam(teamRef, logicCtx);
  return team?.playerIds.length ?? 0;
}

/**
 * Check if current context is for the wolf player
 * (Wolf game specific - player who tees off first and chooses partner)
 *
 * INCOMPLETE IMPLEMENTATION: Wolf game requires additional data infrastructure:
 * 1. wolf_order: Array of player IDs defining the rotation order
 * 2. Current player context in LogicContext
 * 3. Logic to determine which player is Wolf on the current hole
 *    (based on hole number modulo player count, with special rules
 *    for remaining holes where "down the most" player becomes Wolf)
 *
 * The Wolf game spec has status: "dev" and should not be used in production
 * until this is fully implemented.
 *
 * See: data/seed/specs/wolf.json, packages/app-0.3/src/common/utils/ScoringWrapper.js
 */
function isWolfPlayer(_logicCtx: LogicContext): boolean {
  // Wolf game is not fully implemented - see docstring above
  // Returning false means lone_wolf multipliers won't be available
  // This is safer than returning true which would incorrectly enable them
  console.warn(
    "isWolfPlayer() called but Wolf game is not fully implemented. " +
      "Lone wolf multipliers will not be available.",
  );
  return false;
}

/**
 * Check if score is par or better
 */
function isParOrBetter(
  _holeNum: string,
  _scoreType: string,
  _logicCtx: LogicContext,
): boolean {
  // This would need player context
  // For now, return false - will be implemented when needed
  return false;
}

/**
 * Get hole par
 */
function getHolePar(logicCtx: LogicContext): number {
  return logicCtx.holeResult?.holeInfo.par ?? 0;
}

/**
 * Check if existing pre-multiplier total meets threshold
 *
 * This checks if the existing pre-multiplier total has reached or exceeded
 * a threshold. Used to enable options like 12x only when already at 8x.
 *
 * The threshold represents the minimum required multiplier total. This function
 * returns true if the existing total is AT LEAST the threshold.
 *
 * @param holeResult - The hole to check (typically current hole)
 * @param threshold - The minimum required multiplier total (e.g., 8 for 12x availability)
 * @returns true if existing total >= threshold, false otherwise
 */
function existingPreMultiplierTotal(
  holeResult: HoleResult | null,
  threshold: number,
): boolean {
  if (!holeResult) return false; // No data, multiplier hasn't reached threshold

  // Get the current hole multiplier (all multipliers combined)
  const currentMultiplier = holeResult.holeMultiplier ?? 1;

  // Return true if current multiplier is at or above threshold
  // Matches legacy behavior: tot >= threshold
  return currentMultiplier >= threshold;
}

// getFrontNinePreDoubleTotal is imported from option-utils.ts

// =============================================================================
// Logic Engine
// =============================================================================

// Track if operators have been registered
let operatorsRegistered = false;

// Current logic context for operators that need it during evaluation
// This is set before json-logic.apply() and cleared after
let currentLogicCtx: LogicContext | null = null;

/**
 * Register custom json-logic operators
 * Called once on first use
 */
function registerOperators(): void {
  if (operatorsRegistered) return;

  // Note: json-logic-js uses a global registry, so we register once
  // The operators receive the evaluated arguments, not raw expressions
  // We use a closure to access logicCtx from the data object

  // team: get 'this' or 'other' team
  jsonLogic.add_operation("team", (teamRef: string) => {
    // This will be called with data.scoring as context
    return { __teamRef: teamRef };
  });

  // countJunk: count junk on a team
  jsonLogic.add_operation(
    "countJunk",
    (teamResult: { __teamRef?: string } | TeamHoleResult, junkName: string) => {
      if (teamResult && "__teamRef" in teamResult) {
        // This is a reference that needs resolution - return placeholder
        return { __countJunk: { teamRef: teamResult.__teamRef, junkName } };
      }
      return countJunk(teamResult as TeamHoleResult, junkName);
    },
  );

  // rankWithTies: check rank and tie count
  jsonLogic.add_operation("rankWithTies", (rank: number, tieCount: number) => {
    return { __rankWithTies: { rank, tieCount } };
  });

  // team_down_the_most: check if team is losing
  jsonLogic.add_operation(
    "team_down_the_most",
    (prevHole: unknown, team: unknown) => {
      return { __team_down_the_most: { prevHole, team } };
    },
  );

  // team_second_to_last: check if team is second to last
  jsonLogic.add_operation(
    "team_second_to_last",
    (prevHole: unknown, team: unknown) => {
      return { __team_second_to_last: { prevHole, team } };
    },
  );

  // other_team_multiplied_with: check opponent multipliers
  jsonLogic.add_operation(
    "other_team_multiplied_with",
    (currHole: unknown, team: unknown, multName: string) => {
      return { __other_team_multiplied_with: { currHole, team, multName } };
    },
  );

  // getPrevHole: get previous hole result
  jsonLogic.add_operation("getPrevHole", () => {
    return { __getPrevHole: true };
  });

  // getCurrHole: get current hole result
  jsonLogic.add_operation("getCurrHole", () => {
    return { __getCurrHole: true };
  });

  // playersOnTeam: count players on a team
  jsonLogic.add_operation("playersOnTeam", (teamRef: string) => {
    return { __playersOnTeam: teamRef };
  });

  // isWolfPlayer: check if wolf player
  jsonLogic.add_operation("isWolfPlayer", () => {
    return { __isWolfPlayer: true };
  });

  // parOrBetter: check score against par
  jsonLogic.add_operation(
    "parOrBetter",
    (holeNum: string, scoreType: string) => {
      return { __parOrBetter: { holeNum, scoreType } };
    },
  );

  // holePar: get hole par
  jsonLogic.add_operation("holePar", (holeNum: string) => {
    return { __holePar: holeNum };
  });

  // existingPreMultiplierTotal: check threshold
  jsonLogic.add_operation(
    "existingPreMultiplierTotal",
    (hole: unknown, threshold: number) => {
      return { __existingPreMultiplierTotal: { hole, threshold } };
    },
  );

  // frontNinePreDoubleTotal: get total pre_double multiplier from front nine
  // Used for "Re Pre" option on hole 10 to carry over front nine multipliers
  // This operator returns the actual value (not a placeholder) so it can be used in comparisons
  jsonLogic.add_operation("frontNinePreDoubleTotal", (_team: unknown) => {
    if (!currentLogicCtx) {
      return 1;
    }
    return getFrontNinePreDoubleTotal(currentLogicCtx.ctx);
  });

  operatorsRegistered = true;
}

/**
 * Resolve custom operator placeholders with actual context
 */
function resolveOperatorResult(
  result: unknown,
  logicCtx: LogicContext,
  betterPoints: string,
): unknown {
  if (result === null || typeof result !== "object") {
    return result;
  }

  const obj = result as Record<string, unknown>;

  // team reference
  if ("__teamRef" in obj) {
    return getTeam(obj.__teamRef as string, logicCtx);
  }

  // countJunk with team reference
  if ("__countJunk" in obj) {
    const { teamRef, junkName } = obj.__countJunk as {
      teamRef: string;
      junkName: string;
    };
    const team = getTeam(teamRef, logicCtx);
    return countJunk(team, junkName, logicCtx.holeResult);
  }

  // rankWithTies
  if ("__rankWithTies" in obj) {
    const { rank, tieCount } = obj.__rankWithTies as {
      rank: number;
      tieCount: number;
    };
    return checkRankWithTies(rank, tieCount, logicCtx);
  }

  // team_down_the_most
  if ("__team_down_the_most" in obj) {
    const { prevHole, team } = obj.__team_down_the_most as {
      prevHole: unknown;
      team: unknown;
    };
    // Resolve the prevHole placeholder if needed
    const resolvedHole = resolveOperatorResult(
      prevHole,
      logicCtx,
      betterPoints,
    ) as HoleResult | null;
    // Resolve the team placeholder if needed
    const resolvedTeam = resolveOperatorResult(
      team,
      logicCtx,
      betterPoints,
    ) as TeamHoleResult | null;
    return isTeamDownTheMost(
      resolvedHole,
      resolvedTeam ?? logicCtx.team ?? null,
      logicCtx,
      betterPoints,
    );
  }

  // team_second_to_last
  if ("__team_second_to_last" in obj) {
    const { prevHole, team } = obj.__team_second_to_last as {
      prevHole: unknown;
      team: unknown;
    };
    // Resolve the prevHole placeholder if needed
    const resolvedHole = resolveOperatorResult(
      prevHole,
      logicCtx,
      betterPoints,
    ) as HoleResult | null;
    // Resolve the team placeholder if needed
    const resolvedTeam = resolveOperatorResult(
      team,
      logicCtx,
      betterPoints,
    ) as TeamHoleResult | null;
    return isTeamSecondToLast(
      resolvedHole,
      resolvedTeam ?? logicCtx.team ?? null,
      logicCtx,
      betterPoints,
    );
  }

  // other_team_multiplied_with
  if ("__other_team_multiplied_with" in obj) {
    const { multName } = obj.__other_team_multiplied_with as {
      multName: string;
    };
    return didOtherTeamMultiplyWith(
      logicCtx.holeResult ?? null,
      logicCtx.team ?? null,
      multName,
      logicCtx,
    );
  }

  // getPrevHole
  if ("__getPrevHole" in obj) {
    return getPrevHole(logicCtx);
  }

  // getCurrHole
  if ("__getCurrHole" in obj) {
    return getCurrHole(logicCtx);
  }

  // playersOnTeam
  if ("__playersOnTeam" in obj) {
    return playersOnTeam(obj.__playersOnTeam as string, logicCtx);
  }

  // isWolfPlayer
  if ("__isWolfPlayer" in obj) {
    return isWolfPlayer(logicCtx);
  }

  // parOrBetter
  if ("__parOrBetter" in obj) {
    const { holeNum, scoreType } = obj.__parOrBetter as {
      holeNum: string;
      scoreType: string;
    };
    return isParOrBetter(holeNum, scoreType, logicCtx);
  }

  // holePar
  if ("__holePar" in obj) {
    return getHolePar(logicCtx);
  }

  // existingPreMultiplierTotal
  if ("__existingPreMultiplierTotal" in obj) {
    const { threshold } = obj.__existingPreMultiplierTotal as {
      threshold: number;
    };
    return existingPreMultiplierTotal(logicCtx.holeResult ?? null, threshold);
  }

  // frontNinePreDoubleTotal - now returns value directly, no placeholder resolution needed

  return result;
}

/**
 * Evaluate a json-logic expression
 *
 * @param expression - JSON string with single quotes (from seed data)
 * @param logicCtx - Context for evaluation
 * @returns boolean result of evaluation
 *
 * @example
 * // Simple rank check
 * evaluateLogic("{'rankWithTies': [1, 1]}", ctx) // outright winner
 *
 * // Complex condition
 * evaluateLogic("{'and': [{'==': [{'countJunk': [{'team': ['this']}, 'birdie']}, 2]}]}", ctx)
 */
export function evaluateLogic(
  expression: string,
  logicCtx: LogicContext,
): boolean {
  if (!expression) return false;

  // Register operators on first use
  registerOperators();

  try {
    // Convert single quotes to double quotes for JSON parsing
    const jsonStr = expression.replace(/'/g, '"');
    const parsed = JSON.parse(jsonStr);

    // Get better points direction from option or default
    const betterPoints = (logicCtx.option?.better as string) ?? "higher";

    // Build data object for json-logic
    const data = {
      team: logicCtx.team,
      teams: logicCtx.teams,
      possiblePoints: logicCtx.possiblePoints ?? 0,
      junk: logicCtx.option,
      holeNum: logicCtx.holeNum,
    };

    // Set context for operators that need it during evaluation
    currentLogicCtx = logicCtx;

    // Apply json-logic
    const result = jsonLogic.apply(parsed, data);

    // Clear context
    currentLogicCtx = null;

    // Resolve any custom operator placeholders
    const resolved = resolveOperatorResult(result, logicCtx, betterPoints);

    return Boolean(resolved);
  } catch (error) {
    console.warn("Logic evaluation error:", error, "Expression:", expression);
    return false;
  }
}

/**
 * Simple check for rankWithTies pattern without full json-logic
 * Used as optimization for common case
 */
export function isSimpleRankCheck(
  expression: string,
): { rank: number; tieCount: number } | null {
  try {
    const jsonStr = expression.replace(/'/g, '"');
    const parsed = JSON.parse(jsonStr);

    if (parsed.rankWithTies && Array.isArray(parsed.rankWithTies)) {
      const [rank, tieCount] = parsed.rankWithTies;
      return { rank: Number(rank), tieCount: Number(tieCount) };
    }

    return null;
  } catch {
    return null;
  }
}
