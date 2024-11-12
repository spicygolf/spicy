import { brad, jp, efro, landers, sedgie, kb } from "./players";
import { scores } from "./rounds";

// Big Game data modeling tests
//  maybe this can morph into test fixtures later

// game
const game = {
  name: "The Big Game",
  start: new Date(),
};

// gamespecs
const stableford = {
  name: "Modified Stableford",
  version: 1,
  status: "prod",
  type: "points",
  min_players: 2,
  location_type: "local",
  teams: false,
};
const skins = {
  name: "Skins",
  version: 1,
  status: "prod",
  type: "skins",
  min_players: 2,
  location_type: "local",
  teams: false,
};
const gamespecs = [stableford, skins];

const game_holes = [
  { name: "1", number: 1, seq: 1 },
  { name: "2", number: 2, seq: 2 },
  { name: "3", number: 3, seq: 3 },
  { name: "4", number: 4, seq: 4 },
  { name: "5", number: 5, seq: 5 },
  { name: "6", number: 6, seq: 6 },
  { name: "7", number: 7, seq: 7 },
  { name: "8", number: 8, seq: 8 },
  { name: "9", number: 9, seq: 9 },
  { name: "10", number: 10, seq: 10 },
  { name: "11", number: 11, seq: 11 },
  { name: "12", number: 12, seq: 12 },
  { name: "13", number: 13, seq: 13 },
  { name: "14", number: 14, seq: 14 },
  { name: "15", number: 15, seq: 15 },
  { name: "16", number: 16, seq: 16 },
  { name: "17", number: 17, seq: 17 },
  { name: "18", number: 18, seq: 18 },
];

const players = [brad, jp, efro, landers, sedgie, kb];

export default { game, gamespecs, game_holes, players, scores };
