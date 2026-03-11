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

/** A bet (parent or press) passed into checkAutoPress. */
export interface PressBetInfo {
  name: string;
  disp: string;
  scope: string;
  scoringType: string;
  amount: number;
  startHoleIndex?: number;
  parentBetName?: string;
}

/** Configuration for checking auto-press conditions. */
export interface CheckAutoPressConfig {
  /** Player IDs in the game. */
  playerIds: string[];
  /** The scored scoreboard. */
  scoreboard: Scoreboard;
  /** All match bets — parents and existing presses. */
  allBets: PressBetInfo[];
  /** Current play-order hole index (0-based). */
  currentHoleIndex: number;
  /** Number of holes down that triggers a press. */
  trigger: number;
  /** Maximum number of presses per parent bet chain (0 = unlimited). */
  maxPresses: number;
  /** How the press scope is determined. */
  pressScope: "same" | "rest_of_nine" | "rest_of_round";
  /** How the press amount is calculated. */
  pressAmountRule: "fixed" | "double";
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
 * Builds a chain per parent bet (parent → press_1 → press_2 → ...) and only
 * evaluates the tail (the bet with no child press yet). If someone is down by
 * >= trigger holes within the tail's scope, a new press is created as its child.
 * Each bet fires at most one press — once it has a child, it's inert.
 *
 * This makes the function idempotent: calling it multiple times with the same
 * state produces no additional presses.
 *
 * @returns Array of press bets that should be created
 */
export function checkAutoPress(
  config: CheckAutoPressConfig,
): AutoPressResult[] {
  const {
    playerIds,
    scoreboard,
    allBets,
    currentHoleIndex,
    trigger,
    maxPresses,
    pressScope,
    pressAmountRule,
  } = config;

  const results: AutoPressResult[] = [];
  const holesPlayed = scoreboard.meta.holesPlayed;

  // Separate parent match bets from presses
  const parentBets: PressBetInfo[] = [];
  const pressesByParent = new Map<string, PressBetInfo[]>();

  for (const bet of allBets) {
    if (bet.scoringType !== "match") continue;
    if (bet.parentBetName) {
      // It's a press — group by root parent
      const rootParent = getRootParentName(bet.name);
      const list = pressesByParent.get(rootParent) ?? [];
      list.push(bet);
      pressesByParent.set(rootParent, list);
    } else if (
      bet.scope === "front9" ||
      bet.scope === "back9" ||
      bet.scope === "all18"
    ) {
      parentBets.push(bet);
    }
  }

  for (const parent of parentBets) {
    // Skip completed scopes
    if (parent.scope === "front9" && currentHoleIndex >= 9) continue;
    if (parent.scope === "back9" && currentHoleIndex < 9) continue;

    // Build chain: [parent, press_1, press_2, ...] sorted by press number
    const presses = pressesByParent.get(parent.name) ?? [];
    presses.sort((a, b) => getPressNumber(a.name) - getPressNumber(b.name));
    const chain = [parent, ...presses];

    // Check max presses cap (count of presses in chain, excluding parent)
    const pressCount = chain.length - 1;
    if (maxPresses > 0 && pressCount >= maxPresses) continue;

    // The tail is the last bet in the chain — the only one that can fire
    const tail = chain[chain.length - 1]!;

    // Compute match state within the tail's scope and startHoleIndex
    const tailScope = getHolesInScope(
      holesPlayed,
      tail.scope,
      tail.startHoleIndex,
    );

    // Only consider holes from tail's startHoleIndex through currentHoleIndex
    const startIdx = tail.startHoleIndex ?? 0;
    const relevantHoles = holesPlayed
      .slice(startIdx, currentHoleIndex + 1)
      .filter((h) => tailScope.has(h));

    if (relevantHoles.length === 0) continue;

    // Count holes won per player within the tail's scope
    const shouldPress = isDownByTrigger(
      relevantHoles,
      scoreboard,
      playerIds,
      trigger,
    );

    if (!shouldPress) continue;

    const pressBetProps = createPressBet({
      parentBetName: parent.name,
      parentDisp: parent.disp,
      parentScope: parent.scope as "front9" | "back9" | "all18",
      parentAmount: parent.amount,
      currentHoleIndex,
      pressNumber: pressCount,
      pressScope,
      pressAmountRule,
      previousPressAmount: tail.amount,
    });

    results.push({ parentBetName: parent.name, pressBetProps });
  }

  return results;
}

// =============================================================================
// Internal Helpers
// =============================================================================

/** Extract the root parent name from a press bet name (e.g., "press_2_front_match" → "front_match"). */
function getRootParentName(pressName: string): string {
  const parts = pressName.split("_");
  // "press_N_parent_parts..." → skip "press" and N
  return parts.slice(2).join("_");
}

/** Extract the press number from a press bet name (e.g., "press_2_front_match" → 2). */
function getPressNumber(name: string): number {
  const match = name.match(/^press_(\d+)_/);
  return match ? Number(match[1]) : 0;
}

/** Get the set of hole numbers in a scope. */
function getHolesInScope(
  holesPlayed: string[],
  scope: string,
  startHoleIndex?: number,
): Set<string> {
  switch (scope) {
    case "front9":
      return new Set(holesPlayed.slice(0, 9));
    case "back9":
      return new Set(holesPlayed.slice(9, 18));
    case "all18":
      return new Set(holesPlayed);
    case "rest_of_nine": {
      const start = startHoleIndex ?? 0;
      const nineEnd = start < 9 ? 9 : 18;
      return new Set(holesPlayed.slice(start, nineEnd));
    }
    case "rest_of_round": {
      const start = startHoleIndex ?? 0;
      return new Set(holesPlayed.slice(start));
    }
    default:
      return new Set(holesPlayed);
  }
}

/** Check if any player is down by >= trigger holes in the given holes. */
function isDownByTrigger(
  relevantHoles: string[],
  scoreboard: Scoreboard,
  playerIds: string[],
  trigger: number,
): boolean {
  const holesWon = new Map<string, number>();
  for (const pid of playerIds) {
    holesWon.set(pid, 0);
  }

  for (const holeNum of relevantHoles) {
    const holeResult = scoreboard.holes[holeNum];
    if (!holeResult) continue;

    // Skip holes where not all players have scored
    const allScored = playerIds.every(
      (pid) => holeResult.players[pid]?.hasScore,
    );
    if (!allScored) continue;

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

  let maxWon = 0;
  for (const count of holesWon.values()) {
    if (count > maxWon) maxWon = count;
  }

  for (const [, count] of holesWon) {
    if (maxWon - count >= trigger) return true;
  }
  return false;
}
