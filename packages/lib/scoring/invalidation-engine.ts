/**
 * Invalidation Engine
 *
 * Detects multiplier selections and tee flip results that become invalid
 * after a retroactive score edit on an earlier hole.
 *
 * Uses a kind-discriminated `InvalidatedItem` type so new invalidation
 * categories can be added without changing the result type, modal, or
 * integration wiring.
 */

import type { GameHole, MultiplierOption } from "../schema";
import {
  evaluateAvailability,
  getMultiplierOptions,
} from "./multiplier-engine";
import type { Scoreboard, ScoringContext } from "./types";

// =============================================================================
// Types
// =============================================================================

/**
 * A single invalidated item, discriminated by kind.
 *
 * To add a new invalidation category:
 * 1. Add a variant here
 * 2. Add a detectXxxInvalidations() function
 * 3. Add a removal case in removeInvalidatedItem() (app layer)
 */
export type InvalidatedItem =
  | {
      kind: "multiplier";
      holeNum: string;
      teamId: string;
      name: string;
      disp: string;
      reason: string;
    }
  | {
      kind: "tee_flip";
      holeNum: string;
      reason: string;
    };

/**
 * Per-team score impact of removing invalidated items
 */
export interface ScoreImpact {
  /** Team identifier */
  teamId: string;
  /** Current pointsTotal (with stale multipliers) */
  currentTotal: number;
  /** Projected pointsTotal after removal */
  projectedTotal: number;
}

/**
 * Complete result of invalidation detection
 */
export interface InvalidationResult {
  /** All invalidated items */
  items: InvalidatedItem[];
  /** Per-team score impact */
  scoreImpact: ScoreImpact[];
  /** Convenience flag */
  hasInvalidations: boolean;
}

// =============================================================================
// Main Detection
// =============================================================================

/**
 * Detect invalidated multipliers and tee flips after a score edit.
 *
 * Takes the NEW scoreboard (already recalculated with the edited score)
 * and checks every hole AFTER editedHoleNum for:
 * 1. User-selected multipliers whose availability condition no longer holds
 * 2. Tee flip results where the tied/not-tied state has changed
 *
 * Pure function -- reads from scoreboard and game holes, does not mutate.
 *
 * @param scoreboard - Recalculated scoreboard after the score edit
 * @param ctx - Full scoring context after the score edit
 * @param editedHoleNum - The hole number that was edited (e.g., "2")
 * @param holesList - Ordered list of hole number strings
 * @param teeFlipEnabled - Whether the game has tee flip enabled
 * @returns InvalidationResult listing all invalidations found
 */
export function detectInvalidations(
  scoreboard: Scoreboard,
  ctx: ScoringContext,
  editedHoleNum: string,
  holesList: string[],
  teeFlipEnabled: boolean,
): InvalidationResult {
  const multiplierItems = detectMultiplierInvalidations(
    scoreboard,
    ctx,
    editedHoleNum,
    holesList,
  );

  const teeFlipItems = teeFlipEnabled
    ? detectTeeFlipInvalidations(scoreboard, ctx, editedHoleNum, holesList)
    : [];

  const items = [...multiplierItems, ...teeFlipItems];
  const scoreImpact = calculateScoreImpact(scoreboard, ctx, multiplierItems);

  return {
    items,
    scoreImpact,
    hasInvalidations: items.length > 0,
  };
}

// =============================================================================
// Multiplier Invalidation
// =============================================================================

/**
 * Detect user-selected multipliers whose availability no longer holds.
 *
 * For each hole after the edit, checks each team's TeamOptions against
 * evaluateAvailability(). Only checks multipliers with based_on: "user"
 * that have an availability condition.
 *
 * Includes a cascade pass for multipliers that depend on other multipliers
 * via other_team_multiplied_with.
 */
function detectMultiplierInvalidations(
  scoreboard: Scoreboard,
  ctx: ScoringContext,
  editedHoleNum: string,
  holesList: string[],
): InvalidatedItem[] {
  const multiplierOptions = getMultiplierOptions(ctx);
  const userMultsWithAvailability = multiplierOptions.filter(
    (m) => (m.sub_type === "press" || m.based_on === "user") && m.availability,
  );

  if (userMultsWithAvailability.length === 0) return [];

  // Find holes after the edited hole
  const editedIndex = holesList.indexOf(editedHoleNum);
  if (editedIndex < 0) return [];

  const holesAfterEdit = holesList.slice(editedIndex + 1);
  const items: InvalidatedItem[] = [];

  for (const holeNum of holesAfterEdit) {
    const holeResult = scoreboard.holes[holeNum];
    if (!holeResult) continue;

    const gameHole = ctx.gameHoles.find((h) => h.hole === holeNum);
    if (!gameHole?.teams?.$isLoaded) continue;

    for (const team of gameHole.teams) {
      if (!team?.$isLoaded) continue;
      if (!team.options?.$isLoaded) continue;

      const teamId = team.team;
      if (!teamId) continue;

      const teamResult = holeResult.teams[teamId];
      if (!teamResult) continue;

      for (const opt of team.options) {
        if (!opt?.$isLoaded || opt.playerId) continue;

        // Find matching multiplier definition
        const multDef = userMultsWithAvailability.find(
          (m) => m.name === opt.optionName,
        );
        if (!multDef?.availability) continue;

        const optFirstHole = opt.firstHole;
        if (!optFirstHole) continue;

        // For rest_of_nine scope, only check the instance where firstHole matches
        // (the option persists on the activation hole, inherited holes just count it)
        if (multDef.scope === "rest_of_nine" && optFirstHole !== holeNum) {
          // Check if this inherited multiplier's ORIGINAL activation was valid
          // by checking against the hole where it was first activated
          const firstHoleResult = scoreboard.holes[optFirstHole];
          if (firstHoleResult) {
            const firstHoleTeamResult = firstHoleResult.teams[teamId];
            if (firstHoleTeamResult) {
              const isValid = evaluateAvailability(
                multDef.availability,
                firstHoleTeamResult,
                firstHoleResult,
                ctx,
              );
              if (!isValid) {
                items.push({
                  kind: "multiplier",
                  holeNum: optFirstHole,
                  teamId,
                  name: multDef.name,
                  disp: multDef.disp,
                  reason: buildAvailabilityReason(multDef, teamId),
                });
              }
            }
          }
          continue;
        }

        // For hole-scoped multipliers, only check if firstHole matches current hole
        if (optFirstHole !== holeNum) continue;

        // Re-evaluate availability against the new scoreboard
        const isValid = evaluateAvailability(
          multDef.availability,
          teamResult,
          holeResult,
          ctx,
        );

        if (!isValid) {
          items.push({
            kind: "multiplier",
            holeNum,
            teamId,
            name: multDef.name,
            disp: multDef.disp,
            reason: buildAvailabilityReason(multDef, teamId),
          });
        }
      }
    }
  }

  // Cascade pass: check for multipliers that depend on invalidated ones
  const cascadeItems = detectCascadeInvalidations(
    items,
    multiplierOptions,
    ctx,
  );

  // Deduplicate (cascade might find items already in the list)
  const allItems = [...items];
  for (const ci of cascadeItems) {
    if (ci.kind !== "multiplier") continue;
    const isDupe = allItems.some(
      (i) =>
        i.kind === "multiplier" &&
        i.holeNum === ci.holeNum &&
        i.teamId === ci.teamId &&
        i.name === ci.name,
    );
    if (!isDupe) {
      allItems.push(ci);
    }
  }

  return allItems;
}

/**
 * Detect multipliers that depend on other invalidated multipliers.
 *
 * Uses the same string-match heuristic as removeDependentMultipliers
 * in ScoringView.tsx -- checks if a multiplier's availability expression
 * contains other_team_multiplied_with referencing the invalidated multiplier.
 */
function detectCascadeInvalidations(
  invalidatedItems: InvalidatedItem[],
  multiplierOptions: MultiplierOption[],
  ctx: ScoringContext,
): InvalidatedItem[] {
  const cascadeItems: InvalidatedItem[] = [];

  const invalidatedMultipliers = invalidatedItems.filter(
    (i): i is Extract<InvalidatedItem, { kind: "multiplier" }> =>
      i.kind === "multiplier",
  );

  for (const invalidated of invalidatedMultipliers) {
    // Find multipliers whose availability references the invalidated one
    const dependents = multiplierOptions.filter((m) => {
      if (!m.availability) return false;
      return (
        m.availability.includes("other_team_multiplied_with") &&
        (m.availability.includes(`'${invalidated.name}'`) ||
          m.availability.includes(`"${invalidated.name}"`))
      );
    });

    for (const depMult of dependents) {
      // Check OTHER teams on the same hole for the dependent multiplier
      const gameHole = ctx.gameHoles.find(
        (h) => h.hole === invalidated.holeNum,
      );
      if (!gameHole?.teams?.$isLoaded) continue;

      for (const team of gameHole.teams) {
        if (!team?.$isLoaded || team.team === invalidated.teamId) continue;
        if (!team.options?.$isLoaded) continue;

        const teamId = team.team;
        if (!teamId) continue;

        for (const opt of team.options) {
          if (!opt?.$isLoaded) continue;
          if (
            opt.optionName === depMult.name &&
            opt.firstHole === invalidated.holeNum &&
            !opt.playerId
          ) {
            cascadeItems.push({
              kind: "multiplier",
              holeNum: invalidated.holeNum,
              teamId,
              name: depMult.name,
              disp: depMult.disp,
              reason: `Depends on Team ${invalidated.teamId}'s ${invalidated.disp}`,
            });
          }
        }
      }
    }
  }

  return cascadeItems;
}

/**
 * Build a human-readable reason for why a multiplier's availability failed.
 */
function buildAvailabilityReason(
  mult: MultiplierOption,
  teamId: string,
): string {
  const availability = mult.availability ?? "";

  if (availability.includes("team_down_the_most")) {
    return `Team ${teamId} is no longer down the most`;
  }
  if (availability.includes("team_second_to_last")) {
    return `Team ${teamId} is no longer second to last`;
  }
  if (availability.includes("preDoubleTotal")) {
    return "Pre-press total is no longer 8x or higher";
  }
  if (availability.includes("frontNinePreDoubleTotal")) {
    return "Front nine pre-press total changed";
  }

  return "Availability condition no longer met";
}

// =============================================================================
// Tee Flip Invalidation
// =============================================================================

/**
 * Detect stale tee flip results.
 *
 * A tee flip result is stale when it exists (teams were tied) but the
 * previous hole's scores now show teams are NOT tied.
 *
 * Only detects stale flips. Missing flips (newly tied where no flip exists)
 * are handled by the normal tee flip prompt on navigation.
 */
function detectTeeFlipInvalidations(
  scoreboard: Scoreboard,
  ctx: ScoringContext,
  editedHoleNum: string,
  holesList: string[],
): InvalidatedItem[] {
  const editedIndex = holesList.indexOf(editedHoleNum);
  if (editedIndex < 0) return [];

  const holesAfterEdit = holesList.slice(editedIndex + 1);
  const items: InvalidatedItem[] = [];

  for (let i = 0; i < holesAfterEdit.length; i++) {
    const holeNum = holesAfterEdit[i] as string;
    const holeIndex = editedIndex + 1 + i;

    // Check if a tee flip result exists for this hole
    const gameHole = ctx.gameHoles.find((h) => h.hole === holeNum);
    if (!gameHole?.teams?.$isLoaded) continue;

    const hasTeeFlipResult = hasTeeFlipOption(gameHole, holeNum);
    if (!hasTeeFlipResult) continue;

    // Check if teams are still tied on the previous hole
    const isTied = areTeamsTied(scoreboard, holeIndex, holesList);

    if (!isTied) {
      items.push({
        kind: "tee_flip",
        holeNum,
        reason: "Teams are no longer tied",
      });
    }
  }

  return items;
}

/**
 * Check if any team has a tee_flip_winner or tee_flip_declined option for a hole.
 */
function hasTeeFlipOption(gameHole: GameHole, holeNum: string): boolean {
  if (!gameHole.teams?.$isLoaded) return false;

  for (const team of gameHole.teams) {
    if (!team?.$isLoaded || !team.options?.$isLoaded) continue;
    for (const opt of team.options) {
      if (!opt?.$isLoaded) continue;
      if (
        (opt.optionName === "tee_flip_winner" ||
          opt.optionName === "tee_flip_declined") &&
        opt.firstHole === holeNum
      ) {
        return true;
      }
    }
  }
  return false;
}

/**
 * Check if all teams are tied on the previous hole (runningDiff === 0).
 *
 * Mirrors the logic in scoringUtils.isTeeFlipRequired but works directly
 * with the scoreboard without needing the team count or multiplier options.
 */
function areTeamsTied(
  scoreboard: Scoreboard,
  currentHoleIndex: number,
  holesList: string[],
): boolean {
  // Find previous hole
  const prevHoleNumber =
    currentHoleIndex > 0 ? holesList[currentHoleIndex - 1] : undefined;

  // No previous hole (first hole of round) = always tied
  if (!prevHoleNumber) return true;

  const prevHoleResult = scoreboard.holes?.[prevHoleNumber];
  if (!prevHoleResult) return true;

  const teams = Object.values(prevHoleResult.teams);
  if (teams.length < 2) return false;

  return teams.every((t) => (t.runningDiff ?? 0) === 0);
}

// =============================================================================
// Score Impact
// =============================================================================

/**
 * Calculate the per-team score impact of removing invalidated multipliers.
 *
 * For each invalidated multiplier, estimates the point delta by looking at
 * the affected hole's team points and the multiplier's contribution.
 *
 * The approach: on each affected hole, the team's points were calculated
 * with the stale multiplier included. We estimate the "without" points
 * by dividing the team's hole points by the invalid multiplier's value.
 * This is approximate but gives a good indication of impact.
 */
function calculateScoreImpact(
  scoreboard: Scoreboard,
  _ctx: ScoringContext,
  multiplierItems: InvalidatedItem[],
): ScoreImpact[] {
  const invalidatedMults = multiplierItems.filter(
    (i): i is Extract<InvalidatedItem, { kind: "multiplier" }> =>
      i.kind === "multiplier",
  );

  if (invalidatedMults.length === 0) {
    // Still return current totals for display
    return Object.entries(scoreboard.cumulative.teams).map(
      ([teamId, cumulative]) => ({
        teamId,
        currentTotal: cumulative.pointsTotal,
        projectedTotal: cumulative.pointsTotal,
      }),
    );
  }

  // Calculate point deltas per team across all affected holes
  const teamDeltas: Record<string, number> = {};

  for (const item of invalidatedMults) {
    const holeResult = scoreboard.holes[item.holeNum];
    if (!holeResult) continue;

    const teamResult = holeResult.teams[item.teamId];
    if (!teamResult) continue;

    // Find the multiplier's value from the team's multiplier list
    const multAward = teamResult.multipliers.find(
      (m) => m.name === item.name && !m.earned,
    );
    if (!multAward || multAward.value <= 1) continue;

    // Estimate points without this multiplier
    // Current points = junkValue * totalMultiplier
    // Without this mult = junkValue * (totalMultiplier / multValue)
    // Delta = currentPoints - currentPoints / multValue
    // = currentPoints * (1 - 1/multValue)
    const delta = teamResult.points * (1 - 1 / multAward.value);

    teamDeltas[item.teamId] = (teamDeltas[item.teamId] ?? 0) + delta;
  }

  return Object.entries(scoreboard.cumulative.teams).map(
    ([teamId, cumulative]) => ({
      teamId,
      currentTotal: cumulative.pointsTotal,
      projectedTotal: Math.round(
        cumulative.pointsTotal - (teamDeltas[teamId] ?? 0),
      ),
    }),
  );
}
