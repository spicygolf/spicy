/**
 * Scoring View Utility Functions
 *
 * Pure functions for extracting and checking game options from Jazz data.
 * These do not mutate data - they only read and compute.
 */

import type {
  Game,
  GameHole,
  JunkOption,
  MultiplierOption,
  Team,
} from "spicylib/schema";
import type {
  Scoreboard,
  ScoringContext,
  TeamHoleResult,
} from "spicylib/scoring";
import { evaluateAvailability } from "spicylib/scoring";

/**
 * Get user-markable junk options from game spec
 * These are junk options with based_on: "user" and show_in: "score" or "faves"
 */
export function getUserJunkOptions(game: Game): JunkOption[] {
  const junkOptions: JunkOption[] = [];

  // Get options from game spec
  const spec = game.specs?.$isLoaded ? game.specs[0] : null;
  if (!spec?.$isLoaded) return junkOptions;

  const options = spec.options;
  if (!options?.$isLoaded) return junkOptions;

  for (const key of Object.keys(options)) {
    const opt = options[key];
    if (
      opt?.$isLoaded &&
      opt.type === "junk" &&
      opt.based_on === "user" &&
      (opt.show_in === "score" || opt.show_in === "faves")
    ) {
      junkOptions.push(opt);
    }
  }

  // Sort by seq
  junkOptions.sort((a, b) => (a.seq ?? 999) - (b.seq ?? 999));

  return junkOptions;
}

/**
 * Get calculated (automatic) junk options from game spec
 * These are player-scoped junk options with based_on: "gross", "net", or logic-based
 * Examples: birdie, eagle (based on score_to_par)
 */
export function getCalculatedPlayerJunkOptions(game: Game): JunkOption[] {
  const junkOptions: JunkOption[] = [];

  const spec = game.specs?.$isLoaded ? game.specs[0] : null;
  if (!spec?.$isLoaded) return junkOptions;

  const options = spec.options;
  if (!options?.$isLoaded) return junkOptions;

  for (const key of Object.keys(options)) {
    const opt = options[key];
    if (
      opt?.$isLoaded &&
      opt.type === "junk" &&
      opt.scope === "player" &&
      opt.based_on !== "user" && // Not user-marked
      (opt.show_in === "score" || opt.show_in === "faves")
    ) {
      junkOptions.push(opt);
    }
  }

  junkOptions.sort((a, b) => (a.seq ?? 999) - (b.seq ?? 999));
  return junkOptions;
}

/**
 * Get calculated (automatic) team junk options from game spec
 * These are team-scoped junk options with calculation: "best_ball", "sum", etc.
 * Examples: low_ball, low_total
 *
 * Note: We don't filter by show_in here because the scoring engine awards
 * these based on calculation, and they should be shown if earned.
 * The show_in field may not be set on older data.
 */
export function getCalculatedTeamJunkOptions(game: Game): JunkOption[] {
  const junkOptions: JunkOption[] = [];

  const spec = game.specs?.$isLoaded ? game.specs[0] : null;
  if (!spec?.$isLoaded) return junkOptions;

  const options = spec.options;
  if (!options?.$isLoaded) return junkOptions;

  for (const key of Object.keys(options)) {
    const opt = options[key];
    if (
      opt?.$isLoaded &&
      opt.type === "junk" &&
      opt.scope === "team" &&
      opt.calculation && // Has a calculation method (best_ball, sum, etc.)
      opt.show_in !== "none" // Only exclude if explicitly hidden
    ) {
      junkOptions.push(opt);
    }
  }

  junkOptions.sort((a, b) => (a.seq ?? 999) - (b.seq ?? 999));
  return junkOptions;
}

/**
 * Check if a player has calculated junk from the scoreboard
 */
export function hasCalculatedPlayerJunk(
  scoreboard: Scoreboard | null,
  holeNum: string,
  playerId: string,
  junkName: string,
): boolean {
  if (!scoreboard) return false;

  const holeResult = scoreboard.holes[holeNum];
  if (!holeResult) return false;

  const playerResult = holeResult.players[playerId];
  if (!playerResult) return false;

  return playerResult.junk.some((j) => j.name === junkName);
}

/**
 * Check if a team has calculated junk from the scoreboard
 */
export function hasCalculatedTeamJunk(
  scoreboard: Scoreboard | null,
  holeNum: string,
  teamId: string,
  junkName: string,
): boolean {
  if (!scoreboard) return false;

  const holeResult = scoreboard.holes[holeNum];
  if (!holeResult) return false;

  const teamResult = holeResult.teams[teamId];
  if (!teamResult) return false;

  return teamResult.junk.some((j) => j.name === junkName);
}

/**
 * Check if a player has a specific junk option on this hole
 */
export function hasPlayerJunk(
  team: Team,
  playerId: string,
  junkName: string,
): boolean {
  if (!team.options?.$isLoaded) return false;

  for (const opt of team.options) {
    if (
      opt?.$isLoaded &&
      opt.optionName === junkName &&
      opt.playerId === playerId &&
      opt.value === "true"
    ) {
      return true;
    }
  }
  return false;
}

/**
 * Get team-scoped multiplier options from game spec
 * These are multiplier options with based_on: "user"
 */
export function getMultiplierOptions(game: Game): MultiplierOption[] {
  const multiplierOptions: MultiplierOption[] = [];

  const spec = game.specs?.$isLoaded ? game.specs[0] : null;
  if (!spec?.$isLoaded) return multiplierOptions;

  const options = spec.options;
  if (!options?.$isLoaded) return multiplierOptions;

  for (const key of Object.keys(options)) {
    const opt = options[key];
    if (
      opt?.$isLoaded &&
      opt.type === "multiplier" &&
      opt.based_on === "user"
    ) {
      multiplierOptions.push(opt);
    }
  }

  multiplierOptions.sort((a, b) => (a.seq ?? 999) - (b.seq ?? 999));

  // Debug: log multiplier options
  return multiplierOptions;
}

/**
 * Get the dynamic value for a multiplier based on its value_from field.
 *
 * @param mult - The multiplier option
 * @param gameHoles - All game holes for counting pre_doubles
 * @returns The calculated value, or mult.value if not dynamic
 */
export function getMultiplierValue(
  mult: MultiplierOption,
  gameHoles: GameHole[],
): number {
  // If no value_from, use static value
  if (!mult.value_from) {
    return mult.value ?? 2;
  }

  if (mult.value_from === "frontNinePreDoubleTotal") {
    return getFrontNinePreDoubleTotal(gameHoles);
  }

  // Unknown value_from, use default
  return mult.value ?? 2;
}

/**
 * Calculate the total pre_double multiplier value from the front nine for the whole game.
 * Used for the "Re Pre" option on hole 10.
 */
function getFrontNinePreDoubleTotal(gameHoles: GameHole[]): number {
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

/**
 * Check if a multiplier is available for a team based on its availability condition.
 * Uses the scoring engine's evaluateAvailability function to evaluate JSON Logic.
 *
 * If the multiplier has no availability condition, it's always available.
 * If the context is not available, we can't evaluate so we return true (show it).
 */
export function isMultiplierAvailable(
  mult: MultiplierOption,
  ctx: ScoringContext | null,
  holeNum: string,
  teamId: string,
): boolean {
  // If no availability condition, always available
  if (!mult.availability) return true;

  // If no context, can't evaluate - show the multiplier
  if (!ctx) return true;

  const scoreboard = ctx.scoreboard;
  if (!scoreboard) return true;

  const holeResult = scoreboard.holes[holeNum];
  if (!holeResult) return true;

  const teamResult = holeResult.teams[teamId];
  if (!teamResult) return true;

  try {
    return evaluateAvailability(
      mult.availability,
      teamResult as TeamHoleResult,
      holeResult,
      ctx,
    );
  } catch (e) {
    // If evaluation fails, show the multiplier
    console.warn("[isMultiplierAvailable] evaluation error:", e);
    return true;
  }
}

/**
 * Result of checking team multiplier status
 */
export interface MultiplierStatus {
  /** Whether the multiplier is active */
  active: boolean;
  /** The hole number where this multiplier was first activated (e.g., "17") */
  firstHole?: string;
}

/**
 * Check if a team has a specific multiplier activated on THIS hole
 * Returns active: true only if the multiplier was first activated on the current hole
 * (not inherited from a previous hole)
 *
 * @param team - The team to check
 * @param multiplierName - The multiplier option name
 * @param currentHoleNumber - The current hole number (e.g., "2")
 */
export function getTeamMultiplierStatus(
  team: Team,
  multiplierName: string,
  currentHoleNumber: string,
): MultiplierStatus {
  if (!team.options?.$isLoaded) return { active: false };

  for (const opt of team.options) {
    if (
      opt?.$isLoaded &&
      opt.optionName === multiplierName &&
      !opt.playerId // Team-level (no player)
    ) {
      // Only consider "active" if it was first activated on THIS hole
      const isActiveOnThisHole = opt.firstHole === currentHoleNumber;
      return {
        active: isActiveOnThisHole,
        firstHole: opt.firstHole,
      };
    }
  }
  return { active: false };
}

/**
 * Inherited multiplier instance info
 */
export interface InheritedMultiplier {
  /** The hole number where this multiplier was activated */
  firstHole: string;
  /** The multiplier value (e.g., 2 for 2x) */
  value: number;
}

/**
 * Get ALL inherited "rest_of_nine" multipliers from previous holes for a team.
 *
 * Unlike getInheritedMultiplierStatus which returns on first match, this function
 * returns ALL instances. This is needed for stackable multipliers like pre_double
 * where a team can have multiple active from different holes.
 *
 * @param mult - The multiplier option to check
 * @param teamId - The team ID to check
 * @param currentHoleNumber - Current hole number as string (e.g., "3")
 * @param gameHoles - All game holes (from scoring context)
 * @returns Array of inherited multiplier instances
 */
export function getAllInheritedMultipliers(
  mult: MultiplierOption,
  teamId: string,
  currentHoleNumber: string,
  gameHoles: GameHole[],
): InheritedMultiplier[] {
  const inherited: InheritedMultiplier[] = [];

  // Only check for rest_of_nine scoped multipliers
  if (mult.scope !== "rest_of_nine") {
    return inherited;
  }

  const currentHoleNum = Number.parseInt(currentHoleNumber, 10);
  if (Number.isNaN(currentHoleNum)) {
    return inherited;
  }

  // Determine the start of this nine (1 for front, 10 for back)
  const nineStart = currentHoleNum <= 9 ? 1 : 10;

  // Check all previous holes in this nine
  for (let holeNum = nineStart; holeNum < currentHoleNum; holeNum++) {
    const gameHole = gameHoles.find((h) => h.hole === String(holeNum));
    if (!gameHole?.teams?.$isLoaded) continue;

    for (const team of gameHole.teams) {
      if (!team?.$isLoaded || team.team !== teamId) continue;
      if (!team.options?.$isLoaded) continue;

      for (const opt of team.options) {
        if (!opt?.$isLoaded) continue;
        if (opt.optionName === mult.name && opt.firstHole) {
          inherited.push({
            firstHole: opt.firstHole,
            value: mult.value ?? 2,
          });
        }
      }
    }
  }

  return inherited;
}

/**
 * Check for inherited "rest_of_nine" multipliers from previous holes
 *
 * For multipliers with scope "rest_of_nine", we need to look backwards through
 * previous holes on the same nine to see if the multiplier was activated earlier.
 *
 * @param mult - The multiplier option to check
 * @param teamId - The team ID to check
 * @param currentHoleNumber - Current hole number as string (e.g., "2")
 * @param gameHoles - All game holes (from scoring context)
 * @returns MultiplierStatus with active=true if inherited, plus the original firstHole
 */
export function getInheritedMultiplierStatus(
  mult: MultiplierOption,
  teamId: string,
  currentHoleNumber: string,
  gameHoles: GameHole[],
): MultiplierStatus {
  // Only check for rest_of_nine scoped multipliers
  if (mult.scope !== "rest_of_nine") {
    return { active: false };
  }

  const currentHoleNum = Number.parseInt(currentHoleNumber, 10);
  if (Number.isNaN(currentHoleNum)) {
    return { active: false };
  }

  // Determine the start of this nine (1 for front, 10 for back)
  const nineStart = currentHoleNum <= 9 ? 1 : 10;

  // Check all previous holes in this nine
  for (let holeNum = nineStart; holeNum < currentHoleNum; holeNum++) {
    const gameHole = gameHoles.find((h) => h.hole === String(holeNum));
    if (!gameHole?.teams?.$isLoaded) continue;

    for (const team of gameHole.teams) {
      if (!team?.$isLoaded || team.team !== teamId) continue;
      if (!team.options?.$isLoaded) continue;

      for (const opt of team.options) {
        if (!opt?.$isLoaded) continue;
        if (opt.optionName === mult.name && opt.firstHole) {
          // Found a multi-hole multiplier that started on this earlier hole
          return {
            active: true,
            firstHole: opt.firstHole,
          };
        }
      }
    }
  }

  return { active: false };
}
