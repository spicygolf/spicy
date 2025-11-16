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

export const ListOfEnvironments = co.list(z.string());
export type ListOfEnvironments = co.loaded<typeof ListOfEnvironments>;

export const Player = co.map({
  name: z.string(),
  email: z.string(),
  short: z.string(),
  gender: z.literal(["M", "F"]),
  ghinId: z.string().optional(),
  handicap: co.optional(Handicap),
  clubs: co.optional(ListOfClubs),
  envs: co.optional(ListOfEnvironments),
  rounds: co.optional(ListOfRounds),
});
export type Player = co.loaded<typeof Player>;

export const ListOfPlayers = co.list(Player);
export type ListOfPlayers = co.loaded<typeof ListOfPlayers>;
