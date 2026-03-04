import type { Group } from "jazz-tools";
import { useCallback, useRef } from "react";
import type { Game } from "spicylib/schema";
import { Bet } from "spicylib/schema";
import type { Scoreboard } from "spicylib/scoring";
import {
  checkAutoPress,
  createPressBet,
  getGameOptionBoolean,
  getGameOptionNumber,
  getGameOptionString,
} from "spicylib/scoring";
import type { BetColumnInfo } from "@/components/game/leaderboard";

// =============================================================================
// Types
// =============================================================================

interface UseAutoPressResult {
  /** Manually create a press for a parent bet at the current hole. */
  createManualPress: (parentBetName: string) => void;
  /** Run auto-press detection for the current hole. Call after scoring. */
  runAutoPress: () => void;
  /** Whether auto-press is enabled for this game. */
  autoPressEnabled: boolean;
  /** Whether this game has any match bets (press button should show). */
  hasMatchBets: boolean;
}

// =============================================================================
// Hook
// =============================================================================

/**
 * Manages auto and manual press bets for match play games.
 *
 * Reads game options (auto_press, auto_press_trigger, press_scope,
 * press_amount_rule, max_presses) and provides functions to create
 * press bets either automatically or manually.
 *
 * Press bets are appended to game.bets as new Bet CoMaps and automatically
 * appear as leaderboard columns and in settlement calculations.
 */
export function useAutoPress(
  game: Game | null,
  scoreboard: Scoreboard | null,
  bets: BetColumnInfo[],
  currentHoleIndex: number,
): UseAutoPressResult {
  // Track created presses to prevent duplicates across renders
  const createdPresses = useRef(new Set<string>());

  const spec = game?.spec;

  // Read press options from game spec
  const autoPressEnabled = getGameOptionBoolean(spec, "auto_press", false);
  const trigger = getGameOptionNumber(spec, "auto_press_trigger", 2);
  const pressScope = getGameOptionString(spec, "press_scope", "same") as
    | "same"
    | "rest_of_nine"
    | "rest_of_round";
  const pressAmountRule = getGameOptionString(
    spec,
    "press_amount_rule",
    "fixed",
  ) as "fixed" | "double";
  const maxPresses = getGameOptionNumber(spec, "max_presses", 0);

  // Identify match bets (parent bets that can be pressed)
  const matchBets = bets.filter(
    (b) =>
      b.scoringType === "match" &&
      !b.name.startsWith("press_") &&
      (b.scope === "front9" || b.scope === "back9" || b.scope === "all18"),
  );
  const hasMatchBets = matchBets.length > 0;

  // Build helper data from current bets
  const getExistingPressData = useCallback(() => {
    const existingPressNames = new Set<string>();
    const existingPressesByParent = new Map<
      string,
      Array<{ name: string; amount: number }>
    >();

    for (const b of bets) {
      if (b.name.startsWith("press_")) {
        existingPressNames.add(b.name);
        // Extract parent name from press name: "press_1_front_match" → "front_match"
        const parts = b.name.split("_");
        const parentName = parts.slice(2).join("_");
        const existing = existingPressesByParent.get(parentName) ?? [];
        existing.push({ name: b.name, amount: b.amount ?? 0 });
        existingPressesByParent.set(parentName, existing);
      }
    }

    return { existingPressNames, existingPressesByParent };
  }, [bets]);

  const appendPressBet = useCallback(
    (props: ReturnType<typeof createPressBet>) => {
      if (!game?.$isLoaded || !game.bets?.$isLoaded) return;

      // Prevent duplicate creation
      if (createdPresses.current.has(props.name)) return;
      createdPresses.current.add(props.name);

      const owner = game.bets.$jazz.owner as Group;
      const bet = Bet.create(
        {
          name: props.name,
          disp: props.disp,
          scope: props.scope,
          scoringType: props.scoringType,
          splitType: props.splitType,
          amount: props.amount,
          startHoleIndex: props.startHoleIndex,
          parentBetName: props.parentBetName,
        },
        { owner },
      );
      game.bets.$jazz.push(bet);
    },
    [game],
  );

  const createManualPress = useCallback(
    (parentBetName: string) => {
      const parent = matchBets.find((b) => b.name === parentBetName);
      if (!parent) return;

      const { existingPressesByParent } = getExistingPressData();
      const existingForParent =
        existingPressesByParent.get(parentBetName) ?? [];

      if (maxPresses > 0 && existingForParent.length >= maxPresses) return;

      const lastPress = existingForParent[existingForParent.length - 1];

      const props = createPressBet({
        parentBetName: parent.name,
        parentDisp: parent.disp,
        parentScope: parent.scope as "front9" | "back9" | "all18",
        parentAmount: parent.amount ?? 0,
        currentHoleIndex,
        pressNumber: existingForParent.length,
        pressScope,
        pressAmountRule,
        previousPressAmount: lastPress?.amount,
      });

      appendPressBet(props);
    },
    [
      matchBets,
      getExistingPressData,
      maxPresses,
      currentHoleIndex,
      pressScope,
      pressAmountRule,
      appendPressBet,
    ],
  );

  const runAutoPress = useCallback(() => {
    if (
      !autoPressEnabled ||
      !scoreboard ||
      !game?.players?.$isLoaded ||
      matchBets.length === 0
    ) {
      return;
    }

    const playerIds: string[] = [];
    for (const player of game.players) {
      if (player?.$isLoaded) {
        playerIds.push(player.$jazz.id);
      }
    }
    if (playerIds.length < 2) return;

    const { existingPressNames, existingPressesByParent } =
      getExistingPressData();

    const results = checkAutoPress({
      playerIds,
      scoreboard,
      parentBets: matchBets.map((b) => ({
        name: b.name,
        disp: b.disp,
        scope: b.scope as "front9" | "back9" | "all18",
        amount: b.amount ?? 0,
      })),
      existingPressNames,
      currentHoleIndex,
      trigger,
      maxPresses,
      pressScope,
      pressAmountRule,
      existingPressesByParent,
    });

    for (const result of results) {
      appendPressBet(result.pressBetProps);
    }
  }, [
    autoPressEnabled,
    scoreboard,
    game,
    matchBets,
    getExistingPressData,
    currentHoleIndex,
    trigger,
    maxPresses,
    pressScope,
    pressAmountRule,
    appendPressBet,
  ]);

  return {
    createManualPress,
    runAutoPress,
    autoPressEnabled,
    hasMatchBets,
  };
}
