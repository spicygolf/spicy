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
import {
  evaluateAvailability,
  getFrontNinePreDoubleTotalFromHoles,
  getHoleTeeMultiplierTotalWithOverride,
  getOptionValueForHole,
} from "spicylib/scoring";

/**
 * Get user-markable junk options from game spec
 * These are junk options with based_on: "user" and show_in: "score" or "faves"
 */
export function getUserJunkOptions(game: Game): JunkOption[] {
  const junkOptions: JunkOption[] = [];

  // Get options from game.spec (working copy)
  const spec = game.spec?.$isLoaded ? game.spec : null;
  if (!spec) return junkOptions;

  // Options are plain JSON objects, no $isLoaded check needed
  for (const key of Object.keys(spec)) {
    const opt = spec[key];
    if (
      opt &&
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

  // Get options from game.spec (working copy)
  const spec = game.spec?.$isLoaded ? game.spec : null;
  if (!spec) return junkOptions;

  // Options are plain JSON objects, no $isLoaded check needed
  for (const key of Object.keys(spec)) {
    const opt = spec[key];
    if (
      opt &&
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

  // Get options from game.spec (working copy)
  const spec = game.spec?.$isLoaded ? game.spec : null;
  if (!spec) return junkOptions;

  // Options are plain JSON objects, no $isLoaded check needed
  for (const key of Object.keys(spec)) {
    const opt = spec[key];
    if (
      opt &&
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

  // Get options from game.spec (working copy)
  const spec = game.spec?.$isLoaded ? game.spec : null;
  if (!spec) return multiplierOptions;

  // Options are plain JSON objects, no $isLoaded check needed
  for (const key of Object.keys(spec)) {
    const opt = spec[key];
    if (opt && opt.type === "multiplier" && opt.based_on === "user") {
      multiplierOptions.push(opt);
    }
  }

  multiplierOptions.sort((a, b) => (a.seq ?? 999) - (b.seq ?? 999));

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
    return getFrontNinePreDoubleTotalFromHoles(gameHoles);
  }

  // Unknown value_from, use default
  return mult.value ?? 2;
}

/**
 * Check if a multiplier is available for a team based on its availability condition
 * and the max_off_tee cap.
 *
 * Two checks are performed:
 * 1. JSON Logic availability condition (e.g., team_down_the_most)
 * 2. max_off_tee cap: adding this multiplier must not push the hole's tee total above the cap
 *
 * If the multiplier has no availability condition, only the cap check applies.
 * If the context is not available, we can't evaluate so we return true (show it).
 *
 * @param mult - The multiplier option to check
 * @param ctx - The scoring context
 * @param holeNum - Current hole number as string
 * @param teamId - The team ID to check availability for
 * @returns true if the multiplier is available
 */
export function isMultiplierAvailable(
  mult: MultiplierOption,
  ctx: ScoringContext | null,
  holeNum: string,
  teamId: string,
): boolean {
  // If no context, can't evaluate - show the multiplier
  if (!ctx) return true;

  const scoreboard = ctx.scoreboard;
  if (!scoreboard) return true;

  const holeResult = scoreboard.holes[holeNum];
  if (!holeResult) return true;

  const teamResult = holeResult.teams[teamId];
  if (!teamResult) return true;

  // 1. Check JSON Logic availability condition
  if (mult.availability) {
    try {
      const logicResult = evaluateAvailability(
        mult.availability,
        teamResult as TeamHoleResult,
        holeResult,
        ctx,
      );
      if (!logicResult) return false;
    } catch {
      // If evaluation fails, continue to cap check
    }
  }

  // 2. Check max_off_tee cap (implied condition for all multipliers)
  const maxOffTee = getOptionValueForHole("max_off_tee", holeNum, ctx);
  if (typeof maxOffTee === "number" && maxOffTee > 0) {
    const currentTotal = getHoleTeeMultiplierTotalWithOverride(holeResult);
    const multValue = getMultiplierValue(mult, ctx.gameHoles);

    // Calculate what the total would be if this multiplier is added
    let projectedTotal: number;
    if (mult.override) {
      // Override multipliers replace all non-override, so just check their own value
      projectedTotal = multValue;
    } else {
      projectedTotal = currentTotal * multValue;
    }

    if (projectedTotal > maxOffTee) return false;
  }

  return true;
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
 * Check if a hole requires a tee flip to determine which team gets multiplier buttons.
 *
 * Required when teams are tied going into this hole (previous hole's runningDiff === 0
 * for all teams) or when there is no previous hole result (first hole of the round).
 * Only applies to 2-team games with user-based multiplier options.
 *
 * Returns false during progressive loading (scoreboard null) to prevent
 * premature modal display that causes render oscillation.
 *
 * Uses holesList ordering (not hole number arithmetic) to find the previous hole,
 * so it is forward-compatible with shotgun starts where the round may begin on any hole.
 *
 * @param scoreboard - Current game scoreboard
 * @param currentHoleIndex - 0-based index into holesList
 * @param holesList - Ordered list of hole number strings from useHoleNavigation
 * @param teamCount - Number of teams on the current hole
 * @param hasMultiplierOptions - Whether the game has user-based team multiplier options
 * @returns true if a tee flip is needed before showing multiplier buttons
 */
export function isTeeFlipRequired(
  scoreboard: Scoreboard | null,
  currentHoleIndex: number,
  holesList: string[],
  teamCount: number,
  hasMultiplierOptions: boolean,
): boolean {
  if (teamCount !== 2 || !hasMultiplierOptions) return false;

  // Wait for scoreboard to be computed before deciding.
  // During Jazz progressive loading scoreboard is null; showing the modal
  // prematurely causes render oscillation as data loads and the decision flips.
  if (!scoreboard) return false;

  // Find previous hole by list position, not by hole number arithmetic
  const prevHoleNumber =
    currentHoleIndex > 0 ? holesList[currentHoleIndex - 1] : undefined;

  // No previous hole (first hole of round) → always tied
  if (!prevHoleNumber) return true;

  const prevHoleResult = scoreboard.holes?.[prevHoleNumber];
  if (!prevHoleResult) return true;

  const teams = Object.values(prevHoleResult.teams);
  if (teams.length < 2) return false;

  return teams.every((t) => (t.runningDiff ?? 0) === 0);
}

/**
 * Get the tee flip winner team ID from the stored TeamOption.
 *
 * Scans all teams' options for a "tee_flip_winner" option matching the current hole.
 * Returns null if no tee flip result has been recorded for this hole.
 *
 * @param allTeams - All teams on the current hole
 * @param currentHoleNumber - Current hole number as string
 * @returns The winning team's ID, or null if no result stored
 */
export function getTeeFlipWinner(
  allTeams: Team[],
  currentHoleNumber: string,
): string | null {
  for (const team of allTeams) {
    if (!team?.$isLoaded || !team.options?.$isLoaded) continue;
    for (const opt of team.options) {
      if (
        opt?.$isLoaded &&
        opt.optionName === "tee_flip_winner" &&
        opt.firstHole === currentHoleNumber
      ) {
        return team.team ?? null;
      }
    }
  }
  return null;
}

/**
 * Get the tee flip declined state for a given hole.
 *
 * Scans all teams' options for a "tee_flip_declined" option matching the current hole.
 * Returns true if the tee flip was declined (user chose "No" on the confirmation dialog).
 *
 * @param allTeams - All teams on the current hole
 * @param currentHoleNumber - Current hole number as string
 * @returns true if the tee flip was declined for this hole
 */
export function getTeeFlipDeclined(
  allTeams: Team[],
  currentHoleNumber: string,
): boolean {
  for (const team of allTeams) {
    if (!team?.$isLoaded || !team.options?.$isLoaded) continue;
    for (const opt of team.options) {
      if (
        opt?.$isLoaded &&
        opt.optionName === "tee_flip_declined" &&
        opt.firstHole === currentHoleNumber
      ) {
        return true;
      }
    }
  }
  return false;
}

/**
 * Check if the current hole is the earliest hole that needs a tee flip resolution.
 *
 * Scans from the start of holesList to find the first hole where:
 * - isTeeFlipRequired is true (score is tied)
 * - No tee_flip_winner AND no tee_flip_declined recorded
 *
 * Only auto-prompts on that earliest unresolved hole. Later tied holes still
 * show teeFlipRequired (for replay icon, multiplier blocking) but do NOT auto-pop.
 *
 * During Jazz progressive loading, earlier holes' teams may not be loaded yet.
 * These unverifiable holes are skipped rather than blocking the current hole,
 * since the user can only act on the hole they're viewing.
 *
 * @param scoreboard - Current game scoreboard
 * @param holesList - Ordered list of hole number strings
 * @param currentHoleIndex - 0-based index into holesList for the current hole
 * @param allTeams - All teams (used to check for winner/declined across all holes)
 * @param teamCount - Number of teams
 * @param hasMultiplierOptions - Whether the game has multiplier options
 * @param gameHoles - All game holes for accessing team options on other holes
 * @returns true if this is the earliest hole needing a tee flip
 */
export function isEarliestUnflippedHole(
  scoreboard: Scoreboard | null,
  holesList: string[],
  currentHoleIndex: number,
  allTeams: Team[],
  teamCount: number,
  hasMultiplierOptions: boolean,
  gameHoles: GameHole[],
): boolean {
  if (!scoreboard) return false;

  // Find the first hole that needs a tee flip and has no result
  for (let i = 0; i < holesList.length; i++) {
    const holeNum = holesList[i];
    const required = isTeeFlipRequired(
      scoreboard,
      i,
      holesList,
      teamCount,
      hasMultiplierOptions,
    );

    if (!required) continue;

    // Check if this hole already has a winner or was declined
    // For the current hole, use allTeams directly
    // For other holes, look up teams from gameHoles
    let teamsForHole: Team[];
    if (i === currentHoleIndex) {
      teamsForHole = allTeams;
    } else {
      const gameHole = gameHoles.find((h) => h.hole === holeNum);
      if (!gameHole?.teams?.$isLoaded) {
        // Teams not loaded yet for this earlier hole — skip it.
        // During progressive loading we can't verify whether this hole
        // was already resolved. Blocking the current hole would prevent
        // the modal from ever showing, so we optimistically skip and
        // let the scan continue to the current hole.
        continue;
      }
      teamsForHole = [...gameHole.teams].filter((t) => t?.$isLoaded) as Team[];
    }

    const hasWinner = getTeeFlipWinner(teamsForHole, holeNum) !== null;
    const hasDeclined = getTeeFlipDeclined(teamsForHole, holeNum);

    if (!hasWinner && !hasDeclined) {
      // This is the earliest unresolved hole
      return i === currentHoleIndex;
    }
  }

  // No unresolved holes found
  return false;
}

/**
 * Custom multiplier state for the hole toolbar
 */
export interface CustomMultiplierState {
  /** Whether a custom multiplier is active on this hole */
  isActive: boolean;
  /** The custom multiplier value (if active) */
  value: number;
  /** The team ID that owns the custom multiplier (if active) */
  ownerTeamId: string | null;
}

/**
 * Get the custom multiplier state for the current hole.
 *
 * Custom multipliers have scope "none" and input_value true.
 * The value is stored in TeamOption.value as a string number.
 *
 * @param multiplierOptions - All multiplier options from the game spec
 * @param allTeams - All teams on the current hole
 * @param currentHoleNumber - Current hole number as string (e.g., "3")
 * @returns CustomMultiplierState with active status, value, and owner
 */
export function getCustomMultiplierState(
  multiplierOptions: MultiplierOption[],
  allTeams: Team[],
  currentHoleNumber: string,
): CustomMultiplierState {
  // Find the custom multiplier option (scope: "none", input_value: true)
  const customMult = multiplierOptions.find(
    (m) => m.scope === "none" && m.input_value === true,
  );

  if (!customMult) {
    return { isActive: false, value: 0, ownerTeamId: null };
  }

  // Check each team for the custom multiplier
  for (const team of allTeams) {
    if (!team?.$isLoaded) continue;
    if (!team.options?.$isLoaded) continue;

    for (const opt of team.options) {
      if (!opt?.$isLoaded) continue;
      if (
        opt.optionName === customMult.name &&
        opt.firstHole === currentHoleNumber
      ) {
        // Found it - parse the value
        const parsed = Number.parseInt(opt.value, 10);
        const value = Number.isNaN(parsed) ? 0 : parsed;
        return {
          isActive: true,
          value,
          ownerTeamId: team.team ?? null,
        };
      }
    }
  }

  return { isActive: false, value: 0, ownerTeamId: null };
}

/**
 * Get the custom multiplier option from the game spec (if it exists)
 *
 * @param multiplierOptions - All multiplier options from the game spec
 * @returns The custom multiplier option, or null if not found
 */
export function getCustomMultiplierOption(
  multiplierOptions: MultiplierOption[],
): MultiplierOption | null {
  return (
    multiplierOptions.find(
      (m) => m.scope === "none" && m.input_value === true,
    ) ?? null
  );
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
        // Only count options where firstHole matches the hole we're examining
        // This handles old imported data that duplicated options across holes
        if (opt.optionName === mult.name && opt.firstHole === String(holeNum)) {
          inherited.push({
            firstHole: opt.firstHole,
            value: getMultiplierValue(mult, gameHoles),
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
        // Only match options where firstHole matches the hole we're examining
        // This handles old imported data that duplicated options across holes
        if (opt.optionName === mult.name && opt.firstHole === String(holeNum)) {
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
