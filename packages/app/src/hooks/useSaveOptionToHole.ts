import type { Group } from "jazz-tools";
import { useCallback } from "react";
import type { Game, GameHole, GameOption } from "spicylib/schema";
import { MapOfOptions } from "spicylib/schema";
import { deepClone } from "spicylib/utils";

/**
 * Hook to save/remove per-hole game option overrides.
 *
 * Writes to GameHole.options (MapOfOptions). Only stores overrides that
 * differ from the game-level default. Setting a value back to the default
 * removes the override to keep data clean.
 *
 * @param game - The game instance with holes and spec loaded
 * @returns setHoleOption and removeHoleOption functions
 */
export function useSaveOptionToHole(game: Game | null | undefined) {
  const setHoleOption = useCallback(
    (holeNumber: string, optionName: string, newValue: string) => {
      if (!game?.$isLoaded || !game.holes?.$isLoaded || !game.spec?.$isLoaded) {
        console.warn("Cannot save hole option: game not loaded");
        return;
      }

      const gameHole = game.holes.find(
        (h) => h?.$isLoaded && h.hole === holeNumber,
      );
      if (!gameHole?.$isLoaded) {
        console.warn(`Cannot save hole option: hole ${holeNumber} not found`);
        return;
      }

      const specOption = game.spec[optionName];
      if (!specOption || specOption.type !== "game") {
        console.warn(
          `Cannot save hole option: "${optionName}" is not a game option`,
        );
        return;
      }

      const gameDefault =
        (specOption as GameOption).value ??
        (specOption as GameOption).defaultValue;

      // If new value matches game default, remove the override
      if (newValue === gameDefault) {
        removeHoleOptionInternal(gameHole, optionName);
        return;
      }

      // Create the options map if it doesn't exist
      if (!gameHole.$jazz.has("options")) {
        const owner = gameHole.$jazz.owner as Group;
        gameHole.$jazz.set("options", MapOfOptions.create({}, { owner }));
      }

      const holeOptions = gameHole.options;
      if (!holeOptions?.$isLoaded) return;

      // Write the override: clone the spec option and set the new value
      holeOptions.$jazz.set(optionName, {
        ...deepClone(specOption as GameOption),
        value: newValue,
      });
    },
    [game],
  );

  const removeHoleOption = useCallback(
    (holeNumber: string, optionName: string) => {
      if (!game?.$isLoaded || !game.holes?.$isLoaded) return;

      const gameHole = game.holes.find(
        (h) => h?.$isLoaded && h.hole === holeNumber,
      );
      if (!gameHole?.$isLoaded) return;

      removeHoleOptionInternal(gameHole, optionName);
    },
    [game],
  );

  return { setHoleOption, removeHoleOption };
}

function removeHoleOptionInternal(gameHole: GameHole, optionName: string) {
  if (!gameHole.$jazz.has("options") || !gameHole.options?.$isLoaded) return;

  if (gameHole.options.$jazz.has(optionName)) {
    gameHole.options.$jazz.delete(optionName);
  }
}
