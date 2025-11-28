import { co, z } from "jazz-tools";
import { MapOfOptions } from "./options";
import { TeamsConfig } from "./teamsconfig";

export const GameSpec = co.map({
  name: z.string(),
  short: z.string(),
  long_description: z.string().optional(), // Markdown description
  version: z.number(),
  status: z.literal(["prod", "dev", "test"]),
  spec_type: z.literal(["points", "skins"]),
  min_players: z.number(),
  location_type: z.literal(["local", "virtual"]),

  /**
   * Team configuration for this game spec.
   * Defines how teams work for this game type.
   */
  teamsConfig: co.optional(TeamsConfig),

  /**
   * Unified options map for this game spec
   * Individual game instances get a copy of these via Game.options
   *
   * Uses co.record() for O(1) lookups by name, which is critical during scoring
   * when resolving references (e.g., multiplier.based_on = "birdie")
   *
   * Key: option name (e.g., "birdie", "stakes", "double")
   * Value: Option (discriminated union of GameOption, JunkOption, MultiplierOption)
   *
   * Benefits over separate lists:
   * - Single source for all options (no more gameOptions/junkOptions/multiplierOptions)
   * - O(1) lookup by name: options["birdie"] instead of options.find(o => o.name === "birdie")
   * - Type-safe via discriminated union on "type" field
   * - Can filter by type: Object.values(options).filter(o => o.type === "junk")
   */
  options: co.optional(MapOfOptions),

  // TODO: DEPRECATED - remove after migration
  teams: z.optional(z.boolean()),
  // recursive field specs contains a list of game specs
  // TODO: not working yet: https://zod.dev/v4?id=recursive-objects
  // get specs(): typeof co.list<typeof GameSpec> {
  //   return ListOfGameSpecs.create([]);
  // },
});
export type GameSpec = co.loaded<typeof GameSpec>;

export const ListOfGameSpecs = co.list(GameSpec);
export type ListOfGameSpecs = co.loaded<typeof ListOfGameSpecs>;

export const MapOfGameSpecs = co.record(z.string(), GameSpec);
export type MapOfGameSpecs = co.loaded<typeof MapOfGameSpecs>;

export const defaultSpec = {
  name: "Five Points",
  short: `Team game with low ball (2), low team (2), and prox (1). 5 points per hole, presses, birdies`,
  version: 1,
  status: "prod" as const,
  spec_type: "points" as const,
  min_players: 2,
  location_type: "local" as const,
  // teamsConfig will be added separately using co.optional
};
