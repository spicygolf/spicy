import { Player } from '../models/player';

export const PlayerTypeDefs = `
type Player {
  _key: String!
  email: String
  name: String!
  short: String
  statusAuthz: [String]
  level: String
  handicap: Handicap
  createdBy: String
  createdDate: String
  token: String
}

type Handicap {
  source: String
  id: String
  firstName: String
  lastName: String
  playerName: String
  gender: String
  active: Boolean
  index: String
  revDate: String
  clubs: [Club]
}

type PlayerKey {
  _key: String!
}

input PlayerKeyInput {
  _key: String!
}

input HandicapInput {
  source: String
  id: String
  firstName: String
  lastName: String
  playerName: String
  gender: String
  active: Boolean
  index: String
  revDate: String
}


input PlayerInput {
  _key: String
  email: String
  name: String
  short: String
  statusAuthz: [String]
  level: String
  handicap: HandicapInput
  createdBy: String
  createdDate: String
}

input Search {
  first_name: String
  last_name: String
  state: String
  country: String
  status: String
}

type SearchPlayer {
  id: String
  firstName: String
  lastName: String
  playerName: String
  gender: String
  active: Boolean
  index: String
  revDate: String
  clubs: [Club]
}

`;

export const PlayerQuerySigs = `
  getPlayer(_key: String!): Player
  searchPlayer(q: Search!, p: Pagination!): [SearchPlayer]
  activeGamesForPlayer(pkey: String!): [Game]
  gameSpecsForPlayer(pkey: String!): [GameSpecWithCount]
  getFavoritePlayersForPlayer(pkey: String!): [Player]
  getPlayersFollowers(pkey: String!): [Player]
  lookupPlayerByGhin(ghin: String!): [PlayerKey]
`;

export const PlayerMutationSigs = `
  addPlayer(player: PlayerInput!): PlayerKey
  mergePlayers(source: PlayerKeyInput!, target: HandicapInput!): Player
  updatePlayer(player: PlayerInput!): Player
  removePlayerFromGame(pkey: String!, gkey: String!, rkey: String!): Response
`;

export const PlayerResolvers = {
  Query: {
    getPlayer: async (root, { _key }) => {
      const p = new Player();
      return await p.getPlayer(_key);
    },
    searchPlayer: async (_, { q, p }, context) => {
      let pl = new Player();
      const ret = await pl.searchPlayer({q, p});
      // console.log('players', ret?.players);
      return ret?.players || [];
    },
    activeGamesForPlayer: async (_, { pkey }) => {
      const p = new Player();
      await p.load(pkey);
      return p.games();
    },
    gameSpecsForPlayer: async (_, { pkey }) => {
      const p = new Player();
      await p.load(pkey);
      return p.gamespecs();
    },
    getFavoritePlayersForPlayer: async (_, { pkey }) => {
      const p = new Player();
      return p.getFavoritePlayersForPlayer(pkey);
    },
    getPlayersFollowers: async (_, { pkey }) => {
      const p = new Player();
      return p.getPlayersFollowers(pkey);
    },
    lookupPlayerByGhin: async (_, { ghin }) => {
      const p = new Player();
      return p.lookupPlayerByGhin(ghin);
    },
  },
  Player: {
    // clubs: async (player) => {
    //   const p = new Player();
    //   return p.getClubs(player._id);
    // },
    handicap: async (player) => {
      if( player?.handicap?.id ) {
        const p = new Player();
        return p.getHandicap(player.handicap);
      } else {
        return {};
      }
    },
  },
  Mutation: {
    addPlayer: (_, { player }) => {
      // TODO: add to immutable message log?
      const p = new Player();
      p.set(player);
      return p.save();
    },
    updatePlayer: async (_, { player }) => {
      const p = new Player();
      const newPlayer = {
        _id: `players/${player._key}`,
        ...player,
      };
      //console.log('newPlayer', newPlayer);
      await p.load(player._key);
      const res = await p.update(newPlayer, {
        overwrite: true,
        returnNew: true,
      });
      return res.new;
    },
    mergePlayers: (_, { source, target }) => {
      const p = new Player();
      return p.merge({ source, target });
    },
    removePlayerFromGame: (_, args) => {
      const p = new Player();
      return p.removePlayerFromGame(args)
    },
  },
};
