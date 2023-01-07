import { Tee } from '../models/tee';

export const TeeTypeDefs = `
type Tee {
  tee_id: Int
  tee_name: String
  gender: String
  holes_number: Int
  total_yardage: Int
  total_meters: Int
  total_par: Int
  ratings: [Rating]
  holes: [Hole]
}

type Rating {
  rating_type: String
  course_rating: Float
  slope_rating: Float
  bogey_rating: Float
}

type Hole {
  number: Int
  hole_id: Int
  length: Int
  par: Int
  allocation: Int
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
  // Tee: {
  //   course: (tee) => {
  //     const t = new Tee();
  //     return t.getCourse(tee._key);
  //   }
  // },
};
