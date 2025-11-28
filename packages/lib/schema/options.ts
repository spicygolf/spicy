import { co, z } from "jazz-tools";

/**
 * Choice map for menu-type game options
 */
export const ChoiceMap = co.map({
  name: z.string(),
  disp: z.string(),
});
export type ChoiceMap = co.loaded<typeof ChoiceMap>;

export const ChoicesList = co.list(ChoiceMap);
export type ChoicesList = co.loaded<typeof ChoicesList>;

/**
 * Game option - configuration that affects gameplay
 * Examples: handicap mode, stakes, number of teams
 */
export const GameOption = co.map({
  name: z.string(),
  disp: z.string(),
  type: z.literal(["game"]),
  version: z.string(), // Version identifier (e.g., "0.3", "0.5")

  // Value type for this option
  valueType: z.literal(["bool", "num", "menu", "text"]),

  // For menu type: available choices
  choices: co.optional(ChoicesList),

  // Default value
  defaultValue: z.string(),
});
export type GameOption = co.loaded<typeof GameOption>;

/**
 * Junk option - side bets/dots awarded during play
 * Example: birdies, sandies, greenies
 */
export const JunkOption = co.map({
  name: z.string(),
  disp: z.string(),
  type: z.literal(["junk"]),
  version: z.string(), // Version identifier (e.g., "0.3", "0.5")
  sub_type: z.optional(z.literal(["dot", "skin", "carryover"])),
  value: z.number(), // Point value
  seq: z.optional(z.number()),
  scope: z.optional(
    z.literal(["player", "team", "hole", "rest_of_nine", "game"]),
  ),
  icon: z.optional(z.string()),
  show_in: z.optional(z.literal(["score", "faves", "none"])),
  based_on: z.optional(z.literal(["gross", "net", "user"])),
  limit: z.optional(z.string()), // e.g., "one_per_group", "one_team_per_group"
  calculation: z.optional(z.string()), // e.g., "logic", "best_ball", "aggregate"
  logic: z.optional(z.string()), // JSON Logic expression as string
  better: z.optional(z.literal(["lower", "higher"])),
  score_to_par: z.optional(z.string()), // e.g., "exactly -1"
});
export type JunkOption = co.loaded<typeof JunkOption>;

/**
 * Multiplier option - modifiers that multiply points
 * Example: doubles, presses
 */
export const MultiplierOption = co.map({
  name: z.string(),
  disp: z.string(),
  type: z.literal(["multiplier"]),
  version: z.string(), // Version identifier (e.g., "0.3", "0.5")
  sub_type: z.optional(z.literal(["bbq", "press", "automatic"])),
  value: z.number(), // Multiplier value (e.g., 2 for double)
  seq: z.optional(z.number()),
  icon: z.optional(z.string()),
  based_on: z.optional(z.string()), // Name of junk option or "user"
  scope: z.optional(
    z.literal(["player", "team", "hole", "rest_of_nine", "game"]),
  ),
  availability: z.optional(z.string()), // JSON Logic expression as string
  override: z.optional(z.boolean()),
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
