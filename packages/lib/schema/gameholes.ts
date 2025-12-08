import { co, z } from "jazz-tools";
import { MapOfOptions } from "./options";
import { ListOfTeams } from "./teams";

export const GameHole = co.map({
  hole: z.string(),
  seq: z.number(),
  teams: ListOfTeams,

  /**
   * Game-level options for this specific hole.
   * Used for per-hole option values (e.g., stakes changes on hole 10).
   */
  options: co.optional(MapOfOptions),

  // multipliers = co.ref(ListOfMultipliers);
});
export type GameHole = co.loaded<typeof GameHole>;

export const ListOfGameHoles = co.list(GameHole);
export type ListOfGameHoles = co.loaded<typeof ListOfGameHoles>;
