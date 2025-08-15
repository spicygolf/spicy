import { co, z } from "jazz-tools";

export const Handicap = co.map({
  source: z.literal(["ghin", "manual"]),
  display: z.string().optional(),
  value: z.number().optional(),
  revDate: z.date().optional(),
});
export type Handicap = co.loaded<typeof Handicap>;

export const ListOfEnvironments = co.list(z.string());
export type ListOfEnvironments = co.loaded<typeof ListOfEnvironments>;

export const Player = co.map({
  name: z.string(),
  email: z.string(),
  short: z.string(),
  gender: z.literal(["M", "F"]),
  ghinId: z.string().optional(),
  handicap: co.optional(Handicap),
  // meta
  envs: co.optional(ListOfEnvironments),
  level: z.string(),
});
export type Player = co.loaded<typeof Player>;

export const ListOfPlayers = co.list(Player);
export type ListOfPlayers = co.loaded<typeof ListOfPlayers>;
