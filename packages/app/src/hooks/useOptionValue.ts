import type {
  Game,
  GameHole,
  GameOption,
  JunkOption,
  MultiplierOption,
  Option,
} from "spicylib/schema";

/**
 * Get an option value from the game, checking in this order:
 * 1. GameHole.options (most specific - hole-level overrides)
 * 2. Game.options (game instance overrides)
 * 3. GameSpec.options (defaults from spec)
 *
 * @param game - The game instance
 * @param currentHole - The current hole (optional, for hole-level overrides)
 * @param optionName - The name of the option to retrieve
 * @param optionType - The type of option ("game", "junk", or "multiplier")
 * @returns The option value, or undefined if not found
 */
export function useOptionValue(
  game: Game | null | undefined,
  currentHole: GameHole | null | undefined,
  optionName: string,
  optionType: "game",
): string | undefined;
export function useOptionValue(
  game: Game | null | undefined,
  currentHole: GameHole | null | undefined,
  optionName: string,
  optionType: "junk" | "multiplier",
): number | undefined;
export function useOptionValue(
  game: Game | null | undefined,
  currentHole: GameHole | null | undefined,
  optionName: string,
  optionType: Option["type"],
): string | number | undefined {
  // 1. Check hole-level override (most specific)
  if (currentHole?.options?.$isLoaded) {
    const holeOption = currentHole.options[optionName];
    if (holeOption?.$isLoaded && holeOption.type === optionType) {
      if (optionType === "game") {
        const gameOption = holeOption as GameOption;
        return gameOption.value ?? gameOption.defaultValue;
      }
      if (optionType === "junk") {
        return (holeOption as JunkOption).value;
      }
      if (optionType === "multiplier") {
        return (holeOption as MultiplierOption).value;
      }
    }
  }

  // 2. Check game instance options (game-level override)
  if (game?.$isLoaded && game.$jazz.has("options") && game.options?.$isLoaded) {
    const gameOption = game.options[optionName];
    if (gameOption?.$isLoaded && gameOption.type === optionType) {
      if (optionType === "game") {
        const opt = gameOption as GameOption;
        return opt.value ?? opt.defaultValue;
      }
      if (optionType === "junk") {
        return (gameOption as JunkOption).value;
      }
      if (optionType === "multiplier") {
        return (gameOption as MultiplierOption).value;
      }
    }
  }

  // 3. Fall back to gamespec (defaults) - GameSpec IS the options map
  if (game?.specs?.$isLoaded && game.specs.length > 0) {
    const spec = game.specs[0];
    if (spec?.$isLoaded) {
      const specOption = spec[optionName];
      if (specOption?.$isLoaded && specOption.type === optionType) {
        if (optionType === "game") {
          const gameOption = specOption as GameOption;
          return gameOption.value ?? gameOption.defaultValue;
        }
        if (optionType === "junk") {
          return (specOption as JunkOption).value;
        }
        if (optionType === "multiplier") {
          return (specOption as MultiplierOption).value;
        }
      }
    }
  }

  return undefined;
}
