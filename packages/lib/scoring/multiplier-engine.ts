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

/**
 * Calculate dynamic multiplier value based on value_from field.
 *
 * Supported value_from operators:
 * - "frontNinePreDoubleTotal": Returns total pre_double multiplier from front nine
 *
 * @param mult - The multiplier option with value_from field
 * @param teamId - The team ID to calculate for
 * @param ctx - The scoring context
 * @returns The calculated value, or the default mult.value if not calculable
 */
function calculateDynamicValue(
  mult: MultiplierOption,
  teamId: string,
  ctx: ScoringContext,
): number {
  if (!mult.value_from) {
    return mult.value ?? 2;
  }

  if (mult.value_from === "frontNinePreDoubleTotal") {
    return getFrontNinePreDoubleTotal(teamId, ctx);
  }

  // Unknown value_from, use default
  return mult.value ?? 2;
}

/**
 * Calculate the total pre_double multiplier value from the front nine for the whole game.
 *
 * Used for the "Re Pre" option on hole 10 - allows carrying over accumulated
 * pre_double multipliers from the front nine to the back nine.
 *
 * @param _teamId - Unused (kept for API compatibility)
 * @param ctx - The scoring context containing game holes
 * @returns The total pre_double value (e.g., 4 if two 2x pre_doubles), or 1 if none
 */
function getFrontNinePreDoubleTotal(
  _teamId: string,
  ctx: ScoringContext,
): number {
  const gameHoles = ctx.gameHoles;
  if (!gameHoles) return 1;

  let total = 1; // Start at 1x (no multiplier)

  // Check holes 1-9 for pre_double options across ALL teams
  for (let holeNum = 1; holeNum <= 9; holeNum++) {
    const gameHole = gameHoles.find((h) => h.hole === String(holeNum));
    if (!gameHole?.teams?.$isLoaded) continue;

    for (const team of gameHole.teams) {
      if (!team?.$isLoaded) continue;
      if (!team.options?.$isLoaded) continue;

      for (const opt of team.options) {
        if (!opt?.$isLoaded) continue;
        // Look for pre_double options with firstHole set (activated on this hole)
        if (opt.optionName === "pre_double" && opt.firstHole) {
          // Each pre_double is worth 2x, multiply into total
          total *= 2;
        }
      }
    }
  }

  return total;
}

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
  const basedOn = mult.based_on;
  // Note: scope can be "hole" | "round" | "match" - currently only hole-level evaluation
  // const scope = mult.scope ?? "hole";

  // User-activated multipliers (press, double)
  if (subType === "press" || basedOn === "user") {
    evaluateUserMultiplier(mult, holeResult, ctx);
    return;
  }

  // Automatic multipliers (triggered by junk)
  // These have sub_type "automatic" or "bbq", OR have a based_on that references another junk
  if (subType === "automatic" || subType === "bbq" || basedOn) {
    evaluateAutomaticMultiplier(mult, holeResult, ctx);
    return;
  }
}

/**
 * Calculate team's pre-multiplier junk points
 *
 * This calculates the sum of junk values for a team BEFORE multipliers are applied.
 * Used to check availability conditions like "team.points === possiblePoints" for BBQ multipliers.
 */
function calculateTeamJunkPoints(
  teamResult: TeamHoleResult,
  holeResult: HoleResult,
): number {
  // Sum team junk
  let points = teamResult.junk.reduce((sum, j) => sum + j.value, 0);

  // Sum player junk for players on this team
  for (const playerId of teamResult.playerIds) {
    const playerResult = holeResult.players[playerId];
    if (playerResult?.junk) {
      points += playerResult.junk.reduce((sum, j) => sum + j.value, 0);
    }
  }

  return points;
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
        // Calculate team's pre-multiplier junk points for availability check
        // This is needed because team.points is not set until the points stage
        if (mult.availability) {
          // Create a deep copy of teamResult with calculated points for availability check
          // Using deepClone ensures nested objects (junk, multipliers) are safely copied
          const teamJunkPoints = calculateTeamJunkPoints(
            teamResult,
            holeResult,
          );
          const teamWithPoints = deepClone(teamResult);
          teamWithPoints.points = teamJunkPoints;

          if (
            !evaluateAvailability(
              mult.availability,
              teamWithPoints,
              holeResult,
              ctx,
              holeResult.possiblePoints,
            )
          ) {
            continue;
          }
        }

        teamResult.multipliers.push({
          name: mult.name,
          value: mult.value ?? 2,
          override: mult.override,
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
          override: mult.override,
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
 * For multi-hole multipliers (e.g., pre_double), we need to count ALL instances:
 * 1. Multipliers activated on THIS hole
 * 2. Multipliers activated on PREVIOUS holes with firstHole set (rest_of_nine scope)
 *
 * Each instance adds a separate multiplier entry so they stack multiplicatively.
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
    if (!team?.$isLoaded) continue;

    const teamId = team.team;
    const teamResult = holeResult.teams[teamId];
    if (!teamResult) continue;

    // Use dynamic value calculation if value_from is set, otherwise use static value
    const multiplierValue = mult.value_from
      ? calculateDynamicValue(mult, teamId, ctx)
      : (mult.value ?? 2);

    // For rest_of_nine multipliers, count ALL instances from this hole and previous holes
    if (mult.scope === "rest_of_nine") {
      const instances = countMultiHoleMultiplierInstances(
        mult.name,
        teamId,
        currentHoleNum,
        ctx,
      );

      // Add one multiplier entry for each instance
      for (let i = 0; i < instances; i++) {
        teamResult.multipliers.push({
          name: mult.name,
          value: multiplierValue,
          override: mult.override,
        });
      }
    } else {
      // For non-rest_of_nine multipliers (e.g., "double", "twelve" with scope "hole"),
      // check if it's on this specific hole by matching firstHole
      let hasMultiplier = false;
      const currentHoleStr = String(currentHoleNum);

      if (team.options?.$isLoaded) {
        for (const opt of team.options) {
          if (!opt?.$isLoaded) continue;
          // Must match option name AND be activated on this specific hole
          if (
            opt.optionName === mult.name &&
            opt.firstHole === currentHoleStr
          ) {
            hasMultiplier = true;
            break;
          }
        }
      }

      if (hasMultiplier) {
        // For user-selected multipliers, we trust the UI already checked availability
        // before showing the button. Don't re-check here since holeMultiplier isn't
        // calculated yet during this evaluation phase.
        teamResult.multipliers.push({
          name: mult.name,
          value: multiplierValue,
          override: mult.override,
        });
      }
    }
  }
}

/**
 * Count all instances of a multi-hole multiplier for a team on the current hole.
 * This includes instances activated on the current hole AND all previous holes in the nine.
 */
function countMultiHoleMultiplierInstances(
  multName: string,
  teamId: string,
  currentHoleNum: number,
  ctx: ScoringContext,
): number {
  let count = 0;

  // Determine the start of this nine (1 for front, 10 for back)
  const nineStart = currentHoleNum <= 9 ? 1 : 10;

  // Check all holes from the start of the nine through current hole
  for (let holeNum = nineStart; holeNum <= currentHoleNum; holeNum++) {
    const gameHole = ctx.gameHoles.find((h) => h.hole === String(holeNum));
    if (!gameHole?.teams?.$isLoaded) continue;

    for (const team of gameHole.teams) {
      if (!team?.$isLoaded || team.team !== teamId) continue;
      if (!team.options?.$isLoaded) continue;

      for (const opt of team.options) {
        if (!opt?.$isLoaded) continue;
        // Count options that match the multiplier name and have firstHole set
        // (firstHole indicates it was activated on that hole)
        if (opt.optionName === multName && opt.firstHole) {
          count++;
        }
      }
    }
  }

  return count;
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
  debug?: boolean,
): boolean {
  if (!availability) return true;

  const teams = Object.values(holeResult.teams);

  const logicCtx = {
    ctx,
    holeNum: holeResult.hole,
    holeResult,
    team: teamResult,
    teams,
    possiblePoints,
    option: { name: "multiplier_availability" },
  };

  const result = evaluateLogic(availability, logicCtx);

  if (debug) {
    console.log("[evaluateAvailability] availability:", availability);
    console.log("[evaluateAvailability] holeNum:", holeResult.hole);
    console.log("[evaluateAvailability] teamId:", teamResult.teamId);
    console.log("[evaluateAvailability] result:", result);
  }

  return result;
}

// =============================================================================
// Multiplier Application
// =============================================================================

/**
 * Calculate the total multiplier for a player/team
 *
 * Multiple multipliers stack multiplicatively.
 * Example: 2x * 2x = 4x
 *
 * If any multiplier has override=true, it replaces the entire total.
 * The last override multiplier wins if multiple are present.
 */
export function calculateTotalMultiplier(
  multipliers: MultiplierAward[],
): number {
  if (multipliers.length === 0) return 1;

  // Check for override multipliers - they replace the total instead of stacking
  const overrideMultiplier = multipliers.find((m) => m.override);
  if (overrideMultiplier) {
    return overrideMultiplier.value;
  }

  return multipliers.reduce((product, m) => product * m.value, 1);
}
