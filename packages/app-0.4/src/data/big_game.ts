import { getUTCNowISO } from "spicylib/utils";
import type { Game, GameSpec } from 'spicylib/types';

import { brad, jp, efro, landers, sedgie, kb } from './players';
import { round, rounds_gross } from './rounds';

// Big Game data modeling tests
//  maybe this can morph into test fixtures later

// game
const game: Game = {
  _type: 'game',
  name: 'The Big Game',
  start: getUTCNowISO(),
};

// gamespecs
const stableford: GameSpec = {
  _type: 'gamespec',
  name: 'modified_stableford',
  version: 1,
  status: 'prod',
  type: 'points',
  min_players: 2,
  location_type: 'local',
  teams: false,
};
const skins: GameSpec = {
  _type: 'gamespec',
  name: 'skins',
  version: 1,
  status: 'prod',
  type: 'skins',
  min_players: 2,
  location_type: 'local',
  teams: false,
};
const gamespecs = [stableford, skins];

const game_holes = [
  { _type: 'gamehole', name: '1',number: 1, seq: 1, },
  { _type: 'gamehole', name: '2',number: 2, seq: 2, },
  { _type: 'gamehole', name: '3',number: 3, seq: 3, },
  { _type: 'gamehole', name: '4',number: 4, seq: 4, },
  { _type: 'gamehole', name: '5',number: 5, seq: 5, },
  { _type: 'gamehole', name: '6',number: 6, seq: 6, },
  { _type: 'gamehole', name: '7',number: 7, seq: 7, },
  { _type: 'gamehole', name: '8',number: 8, seq: 8, },
  { _type: 'gamehole', name: '9',number: 9, seq: 9, },
  { _type: 'gamehole', name: '10',number: 10, seq: 10, },
  { _type: 'gamehole', name: '11',number: 11, seq: 11, },
  { _type: 'gamehole', name: '12',number: 12, seq: 12, },
  { _type: 'gamehole', name: '13',number: 13, seq: 13, },
  { _type: 'gamehole', name: '14',number: 14, seq: 14, },
  { _type: 'gamehole', name: '15',number: 15, seq: 15, },
  { _type: 'gamehole', name: '16',number: 16, seq: 16, },
  { _type: 'gamehole', name: '17',number: 17, seq: 17, },
  { _type: 'gamehole', name: '18',number: 18, seq: 18, },
];

const players = [brad, jp, efro, landers, sedgie, kb];

export {
  game,
  gamespecs,
  game_holes,
  players,
  round,
  rounds_gross,
};
