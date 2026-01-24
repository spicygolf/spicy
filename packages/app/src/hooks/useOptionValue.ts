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
 * 2. Game.spec (the game's working copy of options)
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

  // 2. Check game.spec (the working copy of options)
  if (game?.$isLoaded && game.spec?.$isLoaded) {
    const specOption = game.spec[optionName];
    if (specOption?.$isLoaded && specOption.type === optionType) {
      if (optionType === "game") {
        const opt = specOption as GameOption;
        return opt.value ?? opt.defaultValue;
      }
      if (optionType === "junk") {
        return (specOption as JunkOption).value;
      }
      if (optionType === "multiplier") {
        return (specOption as MultiplierOption).value;
      }
    }
  }

  return undefined;
}
