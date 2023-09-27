import { Game } from '../models/game';

// const GAME_UPDATED = 'GAME_UPDATED';

export const GameTypeDefs = `
type Game {
  _key: String!
  name: String!
  start: String
  end: String
  scope: GameScope
  holes: [GameHole]
  rounds: [Round]
  players: [Player]
  gamespecs: [GameSpec]
  options: [Option]
  deleteGameInfo: DeleteGameInfo
}

type GameScope {
  holes: String
  teams_rotate: String
  wolf_order: [String]
}

type GameHole {
  hole: String!
  teams: [Team]
  multipliers: [Multiplier]
}

type Multiplier {
  name: String!
  team: String!,
  first_hole: String
  value: Float
}

type Team {
  team: String
  players: [String]
  junk: [GameJunk]
}

type GameJunk {
  name: String
  player: String
  value: String
}

type OptionValue {
  value: String
  holes: [String]
}

type Option {
  name: String
  values: [OptionValue]
}

type DeleteGameInfo {
  rounds: [DeleteInfo]
  players: [DeleteInfo]
  gamespecs: [DeleteInfo]
}

type DeleteInfo {
  vertex: String!
  edge: String!
  other: [String]
}

input GameInput {
  name: String!
  start: String
  end: String
  scope: GameScopeInput
  holes: [GameHoleInput]
  options: [OptionInput]
}

input GameScopeInput {
  holes: String
  teams_rotate: String
  wolf_order: [String]
}

input GameHoleInput {
  hole: String!
  teams: [TeamInput]
  multipliers: [MultiplierInput]
}

input TeamInput {
  team: String
  players: [String]
  junk: [JunkInput]
}

input JunkInput {
  name: String
  player: String
  value: String
}

input MultiplierInput {
  name: String!
  team: String!,
  first_hole: String
  value: Float
}

input OptionValueInput {
  value: String
  holes: [String]
}

input OptionInput {
  name: String
  values: [OptionValueInput]
}
`;

export const GameQuerySigs = `
  statForPlayerFeed(begDate: String!, endDate: String!, stat: String!, currentPlayer: String!, myClubs: [String]!): Int
  gamesForPlayerFeed(begDate: String!, endDate: String!, stat: String!, currentPlayer: String!, myClubs: [String]!): [Game]
  getGame(_key: String!): Game
  getDeleteGameInfo(_key: String!): Game
  findGame(name: String!): Game
  searchGame(q: String!): [Game]
`;

export const GameMutationSigs = `
  addGame(game: GameInput!): Game
  updateGame(gkey: String!, game: GameInput!): Game
  updateGameHoles(gkey: String!, holes: [GameHoleInput]!): Game
  updateGameScope(gkey: String!, scope: GameScopeInput!): Game
  deleteGame(gkey: String!): Game
`;

export const GameSubscriptionSigs = `
  gameUpdated(gkey: String!): Game
`;

export const GameResolvers = {
  Query: {
    statForPlayerFeed: (_, args) => {
      const g = new Game();
      return g
        .statForPlayerFeed(args)
        .then((res) => (res && res[0] ? res[0] : 0))
        .catch((e) => {
          console.log(
            'statForPlayerFeed query error',
            e.response.body.errorMessage,
          );
          return 0;
        });
    },
    gamesForPlayerFeed: async (_, args) => {
      const g = new Game();
      return g.gamesForPlayerFeed(args);
    },
    getGame: (_, { _key }) => {
      const g = new Game();
      return g.query(_key);
    },
    getDeleteGameInfo: (_, { _key }) => {
      const g = new Game();
      return g.query(_key);
    },
    findGame: (_, { name }) => {
      const g = new Game();
      return g
        .find(name)
        .then((res) => (res && res[0] ? res[0] : null))
        .catch((err) => null);
    },
    searchGame: async (_, { q }) => {
      const g = new Game();
      const cursor = await g.search(q);
      return cursor.all();
    },
  },
  Mutation: {
    addGame: async (_, { game }) => {
      // TODO: add to immutable message log?
      const g = new Game();
      g.set(game);
      const newGame = await g.save({
        returnNew: true,
      });
      //console.log('addGame game', newGame);
      return newGame.new;
    },
    updateGame: async (_root, args, _context) => {
      const { gkey, game } = args;
      const g = new Game();
      return g.updateGame(gkey, game);
    },
    updateGameHoles: async (_root, args, _context) => {
      const { gkey, holes } = args;
      //console.log('updateGameHoles input', gkey, holes);
      const g = new Game();
      return g.updateGameHoles(gkey, holes);
    },
    updateGameScope: async (_root, args, _context) => {
      const { gkey, scope } = args;
      //console.log('updateGameScope input', gkey, scope);
      const g = new Game();
      return g.updateGameScope(gkey, scope);
    },
    deleteGame: (_, { gkey }) => {
      const g = new Game();
      return g.remove(gkey);
    },
  },
  // Subscription: {
  //   gameUpdated: {
  //     subscribe: withFilter(
  //       () => {
  //         //console.log('gameUpdated subscribe', pubsub);
  //         return pubsub.asyncIterator([GAME_UPDATED]);
  //       },
  //       (payload, variables) => {
  //         return payload.gameUpdated._key === variables.gkey;
  //       },
  //     ),
  //   },
  // },
  Game: {
    deleteGameInfo: (game) => {
      const g = new Game();
      return g.getDeleteGameInfo(game._id);
    },
  },
};
