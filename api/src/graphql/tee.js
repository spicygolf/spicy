import { Tee } from '../models/tee';

export const TeeTypeDefs = `
type Tee {
  _key: String!
  name: String
  gender: String
  tee_id: Int
  HolesNumber: Int
  TotalYardage: Int
  TotalMeters: Int
  Ratings: [Rating]
  holes: [Hole]
  course: Course
  assigned: String
}

type TeeKey {
  _key: String!
}

type Rating {
  RatingType: String
  CourseRating: Float
  SlopeRating: Float
  BogeyRating: Float
}

type Hole {
  hole: String
  length: String
  par: String
  handicap: String
  pace: String
  seq: String
}
`;

export const TeeQuerySigs = `
  getTeeForGame(gkey: String!): Tee
  getFavoriteTeesForPlayer(pkey: String!, gametime: String): [Tee]
`;

export const TeeMutationSigs = `
`;

export const TeeResolvers = {
  Query: {
    getTeeForGame: async (_, { gkey }) => {
      const t = new Tee();
      return t.getTeeForGame(gkey);
    },
    getFavoriteTeesForPlayer: async (_, { pkey, gametime }) => {
      const t = new Tee();
      return t.getFavoriteTeesForPlayer(pkey, gametime);
    },
  },
  Mutation: {
  },
  Tee: {
    course: (tee) => {
      const t = new Tee();
      return t.getCourse(tee._key);
    }
  },
};
