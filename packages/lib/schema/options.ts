import { co, z } from "jazz-tools";

/**
 * Game option - configuration that affects gameplay
 * Examples: handicap mode, stakes, number of teams
 */
export const GameOption = co.map({
  name: z.string(),
  disp: z.string(),
  type: z.literal(["game"]),

  // Value type for this option
  valueType: z.literal(["bool", "num", "menu", "text"]),

  // For menu type: available choices
  choices: co.optional(
    co.list(
      co.map({
        name: z.string(),
        disp: z.string(),
      }),
    ),
  ),

  // Default value
  defaultValue: z.string(),
});
export type GameOption = co.loaded<typeof GameOption>;

/**
 * Junk option - side bets/dots awarded during play
 * Example: birdies, sandies, greenies
 * TODO: Implement fully when scoring engine is built
 */
export const JunkOption = co.map({
  name: z.string(),
  disp: z.string(),
  type: z.literal(["junk"]),
  value: z.number(), // Point value
  // TODO: Add logic/conditions when we implement scoring engine
});
export type JunkOption = co.loaded<typeof JunkOption>;

/**
 * Multiplier option - modifiers that multiply points
 * Example: doubles, presses
 * TODO: Implement fully when scoring engine is built
 */
export const MultiplierOption = co.map({
  name: z.string(),
  disp: z.string(),
  type: z.literal(["multiplier"]),
  value: z.number(), // Multiplier value (e.g., 2 for double)
  // TODO: Add availability logic when we implement scoring engine
});
export type MultiplierOption = co.loaded<typeof MultiplierOption>;

// Separate lists for each option type
export const ListOfGameOptions = co.list(GameOption);
export type ListOfGameOptions = co.loaded<typeof ListOfGameOptions>;

export const ListOfJunkOptions = co.list(JunkOption);
export type ListOfJunkOptions = co.loaded<typeof ListOfJunkOptions>;

export const ListOfMultiplierOptions = co.list(MultiplierOption);
export type ListOfMultiplierOptions = co.loaded<typeof ListOfMultiplierOptions>;

/**
 * Option value override for a specific game instance
 * Allows overriding default values from GameSpec
 */
export const GameOptionValue = co.map({
  optionName: z.string(), // Reference by name (e.g., "handicap_index_from")
  value: z.string(), // The override value (e.g., "low" or "full")
  holes: co.list(z.string()), // Which holes this applies to (e.g., ["1","2",...,"18"])
});
export type GameOptionValue = co.loaded<typeof GameOptionValue>;

export const ListOfGameOptionValues = co.list(GameOptionValue);
export type ListOfGameOptionValues = co.loaded<typeof ListOfGameOptionValues>;
