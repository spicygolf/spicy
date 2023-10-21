import { Game } from "./game";

export type CacheSetArgs = {
  type: string;
  payload: Game;
};

export type CacheGetArgs = {
  type: string;
  id: string;
};

