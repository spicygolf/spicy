import { co, z } from "jazz-tools";
import { MapOfOptions } from "./options";
import { TeamsConfig } from "./teamsconfig";

/**
 * GameSpec - Game specification/template
 *
 * The canonical fields are `name`, `version`, and `legacyId`.
 * All other metadata is stored in the `options` map as MetaOption entries.
 *
 * DEPRECATED FIELDS (kept for backwards compatibility during migration):
 * - short, long_description, status, spec_type, min_players, location_type, teamsConfig
 * These will be removed in a future version. Use meta options instead:
 * - options.short (type: meta, valueType: text)
 * - options.long_description (type: meta, valueType: text)
 * - options.status (type: meta, valueType: menu)
 * - options.spec_type (type: meta, valueType: menu)
 * - options.min_players (type: meta, valueType: num)
 * - options.location_type (type: meta, valueType: menu)
 */
export const GameSpec = co.map({
  // === CANONICAL FIELDS (keep forever) ===
  name: z.string(),
  version: z.number(),
  legacyId: z.string().optional(), // ArangoDB _key for matching during import

  /**
   * Unified options map for this game spec
   * Individual game instances get a snapshot copy of these at creation time.
   *
   * Uses co.record() for O(1) lookups by name, which is critical during scoring
   * when resolving references (e.g., multiplier.based_on = "birdie")
   *
   * Key: option name (e.g., "birdie", "stakes", "double", "short", "status")
   * Value: Option (discriminated union of GameOption, JunkOption, MultiplierOption, MetaOption)
   *
   * Benefits:
   * - Single source for all options (unified model)
   * - O(1) lookup by name: options["birdie"]
   * - Type-safe via discriminated union on "type" field
   * - Filter by type: Object.values(options).filter(o => o.type === "junk")
   * - Meta options replace top-level fields for spec metadata
   */
  options: co.optional(MapOfOptions),

  // === DEPRECATED FIELDS (remove after full migration) ===
  // These are kept for backwards compatibility with existing data
  // New code should read from meta options instead

  /** @deprecated Use options.short (MetaOption) instead */
  short: z.optional(z.string()),
  /** @deprecated Use options.long_description (MetaOption) instead */
  long_description: z.string().optional(),
  /** @deprecated Use options.status (MetaOption) instead */
  status: z.optional(z.literal(["prod", "dev", "test"])),
  /** @deprecated Use options.spec_type (MetaOption) instead */
  spec_type: z.optional(z.literal(["points", "skins", "stableford", "quota"])),
  /** @deprecated Use options.min_players (MetaOption) instead */
  min_players: z.optional(z.number()),
  /** @deprecated Use options.location_type (MetaOption) instead */
  location_type: z.optional(z.literal(["local", "virtual"])),
  /** @deprecated Use options for team settings instead */
  teamsConfig: co.optional(TeamsConfig),
  /** @deprecated Remove after migration */
  teams: z.optional(z.boolean()),
});
export type GameSpec = co.loaded<typeof GameSpec>;

export const ListOfGameSpecs = co.list(GameSpec);
export type ListOfGameSpecs = co.loaded<typeof ListOfGameSpecs>;

export const MapOfGameSpecs = co.record(z.string(), GameSpec);
export type MapOfGameSpecs = co.loaded<typeof MapOfGameSpecs>;
