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
  // Value is optional for input_value multipliers where user provides the value
  value: z.optional(z.number()),
  seq: z.optional(z.number()),
  icon: z.optional(z.string()),
  based_on: z.optional(z.string()),
  scope: z.optional(
    z.literal(["player", "team", "hole", "rest_of_nine", "game", "none"]),
  ),
  availability: z.optional(z.string()),
  override: z.optional(z.boolean()),
  // Dynamic value source - logic operator name to calculate value at runtime
  // e.g., "frontNinePreDoubleTotal" for Re Pre multiplier
  value_from: z.optional(z.string()),
  // If true, the multiplier value comes from user input (stored in TeamOption.value)
  // Used for custom multipliers where user specifies the multiplier amount
  input_value: z.optional(z.boolean()),
});
export type MultiplierOption = co.loaded<typeof MultiplierOption>;

/**
 * List of string values for text_array meta options (e.g., aliases)
 */
export const StringList = co.list(z.string());
export type StringList = co.loaded<typeof StringList>;

/**
 * Meta option - spec-level metadata that doesn't affect scoring
 * Examples: short name, aliases, description, min/max players
 *
 * Replaces top-level GameSpec fields to enable unified options model
 */
export const MetaOption = co.map({
  name: z.string(),
  disp: z.string(),
  type: z.literal(["meta"]),
  valueType: z.literal(["bool", "num", "menu", "text", "text_array"]),
  // Value storage - use appropriate field based on valueType
  value: z.optional(z.string()), // For bool, num, menu, text (stored as string)
  valueArray: co.optional(StringList), // For text_array (e.g., aliases)
  choices: co.optional(ChoicesList), // For menu type
  seq: z.optional(z.number()),
  /** If true, this option is searchable (e.g., aliases) */
  searchable: z.optional(z.boolean()),
  /** If true, this option is required */
  required: z.optional(z.boolean()),
});
export type MetaOption = co.loaded<typeof MetaOption>;

/**
 * Unified Option type using discriminated union
 * Single collection holds all four option types with type safety
 */
export const Option = co.discriminatedUnion("type", [
  GameOption,
  JunkOption,
  MultiplierOption,
  MetaOption,
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
