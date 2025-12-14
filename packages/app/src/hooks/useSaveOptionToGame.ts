import { useCallback } from "react";
import { type Game, GameOption } from "spicylib/schema";

/**
 * Hook to save a game option value to the Game.options field.
 *
 * This writes game-level option overrides. The option resolution order is:
 * 1. GameHole.options (most specific - hole-level overrides)
 * 2. Game.options (game instance overrides) ← THIS HOOK
 * 3. GameSpec.options (defaults from spec)
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

      // Get the spec option as template
      const specOption =
        game.specs?.$isLoaded && game.specs.length > 0
          ? game.specs[0]?.$isLoaded && game.specs[0].options?.$isLoaded
            ? game.specs[0].options[optionName]
            : undefined
          : undefined;

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

      const gameOption = specOption as GameOption;

      // Create game.options map if it doesn't exist
      if (!game.$jazz.has("options")) {
        game.$jazz.set("options", {});
      }

      // Check if this option already exists in game.options
      const gameOptions = game.options;
      if (gameOptions?.$isLoaded && gameOptions[optionName]?.$isLoaded) {
        // Update existing option's value field
        const existingOption = gameOptions[optionName] as GameOption;
        existingOption.$jazz.set("value", newValue);
      } else {
        // Create a new option instance for this game (copy from spec)
        const newOption = GameOption.create(
          {
            name: gameOption.name,
            disp: gameOption.disp,
            type: "game",
            version: gameOption.version,
            valueType: gameOption.valueType,
            defaultValue: gameOption.defaultValue,
          },
          { owner: game.$jazz.owner },
        );

        // Set choices if they exist (need to handle MaybeLoaded types)
        if (gameOption.$jazz.has("choices") && gameOption.choices?.$isLoaded) {
          // @ts-expect-error - MaybeLoaded types in option copying
          newOption.$jazz.set("choices", gameOption.choices);
        }

        // Set seq if it exists
        if (gameOption.$jazz.has("seq") && gameOption.seq !== undefined) {
          newOption.$jazz.set("seq", gameOption.seq);
        }

        // Set the value field to the new value
        newOption.$jazz.set("value", newValue);

        // Add to game.options
        if (gameOptions?.$isLoaded) {
          gameOptions.$jazz.set(optionName, newOption);
        }
      }
    },
    [game],
  );

  return saveOption;
}
