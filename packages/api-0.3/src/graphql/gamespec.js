import { GameSpec } from "../models/gamespec";

export const GameSpecTypeDefs = `
type HoleScoringSpec {
  name: String
  disp: String
  seq: Int
  type: String
  points: Int
  source: String
  scope: String
  calculation: String
  logic: String
  better: String
  based_on: String
}

type MultiHoleScoringSpec {
  name: String
  disp: String
}

type ScoringSpec {
  hole: [HoleScoringSpec]
  front: [MultiHoleScoringSpec]
  back: [MultiHoleScoringSpec]
  total: [MultiHoleScoringSpec]
}

type GameSpec {
  _key: String!
  name: String!
  disp: String!
  version: Int!
  status: String!
  type: String
  short_description: String
  long_description: String
  better: String
  max_players: Int
  min_players: Int
  location_type: String
  teams: Boolean
  individual: Boolean
  team_size: Int
  team_determination: String
  wolf_disp: String
  team_change_every: Int
  scoring: ScoringSpec
  options: [OptionSpec]
  junk: [OptionSpec]
  multipliers: [OptionSpec]
}

type GameSpecKey {
  _key: String!
}

type GameSpecWithCount {
  gamespec: GameSpec
  player_count: Int
}

input GameSpecInput {
  name: String!
  type: String
}
`;

export const GameSpecQuerySigs = `
  getGameSpec(_key: String!): GameSpec
  findGameSpec(name: String!): GameSpec
  searchGameSpec(q: String!): [GameSpec]
`;

export const GameSpecMutationSigs = `

`;

export const GameSpecResolvers = {
  Query: {
    getGameSpec: (_, { _key }) => {
      var gs = new GameSpec();
      return gs.load(_key);
    },
    findGameSpec: (_, { name }) => {
      var gs = new GameSpec();
      return gs
        .find(name)
        .then((res) => (res?.[0] ? res[0] : null))
        .catch((_err) => null);
    },
    searchGameSpec: async (_, { q }) => {
      var gs = new GameSpec();
      const cursor = await gs.search(q);
      return cursor.all();
    },
  },
  Mutation: {},
  GameSpec: {
    // Commented out custom resolver - just return options array from document
    // options: async (gamespec) => {
    //   const gs = new GameSpec();
    //   return gs.getOptions(gamespec._id);
    // },
  },
};
