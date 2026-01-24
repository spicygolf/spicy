import { co, z } from "jazz-tools";
import { MapOfOptions } from "./options";

/**
 * GameSpec - Game specification/template
 *
 * GameSpec is a unified options map. ALL data is stored as Option entries
 * in the `options` map - there are no top-level data fields.
 *
 * Core metadata is stored as MetaOption entries:
 * - options.name (type: meta, valueType: text, required: true)
 * - options.version (type: meta, valueType: num)
 * - options.legacyId (type: meta, valueType: text) - ArangoDB _key for import matching
 * - options.short (type: meta, valueType: text)
 * - options.long_description (type: meta, valueType: text)
 * - options.status (type: meta, valueType: menu)
 * - options.spec_type (type: meta, valueType: menu)
 * - options.min_players (type: meta, valueType: num)
 * - options.max_players (type: meta, valueType: num)
 * - options.location_type (type: meta, valueType: menu)
 * - options.teams (type: meta, valueType: bool)
 * - options.team_size (type: meta, valueType: num)
 * - options.team_change_every (type: meta, valueType: num)
 *
 * Game/Junk/Multiplier options are also stored in the options map.
 */
export const GameSpec = co.map({
  /**
   * Unified options map - the ONLY data storage for GameSpec
   *
   * Uses co.record() for O(1) lookups by name, which is critical during scoring
   * when resolving references (e.g., multiplier.based_on = "birdie")
   *
   * Key: option name (e.g., "name", "version", "birdie", "stakes", "double")
   * Value: Option (discriminated union of GameOption, JunkOption, MultiplierOption, MetaOption)
   *
   * Benefits:
   * - Single source for all data (unified model)
   * - O(1) lookup by name: options["birdie"]
   * - Type-safe via discriminated union on "type" field
   * - Filter by type: Object.values(options).filter(o => o.type === "junk")
   * - All metadata is MetaOption entries (name, version, status, etc.)
   */
  options: co.optional(MapOfOptions),
});
export type GameSpec = co.loaded<typeof GameSpec>;

export const ListOfGameSpecs = co.list(GameSpec);
export type ListOfGameSpecs = co.loaded<typeof ListOfGameSpecs>;

export const MapOfGameSpecs = co.record(z.string(), GameSpec);
export type MapOfGameSpecs = co.loaded<typeof MapOfGameSpecs>;
