import { co, z } from 'jazz-tools';

export const Handicap = co.map({
  source: z.literal(['ghin', 'manual']),
  identifier: z.string(), // TODO: optional (for manual handicaps)?
  // TODO: get index, revDate, gender from GHIN API
  // index = z.string();
  // revDate = z.date();
  // gender = z.literal(['M', 'F']);
});
type Handicap = co.loaded<typeof Handicap>;

export const ListOfEnvironments = co.list(z.string());
type ListOfEnvironments = co.loaded<typeof ListOfEnvironments>;

export const Player = co.map({
  name: z.string(),
  email: z.string(),
  short: z.string(),
  handicap: z.optional(Handicap),
  // meta
  envs: z.optional(ListOfEnvironments),
  level: z.string(),
});
export type Player = co.loaded<typeof Player>;

export const ListOfPlayers = co.list(Player);
export type ListOfPlayers = co.loaded<typeof ListOfPlayers>;
