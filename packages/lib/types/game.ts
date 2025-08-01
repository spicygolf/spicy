export type Game = {
  _type: string;
  name: string;
  start: string;
};

export type GameSpec = {
  _type: string;
  name: string;
  version: number;
  status: string;
  type: string;
  max_players?: number;
  min_players?: number;
  location_type: "local" | "remote";
  teams: boolean;
};
