import { co, z } from "jazz-tools";
import { MapOfOptions } from "./options";

/**
 * GameSpec - Game specification/template
 *
 * GameSpec IS the options map directly. All data is stored as Option entries:
 *
 * Core metadata (MetaOption entries):
 * - spec["name"] (type: meta, valueType: text, required: true)
 * - spec["version"] (type: meta, valueType: num)
 * - spec["legacyId"] (type: meta, valueType: text) - ArangoDB _key for import
 * - spec["short"] (type: meta, valueType: text)
 * - spec["long_description"] (type: meta, valueType: text)
 * - spec["status"] (type: meta, valueType: menu)
 * - spec["spec_type"] (type: meta, valueType: menu)
 * - spec["min_players"] (type: meta, valueType: num)
 * - spec["max_players"] (type: meta, valueType: num)
 * - spec["location_type"] (type: meta, valueType: menu)
 * - spec["teams"] (type: meta, valueType: bool)
 * - spec["team_size"] (type: meta, valueType: num)
 * - spec["team_change_every"] (type: meta, valueType: num)
 *
 * Game/Junk/Multiplier options are also entries in the map.
 *
 * Benefits:
 * - O(1) lookup by name: spec["birdie"]
 * - Type-safe via discriminated union on "type" field
 * - Filter by type: Object.values(spec).filter(o => o.type === "junk")
 * - No wrapper object - the spec IS the map
 */
export const GameSpec = MapOfOptions;
export type GameSpec = co.loaded<typeof GameSpec>;

export const ListOfGameSpecs = co.list(GameSpec);
export type ListOfGameSpecs = co.loaded<typeof ListOfGameSpecs>;

export const MapOfGameSpecs = co.record(z.string(), GameSpec);
export type MapOfGameSpecs = co.loaded<typeof MapOfGameSpecs>;
