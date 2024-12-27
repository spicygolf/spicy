import { co, CoList, CoMap } from 'jazz-tools';

export class GameSpec extends CoMap {
  name = co.string;
  short = co.string;
  version = co.number;
  status = co.literal('prod', 'dev', 'test');
  type = co.literal('points', 'skins');
  min_players = co.number;
  location_type = co.literal('local', 'virtual');
  teams = co.boolean;

  /**
   *  A gamespec may have a list of sub-specs that are used in one single game.
   *  ex: The Big Game is Stableford & Skins.
   *
   *  TODO: should this extend GameSpec in some way?
   */
  specs = co.optional.ref(ListOfGameSpecs);
}

export class ListOfGameSpecs extends CoList.Of(co.ref(GameSpec)) {}

export const defaultSpec = {
  name: 'Five Points',
  short: `Team game with low ball, low team, and prox. 5 points per hole, presses, birdies`,
  version: 1,
  status: co.literal('prod'),
  type: co.literal('points'),
  min_players: 2,
  location_type: co.literal('local'),
  teams: true,
};
