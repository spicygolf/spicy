import { Stack } from 'expo-router/stack';
import { Account, CoList, CoMap, Profile, co } from "jazz-tools";

// TODO: can this extend Account?
//  use case: a player can be an account, but maybe just player if they haven't
//  signed up yet
export class Player extends CoMap {
  name = co.string;
  email = co.string;
  short = co.string;
  handicap? = co.ref(Handicap);
  // meta
  envs? = co.ref(ListOfEnvironments);
  level? = co.string;
}

export class Handicap extends CoMap {
  source = co.literal('ghin', 'manual');
  identifier = co.string; // TODO: optional (for manual handicaps)?
  // TODO: get index, revDate, gender from GHIN API
  // index = co.string;
  // revDate = co.Date;
  // gender = co.literal('M', 'F');
}

export class ListOfPlayers extends CoList.Of(co.ref(Player)) {}

export class ListOfEnvironments extends CoList.Of(co.string) {}
