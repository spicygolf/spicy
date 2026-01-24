import { useCallback } from "react";
import { type Game, GameOption } from "spicylib/schema";

/**
 * Hook to save a game option value to the game's spec.
 *
 * User modifications are stored directly in game.spec (the working copy).
 * The specRef points to the original catalog spec for reset/diff operations.
 *
 * @param game - The game instance to save the option to
 * @returns A function to save an option value to the game
 */
export function useSaveOptionToGame(game: Game | null | undefined) {
  const saveOption = useCallback(
    (optionName: string, newValue: string) => {
      if (!game?.$isLoaded) {
        console.warn("Cannot save option: game not loaded");
        return;
      }

      if (!game.spec?.$isLoaded) {
        console.warn("Cannot save option: game.spec not loaded");
        return;
      }

      // Get the option from game.spec
      const specOption = game.spec[optionName];

      if (!specOption?.$isLoaded) {
        console.warn(
          `Cannot save option: spec option "${optionName}" not found`,
        );
        return;
      }

      // Only GameOption supports the 'value' field for overrides
      if (specOption.type !== "game") {
        console.warn(
          `Cannot save option: "${optionName}" is not a game option (type: ${specOption.type})`,
        );
        return;
      }

      // Update the value directly on the spec option
      (specOption as GameOption).$jazz.set("value", newValue);
    },
    [game],
  );

  return saveOption;
}
