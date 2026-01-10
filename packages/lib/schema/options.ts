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
  version: z.string(),
  valueType: z.literal(["bool", "num", "menu", "text"]),
  choices: co.optional(ChoicesList),
  defaultValue: z.string(),
  value: z.optional(z.string()),
  seq: z.optional(z.number()),
  /** If true, option only shown when teams mode is active */
  teamOnly: z.optional(z.boolean()),
});
export type GameOption = co.loaded<typeof GameOption>;

/**
 * Junk option - side bets/dots awarded during play
 * Examples: birdies, sandies, greenies
 */
export const JunkOption = co.map({
  name: z.string(),
  disp: z.string(),
  type: z.literal(["junk"]),
  version: z.string(),
  sub_type: z.optional(z.literal(["dot", "skin", "carryover"])),
  value: z.number(),
  seq: z.optional(z.number()),
  scope: z.optional(
    z.literal(["player", "team", "hole", "rest_of_nine", "game"]),
  ),
  icon: z.optional(z.string()),
  show_in: z.optional(z.literal(["score", "team", "faves", "none"])),
  based_on: z.optional(z.literal(["gross", "net", "user"])),
  limit: z.optional(z.string()),
  calculation: z.optional(z.string()),
  logic: z.optional(z.string()),
  better: z.optional(z.literal(["lower", "higher"])),
  score_to_par: z.optional(z.string()),
});
export type JunkOption = co.loaded<typeof JunkOption>;

/**
 * Multiplier option - modifiers that multiply points
 * Examples: doubles, presses
 */
export const MultiplierOption = co.map({
  name: z.string(),
  disp: z.string(),
  type: z.literal(["multiplier"]),
  version: z.string(),
  sub_type: z.optional(z.literal(["bbq", "press", "automatic"])),
  value: z.number(),
  seq: z.optional(z.number()),
  icon: z.optional(z.string()),
  based_on: z.optional(z.string()),
  scope: z.optional(
    z.literal(["player", "team", "hole", "rest_of_nine", "game"]),
  ),
  availability: z.optional(z.string()),
  override: z.optional(z.boolean()),
  // Dynamic value source - logic operator name to calculate value at runtime
  // e.g., "frontNinePreDoubleTotal" for Re Pre multiplier
  value_from: z.optional(z.string()),
});
export type MultiplierOption = co.loaded<typeof MultiplierOption>;

/**
 * Unified Option type using discriminated union
 * Single collection holds all three option types with type safety
 */
export const Option = co.discriminatedUnion("type", [
  GameOption,
  JunkOption,
  MultiplierOption,
]);
export type Option = co.loaded<typeof Option>;

/**
 * Map of options keyed by option name for O(1) lookups
 * Key: option name (e.g., "birdie", "stakes", "double")
 * Value: Option union type
 *
 * Usage:
 *   const birdie = gameSpec.options?.birdie;
 *   const junkOptions = Object.values(gameSpec.options ?? {}).filter(opt => opt.type === "junk");
 *   const sorted = Object.values(gameSpec.options ?? {}).sort((a, b) => (a.seq ?? 999) - (b.seq ?? 999));
 */
export const MapOfOptions = co.record(z.string(), Option);
export type MapOfOptions = co.loaded<typeof MapOfOptions>;

/**
 * Option value override for a specific game instance
 */
export const GameOptionValue = co.map({
  optionName: z.string(),
  value: z.string(),
  holes: co.list(z.string()),
});
export type GameOptionValue = co.loaded<typeof GameOptionValue>;

export const ListOfGameOptionValues = co.list(GameOptionValue);
export type ListOfGameOptionValues = co.loaded<typeof ListOfGameOptionValues>;
