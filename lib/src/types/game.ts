
export type Game = {
  id: string;
  name: string;
  start: string;
};

export type GameCreatedRequest = {
  event: string;
  id: string;
  name: string;
  start: string;
};

export type GameCreatedResponse = {
  event: string;
  id: string;
  gkey: string;
};
