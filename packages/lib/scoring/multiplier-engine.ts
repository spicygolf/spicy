/**
 * Multiplier Engine
 *
 * Evaluates multiplier options based on their data configuration.
 * NO game-specific code - all rules come from MultiplierOption fields:
 *
 * - based_on: Junk name that triggers this (e.g., "birdie" for birdie_bbq)
 * - availability: Logic expression for when multiplier can be activated
 * - sub_type: "automatic", "bbq", "press"
 * - scope: "player", "team", "hole", "rest_of_nine", "game"
 */

import type { MultiplierOption } from "../schema";
import { deepClone } from "../utils/clone";
import { evaluateLogic } from "./logic-engine";
import type {
  HoleResult,
  MultiplierAward,
  ScoringContext,
  TeamHoleResult,
} from "./types";

// =============================================================================
// Public API
// =============================================================================

/**
 * Evaluate all multiplier options for a hole and apply to players/teams
 *
 * @param holeResult - Current hole results with junk already awarded
 * @param ctx - Full scoring context with options
 * @returns Updated hole result with multipliers applied
 */
export function evaluateMultipliersForHole(
  holeResult: HoleResult,
  ctx: ScoringContext,
): HoleResult {
  // Deep clone to maintain immutability
  const result = deepClone(holeResult);

  // Get all multiplier options
  const multiplierOptions = getMultiplierOptions(ctx);

  for (const mult of multiplierOptions) {
    evaluateMultiplierOption(mult, result, ctx);
  }

  return result;
}

/**
 * Get all multiplier options from the context
 */
export function getMultiplierOptions(ctx: ScoringContext): MultiplierOption[] {
  const options = ctx.options;
  if (!options) return [];

  const multiplierOptions: MultiplierOption[] = [];

  for (const key of Object.keys(options)) {
    if (key.startsWith("$") || key === "_refs") continue;
    const opt = options[key];
    // Check if loaded and is a multiplier option
    if (opt?.$isLoaded && opt.type === "multiplier") {
      multiplierOptions.push(opt as MultiplierOption);
    }
  }

  // Sort by seq for consistent evaluation order
  return multiplierOptions.sort((a, b) => (a.seq ?? 999) - (b.seq ?? 999));
}

// =============================================================================
// Multiplier Evaluation
// =============================================================================

/**
 * Evaluate a single multiplier option and apply if conditions are met
 */
function evaluateMultiplierOption(
  mult: MultiplierOption,
  holeResult: HoleResult,
  ctx: ScoringContext,
): void {
  const subType = mult.sub_type;
  // Note: scope can be "hole" | "round" | "match" - currently only hole-level evaluation
  // const scope = mult.scope ?? "hole";

  // Automatic multipliers (triggered by junk)
  if (subType === "automatic" || subType === "bbq") {
    evaluateAutomaticMultiplier(mult, holeResult, ctx);
    return;
  }

  // User-activated multipliers (press, double)
  if (subType === "press" || mult.based_on === "user") {
    evaluateUserMultiplier(mult, holeResult, ctx);
    return;
  }
}

/**
 * Evaluate automatic/BBQ multipliers
 *
 * These are triggered when a specific junk is awarded.
 * Example: birdie_bbq triggers when a birdie is awarded.
 */
function evaluateAutomaticMultiplier(
  mult: MultiplierOption,
  holeResult: HoleResult,
  ctx: ScoringContext,
): void {
  const basedOn = mult.based_on;
  const scope = mult.scope ?? "hole";

  if (!basedOn) return;

  // Check if the triggering junk was awarded
  if (scope === "hole" || scope === "team") {
    // Check teams for the junk
    for (const [_teamId, teamResult] of Object.entries(holeResult.teams)) {
      const hasJunk = teamHasJunk(teamResult, basedOn, holeResult);

      if (hasJunk) {
        // Check availability condition if present
        if (
          mult.availability &&
          !evaluateAvailability(mult.availability, teamResult, holeResult, ctx)
        ) {
          continue;
        }

        teamResult.multipliers.push({
          name: mult.name,
          value: mult.value ?? 2,
        });
      }
    }
  }

  if (scope === "player") {
    // Check players for the junk
    for (const [_playerId, playerResult] of Object.entries(
      holeResult.players,
    )) {
      const hasJunk = playerResult.junk.some((j) => j.name === basedOn);

      if (hasJunk) {
        playerResult.multipliers.push({
          name: mult.name,
          value: mult.value ?? 2,
        });
      }
    }
  }
}

/**
 * Check if a team or any of its players has the specified junk
 */
function teamHasJunk(
  teamResult: TeamHoleResult,
  junkName: string,
  holeResult: HoleResult,
): boolean {
  // Check team junk
  if (teamResult.junk.some((j) => j.name === junkName)) {
    return true;
  }

  // Check player junk for team members
  for (const playerId of teamResult.playerIds) {
    const playerResult = holeResult.players[playerId];
    if (playerResult?.junk.some((j) => j.name === junkName)) {
      return true;
    }
  }

  return false;
}

/**
 * Evaluate user-activated multipliers (press, double, pre_double)
 *
 * User multipliers are stored in gameHole.teams[].options[] as TeamOption.
 * This is the same location as junk for consistency.
 *
 * For multi-hole multipliers (e.g., pre_double), check if:
 * 1. The multiplier was activated on THIS hole, OR
 * 2. The multiplier was activated on a PREVIOUS hole with firstHole set
 *    and this hole is within the same nine
 */
function evaluateUserMultiplier(
  mult: MultiplierOption,
  holeResult: HoleResult,
  ctx: ScoringContext,
): void {
  const gameHole = ctx.gameHoles.find((h) => h.hole === holeResult.hole);
  if (!gameHole?.teams?.$isLoaded) return;

  const currentHoleNum = Number.parseInt(holeResult.hole, 10);

  // Check each team for this multiplier
  for (const team of gameHole.teams) {
    if (!team?.$isLoaded || !team.options?.$isLoaded) continue;

    const teamId = team.team;
    const teamResult = holeResult.teams[teamId];
    if (!teamResult) continue;

    // Check if this team has the multiplier on this hole
    let hasMultiplier = false;
    let multiplierValue = mult.value ?? 2;

    for (const opt of team.options) {
      if (!opt?.$isLoaded) continue;
      if (opt.optionName === mult.name) {
        hasMultiplier = true;
        // Use the value from the option if present
        if (opt.value) {
          const parsed = Number.parseInt(opt.value, 10);
          if (!Number.isNaN(parsed)) {
            multiplierValue = parsed;
          }
        }
        break;
      }
    }

    // If not found on this hole, check for multi-hole multipliers from earlier holes
    if (!hasMultiplier && mult.scope === "rest_of_nine") {
      hasMultiplier = checkMultiHoleMultiplier(
        mult.name,
        teamId,
        currentHoleNum,
        ctx,
      );
    }

    if (hasMultiplier) {
      // Check availability condition if present
      if (
        mult.availability &&
        !evaluateAvailability(mult.availability, teamResult, holeResult, ctx)
      ) {
        continue;
      }

      teamResult.multipliers.push({
        name: mult.name,
        value: multiplierValue,
      });
    }
  }
}

/**
 * Check if a multi-hole multiplier (like pre_double) applies to this hole
 * by looking at earlier holes in the same nine
 */
function checkMultiHoleMultiplier(
  multName: string,
  teamId: string,
  currentHoleNum: number,
  ctx: ScoringContext,
): boolean {
  // Determine the start of this nine (1 for front, 10 for back)
  const nineStart = currentHoleNum <= 9 ? 1 : 10;

  // Check all previous holes in this nine
  for (let holeNum = nineStart; holeNum < currentHoleNum; holeNum++) {
    const gameHole = ctx.gameHoles.find((h) => h.hole === String(holeNum));
    if (!gameHole?.teams?.$isLoaded) continue;

    for (const team of gameHole.teams) {
      if (!team?.$isLoaded || team.team !== teamId) continue;
      if (!team.options?.$isLoaded) continue;

      for (const opt of team.options) {
        if (!opt?.$isLoaded) continue;
        if (opt.optionName === multName && opt.firstHole) {
          // This is a multi-hole multiplier that started on this earlier hole
          // It applies to this hole since we're still in the same nine
          return true;
        }
      }
    }
  }

  return false;
}

// =============================================================================
// Availability Evaluation
// =============================================================================

/**
 * Evaluate an availability condition
 *
 * Availability is a JSON Logic expression that determines when a multiplier
 * can be activated. Uses the full json-logic engine for complex expressions.
 *
 * Common patterns:
 * - team_down_the_most: Team that is losing the most
 * - team_second_to_last: Team that is second to last
 * - playersOnTeam: Check team size (for wolf game)
 * - other_team_multiplied_with: Check opponent's multipliers
 */
export function evaluateAvailability(
  availability: string,
  teamResult: TeamHoleResult,
  holeResult: HoleResult,
  ctx: ScoringContext,
  possiblePoints?: number,
): boolean {
  if (!availability) return true;

  const teams = Object.values(holeResult.teams);

  return evaluateLogic(availability, {
    ctx,
    holeNum: holeResult.hole,
    holeResult,
    team: teamResult,
    teams,
    possiblePoints,
    option: { name: "multiplier_availability" },
  });
}

// =============================================================================
// Multiplier Application
// =============================================================================

/**
 * Calculate the total multiplier for a player/team
 *
 * Multiple multipliers stack multiplicatively.
 * Example: 2x * 2x = 4x
 */
export function calculateTotalMultiplier(
  multipliers: MultiplierAward[],
): number {
  if (multipliers.length === 0) return 1;
  return multipliers.reduce((product, m) => product * m.value, 1);
}
