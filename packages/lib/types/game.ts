export interface Game {
  _type: string;
  name: string;
  start: string;
}

export interface GameSpec {
  _type: string;
  name: string;
  version: number;
  status: string;
  type: string;
  max_players?: number;
  min_players?: number;
  location_type: "local" | "virtual";
  teams: boolean;
}
