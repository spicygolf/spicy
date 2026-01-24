import { co, z } from "jazz-tools";

/**
 * Choice for menu-type game options (plain JSON, not a CoMap)
 */
export const ChoiceSchema = z.object({
  name: z.string(),
  disp: z.string(),
});
export type Choice = z.infer<typeof ChoiceSchema>;

/**
 * Game option - configuration that affects gameplay
 * Examples: handicap mode, stakes, number of teams
 *
 * Plain JSON object stored in MapOfOptions co.record
 */
export const GameOptionSchema = z.object({
  name: z.string(),
  disp: z.string(),
  type: z.literal("game"),
  version: z.string(),
  valueType: z.enum(["bool", "num", "menu", "text"]),
  choices: z.array(ChoiceSchema).optional(),
  defaultValue: z.string(),
  value: z.string().optional(),
  seq: z.number().optional(),
  /** If true, option only shown when teams mode is active */
  teamOnly: z.boolean().optional(),
});
export type GameOption = z.infer<typeof GameOptionSchema>;

/**
 * Junk option - side bets/dots awarded during play
 * Examples: birdies, sandies, greenies
 *
 * Plain JSON object stored in MapOfOptions co.record
 */
export const JunkOptionSchema = z.object({
  name: z.string(),
  disp: z.string(),
  type: z.literal("junk"),
  version: z.string(),
  sub_type: z.enum(["dot", "skin", "carryover"]).optional(),
  value: z.number(),
  seq: z.number().optional(),
  scope: z.enum(["player", "team", "hole", "rest_of_nine", "game"]).optional(),
  icon: z.string().optional(),
  show_in: z.enum(["score", "team", "faves", "none"]).optional(),
  based_on: z.enum(["gross", "net", "user"]).optional(),
  limit: z.string().optional(),
  calculation: z.string().optional(),
  logic: z.string().optional(),
  better: z.enum(["lower", "higher"]).optional(),
  score_to_par: z.string().optional(),
});
export type JunkOption = z.infer<typeof JunkOptionSchema>;

/**
 * Multiplier option - modifiers that multiply points
 * Examples: doubles, presses
 *
 * Plain JSON object stored in MapOfOptions co.record
 */
export const MultiplierOptionSchema = z.object({
  name: z.string(),
  disp: z.string(),
  type: z.literal("multiplier"),
  version: z.string(),
  sub_type: z.enum(["bbq", "press", "automatic"]).optional(),
  // Value is optional for input_value multipliers where user provides the value
  value: z.number().optional(),
  seq: z.number().optional(),
  icon: z.string().optional(),
  based_on: z.string().optional(),
  scope: z
    .enum(["player", "team", "hole", "rest_of_nine", "game", "none"])
    .optional(),
  availability: z.string().optional(),
  override: z.boolean().optional(),
  // Dynamic value source - logic operator name to calculate value at runtime
  // e.g., "frontNinePreDoubleTotal" for Re Pre multiplier
  value_from: z.string().optional(),
  // If true, the multiplier value comes from user input (stored in TeamOption.value)
  // Used for custom multipliers where user specifies the multiplier amount
  input_value: z.boolean().optional(),
});
export type MultiplierOption = z.infer<typeof MultiplierOptionSchema>;

/**
 * Meta option - spec-level metadata that doesn't affect scoring
 * Examples: short name, aliases, description, min/max players
 *
 * Replaces top-level GameSpec fields to enable unified options model
 * Plain JSON object stored in MapOfOptions co.record
 */
export const MetaOptionSchema = z.object({
  name: z.string(),
  disp: z.string(),
  type: z.literal("meta"),
  valueType: z.enum(["bool", "num", "menu", "text", "text_array"]),
  // Value storage - use appropriate field based on valueType
  value: z.string().optional(), // For bool, num, menu, text (stored as string)
  valueArray: z.array(z.string()).optional(), // For text_array (e.g., aliases)
  choices: z.array(ChoiceSchema).optional(), // For menu type
  seq: z.number().optional(),
  /** If true, this option is searchable (e.g., aliases) */
  searchable: z.boolean().optional(),
  /** If true, this option is required */
  required: z.boolean().optional(),
});
export type MetaOption = z.infer<typeof MetaOptionSchema>;

/**
 * Unified Option type using discriminated union
 * Single collection holds all four option types with type safety
 *
 * These are plain JSON objects, not CoMaps. The only CoValue is MapOfOptions.
 * This means conflict resolution happens at the option level (not field level),
 * but simplifies queries from { $each: { $each: true } } to { $each: true }.
 */
export const OptionSchema = z.discriminatedUnion("type", [
  GameOptionSchema,
  JunkOptionSchema,
  MultiplierOptionSchema,
  MetaOptionSchema,
]);
export type Option = z.infer<typeof OptionSchema>;

/**
 * Map of options keyed by option name for O(1) lookups
 * Key: option name (e.g., "birdie", "stakes", "double")
 * Value: Option union type (plain JSON object)
 *
 * This is the ONLY CoValue in the options system. Each option is a plain JSON
 * object, enabling simpler resolve queries: just { $each: true } instead of
 * { $each: { $each: true } }.
 *
 * Usage:
 *   const birdie = gameSpec.options?.birdie;
 *   const junkOptions = Object.values(gameSpec.options ?? {}).filter(opt => opt.type === "junk");
 *   const sorted = Object.values(gameSpec.options ?? {}).sort((a, b) => (a.seq ?? 999) - (b.seq ?? 999));
 */
export const MapOfOptions = co.record(z.string(), OptionSchema);
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
