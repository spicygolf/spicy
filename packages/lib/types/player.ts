import type { ID } from ".";

export type Player = {
  _type: string;
  name: string;
  email?: string;
  short?: string;
  statusAuthz?: AuthorizedRole[];
  level?: "admin";
  handicap?: HandicapInfo;
  round_id?: ID;
};

export type AuthorizedRole = "dev" | "test" | "prod";

export type Gender =
  | "M"
  | "m"
  | "Male"
  | "male"
  | "F"
  | "f"
  | "Female"
  | "female";

export type HandicapInfo = {
  source: "ghin" | "manual";
  id?: string;
  firstName?: string;
  lastName?: string;
  playerName?: string;
  gender: Gender;
  active?: boolean;
  index: string | number;
  revDate: string;
};
