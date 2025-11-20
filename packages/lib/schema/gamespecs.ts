import { co, z } from "jazz-tools";
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
