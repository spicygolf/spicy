import type { Group } from "jazz-tools";
import { useCallback, useEffect, useRef } from "react";
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
  /** Remove a press bet by name. */
  removePress: (betName: string) => void;
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
  const hasMatchBets = bets.some(
    (b) =>
      b.scoringType === "match" &&
      !b.name.startsWith("press_") &&
      (b.scope === "front9" || b.scope === "back9" || b.scope === "all18"),
  );

  const appendPressBet = useCallback(
    (props: ReturnType<typeof createPressBet>) => {
      if (!game?.$isLoaded || !game.bets?.$isLoaded) return;

      // Check if this press already exists (idempotency guard)
      for (const existing of game.bets) {
        if (existing?.$isLoaded && existing.name === props.name) return;
      }

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
      const parent = bets.find(
        (b) => b.name === parentBetName && b.scoringType === "match",
      );
      if (!parent) return;

      // Count existing presses for this parent chain
      const pressCount = bets.filter(
        (b) =>
          b.name.startsWith("press_") && b.name.endsWith(`_${parentBetName}`),
      ).length;

      if (maxPresses > 0 && pressCount >= maxPresses) return;

      // Find the tail bet's amount for "double" rule
      const tail =
        pressCount > 0
          ? bets.find((b) => b.name === `press_${pressCount}_${parentBetName}`)
          : undefined;

      const props = createPressBet({
        parentBetName: parent.name,
        parentDisp: parent.disp,
        parentScope: parent.scope as "front9" | "back9" | "all18",
        parentAmount: parent.amount ?? 0,
        currentHoleIndex,
        pressNumber: pressCount,
        pressScope,
        pressAmountRule,
        previousPressAmount: tail?.amount,
      });

      appendPressBet(props);
    },
    [
      bets,
      maxPresses,
      currentHoleIndex,
      pressScope,
      pressAmountRule,
      appendPressBet,
    ],
  );

  // Track manually removed presses so auto-press doesn't re-create them.
  // Cleared when the user advances to a new hole (fresh eligibility).
  const suppressedPresses = useRef(new Set<string>());
  const lastHoleIndex = useRef(currentHoleIndex);
  if (currentHoleIndex !== lastHoleIndex.current) {
    suppressedPresses.current.clear();
    lastHoleIndex.current = currentHoleIndex;
  }

  const removePress = useCallback(
    (betName: string) => {
      if (!game?.$isLoaded || !game.bets?.$isLoaded) return;
      const idx = game.bets.findIndex(
        (b) => b?.$isLoaded && b.name === betName,
      );
      if (idx !== -1) {
        suppressedPresses.current.add(betName);
        game.bets.$jazz.splice(idx, 1);
      }
    },
    [game],
  );

  // Auto-press fires reactively when scoreboard updates (after score change
  // triggers a Jazz mutation → re-render → new scoreboard). This avoids the
  // stale-closure bug where calling runAutoPress() synchronously from
  // onScoreChange used the pre-mutation scoreboard.
  // Skip the initial render to avoid firing during progressive loading.
  const initialRender = useRef(true);
  useEffect(() => {
    if (initialRender.current) {
      initialRender.current = false;
      return;
    }
    if (
      !autoPressEnabled ||
      !scoreboard ||
      !game?.players?.$isLoaded ||
      !hasMatchBets
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

    const results = checkAutoPress({
      playerIds,
      scoreboard,
      allBets: bets.map((b) => ({
        name: b.name,
        disp: b.disp,
        scope: b.scope,
        scoringType: b.scoringType,
        amount: b.amount ?? 0,
        startHoleIndex: b.startHoleIndex,
        parentBetName: b.parentBetName,
      })),
      currentHoleIndex,
      trigger,
      maxPresses,
      pressScope,
      pressAmountRule,
    });

    for (const result of results) {
      if (!suppressedPresses.current.has(result.pressBetProps.name)) {
        appendPressBet(result.pressBetProps);
      }
    }
  }, [scoreboard, currentHoleIndex, bets.length]);

  return {
    createManualPress,
    removePress,
    autoPressEnabled,
    hasMatchBets,
  };
}
