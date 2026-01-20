import { co, z } from "jazz-tools";
import { ListOfRounds } from "./rounds";

export const Handicap = co.map({
  source: z.literal(["ghin", "manual"]),
  display: z.string().optional(),
  value: z.number().optional(),
  revDate: z.date().optional(),
});
export type Handicap = co.loaded<typeof Handicap>;

export const Club = co.map({
  name: z.string(),
  state: z.string().optional(),
});
export type Club = co.loaded<typeof Club>;

export const ListOfClubs = co.list(Club);
export type ListOfClubs = co.loaded<typeof ListOfClubs>;

export const Player = co.map({
  name: z.string(),
  short: z.string(),
  gender: z.literal(["M", "F"]),
  ghinId: z.string().optional(),
  legacyId: z.string().optional(),
  level: z.literal(["admin"]).optional(),
  handicap: co.optional(Handicap),
  clubs: co.optional(ListOfClubs),
  /**
   * Player's historical rounds list.
   *
   * @deprecated For game rounds, use `game.rounds` (RoundToGame list) with `round.playerId`
   * instead. This field is only writable for user-owned players, not catalog players.
   * Catalog players can't have rounds added here due to permission constraints.
   *
   * This field is kept for:
   * 1. Legacy imported round data
   * 2. Future use when users own their own player data
   *
   * TODO: Consider removing once all round lookups use game.rounds + playerId pattern.
   */
  rounds: co.optional(ListOfRounds),
});
export type Player = co.loaded<typeof Player>;

export const ListOfPlayers = co.list(Player);
export type ListOfPlayers = co.loaded<typeof ListOfPlayers>;
