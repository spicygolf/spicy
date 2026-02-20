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
  const scoreImpact = calculateScoreImpact(
    scoreboard,
    multiplierItems,
    editedHoleNum,
    holesList,
  );

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
  // Presses are always included regardless of based_on (they have availability
  // conditions even though they're automatic). All others must be user-selected.
  const userMultsWithAvailability = multiplierOptions.filter(
    (m) => (m.sub_type === "press" || m.based_on === "user") && m.availability,
  );

  if (userMultsWithAvailability.length === 0) return [];

  // Find holes after the edited hole
  const editedIndex = holesList.indexOf(editedHoleNum);
  if (editedIndex < 0) return [];

  const holesAfterEdit = holesList.slice(editedIndex + 1);
  const items: InvalidatedItem[] = [];
  // Track rest_of_nine activations already checked to avoid duplicates
  // (inherited copies on later holes all share the same firstHole)
  const checkedRestOfNine = new Set<string>();

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

        // For rest_of_nine scope, deduplicate across all holes (activation +
        // inherited) so we only evaluate once per (name, team, firstHole).
        if (multDef.scope === "rest_of_nine") {
          const dedupKey = `${multDef.name}:${teamId}:${optFirstHole}`;
          if (checkedRestOfNine.has(dedupKey)) continue;
          checkedRestOfNine.add(dedupKey);

          // Evaluate against the activation hole's data
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
                  reason:
                    multDef.invalidation_reason ??
                    "Availability condition no longer met",
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
            reason:
              multDef.invalidation_reason ??
              "Availability condition no longer met",
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
    // Find multipliers whose availability references the invalidated one.
    // TODO: This string-match heuristic is fragile — if availability
    // expressions change format, this will silently break. Revisit if the
    // availability format is ever restructured.
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
 * Scans only holes after the edited hole (matching the invalidation detection
 * scope). For rest_of_nine multipliers that span multiple holes, all affected
 * holes after the edit are included.
 *
 * The approach: on each affected hole, estimate the delta as
 * points * (1 - 1/removedMult). This is approximate but gives a good
 * indication of impact.
 */
function calculateScoreImpact(
  scoreboard: Scoreboard,
  multiplierItems: InvalidatedItem[],
  editedHoleNum: string,
  holesList: string[],
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

  // Build a set of invalidated (teamId, multName) pairs for quick lookup
  const invalidatedSet = new Set(
    invalidatedMults.map((m) => `${m.teamId}:${m.name}`),
  );

  // Only scan holes after the edit (same scope as invalidation detection)
  const editedIndex = holesList.indexOf(editedHoleNum);
  const holesAfterEdit =
    editedIndex >= 0 ? new Set(holesList.slice(editedIndex + 1)) : new Set();

  const teamDeltas: Record<string, number> = {};

  for (const [holeNum, holeResult] of Object.entries(scoreboard.holes)) {
    if (!holesAfterEdit.has(holeNum)) continue;

    for (const [teamId, teamResult] of Object.entries(holeResult.teams)) {
      // Find invalidated multipliers present on this hole for this team
      const removedNames = new Set<string>();
      for (const m of teamResult.multipliers) {
        if (m.earned) continue;
        if (invalidatedSet.has(`${teamId}:${m.name}`)) {
          removedNames.add(m.name);
        }
      }
      if (removedNames.size === 0) continue;

      let removedMult = 1;
      for (const m of teamResult.multipliers) {
        if (m.earned) continue;
        if (removedNames.has(m.name)) {
          removedMult *= m.value;
        }
      }

      if (removedMult <= 1) continue;

      const delta = teamResult.points * (1 - 1 / removedMult);
      teamDeltas[teamId] = (teamDeltas[teamId] ?? 0) + delta;
    }
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
