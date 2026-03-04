/**
 * Press Bet Logic
 *
 * Pure functions for creating and detecting press bets in match play games.
 * Presses are new bets created mid-round when a player/team falls behind
 * by a configurable number of holes.
 *
 * Two modes:
 * - Auto-press: fires when a player is down by >= trigger holes
 * - Manual press: player manually triggers a press at any point
 */

import type { Scoreboard } from "./types";

// =============================================================================
// Types
// =============================================================================

/** Configuration for creating a press bet. */
export interface CreatePressBetConfig {
  /** Name of the parent bet being pressed (e.g., "front_match"). */
  parentBetName: string;
  /** Display name of the parent bet (e.g., "Front"). */
  parentDisp: string;
  /** Scope of the parent bet (e.g., "front9"). */
  parentScope: "front9" | "back9" | "all18";
  /** Amount of the parent bet. */
  parentAmount: number;
  /** Current play-order index (0-based) where the press starts. */
  currentHoleIndex: number;
  /** How many presses already exist for this parent bet. */
  pressNumber: number;
  /** How the press scope is determined. */
  pressScope: "same" | "rest_of_nine" | "rest_of_round";
  /** How the press amount is calculated. */
  pressAmountRule: "fixed" | "double";
  /** Amount of the most recent press (for "double" rule). */
  previousPressAmount?: number;
}

/** Result of createPressBet — plain properties for creating a Bet CoMap. */
export interface PressBetProps {
  name: string;
  disp: string;
  scope: "front9" | "back9" | "all18" | "rest_of_nine" | "rest_of_round";
  scoringType: "match";
  splitType: "winner_take_all";
  amount: number;
  startHoleIndex: number;
  parentBetName: string;
}

/** Configuration for checking auto-press conditions. */
export interface CheckAutoPressConfig {
  /** Player IDs in the game. */
  playerIds: string[];
  /** The scored scoreboard. */
  scoreboard: Scoreboard;
  /** Parent match bets (front, back, overall). */
  parentBets: Array<{
    name: string;
    disp: string;
    scope: "front9" | "back9" | "all18";
    amount: number;
  }>;
  /** Names of existing press bets (to avoid duplicates). */
  existingPressNames: Set<string>;
  /** Current play-order hole index (0-based). */
  currentHoleIndex: number;
  /** Number of holes down that triggers a press. */
  trigger: number;
  /** Maximum number of presses per parent bet (0 = unlimited). */
  maxPresses: number;
  /** How the press scope is determined. */
  pressScope: "same" | "rest_of_nine" | "rest_of_round";
  /** How the press amount is calculated. */
  pressAmountRule: "fixed" | "double";
  /** Existing presses per parent bet, ordered by creation. */
  existingPressesByParent: Map<string, Array<{ name: string; amount: number }>>;
}

/** Result of checkAutoPress — press bets that should be created. */
export interface AutoPressResult {
  parentBetName: string;
  pressBetProps: PressBetProps;
}

// =============================================================================
// Public API
// =============================================================================

/**
 * Create properties for a new press bet.
 *
 * @returns Plain-data properties for creating a Bet CoMap
 */
export function createPressBet(config: CreatePressBetConfig): PressBetProps {
  const {
    parentBetName,
    parentDisp,
    parentScope,
    parentAmount,
    currentHoleIndex,
    pressNumber,
    pressScope,
    pressAmountRule,
    previousPressAmount,
  } = config;

  const num = pressNumber + 1;

  // Name: "press_1_front_match", "press_2_back_match", etc.
  const name = `press_${num}_${parentBetName}`;

  // Display: "Press 1 (Front)", "Press 2 (Back)", etc.
  const disp = `Press ${num} (${parentDisp})`;

  // Scope
  let scope: PressBetProps["scope"];
  if (pressScope === "same") {
    scope = parentScope;
  } else {
    scope = pressScope;
  }

  // Amount
  let amount: number;
  if (pressAmountRule === "double") {
    amount = (previousPressAmount ?? parentAmount) * 2;
  } else {
    amount = parentAmount;
  }

  return {
    name,
    disp,
    scope,
    scoringType: "match",
    splitType: "winner_take_all",
    amount,
    startHoleIndex: currentHoleIndex,
    parentBetName,
  };
}

/**
 * Check which auto-presses should fire based on current match state.
 *
 * For each parent match bet, computes the match state (holes won by each player)
 * through the current hole. If any player is down by >= trigger holes and no
 * press already exists at this hole for this parent, returns a press to create.
 *
 * @returns Array of press bets that should be created
 */
export function checkAutoPress(
  config: CheckAutoPressConfig,
): AutoPressResult[] {
  const {
    playerIds,
    scoreboard,
    parentBets,
    existingPressNames,
    currentHoleIndex,
    trigger,
    maxPresses,
    pressScope,
    pressAmountRule,
    existingPressesByParent,
  } = config;

  const results: AutoPressResult[] = [];
  const holesPlayed = scoreboard.meta.holesPlayed;

  for (const parent of parentBets) {
    // Determine which holes are in scope for this parent bet
    const scopeHoles = getHolesInParentScope(holesPlayed, parent.scope);

    // Only consider holes up to currentHoleIndex
    const relevantHoles = holesPlayed
      .slice(0, currentHoleIndex + 1)
      .filter((h) => scopeHoles.has(h));

    // Count holes won per player in scope
    const holesWon = new Map<string, number>();
    for (const pid of playerIds) {
      holesWon.set(pid, 0);
    }

    for (const holeNum of relevantHoles) {
      const holeResult = scoreboard.holes[holeNum];
      if (!holeResult) continue;

      // Find sole lowest net
      let lowestNet = Infinity;
      let winnerId: string | null = null;
      let tied = false;
      for (const [pid, result] of Object.entries(holeResult.players)) {
        if (!result.hasScore) continue;
        if (result.net < lowestNet) {
          lowestNet = result.net;
          winnerId = pid;
          tied = false;
        } else if (result.net === lowestNet) {
          tied = true;
        }
      }
      if (!tied && winnerId) {
        holesWon.set(winnerId, (holesWon.get(winnerId) ?? 0) + 1);
      }
    }

    // Find the leader's holes won count
    let maxWon = 0;
    for (const count of holesWon.values()) {
      if (count > maxWon) maxWon = count;
    }

    // Check if any player is down by >= trigger
    let shouldPress = false;
    for (const [, count] of holesWon) {
      if (maxWon - count >= trigger) {
        shouldPress = true;
        break;
      }
    }

    if (!shouldPress) continue;

    // Check max presses cap
    const existingForParent = existingPressesByParent.get(parent.name) ?? [];
    const pressCount = existingForParent.length;
    if (maxPresses > 0 && pressCount >= maxPresses) continue;

    // Generate proposed press name and check for duplicate
    const proposedName = `press_${pressCount + 1}_${parent.name}`;
    if (existingPressNames.has(proposedName)) continue;

    // Get the amount of the most recent press for "double" rule
    const lastPress = existingForParent[existingForParent.length - 1];

    const pressBetProps = createPressBet({
      parentBetName: parent.name,
      parentDisp: parent.disp,
      parentScope: parent.scope,
      parentAmount: parent.amount,
      currentHoleIndex,
      pressNumber: pressCount,
      pressScope,
      pressAmountRule,
      previousPressAmount: lastPress?.amount,
    });

    results.push({ parentBetName: parent.name, pressBetProps });
  }

  return results;
}

// =============================================================================
// Internal Helpers
// =============================================================================

function getHolesInParentScope(
  holesPlayed: string[],
  scope: "front9" | "back9" | "all18",
): Set<string> {
  switch (scope) {
    case "front9":
      return new Set(holesPlayed.slice(0, 9));
    case "back9":
      return new Set(holesPlayed.slice(9, 18));
    case "all18":
      return new Set(holesPlayed);
  }
}
